require('dotenv').config();
const app = require('./app');

const db = require('./config/database');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 PathPilot Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);

  const dbHealth = await db.testConnection();
  if (dbHealth.connected) {
    console.log(`🐘 PostgreSQL connected successfully: ${dbHealth.database} (${dbHealth.time})`);
  } else {
    console.warn(`⚠️ PostgreSQL connection warning: ${dbHealth.error}`);
  }
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await db.pool.end();
      console.log('PostgreSQL pool closed.');
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
