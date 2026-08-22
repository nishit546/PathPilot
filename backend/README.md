# ✈️ PathPilot Backend

> **Every Journey Needs a Pilot.**

PathPilot is a personalized multi-city travel planning platform backend built with Node.js, Express, JWT authentication, and structured repository architecture.

Refer to the main [API_CONTRACT.md](docs/API_CONTRACT.md) for full REST API specifications, query parameters, payload contracts, and error handling.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Run automated 32-point test suite
npm test

# 4. Run development server (with nodemon auto-reload)
npm run dev

# 5. Run production server
npm start
```

## 📡 Essential Endpoints

- **Gateway Catalog**: `GET /api`
- **Health Check**: `GET /api/health`
- **Interactive Swagger Docs**: `GET /api/docs`

## 📦 Pre-Seeded Credentials for Development

- **Admin Account**: `admin@pathpilot.com` / `AdminPassword123!`
- **Traveler Account**: `traveler@pathpilot.com` / `Password123!`
