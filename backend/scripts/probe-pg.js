const { Client } = require('pg');
require('dotenv').config();

async function probe() {
  const passwordsToTry = [
    process.env.DB_PASSWORD,
    'postgres',
    'admin',
    'root',
    'password',
    '1234',
    '123456',
    '12345678',
    'postgre',
    ''
  ].filter(p => p !== undefined);

  for (const pw of passwordsToTry) {
    const client = new Client({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: String(pw),
      database: 'postgres',
      ssl: false,
      connectionTimeoutMillis: 2000
    });

    try {
      await client.connect();
      console.log(`SUCCESS: Connected to PostgreSQL with password: "${pw}"`);
      const res = await client.query('SELECT version();');
      console.log('PostgreSQL Version:', res.rows[0].version);
      await client.end();
      return pw;
    } catch (err) {
      console.log(`Failed password "${pw}": ${err.message}`);
    }
  }
}

probe().then(pw => {
  if (pw !== undefined) {
    console.log(`VALID_PASSWORD=${pw}`);
  } else {
    console.log('NO_WORKING_PASSWORD_FOUND');
  }
  process.exit(0);
});
