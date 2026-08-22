const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function dumpDetails() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const tables = [
    'profiles',
    'trips',
    'cities',
    'trip_sections',
    'days',
    'activities',
    'day_activities',
    'budget_items',
    'community_posts',
    'shared_trips'
  ];

  for (const table of tables) {
    const cols = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);

    console.log(`\n================ TABLE: ${table} ================`);
    cols.rows.forEach(c => {
      console.log(`${c.column_name}: ${c.udt_name} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
    });

    const sample = await client.query(`SELECT * FROM "${table}" LIMIT 1;`);
    console.log(`SAMPLE ROW:`, JSON.stringify(sample.rows[0], null, 2));
  }

  await client.end();
}

dumpDetails();
