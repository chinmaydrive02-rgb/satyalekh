# SECURITY TODO — Owner Actions (dashboards only, no code changes needed)

> The code-level fixes from `SECURITY_AUDIT.md` are already applied in this repo
> (see the "Remediation status" section there). The items below **cannot be done
> from code** — they need you in the GitHub / Google / Supabase / Render /
> Vercel / newsdata.io dashboards. Work top to bottom; 1–4 are urgent.

---

## 1. Rotate the GitHub Personal Access Token (F-01 — CRITICAL)

The token `ghp_<REDACTED>…` is embedded in your local `.git/config`. Treat it as leaked.

1. GitHub → Settings → Developer settings → Personal access tokens → **Delete** the token starting `ghp_<REDACTED>`.
2. On your laptop, remove it from the remote URL (pick ONE):
   ```bash
   cd ~/Downloads/SATYALEKH
   # Option A — switch to SSH (recommended; needs an SSH key on GitHub):
   git remote set-url origin git@github.com:chinmaydrive02-rgb/satyalekh.git
   # Option B — keep HTTPS and let a credential manager store the new token:
   git remote set-url origin https://github.com/chinmaydrive02-rgb/satyalekh.git
   ```
3. Verify: `git config --get remote.origin.url` must NOT contain `ghp_`.

## 2. Rotate the Google/Gemini API key (F-02 — CRITICAL)

The key in `backend/.env` (`AIzaSyD…aYS4`) sat in plaintext on disk — assume leaked.

1. Google AI Studio / Google Cloud Console → API keys → **regenerate** the Gemini key.
2. Put the new key ONLY in Render → satyalekh-api → Environment → `GOOGLE_API_KEY`. Do **not** write it back into `backend/.env` if the folder is ever shared/synced.
3. In Google Cloud, add an API restriction (Generative Language API only) and a **daily quota cap** so a future leak can't run up an unbounded bill.
4. Delete or blank the old value in `backend/.env`.

## 3. Supabase: switch the backend to the service-role key (F-03 — CRITICAL)

The backend currently uses the same *publishable* key every browser gets.

1. Supabase dashboard → Project Settings → API keys → copy the **service_role secret** key.
2. Render dashboard → satyalekh-api → Environment → add `SUPABASE_SERVICE_KEY = <service_role secret>`. (The code prefers `SUPABASE_SERVICE_KEY` and falls back to `SUPABASE_KEY` — no code change needed.)
3. `render.yaml` no longer commits the Supabase key. Before your next deploy, also set `SUPABASE_KEY = <publishable key>` in the Render dashboard as the fallback (or leave it unset once the service key works).

## 4. Supabase: lock down Row Level Security (F-03 — CRITICAL)

**Only after step 3 is deployed** (the service key bypasses RLS, so the backend keeps working). Open Supabase → SQL Editor and run the block below — it is also kept in `backend/schema.sql` under the "`-- SECURITY: run this`" banner:

```sql
-- 1) Money & identity: backend (service key) only. No anon access at all.
DROP POLICY IF EXISTS "backend access" ON user_credits;
DROP POLICY IF EXISTS "backend access" ON payments;
REVOKE ALL ON user_credits, payments FROM anon;

-- 2) Watchlist / alerts / title reports: backend only.
DROP POLICY IF EXISTS "backend access" ON watchlist;
DROP POLICY IF EXISTS "backend access" ON watchlist_alerts;
DROP POLICY IF EXISTS "backend access" ON title_reports;
REVOKE ALL ON watchlist, watchlist_alerts, title_reports FROM anon;

-- 3) Caches: anon may read, never write.
DROP POLICY IF EXISTS "backend access" ON village_cache;
DROP POLICY IF EXISTS "backend access" ON survey_options;
DROP POLICY IF EXISTS "anon read caches" ON village_cache;
DROP POLICY IF EXISTS "anon read caches" ON survey_options;
CREATE POLICY "anon read caches" ON village_cache FOR SELECT TO anon USING (true);
CREATE POLICY "anon read caches" ON survey_options FOR SELECT TO anon USING (true);
REVOKE INSERT, UPDATE, DELETE ON village_cache, survey_options FROM anon;
```

This kills the "grant myself unlimited credits" and "read everyone's payments" exploits. `portfolio_assets` and `locker_documents` stay open for now — the browser queries them directly and there is no auth yet (accepted risk; fix by adding Supabase Auth).

Then verify from a browser console (with the publishable key) that `select * from user_credits` returns an error/empty.

## 5. Set the new backend env vars in Render

Render → satyalekh-api → Environment:

| Variable | Value | Why |
|---|---|---|
| `CRON_SECRET` | long random string (e.g. `openssl rand -hex 24`) | `/watchlist/run-checks` now **returns 503 until this is set** (fail-closed). Also paste the same value into the cron-job.org job as header `X-Cron-Secret`. |
| `ALLOWED_ORIGINS` | `https://satyalekh.vercel.app,http://localhost:3000` (+ any custom domain) | CORS is no longer `*`. Defaults cover these two; set explicitly if you add domains. |
| `NEWSDATA_API_KEY` | a **new** newsdata.io key (see step 7) | Powers the new `/news/gujarat` proxy. Optional — market page falls back to static articles without it. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from Stripe dashboard | The webhook now **rejects everything (503) when unset** while payments are enabled. |

## 6. Supabase Storage: make the `lockers` bucket private (F-04)

The frontend now uses 60-second signed URLs (works with public *or* private buckets), so this is safe to flip:

1. Supabase → SQL Editor:
   ```sql
   UPDATE storage.buckets SET public = false WHERE id = 'lockers';
   ```
2. Test: locker page → download a document → should still open.

Note: the `locker_documents` index table remains world-readable until auth exists (accepted risk — don't store anything truly sensitive in lockers yet).

## 7. Rotate the newsdata.io key (F-06)

The old key `pub_864271a4…` was shipped to every browser — treat as leaked.

1. newsdata.io dashboard → regenerate/create a new API key.
2. Put it in Render as `NEWSDATA_API_KEY` (step 5). It never appears in frontend code anymore.

## 8. Redeploy + smoke test

1. Push to `main` (backend deploys via Render). Vercel: deploy the frontend (`cd frontend && npx vercel --prod` — note Vercel is not Git-connected per LAUNCH_CHECKLIST.md).
2. Smoke test:
   - Demo login works (`chinmay2004` / `satyalekh`), demo title report completes.
   - `curl -X POST https://<api>/watchlist/run-checks -H "X-Cron-Secret: <secret>"` → 200.
   - Market page shows news (live if key set, static otherwise).
   - Response headers on the Vercel site include `Content-Security-Policy` (check DevTools → Network).
   - Browser console with anon key can NO LONGER update `user_credits`.

## 9. Later (before scale — not urgent today)

- **Real auth (F-05/F-17):** Supabase Auth + per-user RLS (`user_email = auth.jwt()->>'email'`) on `watchlist`, `locker_documents`, `portfolio_assets`, `title_reports`. This is the proper fix for everything marked "accepted risk".
- Verify on GitHub that `backend/.env` never appeared in any pushed commit (Settings → Security → secret scanning, or browse history).
- Consider Render paid tier + a Redis/DB-backed rate limiter if traffic grows (the current limiter is per-process, in-memory).
