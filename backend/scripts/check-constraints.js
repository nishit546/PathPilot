require('dotenv').config();
const db = require('../src/config/database');

async function checkColumns() {
  try {
    const r = await db.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'day_activities' AND table_schema = 'public'
       ORDER BY ordinal_position;`
    );
    console.log('day_activities columns:', JSON.stringify(r.rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkColumns();
