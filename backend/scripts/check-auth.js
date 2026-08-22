const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function checkAuth() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const schemas = await client.query(`
    SELECT schema_name FROM information_schema.schemata;
  `);
  console.log('SCHEMAS:', schemas.rows.map(r => r.schema_name));

  try {
    const authCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users';
    `);
    console.log('AUTH.USERS COLUMNS:', authCols.rows.map(r => r.column_name));
    
    const authUsers = await client.query(`SELECT id, email, encrypted_password FROM auth.users LIMIT 2;`);
    console.log('AUTH.USERS SAMPLE:', authUsers.rows);
  } catch (err) {
    console.log('Error querying auth.users:', err.message);
  }

  await client.end();
}

checkAuth();
