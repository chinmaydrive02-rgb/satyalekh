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

-- ── Legacy geometry table (keep for reference, not used by app) ──
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE TABLE IF NOT EXISTS land_parcels ( ... );
