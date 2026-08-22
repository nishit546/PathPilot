-- ============================================================================
-- Migration: 003_indexes.sql
-- Description: Performance, search, and foreign-key indexing
-- ============================================================================

-- 1. Profiles & Users Indexes
-- Speeds up profile lookups by email and created_at
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 2. Cities Search Indexes
-- Speeds up city search by name and country
CREATE INDEX IF NOT EXISTS idx_cities_name_country ON public.cities(name, country);
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country);

-- 3. Activities Search & Filter Indexes
-- Speeds up activity discovery per city, filtered by category and sorted/filtered by cost
CREATE INDEX IF NOT EXISTS idx_activities_city_id ON public.activities(city_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_city_category_cost ON public.activities(city_id, category, estimated_cost);
CREATE INDEX IF NOT EXISTS idx_activities_cost ON public.activities(estimated_cost);

-- 4. Trips Query & Dashboard Indexes
-- Optimizes PRD status grouping: Ongoing, Upcoming, Completed for a user's dashboard
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON public.trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_user_dates ON public.trips(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trips_start_end_date ON public.trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trips_visibility ON public.trips(visibility);

-- 5. Trip Sections Ordered Retrieval
-- Optimizes deterministic sequence retrieval of itinerary legs
CREATE INDEX IF NOT EXISTS idx_trip_sections_trip_order ON public.trip_sections(trip_id, section_order);
CREATE INDEX IF NOT EXISTS idx_trip_sections_city_id ON public.trip_sections(city_id);
CREATE INDEX IF NOT EXISTS idx_trip_sections_dates ON public.trip_sections(start_date, end_date);

-- 6. Days Sequence Indexes
-- Speeds up sequential loading of days within a section and calendar date mapping
CREATE INDEX IF NOT EXISTS idx_days_section_day_num ON public.days(section_id, day_number);
CREATE INDEX IF NOT EXISTS idx_days_date ON public.days(date);

-- 7. Day Activities Ordered Timeline Indexes
-- Speeds up building the daily timeline of activities in deterministic order
CREATE INDEX IF NOT EXISTS idx_day_activities_day_order ON public.day_activities(day_id, activity_order);
CREATE INDEX IF NOT EXISTS idx_day_activities_activity_id ON public.day_activities(activity_id);

-- 8. Budget Items Aggregation Indexes
-- Optimizes fast grouping and sum calculations across trips, sections, and days
CREATE INDEX IF NOT EXISTS idx_budget_items_trip_id ON public.budget_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_section_id ON public.budget_items(section_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_day_id ON public.budget_items(day_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category);

-- 9. Community Posts Feed Indexes
-- Optimizes the community feed sorted chronologically and filtered by author/trip
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_trip_id ON public.community_posts(trip_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_activity_id ON public.community_posts(activity_id);

-- 10. Shared Trips Token Index
-- Fast O(1) lookup for public share tokens
CREATE INDEX IF NOT EXISTS idx_shared_trips_token ON public.shared_trips(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_trips_trip_id ON public.shared_trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_shared_trips_shared_by ON public.shared_trips(shared_by);
