-- ============================================================================
-- Migration: 006_admin_dashboard_wireframe_views.sql
-- Description: Dedicated views and RLS enhancements matching the GlobalTrotter /
--              PathPilot Admin Dashboard wireframe sections:
--              1. Manage Users & User Trips
--              2. Popular Cities
--              3. Popular Activities
--              4. User Trends and Analytics (Pie, Line, & Bar charts)
-- ============================================================================

-- 1. Add is_active column to profiles for user management actions (suspend/activate)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- ============================================================================
-- 2. ENHANCE RLS: GRANT ADMINS FULL READ & MANAGEMENT ACROSS ALL TRIPS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own, public, or shared trips" ON public.trips;
CREATE POLICY "Users can view own, public, or shared trips"
ON public.trips FOR SELECT
USING (
    auth.uid() = user_id
    OR visibility = 'public'
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.shared_trips st
        WHERE st.trip_id = trips.id
          AND st.is_public = true
          AND (st.expires_at IS NULL OR st.expires_at > NOW())
    )
);

DROP POLICY IF EXISTS "View sections if trip is viewable" ON public.trip_sections;
CREATE POLICY "View sections if trip is viewable"
ON public.trip_sections FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_sections.trip_id
          AND (
              t.user_id = auth.uid()
              OR t.visibility = 'public'
              OR EXISTS (
                  SELECT 1 FROM public.shared_trips st
                  WHERE st.trip_id = t.id
                    AND st.is_public = true
                    AND (st.expires_at IS NULL OR st.expires_at > NOW())
              )
          )
    )
);

DROP POLICY IF EXISTS "View days if parent trip is viewable" ON public.days;
CREATE POLICY "View days if parent trip is viewable"
ON public.days FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.trip_sections ts
        JOIN public.trips t ON t.id = ts.trip_id
        WHERE ts.id = days.section_id
          AND (
              t.user_id = auth.uid()
              OR t.visibility = 'public'
              OR EXISTS (
                  SELECT 1 FROM public.shared_trips st
                  WHERE st.trip_id = t.id
                    AND st.is_public = true
                    AND (st.expires_at IS NULL OR st.expires_at > NOW())
              )
          )
    )
);

DROP POLICY IF EXISTS "View day activities if parent trip is viewable" ON public.day_activities;
CREATE POLICY "View day activities if parent trip is viewable"
ON public.day_activities FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.days d
        JOIN public.trip_sections ts ON ts.id = d.section_id
        JOIN public.trips t ON t.id = ts.trip_id
        WHERE d.id = day_activities.day_id
          AND (
              t.user_id = auth.uid()
              OR t.visibility = 'public'
              OR EXISTS (
                  SELECT 1 FROM public.shared_trips st
                  WHERE st.trip_id = t.id
                    AND st.is_public = true
                    AND (st.expires_at IS NULL OR st.expires_at > NOW())
              )
          )
    )
);

DROP POLICY IF EXISTS "View budget items if parent trip is viewable" ON public.budget_items;
CREATE POLICY "View budget items if parent trip is viewable"
ON public.budget_items FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = budget_items.trip_id
          AND (
              t.user_id = auth.uid()
              OR t.visibility = 'public'
              OR EXISTS (
                  SELECT 1 FROM public.shared_trips st
                  WHERE st.trip_id = t.id
                    AND st.is_public = true
                    AND (st.expires_at IS NULL OR st.expires_at > NOW())
              )
          )
    )
);

-- Admins can update profiles (e.g. change role, deactivate account)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. SECTION 1: MANAGE USERS VIEW
-- Gives admin complete user directory, actions, stats, and trip count
-- ============================================================================
DROP VIEW IF EXISTS public.v_admin_manage_users CASCADE;
CREATE OR REPLACE VIEW public.v_admin_manage_users AS
SELECT
    p.id AS user_id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.first_name,
    p.last_name,
    p.email,
    p.phone_number,
    p.role,
    p.is_active,
    p.city AS home_city,
    p.country AS home_country,
    p.avatar_url,
    p.bio,
    p.created_at AS joined_at,
    COUNT(DISTINCT t.id) AS total_trips_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'upcoming') AS upcoming_trips_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'ongoing') AS ongoing_trips_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_trips_count,
    COALESCE(SUM(t.overall_budget), 0.00) AS total_budget_allocated,
    COALESCE(SUM(b.amount), 0.00) AS total_expenses_spent,
    COUNT(DISTINCT cp.id) AS community_posts_count
FROM public.profiles p
LEFT JOIN public.trips t ON t.user_id = p.id
LEFT JOIN public.budget_items b ON b.trip_id = t.id
LEFT JOIN public.community_posts cp ON cp.user_id = p.id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone_number, p.role, p.is_active, p.city, p.country, p.avatar_url, p.bio, p.created_at
ORDER BY total_trips_count DESC, p.created_at DESC;

-- User Trips Detail (for clicking into a user to inspect all their trips)
DROP VIEW IF EXISTS public.v_admin_user_trips_detail CASCADE;
CREATE OR REPLACE VIEW public.v_admin_user_trips_detail AS
SELECT
    t.id AS trip_id,
    t.user_id,
    p.first_name || ' ' || p.last_name AS user_full_name,
    p.email AS user_email,
    t.title AS trip_title,
    t.description,
    t.start_date,
    t.end_date,
    (t.end_date - t.start_date + 1) AS trip_duration_days,
    t.status,
    t.visibility,
    COALESCE(t.overall_budget, 0.00) AS overall_budget,
    COALESCE(SUM(b.amount), 0.00) AS total_spent,
    COALESCE(t.overall_budget, 0.00) - COALESCE(SUM(b.amount), 0.00) AS remaining_budget,
    COUNT(DISTINCT ts.id) AS total_sections_count,
    COUNT(DISTINCT da.id) AS total_activities_scheduled,
    t.created_at
FROM public.trips t
JOIN public.profiles p ON p.id = t.user_id
LEFT JOIN public.trip_sections ts ON ts.trip_id = t.id
LEFT JOIN public.days d ON d.section_id = ts.id
LEFT JOIN public.day_activities da ON da.day_id = d.id
LEFT JOIN public.budget_items b ON b.trip_id = t.id
GROUP BY t.id, t.user_id, p.first_name, p.last_name, p.email, t.title, t.description, t.start_date, t.end_date, t.status, t.visibility, t.overall_budget, t.created_at
ORDER BY t.start_date DESC;

-- ============================================================================
-- 4. SECTION 2: POPULAR CITIES VIEW
-- Lists popular cities where users are visiting based on user trends
-- ============================================================================
DROP VIEW IF EXISTS public.v_admin_popular_cities CASCADE;
CREATE OR REPLACE VIEW public.v_admin_popular_cities AS
SELECT
    c.id AS city_id,
    c.name AS city_name,
    c.country,
    c.state_region,
    c.image_url,
    c.latitude,
    c.longitude,
    COUNT(DISTINCT ts.id) AS total_visits,
    COUNT(DISTINCT ts.trip_id) AS total_trips_featured,
    COUNT(DISTINCT t.user_id) AS unique_travelers,
    COUNT(DISTINCT ts.id) FILTER (WHERE t.status = 'upcoming' OR t.status = 'ongoing') AS active_and_upcoming_visits,
    COALESCE(ROUND(AVG(ts.end_date - ts.start_date + 1), 1), 0) AS avg_stay_duration_days,
    COALESCE(SUM(ts.section_budget), 0.00) AS total_budget_allocated,
    RANK() OVER (ORDER BY COUNT(DISTINCT ts.id) DESC, c.name ASC) AS popularity_rank
FROM public.cities c
LEFT JOIN public.trip_sections ts ON ts.city_id = c.id
LEFT JOIN public.trips t ON t.id = ts.trip_id
GROUP BY c.id, c.name, c.country, c.state_region, c.image_url, c.latitude, c.longitude
ORDER BY total_visits DESC, c.name ASC;

-- ============================================================================
-- 5. SECTION 3: POPULAR ACTIVITIES VIEW
-- Lists popular activities users are scheduling based on user trends
-- ============================================================================
DROP VIEW IF EXISTS public.v_admin_popular_activities CASCADE;
CREATE OR REPLACE VIEW public.v_admin_popular_activities AS
SELECT
    a.id AS activity_id,
    a.name AS activity_name,
    a.category,
    c.name AS city_name,
    c.country AS city_country,
    a.estimated_cost,
    a.duration_minutes,
    a.image_url,
    COUNT(da.id) AS times_scheduled,
    COUNT(DISTINCT d.section_id) AS unique_trips_scheduled,
    COUNT(DISTINCT t.user_id) AS unique_travelers_doing_activity,
    COALESCE(SUM(da.expense_amount), 0.00) AS total_expense_recorded,
    RANK() OVER (ORDER BY COUNT(da.id) DESC, a.name ASC) AS popularity_rank
FROM public.activities a
JOIN public.cities c ON c.id = a.city_id
LEFT JOIN public.day_activities da ON da.activity_id = a.id
LEFT JOIN public.days d ON d.id = da.day_id
LEFT JOIN public.trip_sections ts ON ts.id = d.section_id
LEFT JOIN public.trips t ON t.id = ts.trip_id
GROUP BY a.id, a.name, a.category, c.name, c.country, a.estimated_cost, a.duration_minutes, a.image_url
ORDER BY times_scheduled DESC, a.name ASC;

-- ============================================================================
-- 6. SECTION 4: USER TRENDS & ANALYTICS VIEWS (CHARTS & GRAPHS)
-- ============================================================================

-- Chart A: Pie Chart Data - Trip Status Breakdown
DROP VIEW IF EXISTS public.v_admin_analytics_trip_status CASCADE;
CREATE OR REPLACE VIEW public.v_admin_analytics_trip_status AS
SELECT
    status,
    COUNT(*) AS count,
    ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM public.trips), 0)) * 100, 1) AS percentage
FROM public.trips
GROUP BY status
ORDER BY count DESC;

-- Chart B: Pie Chart Data - Expense Category Breakdown
DROP VIEW IF EXISTS public.v_admin_analytics_category_breakdown CASCADE;
CREATE OR REPLACE VIEW public.v_admin_analytics_category_breakdown AS
SELECT
    category,
    COUNT(*) AS expense_items_count,
    COALESCE(SUM(amount), 0.00) AS total_amount,
    ROUND((SUM(amount)::NUMERIC / NULLIF((SELECT SUM(amount) FROM public.budget_items), 0)) * 100, 1) AS percentage
FROM public.budget_items
GROUP BY category
ORDER BY total_amount DESC;

-- Chart C: Line Chart Data - Monthly Growth & Planning Trends
DROP VIEW IF EXISTS public.v_admin_analytics_monthly_trends CASCADE;
CREATE OR REPLACE VIEW public.v_admin_analytics_monthly_trends AS
SELECT
    TO_CHAR(DATE_TRUNC('month', t.start_date), 'YYYY-MM') AS month_label,
    TO_CHAR(DATE_TRUNC('month', t.start_date), 'Mon YYYY') AS month_display,
    COUNT(DISTINCT t.id) AS trips_planned,
    COUNT(DISTINCT t.user_id) AS active_travelers,
    COALESCE(SUM(t.overall_budget), 0.00) AS total_budgeted_amount
FROM public.trips t
GROUP BY DATE_TRUNC('month', t.start_date)
ORDER BY DATE_TRUNC('month', t.start_date) ASC;

-- Chart D: Bar Chart Data - Country Popularity & Spending Volume
DROP VIEW IF EXISTS public.v_admin_analytics_spending_by_country CASCADE;
CREATE OR REPLACE VIEW public.v_admin_analytics_spending_by_country AS
SELECT
    c.country,
    COUNT(DISTINCT ts.trip_id) AS trips_count,
    COUNT(DISTINCT t.user_id) AS travelers_count,
    COALESCE(SUM(ts.section_budget), 0.00) AS total_budget_allocated,
    COUNT(DISTINCT c.id) AS unique_cities_visited
FROM public.cities c
JOIN public.trip_sections ts ON ts.city_id = c.id
JOIN public.trips t ON t.id = ts.trip_id
GROUP BY c.country
ORDER BY total_budget_allocated DESC, trips_count DESC;
