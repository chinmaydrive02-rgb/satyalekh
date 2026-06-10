# Satya-Lekh — Launch & Monetisation Checklist
> Updated June 2026 after the reliability + monetisation upgrade. Do these in order.

## What changed in this update

Backend: new users automatically get free trial credits (FREE_TRIAL_CREDITS env, default 2) — the conversion funnel is now "search free → see value → buy". Village lists and real survey-number lists are persisted to Supabase so they survive Render restarts. Stripe webhook is idempotent (payments ledger prevents double-crediting). New endpoints: `GET /config` (public payments/pricing info) and `GET /options/surveys` (instant survey-number suggestions). Render health check now hits `/` instead of the slow Playwright `/health`.

Frontend: search widget is mobile-responsive and shows verified survey-number suggestions as you type. Property page asks for email inline (claims free trial — no card) and shows a proper paywall when credits run out, plus a working Share button and a print-friendly "Download Report". Compliance page is now a real CGDCR-2017 FSI calculator (zone + road width + plot area → buildable area + chargeable-FSI premium cost). SEO metadata added.

## Step 0 — Actually deploy this update (REQUIRED — read this first)

**Frontend:** Vercel is NOT connected to your GitHub repo — all past deployments were made from the CLI, so pushing to `main` does nothing. The live `satyalekh.vercel.app` is running old code. Fix permanently: Vercel dashboard → satyalekh project → Settings → Git → Connect `chinmaydrive02-rgb/satyalekh` (root directory: `frontend`). Or deploy once manually from your laptop: `cd ~/Downloads/SATYALEKH/frontend && npx vercel --prod`.

**Backend:** Check the Render dashboard → satyalekh-api → whether a deploy started for commit `4a49ffe`. If not, click "Manual Deploy → Deploy latest commit" (and enable Auto-Deploy in Settings). Note: when I tested, the API didn't wake up within ~2 minutes — if it stays down, check Render's logs / free-tier hours.

## Step 1 — Supabase (5 min, REQUIRED)

Open the Supabase SQL editor at https://supabase.com/dashboard → project `uvvwqugljoritqbjcryg` → SQL Editor, and run the whole of `backend/schema.sql`. This creates: `user_credits`, `payments`, `village_cache`, `survey_options` (plus `portfolio_assets` if missing). Nothing payment-related works without `user_credits`.

## Step 2 — Render env vars (2 min, REQUIRED)

In the Render dashboard → satyalekh-api → Environment, confirm/add:

| Key | Value |
|---|---|
| `GOOGLE_API_KEY` | your Gemini key (required — searches fail without it) |
| `FREE_TRIAL_CREDITS` | `2` (or however many free searches new users get) |

## Step 3 — Vercel env var (1 min, REQUIRED)

Vercel dashboard → project → Settings → Environment Variables: `NEXT_PUBLIC_API_URL = https://satyalekh-api.onrender.com` (production). Redeploy after adding.

## Step 4 — Smoke test (after deploy)

Visit the site → select Ahmedabad → City → type "Navrangpura" → survey no "1" → Fetch. First request takes 2–3 min (cold start + scrape). Then check Supabase: `village_cache` and `survey_options` should have rows after a search.

## Step 5 — Turn on payments (when ready)

1. Create a Stripe account → get **test** keys first (`sk_test_...`).
2. Stripe dashboard → Developers → Webhooks → Add endpoint: `https://satyalekh-api.onrender.com/webhook/stripe`, event `checkout.session.completed`. Copy the `whsec_...` secret.
3. Add to Render: `STRIPE_ENABLED=true`, `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, `FRONTEND_URL=https://<your-vercel-domain>`.
4. Test: pricing page → enter email → Buy 1 Search → card `4242 4242 4242 4242` → confirm credits appear (`/credits?email=...`).
5. Swap test keys for live keys. Note: Stripe India requires business verification for live INR payments; if that's a blocker, Razorpay is the common alternative — the backend's checkout/webhook layer is small and could be swapped later.

Once `STRIPE_ENABLED=true`, every new email gets 2 free searches automatically, then hits the paywall (₹1,500/search or ₹6,000/5).

## Step 6 — Keep the backend warm (strongly recommended, free)

Render free tier sleeps after 15 min → 60–90 s cold starts kill conversions. Create a free monitor at https://cron-job.org (or UptimeRobot) hitting `https://satyalekh-api.onrender.com/` every 10 minutes. (Upgrading Render to the $7/mo Starter plan removes spin-down entirely and is the single best UX upgrade you can buy.)

## Security — do these soon

1. **Rotate the GitHub token.** A personal access token is embedded in `.git/config` (and was used for pushes). GitHub → Settings → Developer settings → revoke it, create a fine-grained token scoped to this repo only, then run: `git remote set-url origin https://<NEW_TOKEN>@github.com/chinmaydrive02-rgb/satyalekh.git`
2. **No real auth yet.** Credits are tied to an unverified email — someone could claim another person's email. Acceptable for launch with small amounts, but add Supabase Auth (magic link) before scaling. That also lets you add per-user RLS on `portfolio_assets` (currently anyone can read/write all portfolio rows).
3. The `newsdata.io` API key in `market/page.tsx` is a free-tier public key visible client-side — fine for now, rotate if abused.

## Pricing sanity check (think about this)

₹1,500/search is bank/lawyer due-diligence pricing. For individuals it's steep — a manual AnyROR check is free if you read Gujarati. Consider a cheaper individual tier (e.g. ₹299/search or ₹999/5) and keep ₹1,500+ for the report-grade output, or position the per-search price around the English translation + risk report + printable PDF, which is the real value-add. Prices live in `backend/main.py` (`PRICE_PER_SEARCH_PAISE`, `PRICE_FIVE_PACK_PAISE`) and the pricing page copy.
