const { Pool, types } = require('pg');
require('dotenv').config();

// Return DATE (OID 1082) as raw string YYYY-MM-DD to avoid timezone shifts
types.setTypeParser(1082, (val) => val);

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL;

let poolConfig = {};

if (connectionString) {
  poolConfig = {
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

// Pool capacity and timeouts
poolConfig.max = parseInt(process.env.DB_POOL_MAX || '20', 10);
poolConfig.idleTimeoutMillis = 60000;
poolConfig.connectionTimeoutMillis = 30000;

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute a parameterized query against the connection pool.
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (process.env.DEBUG_SQL === 'true') {
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    console.error('Database query error:', { text, error: err.message });
    throw err;
  }
};

/**
 * Obtain a dedicated client from the pool (for transactions).
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Execute a transaction block with automatic BEGIN, COMMIT, ROLLBACK and release.
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Health probe testing database connectivity.
 */
const testConnection = async () => {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as db_name;');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].db_name
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection
};
