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
  "message": "PathPilot API is running",
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
