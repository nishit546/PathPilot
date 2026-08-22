const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function inspectDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.error('ERROR: No database URI found in environment variables (checked DATABASE_URL, DIRECT_URL, POSTGRES_URL)');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database using URI variable...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('SUCCESS: Connected to PostgreSQL database!\n');

    // 1. Inspect all user tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('=== TABLES IN PUBLIC SCHEMA ===');
    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(JSON.stringify(tableNames, null, 2));

    // 2. Inspect columns, types, nullability for each table
    console.log('\n=== TABLE COLUMNS & DATA TYPES ===');
    for (const table of tableNames) {
      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      console.log(`\nTable: ${table}`);
      colsRes.rows.forEach(c => {
        console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable}, default: ${c.column_default})`);
      });
    }

    // 3. Inspect primary keys
    console.log('\n=== PRIMARY KEYS ===');
    const pkRes = await client.query(`
      SELECT tc.table_name, c.column_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage c ON c.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `);
    pkRes.rows.forEach(pk => {
      console.log(`  ${pk.table_name}.${pk.column_name} (${pk.constraint_name})`);
    });

    // 4. Inspect foreign keys
    console.log('\n=== FOREIGN KEYS ===');
    const fkRes = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `);
    fkRes.rows.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (ON DELETE ${fk.delete_rule})`);
    });

    // 5. Inspect row counts
    console.log('\n=== TABLE ROW COUNTS ===');
    for (const table of tableNames) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${countRes.rows[0].count} rows`);
    }

    await client.end();
    console.log('\nInspection complete.');
  } catch (err) {
    console.error('Database connection / inspection failed:', err.message);
    process.exit(1);
  }
}

inspectDb();
