-- ============================================================
-- Satya-Lekh Database Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ── Portfolio Assets ─────────────────────────────────────────
-- Stores AnyROR-fetched land records saved by the user
CREATE TABLE IF NOT EXISTS portfolio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_no TEXT NOT NULL,
    district TEXT,
    taluka TEXT,
    village TEXT,
    owner_name TEXT,
    area TEXT,
    tenure_type TEXT,
    encumbrances TEXT,
    jantri_rate TEXT,
    last_sale TEXT,
    mutation_entries TEXT,
    record_type TEXT DEFAULT 'OLD_SCAN_712',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security; owner policies are installed below.
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;

-- Demo fixtures are served separately; database access requires authentication.


-- Index for fast lookup by survey number
CREATE INDEX IF NOT EXISTS idx_portfolio_survey ON portfolio_assets (survey_no);

-- ── User Credits (payments / free trial) ─────────────────────
-- Each email gets FREE_TRIAL_CREDITS on first contact; Stripe webhook tops up.
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT UNIQUE NOT NULL,
    credits INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
-- Only the backend service role accesses this table.


-- ── Payments ledger (Stripe webhook idempotency + audit trail) ──
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id TEXT UNIQUE NOT NULL,
    user_email TEXT NOT NULL,
    credits INT NOT NULL,
    amount_paise BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;


-- ── Village cache (persists 20-30s AnyROR scrapes across restarts) ──
CREATE TABLE IF NOT EXISTS village_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,          -- "district_taluka" lowercase
    district TEXT,
    taluka TEXT,
    villages JSONB NOT NULL,                 -- [{"english":..,"gujarati":..}]
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE village_cache ENABLE ROW LEVEL SECURITY;


-- ── Survey options cache (real survey numbers seen on AnyROR) ──
CREATE TABLE IF NOT EXISTS survey_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_key TEXT UNIQUE NOT NULL,       -- "district|taluka|village" lowercase
    district TEXT,
    taluka TEXT,
    village TEXT,
    options JSONB NOT NULL,                  -- ["1","2","3 P",...]
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE survey_options ENABLE ROW LEVEL SECURITY;


-- ── Property Locker (document vault) ─────────────────────────
-- Files live in a private locker bucket under authenticated owner UUID paths.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lockers', 'lockers', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "locker upload" ON storage.objects;

DROP POLICY IF EXISTS "locker read" ON storage.objects;

DROP POLICY IF EXISTS "locker delete" ON storage.objects;


CREATE TABLE IF NOT EXISTS locker_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    doc_type TEXT DEFAULT 'other',
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locker_email ON locker_documents (user_email);
ALTER TABLE locker_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend access" ON locker_documents;


-- ── Title Reports (async job pipeline result cache) ──────────
-- Finished /jobs/title-report results are mirrored here so they survive
-- Render restarts. Repeat lookups for the same parcel within 7 days are
-- served from this table instantly and do NOT consume a credit.
CREATE TABLE IF NOT EXISTS title_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_key TEXT NOT NULL,              -- "district|taluka|village|survey_no" lowercase
    district TEXT,
    taluka TEXT,
    village TEXT,
    survey_no TEXT,
    record_type TEXT DEFAULT 'OLD_SCAN_712',
    report JSONB NOT NULL,                   -- full TitleReport object
    user_email TEXT,                         -- who triggered the scrape (may be null)
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_title_reports_key ON title_reports (location_key, created_at DESC);
ALTER TABLE title_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend access" ON title_reports;


-- ── Watchlist (parcel change monitoring) ─────────────────────
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    district TEXT NOT NULL,
    taluka TEXT NOT NULL,
    village TEXT NOT NULL,
    survey_no TEXT NOT NULL,
    record_type TEXT DEFAULT 'OLD_SCAN_712',
    last_snapshot JSONB,                     -- last fetched record (key fields)
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_email, district, taluka, village, survey_no, record_type)
);
CREATE INDEX IF NOT EXISTS idx_watchlist_email ON watchlist (user_email);
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend access" ON watchlist;


-- ── Watchlist alerts (diffs detected by /watchlist/run-checks) ──
CREATE TABLE IF NOT EXISTS watchlist_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlist (id) ON DELETE CASCADE,
    changes JSONB NOT NULL,                  -- {field: {"old":..,"new":..}}
    seen BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_wid ON watchlist_alerts (watchlist_id, created_at DESC);
ALTER TABLE watchlist_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend access" ON watchlist_alerts;


-- ── Manual fulfilment orders (playbook channel 3) ────────────
-- Certified/offline documents fetched by a human partner (v1: one document
-- writer in Ahmedabad, two SKUs). Created via POST /manual-orders; the
-- status walks pending → quoted → in_progress → delivered (or cancelled)
-- as the partner works the order — the job-polling UI already handles
-- "in progress for days" gracefully.
CREATE TABLE IF NOT EXISTS manual_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'GJ',        -- registry state code
    district TEXT NOT NULL,
    taluka TEXT NOT NULL,
    village TEXT NOT NULL,
    survey_no TEXT NOT NULL,
    sku TEXT NOT NULL CHECK (sku IN ('certified_712_index2', 'search_report_30yr')),
    price_inr INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'quoted', 'in_progress', 'delivered', 'cancelled')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manual_orders_email ON manual_orders (user_email, created_at DESC);
ALTER TABLE manual_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backend access" ON manual_orders;


-- ── Legacy geometry table (keep for reference, not used by app) ──
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE TABLE IF NOT EXISTS land_parcels ( ... );



-- Account ownership and private storage (applied after base definitions).
-- Preserve legacy records without assigning them to an unverified account.
alter table public.portfolio_assets add column if not exists owner_id uuid;
alter table public.locker_documents add column if not exists owner_id uuid;
alter table public.watchlist add column if not exists owner_id uuid;
alter table public.manual_orders add column if not exists owner_id uuid;
alter table public.title_reports add column if not exists owner_id uuid;
create index if not exists idx_portfolio_owner on public.portfolio_assets(owner_id);
create index if not exists idx_locker_owner on public.locker_documents(owner_id);
create index if not exists idx_watchlist_owner on public.watchlist(owner_id);
create index if not exists idx_orders_owner on public.manual_orders(owner_id);
create index if not exists idx_reports_owner on public.title_reports(owner_id);
do $$
declare p record; t text;
begin
 foreach t in array array['portfolio_assets','locker_documents','watchlist','manual_orders','title_reports','watchlist_alerts','payments','user_credits','village_cache','survey_options'] loop
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',p.policyname,t);
  end loop;
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select,insert,update,delete on public.portfolio_assets,public.locker_documents to authenticated;
create policy portfolio_owner_access on public.portfolio_assets for all to authenticated
 using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy locker_owner_access on public.locker_documents for all to authenticated
 using ((select auth.uid()) = owner_id) with check (
 (select auth.uid()) = owner_id and split_part(storage_path,'/',1) = (select auth.uid())::text);
update storage.buckets set public=false,file_size_limit=15728640,
 allowed_mime_types=array['application/pdf','image/jpeg','image/png','image/webp']
 where id='lockers';
drop policy if exists "locker upload" on storage.objects;
drop policy if exists "locker read" on storage.objects;
drop policy if exists "locker delete" on storage.objects;
drop policy if exists locker_authenticated_upload on storage.objects;
drop policy if exists locker_authenticated_read on storage.objects;
drop policy if exists locker_authenticated_delete on storage.objects;
create policy locker_authenticated_upload on storage.objects for insert to authenticated
 with check (bucket_id='lockers' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy locker_authenticated_read on storage.objects for select to authenticated
 using (bucket_id='lockers' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy locker_authenticated_delete on storage.objects for delete to authenticated
 using (bucket_id='lockers' and (storage.foldername(name))[1]=(select auth.uid())::text);
