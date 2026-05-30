-- --------------------------------------------------------
-- EVIDENTIA: NUCLEAR DATABASE RESET (PROD)
-- --------------------------------------------------------
-- WARNING: This will DELETE all existing data.

-- 1. DROP EXISTING TABLES (Reverse Order of Dependencies)
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.evidence;
DROP TABLE IF EXISTS public.profiles;

-- 2. CREATE PROFILES TABLE (Linked to Auth)
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  wallet_address text,
  role text default 'analyst',
  created_at timestamp with time zone default now()
);

-- 3. CREATE EVIDENCE TABLE
CREATE TABLE public.evidence (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  case_id text not null,
  file_name text,
  file_size bigint,
  file_type text,
  file_hash text not null,
  tx_hash text, -- Blockchain Transaction Reference
  status text default 'pending' check (status in ('pending', 'verified', 'tampered')),
  ai_summary text,
  ai_risk_score numeric,
  ai_observations text[],
  thumbnail text,
  thumbnail_type text,
  duration numeric,
  linked_cases text[],
  is_duplicate boolean default false,
  storage_path text,
  user_id uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  last_verified timestamp with time zone
);

-- 4. CREATE AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid references public.evidence(id) on delete cascade,
  action text not null,
  details text not null,
  user_id uuid references public.profiles(id),
  user_name text not null,
  status text default 'success' check (status in ('success', 'warning', 'alert')),
  ai_summary text, -- Forensic AI Insight
  timestamp timestamp with time zone default now()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Profiles: Users can view all profiles, but only edit their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Evidence: Authenticated users can read/write evidence
CREATE POLICY "Evidence is viewable by authenticated users" ON public.evidence FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert evidence" ON public.evidence FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update evidence" ON public.evidence FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete evidence" ON public.evidence FOR DELETE USING (auth.role() = 'authenticated');

-- Audit Logs: Viewable and insertable by all agents
CREATE POLICY "Logs are viewable by everyone" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. STORAGE BUCKET NOTE
-- Ensure you have a 'evidence-vault' bucket in Storage set to 'Private'.
-- Recommended Storage RLS:
-- 1. INSERT: bucket_id = 'evidence-vault' AND auth.role() = 'authenticated'
-- 2. SELECT: bucket_id = 'evidence-vault' AND auth.role() = 'authenticated'
