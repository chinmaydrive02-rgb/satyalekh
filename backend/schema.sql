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

-- Enable Row Level Security (no auth required — open access for demo)
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;

-- Allow full public access (replace with auth-based policy when adding login)
CREATE POLICY "Allow all access" ON portfolio_assets
    FOR ALL USING (true) WITH CHECK (true);

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
-- Only the backend (service/anon key via API) touches this table; no public
-- policy is created on purpose. If your backend uses the anon key, uncomment:
CREATE POLICY "backend access" ON user_credits FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "backend access" ON payments FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "backend access" ON village_cache FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "backend access" ON survey_options FOR ALL USING (true) WITH CHECK (true);

-- ── Property Locker (document vault) ─────────────────────────
-- Files live in the public 'lockers' storage bucket under unguessable paths;
-- this table is the per-email index. Replace with auth-scoped RLS when
-- Supabase Auth lands.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lockers', 'lockers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "locker upload" ON storage.objects;
CREATE POLICY "locker upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lockers');
DROP POLICY IF EXISTS "locker read" ON storage.objects;
CREATE POLICY "locker read" ON storage.objects FOR SELECT USING (bucket_id = 'lockers');
DROP POLICY IF EXISTS "locker delete" ON storage.objects;
CREATE POLICY "locker delete" ON storage.objects FOR DELETE USING (bucket_id = 'lockers');

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
CREATE POLICY "backend access" ON locker_documents FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "backend access" ON title_reports FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "backend access" ON watchlist FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "backend access" ON watchlist_alerts FOR ALL USING (true) WITH CHECK (true);

-- ── Legacy geometry table (keep for reference, not used by app) ──
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE TABLE IF NOT EXISTS land_parcels ( ... );


-- ============================================================
-- SECURITY: run this  (RLS lockdown — see SECURITY_TODO.md)
-- ============================================================
-- The blanket "backend access ... USING (true)" policies above date from
-- when the backend shared the browser's publishable (anon) key. They let
-- ANY visitor read/write every table (including granting themselves free
-- credits). Run the block below in the Supabase SQL Editor AFTER you have
-- set SUPABASE_SERVICE_KEY (the service-role secret) in the Render
-- dashboard — the backend prefers that key and it BYPASSES RLS, so the
-- backend keeps working while the anon key is locked out.
--
-- Designed for the current no-auth architecture:
--   * money/identity/watchlist/report tables → service-role (backend) only
--   * caches the frontend reads directly     → anon read-only
--   * portfolio_assets & locker_documents    → still browser-accessed
--     directly (no auth yet), so they stay open — accepted risk until
--     Supabase Auth lands. Do not store sensitive data there meanwhile.

-- 1) Money & identity: backend (service key) only. No anon access at all.
DROP POLICY IF EXISTS "backend access" ON user_credits;
DROP POLICY IF EXISTS "backend access" ON payments;
REVOKE ALL ON user_credits, payments FROM anon;
-- (RLS stays ENABLED; with no policy + no grant, anon can do nothing;
--  the service-role key bypasses RLS so the backend still reads/writes.)

-- 2) Watchlist / alerts / title reports: written & read by the backend only.
DROP POLICY IF EXISTS "backend access" ON watchlist;
DROP POLICY IF EXISTS "backend access" ON watchlist_alerts;
DROP POLICY IF EXISTS "backend access" ON title_reports;
REVOKE ALL ON watchlist, watchlist_alerts, title_reports FROM anon;

-- 3) Caches: the frontend may read them directly but must never write.
DROP POLICY IF EXISTS "backend access" ON village_cache;
DROP POLICY IF EXISTS "backend access" ON survey_options;
DROP POLICY IF EXISTS "anon read caches" ON village_cache;
DROP POLICY IF EXISTS "anon read caches" ON survey_options;
CREATE POLICY "anon read caches" ON village_cache FOR SELECT TO anon USING (true);
CREATE POLICY "anon read caches" ON survey_options FOR SELECT TO anon USING (true);
REVOKE INSERT, UPDATE, DELETE ON village_cache, survey_options FROM anon;

-- 4) Locker bucket: stop serving documents from long-lived public URLs.
--    (Frontend must switch getPublicUrl → createSignedUrl; see
--    SECURITY_TODO.md step 6 before running this line.)
-- UPDATE storage.buckets SET public = false WHERE id = 'lockers';

-- 5) portfolio_assets / locker_documents: the browser queries these
--    DIRECTLY today with no identity claim, so they cannot be locked
--    without breaking the dashboard/locker pages. ACCEPTED RISK until
--    real auth ships. When Supabase Auth lands, replace with:
--      USING (user_email = auth.jwt()->>'email')
-- ============================================================
-- END SECURITY section
-- ============================================================
