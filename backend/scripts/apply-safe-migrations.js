const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SAFE_MIGRATIONS = `
-- 1. Additive columns for profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"interests":[],"preferredCountries":[],"budgetLevel":"MEDIUM"}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- 2. Additive columns for trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS total_budget NUMERIC;

-- 3. Additive columns for trip_sections
ALTER TABLE public.trip_sections ADD COLUMN IF NOT EXISTS budget NUMERIC;

-- 4. Additive columns for activities
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS popularity INT DEFAULT 85;

-- 5. Safe Supplementary Tables
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
  status VARCHAR(50) NOT NULL DEFAULT 'ACCEPTED',
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'EXPLORATION',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_budget NUMERIC DEFAULT 0.00,
  duration_days INT DEFAULT 1,
  copy_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  visibility VARCHAR(50) DEFAULT 'PUBLIC',
  sections_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.template_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.trip_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0.00,
  description TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'OTHER',
  split_type VARCHAR(50) DEFAULT 'EQUAL',
  date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_amount NUMERIC NOT NULL DEFAULT 0.00,
  share_percentage NUMERIC,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'COMPLETED',
  notes TEXT,
  settled_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'ESSENTIALS',
  quantity INT DEFAULT 1,
  is_packed BOOLEAN NOT NULL DEFAULT false,
  is_essential BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT,
  expiry_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.preparation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'GENERAL',
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'PENDING',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type VARCHAR(50) DEFAULT 'ALL',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  to_city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  from_city VARCHAR(255) NOT NULL,
  to_city VARCHAR(255) NOT NULL,
  estimated_distance NUMERIC DEFAULT 0,
  estimated_duration NUMERIC DEFAULT 0,
  estimated_cost NUMERIC DEFAULT 0,
  selected_mode VARCHAR(50),
  recommended_mode VARCHAR(50) DEFAULT 'FLIGHT',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
`;

async function applySafeMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Applying safe, additive non-destructive migrations...');
  await client.query(SAFE_MIGRATIONS);
  console.log('Safe migrations successfully applied!');
  await client.end();
}

applySafeMigrations();
