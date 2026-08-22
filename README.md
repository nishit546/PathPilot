# 🧭 PathPilot (GlobalTrotter)

> **Every Journey Needs a Pilot.**  
> A modern, personalized, intelligent, and collaborative travel planning platform. Architect end-to-end multi-city itineraries, organize day-wise schedules, track multi-category budgets, explore destinations, share travel logs, and manage the platform via a comprehensive Admin Dashboard.

---

## 📑 Table of Contents

- [🌟 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [📂 Repository Structure](#-repository-structure)
- [🚀 Quick Start & Setup on Any Device](#-quick-start--setup-on-any-device)
- [🛡️ Database & Security Architecture](#️-database--security-architecture)
- [📊 Admin Dashboard (GlobalTrotter) Views](#-admin-dashboard-globaltrotter-views)
- [👥 Seed Accounts for Testing](#-seed-accounts-for-testing)
- [📜 License](#-license)

---

## 🌟 Features

### 1. 🔐 Authentication & Profile Management
- Secure user registration and authentication via **Supabase Auth**.
- Automated profile creation in `public.profiles` via database triggers.
- Role-based authorization (`user`, `admin`, `moderator`).

### 2. 🗺️ Multi-City Trip Planning
- Create multi-city trips with customizable budgets, descriptions, and cover images.
- **Dynamic Trip Status**: Automatically calculates `upcoming`, `ongoing`, or `completed` based on real-time dates.
- Filter, search, and sort trips by status, date, or name.

### 3. 🗓️ Itinerary Sections & Automated Day Schedules
- Divide trips into sequential sections/stops (e.g., Tokyo $\to$ Kyoto or Jaipur $\to$ Varanasi).
- Daily calendar breakdown per section with scheduled activities and time slots.

### 4. 💰 Smart Budgeting & Expense Tracking
- Pre-computed database views for real-time budget rollups (`v_trip_budget_summary`, `v_section_budget_summary`, `v_day_budget_summary`).
- Category breakdowns: `accommodation`, `transport`, `activity`, `food`, `shopping`, `other`.

### 5. 🔍 Destination & Activity Discovery
- Searchable cities database with country, state/region, coordinates, and cover images.
- Searchable activities catalog categorized by culture, adventure, food, sightseeing, shopping, and entertainment.

### 6. 🔗 Public Sharing & Community Feed
- Generate unique share tokens for read-only, public trip sharing (`/share/:token`).
- Community travel experiences feed with photos, activity links, and likes.

### 7. 🛡️ Admin Dashboard & Analytics (GlobalTrotter)
- **Manage Users**: View all traveler profiles, trip histories, and active/banned status.
- **Popular Cities**: Real-time rankings of top-visited destinations and average stay duration.
- **Popular Activities**: Real-time rankings of most scheduled activities and revenue.
- **User Trends & Analytics**: Pre-computed data for Pie Charts, Line Graphs, and Bar Charts.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Database** | [PostgreSQL 17.6 (Supabase)](https://supabase.com/) | Scalable relational database with RLS policies and aggregation views |
| **Authentication** | [Supabase Auth](https://supabase.com/auth) | Managed authentication with JWT and auto-provisioned profiles |
| **Backend** | [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) | RESTful API server |
| **Frontend** | [React](https://react.dev/) | Dynamic web user interface & Admin Dashboard |

---

## 📂 Repository Structure

```
PathPilot/
├── database/                   # Supabase Database Layer
│   ├── migrations/             # Sequential migration files (001 - 006)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_views_and_functions.sql
│   │   ├── 003_indexes.sql
│   │   ├── 004_row_level_security.sql
│   │   ├── 005_admin_dashboard.sql
│   │   └── 006_admin_dashboard_wireframe_views.sql
│   ├── seed/                   # Curated Indian & Global Seed Data
│   │   ├── 01_cities_activities.sql
│   │   └── 02_demo_trips.sql
│   ├── scripts/                # Database tooling
│   │   ├── migrate.js          # Migration runner (tracks _schema_migrations)
│   │   ├── seed.js             # Seeding runner
│   │   ├── validate.js         # Automated end-to-end test suite
│   │   └── verify_deployment.js# Deployment validation suite
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start & Setup on Any Device

### Prerequisites
* **Node.js** ($\ge$ 18.x) & **npm**
* **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/nishit546/PathPilot.git
cd PathPilot
```

### Step 2: Configure Database Environment
```bash
cd database
```
Create your `.env` file:
* **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
* **macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

Set your Supabase database connection in `.env`:
```env
DATABASE_URL=postgresql://postgres:PathPilot@1234@db.emqevuuumwkbpvdbtavf.supabase.co:5432/postgres
PGSSLMODE=require
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Database Migrations & Seeds
Run the complete automated setup:
```bash
npm run db:setup
```

Or execute individual steps:
```bash
npm run migrate    # Applies migrations (001 -> 006) in exact sequence
npm run seed       # Injects 26 cities, 70 activities, 10 Indian traveler profiles, and 9 trips
npm run validate   # Runs the 8-point automated validation test suite
```

---

## 🛡️ Database & Security Architecture

* **33 Granular Row Level Security (RLS) Policies**: All traveler data is isolated to the owning user (`auth.uid() = user_id`) while allowing public access to destination catalog and shared trips.
* **Auto-Profile Trigger**: When a user registers via `supabase.auth.signUp()`, the PostgreSQL `handle_new_user()` trigger automatically provisions their profile in `public.profiles`.
* **Zero Custom Password Management**: All authentication is handled by Supabase Auth; no plain or hashed passwords exist in the application database.
* **Dynamic Budget Rollup Views**:
  * `v_trip_budget_summary`: Total budget, actual spending, and balance per trip.
  * `v_section_budget_summary`: Leg-by-leg budget vs. expenses.
  * `v_day_budget_summary`: Daily schedule expense breakdowns.

---

## 📊 Admin Dashboard (GlobalTrotter) Views

The database provides pre-computed analytics and management views matching the Admin Dashboard wireframe:

1. **Manage Users Tab**:
   * `v_admin_manage_users`: User directory, roles (`user`, `admin`, `moderator`), active status, total trips, and spending.
   * `v_admin_user_trips_detail`: Deep-dive into all trips planned by any specific traveler.
2. **Popular Cities Tab**:
   * `v_admin_popular_cities`: Rankings by total traveler visits, stay duration, and budget.
3. **Popular Activities Tab**:
   * `v_admin_popular_activities`: Rankings by schedule count and category revenue.
4. **User Trends & Analytics Tab**:
   * `v_admin_analytics_trip_status`: Status breakdown (Pie Chart).
   * `v_admin_analytics_category_breakdown`: Category share (Pie Chart).
   * `v_admin_analytics_monthly_trends`: Monthly traveler & trip growth (Line Graph).
   * `v_admin_analytics_spending_by_country`: Country-level volume (Bar Chart).

---

## 👥 Seed Accounts for Testing

| Name | Role | Email | Password | Home City |
|---|---|---|---|---|
| **Harshit Kumar** | `admin` | `harshit@pathpilot.dev` | `PathPilotPass123!` | Bengaluru, India |
| **Aarav Sharma** | `user` | `aarav.sharma@pathpilot.dev` | `PathPilotPass123!` | New Delhi, India |
| **Ananya Iyer** | `user` | `ananya.iyer@pathpilot.dev` | `PathPilotPass123!` | Chennai, India |
| **Rohan Verma** | `user` | `rohan.verma@pathpilot.dev` | `PathPilotPass123!` | Mumbai, India |
| **Priyadarshini Sen** | `user` | `priya.sen@pathpilot.dev` | `PathPilotPass123!` | Kolkata, India |
| **Vikram Malhotra** | `user` | `vikram.malhotra@pathpilot.dev` | `PathPilotPass123!` | Hyderabad, India |
| **Neha Kapoor** | `user` | `neha.kapoor@pathpilot.dev` | `PathPilotPass123!` | Chandigarh, India |
| **Aditya Nair** | `user` | `aditya.nair@pathpilot.dev` | `PathPilotPass123!` | Kochi, India |
| **Tanvi Deshmukh** | `user` | `tanvi.deshmukh@pathpilot.dev` | `PathPilotPass123!` | Pune, India |
| **Kabir Mehta** | `user` | `kabir.mehta@pathpilot.dev` | `PathPilotPass123!` | Ahmedabad, India |

---

## 📜 License

This project is developed for the Hackathon under the MIT License.
