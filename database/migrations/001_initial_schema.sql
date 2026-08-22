-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema tables, extensions, constraints, and triggers
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Utility Function: Automatically manage updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. PROFILES (Mirrors Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(30),
    city VARCHAR(100),
    country VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CITIES (Searchable Destinations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL,
    state_region VARCHAR(100),
    description TEXT,
    image_url TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_city_country_region UNIQUE (name, country, state_region)
);

CREATE OR REPLACE TRIGGER set_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ACTIVITIES (City Activities Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INTEGER,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_activity_estimated_cost CHECK (estimated_cost >= 0),
    CONSTRAINT chk_activity_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

CREATE OR REPLACE TRIGGER set_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. TRIPS (User Trips)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    overall_budget NUMERIC(12, 2) DEFAULT 0.00,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trip_dates CHECK (start_date <= end_date),
    CONSTRAINT chk_trip_status CHECK (status IN ('upcoming', 'ongoing', 'completed', 'planning')),
    CONSTRAINT chk_trip_visibility CHECK (visibility IN ('private', 'public', 'shared')),
    CONSTRAINT chk_trip_overall_budget CHECK (overall_budget IS NULL OR overall_budget >= 0)
);

CREATE OR REPLACE TRIGGER set_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. TRIP SECTIONS (Legs / Stops within a Trip)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trip_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
    section_order INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    section_budget NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trip_section_order UNIQUE (trip_id, section_order),
    CONSTRAINT chk_section_order CHECK (section_order >= 1),
    CONSTRAINT chk_section_dates CHECK (start_date <= end_date),
    CONSTRAINT chk_section_budget CHECK (section_budget IS NULL OR section_budget >= 0)
);

CREATE OR REPLACE TRIGGER set_trip_sections_updated_at
BEFORE UPDATE ON public.trip_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. DAYS (Daily itinerary inside a trip section)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.trip_sections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_number INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_section_day_number UNIQUE (section_id, day_number),
    CONSTRAINT uq_section_date UNIQUE (section_id, date),
    CONSTRAINT chk_day_number CHECK (day_number >= 1)
);

CREATE OR REPLACE TRIGGER set_days_updated_at
BEFORE UPDATE ON public.days
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. DAY ACTIVITIES (Junction linking Day to Activity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.day_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE RESTRICT,
    activity_order INTEGER NOT NULL,
    planned_time TIME,
    notes TEXT,
    expense_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_day_activity_order UNIQUE (day_id, activity_order),
    CONSTRAINT chk_activity_order CHECK (activity_order >= 1),
    CONSTRAINT chk_expense_amount CHECK (expense_amount IS NULL OR expense_amount >= 0)
);

CREATE OR REPLACE TRIGGER set_day_activities_updated_at
BEFORE UPDATE ON public.day_activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. BUDGET ITEMS / EXPENSES (Trip, Section, or Day Level Expenses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.trip_sections(id) ON DELETE CASCADE,
    day_id UUID REFERENCES public.days(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_budget_amount CHECK (amount >= 0),
    CONSTRAINT chk_budget_category CHECK (category IN (
        'transport', 'accommodation', 'food', 'activity', 'entry_fee', 'shopping', 'other'
    ))
);

CREATE OR REPLACE TRIGGER set_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. COMMUNITY POSTS (Community Tab Feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_post_likes_count CHECK (likes_count >= 0)
);

CREATE OR REPLACE TRIGGER set_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. SHARED TRIPS (Read-Only Trip Sharing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shared_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_shared_trips_updated_at
BEFORE UPDATE ON public.shared_trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. AUTH HOOK: Automatically create profile upon Supabase auth sign-up
-- ============================================================================
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
        avatar_url
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
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to listen to auth.users insert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
