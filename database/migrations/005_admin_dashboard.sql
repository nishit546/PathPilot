-- ============================================================================
-- Migration: 005_admin_dashboard.sql
-- Description: Admin Dashboard support with roles, admin RLS policies,
--              and platform-wide analytics/aggregation views.
-- ============================================================================

-- 1. Add role column to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' 
        CHECK (role IN ('user', 'admin', 'moderator'));
    END IF;
END $$;

-- 2. Designate primary admin profile (Harshit Kumar)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'harshit@pathpilot.dev' OR id = '11111111-1111-1111-1111-111111111111';

-- 3. Security Definer Helper: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Update handle_new_user() trigger to support role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        city,
        country,
        bio,
        avatar_url,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Traveler'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'city',
        NEW.raw_user_meta_data->>'country',
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ADMIN RLS POLICIES FOR CATALOG MANAGEMENT & MODERATION
-- ============================================================================

-- A. Cities Admin Policies
DROP POLICY IF EXISTS "Admins can insert cities" ON public.cities;
CREATE POLICY "Admins can insert cities"
ON public.cities FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update cities" ON public.cities;
CREATE POLICY "Admins can update cities"
ON public.cities FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete cities" ON public.cities;
CREATE POLICY "Admins can delete cities"
ON public.cities FOR DELETE
USING (public.is_admin());

-- B. Activities Admin Policies
DROP POLICY IF EXISTS "Admins can insert activities" ON public.activities;
CREATE POLICY "Admins can insert activities"
ON public.activities FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update activities" ON public.activities;
CREATE POLICY "Admins can update activities"
ON public.activities FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete activities" ON public.activities;
CREATE POLICY "Admins can delete activities"
ON public.activities FOR DELETE
USING (public.is_admin());

-- C. Community Posts Moderation Policy
DROP POLICY IF EXISTS "Authors or admins can delete community posts" ON public.community_posts;
CREATE POLICY "Authors or admins can delete community posts"
ON public.community_posts FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================================
-- 6. ADMIN ANALYTICS & AGGREGATION VIEWS
-- ============================================================================

-- View 1: Platform High-Level Overview
CREATE OR REPLACE VIEW public.v_admin_platform_overview AS
SELECT
    (SELECT COUNT(*) FROM public.profiles) AS total_users,
    (SELECT COUNT(*) FROM public.trips) AS total_trips,
    (SELECT COUNT(*) FROM public.trips WHERE status = 'upcoming') AS upcoming_trips,
    (SELECT COUNT(*) FROM public.trips WHERE status = 'ongoing') AS ongoing_trips,
    (SELECT COUNT(*) FROM public.trips WHERE status = 'completed') AS completed_trips,
    (SELECT COUNT(*) FROM public.trips WHERE status = 'planning') AS planning_trips,
    (SELECT COALESCE(SUM(overall_budget), 0.00) FROM public.trips) AS total_budget_allocated,
    (SELECT COALESCE(SUM(amount), 0.00) FROM public.budget_items) AS total_expenses_logged,
    (SELECT COUNT(*) FROM public.cities) AS total_cities_cataloged,
    (SELECT COUNT(*) FROM public.activities) AS total_activities_cataloged,
    (SELECT COUNT(*) FROM public.community_posts) AS total_community_posts,
    (SELECT COALESCE(SUM(likes_count), 0) FROM public.community_posts) AS total_community_likes;

-- View 2: Popular Destinations
CREATE OR REPLACE VIEW public.v_admin_popular_destinations AS
SELECT
    c.id AS city_id,
    c.name AS city_name,
    c.country,
    c.state_region,
    COUNT(DISTINCT ts.id) AS total_trip_sections,
    COUNT(DISTINCT ts.trip_id) AS total_trips_featured,
    COUNT(DISTINCT t.user_id) AS unique_travelers_visiting,
    COALESCE(SUM(ts.section_budget), 0.00) AS total_section_budget_allocated
FROM public.cities c
LEFT JOIN public.trip_sections ts ON ts.city_id = c.id
LEFT JOIN public.trips t ON t.id = ts.trip_id
GROUP BY c.id, c.name, c.country, c.state_region
ORDER BY total_trip_sections DESC, city_name ASC;

-- View 3: Popular Activities
CREATE OR REPLACE VIEW public.v_admin_popular_activities AS
SELECT
    a.id AS activity_id,
    a.name AS activity_name,
    a.category,
    c.name AS city_name,
    c.country,
    a.estimated_cost,
    COUNT(da.id) AS times_scheduled_in_itineraries,
    COUNT(DISTINCT d.section_id) AS sections_count
FROM public.activities a
JOIN public.cities c ON c.id = a.city_id
LEFT JOIN public.day_activities da ON da.activity_id = a.id
LEFT JOIN public.days d ON d.id = da.day_id
GROUP BY a.id, a.name, a.category, c.name, c.country, a.estimated_cost
ORDER BY times_scheduled_in_itineraries DESC, a.name ASC;

-- View 4: User Activity Breakdown
CREATE OR REPLACE VIEW public.v_admin_user_activity AS
SELECT
    p.id AS user_id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.email,
    p.role,
    p.city AS home_city,
    p.country AS home_country,
    COUNT(DISTINCT t.id) AS total_trips,
    COALESCE(SUM(t.overall_budget), 0.00) AS total_budget_allocated,
    COUNT(DISTINCT cp.id) AS total_posts_published,
    p.created_at AS joined_at
FROM public.profiles p
LEFT JOIN public.trips t ON t.user_id = p.id
LEFT JOIN public.community_posts cp ON cp.user_id = p.id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.role, p.city, p.country, p.created_at
ORDER BY total_trips DESC, p.created_at DESC;
