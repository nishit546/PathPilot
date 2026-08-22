const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function inspectProfiles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const cols = await client.query(`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    ORDER BY ordinal_position;
  `);

  console.log('=== PROFILES COLUMNS ===');
  cols.rows.forEach(c => {
    console.log(`${c.column_name}: ${c.udt_name} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
  });

  const sample = await client.query(`SELECT * FROM "profiles" LIMIT 2;`);
  console.log('SAMPLE PROFILES:', JSON.stringify(sample.rows, null, 2));

  await client.end();
}

inspectProfiles();
