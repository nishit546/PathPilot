# PathPilot Backend API ⚙️

> **The high-performance REST API and business logic engine for PathPilot.** Built with Node.js, Express.js, PostgreSQL (pg-pool), and Supabase Auth.

---

## 📑 Table of Contents

- [Architecture & Design Pattern](#-architecture--design-pattern)
- [Module Structure](#-module-structure)
- [Database Schema & Views](#-database-schema--views)
- [Security & Authentication](#-security--authentication)
- [Environment Variables](#-environment-variables)
- [Setup & Running Locally](#-setup--running-locally)
- [API Route Map](#-api-route-map)
- [Testing & Validation](#-testing--validation)

---

## 🏗️ Architecture & Design Pattern

The PathPilot backend strictly adheres to the **Layered Architectural Pattern**:

```
[ HTTP Request ]
       │
       ▼
[ Routes & Validation Middleware ]   (Express Router & Joi / custom schemas)
       │
       ▼
[ Controllers ]                       (Request unmarshaling, response formatting)
       │
       ▼
[ Services ]                          (Domain logic, access control, debt splits)
       │
       ▼
[ Repositories ]                      (Raw SQL queries, entity mapping, pg-pool)
       │
       ▼
[ PostgreSQL / Supabase Database ]    (Tables, views, foreign keys, triggers)
```

---

## 📁 Module Structure

```
backend/src/
├── config/                # Database pool connection & environment setup
│   └── database.js        # pg.Pool with SSL support and graceful shutdown
├── controllers/           # HTTP handlers
│   ├── adminController.js
│   ├── authController.js
│   ├── budgetController.js
│   ├── cityController.js
│   ├── expenseController.js
│   ├── groupExpenseController.js
│   ├── itineraryController.js
│   ├── routeController.js
│   ├── tripController.js
│   └── tripPreparationController.js
├── middleware/            # Interceptors
│   ├── authMiddleware.js        # JWT verification & user context injection
│   ├── errorHandler.js          # Centralized error handler & status mapping
│   ├── rateLimitMiddleware.js   # Request throttling
│   ├── roleMiddleware.js        # RBAC role enforcement (ADMIN vs USER)
│   └── validationMiddleware.js  # Schema payload validation
├── repositories/          # Data access layer (SQL)
│   ├── cityRepository.js
│   ├── expenseRepository.js
│   ├── groupExpenseRepository.js
│   ├── settlementRepository.js
│   ├── tripCollaboratorRepository.js
│   ├── tripRepository.js
│   └── userRepository.js
├── routes/                # Route definitions
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── cityRoutes.js
│   ├── expenseRoutes.js
│   ├── tripRoutes.js
│   └── index.js
├── services/              # Domain logic
│   ├── budgetService.js
│   ├── debtSettlementService.js  # Minimum transaction graph engine
│   ├── tripAccessService.js      # Permissions (OWNER, EDITOR, VIEWER, ADMIN)
│   ├── tripHealthService.js      # Itinerary conflict & budget pacing checks
│   └── tripService.js
└── utils/                 # Helpers
    ├── ApiError.js        # Standardized API error abstraction
    ├── asyncHandler.js    # Async try-catch wrapper
    ├── dbHelper.js        # Snake_case to camelCase entity mappers
    └── response.js        # Unified JSON response builders
```

---

## 🗄️ Database Schema & Views

- **`v_trip_budget_summary`**: Real-time aggregated budget calculation:
  ```sql
  SELECT trip_id, overall_budget, total_spent, remaining_budget, is_over_budget FROM v_trip_budget_summary;
  ```
- **`v_section_budget_summary`**: Destination-level allocated vs. actual spend.
- **`v_day_budget_summary`**: Daily cost rollups per itinerary section.
- **`public.trips`**: Core trip table with start/end dates, privacy status, and owner reference.
- **`public.trip_sections`**: Sequential destination stops (e.g. Stop 1: Paris, Stop 2: Rome).
- **`public.day_activities`**: Scheduled items linked to specific itinerary days and times.
- **`public.group_expenses` & `public.expense_splits`**: Group financial ledger.

---

## 🔐 Security & Authentication

- **JWT Authentication**: Secured with `SUPABASE_JWT_SECRET` or custom signing key.
- **Role-Based Access Control (RBAC)**: Enforced via `roleMiddleware(['ADMIN'])` for administrative endpoints.
- **Trip Access Control**: `tripAccessService.requirePermission()` ensures users only access their own or collaboratively shared journeys, with global bypass for platform administrators.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
CORS_ORIGIN=http://localhost:5173
```

---

## ⚡ Setup & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (with auto-restart)
npm run dev

# 3. Or start production server
npm start
```
*The server will start on `http://localhost:5000`.*

---

## 📡 API Route Map

| Prefix | Router | Key Operations |
|---|---|---|
| `/api/auth` | `authRoutes.js` | Login, Register, Profile, Session refresh |
| `/api/trips` | `tripRoutes.js` | Full CRUD, Sections, Activities, Expenses, Budget |
| `/api/cities` | `cityRoutes.js` | City search, Popular destinations, Region filter |
| `/api/activities` | `activityRoutes.js` | Activity discovery, category filters |
| `/api/admin` | `adminRoutes.js` | Analytics charts, user block/unblock, system health |

---

## 🧪 Testing & Validation

Run the end-to-end API verification suite:

```bash
node test-api.js
```
