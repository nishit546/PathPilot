# ✈️ PathPilot

> **Every Journey Needs a Pilot.**

PathPilot is a modern, personalized, intelligent, and collaborative travel planning platform. It empowers travelers to architect end-to-end multi-city itineraries, organize day-wise schedules, prevent activity timing conflicts, track multi-category budgets, explore destinations, share public travel logs, and engage with a vibrant travel community.

---

## 📑 Table of Contents

- [🌟 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [🗄️ Database Entities & Data Model](#️-database-entities--data-model)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup & Migrations](#database-setup--migrations)
  - [Running the Server](#running-the-server)
- [📡 API Overview](#-api-overview)
  - [Standard Response Structure](#standard-response-structure)
  - [Core Endpoints](#core-endpoints)
- [📐 Key Business Rules & Logic](#-key-business-rules--logic)
- [🗺️ Project Roadmap (12 Phases)](#️-project-roadmap-12-phases)
- [📜 License](#-license)

---

## 🌟 Features

### 1. 🔐 Authentication & Role Management
- Secure user registration and login with **JWT** and **bcrypt** password hashing.
- Profile management with travel statistics (total trips, upcoming, completed).
- Role-based authorization (`USER`, `ADMIN`).
- Automated account blocking checks to deny access to restricted accounts.

### 2. 🗺️ Multi-City Trip Planning
- Create multi-city trips with customizable budgets, descriptions, and cover images.
- **Dynamic Trip Status**: Automatically calculates `UPCOMING`, `ONGOING`, or `COMPLETED` based on real-time dates.
- Filter, search, and sort trips by status, date, or name.

### 3. 🗓️ Itinerary Sections & Automated Day Generation
- Divide trips into sequential sections/stops (e.g., Delhi $\to$ Manali $\to$ Shimla).
- **Auto-Day Generation**: Automatically creates `Day` records for every date in a section range.
- Reorder trip sections with ease.

### 4. ⏰ Day Activities & Conflict Detection
- Attach curated activities to specific days with custom time slots, notes, and costs.
- **Conflict Prevention**: Built-in validation algorithm blocks overlapping activity times ($409\text{ Conflict}$).
- Support for drag-and-drop activity reordering.

### 5. 💰 Smart Budgeting & Expense Tracking
- Unified budget calculation combining actual logged expenses and estimated day activity costs.
- Category breakdowns: `TRANSPORT`, `STAY`, `FOOD`, `ACTIVITY`, `OTHER`.
- Section-wise budget vs. actual spend comparison with zero duplicate counting.

### 6. 🔍 Destination & Activity Discovery
- Searchable cities database with region, country, cost index, and popularity score.
- Searchable activities filtered by city, category, cost bounds, and popularity.

### 7. 📅 Calendar Integration
- View trips mapped across calendar date ranges with month/year query filters.

### 8. 🔗 Public Sharing & Community
- Generate unique share tokens for read-only, public trip sharing (`/api/shared/:shareToken`).
- Community feed with posts, travel experiences, and trip links.

### 9. 🛡️ Admin Dashboard & Analytics
- User management: search, filter, paginate, block, and unblock accounts.
- Platform analytics: active users, top-visited cities, monthly trip trends, and popular activity categories.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Runtime** | [Node.js](https://nodejs.org/) (v18+) | JavaScript runtime engine |
| **Framework** | [Express.js](https://expressjs.com/) (v4.x) | Lightweight and robust HTTP web framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational SQL database |
| **ORM** | [Prisma ORM](https://www.prisma.io/) (v5.x) | Type-safe database client and migration tool |
| **Authentication** | [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Stateless auth and password hashing |
| **Validation** | [Zod](https://zod.dev/) | Schema validation with strict error parsing |
| **Utilities** | [CORS](https://github.com/expressjs/cors), [Morgan](https://github.com/expressjs/morgan), [Dotenv](https://github.com/motdotla/dotenv) | Cross-origin handling, logging, and environment variables |

---

## 🏗️ System Architecture

PathPilot backend follows a clean, modular, layered architecture:

```text
backend/
├── .env.example              # Environment configuration template
├── package.json              # Project metadata & script runner
├── prisma/
│   ├── schema.prisma         # Prisma data models & relations
│   └── seed.js               # Database seed script
└── src/
    ├── app.js                # Express app setup & global middleware
    ├── server.js             # HTTP server entrypoint
    ├── config/
    │   └── db.js             # PrismaClient singleton instance
    ├── controllers/          # HTTP request handlers
    │   ├── activityController.js
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── budgetController.js
    │   ├── calendarController.js
    │   ├── cityController.js
    │   ├── communityController.js
    │   ├── itineraryController.js
    │   ├── tripController.js
    │   └── userController.js
    ├── middleware/           # Security, validation, and error interceptors
    │   ├── adminMiddleware.js
    │   ├── authMiddleware.js
    │   ├── errorMiddleware.js
    │   ├── notFoundMiddleware.js
    │   └── validationMiddleware.js
    ├── routes/               # API route definitions
    │   ├── activityRoutes.js
    │   ├── adminRoutes.js
    │   ├── authRoutes.js
    │   ├── budgetRoutes.js
    │   ├── calendarRoutes.js
    │   ├── cityRoutes.js
    │   ├── communityRoutes.js
    │   ├── itineraryRoutes.js
    │   ├── tripRoutes.js
    │   └── userRoutes.js
    ├── services/             # Business logic layer
    │   ├── analyticsService.js
    │   ├── authService.js
    │   ├── budgetService.js
    │   ├── itineraryService.js
    │   └── tripService.js
    ├── utils/                # Helper utilities & custom errors
    │   ├── ApiError.js
    │   ├── asyncHandler.js
    │   └── generateToken.js
    └── validators/           # Zod validation schemas
        ├── authValidator.js
        ├── itineraryValidator.js
        └── tripValidator.js
```

---

## 🗄️ Database Entities & Data Model

```mermaid
erDiagram
    USER ||--o{ TRIP : creates
    USER ||--o{ COMMUNITY_POST : publishes
    TRIP ||--o{ TRIP_SECTION : contains
    TRIP ||--o{ EXPENSE : incurs
    TRIP ||--o| SHARED_TRIP : shares
    CITY ||--o{ TRIP_SECTION : hosts
    CITY ||--o{ ACTIVITY : offers
    TRIP_SECTION ||--o{ DAY : generates
    DAY ||--o{ DAY_ACTIVITY : schedules
    ACTIVITY ||--o{ DAY_ACTIVITY : references

    USER {
        int id PK
        string email UK
        string password
        string role "USER | ADMIN"
        boolean isBlocked
    }
    TRIP {
        int id PK
        int userId FK
        string name
        date startDate
        date endDate
        decimal totalBudget
        string visibility "PRIVATE | PUBLIC"
    }
    TRIP_SECTION {
        int id PK
        int tripId FK
        int cityId FK
        date startDate
        date endDate
        decimal sectionBudget
        int order
    }
    DAY {
        int id PK
        int tripSectionId FK
        date date
        int dayNumber
    }
    DAY_ACTIVITY {
        int id PK
        int dayId FK
        int activityId FK
        string startTime
        string endTime
        decimal estimatedCost
        int order
    }
    EXPENSE {
        int id PK
        int tripId FK
        string category "TRANSPORT | STAY | FOOD | ACTIVITY | OTHER"
        decimal amount
        date date
    }
    SHARED_TRIP {
        int id PK
        int tripId FK
        string shareToken UK
    }
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) $\ge$ 18.x
- [PostgreSQL](https://www.postgresql.org/) $\ge$ 14.x running locally or on the cloud

### Installation

1. Clone the repository:
   ```bash
   git clone <repo_url>
   cd PathPilot/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Configure your environment settings:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pathpilot_db?schema=public"

# JWT Auth Secret & Expiry
JWT_SECRET="super_secret_jwt_key_change_in_production_123456789!"
JWT_EXPIRES_IN="7d"
```

### Database Setup & Migrations

1. Generate the Prisma Client:
   ```bash
   npm run prisma:generate
   ```

2. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

3. Seed initial data (Cities, Activities, Sample Trips, Users):
   ```bash
   npm run prisma:seed
   ```

4. *(Optional)* Launch Prisma Studio GUI:
   ```bash
   npm run prisma:studio
   ```

### Running the Server

- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm start
  ```

---

## 📡 API Overview

### Standard Response Structure

#### Success Response
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {}
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Core Endpoints

| Group | Method | Endpoint | Description | Auth Required |
|---|---|---|---|:---:|
| **Health** | `GET` | `/api/health` | Service health status check | ❌ |
| **Auth** | `POST` | `/api/auth/register` | Register new user | ❌ |
| | `POST` | `/api/auth/login` | Login user & issue JWT | ❌ |
| | `GET` | `/api/auth/me` | Fetch authenticated user | ✅ |
| | `POST` | `/api/auth/logout` | Invalidate/logout session | ✅ |
| **Trips** | `GET` | `/api/trips` | Get user trips (filters: status, sort, search) | ✅ |
| | `POST` | `/api/trips` | Create new multi-city trip | ✅ |
| | `GET` | `/api/trips/:id` | Get comprehensive trip breakdown | ✅ |
| | `PUT` | `/api/trips/:id` | Update trip metadata | ✅ |
| | `DELETE` | `/api/trips/:id` | Delete trip (cascade deletes sub-entities) | ✅ |
| **Itinerary** | `POST` | `/api/trips/:tripId/sections` | Add trip section & auto-generate days | ✅ |
| | `PUT` | `/api/sections/:id` | Update section & sync days | ✅ |
| | `DELETE` | `/api/sections/:id` | Delete section | ✅ |
| | `PUT` | `/api/trips/:tripId/sections/reorder` | Reorder sections | ✅ |
| **Activities** | `POST` | `/api/days/:dayId/activities` | Schedule day activity (with conflict check) | ✅ |
| | `PUT` | `/api/day-activities/:id` | Modify activity schedule | ✅ |
| | `DELETE` | `/api/day-activities/:id` | Delete scheduled activity | ✅ |
| | `PUT` | `/api/days/:dayId/activities/reorder`| Reorder activities within day | ✅ |
| **Explore** | `GET` | `/api/cities` | Search & filter cities | ❌ |
| | `GET` | `/api/cities/:id` | Get city details | ❌ |
| | `GET` | `/api/cities/:id/activities` | Get activities available in city | ❌ |
| | `GET` | `/api/activities` | Search & filter activities | ❌ |
| **Budget** | `GET` | `/api/trips/:tripId/budget` | Budget analytics & category breakdown | ✅ |
| **Calendar** | `GET` | `/api/calendar` | Get date-mapped trips (`?month=&year=`) | ✅ |
| **Profile** | `GET` | `/api/users/profile` | Get user profile & trip statistics | ✅ |
| | `PUT` | `/api/users/profile` | Update profile information | ✅ |
| **Community** | `GET` | `/api/community/posts` | List travel community posts | ❌ |
| | `POST` | `/api/community/posts` | Create new community post | ✅ |
| | `GET` | `/api/community/posts/:id` | Get single community post | ❌ |
| | `DELETE` | `/api/community/posts/:id` | Delete post (owner or admin) | ✅ |
| **Sharing** | `POST` | `/api/trips/:tripId/share` | Generate public share token | ✅ |
| | `GET` | `/api/shared/:shareToken` | Read-only public trip viewer | ❌ |
| **Admin** | `GET` | `/api/admin/users` | List users (paginated, searchable) | 🛡️ (Admin) |
| | `PATCH` | `/api/admin/users/:id/block` | Block user account | 🛡️ (Admin) |
| | `PATCH` | `/api/admin/users/:id/unblock` | Unblock user account | 🛡️ (Admin) |
| | `GET` | `/api/admin/analytics` | System-wide travel & user analytics | 🛡️ (Admin) |

---

## 📐 Key Business Rules & Logic

1. **Dynamic Trip Status**:
   - `currentDate < startDate` $\to$ **`UPCOMING`**
   - `startDate <= currentDate <= endDate` $\to$ **`ONGOING`**
   - `currentDate > endDate` $\to$ **`COMPLETED`**
2. **Date Integrity**:
   - Trip `startDate` must be $\le$ `endDate`.
   - Section dates must strictly fall within parent Trip dates.
3. **Automated Day Management**:
   - Creating a Section spanning $N$ days automatically provisions $N$ sequential `Day` records (`Day 1`, `Day 2`, ...).
   - Updating section dates synchronizes existing days cleanly without orphan records.
4. **Time Conflict Detection**:
   - Day activities in the same day cannot overlap in start/end time.
   - Any overlap immediately yields an HTTP `409 Conflict` with `"message": "Activity time conflicts with an existing activity."`.
5. **Accurate Budget Engine**:
   - Computes total estimated spent across categorized expenses and scheduled activities without double-counting.
6. **Security & Ownership**:
   - Users can only view, modify, or delete their own trips and data.
   - Blocked users (`isBlocked: true`) are rejected immediately from authentication and protected routes.

---

## 🗺️ Project Roadmap (12 Phases)

- [x] **Phase 1**: Project Initialization & Base Architecture *(Completed)*
- [ ] **Phase 2**: Prisma Schema, Migrations & Database Seeding
- [ ] **Phase 3**: Authentication System & Security Middleware
- [ ] **Phase 4**: Trip CRUD & Dynamic Status Engine
- [ ] **Phase 5**: Itinerary Sections, Day Generator & Activity Conflict Engine
- [ ] **Phase 6**: City & Activity Search & Discovery APIs
- [ ] **Phase 7**: Budgeting & Expense Calculation Engine
- [ ] **Phase 8**: Calendar Mapping API
- [ ] **Phase 9**: Profile API & Trip Statistics
- [ ] **Phase 10**: Community Feed & Read-Only Public Sharing
- [ ] **Phase 11**: Admin Management & System Analytics
- [ ] **Phase 12**: Error Handling, Validation, Security Audit & API Documentation (`API_CONTRACT.md`)

---

## 📜 License

This project is licensed under the ISC License.
