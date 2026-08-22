# 🛠️ PathPilot Backend Development & Architecture Guide

Welcome to the development guide for the **PathPilot REST API**.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation
Navigate to `PathPilot/backend`:
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

JWT_SECRET=your_jwt_secret_key_change_in_production_min32chars
JWT_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX_REQUESTS=50
```

### 4. Running the Server

#### Development Mode (with nodemon hot-reloading):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Server will be running at:
- **Base URL**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`
- **Interactive Swagger Docs**: `http://localhost:5000/api/docs`

---

## 🧪 Running Automated Tests

Run the complete 50-point end-to-end integration test suite anytime:
```bash
npm test
```

The test suite validates:
- Multi-user authentication & token security
- Profile updates & privilege escalation protection
- Multi-city trip creation & automatic day generation
- Day activity conflict detection & cost fallbacks
- Categorized expenses & deep budget calculations
- Calendar date-range queries
- Public tokenized trip sharing & privacy sanitization
- Community publishing & multi-user authorization barriers
- Admin metrics, account blocking, and self-block guards
- Cascading deletions with zero orphaned records
- Route not-found and malformed request handlers

---

## 💾 Mock / In-Memory Data Store Lifecycle

- The backend currently utilizes an **in-memory repository layer** (`src/repositories/mockDatabase.js`).
- **Data Lifecycle**: Any entities created or modified during the session persist while the server runs and reset to initial seed state upon restarting the process.
- **Pre-Seeded Data**:
  - **Cities**: Delhi, Mumbai, Manali, Tokyo, Paris, Rome, etc.
  - **Master Activities**: Taj Mahal, Gateway of India, Solang Valley, Eiffel Tower, Louvre Museum, Colosseum, etc.
  - **Pre-Seeded Development Accounts**:
    - **Administrator**: `admin@pathpilot.com` / `AdminPassword123!`
    - **Traveler**: `traveler@pathpilot.com` / `Password123!`

---

## 🏛️ Architecture & Future PostgreSQL Integration

The backend is built strictly following the **Controller $\to$ Service $\to$ Repository** pattern:
```
Routes  -->  Middleware  -->  Controllers  -->  Services  -->  Repositories  -->  Data Store
```

When integrating PostgreSQL later:
1. Replace query methods inside `src/repositories/*.js` with ORM / database queries.
2. The controllers, services, routes, middleware, and frontend API contracts remain **100% unchanged**.
