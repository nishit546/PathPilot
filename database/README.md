# PathPilot Database Architecture & Engineering Guide

Welcome to the database foundation for **PathPilot**, an intelligent travel itinerary and trip planning platform built for the hackathon.

This documentation serves as the complete technical manual for database setup, migrations, security policies, query patterns, and backend integration.

---

## 1. Architecture Overview

The database is built on **PostgreSQL (hosted on Supabase)** and integrates with **Supabase Auth**.

```mermaid
erDiagram
    PROFILES ||--o{ TRIPS : owns
    PROFILES ||--o{ COMMUNITY_POSTS : writes
    PROFILES ||--o{ SHARED_TRIPS : shares
    CITIES ||--o{ ACTIVITIES : contains
    CITIES ||--o{ TRIP_SECTIONS : visited_in
    TRIPS ||--|{ TRIP_SECTIONS : divided_into
    TRIPS ||--o{ BUDGET_ITEMS : aggregates
    TRIPS ||--o{ SHARED_TRIPS : shared_via
    TRIPS ||--o{ COMMUNITY_POSTS : highlighted_in
    TRIP_SECTIONS ||--|{ DAYS : schedules
    TRIP_SECTIONS ||--o{ BUDGET_ITEMS : tracks
    DAYS ||--o{ DAY_ACTIVITIES : includes
    DAYS ||--o{ BUDGET_ITEMS : logs
    ACTIVITIES ||--o{ DAY_ACTIVITIES : scheduled_as
    ACTIVITIES ||--o{ COMMUNITY_POSTS : referenced_in
```

---

## 2. Table Specifications

### 1. `public.profiles`
Mirrors Supabase `auth.users` 1:1. Managed automatically on signup via database triggers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, FK -> auth.users(id) ON DELETE CASCADE` | User Auth UUID |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | User given name |
| `last_name` | `VARCHAR(100)` | `NOT NULL` | User surname |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Contact email |
| `phone_number`| `VARCHAR(30)` | | Contact number |
| `city` | `VARCHAR(100)` | | Home city |
| `country` | `VARCHAR(100)` | | Home country |
| `bio` | `TEXT` | | User biography |
| `avatar_url` | `TEXT` | | Profile avatar image URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record update timestamp |

---

### 2. `public.cities`
Searchable destination catalog.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | City identifier |
| `name` | `VARCHAR(150)` | `NOT NULL` | Destination city name |
| `country` | `VARCHAR(100)` | `NOT NULL` | Destination country |
| `state_region`| `VARCHAR(100)` | | State or province |
| `description` | `TEXT` | | City overview & travel highlights |
| `image_url` | `TEXT` | | City banner / card image |
| `latitude` | `NUMERIC(9,6)` | | Geo latitude |
| `longitude` | `NUMERIC(9,6)` | | Geo longitude |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp |

*Constraint:* `UNIQUE (name, country, state_region)`

---

### 3. `public.activities`
Discoverable activities catalog per destination.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Activity identifier |
| `city_id` | `UUID` | `NOT NULL, FK -> cities(id) ON DELETE CASCADE` | Destination city reference |
| `name` | `VARCHAR(200)` | `NOT NULL` | Activity title |
| `description` | `TEXT` | | Detailed description |
| `category` | `VARCHAR(50)` | `NOT NULL` | Category (`culture`, `nature`, `food`, etc.) |
| `estimated_cost`| `NUMERIC(10,2)`| `NOT NULL DEFAULT 0.00, CHECK >= 0` | Cost in USD |
| `duration_minutes`| `INTEGER` | `CHECK > 0` | Estimated duration in minutes |
| `image_url` | `TEXT` | | Activity thumbnail |

---

### 4. `public.trips`
User-owned travel itineraries.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Trip identifier |
| `user_id` | `UUID` | `NOT NULL, FK -> profiles(id) ON DELETE CASCADE` | Trip owner |
| `title` | `VARCHAR(255)` | `NOT NULL` | Trip name |
| `description` | `TEXT` | | Overview / traveler notes |
| `start_date` | `DATE` | `NOT NULL` | Trip departure date |
| `end_date` | `DATE` | `NOT NULL` | Trip return date |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'upcoming'` | `'upcoming'`, `'ongoing'`, `'completed'`, `'planning'` |
| `visibility` | `VARCHAR(20)` | `NOT NULL DEFAULT 'private'` | `'private'`, `'public'`, `'shared'` |
| `overall_budget`| `NUMERIC(12,2)`| `DEFAULT 0.00, CHECK >= 0` | Target overall budget |
| `cover_image_url`| `TEXT` | | Hero cover image |

*Constraints:* `CHECK (start_date <= end_date)`

---

### 5. `public.trip_sections`
Ordered stops/legs within a multi-city trip.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Section identifier |
| `trip_id` | `UUID` | `NOT NULL, FK -> trips(id) ON DELETE CASCADE` | Parent trip |
| `city_id` | `UUID` | `NOT NULL, FK -> cities(id) ON DELETE RESTRICT` | Destination stop |
| `section_order`| `INTEGER` | `NOT NULL, CHECK >= 1` | Leg order in itinerary (1, 2, 3...) |
| `start_date` | `DATE` | `NOT NULL` | Section arrival date |
| `end_date` | `DATE` | `NOT NULL` | Section departure date |
| `section_budget`| `NUMERIC(12,2)`| `DEFAULT 0.00, CHECK >= 0` | Allocated leg budget |
| `notes` | `TEXT` | | Transfer / hotel notes |

*Constraints:* `UNIQUE (trip_id, section_order)`, `CHECK (start_date <= end_date)`

---

### 6. `public.days`
Individual calendar days within a trip section.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Day identifier |
| `section_id` | `UUID` | `NOT NULL, FK -> trip_sections(id) ON DELETE CASCADE` | Parent section |
| `date` | `DATE` | `NOT NULL` | Calendar date |
| `day_number` | `INTEGER` | `NOT NULL, CHECK >= 1` | Day sequence within section (1, 2, 3...) |
| `notes` | `TEXT` | | Day agenda notes |

*Constraints:* `UNIQUE (section_id, day_number)`, `UNIQUE (section_id, date)`

---

### 7. `public.day_activities`
Scheduled activities assigned to a specific day.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Scheduled activity ID |
| `day_id` | `UUID` | `NOT NULL, FK -> days(id) ON DELETE CASCADE` | Scheduled day |
| `activity_id` | `UUID` | `NOT NULL, FK -> activities(id) ON DELETE RESTRICT` | Master activity |
| `activity_order`| `INTEGER` | `NOT NULL, CHECK >= 1` | Schedule sequence (1st, 2nd, 3rd...) |
| `planned_time` | `TIME` | | Target start time (e.g. `10:00:00`) |
| `notes` | `TEXT` | | Custom traveler notes / bookings |
| `expense_amount`| `NUMERIC(10,2)`| `DEFAULT 0.00, CHECK >= 0` | Planned / actual cost |

*Constraint:* `UNIQUE (day_id, activity_order)`

---

### 8. `public.budget_items`
Hierarchical expenses tracked at Trip, Section, or Day level.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Expense item ID |
| `trip_id` | `UUID` | `NOT NULL, FK -> trips(id) ON DELETE CASCADE` | Parent trip |
| `section_id` | `UUID` | `FK -> trip_sections(id) ON DELETE CASCADE` | Optional section assignment |
| `day_id` | `UUID` | `FK -> days(id) ON DELETE CASCADE` | Optional day assignment |
| `category` | `VARCHAR(50)` | `NOT NULL` | `'transport'`, `'accommodation'`, `'food'`, `'activity'`, `'entry_fee'`, `'shopping'`, `'other'` |
| `description` | `VARCHAR(255)` | `NOT NULL` | Expense description |
| `amount` | `NUMERIC(10,2)`| `NOT NULL, CHECK >= 0` | Expense amount in USD |

---

### 9. `public.community_posts`
Community feed tab entries.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Post identifier |
| `user_id` | `UUID` | `NOT NULL, FK -> profiles(id) ON DELETE CASCADE` | Author user |
| `trip_id` | `UUID` | `FK -> trips(id) ON DELETE SET NULL` | Linked trip (optional) |
| `activity_id` | `UUID` | `FK -> activities(id) ON DELETE SET NULL` | Linked activity (optional) |
| `title` | `VARCHAR(255)` | `NOT NULL` | Post title |
| `content` | `TEXT` | `NOT NULL` | Post story / tips |
| `image_url` | `TEXT` | | Shared media image |
| `likes_count` | `INTEGER` | `NOT NULL DEFAULT 0, CHECK >= 0` | Engagement likes counter |

---

### 10. `public.shared_trips`
Secure read-only trip sharing links.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Share record ID |
| `trip_id` | `UUID` | `NOT NULL, FK -> trips(id) ON DELETE CASCADE` | Target trip |
| `shared_by` | `UUID` | `NOT NULL, FK -> profiles(id) ON DELETE CASCADE` | User sharing the trip |
| `share_token` | `VARCHAR(64)` | `NOT NULL, UNIQUE` | Unique sharing URL slug |
| `is_public` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Read-only public switch |
| `expires_at` | `TIMESTAMPTZ` | | Optional link expiry date |

---

## 3. Referential Integrity & Cascade Rules

| Child Entity | Parent Entity | On Delete Action | Rationale |
|---|---|---|---|
| `profiles` | `auth.users` | `CASCADE` | Deleting an auth user removes the application profile. |
| `trips` | `profiles` | `CASCADE` | Deleting user cleans up their personal trips. |
| `trip_sections` | `trips` | `CASCADE` | Itinerary legs are owned by the trip. |
| `trip_sections` | `cities` | `RESTRICT` | Master city catalog entries cannot be deleted if referenced in active itineraries. |
| `days` | `trip_sections` | `CASCADE` | Days belong strictly to their section. |
| `day_activities` | `days` | `CASCADE` | Scheduled activities belong strictly to that day. |
| `day_activities` | `activities` | `RESTRICT` | Master catalog activities cannot be removed if in active itineraries. |
| `budget_items` | `trips` / `sections` / `days` | `CASCADE` | Expenses are cleanly cleaned up when parent itinerary components are deleted. |
| `community_posts` | `profiles` | `CASCADE` | Author removal removes their posts. |
| `community_posts` | `trips` / `activities` | `SET NULL` | Preserves community discussion and tips even if the author later deletes their trip. |
| `shared_trips` | `trips` | `CASCADE` | Removing trip invalidates share links. |

---

## 4. Budget Aggregation Views

Calculated dynamically in PostgreSQL without caching or redundant storage:

1. **`v_trip_budget_summary`**:
   Computes `overall_budget`, `total_expenses`, `remaining_budget`, and `expense_items_count` per trip.
2. **`v_section_budget_summary`**:
   Computes `section_budget`, `total_expenses`, and `remaining_budget` per section.
3. **`v_day_budget_summary`**:
   Computes daily total spending breakdown for each calendar day.

---

## 5. Calendar Query Strategy

To retrieve all trips overlapping any calendar viewport `[p_start_date, p_end_date]`:

```sql
-- Built-in stored function
SELECT * FROM public.get_user_calendar_trips(
    p_user_id => 'u1111111-1111-1111-1111-111111111111',
    p_start_date => '2026-04-01',
    p_end_date => '2026-04-30'
);
```

This uses the index on `(user_id, start_date, end_date)` to instantly evaluate:
`start_date <= p_end_date AND end_date >= p_start_date`

---

## 6. Row Level Security (RLS) & Role-Based Access Control

### User Roles
* `profiles.role` column supports `'user'`, `'admin'`, `'moderator'` (Default: `'user'`).
* `public.is_admin()` helper function verifies admin claims or service-role context.

| Table | Anonymous / General User | Authenticated Owner | Admin Role |
|---|---|---|---|
| `profiles` | Read-only (`SELECT`) | `UPDATE` own profile (`auth.uid() = id`) | Full user management |
| `cities` | Read-only (`SELECT`) | Read-only | Full CRUD (`INSERT/UPDATE/DELETE`) |
| `activities` | Read-only (`SELECT`) | Read-only | Full CRUD (`INSERT/UPDATE/DELETE`) |
| `trips` | View if `public` or via `shared_trips` token | Full CRUD on own trips (`auth.uid() = user_id`) | Platform inspection |
| `trip_sections` | View if parent trip is accessible | Full CRUD if owner of parent trip | Platform inspection |
| `days` | View if parent trip is accessible | Full CRUD if owner of parent trip | Platform inspection |
| `day_activities`| View if parent trip is accessible | Full CRUD if owner of parent trip | Platform inspection |
| `budget_items` | View if parent trip is accessible | Full CRUD if owner of parent trip | Platform inspection |
| `community_posts`| Read-only (`SELECT`) | Full CRUD on own posts (`auth.uid() = user_id`) | Can delete / moderate any post |
| `shared_trips` | Read valid public tokens | Full CRUD on own share links (`auth.uid() = shared_by`) | Management access |

---

## 7. Admin Dashboard Analytics Views

The database provides 4 pre-computed aggregation views for the Admin Dashboard:

1. **`v_admin_platform_overview`**:
   * Total registered users, total trips, trip breakdown by status (`upcoming`, `ongoing`, `completed`, `planning`).
   * Total financial volume: `total_budget_allocated` vs. `total_expenses_logged`.
   * Catalog totals: `total_cities_cataloged`, `total_activities_cataloged`.
   * Social engagement: `total_community_posts`, `total_community_likes`.

2. **`v_admin_popular_destinations`**:
   * Ranks cities by total trip sections and unique travelers visiting.

3. **`v_admin_popular_activities`**:
   * Ranks activities by times scheduled in traveler itineraries.

4. **`v_admin_user_activity`**:
   * User directory with total trips planned, total travel spend, and posts published.

---

## 7. Migration & Seed Instructions

### Prerequisites
* Node.js v18+
* PostgreSQL client tools or npm

### Setup Steps
1. Navigate to the database directory:
   ```bash
   cd database
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run migrations:
   ```bash
   npm run migrate
   ```
4. Seed realistic travel data:
   ```bash
   npm run seed
   ```
5. Run comprehensive validation test suite:
   ```bash
   npm run validate
   ```

Or run all in one command:
```bash
npm run db:setup
```

---

## 8. Seed Data Catalog

* **10 Indian Traveler Profiles**:
  * Harshit Kumar (`harshit@pathpilot.dev` - Bengaluru)
  * Aarav Sharma (`aarav.sharma@pathpilot.dev` - New Delhi)
  * Ananya Iyer (`ananya.iyer@pathpilot.dev` - Chennai)
  * Rohan Verma (`rohan.verma@pathpilot.dev` - Mumbai)
  * Priyadarshini Sen (`priya.sen@pathpilot.dev` - Kolkata)
  * Vikram Malhotra (`vikram.malhotra@pathpilot.dev` - Hyderabad)
  * Neha Kapoor (`neha.kapoor@pathpilot.dev` - Chandigarh)
  * Aditya Nair (`aditya.nair@pathpilot.dev` - Kochi)
  * Tanvi Deshmukh (`tanvi.deshmukh@pathpilot.dev` - Pune)
  * Kabir Mehta (`kabir.mehta@pathpilot.dev` - Ahmedabad)

* **20+ Global & National Destinations**:
  * *National*: Jaipur, Varanasi, Manali, Goa, Kochi, Leh Ladakh, Udaipur, Rishikesh, Amritsar, Agra, Darjeeling, Mumbai, Bengaluru.
  * *International*: Tokyo, Kyoto, Paris, Rome, Bali, New York City, Dubai, Singapore, Bangkok, London, Zurich, Phuket, Sydney.

* **60+ Curated Activities**: Spanning Culture, Nature, Food, Adventure, Sightseeing, Shopping, and Entertainment.

* **9 Detailed Multi-City Itineraries**:
  1. *Japan Spring Blossom: Tokyo & Kyoto* (Harshit Kumar)
  2. *Royal Rajasthan & Spiritual Kashi: Jaipur to Varanasi* (Aarav Sharma)
  3. *Coastal Serenity: Fort Kochi Backwaters to Sunlit Goa* (Ananya Iyer)
  4. *Himalayan Odyssey: Manali Alpine Valleys to Pangong Lake* (Rohan Verma)
  5. *Arabian Luxury: Dubai Marina & Red Dune Safari* (Vikram Malhotra)
  6. *Ganga Yoga & Mughal Wonders: Rishikesh to Agra* (Neha Kapoor)
  7. *Venice of the East & Pink City: Udaipur to Jaipur* (Kabir Mehta)
  8. *Swiss Alpine Wonderland: Zurich to Jungfraujoch Top of Europe* (Aditya Nair)
  9. *London Heritage & Thames Vistas: Tower Bridge to Borough Market* (Tanvi Deshmukh)

* **10 Community Stories & 9 Public Share Links.**

### Environment Variables
```env
DATABASE_URL=postgresql://postgres:PathPilot@1234@db.emqevuuumwkbpvdbtavf.supabase.co:5432/postgres
```

### Example Backend Service Query Patterns

#### 1. Fetch User Dashboard Trips (Grouped by Status)
```javascript
const { rows } = await db.query(
  `SELECT * FROM public.trips 
   WHERE user_id = $1 
   ORDER BY start_date ASC`,
  [userId]
);
// Group into: upcoming, ongoing, completed
```

#### 2. Fetch Complete Nested Itinerary for a Trip
```javascript
const tripQuery = `
  SELECT 
    t.*,
    COALESCE(
      json_agg(
        json_build_object(
          'id', ts.id,
          'city_id', ts.city_id,
          'city_name', c.name,
          'city_country', c.country,
          'section_order', ts.section_order,
          'start_date', ts.start_date,
          'end_date', ts.end_date,
          'section_budget', ts.section_budget
        ) ORDER BY ts.section_order
      ) FILTER (WHERE ts.id IS NOT NULL), '[]'
    ) AS sections
  FROM public.trips t
  LEFT JOIN public.trip_sections ts ON ts.trip_id = t.id
  LEFT JOIN public.cities c ON c.id = ts.city_id
  WHERE t.id = $1 AND (t.user_id = $2 OR t.visibility = 'public')
  GROUP BY t.id;
`;
```

#### 3. Fetch Trip Budget Summary
```javascript
const { rows } = await db.query(
  `SELECT * FROM public.v_trip_budget_summary WHERE trip_id = $1`,
  [tripId]
);
```

#### 4. Fetch Public Shared Trip by Share Token
```javascript
const { rows } = await db.query(
  `SELECT t.*, st.share_token, st.expires_at 
   FROM public.shared_trips st
   JOIN public.trips t ON t.id = st.trip_id
   WHERE st.share_token = $1 
     AND st.is_public = true 
     AND (st.expires_at IS NULL OR st.expires_at > NOW())`,
  [token]
);
```
