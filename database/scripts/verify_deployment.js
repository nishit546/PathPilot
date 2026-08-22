const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verifyDeployment() {
  console.log('🔍 Validating Supabase PostgreSQL Database Deployment Workflow...\n');

  // 1. Check environment variables
  console.log('=== 1. Environment Variables ===');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in database/.env');
  }
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`  ✅ DATABASE_URL loaded correctly: ${maskedUrl}`);
  console.log(`  ✅ PGSSLMODE: ${process.env.PGSSLMODE || 'require (default)'}`);

  // 2. Connect to Supabase
  console.log('\n=== 2. Supabase Connection ===');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const dbVersion = await client.query('SELECT version();');
  console.log(`  ✅ Successfully connected to Supabase PostgreSQL.`);
  console.log(`  ℹ️  PostgreSQL Version: ${dbVersion.rows[0].version.split(' on ')[0]}`);

  // 3 & 4. Migration execution and ordering
  console.log('\n=== 3 & 4. Migration Execution & Order ===');
  const migRes = await client.query(`
    SELECT id, filename, executed_at 
    FROM public._schema_migrations 
    ORDER BY id ASC;
  `);

  const expectedOrder = [
    '001_initial_schema.sql',
    '002_views_and_functions.sql',
    '003_indexes.sql',
    '004_row_level_security.sql',
    '005_admin_dashboard.sql',
    '006_admin_dashboard_wireframe_views.sql'
  ];

  console.log(`  Found ${migRes.rowCount} recorded migration(s) in _schema_migrations:`);
  migRes.rows.forEach(r => {
    console.log(`   - [ID ${r.id}] ${r.filename} (executed at: ${r.executed_at.toISOString()})`);
  });

  if (migRes.rowCount !== expectedOrder.length) {
    throw new Error(`Expected ${expectedOrder.length} migrations, but found ${migRes.rowCount}`);
  }

  for (let i = 0; i < expectedOrder.length; i++) {
    if (migRes.rows[i].filename !== expectedOrder[i]) {
      throw new Error(`Migration out of order at index ${i}: expected ${expectedOrder[i]}, found ${migRes.rows[i].filename}`);
    }
  }
  console.log('  ✅ Migrations executed in exact sequential order (001 -> ... -> 006) with zero errors.');

  // 5. Check All Expected Tables
  console.log('\n=== 5. Table Verification ===');
  const expectedTables = [
    'profiles', 'cities', 'activities', 'trips', 'trip_sections',
    'days', 'day_activities', 'budget_items', 'community_posts', 'shared_trips'
  ];

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  const actualTables = tablesRes.rows.map(r => r.table_name);

  expectedTables.forEach(tbl => {
    if (actualTables.includes(tbl)) {
      console.log(`  ✅ Table '${tbl}' exists.`);
    } else {
      throw new Error(`Missing expected table: ${tbl}`);
    }
  });

  // 6. Check Views and Functions
  console.log('\n=== 6. Views and Functions Verification ===');
  const expectedViews = [
    'v_trip_budget_summary',
    'v_section_budget_summary',
    'v_day_budget_summary',
    'v_admin_platform_overview',
    'v_admin_manage_users',
    'v_admin_user_trips_detail',
    'v_admin_popular_cities',
    'v_admin_popular_activities',
    'v_admin_analytics_trip_status',
    'v_admin_analytics_category_breakdown',
    'v_admin_analytics_monthly_trends',
    'v_admin_analytics_spending_by_country'
  ];
  const viewsRes = await client.query(`
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  const actualViews = viewsRes.rows.map(r => r.table_name);
  expectedViews.forEach(vw => {
    if (actualViews.includes(vw)) {
      console.log(`  ✅ View '${vw}' exists.`);
    } else {
      throw new Error(`Missing view: ${vw}`);
    }
  });

  const funcsRes = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION' 
      AND routine_name IN ('get_user_calendar_trips', 'handle_new_user', 'update_updated_at_column', 'is_admin');
  `);
  const actualFuncs = funcsRes.rows.map(r => r.routine_name);
  ['get_user_calendar_trips', 'handle_new_user', 'update_updated_at_column', 'is_admin'].forEach(fn => {
    if (actualFuncs.includes(fn)) {
      console.log(`  ✅ Function '${fn}()' exists.`);
    } else {
      throw new Error(`Missing function: ${fn}`);
    }
  });

  // 7. Check Indexes
  console.log('\n=== 7. Indexes Verification ===');
  const idxRes = await client.query(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = ANY($1::text[])
    ORDER BY tablename, indexname;
  `, [expectedTables]);

  console.log(`  Found ${idxRes.rowCount} total index(es) on application tables:`);
  const criticalIndexes = [
    'idx_profiles_email',
    'idx_cities_name_country',
    'idx_activities_city_category_cost',
    'idx_trips_user_status',
    'idx_trips_start_end_date',
    'idx_trip_sections_trip_order',
    'idx_days_section_day_num',
    'idx_day_activities_day_order',
    'idx_budget_items_trip_id',
    'idx_community_posts_created_at',
    'idx_shared_trips_token'
  ];

  const actualIndexes = idxRes.rows.map(r => r.indexname);
  criticalIndexes.forEach(idx => {
    if (actualIndexes.includes(idx)) {
      console.log(`  ✅ Index '${idx}' exists.`);
    } else {
      throw new Error(`Missing expected index: ${idx}`);
    }
  });

  // 8. Check RLS Policies
  console.log('\n=== 8. Row Level Security (RLS) Policies Verification ===');
  const polRes = await client.query(`
    SELECT tablename, policyname, cmd, permissive 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = ANY($1::text[])
    ORDER BY tablename, policyname;
  `, [expectedTables]);

  console.log(`  Found ${polRes.rowCount} active RLS security policies across tables:`);
  polRes.rows.forEach(r => {
    console.log(`   - [${r.tablename}] ${r.policyname} (${r.cmd})`);
  });

  if (polRes.rowCount < 10) {
    throw new Error('Insufficient RLS policies configured!');
  }

  console.log('\n✨ ALL 8 DEPLOYMENT WORKFLOW VALIDATION CHECKS PASSED WITH 100% SUCCESS!');
  await client.end();
}

verifyDeployment().catch(err => {
  console.error('\n❌ Deployment workflow validation failed:', err);
  process.exit(1);
});
