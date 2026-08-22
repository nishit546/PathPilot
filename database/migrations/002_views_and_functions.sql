-- ============================================================================
-- Migration: 002_views_and_functions.sql
-- Description: Budget aggregation views, calendar query functions, and helpers
-- ============================================================================

-- ============================================================================
-- 1. VIEW: Trip Budget Summary
-- Calculates total budget, direct expenses, section expenses, day expenses,
-- total spent, and remaining budget per trip.
-- ============================================================================
CREATE OR REPLACE VIEW public.v_trip_budget_summary AS
SELECT
    t.id AS trip_id,
    t.title AS trip_title,
    t.user_id,
    COALESCE(t.overall_budget, 0.00) AS overall_budget,
    COALESCE(SUM(b.amount), 0.00) AS total_expenses,
    COALESCE(t.overall_budget, 0.00) - COALESCE(SUM(b.amount), 0.00) AS remaining_budget,
    COUNT(b.id) AS expense_items_count
FROM public.trips t
LEFT JOIN public.budget_items b ON b.trip_id = t.id
GROUP BY t.id, t.title, t.user_id, t.overall_budget;

-- ============================================================================
-- 2. VIEW: Section Budget Summary
-- Calculates budget, total expenses, and remaining budget per trip section.
-- ============================================================================
CREATE OR REPLACE VIEW public.v_section_budget_summary AS
SELECT
    ts.id AS section_id,
    ts.trip_id,
    ts.section_order,
    c.name AS city_name,
    c.country AS city_country,
    COALESCE(ts.section_budget, 0.00) AS section_budget,
    COALESCE(SUM(b.amount), 0.00) AS total_expenses,
    COALESCE(ts.section_budget, 0.00) - COALESCE(SUM(b.amount), 0.00) AS remaining_budget,
    COUNT(b.id) AS expense_items_count
FROM public.trip_sections ts
JOIN public.cities c ON c.id = ts.city_id
LEFT JOIN public.budget_items b ON b.section_id = ts.id
GROUP BY ts.id, ts.trip_id, ts.section_order, c.name, c.country, ts.section_budget;

-- ============================================================================
-- 3. VIEW: Day Budget Summary
-- Calculates total expenses incurred for a specific day.
-- ============================================================================
CREATE OR REPLACE VIEW public.v_day_budget_summary AS
SELECT
    d.id AS day_id,
    d.section_id,
    ts.trip_id,
    d.date,
    d.day_number,
    COALESCE(SUM(b.amount), 0.00) AS total_expenses,
    COUNT(b.id) AS expense_items_count
FROM public.days d
JOIN public.trip_sections ts ON ts.id = d.section_id
LEFT JOIN public.budget_items b ON b.day_id = d.id
GROUP BY d.id, d.section_id, ts.trip_id, d.date, d.day_number;

-- ============================================================================
-- 4. FUNCTION: Calendar Date Range Query Helper
-- Returns all trips for a user that overlap the given [p_start_date, p_end_date]
-- Handles:
--   - Trips starting before and ending within
--   - Trips starting within and ending after
--   - Trips completely inside the range
--   - Trips spanning across the entire range
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_calendar_trips(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title VARCHAR(255),
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    visibility VARCHAR(20),
    overall_budget NUMERIC(12, 2),
    cover_image_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.user_id, t.title, t.description, t.start_date, t.end_date,
           t.status, t.visibility, t.overall_budget, t.cover_image_url,
           t.created_at, t.updated_at
    FROM public.trips t
    WHERE t.user_id = p_user_id
      AND t.start_date <= p_end_date
      AND t.end_date >= p_start_date
    ORDER BY t.start_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
