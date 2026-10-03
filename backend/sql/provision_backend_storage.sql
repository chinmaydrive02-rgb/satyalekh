-- Applied through Supabase migration provision_backend_storage on 2026-10-03.
-- Backend-only tables. Existing email-based HTTP routes still require owner authentication.
create table if not exists public.title_reports (
id uuid primary key default gen_random_uuid(), location_key text not null,
district text, taluka text, village text, survey_no text,
record_type text default 'OLD_SCAN_712', report jsonb not null, user_email text,
created_at timestamptz default now());
create index if not exists idx_title_reports_key on public.title_reports(location_key,created_at desc);
create table if not exists public.watchlist (
id uuid primary key default gen_random_uuid(), user_email text not null,
district text not null,taluka text not null,village text not null,survey_no text not null,
record_type text default 'OLD_SCAN_712',last_snapshot jsonb,last_checked_at timestamptz,
created_at timestamptz default now(),
unique(user_email,district,taluka,village,survey_no,record_type));
create index if not exists idx_watchlist_email on public.watchlist(user_email);
create table if not exists public.watchlist_alerts (
id uuid primary key default gen_random_uuid(),
watchlist_id uuid not null references public.watchlist(id) on delete cascade,
changes jsonb not null,seen boolean default false,created_at timestamptz default now());
create index if not exists idx_watchlist_alerts_wid on public.watchlist_alerts(watchlist_id,created_at desc);
create table if not exists public.manual_orders (
id uuid primary key default gen_random_uuid(),user_email text not null,
state text not null default 'GJ',district text not null,taluka text not null,
village text not null,survey_no text not null,
sku text not null check(sku in ('certified_712_index2','search_report_30yr')),
price_inr int not null default 0,status text not null default 'pending'
check(status in ('pending','quoted','in_progress','delivered','cancelled')),
notes text default '',created_at timestamptz default now(),updated_at timestamptz default now());
create index if not exists idx_manual_orders_email on public.manual_orders(user_email,created_at desc);
alter table public.title_reports enable row level security;
alter table public.watchlist enable row level security;
alter table public.watchlist_alerts enable row level security;
alter table public.manual_orders enable row level security;
revoke all on public.title_reports,public.watchlist,public.watchlist_alerts,public.manual_orders from anon,authenticated;
grant all on public.title_reports,public.watchlist,public.watchlist_alerts,public.manual_orders to service_role;
