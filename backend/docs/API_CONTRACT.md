# 📘 PathPilot REST API Contract & Specification

Welcome to the **PathPilot REST API** documentation. PathPilot is a multi-city travel planning platform enabling users to curate custom itineraries, schedule activities with time-conflict checks, manage categorized expenses, map trips on calendars, share trips publicly, and interact within a travel community.

---

## 🌐 Base URL, Gateway & Conventions

- **Base URL**: `http://localhost:5000/api`
- **Interactive Swagger Docs**: `http://localhost:5000/api/docs`
- **Default Port**: `5000`
- **Content-Type**: `application/json`

### Authentication Header
Protected endpoints require a JSON Web Token passed in the `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```

### Rate Limiting
- **General API**: 500 requests per 15-minute window per IP.
- **Authentication Endpoints (`/api/auth/*`)**: 50 requests per 15-minute window per IP.

### Security Headers
- Protected with `helmet` HTTP headers and strict origin-bound CORS (`CLIENT_URL`).

---

## 📦 Standard Response Formats

### 1. Single Entity / Mutation Response
```json
{
  "success": true,
  "message": "Resource created / fetched successfully",
  "data": {}
}
```

### 2. Paginated Collection Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Error Response
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

## 🚦 System & Health

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Auth Required**: ❌ None
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "PathPilot backend is running",
  "timestamp": "2026-08-22T05:15:00.000Z",
  "data": {
    "status": "healthy",
    "timestamp": "2026-08-22T05:15:00.000Z",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### 2. API Gateway Catalog Overview
- **Endpoint**: `GET /api`
- **Auth Required**: ❌ None
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Welcome to PathPilot API",
  "version": "1.0.0",
  "data": {
    "version": "1.0.0",
    "documentation": "/api/docs",
    "health": "/api/health",
    "modules": [
      "auth",
      "users",
      "profile",
      "trips",
      "sections",
      "days",
      "cities",
      "activities",
      "expenses",
      "budget",
      "calendar",
      "community",
      "shared",
      "admin",
      "recommendations",
      "notifications",
      "templates",
      "analytics",
      "search",
      "routes"
    ]
  }
}
```

---

## 🔐 Authentication API

### 1. Register User
- **Endpoint**: `POST /api/auth/register`
- **Auth Required**: ❌ None (Rate Limited)
- **Request Body**:
```json
{
  "firstName": "Alex",
  "lastName": "Rider",
  "email": "alex@example.com",
  "password": "Password123!",
  "phone": "+1-555-0199",
  "city": "London",
  "country": "United Kingdom",
  "additionalInfo": "Adventure enthusiast",
  "profilePhoto": "https://example.com/avatar.jpg"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 3,
      "firstName": "Alex",
      "lastName": "Rider",
      "email": "alex@example.com",
      "role": "USER",
      "isBlocked": false,
      "createdAt": "2026-08-22T04:55:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: ❌ None (Rate Limited)
- **Request Body**:
```json
{
  "email": "traveler@pathpilot.com",
  "password": "Password123!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "firstName": "Nishit",
      "lastName": "Traveler",
      "email": "traveler@pathpilot.com",
      "role": "USER",
      "isBlocked": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Authenticated User
- **Endpoint**: `GET /api/auth/me`
- **Auth Required**: ✅ Authenticated User / Admin
- **Response**: `200 OK`

### 4. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth Required**: ✅ Optional
- **Response**: `200 OK`

---

## 👤 User & Profile API

### 1. Get Profile
- **Endpoint**: `GET /api/users/profile`
- **Auth Required**: ✅ Authenticated User

### 2. Update Profile
- **Endpoint**: `PUT /api/users/profile`
- **Auth Required**: ✅ Authenticated User
- **Request Body**:
```json
{
  "firstName": "Nishit",
  "lastName": "Traveler",
  "phone": "+91-9876543210",
  "city": "Mumbai",
  "country": "India",
  "additionalInfo": "Updated bio details",
  "profilePhoto": "https://example.com/new-avatar.jpg"
}
```

### 3. Delete Profile
- **Endpoint**: `DELETE /api/users/profile`
- **Auth Required**: ✅ Authenticated User

### 4. Get Categorized Profile Trips
- **Endpoint**: `GET /api/users/profile/trips`
- **Auth Required**: ✅ Authenticated User
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "User trips retrieved and categorized successfully",
  "data": {
    "totalTrips": 2,
    "upcoming": [
      {
        "id": 1,
        "name": "India Golden Triangle & Himalayan Retreat",
        "startDate": "2026-10-01",
        "endDate": "2026-10-10",
        "status": "UPCOMING"
      }
    ],
    "ongoing": [],
    "completed": []
  }
}
```

---

## ✈️ Trips API

### 1. List User Trips (Paginated)
- **Endpoint**: `GET /api/trips`
- **Auth Required**: ✅ Authenticated User
- **Query Parameters**:
  - `page`: integer (default `1`)
  - `limit`: integer (default `10`, max `50`)
  - `status`: `UPCOMING` | `ONGOING` | `COMPLETED`
  - `search`: string (case-insensitive across `name`, `description`)
  - `sortBy`: `startDate` | `endDate` | `createdAt` | `updatedAt` | `name` | `totalBudget`
  - `order`: `asc` | `desc` (default `desc`)
- **Response**: `200 OK` (Paginated)

### 2. Create Trip
- **Endpoint**: `POST /api/trips`
- **Auth Required**: ✅ Authenticated User
- **Request Body**:
```json
{
  "name": "Japan Autumn Discovery",
  "description": "Tokyo neon, Kyoto temples, and Osaka street food.",
  "coverPhoto": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
  "startDate": "2026-11-01",
  "endDate": "2026-11-10",
  "totalBudget": 120000,
  "visibility": "PRIVATE"
}
```

### 3. Get Trip Details
- **Endpoint**: `GET /api/trips/:id`
- **Auth Required**: ✅ User (if private) / Public (if public)
- **Includes**: Sections, Cities, Days, Scheduled Day Activities, Expenses, Budget & Share status.

### 4. Update Trip
- **Endpoint**: `PUT /api/trips/:id`
- **Auth Required**: ✅ Trip Owner

### 5. Delete Trip
- **Endpoint**: `DELETE /api/trips/:id`
- **Auth Required**: ✅ Trip Owner (cascades all sections, days, activities, expenses)

---

## 🗺️ Itinerary & Section Management

### 1. List Trip Sections
- **Endpoint**: `GET /api/trips/:tripId/sections`
- **Auth Required**: ✅ Trip Owner / Collaborator

### 2. Create Trip Section (Auto-Generates Days)
- **Endpoint**: `POST /api/trips/:tripId/sections`
- **Auth Required**: ✅ Trip Owner
- **Request Body**:
```json
{
  "cityId": 4,
  "startDate": "2026-11-01",
  "endDate": "2026-11-04",
  "budget": 50000,
  "order": 1
}
```
*Note: Automatically generates sequential `Day` records for each date in the range.*

### 3. Update Section (Auto-Synchronizes Days)
- **Endpoint**: `PUT /api/sections/:id`
- **Auth Required**: ✅ Trip Owner

### 4. Delete Section
- **Endpoint**: `DELETE /api/sections/:id`
- **Auth Required**: ✅ Trip Owner

### 5. Reorder Sections
- **Endpoint**: `PUT /api/trips/:tripId/sections/reorder`
- **Auth Required**: ✅ Trip Owner
- **Request Body**:
```json
{
  "sectionIds": [3, 1, 2]
}
```

### 6. Get Section Days
- **Endpoint**: `GET /api/sections/:sectionId/days`
- **Auth Required**: ✅ Trip Owner / Public Viewer

---

## 🎯 Day Activities & Conflict Detection

### 1. List Day Activities
- **Endpoint**: `GET /api/days/:dayId/activities`
- **Auth Required**: ✅ Authenticated User

### 2. Schedule Activity (with Overlap Conflict Prevention)
- **Endpoint**: `POST /api/days/:dayId/activities`
- **Auth Required**: ✅ Trip Owner
- **Request Body**:
```json
{
  "activityId": 10,
  "startTime": "10:00",
  "endTime": "13:00",
  "customCost": 5000,
  "notes": "Bring camera for crossing shot",
  "order": 1
}
```
*If another activity overlaps with `10:00 - 13:00`, returns `409 Conflict`: `"message": "Activity time conflicts with an existing activity."`*

### 3. Update Scheduled Activity
- **Endpoint**: `PUT /api/day-activities/:id`
- **Auth Required**: ✅ Trip Owner

### 4. Remove Scheduled Activity
- **Endpoint**: `DELETE /api/day-activities/:id`
- **Auth Required**: ✅ Trip Owner

### 5. Reorder Day Activities
- **Endpoint**: `PUT /api/days/:dayId/activities/reorder`
- **Auth Required**: ✅ Trip Owner
- **Request Body**:
```json
{
  "activityIds": [2, 1]
}
```

---

## 🏙️ Cities & Discovery API

### 1. Search Cities (Paginated)
- **Endpoint**: `GET /api/cities`
- **Auth Required**: ❌ None
- **Query Parameters**:
  - `page`, `limit`
  - `search`: string (matches city name, country, region)
  - `country`: string
  - `region`: string
  - `minPopularity`: number (e.g. `80`)
  - `sortBy`: `popularity` | `costIndex` | `name` | `country` | `region`
  - `order`: `asc` | `desc`

### 2. Get City Details & Activities
- **Endpoint**: `GET /api/cities/:id`
- **Auth Required**: ❌ None

---

## 🎟️ Master Activities Catalog

### 1. Search Activities (Paginated)
- **Endpoint**: `GET /api/activities`
- **Auth Required**: ❌ None
- **Query Parameters**:
  - `page`, `limit`
  - `cityId`: number
  - `category`: `SIGHTSEEING` | `ADVENTURE` | `FOOD` | `CULTURE` | `SHOPPING` | `ENTERTAINMENT` | `RELAXATION` | `OTHER`
  - `minCost`: number
  - `maxCost`: number
  - `search`: string
  - `sortBy`: `popularity` | `estimatedCost` | `duration` | `name`
  - `order`: `asc` | `desc`

### 2. Get Activity Details
- **Endpoint**: `GET /api/activities/:id`
- **Auth Required**: ❌ None

---

## 💰 Expense & Budget API

### 1. List Trip Expenses
- **Endpoint**: `GET /api/trips/:tripId/expenses`
- **Auth Required**: ✅ Trip Owner
- **Query Parameters**: `category`, `sectionId`, `dayId`

### 2. Log Expense
- **Endpoint**: `POST /api/trips/:tripId/expenses`
- **Auth Required**: ✅ Trip Owner
- **Request Body**:
```json
{
  "category": "STAY",
  "amount": 30000,
  "description": "Tokyo Hotel 4 Nights",
  "date": "2026-11-01",
  "sectionId": 1
}
```

### 3. Update Expense
- **Endpoint**: `PUT /api/expenses/:id`
- **Auth Required**: ✅ Trip Owner

### 4. Delete Expense
- **Endpoint**: `DELETE /api/expenses/:id`
- **Auth Required**: ✅ Trip Owner

### 5. Get Budget Analytics & Category Breakdown
- **Endpoint**: `GET /api/trips/:tripId/budget`
- **Auth Required**: ✅ Trip Owner
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip budget analytics retrieved successfully",
  "data": {
    "tripId": 1,
    "tripName": "India Golden Triangle & Himalayan Retreat",
    "totalBudget": 75000,
    "estimatedSpent": 17850,
    "remainingBudget": 57150,
    "totalDays": 10,
    "averageCostPerDay": 1785,
    "breakdown": {
      "TRANSPORT": 850,
      "STAY": 12000,
      "FOOD": 1500,
      "ACTIVITY": 3500,
      "OTHER": 0
    },
    "sectionBreakdown": [
      {
        "sectionId": 1,
        "cityName": "Delhi",
        "budget": 20000,
        "spent": 2350,
        "remaining": 17650
      }
    ]
  }
}
```

---

## 📅 Calendar API

### 1. Get Date-Mapped Trips
- **Endpoint**: `GET /api/calendar`
- **Auth Required**: ✅ Authenticated User
- **Query Parameters**:
  - `month`: `1` - `12`
  - `year`: `2026`

---

## 🌐 Community API

### 1. Community Feed (Paginated)
- **Endpoint**: `GET /api/community/posts`
- **Auth Required**: ❌ None
- **Query Parameters**:
  - `page`, `limit`
  - `search`: string
  - `userId`: number
  - `tripId`: number
  - `sortBy`: `createdAt` | `title`
  - `order`: `asc` | `desc`

### 2. Create Post
- **Endpoint**: `POST /api/community/posts`
- **Auth Required**: ✅ Authenticated User
- **Request Body**:
```json
{
  "title": "Unforgettable Solang Valley Paragliding Experience",
  "content": "Tips and guide for anyone visiting Manali in October...",
  "imageUrl": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
  "tripId": 1
}
```

### 3. Get Post by ID
- **Endpoint**: `GET /api/community/posts/:id`
- **Auth Required**: ❌ None

### 4. Update Post
- **Endpoint**: `PUT /api/community/posts/:id`
- **Auth Required**: ✅ Post Owner

### 5. Delete Post
- **Endpoint**: `DELETE /api/community/posts/:id`
- **Auth Required**: ✅ Post Owner or Admin

---

## 🔗 Public Trip Sharing API

### 1. Generate Share Token
- **Endpoint**: `POST /api/trips/:tripId/share`
- **Auth Required**: ✅ Trip Owner
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Trip share link generated successfully",
  "data": {
    "tripId": 1,
    "shareToken": "share_4a8bc9812f8e404b98d",
    "shareUrl": "http://localhost:3000/shared/share_4a8bc9812f8e404b98d"
  }
}
```

### 2. Public Read-Only Viewer
- **Endpoint**: `GET /api/shared/:shareToken`
- **Auth Required**: ❌ None (Read-only, sanitized, no private user contact info exposed)

### 3. Revoke Share Token
- **Endpoint**: `DELETE /api/trips/:tripId/share`
- **Auth Required**: ✅ Trip Owner

---

## 🛡️ Admin API

*All Admin routes require `authMiddleware` + `adminMiddleware` (role: `ADMIN`).*

### 1. Manage Users (Paginated)
- **Endpoint**: `GET /api/admin/users`
- **Query Parameters**:
  - `page`, `limit`
  - `search`: string
  - `role`: `USER` | `ADMIN`
  - `isBlocked`: `true` | `false`
  - `sortBy`: `createdAt` | `firstName` | `lastName` | `email` | `role`
  - `order`: `asc` | `desc`

### 2. Block User Account
- **Endpoint**: `PATCH /api/admin/users/:id/block`
- **Behavior**: Sets `isBlocked = true`. User is immediately denied access to protected features.

### 3. Unblock User Account
- **Endpoint**: `PATCH /api/admin/users/:id/unblock`

### 4. System Analytics
- **Endpoint**: `GET /api/admin/analytics`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "System analytics retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 5,
      "totalTrips": 8,
      "totalCommunityPosts": 12,
      "totalExpensesTracked": 145000
    },
    "tripsByStatus": {
      "UPCOMING": 5,
      "ONGOING": 1,
      "COMPLETED": 2
    },
    "tripsByMonth": {
      "Jan": 1,
      "Feb": 2,
      "Oct": 3,
      "Nov": 2
    },
    "mostPopularCities": [
      { "id": 5, "name": "Paris", "popularity": 99 },
      { "id": 4, "name": "Tokyo", "popularity": 98 }
    ],
    "mostPopularActivityCategories": [
      { "category": "CULTURE", "count": 8 },
      { "category": "ADVENTURE", "count": 6 }
    ]
  }
}
```

---

## 🧠 Smart Recommendation Engine & Travel Preferences

### 1. User Travel Preferences
#### `GET /api/users/preferences`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "User travel preferences retrieved successfully",
  "data": {
    "preferences": {
      "interests": ["ADVENTURE", "FOOD", "CULTURE"],
      "preferredCountries": ["India", "France"],
      "budgetLevel": "MEDIUM"
    }
  }
}
```

#### `PUT /api/users/preferences`
- **Auth**: Required (`Bearer <token>`)
- **Request Body**:
```json
{
  "interests": ["ADVENTURE", "FOOD"],
  "preferredCountries": ["India", "Japan"],
  "budgetLevel": "HIGH"
}
```
- **Validation**:
  - `interests`: array of valid categories (`ADVENTURE`, `CULTURE`, `NATURE`, `FOOD`, `RELAXATION`, `ENTERTAINMENT`, `SHOPPING`)
  - `preferredCountries`: array of strings
  - `budgetLevel`: `LOW` | `MEDIUM` | `HIGH`
- **Response**: `200 OK`

---

### 2. Trip Planning Recommendation
#### `POST /api/trips/recommend` & `POST /api/recommendations/trip`
- **Auth**: Optional (enriches from user preferences when authenticated)
- **Request Body**:
```json
{
  "startDate": "2026-09-10",
  "endDate": "2026-09-17",
  "budget": 50000,
  "interests": ["ADVENTURE", "FOOD", "CULTURE"],
  "preferredCountries": ["India"],
  "maxCities": 3
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip recommendations generated successfully",
  "data": {
    "tripDurationDays": 8,
    "budget": 50000,
    "recommendedCities": [
      {
        "cityId": 2,
        "name": "Manali",
        "country": "India",
        "popularity": 88,
        "costIndex": 35,
        "recommendationScore": 96,
        "matchingActivitiesCount": 3,
        "reasoning": [
          "Popular tourist hotspot (Popularity rating: 88/100)",
          "Offers 3 activities matching your interests: ADVENTURE, NATURE",
          "Directly matches your preferred destination country: India",
          "Budget-friendly for your planned spending (Estimated daily baseline ₹2,975)"
        ]
      }
    ],
    "recommendedActivities": [
      {
        "activityId": 4,
        "cityId": 2,
        "cityName": "Manali",
        "name": "Solang Valley Paragliding",
        "category": "ADVENTURE",
        "estimatedCost": 3500,
        "duration": "3 hours",
        "recommendationScore": 95,
        "reason": "Matches your ADVENTURE interest and easily fits your budget (₹3500)"
      }
    ],
    "estimatedCost": 34500,
    "budgetStatus": "WITHIN_BUDGET",
    "reasoning": [
      "Selected 2 top destinations matching your 8-day schedule.",
      "Matched 5 curated activities tailored to: ADVENTURE, FOOD.",
      "Estimated trip expenditure is ₹34,500 (Within Budget)."
    ]
  }
}
```

---

### 3. Budget Optimizer
#### `POST /api/trips/optimize-budget` & `POST /api/recommendations/budget-optimizer`
- **Auth**: Optional
- **Request Body**:
```json
{
  "budget": 50000,
  "cities": [1, 2],
  "activities": [1, 4],
  "durationDays": 7
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Budget optimization calculated successfully",
  "data": {
    "totalBudget": 50000,
    "recommendedAllocation": {
      "transport": 11625,
      "stay": 18600,
      "food": 11625,
      "activities": 3500,
      "other": 4650
    },
    "estimatedActivityCost": 3500,
    "remainingBudget": 46500,
    "dailyBudget": 7143,
    "warnings": [],
    "suggestions": []
  }
}
```
- **Over-Budget Sample**:
```json
{
  "success": true,
  "message": "Budget optimization calculated successfully",
  "data": {
    "totalBudget": 5000,
    "recommendedAllocation": { ... },
    "estimatedActivityCost": 11500,
    "remainingBudget": 0,
    "dailyBudget": 714,
    "warnings": [
      {
        "type": "OVER_BUDGET",
        "message": "Selected activities (₹11,500) exceed your total budget (₹5,000) by ₹6,500."
      }
    ],
    "suggestions": [
      {
        "type": "REMOVE_ACTIVITY",
        "activityId": 12,
        "activityName": "Eiffel Tower Summit Tour",
        "potentialSaving": 6500,
        "message": "Remove high-cost activity \"Eiffel Tower Summit Tour\" to save ₹6,500"
      }
    ]
  }
}
```

---

### 4. Smart Itinerary Suggestions
#### `POST /api/trips/suggest-itinerary` & `POST /api/recommendations/itinerary-suggestions`
- **Auth**: Required (`Bearer <token>` of trip owner)
- **Request Body**:
```json
{
  "tripId": 1
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Itinerary suggestions generated successfully",
  "data": {
    "tripId": 1,
    "tripName": "Grand European Winter Odyssey",
    "totalDays": 8,
    "totalActivities": 4,
    "suggestions": [
      {
        "type": "EMPTY_DAY",
        "dayId": 14,
        "dayNumber": 4,
        "date": "2026-11-04",
        "cityName": "Paris",
        "message": "You have no activities planned for Day 4 (2026-11-04) in Paris.",
        "recommendedActivities": [
          {
            "id": 14,
            "name": "Montmartre & Sacré-Cœur Walking Tour",
            "category": "CULTURE",
            "estimatedCost": 2000,
            "duration": "2.5 hours"
          }
        ]
      }
    ]
  }
}
```

---

### 5. Personalized Recommendations
#### `GET /api/recommendations/personalized`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Personalized recommendations retrieved successfully",
  "data": {
    "recommendedCities": [ ... ],
    "recommendedActivities": [ ... ],
    "basedOn": [
      "Your preferred interests: ADVENTURE, FOOD",
      "Your previous journey history (Delhi, Manali)",
      "Your preferred budget tier: MEDIUM"
    ]
  }
}
```

---

## 👥 Trip Collaboration System & Activity Log

Trip collaboration allows owners to invite registered travelers with role-based permissions (`OWNER`, `EDITOR`, `VIEWER`).

### 🛡️ Permissions Matrix

| Capability | OWNER | EDITOR | VIEWER | Unrelated User |
|---|:---:|:---:|:---:|:---:|
| View trip, sections, activities, budget, activity log | ✅ | ✅ | ✅ | ❌ (403 for private trips) |
| Update trip details | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Add / Update / Delete / Reorder Itinerary Sections | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Add / Update / Delete / Reorder Day Activities | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Log / Update / Delete Expenses | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Invite Collaborators (`POST /collaborators`) | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Update Collaborator Role (`PATCH /collaborators/:userId`) | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Remove Other Collaborators (`DELETE /collaborators/:userId`) | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Remove Themselves / Leave Trip | N/A | ✅ | ✅ | N/A |
| Create / Revoke Public Share Link | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Delete Entire Trip | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |

---

### 1. Invite Collaborator
#### `POST /api/trips/:tripId/collaborators`
- **Auth**: Required (`Bearer <token>` of trip OWNER)
- **Request Body**:
```json
{
  "userId": 4,
  "role": "EDITOR"
}
```
- **Validation**:
  - `role`: `EDITOR` | `VIEWER`
  - `userId`: Valid registered, unblocked user ID
  - User cannot already be a collaborator or trip owner
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Collaborator added successfully",
  "data": {
    "id": 1,
    "tripId": 5,
    "userId": 4,
    "role": "EDITOR",
    "createdAt": "2026-08-22T11:20:00.000Z",
    "updatedAt": "2026-08-22T11:20:00.000Z",
    "user": {
      "id": 4,
      "firstName": "Bob",
      "lastName": "Editor",
      "email": "bob@example.com",
      "profilePhoto": "https://example.com/avatar.jpg"
    }
  }
}
```

---

### 2. List Collaborators
#### `GET /api/trips/:tripId/collaborators`
- **Auth**: Required (`Bearer <token>` of OWNER, EDITOR, or VIEWER)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Collaborators retrieved successfully",
  "data": {
    "tripId": 5,
    "owner": {
      "id": 2,
      "firstName": "Alice",
      "lastName": "Owner",
      "email": "alice@example.com",
      "profilePhoto": null
    },
    "collaborators": [
      {
        "id": 1,
        "tripId": 5,
        "userId": 4,
        "role": "EDITOR",
        "createdAt": "2026-08-22T11:20:00.000Z",
        "user": {
          "id": 4,
          "firstName": "Bob",
          "lastName": "Editor",
          "email": "bob@example.com",
          "profilePhoto": null
        }
      }
    ]
  }
}
```

---

### 3. Update Collaborator Role
#### `PATCH /api/trips/:tripId/collaborators/:userId`
- **Auth**: Required (`Bearer <token>` of trip OWNER)
- **Request Body**:
```json
{
  "role": "VIEWER"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Collaborator role updated successfully",
  "data": {
    "id": 1,
    "tripId": 5,
    "userId": 4,
    "role": "VIEWER",
    "updatedAt": "2026-08-22T11:25:00.000Z",
    "user": {
      "id": 4,
      "firstName": "Bob",
      "lastName": "Editor",
      "email": "bob@example.com",
      "profilePhoto": null
    }
  }
}
```

---

### 4. Remove Collaborator / Leave Trip
#### `DELETE /api/trips/:tripId/collaborators/:userId`
- **Auth**: Required (`Bearer <token>`)
- **Rules**:
  - Trip OWNER can remove any collaborator.
  - A collaborator can remove themselves (`userId` matches authenticated user).
  - VIEWER / EDITOR cannot remove another collaborator (returns `403 Forbidden`).
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Collaborator removed successfully.",
  "data": {}
}
```

---

### 5. My Collaborative Trips
#### `GET /api/trips/shared-with-me`
- **Auth**: Required (`Bearer <token>`)
- **Query Parameters**:
  - `page`: integer (default `1`)
  - `limit`: integer (default `10`)
  - `status`: `UPCOMING` | `ONGOING` | `COMPLETED`
  - `search`: string (matches trip name or description)
  - `sortBy`: `startDate` | `endDate` | `createdAt` | `name` | `totalBudget`
  - `order`: `asc` | `desc`
- **Response**: `200 OK` (Paginated)
```json
{
  "success": true,
  "message": "Shared trips retrieved successfully",
  "data": [
    {
      "id": 5,
      "name": "Collaborative Alpine Expedition",
      "description": "High altitude hiking with friends",
      "startDate": "2026-12-01",
      "endDate": "2026-12-10",
      "status": "UPCOMING",
      "totalBudget": 80000,
      "collaborationRole": "EDITOR",
      "joinedAt": "2026-08-22T11:20:00.000Z",
      "owner": {
        "id": 2,
        "firstName": "Alice",
        "lastName": "Owner",
        "email": "alice@example.com",
        "profilePhoto": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### 6. Collaboration Activity Log
#### `GET /api/trips/:tripId/activity-log`
- **Auth**: Required (`Bearer <token>` of OWNER, EDITOR, or VIEWER)
- **Query Parameters**: `page`, `limit`
- **Response**: `200 OK` (Paginated)
```json
{
  "success": true,
  "message": "Trip activity logs retrieved successfully",
  "data": [
    {
      "id": 4,
      "tripId": 5,
      "userId": 4,
      "action": "EXPENSE_CREATED",
      "description": "Logged expense: ₹20,000 (STAY - Shinjuku Hotel)",
      "createdAt": "2026-08-22T11:22:00.000Z",
      "user": {
        "id": 4,
        "firstName": "Bob",
        "lastName": "Editor",
        "profilePhoto": null
      }
    },
    {
      "id": 3,
      "tripId": 5,
      "userId": 4,
      "action": "ACTIVITY_SCHEDULED",
      "description": "Scheduled \"Shibuya Crossing & Hachiko Statue\" for Day 1 (2026-12-01)",
      "createdAt": "2026-08-22T11:21:00.000Z",
      "user": {
        "id": 4,
        "firstName": "Bob",
        "lastName": "Editor",
        "profilePhoto": null
      }
    },
    {
      "id": 2,
      "tripId": 5,
      "userId": 4,
      "action": "SECTION_CREATED",
      "description": "Added destination section for Tokyo (2026-12-01 to 2026-12-04)",
      "createdAt": "2026-08-22T11:20:30.000Z",
      "user": {
        "id": 4,
        "firstName": "Bob",
        "lastName": "Editor",
        "profilePhoto": null
      }
    },
    {
      "id": 1,
      "tripId": 5,
      "userId": 2,
      "action": "COLLABORATOR_ADDED",
      "description": "Invited Bob Editor as EDITOR",
      "createdAt": "2026-08-22T11:20:00.000Z",
      "user": {
        "id": 2,
        "firstName": "Alice",
        "lastName": "Owner",
        "profilePhoto": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 4,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## 🔔 Notifications & Smart Trip Alerts

A centralized notification system generating automated alerts for invitations, collaborator role updates, member departures, budget threshold warnings (80% and 100%+), and trip health findings.

### 1. Get My Notifications
#### `GET /api/notifications`
- **Auth**: Required (`Bearer <token>`)
- **Query Parameters**:
  - `page`: integer (default `1`)
  - `limit`: integer (default `10`, max `50`)
  - `type`: filter by type (`TRIP_INVITATION`, `COLLABORATOR_ADDED`, `COLLABORATOR_REMOVED`, `ROLE_CHANGED`, `TRIP_UPDATED`, `ITINERARY_UPDATED`, `ACTIVITY_ADDED`, `ACTIVITY_REMOVED`, `BUDGET_WARNING`, `BUDGET_EXCEEDED`, `EMPTY_DAY`, `SYSTEM`)
  - `isRead`: `true` | `false`
  - `sortBy`: `createdAt` | `type` | `isRead`
  - `order`: `asc` | `desc` (default `desc`)
- **Response**: `200 OK` (Paginated)
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": 1,
      "userId": 4,
      "type": "TRIP_INVITATION",
      "title": "You were added to a trip",
      "message": "You were added as an EDITOR to \"Collaborative Alpine Expedition\".",
      "relatedTripId": 5,
      "relatedUserId": 2,
      "metadata": { "role": "EDITOR" },
      "isRead": false,
      "createdAt": "2026-08-22T11:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### 2. Get Unread Notification Count
#### `GET /api/notifications/unread-count`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Unread notification count retrieved",
  "data": {
    "unreadCount": 3
  }
}
```

---

### 3. Mark Single Notification as Read
#### `PATCH /api/notifications/:id/read`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "id": 1,
      "userId": 4,
      "isRead": true
    }
  }
}
```

---

### 4. Mark All Notifications as Read
#### `PATCH /api/notifications/read-all`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 3
  }
}
```

---

### 5. Delete Single Notification
#### `DELETE /api/notifications/:id`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {}
}
```

---

### 6. Clear All Notifications
#### `DELETE /api/notifications`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Notifications cleared successfully",
  "data": {
    "deletedCount": 5
  }
}
```

---

## 🩺 Trip Health & Smart Feasibility Engine

### 1. Get Trip Health Analysis
#### `GET /api/trips/:tripId/health`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Query Parameters**:
  - `triggerAlerts`: `true` | `false` (default `true`, generates notifications for severe issues like empty days or over-budget with duplicate prevention)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip health analysis retrieved successfully",
  "data": {
    "tripId": 6,
    "tripName": "Budget Alert Test Expedition",
    "score": 70,
    "status": "NEEDS_ATTENTION",
    "issuesCount": 2,
    "issues": [
      {
        "type": "EMPTY_DAY",
        "severity": "MEDIUM",
        "message": "Day 1 (2026-11-10) has no activities planned.",
        "dayId": 25,
        "date": "2026-11-10"
      },
      {
        "type": "BUDGET_EXCEEDED",
        "severity": "HIGH",
        "message": "Trip expenditures (₹12,000) exceed budget (₹10,000) by ₹2,000.",
        "totalBudget": 10000,
        "totalSpent": 12000,
        "overage": 2000
      }
    ],
    "suggestions": [
      "Explore top city attractions and add at least 1 activity to Day 1.",
      "Use the Budget Optimizer to review high-cost items or adjust your spending limit."
    ]
  }
}
```

---

## 📋 Trip Templates & Cloning System

A complete trip templating, instantiation, duplication, and public copy system with deep data independence and date schedule mapping.

### 1. Create Template from Trip
#### `POST /api/trips/:tripId/template`
- **Auth**: Required (`OWNER` only)
- **Request Body**:
```json
{
  "name": "7-Day Golden Japan & Europe Route",
  "description": "Complete curated multi-city itinerary",
  "isPublic": true,
  "category": "CULTURE",
  "coverPhoto": "https://images.unsplash.com/photo-japan"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Trip converted into template successfully",
  "data": {
    "template": {
      "id": 1,
      "creatorId": 2,
      "sourceTripId": 7,
      "name": "7-Day Golden Japan & Europe Route",
      "description": "Complete curated multi-city itinerary",
      "category": "CULTURE",
      "isPublic": true,
      "sections": [
        {
          "cityId": 4,
          "cityName": "Tokyo",
          "order": 1,
          "durationDays": 3,
          "activities": [
            {
              "activityId": 10,
              "activityName": "Shibuya Crossing",
              "dayOffset": 0,
              "startTime": "10:00",
              "endTime": "12:00",
              "customCost": 2000
            }
          ]
        }
      ],
      "metadata": {
        "totalDays": 7,
        "totalCities": 2,
        "totalActivities": 2,
        "estimatedCost": 6000
      },
      "viewCount": 0,
      "copyCount": 0,
      "favoriteCount": 0,
      "createdAt": "2026-08-22T11:30:00.000Z"
    }
  }
}
```

---

### 2. Discover Public Templates
#### `GET /api/templates`
- **Auth**: Optional
- **Query Parameters**:
  - `search`: string
  - `category`: `ADVENTURE` | `CULTURE` | `NATURE` | `FOOD` | `RELAXATION` | `ENTERTAINMENT` | `SHOPPING` | `OTHER`
  - `sortBy`: `popularity` | `newest` | `estimatedCost` | `duration` | `copyCount` | `favoriteCount`
  - `order`: `asc` | `desc`
  - `page`: integer
  - `limit`: integer
- **Response**: `200 OK` (Paginated list of public templates)

---

### 3. Get My Templates
#### `GET /api/templates/my`
- **Auth**: Required (`Bearer <token>`)
- **Query Parameters**: `search`, `category`, `isPublic`, `sortBy`, `order`, `page`, `limit`
- **Response**: `200 OK` (Paginated list of user created templates)

---

### 4. Get Template Details
#### `GET /api/templates/:id`
- **Auth**: Optional (Public if `isPublic: true`, Owner-only if private)
- **Response**: `200 OK` with full template sections, metadata, stats, and safe creator public profile.

---

### 5. Create Trip from Template
#### `POST /api/templates/:id/use`
- **Auth**: Required (`Bearer <token>`)
- **Request Body**:
```json
{
  "tripName": "My Japan Trip",
  "startDate": "2027-04-01",
  "endDate": "2027-04-07",
  "budget": 150000,
  "visibility": "PRIVATE"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Trip created from template successfully",
  "data": {
    "trip": {
      "id": 8,
      "userId": 4,
      "name": "My Japan Trip",
      "startDate": "2027-04-01",
      "endDate": "2027-04-07",
      "totalBudget": 150000,
      "status": "UPCOMING"
    },
    "warnings": []
  }
}
```

---

### 6. Duplicate Own Trip
#### `POST /api/trips/:tripId/duplicate`
- **Auth**: Required (`OWNER` only)
- **Request Body**:
```json
{
  "name": "Europe Trip Copy",
  "startDate": "2028-01-01",
  "endDate": "2028-01-07",
  "totalBudget": 100000
}
```
- **Response**: `201 Created` with new cloned Trip and warnings.

---

### 7. Copy Public Shared Trip
#### `POST /api/shared/:shareToken/copy`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `201 Created` with a new personal private copy owned by authenticated user.

---

### 8. Template Favorites
- `POST /api/templates/:id/favorite` $\to$ Favorites template (`201 Created`).
- `DELETE /api/templates/:id/favorite` $\to$ Unfavorites template (`200 OK`).
- `GET /api/templates/favorites` $\to$ Paginated list of user's favorited templates (`200 OK`).

---

### 9. Template Management (Owner Only)
- `PATCH /api/templates/:id` $\to$ Updates `name`, `description`, `category`, `isPublic`, `coverPhoto` (`200 OK`).
- `DELETE /api/templates/:id` $\to$ Deletes template and removes from favorites (`200 OK`).

---

## 💸 Group Expense Splitting & Settlement

A full multi-user expense splitting and settlement engine supporting Equal, Exact, and Percentage splits with deterministic debt simplification optimization.

### 1. Create Shared Expense
#### `POST /api/trips/:tripId/shared-expenses`
- **Auth**: Required (`OWNER` or `EDITOR`)
- **Request Body (EQUAL Split)**:
```json
{
  "title": "Chalet Rental",
  "description": "3 nights alpine lodge",
  "amount": 12000,
  "category": "STAY",
  "paidBy": 2,
  "splitType": "EQUAL",
  "participants": [2, 4, 5]
}
```
- **Request Body (EXACT Split)**:
```json
{
  "title": "Passes & Tolls",
  "amount": 6000,
  "category": "TRANSPORT",
  "paidBy": 4,
  "splitType": "EXACT",
  "splits": [
    { "userId": 2, "amount": 3000 },
    { "userId": 4, "amount": 2000 },
    { "userId": 5, "amount": 1000 }
  ]
}
```
- **Request Body (PERCENTAGE Split)**:
```json
{
  "title": "Dinner Feast",
  "amount": 10000,
  "category": "FOOD",
  "paidBy": 2,
  "splitType": "PERCENTAGE",
  "splits": [
    { "userId": 2, "percentage": 50 },
    { "userId": 4, "percentage": 30 },
    { "userId": 5, "percentage": 20 }
  ]
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Shared expense created successfully",
  "data": {
    "id": 1,
    "tripId": 13,
    "title": "Chalet Rental",
    "amount": 12000,
    "category": "STAY",
    "paidBy": 2,
    "splitType": "EQUAL",
    "paidByUser": {
      "id": 2,
      "name": "Alice Traveler",
      "profilePhoto": null
    },
    "splits": [
      { "id": 1, "userId": 2, "amount": 4000, "percentage": 33.33 },
      { "id": 2, "userId": 4, "amount": 4000, "percentage": 33.33 },
      { "id": 3, "userId": 5, "amount": 4000, "percentage": 33.33 }
    ]
  }
}
```

---

### 2. Get Shared Expenses
#### `GET /api/trips/:tripId/shared-expenses`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Query Parameters**: `page`, `limit`, `category`, `paidBy`, `sortBy`, `order`
- **Response**: `200 OK` (Paginated list of shared expenses with splits)

---

### 3. Update Shared Expense
#### `PATCH /api/trips/:tripId/shared-expenses/:expenseId`
- **Auth**: Required (`OWNER` or `EDITOR`)
- **Response**: `200 OK` with updated expense and recalculated splits.

---

### 4. Delete Shared Expense
#### `DELETE /api/trips/:tripId/shared-expenses/:expenseId`
- **Auth**: Required (`OWNER` or `EDITOR`)
- **Response**: `200 OK`

---

### 5. Get Trip Balances
#### `GET /api/trips/:tripId/balances`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip member balances calculated successfully",
  "data": {
    "tripId": 13,
    "balances": [
      {
        "userId": 2,
        "name": "Alice Traveler",
        "email": "alice@example.com",
        "totalPaid": 22000,
        "totalOwed": 12000,
        "netBalance": 10000
      },
      {
        "userId": 4,
        "name": "Bob Explorer",
        "email": "bob@example.com",
        "totalPaid": 6000,
        "totalOwed": 9000,
        "netBalance": -3000
      },
      {
        "userId": 5,
        "name": "Charlie Viewer",
        "email": "charlie@example.com",
        "totalPaid": 0,
        "totalOwed": 7000,
        "netBalance": -7000
      }
    ]
  }
}
```

---

### 6. Get Optimized Settlements
#### `GET /api/trips/:tripId/settlements`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Optimized settlements generated successfully",
  "data": {
    "tripId": 13,
    "settlements": [
      {
        "fromUser": { "id": 5, "name": "Charlie Viewer" },
        "toUser": { "id": 2, "name": "Alice Traveler" },
        "amount": 7000,
        "status": "PENDING"
      },
      {
        "fromUser": { "id": 4, "name": "Bob Explorer" },
        "toUser": { "id": 2, "name": "Alice Traveler" },
        "amount": 3000,
        "status": "PENDING"
      }
    ],
    "totalTransactions": 2
  }
}
```

---

### 7. Mark Settlement as Completed
#### `PATCH /api/trips/:tripId/settlements/:settlementId/complete`
- **Auth**: Required (User must be debtor, creditor, or trip owner)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Settlement marked as completed",
  "data": {
    "settlement": {
      "id": 1,
      "tripId": 13,
      "fromUserId": 4,
      "toUserId": 2,
      "amount": 3000,
      "status": "COMPLETED",
      "settledAt": "2026-08-22T11:34:00.000Z"
    }
  }
}
```

---

### 8. Get Settlement History
#### `GET /api/trips/:tripId/settlements/history`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK` (Paginated list of completed settlements)

---

### 9. Get Personal Expense & Settlement Summary
#### `GET /api/trips/:tripId/my-expense-summary`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Personal expense summary retrieved successfully",
  "data": {
    "tripId": 13,
    "userId": 5,
    "totalPaid": 0,
    "totalOwed": 7000,
    "netBalance": -7000,
    "pendingPayments": [
      {
        "toUser": { "id": 2, "name": "Alice Traveler" },
        "amount": 7000,
        "status": "PENDING"
      }
    ],
    "pendingReceivables": [],
    "settledHistoryCount": 0
  }
}
```

---

## 🎒 Smart Packing & Travel Preparation

A comprehensive trip preparation engine managing categorized packing items, intelligent deterministic packing suggestions, travel document readiness, pre-trip preparation tasks, and multi-component readiness scoring.

### 1. Get Packing List
#### `GET /api/trips/:tripId/packing-list`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Query Parameters**: `category`, `isPacked`, `isEssential`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip packing list retrieved successfully",
  "data": {
    "tripId": 13,
    "summary": {
      "totalItems": 15,
      "packedItems": 9,
      "remainingItems": 6,
      "essentialTotal": 5,
      "essentialPacked": 4,
      "progress": 60
    },
    "categories": [
      {
        "name": "CLOTHING",
        "items": [
          {
            "id": 2,
            "tripId": 13,
            "name": "Warm Fleece Jacket",
            "category": "CLOTHING",
            "quantity": 2,
            "isEssential": true,
            "isPacked": true
          }
        ]
      }
    ]
  }
}
```

---

### 2. Add Packing Item
#### `POST /api/trips/:tripId/packing-list/items`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Request Body**:
```json
{
  "name": "Passport & Travel Documents Folder",
  "category": "DOCUMENTS",
  "quantity": 1,
  "isEssential": true
}
```
- **Response**: `201 Created`

---

### 3. Update Packing Item
#### `PATCH /api/trips/:tripId/packing-list/items/:itemId`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Request Body**: `{ "isPacked": true, "quantity": 2 }`
- **Response**: `200 OK`

---

### 4. Delete Packing Item
#### `DELETE /api/trips/:tripId/packing-list/items/:itemId`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Response**: `200 OK`

---

### 5. Bulk Update Packing Status
#### `PATCH /api/trips/:tripId/packing-list/bulk`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Request Body**:
```json
{
  "items": [
    { "itemId": 1, "isPacked": true },
    { "itemId": 2, "isPacked": true }
  ]
}
```
- **Response**: `200 OK` with updated `progress` percentage.

---

### 6. Smart Packing Suggestions
#### `GET /api/trips/:tripId/packing-suggestions`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Smart packing suggestions generated successfully",
  "data": {
    "tripId": 13,
    "totalSuggestions": 4,
    "suggestions": [
      {
        "id": "sugg-hiking-shoes",
        "name": "Sturdy Hiking Boots or Trail Shoes",
        "category": "ACTIVITY_GEAR",
        "quantity": 1,
        "isEssential": true,
        "reason": "Your itinerary includes adventure and nature activities",
        "priority": "HIGH"
      }
    ]
  }
}
```

---

### 7. Add Suggestion to Packing List
#### `POST /api/trips/:tripId/packing-suggestions/:suggestionId/add`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Response**: `201 Created` with converted packing item.

---

### 8. Travel Documents Checklist
- `GET /api/trips/:tripId/travel-documents` $\to$ Returns documents and summary progress (`200 OK`).
- `POST /api/trips/:tripId/travel-documents` $\to$ Body: `{ name: "Passport", type: "PASSPORT", isRequired: true, isReady: false, expiryDate: "2032-05-10" }` (`201 Created`).
- `PATCH /api/trips/:tripId/travel-documents/:documentId` $\to$ Body: `{ isReady: true }` (`200 OK`).
- `DELETE /api/trips/:tripId/travel-documents/:documentId` $\to$ Deletes document (`200 OK`).

---

### 9. Pre-Trip Preparation Tasks
- `GET /api/trips/:tripId/preparation-tasks` $\to$ Returns preparation tasks (`200 OK`).
- `POST /api/trips/:tripId/preparation-tasks` $\to$ Body: `{ title: "Book Shuttle", priority: "CRITICAL", dueDate: "2027-07-28" }` (`201 Created`).
- `PATCH /api/trips/:tripId/preparation-tasks/:taskId` $\to$ Body: `{ isCompleted: true }` (`200 OK`).
- `DELETE /api/trips/:tripId/preparation-tasks/:taskId` $\to$ Deletes task (`200 OK`).

---

### 10. Trip Readiness Score & Alerts
#### `GET /api/trips/:tripId/readiness`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip readiness analysis calculated successfully",
  "data": {
    "tripId": 13,
    "score": 85,
    "status": "ALMOST_READY",
    "breakdown": {
      "packing": 100,
      "documents": 100,
      "tasks": 100,
      "itinerary": 40
    },
    "missingItems": []
  }
}
```

---

## 📈 Trip Insights & Analytics Engine

Comprehensive analytics suite calculating personal travel summaries, spending histograms, activity patterns, city preferences, timeline histograms, multi-trip comparison, smart behavioral insights, dynamic achievements, and single-trip performance diagnostics.

### 1. Personal Travel Dashboard
#### `GET /api/analytics/dashboard`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "User travel dashboard analytics retrieved successfully",
  "data": {
    "totalTrips": 12,
    "upcomingTrips": 2,
    "ongoingTrips": 1,
    "completedTrips": 9,
    "totalCitiesVisited": 18,
    "totalEstimatedSpent": 250000,
    "averageTripDuration": 5.4,
    "averageTripCost": 28000,
    "favoriteActivityCategory": "ADVENTURE",
    "mostVisitedCity": {
      "id": 1,
      "name": "Paris",
      "visitCount": 4
    }
  }
}
```

---

### 2. Spending Analytics
#### `GET /api/analytics/spending`
- **Auth**: Required (`Bearer <token>`)
- **Query Parameters**: `tripId`, `startDate`, `endDate`, `groupBy` (`DAY`, `MONTH`, `CATEGORY`, `TRIP`, `CITY`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Spending analytics calculated successfully",
  "data": {
    "totalSpent": 50000,
    "averageDailyCost": 6250,
    "highestExpense": {
      "name": "Chalet Rental",
      "category": "STAY",
      "amount": 12000
    },
    "groupBy": "CATEGORY",
    "breakdown": [
      {
        "label": "STAY",
        "amount": 20000,
        "percentage": 40
      },
      {
        "label": "FOOD",
        "amount": 15000,
        "percentage": 30
      }
    ]
  }
}
```

---

### 3. Travel Activity Insights
#### `GET /api/analytics/activities`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Activity analytics and patterns retrieved successfully",
  "data": {
    "totalActivities": 48,
    "averageActivityCost": 1250,
    "favoriteCategories": [
      {
        "category": "ADVENTURE",
        "count": 15,
        "percentage": 31
      }
    ],
    "mostExpensiveActivity": {
      "name": "Eiffel Tower Summit Tour",
      "cost": 6500,
      "category": "CULTURE"
    }
  }
}
```

---

### 4. City Insights
#### `GET /api/analytics/cities`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "City travel patterns retrieved successfully",
  "data": {
    "mostVisited": [
      { "id": 1, "city": "Paris", "count": 3 }
    ],
    "mostPlanned": [],
    "mostExpensive": { "id": 1, "city": "Paris", "totalCost": 45000 },
    "cheapestCity": { "id": 2, "city": "Manali", "totalCost": 12000 },
    "averageCostPerCity": 28500
  }
}
```

---

### 5. Travel Timeline Analytics
#### `GET /api/analytics/travel-timeline`
- **Auth**: Required (`Bearer <token>`)
- **Query Parameters**: `year`, `groupBy`
- **Response**: `200 OK` (12-month array of `{ month, trips, daysTravelled, estimatedSpent }`)

---

### 6. Multi-Trip Comparison Engine
#### `GET /api/analytics/compare?tripIds=7,13`
- **Auth**: Required (`Bearer <token>`) (Requires user access to each specified trip)
- **Constraints**: Maximum 5 trip IDs per request
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip comparison generated successfully",
  "data": {
    "trips": [
      {
        "tripId": 13,
        "name": "Alpine Squad Expedition",
        "duration": 7,
        "budget": 300000,
        "estimatedCost": 28000,
        "actualExpenses": 18000,
        "costPerDay": 4000,
        "cities": 2,
        "activities": 6,
        "healthScore": 92,
        "readinessScore": 85
      }
    ]
  }
}
```

---

### 7. Smart Travel Insights
#### `GET /api/analytics/insights`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Smart travel insights generated successfully",
  "data": {
    "totalInsights": 4,
    "insights": [
      {
        "type": "SPENDING_PATTERN",
        "title": "STAY dominates your travel spending",
        "description": "STAY accounts for 45% of your total recorded travel expenses (₹22,000).",
        "severity": "INFO",
        "metadata": { "category": "STAY", "percentage": 45 }
      }
    ]
  }
}
```

---

### 8. Dynamic Travel Achievements
#### `GET /api/analytics/achievements`
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Travel achievements and milestones calculated successfully",
  "data": {
    "totalUnlocked": 4,
    "totalAvailable": 8,
    "completionPercentage": 50,
    "unlocked": [
      {
        "code": "FIRST_TRIP",
        "title": "First Step to Adventure",
        "description": "Created your first trip itinerary on PathPilot.",
        "icon": "🚀",
        "category": "MILESTONE",
        "isUnlocked": true,
        "progress": { "current": 1, "target": 1, "percentage": 100 }
      }
    ],
    "locked": []
  }
}
```

---

### 9. Single Trip Insights & Diagnostics
#### `GET /api/trips/:tripId/insights`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip-specific insights calculated successfully",
  "data": {
    "tripId": 13,
    "name": "Alpine Squad Expedition",
    "budget": {
      "total": 300000,
      "used": 18000,
      "percentage": 6,
      "remaining": 282000
    },
    "costPerDay": 4000,
    "mostExpensiveCategory": "STAY",
    "mostExpensiveActivity": {
      "name": "Summit Helicopter Tour",
      "cost": 8500
    },
    "busiestDay": {
      "dayNumber": 2,
      "date": "2027-08-02",
      "activityCount": 4
    },
    "emptyDays": 1,
    "citiesCount": 2,
    "activitiesCount": 8,
    "healthScore": 92,
    "readinessScore": 85
  }
}
```

---

## 🔍 Global Search & Advanced Filtering Engine

Unified keyword and multi-resource search system supporting autocomplete suggestions, recent search history, trending searches, relevance scoring, and granular filtering across trips, cities, activities, templates, and community posts.

### 1. Global Multi-Resource Search
#### `GET /api/search`
- **Auth**: Optional (`Bearer <token>` for personalized trip/template scoping)
- **Query Parameters**:
  - `q`: Search keyword (string, max 100)
  - `type`: `ALL` (default), `TRIPS`, `CITIES`, `ACTIVITIES`, `TEMPLATES`, `COMMUNITY`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `sortBy`: Optional sorting field
  - `order`: `ASC` or `DESC` (default: `DESC`)
- **Response (`type=ALL`)**: `200 OK`
```json
{
  "success": true,
  "message": "Global search executed successfully",
  "data": {
    "query": "japan",
    "type": "ALL",
    "results": {
      "trips": [],
      "cities": [
        {
          "id": 4,
          "name": "Tokyo",
          "country": "Japan",
          "popularity": 95,
          "relevance": 100
        }
      ],
      "activities": [],
      "templates": [],
      "community": []
    },
    "summary": {
      "totalResults": 1,
      "trips": 0,
      "cities": 1,
      "activities": 0,
      "templates": 0,
      "community": 0
    }
  }
}
```

---

### 2. User Trip Search
#### `GET /api/trips/search`
- **Auth**: Required (`Bearer <token>`) (Strictly scopes to user's owned and collaborated trips)
- **Query Parameters**:
  - `q`: Keyword search across trip name and description
  - `status`: `UPCOMING`, `ONGOING`, `COMPLETED`
  - `startDate`, `endDate`: Date boundaries (`YYYY-MM-DD`)
  - `minBudget`, `maxBudget`: Numeric budget filter
  - `city`: Filter trips containing itinerary section in target city
  - `sortBy`: `NAME`, `START_DATE`, `END_DATE`, `BUDGET`, `CREATED_AT`, `UPDATED_AT`
  - `order`: `ASC` or `DESC`
  - `page`, `limit`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "User trips retrieved successfully",
  "data": {
    "trips": [
      {
        "id": 13,
        "name": "Alpine Squad Expedition",
        "startDate": "2027-08-01",
        "endDate": "2027-08-07",
        "status": "UPCOMING",
        "totalBudget": 300000,
        "relevance": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

---

### 3. Advanced Activity Search
#### `GET /api/activities/search`
- **Auth**: Public
- **Query Parameters**: `q`, `category`, `city`, `minCost`, `maxCost`, `minDuration`, `maxDuration`, `sortBy` (`NAME`, `COST`, `DURATION`, `POPULARITY`), `order`, `page`, `limit`
- **Response**: `200 OK` (Paginated activities array)

---

### 4. Advanced City Search
#### `GET /api/cities/search`
- **Auth**: Public
- **Query Parameters**: `q`, `country`, `region`, `minCostIndex`, `maxCostIndex`, `sortBy` (`NAME`, `POPULARITY`, `COST_INDEX`), `order`, `page`, `limit`
- **Response**: `200 OK` (Paginated cities array)

---

### 5. Template Search
#### `GET /api/templates/search`
- **Auth**: Optional (Searches public templates + user's private templates if authenticated)
- **Query Parameters**: `q`, `category`, `minDuration`, `maxDuration`, `minCost`, `maxCost`, `sortBy` (`POPULARITY`, `NEWEST`, `COST`, `DURATION`, `FAVORITES`, `COPIES`), `order`, `page`, `limit`
- **Response**: `200 OK` (Paginated templates array)

---

### 6. Community Search
#### `GET /api/community/search`
- **Auth**: Public
- **Query Parameters**: `q`, `category`, `city`, `sortBy` (`NEWEST`, `POPULARITY`, `LIKES`, `COMMENTS`), `order`, `page`, `limit`
- **Response**: `200 OK` (Paginated community posts array)

---

### 7. Instant Search Suggestions
#### `GET /api/search/suggestions?q=tok`
- **Auth**: Optional
- **Query Parameters**: `q` (string, min 2 chars)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Search suggestions retrieved successfully",
  "data": {
    "query": "tok",
    "totalSuggestions": 2,
    "suggestions": [
      {
        "type": "CITY",
        "label": "Tokyo, Japan",
        "value": "Tokyo",
        "id": 4
      },
      {
        "type": "ACTIVITY",
        "label": "Tokyo Skytree",
        "value": "Tokyo Skytree",
        "id": 14
      }
    ]
  }
}
```

---

### 8. Recent Searches Management
- `GET /api/search/recent` $\to$ Returns user's last 10 search terms (`200 OK`).
- `DELETE /api/search/recent` $\to$ Clears entire search history (`200 OK`).
- `DELETE /api/search/recent/:searchId` $\to$ Deletes individual search record (`200 OK`).

---

### 9. Popular Trending Searches
#### `GET /api/search/popular`
- **Auth**: Public
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Popular searches retrieved successfully",
  "data": [
    {
      "query": "Paris",
      "type": "CITY",
      "score": 98
    },
    {
      "query": "Tokyo",
      "type": "CITY",
      "score": 95
    }
  ]
}
```

---

## 🗺️ Smart Route Planning & Itinerary Optimization Engine

Complete multi-city route planning suite providing route overview, drag-and-drop city reordering, travel matrix distance/cost calculations, multi-modal transport comparisons (`FLIGHT`, `TRAIN`, `BUS`, `CAR`), daily activity schedule optimization, route conflict detection, pacing recommendations, and route scoring.

### 1. Trip Route Overview
#### `GET /api/trips/:tripId/route`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Trip route retrieved successfully",
  "data": {
    "tripId": 14,
    "route": [
      {
        "order": 1,
        "sectionId": 1,
        "cityId": 7,
        "city": "Mumbai",
        "cityName": "Mumbai",
        "startDate": "2027-10-01",
        "endDate": "2027-10-03",
        "days": 3
      },
      {
        "order": 2,
        "sectionId": 3,
        "cityId": 8,
        "city": "Jaipur",
        "cityName": "Jaipur",
        "startDate": "2027-10-04",
        "endDate": "2027-10-06",
        "days": 3
      }
    ],
    "summary": {
      "totalCities": 2,
      "totalDays": 6,
      "estimatedTravelDistance": 1150,
      "estimatedTravelTime": 1.8,
      "estimatedTravelCost": 4800
    }
  }
}
```

---

### 2. Reorder Trip Cities
#### `PATCH /api/trips/:tripId/route/reorder`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Body**:
```json
{
  "cityOrder": [1, 3, 2]
}
```
- **Response**: `200 OK` (Returns updated route with sequential dates and shifted days)

---

### 3. Route Optimization Suggestions
#### `POST /api/trips/:tripId/route/optimize`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Route optimization analysis calculated successfully",
  "data": {
    "tripId": 14,
    "currentRoute": [],
    "optimizedRoute": [],
    "changes": [
      {
        "sectionId": 3,
        "city": "Goa",
        "oldPosition": 4,
        "newPosition": 2
      }
    ],
    "estimatedImprovement": {
      "distanceSaved": 420,
      "travelTimeSaved": 3.5,
      "estimatedCostSaved": 2800
    }
  }
}
```

---

### 4. Apply Route Optimization
#### `POST /api/trips/:tripId/route/apply-optimization`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Body**:
```json
{
  "sectionOrder": [1, 3, 2]
}
```
- **Response**: `200 OK` (Applies optimized ordering, recalculates dates, logs activity)

---

### 5. Inter-City Travel Segments
#### `GET /api/trips/:tripId/travel-segments`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Travel segments retrieved successfully",
  "data": [
    {
      "id": 1,
      "from": "Mumbai",
      "to": "Goa",
      "estimatedDistance": 590,
      "estimatedDuration": 1.2,
      "estimatedCost": 4200,
      "recommendedMode": "FLIGHT",
      "selectedMode": "FLIGHT"
    }
  ]
}
```

---

### 6. Transport Mode Options
#### `GET /api/trips/:tripId/travel-segments/:segmentId/options`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Transport mode options retrieved successfully",
  "data": [
    {
      "mode": "FLIGHT",
      "estimatedDuration": 1.2,
      "estimatedCost": 4200,
      "comfortScore": 9
    },
    {
      "mode": "TRAIN",
      "estimatedDuration": 11,
      "estimatedCost": 1400,
      "comfortScore": 7
    },
    {
      "mode": "BUS",
      "estimatedDuration": 14,
      "estimatedCost": 900,
      "comfortScore": 5
    }
  ]
}
```

---

### 7. Select Transport Option
#### `PATCH /api/trips/:tripId/travel-segments/:segmentId`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Body**: `{ "selectedMode": "TRAIN" }`
- **Response**: `200 OK`

---

### 8. Day Activity Schedule Optimization
#### `POST /api/trips/:tripId/days/:dayId/optimize`
- **Auth**: Required (`OWNER`, `EDITOR`, `VIEWER`)
- **Response**: `200 OK` (Returns `{ currentOrder, optimizedOrder, warnings }`)

#### `POST /api/trips/:tripId/days/:dayId/apply-optimization`
- **Auth**: Required (`OWNER`, `EDITOR`)
- **Body**: `{}`
- **Response**: `200 OK` (Applies optimized timestamps and order to day activities)

---

### 9. Route Conflicts, Recommendations & Score
- `GET /api/trips/:tripId/route/conflicts` $\to$ Returns detected timing, overlapping, or transport gaps (`200 OK`).
- `GET /api/trips/:tripId/route/recommendations` $\to$ Returns actionable route & pacing recommendations (`200 OK`).
- `GET /api/trips/:tripId/route/score` $\to$ Returns route quality score (0–100) and breakdown (`routeEfficiency`, `travelTime`, `costEfficiency`, `scheduleHealth`) (`200 OK`).









