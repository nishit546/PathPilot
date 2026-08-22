const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function checkAuthTriggers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const triggers = await client.query(`
    SELECT event_object_schema, event_object_table, trigger_name, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema IN ('auth', 'public');
  `);
  console.log('ALL TRIGGERS IN AUTH AND PUBLIC SCHEMAS:');
  triggers.rows.forEach(t => console.log(`  ${t.event_object_schema}.${t.event_object_table} -> ${t.trigger_name}: ${t.action_statement}`));

  await client.end();
}

checkAuthTriggers();
