const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

async function runSeeds() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(' Connected to Supabase PostgreSQL database.');

    const seedDir = path.join(__dirname, '..', 'seed');
    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`📁 Found ${files.length} seed files in ${seedDir}`);

    for (const file of files) {
      console.log(`🌱 Executing seed: ${file}...`);
      const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ Applied seed: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Seeding failed in ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\n🎉 All seed data populated successfully!');
  } catch (error) {
    console.error('❌ Seed process encountered an error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeeds();
