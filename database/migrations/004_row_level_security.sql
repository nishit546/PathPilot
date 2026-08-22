-- ============================================================================
-- Migration: 004_row_level_security.sql
-- Description: Row Level Security (RLS) policies for user data privacy and sharing
-- ============================================================================

-- 1. Enable RLS on all public application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. PROFILES POLICIES
-- Anyone can view public profile details (for author attribution, community feed)
-- Users can only modify their own profile
-- ============================================================================
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
ON public.profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. CITIES & ACTIVITIES (Public Discovery Catalog)
-- Read-only for general users; mutating requires service_role
-- ============================================================================
DROP POLICY IF EXISTS "Cities are readable by all users" ON public.cities;
CREATE POLICY "Cities are readable by all users"
ON public.cities FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Activities are readable by all users" ON public.activities;
CREATE POLICY "Activities are readable by all users"
ON public.activities FOR SELECT
USING (true);

-- ============================================================================
-- 4. TRIPS POLICIES
-- Owners have full CRUD. Public trips and shared trips are readable.
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own, public, or shared trips" ON public.trips;
CREATE POLICY "Users can view own, public, or shared trips"
ON public.trips FOR SELECT
USING (
    auth.uid() = user_id
    OR visibility = 'public'
    OR EXISTS (
        SELECT 1 FROM public.shared_trips st
        WHERE st.trip_id = trips.id
          AND st.is_public = true
          AND (st.expires_at IS NULL OR st.expires_at > NOW())
    )
);

DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
CREATE POLICY "Users can create their own trips"
ON public.trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trips" ON public.trips;
CREATE POLICY "Users can update their own trips"
ON public.trips FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trips" ON public.trips;
CREATE POLICY "Users can delete their own trips"
ON public.trips FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 5. TRIP SECTIONS POLICIES
-- Access inherited from parent trip ownership / visibility
-- ============================================================================
DROP POLICY IF EXISTS "View sections if trip is viewable" ON public.trip_sections;
CREATE POLICY "View sections if trip is viewable"
ON public.trip_sections FOR SELECT
USING (
    EXISTS (
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

DROP POLICY IF EXISTS "Manage sections only if owner of parent trip" ON public.trip_sections;
CREATE POLICY "Manage sections only if owner of parent trip"
ON public.trip_sections FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_sections.trip_id
          AND t.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_sections.trip_id
          AND t.user_id = auth.uid()
    )
);

-- ============================================================================
-- 6. DAYS POLICIES
-- Access inherited from parent section -> trip
-- ============================================================================
DROP POLICY IF EXISTS "View days if parent trip is viewable" ON public.days;
CREATE POLICY "View days if parent trip is viewable"
ON public.days FOR SELECT
USING (
    EXISTS (
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

DROP POLICY IF EXISTS "Manage days only if owner of parent trip" ON public.days;
CREATE POLICY "Manage days only if owner of parent trip"
ON public.days FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.trip_sections ts
        JOIN public.trips t ON t.id = ts.trip_id
        WHERE ts.id = days.section_id
          AND t.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trip_sections ts
        JOIN public.trips t ON t.id = ts.trip_id
        WHERE ts.id = days.section_id
          AND t.user_id = auth.uid()
    )
);

-- ============================================================================
-- 7. DAY ACTIVITIES POLICIES
-- Access inherited from parent day -> section -> trip
-- ============================================================================
DROP POLICY IF EXISTS "View day activities if parent trip is viewable" ON public.day_activities;
CREATE POLICY "View day activities if parent trip is viewable"
ON public.day_activities FOR SELECT
USING (
    EXISTS (
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

DROP POLICY IF EXISTS "Manage day activities only if owner of parent trip" ON public.day_activities;
CREATE POLICY "Manage day activities only if owner of parent trip"
ON public.day_activities FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.days d
        JOIN public.trip_sections ts ON ts.id = d.section_id
        JOIN public.trips t ON t.id = ts.trip_id
        WHERE d.id = day_activities.day_id
          AND t.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.days d
        JOIN public.trip_sections ts ON ts.id = d.section_id
        JOIN public.trips t ON t.id = ts.trip_id
        WHERE d.id = day_activities.day_id
          AND t.user_id = auth.uid()
    )
);

-- ============================================================================
-- 8. BUDGET ITEMS POLICIES
-- Private to trip owner, or readable if trip is explicitly shared/public
-- ============================================================================
DROP POLICY IF EXISTS "View budget items if parent trip is viewable" ON public.budget_items;
CREATE POLICY "View budget items if parent trip is viewable"
ON public.budget_items FOR SELECT
USING (
    EXISTS (
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

DROP POLICY IF EXISTS "Manage budget items only if owner of parent trip" ON public.budget_items;
CREATE POLICY "Manage budget items only if owner of parent trip"
ON public.budget_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = budget_items.trip_id
          AND t.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = budget_items.trip_id
          AND t.user_id = auth.uid()
    )
);

-- ============================================================================
-- 9. COMMUNITY POSTS POLICIES
-- Posts are readable by everyone; only authors can mutate/delete their posts
-- ============================================================================
DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Community posts are viewable by everyone"
ON public.community_posts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create community posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create community posts"
ON public.community_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can update own community posts" ON public.community_posts;
CREATE POLICY "Authors can update own community posts"
ON public.community_posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can delete own community posts" ON public.community_posts;
CREATE POLICY "Authors can delete own community posts"
ON public.community_posts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 10. SHARED TRIPS POLICIES
-- Public access for unexpired tokens; creation/deletion restricted to owner
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view valid shared trip tokens" ON public.shared_trips;
CREATE POLICY "Anyone can view valid shared trip tokens"
ON public.shared_trips FOR SELECT
USING (
    is_public = true
    OR auth.uid() = shared_by
);

DROP POLICY IF EXISTS "Users can create share records for their trips" ON public.shared_trips;
CREATE POLICY "Users can create share records for their trips"
ON public.shared_trips FOR INSERT
WITH CHECK (
    auth.uid() = shared_by
    AND EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = shared_trips.trip_id
          AND t.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update own shared trip records" ON public.shared_trips;
CREATE POLICY "Users can update own shared trip records"
ON public.shared_trips FOR UPDATE
USING (auth.uid() = shared_by)
WITH CHECK (auth.uid() = shared_by);

DROP POLICY IF EXISTS "Users can delete own shared trip records" ON public.shared_trips;
CREATE POLICY "Users can delete own shared trip records"
ON public.shared_trips FOR DELETE
USING (auth.uid() = shared_by);
