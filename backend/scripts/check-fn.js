const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function checkFunction() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const fnRes = await client.query(`
    SELECT pg_get_functiondef(oid)
    FROM pg_proc
    WHERE proname = 'handle_new_user';
  `);
  console.log('FUNCTION handle_new_user:');
  console.log(fnRes.rows[0]?.pg_get_functiondef);

  await client.end();
}

checkFunction();
