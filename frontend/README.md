# PathPilot Frontend ✈️

> **The modern client interface for PathPilot.** Built with React 19, TypeScript, Vite, and a custom Vanilla CSS design system.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features & Pages](#-key-features--pages)
- [Architecture & State Management](#-architecture--state-management)
- [Component Structure](#-component-structure)
- [Design System & Styling](#-design-system--styling)
- [Setup & Development](#-setup--development)
- [Production Build](#-production-build)

---

## 🌟 Overview

The **PathPilot Frontend** is designed to provide an ultra-responsive, visually captivating, and seamless travel planning experience. It delivers instant feedback, offline-resilient cache fallbacks, dynamic calendar pill navigation, interactive multi-currency support, and comprehensive admin analytics.

---

## 📱 Key Features & Pages

1. **Auth & Landing Hero (`AuthPage.tsx`)**:
   - Modern split-layout with dynamic floating feature badge boxes (`Tokyo ➔ Paris`, `Budget: ₹75,000`, `15+ Global Cities`, `Instant Cloud Sync`).
   - Quick one-click switchers for demo accounts (Admin, Nishit Traveler, Sam Traveler).

2. **Dashboard (`DashboardPage.tsx`)**:
   - Universal search, grouping (by region, status, year), and sorting controls.
   - Curated top regional selections (Europe, Asia & Pacific, Americas, Middle East, Oceania).
   - Dynamic user trip grid with real-time countdowns.

3. **Itinerary Architect (`ItineraryBuilderPage.tsx`)**:
   - Multi-stop destination sequencer with auto-generated daily schedules.
   - Interactive activity scheduler with time slots, cost estimates, and transit notes.

4. **Trip Details & Financial Hub (`TripDetailsPage.tsx`)**:
   - Resilient multi-request data loader using `Promise.allSettled`.
   - Real-time budget progress bar with category breakdowns and expense logs.
   - One-click public share link generator.

5. **Destination & Activity Explorer (`SearchExplorePage.tsx`)**:
   - Filterable catalog of worldwide destinations by region, budget, and travel vibe.

6. **System Admin Governance Center (`AdminDashboardPage.tsx`)**:
   - Real-time SVG pie chart (Trip Status breakdown), dynamic bar charts (Popular destinations), and user directory with instant block/unblock actions.

---

## 🏗️ Architecture & State Management

```
frontend/src/
├── api/                   # Type-safe API client wrappers (apiClient)
│   ├── adminApi.ts
│   ├── authApi.ts
│   ├── citiesApi.ts
│   ├── expensesApi.ts
│   ├── tripsApi.ts
│   └── client.ts
├── components/            # Reusable UI components
│   ├── auth/              # LoginForm, RegisterForm, DemoUserPicker
│   ├── common/            # ErrorState, EmptyState, Modal, PageLoader, Logo
│   ├── dashboard/         # HeroBanner, SearchToolbar, TopRegionalSelections
│   ├── layout/            # Navbar with active pills, currency & notification bell
│   └── trips/             # CreateTripModal, TripCard
├── context/               # Global state providers
│   ├── AuthContext.tsx    # JWT token persistence, active user profile, login/logout
│   └── TravelContext.tsx  # Trips list, active filters, search keywords, catalog
├── pages/                 # Full-page views
│   ├── AdminDashboardPage.tsx
│   ├── AuthPage.tsx
│   ├── CalendarViewPage.tsx
│   ├── CommunityPage.tsx
│   ├── DashboardPage.tsx
│   ├── ItineraryBuilderPage.tsx
│   ├── SearchExplorePage.tsx
│   ├── TripDetailsPage.tsx
│   └── TripsPage.tsx
├── types/                 # TypeScript interfaces (Trip, City, Activity, Expense...)
└── index.css              # Custom Vanilla CSS Design System & Variables
```

---

## 🎨 Design System & Styling

PathPilot uses a curated Vanilla CSS token design system in `src/index.css`:

```css
:root {
  --primary-flare: #ff5722;        /* Vibrant Travel Orange */
  --primary-hover: #f4511e;
  --secondary-horizon: #0284c7;    /* Deep Sky Blue */
  --bg-canvas: #f8fafc;            /* Clean light SaaS canvas */
  --surface-card: #ffffff;
  --text-primary: #0f172a;         /* High-contrast typography */
  --text-secondary: #475569;
  --border-silver: #e2e8f0;
  --radius-lg: 14px;
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.08);
}
```

---

## ⚡ Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create `.env` if pointing to a non-standard backend URL:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```
*Access the client at `http://localhost:5173`.*

---

## 📦 Production Build

```bash
# Typecheck & bundle with Vite
npm run build

# Preview production build locally
npm run preview
```
