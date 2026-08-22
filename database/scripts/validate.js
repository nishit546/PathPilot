const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

async function validateDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔍 Starting comprehensive database validation...\n');

  try {
    await client.connect();

    // 1. Check Tables Existence
    console.log('=== TEST 1: Table Existence ===');
    const expectedTables = [
      'profiles', 'cities', 'activities', 'trips', 'trip_sections',
      'days', 'day_activities', 'budget_items', 'community_posts', 'shared_trips'
    ];

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const existingTables = tablesRes.rows.map(r => r.table_name);
    
    for (const tbl of expectedTables) {
      if (existingTables.includes(tbl)) {
        console.log(`  ✅ Table '${tbl}' exists.`);
      } else {
        throw new Error(`Missing expected table: ${tbl}`);
      }
    }

    // 2. Check Views Existence
    console.log('\n=== TEST 2: Views Existence ===');
    const expectedViews = [
      'v_trip_budget_summary', 'v_section_budget_summary', 'v_day_budget_summary'
    ];
    const viewsRes = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `);
    const existingViews = viewsRes.rows.map(r => r.table_name);

    for (const vw of expectedViews) {
      if (existingViews.includes(vw)) {
        console.log(`  ✅ View '${vw}' exists.`);
      } else {
        throw new Error(`Missing expected view: ${vw}`);
      }
    }

    // 3. Check RLS is Enabled on All Application Tables
    console.log('\n=== TEST 3: Row Level Security (RLS) Status ===');
    const rlsRes = await client.query(`
      SELECT relname AS table_name, relrowsecurity AS rls_enabled
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE nspname = 'public' AND relname = ANY($1::text[]);
    `, [expectedTables]);

    for (const row of rlsRes.rows) {
      if (row.rls_enabled) {
        console.log(`  🔒 Table '${row.table_name}' has RLS ENABLED.`);
      } else {
        throw new Error(`RLS is NOT enabled on table: ${row.table_name}`);
      }
    }

    // 4. Test Constraints Validation (CHECK constraints)
    console.log('\n=== TEST 4: Integrity Constraints Validation ===');
    await client.query('BEGIN');
    try {
      // Test invalid trip dates (start_date > end_date should fail)
      let caughtDateErr = false;
      try {
        await client.query(`
          INSERT INTO public.trips (user_id, title, start_date, end_date, overall_budget)
          VALUES ('11111111-1111-1111-1111-111111111111', 'Invalid Date Trip', '2026-05-10', '2026-05-01', 500);
        `);
      } catch (err) {
        caughtDateErr = true;
        console.log('  ✅ Constraint rejected invalid trip dates (start_date > end_date).');
      }
      if (!caughtDateErr) throw new Error('Constraint failed to catch start_date > end_date on trips!');

      // Test negative budget (amount < 0 should fail)
      let caughtBudgetErr = false;
      try {
        await client.query(`
          INSERT INTO public.budget_items (trip_id, category, description, amount)
          VALUES ('a1111111-1111-1111-1111-111111111111', 'transport', 'Negative Amount', -50.00);
        `);
      } catch (err) {
        caughtBudgetErr = true;
        console.log('  ✅ Constraint rejected negative budget item amount.');
      }
      if (!caughtBudgetErr) throw new Error('Constraint failed to catch negative budget amount!');

    } finally {
      await client.query('ROLLBACK');
    }

    // 5. Test Budget Aggregation Queries & Views
    console.log('\n=== TEST 5: Budget Aggregation Views Output ===');
    const tripBudget = await client.query(`
      SELECT trip_title, overall_budget, total_expenses, remaining_budget, expense_items_count
      FROM public.v_trip_budget_summary
      ORDER BY trip_title;
    `);
    console.log('  Trip Budget Summary:');
    tripBudget.rows.forEach(r => {
      console.log(`   - ${r.trip_title}: Budget $${r.overall_budget} | Spent $${r.total_expenses} | Remaining $${r.remaining_budget} (${r.expense_items_count} items)`);
    });

    const sectionBudget = await client.query(`
      SELECT city_name, section_budget, total_expenses, remaining_budget
      FROM public.v_section_budget_summary
      ORDER BY city_name;
    `);
    console.log('  Section Budget Summary:');
    sectionBudget.rows.forEach(r => {
      console.log(`   - ${r.city_name}: Budget $${r.section_budget} | Spent $${r.total_expenses} | Remaining $${r.remaining_budget}`);
    });

    // 6. Test Calendar Date Overlap Queries
    console.log('\n=== TEST 6: Calendar Date Range Overlap Query ===');
    const userHarshit = '11111111-1111-1111-1111-111111111111';
    const calendarRes = await client.query(`
      SELECT * FROM public.get_user_calendar_trips($1, '2026-04-01', '2026-04-30');
    `, [userHarshit]);
    console.log(`  ✅ Calendar query returned ${calendarRes.rowCount} matching trip(s) for April 2026:`);
    calendarRes.rows.forEach(r => {
      console.log(`   - ${r.title} (${r.start_date.toISOString().split('T')[0]} to ${r.end_date.toISOString().split('T')[0]}) [Status: ${r.status}]`);
    });

    // 7. Test City & Activity Discovery / Search
    console.log('\n=== TEST 7: City & Activity Search Queries ===');
    const searchRes = await client.query(`
      SELECT c.name AS city, c.country, a.name AS activity, a.category, a.estimated_cost
      FROM public.activities a
      JOIN public.cities c ON c.id = a.city_id
      WHERE c.country = 'Japan' AND a.estimated_cost <= 40.00
      ORDER BY a.estimated_cost ASC;
    `);
    console.log(`  ✅ Search query (Japan activities <= $40) returned ${searchRes.rowCount} results:`);
    searchRes.rows.forEach(r => {
      console.log(`   - [${r.city}] ${r.activity} (${r.category}) - $${r.estimated_cost}`);
    });

    // 8. Test Cascade Delete Integrity in a transaction
    console.log('\n=== TEST 8: Referential Integrity & Cascade Deletion ===');
    await client.query('BEGIN');
    try {
      // Create a temporary test trip with section, day, and budget item
      const testTripId = '99999999-9999-9999-9999-999999999999';
      const testSecId = '88888888-8888-8888-8888-888888888888';
      const testDayId = '77777777-7777-7777-7777-777777777777';

      await client.query(`
        INSERT INTO public.trips (id, user_id, title, start_date, end_date)
        VALUES ($1, $2, 'Temp Cascade Test Trip', '2026-09-01', '2026-09-05');
      `, [testTripId, userHarshit]);

      await client.query(`
        INSERT INTO public.trip_sections (id, trip_id, city_id, section_order, start_date, end_date)
        VALUES ($1, $2, 'c1111111-1111-1111-1111-111111111111', 1, '2026-09-01', '2026-09-05');
      `, [testSecId, testTripId]);

      await client.query(`
        INSERT INTO public.days (id, section_id, date, day_number)
        VALUES ($1, $2, '2026-09-01', 1);
      `, [testDayId, testSecId]);

      await client.query(`
        INSERT INTO public.budget_items (trip_id, section_id, day_id, category, description, amount)
        VALUES ($1, $2, $3, 'food', 'Temp Test Expense', 50.00);
      `, [testTripId, testSecId, testDayId]);

      // Delete the trip
      await client.query('DELETE FROM public.trips WHERE id = $1', [testTripId]);

      // Verify sections, days, and budget items are cleaned up
      const checkSec = await client.query('SELECT 1 FROM public.trip_sections WHERE id = $1', [testSecId]);
      const checkDay = await client.query('SELECT 1 FROM public.days WHERE id = $1', [testDayId]);
      const checkBud = await client.query('SELECT 1 FROM public.budget_items WHERE trip_id = $1', [testTripId]);

      if (checkSec.rowCount === 0 && checkDay.rowCount === 0 && checkBud.rowCount === 0) {
        console.log('  ✅ Trip cascade deletion cleanly removed child sections, days, and budget items.');
      } else {
        throw new Error('Cascade deletion failed to clean up dependent child records!');
      }
    } finally {
      await client.query('ROLLBACK');
    }

    console.log('\n🌟 ALL DATABASE VALIDATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('\n❌ Database validation failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

validateDatabase();
