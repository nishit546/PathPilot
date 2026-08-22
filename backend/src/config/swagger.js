const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PathPilot REST API',
    version: '1.0.0',
    description: 'Complete Backend API for PathPilot - Multi-City Travel Planning & Itinerary Platform',
    contact: {
      name: 'PathPilot Engineering',
      email: 'dev@pathpilot.com'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'Primary API Gateway'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token generated during registration or login'
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Data fetched successfully' },
          data: { type: 'array', items: { type: 'object' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              totalItems: { type: 'integer', example: 45 },
              totalPages: { type: 'integer', example: 5 },
              hasNextPage: { type: 'boolean', example: true },
              hasPreviousPage: { type: 'boolean', example: false }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email address format' }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check and diagnostic status',
        tags: ['System'],
        responses: {
          200: { description: 'Service is healthy' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', example: 'Alex' },
                  lastName: { type: 'string', example: 'Rider' },
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  phone: { type: 'string', example: '+1-555-0199' },
                  city: { type: 'string', example: 'London' },
                  country: { type: 'string', example: 'United Kingdom' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User registered' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'traveler@pathpilot.com' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/users/profile': {
      get: {
        summary: 'Get current user profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' }
        }
      },
      put: {
        summary: 'Update current user profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profile updated' }
        }
      }
    },
    '/trips': {
      get: {
        summary: 'List user trips with pagination, sorting, search, and status filter',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['UPCOMING', 'ONGOING', 'COMPLETED'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['startDate', 'endDate', 'name', 'createdAt', 'totalBudget'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
        ],
        responses: {
          200: { description: 'Paginated user trips' }
        }
      },
      post: {
        summary: 'Create a new trip',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Trip created' }
        }
      }
    },
    '/cities': {
      get: {
        summary: 'Search & filter destinations with pagination',
        tags: ['Discovery - Cities'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'region', in: 'query', schema: { type: 'string' } },
          { name: 'minPopularity', in: 'query', schema: { type: 'integer' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'popularity', 'costIndex'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
        ],
        responses: {
          200: { description: 'Paginated cities list' }
        }
      }
    },
    '/activities': {
      get: {
        summary: 'Search activities by category, budget ceiling, and city',
        tags: ['Discovery - Activities'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'cityId', in: 'query', schema: { type: 'integer' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minCost', in: 'query', schema: { type: 'number' } },
          { name: 'maxCost', in: 'query', schema: { type: 'number' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Paginated activities' }
        }
      }
    },
    '/community/posts': {
      get: {
        summary: 'Public travel feed with pagination and search',
        tags: ['Community'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'integer' } },
          { name: 'tripId', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Paginated community feed' }
        }
      }
    },
    '/admin/analytics': {
      get: {
        summary: 'System analytics and platform travel statistics',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'System analytics' },
          403: { description: 'Admin privilege required' }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
