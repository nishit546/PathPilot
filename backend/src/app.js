const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middleware/rateLimiter');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const activityRoutes = require('./routes/activityRoutes');
const cityRoutes = require('./routes/cityRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const communityRoutes = require('./routes/communityRoutes');
const sharedRoutes = require('./routes/sharedRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration with environment safety
app.use(cors({
  origin: config.clientUrl || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development request logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Interactive Swagger UI API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PathPilot API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0'
    }
  });
});

// API Overview Endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to PathPilot REST API Gateway - Every Journey Needs a Pilot.',
    data: {
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/api/health',
      modules: [
        'auth',
        'users',
        'trips',
        'sections',
        'days',
        'cities',
        'activities',
        'expenses',
        'budget',
        'calendar',
        'community',
        'shared',
        'admin'
      ]
    }
  });
});

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PathPilot API Server',
    docs: '/api/docs',
    health: '/api/health'
  });
});

// General API Rate Limiting for all application endpoints
app.use('/api', apiLimiter);

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api/admin', adminRoutes);

// Direct modular routes
app.use('/api', itineraryRoutes);
app.use('/api', activityRoutes);
app.use('/api', expenseRoutes);
app.use('/api', budgetRoutes);

// 404 Handler for undefined routes
app.use(notFoundMiddleware);

// Centralized Error Handler
app.use(errorMiddleware);

module.exports = app;
