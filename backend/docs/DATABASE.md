# PathPilot PostgreSQL Database Architecture & Schema Documentation

## Overview

The PathPilot backend connects to a real Supabase-hosted PostgreSQL instance via direct connection pool using the native `pg` package (`Pool` and `Client`). The system architecture preserves a clean, modular, and parameterized repository pattern with zero mock dependencies in production.

---

## 1. Connection & Configuration

- **Connection Pool**: `src/config/database.js` manages pool lifecycles, health probes, transaction blocks, and client release semantics.
- **Connection URI**: Loaded securely from the `DATABASE_URL` environment variable.
- **SSL Configuration**: Automatically sets `rejectUnauthorized: false` for cloud-hosted environments (Supabase/AWS RDS/Railway/Render).
- **Date Handling**: Configured with `pg.types.setTypeParser(1082, (val) => val)` to parse PostgreSQL `DATE` OID 1082 directly as raw ISO `YYYY-MM-DD` strings, avoiding timezone shifts.

---

## 2. Table Schemas & Relational Models

### 2.1 Core Identity & Profiles
- **`auth.users`** (Supabase Auth internal): Stores credentials (`encrypted_password`), primary emails, authentication timestamps.
- **`public.profiles`**: Synchronized user profiles.
  - `id` (`UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`)
  - `first_name` (`VARCHAR(100)`), `last_name` (`VARCHAR(100)`)
  - `email` (`VARCHAR(255) UNIQUE NOT NULL`)
  - `phone_number` (`VARCHAR(50)`), `city` (`VARCHAR(100)`), `country` (`VARCHAR(100)`), `bio` (`TEXT`), `avatar_url` (`TEXT`)
  - `home_currency` (`VARCHAR(10) DEFAULT 'USD'`)
  - `preferences` (`JSONB DEFAULT '{"interests":[],"preferredCountries":[],"budgetLevel":"MEDIUM"}'`)
  - `is_blocked` (`BOOLEAN DEFAULT false`)
  - `role` (`VARCHAR(50) DEFAULT 'user'`)
  - `created_at`, `updated_at` (`TIMESTAMPTZ DEFAULT now()`)

### 2.2 Geography & Activity Catalog
- **`public.cities`**: Master destination catalog.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `name` (`VARCHAR(150) NOT NULL`), `country` (`VARCHAR(100) NOT NULL`), `state_region` (`VARCHAR(100)`)
  - `description` (`TEXT`), `image_url` (`TEXT`), `latitude` (`NUMERIC`), `longitude` (`NUMERIC`), `popularity` (`INT DEFAULT 90`)
- **`public.activities`**: Master catalog of curated destination experiences.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `city_id` (`UUID REFERENCES public.cities(id) ON DELETE CASCADE`)
  - `name` (`VARCHAR(255) NOT NULL`), `description` (`TEXT`), `category` (`VARCHAR(50)`), `estimated_cost` (`NUMERIC`), `duration_minutes` (`INT`), `popularity` (`INT DEFAULT 85`), `image_url` (`TEXT`)

### 2.3 Trip Itinerary & Schedule
- **`public.trips`**: Root trip entities.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `user_id` (`UUID REFERENCES public.profiles(id) ON DELETE CASCADE`)
  - `name` (`VARCHAR(255) NOT NULL`), `description` (`TEXT`), `cover_photo` (`TEXT`)
  - `start_date` (`DATE NOT NULL`), `end_date` (`DATE NOT NULL`)
  - `total_budget` (`NUMERIC`), `visibility` (`VARCHAR(50) DEFAULT 'PRIVATE'`)
  - `created_at`, `updated_at` (`TIMESTAMPTZ DEFAULT now()`)
- **`public.trip_sections`**: Multi-city trip segments.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `trip_id` (`UUID REFERENCES public.trips(id) ON DELETE CASCADE`)
  - `city_id` (`UUID REFERENCES public.cities(id) ON DELETE CASCADE`)
  - `section_order` (`INT NOT NULL`), `start_date` (`DATE NOT NULL`), `end_date` (`DATE NOT NULL`)
  - `section_budget` (`NUMERIC`), `budget` (`NUMERIC`), `notes` (`TEXT`)
- **`public.trip_days`**: Auto-generated calendar days.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `trip_id` (`UUID REFERENCES public.trips(id) ON DELETE CASCADE`)
  - `section_id` (`UUID REFERENCES public.trip_sections(id) ON DELETE CASCADE`)
  - `day_number` (`INT NOT NULL`), `date` (`DATE NOT NULL`)
- **`public.day_activities`**: Scheduled activities on specific trip days.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `day_id` (`UUID REFERENCES public.trip_days(id) ON DELETE CASCADE`)
  - `activity_id` (`UUID REFERENCES public.activities(id) ON DELETE CASCADE`)
  - `activity_order` (`INT NOT NULL`), `planned_time` (`TIME`), `end_time` (`TIME`)
  - `expense_amount` (`NUMERIC`), `notes` (`TEXT`)

### 2.4 Expenses & Financial Engine
- **`public.budget_items`**: Individual trip expense line items.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `trip_id` (`UUID REFERENCES public.trips(id) ON DELETE CASCADE`)
  - `section_id` (`UUID REFERENCES public.trip_sections(id) ON DELETE SET NULL`)
  - `day_id` (`UUID REFERENCES public.trip_days(id) ON DELETE SET NULL`)
  - `category` (`VARCHAR(50) NOT NULL`), `description` (`VARCHAR(255) NOT NULL`), `amount` (`NUMERIC NOT NULL`)
- **`public.shared_expenses`**: Multi-collaborator shared expenses.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `trip_id` (`UUID REFERENCES public.trips(id) ON DELETE CASCADE`)
  - `paid_by` (`UUID REFERENCES public.profiles(id) ON DELETE CASCADE`)
  - `title` (`VARCHAR(255)`), `category` (`VARCHAR(50)`), `amount` (`NUMERIC NOT NULL`), `split_type` (`VARCHAR(50) NOT NULL`)
- **`public.shared_expense_splits`**: Individual collaborator split portions.
  - `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`)
  - `shared_expense_id` (`UUID REFERENCES public.shared_expenses(id) ON DELETE CASCADE`)
  - `user_id` (`UUID REFERENCES public.profiles(id) ON DELETE CASCADE`)
  - `amount` (`NUMERIC NOT NULL`), `percentage` (`NUMERIC`), `shares` (`INT`), `is_settled` (`BOOLEAN DEFAULT false`)

### 2.5 Collaboration & Activity Feeds
- **`public.trip_collaborators`**: Multi-user permissions (`OWNER`, `EDITOR`, `VIEWER`).
- **`public.activity_logs`**: Chronological audit trail of user and collaborator actions.
- **`public.notifications`**: Real-time alert feed (budget warnings, trip invites, role updates).
- **`public.trip_shares`**: Public sharing tokens with expiration controls.
- **`public.community_posts`**: Social feed for sharing itineraries publicly.

### 2.6 Templates & Pre-trip Readiness
- **`public.trip_templates`**: Curated reusable itineraries.
- **`public.template_favorites`**: User-saved favorite templates.
- **`public.packing_items`**: Smart categorized packing checklist with packed status.
- **`public.travel_documents`**: Pre-trip document management with verification status.
- **`public.trip_preparation_tasks`**: Preparation checklist items with due dates and assignments.

---

## 3. Database Migration & Seeding CLI

```bash
# Execute additive schema migrations statement by statement
npm run db:migrate

# Seed baseline users, cities, and curated activities
npm run db:seed

# Verify complete end-to-end integration test suite
npm test
```
