# 🚀 PathPilot Frontend Integration Guide

Welcome to the frontend integration guide for the **PathPilot REST API**. This document provides everything frontend developers need to connect React, Next.js, Vue, or mobile applications with the PathPilot backend.

---

## 🌐 1. Base URL & Gateway Conventions

- **Base URL**: `http://localhost:5000/api`
- **Interactive Swagger Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `GET http://localhost:5000/api/health`
- **Content-Type**: `application/json`

### 🔑 Authentication Header
Protected endpoints require the JWT token to be passed in the `Authorization` header using the `Bearer` scheme:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 📦 2. Standardized Response Format

Every API response follows one of three predictable structures:

### A. Single Entity / Mutation Response
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip": { ... }
  }
}
```

### B. Paginated Collection Response
```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### C. Error Response (with field-level validation errors)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "startDate",
      "message": "startDate cannot be after endDate"
    }
  ]
}
```

---

## 🔐 3. Authentication & State Flow

```
+---------------+      POST /api/auth/register      +----------------+
| Register Form | --------------------------------> | Backend Auth   |
+---------------+                                   +----------------+
                                                           |
+---------------+        POST /api/auth/login              | Returns JWT
|  Login Form   | -------------------------------->        | & User Object
+---------------+                                          v
        |                                           +----------------+
        +-----------------------------------------> | Local/Session  |
                                                    | Storage (JWT)  |
                                                    +----------------+
                                                           |
+---------------------+     GET /api/trips                 | Authorization:
| Dashboard / Screens | ---------------------------------> | Bearer <token>
+---------------------+                                    v
```

### Recommended Axios Interceptor Setup
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Bearer token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pathpilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pathpilot_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
```

---

## 📚 4. Complete Frontend API Matrix

### 🔐 Auth Module
- `POST /api/auth/register`:
  - Body: `{ firstName, lastName, email, password, city, country, profilePhoto }`
  - Returns: `{ user, token }`
- `POST /api/auth/login`:
  - Body: `{ email, password }`
  - Returns: `{ user, token }`
- `GET /api/auth/me`:
  - Auth: `Bearer`
  - Returns: `{ user }`
- `POST /api/auth/logout`:
  - Auth: `Bearer`
  - Client action: Discard stored token.

### 👤 Profile Module
- `GET /api/users/profile`: Current profile.
- `PUT /api/users/profile`: Update firstName, lastName, phone, city, country, bio, avatar.
- `GET /api/users/profile/trips`: Returns categorized `{ totalTrips, upcoming: [], ongoing: [], completed: [] }`.

### ✈️ Trips Module
- `GET /api/trips`:
  - Query: `?page=1&limit=10&status=UPCOMING&search=europe&sortBy=startDate&order=asc`
  - Returns: Paginated user trips.
- `POST /api/trips`:
  - Body: `{ name, description, coverPhoto, startDate, endDate, totalBudget, visibility }`
  - Returns: Created trip with computed `status` (`UPCOMING`, `ONGOING`, `COMPLETED`).
- `GET /api/trips/:id`:
  - Returns: Rich trip details including `sections`, `days`, `dayActivities`, `expenses`, `budget`, and `shared` info.
- `PUT /api/trips/:id`: Update trip info.
- `DELETE /api/trips/:id`: Deletes trip (cascades child sections, days, activities, expenses, and shares).

### 🗺️ Itinerary Sections & Auto-Days
- `GET /api/trips/:tripId/sections`: List destination stops for a trip.
- `POST /api/trips/:tripId/sections`:
  - Body: `{ cityId, startDate, endDate, budget, order }`
  - Automatically creates sequential `Day` records for each date in range.
- `PUT /api/sections/:id`: Update section dates (automatically synchronizes `Day` records without losing activities on retained dates).
- `DELETE /api/sections/:id`: Remove section and child days.
- `PUT /api/trips/:tripId/sections/reorder`:
  - Body: `{ sectionIds: [2, 1, 3] }`

### 🎯 Day Activities & Conflict Engine
- `GET /api/days/:dayId/activities`: List scheduled activities on day.
- `POST /api/days/:dayId/activities`:
  - Body: `{ activityId, startTime: "10:00", endTime: "12:30", customCost: 5000, notes: "..." }`
  - Conflict Check: If overlapping slot exists, returns `409 Conflict`.
- `PUT /api/day-activities/:id`: Update activity schedule/cost.
- `DELETE /api/day-activities/:id`: Remove activity from day.
- `PUT /api/days/:dayId/activities/reorder`:
  - Body: `{ activityIds: [3, 1] }`

### 🏙️ Cities & Master Activities Catalog
- `GET /api/cities`:
  - Query: `?search=paris&country=France&minPopularity=80&page=1&limit=10`
- `GET /api/cities/:id`: City details with pre-populated activities catalog.
- `GET /api/activities`:
  - Query: `?category=ADVENTURE&minCost=1000&maxCost=5000&cityId=1&page=1&limit=10`
- `GET /api/activities/:id`: Activity details.

### 💰 Expenses & Unified Budget Engine
- `GET /api/trips/:tripId/expenses`: List expenses (`?category=STAY&sectionId=1`).
- `POST /api/trips/:tripId/expenses`:
  - Body: `{ category: "STAY", amount: 25000, description: "Hotel", date: "2026-11-01", sectionId, dayId }`
- `GET /api/trips/:tripId/budget`:
  - Unified Single Source of Truth:
    ```json
    {
      "totalBudget": 120000,
      "totalSpent": 38500,
      "manualExpenses": 38500,
      "activityEstimatedCost": 12500,
      "estimatedTotalTripCost": 51000,
      "remainingBudget": 81500,
      "percentageUsed": 32.08,
      "categoryBreakdown": { "TRANSPORT": 0, "STAY": 30000, "FOOD": 8500, "ACTIVITY": 0, "OTHER": 0 },
      "sectionBreakdown": [ ... ],
      "dayBreakdown": [ ... ]
    }
    ```

### 📅 Calendar Module
- `GET /api/calendar?month=11&year=2026`:
  - Returns date-mapped timeline of trips intersecting November 2026.

### 🔗 Public Sharing Module
- `POST /api/trips/:tripId/share`: Generates public `shareToken` and `shareUrl`.
- `GET /api/shared/:shareToken`: Unauthenticated read-only endpoint (author's email, phone, and password stripped).
- `DELETE /api/trips/:tripId/share`: Revokes link (subsequent requests return `404 Not Found`).

### 🌐 Community Module
- `GET /api/community/posts?page=1&limit=10&search=tips`: Public community feed.
- `POST /api/community/posts`: Create post (optional `tripId` link).
- `PUT /api/community/posts/:id`: Edit own post.
- `DELETE /api/community/posts/:id`: Delete own post (or Admin).

### 🛡️ Admin Module (Requires `role: 'ADMIN'`)
- `GET /api/admin/users?page=1&limit=10&search=alex&isBlocked=false`: User listing.
- `PATCH /api/admin/users/:id/block`: Block user.
- `PATCH /api/admin/users/:id/unblock`: Unblock user.
- `GET /api/admin/analytics`: Platform overview (`totalUsers`, `activeUsers`, `blockedUsers`, `totalTrips`, `tripsByStatus`, `tripsByMonth`, `popularCities`, `popularActivities`).

### 🧠 Smart Recommendation & Optimization Engine
- `POST /api/trips/recommend`:
  - Body: `{ startDate, endDate, budget, interests: ["ADVENTURE", "FOOD"], preferredCountries: ["India"], maxCities: 3 }`
  - Returns: Structured multi-city trip suggestions with scored cities, curated activities, and budget feasibility breakdown.
- `POST /api/trips/optimize-budget`:
  - Body: `{ budget: 50000, cities: [1, 2], activities: [1, 4], durationDays: 7 }`
  - Returns: Recommended category allocation (`transport`, `stay`, `food`, `activities`, `other`), remaining budget, daily budget, and over-budget activity removal suggestions.
- `POST /api/trips/suggest-itinerary` (Auth required):
  - Body: `{ tripId: 1 }`
  - Returns: Actionable itinerary analysis detecting `EMPTY_DAY`, `OVERLOADED_DAY`, `OVER_BUDGET`, and `MISSING_CATEGORY` with recommended candidate activities.
- `GET /api/users/preferences` (Auth required):
  - Returns: Saved travel preferences `{ interests, preferredCountries, budgetLevel }`.
- `PUT /api/users/preferences` (Auth required):
  - Body: `{ interests: ["ADVENTURE", "FOOD"], preferredCountries: ["India", "Japan"], budgetLevel: "MEDIUM" }`
- `GET /api/recommendations/personalized` (Auth required):
  - Returns: Tailored destination and activity recommendations generated from user preferences and previous travel history.

### 👥 Trip Collaboration & Activity Log Module
- `POST /api/trips/:tripId/collaborators` (Owner only):
  - Body: `{ userId: 4, role: "EDITOR" }` (`EDITOR` or `VIEWER`).
- `GET /api/trips/:tripId/collaborators` (Owner, Editor, Viewer):
  - Returns list of collaborators with safe user profiles and roles.
- `PATCH /api/trips/:tripId/collaborators/:userId` (Owner only):
  - Body: `{ role: "VIEWER" }`.
- `DELETE /api/trips/:tripId/collaborators/:userId`:
  - Owner can remove any collaborator; collaborators can remove themselves / leave trip.
- `GET /api/trips/shared-with-me` (Auth required):
  - Returns paginated trips where the authenticated user is a collaborator (`EDITOR` or `VIEWER`).
  - Supports query filters: `?page=1&limit=10&status=UPCOMING&search=alpine&sortBy=startDate&order=asc`.
- `GET /api/trips/:tripId/activity-log` (Owner, Editor, Viewer):
  - Returns chronological audit log of all itinerary, expense, and collaboration actions.

### 🔔 Notifications & Trip Health Module
- `GET /api/notifications` (Auth required):
  - Query: `?page=1&limit=10&type=BUDGET_WARNING&isRead=false&sortBy=createdAt&order=desc`.
  - Returns user's notifications.
- `GET /api/notifications/unread-count` (Auth required):
  - Returns `{ unreadCount: N }` for fast badge rendering.
- `PATCH /api/notifications/:id/read` (Auth required):
  - Marks individual notification as read.
- `PATCH /api/notifications/read-all` (Auth required):
  - Marks all user notifications as read.
- `DELETE /api/notifications/:id` (Auth required):
  - Deletes individual notification.
- `DELETE /api/notifications` (Auth required):
  - Clears all user notifications.
- `GET /api/trips/:tripId/health` (Owner, Editor, Viewer):
  - Analyzes itinerary days, budget ratio, and activity balance.
  - Returns `{ score, status, issues: [], suggestions: [] }`.

### 📋 Trip Templates & Cloning Module
- `POST /api/trips/:tripId/template` (Owner only):
  - Body: `{ name, description, isPublic, category, coverPhoto }`
  - Converts trip into reusable template.
- `GET /api/templates` (Public / Optional Auth):
  - Query: `?search=&category=&sortBy=popularity&order=desc&page=1&limit=10`
- `GET /api/templates/my` (Auth required):
  - Returns user's created templates.
- `GET /api/templates/:id` (Public or Creator):
  - Returns full template details and increments viewCount.
- `POST /api/templates/:id/use` (Auth required):
  - Body: `{ tripName, startDate, endDate, budget, visibility }`
  - Clones template into independent trip and returns `{ trip, warnings }`.
- `POST /api/trips/:tripId/duplicate` (Owner only):
  - Body: `{ name, startDate, endDate, totalBudget }`
  - Clones existing trip and all child sections/days/activities.
- `POST /api/shared/:shareToken/copy` (Auth required):
  - Clones public shared trip into user's private account.
- `POST /api/templates/:id/favorite` (Auth required):
  - Favorites template.
- `DELETE /api/templates/:id/favorite` (Auth required):
  - Removes template from favorites.
- `GET /api/templates/favorites` (Auth required):
  - Returns user's favorited templates.
- `PATCH /api/templates/:id` (Owner only):
  - Updates template details.
- `DELETE /api/templates/:id` (Owner only):
  - Deletes template.

### 💸 Group Expense Splitting & Settlement Module
- `POST /api/trips/:tripId/shared-expenses` (Owner or Editor):
  - Body: `{ title, amount, category, paidBy, splitType, participants, splits }` (supports `EQUAL`, `EXACT`, `PERCENTAGE`).
- `GET /api/trips/:tripId/shared-expenses` (Owner, Editor, Viewer):
  - Query: `?page=1&limit=10&category=STAY&paidBy=2&sortBy=createdAt&order=desc`
- `PATCH /api/trips/:tripId/shared-expenses/:expenseId` (Owner or Editor):
  - Updates expense and recalculates splits.
- `DELETE /api/trips/:tripId/shared-expenses/:expenseId` (Owner or Editor):
  - Deletes shared expense.
- `GET /api/trips/:tripId/balances` (Owner, Editor, Viewer):
  - Returns member `totalPaid`, `totalOwed`, and `netBalance`.
- `GET /api/trips/:tripId/settlements` (Owner, Editor, Viewer):
  - Returns minimal optimized debt settlement transactions.
- `GET /api/trips/:tripId/settlements/history` (Owner, Editor, Viewer):
  - Returns completed settlements history.
- `PATCH /api/trips/:tripId/settlements/:settlementId/complete` (Debtor, Creditor, or Owner):
  - Marks settlement as COMPLETED and updates balances.
- `GET /api/trips/:tripId/my-expense-summary` (Owner, Editor, Viewer):
  - Returns personalized user balance, pending payments, and pending receivables.

### 🎒 Smart Packing & Travel Preparation Module
- `GET /api/trips/:tripId/packing-list` (Owner, Editor, Viewer):
  - Query: `?category=CLOTHING&isPacked=false&isEssential=true`
  - Returns categorized items and summary completion progress.
- `POST /api/trips/:tripId/packing-list/items` (Owner, Editor):
  - Body: `{ name, category, quantity, isEssential }`
- `PATCH /api/trips/:tripId/packing-list/items/:itemId` (Owner, Editor):
  - Updates packing item status or metadata.
- `DELETE /api/trips/:tripId/packing-list/items/:itemId` (Owner, Editor):
  - Deletes packing item.
- `PATCH /api/trips/:tripId/packing-list/bulk` (Owner, Editor):
  - Body: `{ items: [{ itemId, isPacked }] }`
  - Bulk updates packed status and returns updated progress.
- `GET /api/trips/:tripId/packing-suggestions` (Owner, Editor, Viewer):
  - Returns duration- and activity-based intelligent packing suggestions.
- `POST /api/trips/:tripId/packing-suggestions/:suggestionId/add` (Owner, Editor):
  - Converts packing suggestion into an active checklist item.
- `GET /api/trips/:tripId/travel-documents` (Owner, Editor, Viewer):
  - Returns travel document requirements and readiness checklist.
- `POST /api/trips/:tripId/travel-documents` (Owner, Editor):
  - Body: `{ name, type, isRequired, isReady, expiryDate, notes }`
- `PATCH /api/trips/:tripId/travel-documents/:documentId` (Owner, Editor):
  - Updates travel document status.
- `DELETE /api/trips/:tripId/travel-documents/:documentId` (Owner, Editor):
  - Deletes travel document.
- `GET /api/trips/:tripId/preparation-tasks` (Owner, Editor, Viewer):
  - Returns pre-trip preparation tasks.
- `POST /api/trips/:tripId/preparation-tasks` (Owner, Editor):
  - Body: `{ title, description, priority, dueDate, isCompleted }`
- `PATCH /api/trips/:tripId/preparation-tasks/:taskId` (Owner, Editor):
  - Updates task completion.
- `DELETE /api/trips/:tripId/preparation-tasks/:taskId` (Owner, Editor):
  - Deletes task.
- `GET /api/trips/:tripId/readiness` (Owner, Editor, Viewer):
  - Returns multi-factor readiness score (Packing 40%, Docs 30%, Tasks 20%, Itinerary 10%), readiness status (`READY`, `ALMOST_READY`, `NEEDS_PREPARATION`, `NOT_READY`), and missing items.

### 📈 Trip Insights & Analytics Module
- `GET /api/analytics/dashboard` (Auth required):
  - Returns personal travel dashboard statistics (total trips, upcoming, ongoing, completed, cities visited, total spent, average duration, average cost, favorite category, most visited city).
- `GET /api/analytics/spending` (Auth required):
  - Query: `?tripId=&startDate=&endDate=&groupBy=CATEGORY` (`DAY`, `MONTH`, `CATEGORY`, `TRIP`, `CITY`).
  - Returns chart-ready spending breakdown, total spent, daily average, and highest expense.
- `GET /api/analytics/activities` (Auth required):
  - Returns activity category distribution, average cost, most expensive activity, and favorite type.
- `GET /api/analytics/cities` (Auth required):
  - Returns most visited and planned cities, most expensive destination, and average cost per city.
- `GET /api/analytics/travel-timeline` (Auth required):
  - Query: `?year=2027&groupBy=MONTH`
  - Returns 12-month histogram array of `{ month, trips, daysTravelled, estimatedSpent }`.
- `GET /api/analytics/compare` (Auth required):
  - Query: `?tripIds=1,2,3` (Max 5 trips)
  - Returns side-by-side comparison of duration, budget, estimated/actual costs, cost per day, cities, activities, health score, and readiness score.
- `GET /api/analytics/insights` (Auth required):
  - Returns smart behavioral observations (`SPENDING_PATTERN`, `ACTIVITY_PATTERN`, `CITY_PATTERN`, `TRAVEL_PATTERN`, `TREND`).
- `GET /api/analytics/achievements` (Auth required):
  - Returns dynamically calculated badges (`FIRST_TRIP`, `WORLD_EXPLORER`, `CITY_HOPPER`, `ADVENTURE_SEEKER`, `BUDGET_MASTER`, `SOCIAL_TRAVELER`, `EARLY_PLANNER`, `PACKING_PRO`) and completion progress.
### 🔍 Global Search & Advanced Filtering Module
- `GET /api/search` (Optional Auth):
  - Query: `?q=&type=ALL&page=1&limit=20&sortBy=&order=DESC` (`ALL`, `TRIPS`, `CITIES`, `ACTIVITIES`, `TEMPLATES`, `COMMUNITY`).
  - Returns unified multi-resource results object and summary tallies.
- `GET /api/trips/search` (Auth required):
  - Query: `?q=&status=UPCOMING&startDate=&endDate=&minBudget=&maxBudget=&city=&sortBy=CREATED_AT&order=DESC&page=1&limit=20`.
  - Scoped to user's owned and collaborated trips.
- `GET /api/activities/search` (Public):
  - Query: `?q=&category=&city=&minCost=&maxCost=&minDuration=&maxDuration=&sortBy=POPULARITY&order=DESC&page=1&limit=20`.
- `GET /api/cities/search` (Public):
  - Query: `?q=&country=&region=&minCostIndex=&maxCostIndex=&sortBy=POPULARITY&order=DESC&page=1&limit=20`.
- `GET /api/templates/search` (Optional Auth):
  - Query: `?q=&category=&minDuration=&maxDuration=&minCost=&maxCost=&sortBy=POPULARITY&order=DESC&page=1&limit=20`.
- `GET /api/community/search` (Public):
  - Query: `?q=&category=&city=&sortBy=NEWEST&order=DESC&page=1&limit=20`.
- `GET /api/search/suggestions` (Optional Auth):
  - Query: `?q=tok` (min 2 chars).
  - Returns instant autocomplete suggestions (`CITY`, `ACTIVITY`, `TRIP`, `TEMPLATE`).
- `GET /api/search/recent` (Auth required):
  - Returns user's recent search history (max 10).
- `DELETE /api/search/recent` (Auth required):
  - Clears user search history.
- `DELETE /api/search/recent/:searchId` (Auth required):
  - Deletes specific search query record.
### 🗺️ Smart Route Planning & Multi-City Optimization Module
- `GET /api/trips/:tripId/route` (Owner, Editor, Viewer):
  - Returns complete multi-city itinerary route structure, order, dates, duration, and metrics summary.
- `PATCH /api/trips/:tripId/route/reorder` (Owner, Editor):
  - Body: `{ cityOrder: [sectionId1, sectionId2, ...] }`
  - Reorders cities, sequentially recalculates dates, shifts days, and logs activity.
- `POST /api/trips/:tripId/route/optimize` (Owner, Editor, Viewer):
  - Generates recommended optimal city order and calculates estimated distance/time/cost savings.
- `POST /api/trips/:tripId/route/apply-optimization` (Owner, Editor):
  - Body: `{ sectionOrder: [sectionId1, sectionId2, ...] }`
  - Applies optimized city sequence to itinerary.
- `GET /api/trips/:tripId/travel-segments` (Owner, Editor, Viewer):
  - Returns inter-city travel distance, duration, cost, and recommended transport mode (`FLIGHT`, `TRAIN`, `BUS`, `CAR`).
- `GET /api/trips/:tripId/travel-segments/:segmentId/options` (Owner, Editor, Viewer):
  - Returns multi-modal transport comparison with duration, cost, and comfort score.
- `PATCH /api/trips/:tripId/travel-segments/:segmentId` (Owner, Editor):
  - Body: `{ selectedMode: "TRAIN" }`
  - Selects transport option and updates travel segment.
- `POST /api/trips/:tripId/days/:dayId/optimize` (Owner, Editor, Viewer):
  - Analyzes daily activity durations and suggests optimal scheduling without rush.
- `POST /api/trips/:tripId/days/:dayId/apply-optimization` (Owner, Editor):
  - Applies optimized daily activity schedule.
- `GET /api/trips/:tripId/route/conflicts` (Owner, Editor, Viewer):
  - Analyzes timing gaps, overlapping sections, impossible dates, and missing transport.
- `GET /api/trips/:tripId/route/recommendations` (Owner, Editor, Viewer):
  - Returns actionable route swaps, transport savings, and pacing recommendations.
- `GET /api/trips/:tripId/route/score` (Owner, Editor, Viewer):
  - Returns route quality score (0–100) and breakdown (`routeEfficiency`, `travelTime`, `costEfficiency`, `scheduleHealth`).

---

## 🚦 5. Standard HTTP Status Codes

| Code | Status | Meaning |
|---|---|---|
| `200` | OK | Request succeeded (GET, PUT, PATCH, DELETE) |
| `201` | Created | Resource successfully created (POST) |
| `400` | Bad Request | Schema validation failure, invalid IDs or query params |
| `401` | Unauthorized | Missing, expired, or invalid JWT Bearer token |
| `403` | Forbidden | Authenticated, but user lacks permission or account is blocked |
| `404` | Not Found | Resource or route does not exist |
| `409` | Conflict | Duplicate resource (e.g. email) or activity time overlap |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal unhandled server error |









