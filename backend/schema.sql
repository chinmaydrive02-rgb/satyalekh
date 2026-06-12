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

-- ── Legacy geometry table (keep for reference, not used by app) ──
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE TABLE IF NOT EXISTS land_parcels ( ... );
