# Satya-Lekh — Agent Briefing Document
> **For future AI agents working on this codebase.** Read this entire file before touching anything.  
> Last updated: June 2026 | Repo: `github.com/chinmaydrive02-rgb/satyalekh`

---

## 1. What This App Is

**Satya-Lekh** is a Gujarat land records intelligence tool. It lets users search the Gujarat government's AnyROR portal (`anyror.gujarat.gov.in/LandRecordRural.aspx`) for 7/12 land record extracts (also called Satbara), then displays the parsed data with risk analysis (encumbrances, tenure type, mutation history).

**Target users:** Real estate buyers, lawyers, banks doing title due diligence in Gujarat, India.

**The core value proposition:** AnyROR is a CAPTCHA-protected government ASP.NET site with Gujarati-script text. This app automates the whole flow — CAPTCHA solving via Gemini Vision AI, Gujarati→English translation, and structured data extraction — so users get a clean English-language record in seconds (well, minutes).

---

## 2. Architecture

```
User browser
    │
    ▼
Next.js 15 frontend (Vercel)            ←→    Supabase (portfolio storage, credits)
    │  NEXT_PUBLIC_API_URL
    ▼
FastAPI backend (Render.com, Docker)
    │
    ├── Playwright (headless Chromium)  →  anyror.gujarat.gov.in
    └── Gemini 2.5 Flash               →  CAPTCHA solving + result parsing
```

### Deployments
| Service | Platform | URL | Deploy trigger |
|---------|----------|-----|----------------|
| Frontend | Vercel | (check Vercel dashboard) | Push to `main` |
| Backend | Render.com (free tier, Docker) | `https://satyalekh-api.onrender.com` | Push to `main` |
| Database | Supabase | `https://uvvwqugljoritqbjcryg.supabase.co` | Manual SQL |

### Critical Render free-tier behaviour
The Render free tier **spins down after 15 minutes of inactivity**. Cold start takes **60–90 seconds**. After cold start, Playwright adds another 30–120s. Total for a fresh search: **2–3 minutes**. This is a known limitation. A warmup ping is sent on page load via `ServerWarmup.tsx`.

---

## 3. Full File Map

```
satyalekh/
├── backend/
│   ├── main.py              ← FastAPI app — all API endpoints
│   ├── scraper.py           ← Playwright automation + Gemini parsing
│   ├── gujarat_data.py      ← Static Gujarat district/taluka list
│   ├── requirements.txt     ← Python deps (includes stripe, playwright)
│   ├── render.yaml          ← Render deployment config + env var slots
│   └── Dockerfile           ← Docker build for Render
│
└── frontend/src/
    ├── app/
    │   ├── page.tsx                    ← Homepage: Map + SearchWidget
    │   ├── upload/page.tsx             ← Title Scanner (RPA bot + OCR upload)
    │   ├── property/[id]/page.tsx      ← Property detail page
    │   ├── dashboard/page.tsx          ← Portfolio tracker (Supabase)
    │   ├── pricing/page.tsx            ← Pricing + Stripe checkout
    │   ├── payment-success/page.tsx    ← Post-payment success page
    │   ├── market/page.tsx             ← Market Intel (placeholder)
    │   ├── compliance/page.tsx         ← Compliance Audit (placeholder)
    │   ├── directory/page.tsx          ← Legal Counsel directory
    │   └── contact/page.tsx            ← Contact form
    ├── components/
    │   ├── SearchWidget.tsx            ← Main search form (homepage)
    │   ├── TopNav.tsx                  ← Navigation + credit badge
    │   ├── ServerWarmup.tsx            ← Pings /health on mount to wake Render
    │   ├── Map.tsx                     ← Map background (Mapbox/Leaflet)
    │   └── RiskCard.tsx                ← Risk display panel
    ├── lib/
    │   └── api.ts                      ← API_BASE_URL, getUserEmail, fetchCredits
    └── utils/supabase/
        ├── client.ts                   ← Supabase browser client
        └── server.ts                   ← Supabase server client
```

---

## 4. Backend: Every Endpoint

### `GET /` 
Health ping. Returns `{"status": "Satya-Lekh API is running", "version": "2.1"}`.

### `GET /health`
Comprehensive health check. Launches a real Playwright browser, checks Gemini, checks env vars. **Slow (~5s)** — only used for warmup and debugging.
```json
{"healthy": true, "checks": {"google_api_key": "SET", "playwright": "OK", "gemini": "OK"}}
```

### `GET /options/districts`
Returns all 33 Gujarat districts from static `gujarat_data.py`. Instant.
```json
{"districts": ["Ahmedabad", "Amreli", "Anand", ...]}
```

### `GET /options/talukas?district=Ahmedabad`
Returns talukas for a district from `gujarat_data.py`. Instant. Case-insensitive + partial match.
```json
{"district": "Ahmedabad", "talukas": ["City", "Bavla", "Daskroi", ...]}
```

### `GET /options/villages?district=Ahmedabad&taluka=City`
**SLOW — 20–30 seconds.** Launches Playwright, navigates AnyROR, selects the district+taluka dropdowns, reads all village option tags (Gujarati), then calls Gemini to batch-translate them to English. Results cached in memory for the process lifetime (restart clears cache).
```json
{"district": "Ahmedabad", "taluka": "City", "villages": [{"english": "Navrangpura", "gujarati": "નવરંગપુરા"}, ...]}
```

### `POST /fetch-anyror`
**The main endpoint. SLOW — 30–120 seconds.** Runs the full AnyROR scrape.

Request body:
```json
{
  "district": "Ahmedabad",
  "taluka": "City",
  "village": "Navrangpura",   ← English name OK, scraper fuzzy-matches on live dropdown
  "survey_no": "123",          ← or "123 P", "123 A", "45" etc.
  "record_type": "OLD_SCAN_712"
}
```

Optional header: `X-User-Email: user@example.com` (required when `STRIPE_ENABLED=true`).

Returns on success:
```json
{
  "status": "SUCCESS",
  "message": "Record found via scanned document",
  "owner_name": "...",
  "survey_no": "123",
  "village": "Navrangpura",
  "district": "Ahmedabad",
  "taluka": "City",
  "area": "1234 sq m",
  "tenure_type": "Old Tenure",
  "cultivation": "...",
  "mutation_entries": "...",
  "encumbrances": "None",
  "jantri_rate": "...",
  "last_sale": "..."
}
```

Returns on error (HTTP 422):
```json
{"detail": "Survey number '999' not found in 'Navrangpura'. Available options (first 15): ['1', '2', '3 P', ...]"}
```
The frontend should parse the "Available options" list and show them as clickable chips.

### `POST /analyze-record`
Multipart upload of an image or PDF. Uses Gemini Vision to OCR a 7/12 document and return structured data. Returns `AnalysisResult` with `risk_level` (GREEN/YELLOW/RED).

### `POST /create-checkout-session`
Creates a Stripe Checkout session. Only works when `STRIPE_ENABLED=true`.
```json
{"email": "user@example.com", "quantity": 1}   ← quantity 1 = ₹1,500, quantity 5 = ₹6,000 flat
```
Returns `{"checkout_url": "https://checkout.stripe.com/..."}`.

### `GET /credits?email=user@example.com`
Returns `{"email": "...", "credits": 3, "payments_enabled": true}`.

### `POST /webhook/stripe`
Stripe webhook. On `checkout.session.completed`, reads `metadata.user_email` and `metadata.credits` from the session, calls `_add_credits(email, amount)` to update Supabase.

---

## 5. Backend: Scraper Deep Dive (`scraper.py`)

### How a search works (step by step)

1. Launch headless Chromium via Playwright
2. Navigate to `https://anyror.gujarat.gov.in/LandRecordRural.aspx` (up to 3 retries, 45s timeout)
3. Wait for the district dropdown to populate (it's a server-rendered ASP.NET page)
4. Select record type (e.g. `RECORD_TYPE_MAP["OLD_SCAN_712"]` = `"11"`)
5. Select district — fuzzy matches user's English input against Gujarati dropdown options using `_find_best_option()` + `DISTRICT_MAP` + Gemini translation fallback
6. Wait for taluka dropdown to populate (ASP.NET `__doPostBack` partial page update)
7. Select taluka — same fuzzy matching
8. Wait for village dropdown to populate
9. Select village — same fuzzy matching (this is why typed English village names work)
10. Either select survey number from dropdown (`ddlSurveyNo`) or type in text box (`txtNo`)
11. CAPTCHA solving loop (up to 5 attempts):
    - Screenshot the CAPTCHA image element
    - Send to Gemini: "Read exact characters, reply ONLY with the text"
    - Type into CAPTCHA input, click submit
    - Check if CAPTCHA was rejected (English + Gujarati error message detection)
12. Parse result:
    - For `OLD_SCAN_712`: take full-page screenshot → Gemini Vision parses the scanned document image
    - For other types: extract HTML → Gemini parses structured table data
    - If HTML parse yields < 2 populated fields, falls back to Vision parse
13. Overall 120-second timeout wraps the entire flow

### Key constants in `scraper.py`

**`ELEMENTS`** — CSS selectors for AnyROR form elements:
```python
"record_type": "#ContentPlaceHolder1_drpLandRecord"
"district":    "#ContentPlaceHolder1_ddlDistrict"
"taluka":      "#ContentPlaceHolder1_ddlTaluka"
"village":     "#ContentPlaceHolder1_ddlVillage"
"survey_dropdown": "#ContentPlaceHolder1_ddlSurveyNo"
"entry_input":     "#ContentPlaceHolder1_txtNo"
"owner_input":     "#ContentPlaceHolder1_txtownername"
"captcha_img":     "#ContentPlaceHolder1_i_captcha_1"
"captcha_input":   "#ContentPlaceHolder1_txt_captcha_1"
"submit_btn":      "#ContentPlaceHolder1_btnGo"
"refresh_captcha": "#ContentPlaceHolder1_lb_refresh_1"
```

**`RECORD_TYPE_MAP`** — Maps our internal keys to AnyROR `<option value>`:
```python
"VF7": "1", "VF8A": "2", "VF6": "3", "135D": "4", "NEW_FROM_OLD": "5",
"OLD_SCAN_6": "6", "ENTRY_LIST": "7", "INTEGRATED": "8", "REVENUE_CASE": "9",
"OWNER_NAME": "10", "OLD_SCAN_712": "11", "E_CHAVDI": "13",
"CLOSED_SURVEY": "15", "OTHER_LANG": "16"
```

**`FIELD_TYPE_MAP`** — Whether a record type uses dropdown/text/owner input:
```python
"VF7": "dropdown", "VF8A": "text", "VF6": "text",
"OLD_SCAN_712": "dropdown", "OWNER_NAME": "owner", "INTEGRATED": "dropdown"
```

**`_village_cache`** — In-memory dict `{district_taluka: [{"english":..., "gujarati":...}]}`. Survives for the process lifetime. Cleared on Render restart.

### `_find_best_option(options_texts, target)` — Fuzzy matching logic
1. Exact match (case-insensitive)
2. Contains match (target in text OR text in target)
3. Numeric-only match (strips non-digits: "123 P" → "123")
4. Gujarati district map lookup
Returns `None` if no match found.

---

## 6. Frontend: Key Components

### `SearchWidget.tsx` (homepage search form)
- District: `<select>` populated from `/options/districts` on mount
- Taluka: `<select>` populated from `/options/talukas?district=X` when district changes
- Village: **text input** with `<datalist>` for autocomplete (NOT a blocking select)
  - Optional "Load village suggestions from AnyROR" link calls `/options/villages` async
  - Form submits with typed English village name — backend fuzzy-matches it
- Survey No: text input
- On submit: navigates to `/property/SURVEY-{surveyNo}?district=X&taluka=Y&village=Z&record_type=W`
- Village sent to backend is the English name typed by user

### `upload/page.tsx` (Title Scanner)
- Tab 1: Auto Web Scraper — same form as SearchWidget, calls `/fetch-anyror` directly
- Tab 2: Manual OCR Upload — file upload, calls `/analyze-record`
- Shows animated progress UI during scrape
- Shows result inline with "Save to Portfolio" button
- Warms up backend on mount with `/health` ping

### `property/[id]/page.tsx`
- Gets `propertyId` from URL slug (format: `SURVEY-123`)
- Gets district/taluka/village/record_type from URL search params
- **Does NOT auto-fetch** — shows a summary + "Fetch Record from AnyROR" button
- User clicks button → calls `/fetch-anyror` → shows result
- If backend returns "Available options (first 15): [...]" in error, parses and shows as clickable chips
- Has "Save to Portfolio" → Supabase `portfolio_assets`

### `lib/api.ts`
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://satyalekh-api.onrender.com";
export function getUserEmail(): string | null   // reads from localStorage
export function setUserEmail(email: string): void
export async function fetchCredits(email: string): Promise<CreditsInfo | null>
```

---

## 7. Database: Supabase

**URL:** `https://uvvwqugljoritqbjcryg.supabase.co`  
**Public anon key:** in `render.yaml` as `SUPABASE_KEY`

### Table: `portfolio_assets`
```sql
id            uuid primary key default gen_random_uuid()
survey_no     text
district      text
taluka        text
village       text
owner_name    text
area          text
tenure_type   text
encumbrances  text
jantri_rate   text
last_sale     text
notes         text
mutation_entries text
record_type   text
created_at    timestamptz default now()
```
**No RLS, no user_id column.** Anyone can read/write — this is a known security gap (see section 9).

### Table: `user_credits` (must be created manually)
```sql
create table user_credits (
  id          uuid primary key default gen_random_uuid(),
  user_email  text unique not null,
  credits     int not null default 0,
  created_at  timestamptz default now()
);
```
**This table does not exist yet.** The owner must create it in Supabase SQL editor before enabling Stripe payments.

---

## 8. Environment Variables

### Render (backend)
| Variable | Status | Description |
|----------|--------|-------------|
| `GOOGLE_API_KEY` | **Required, set manually** | Gemini API key — must be added in Render dashboard (marked `sync: false` in render.yaml) |
| `SUPABASE_URL` | Set in render.yaml | `https://uvvwqugljoritqbjcryg.supabase.co` |
| `SUPABASE_KEY` | Set in render.yaml | Supabase anon/publishable key |
| `STRIPE_ENABLED` | Not set (payments off) | Set to `true` to enable payment gating |
| `STRIPE_SECRET_KEY` | Not set | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Not set | From Stripe webhook dashboard (`whsec_...`) |
| `FRONTEND_URL` | Not set | Vercel deployment URL (for Stripe success/cancel redirects) |

### Vercel (frontend)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Should be `https://satyalekh-api.onrender.com` |

---

## 9. Known Issues & Security Gaps

### Critical
- **No Supabase Row Level Security** — `portfolio_assets` is publicly readable/writable. Anyone can add or delete records. Fix: add RLS with user_id from Supabase Auth.
- **No authentication** — there's no login system. Payment credits are tied to email (localStorage, no verification). Someone can claim any email to check/use credits.
- **GitHub PAT in `.git/config`** — the repo was pushed using a personal access token embedded in the remote URL. Rotate the token and switch to SSH or credential helper.

### Functional
- **Render free tier cold start** — 60–90s delay on first request after 15min idle. Upgrade to paid tier or use cron job to keep warm.
- **Village cache is in-process memory** — `_village_cache` in scraper.py resets on every Render restart (which happens often on free tier). Consider Redis or a Supabase cache table for production.
- **Playwright on Render free tier** — Playwright with Chromium runs in Docker on Render. The current Dockerfile should install browser deps. If searches fail, check `GET /health` for Playwright status.
- **CAPTCHA solve rate** — Gemini correctly solves AnyROR CAPTCHAs ~70–80% of the time. The scraper retries up to 5 times. Occasionally all 5 fail and the user must retry.
- **Survey number format** — users don't know what format the survey number is in. The real AnyROR site shows a dropdown with options like "123 P", "45 A", "67/1". If user types "123" it may match "123 P" via fuzzy matching but this isn't guaranteed.
- **`market/page.tsx` and `compliance/page.tsx`** — likely placeholder/stub pages with no real functionality.

---

## 10. What Still Needs To Be Done

### Immediate (before launch)
- [ ] **Create `user_credits` table in Supabase** (SQL in section 7)
- [ ] **Add `GOOGLE_API_KEY` to Render** (manually in Render dashboard)
- [ ] **Add Vercel env var** `NEXT_PUBLIC_API_URL=https://satyalekh-api.onrender.com`
- [ ] **Test a real search** — go to the site, select Ahmedabad > City, type "Navrangpura", type survey number "1", click Fetch

### Payment activation
- [ ] **Stripe account setup** — create account, get test keys first
- [ ] **Add to Render:** `STRIPE_ENABLED=true`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`
- [ ] **Register webhook** on Stripe dashboard: `POST https://satyalekh-api.onrender.com/webhook/stripe` for event `checkout.session.completed`
- [ ] **Test payment flow** with Stripe test card `4242 4242 4242 4242`

### Product improvements
- [ ] **Authentication** — add Supabase Auth (email magic link or Google OAuth) so portfolio is user-specific and credits are verified
- [ ] **RLS on `portfolio_assets`** — add `user_id uuid references auth.users` column, enable RLS
- [ ] **Redis/Supabase village cache** — persist village lists across restarts
- [ ] **Render paid tier** — eliminate 60–90s cold start; critical for user experience
- [ ] **Survey number suggestions** — when `/fetch-anyror` returns "available options", store them in Supabase keyed by district/taluka/village so future users see the valid list
- [ ] **Build out `market/page.tsx`** — market intelligence using aggregated portfolio data
- [ ] **Build out `compliance/page.tsx`** — GDCR/FSI compliance calculator for Gujarat zones
- [ ] **Mobile responsiveness** — the SearchWidget is `w-[320px]` fixed width; verify it works on mobile

---

## 11. Design System (DO NOT CHANGE)

The entire UI uses a dark cyberpunk HUD aesthetic. Any changes must preserve it.

```css
Background:  #0a0a0a
Panel:       #1c1b1b  (glass-panel class)
Accent cyan: #00f0ff
Text bright: #dbfcff
Text muted:  #849495
Border:      #3b494b
Success:     #4edea3
Error:       #ba1b24
Warning:     #eab308
Magenta:     #de4ced / #ff00f0

Font headings: font-display (uppercase tracking-tight)
Font data:     font-mono
Font body:     font-sans
```

Buttons: gradient `from-[#0bd9e4] to-[#00f0ff]` (primary), gradient `from-[#de4ced] to-[#ff00f0]` (action)  
Glassmorphism: `glass-panel` = `bg-[#1c1b1b]/50 border border-[#3b494b]/40 backdrop-blur`  
Scanline overlay: `opacity-[0.03] bg-[linear-gradient(...)] bg-[length:100%_4px]` on every page

---

## 12. How to Run Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
playwright install chromium
playwright install-deps chromium
cp .env.example .env   # add GOOGLE_API_KEY
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
npm run dev
# → http://localhost:3000
```

---

## 13. Git History Context

| Commit | What happened |
|--------|---------------|
| `gujarat_data.py` creation | Initial district/taluka static data pushed via GitHub web editor |
| Session 1–2 | Added cascading dropdowns (SearchWidget, upload page), fetch_villages(), batch translation, new API endpoints |
| `8bd1085` | All 5 files synced: scraper.py (village fetch), main.py (3 new endpoints), SearchWidget, upload page, property page. Also fixed mojibake in gujarat_data.py |
| `780156e` | **Major UX fix:** Village dropdown → text input, property page manual fetch trigger, Stripe payment integration, survey format hints, cold-start notes, Ahmedabad taluka "City" fix |

---

## 14. Quick Reference: AnyROR Portal

- URL: `https://anyror.gujarat.gov.in/LandRecordRural.aspx`
- Language: Gujarati (UI is in Gujarati, all dropdown options are Gujarati text)
- CAPTCHA: 5–6 character alphanumeric image, refreshed on each submit
- ASP.NET: uses `__doPostBack` for cascading dropdown updates (no full page reload)
- Rate limiting: no hard rate limit observed, but too many failed CAPTCHAs may trigger a temporary block
- Village naming: villages appear in Gujarati script in the dropdown; our scraper translates to English via Gemini

**Record types and when to use them:**
| Our key | AnyROR value | Use for |
|---------|-------------|---------|
| `OLD_SCAN_712` | 11 | Default — scanned 7/12 extract image |
| `VF7` | 1 | Structured survey no details |
| `VF8A` | 2 | Khata (account) details by khata number |
| `VF6` | 3 | Entry/mutation details by entry number |
| `INTEGRATED` | 8 | Combined survey details |
| `OWNER_NAME` | 10 | Search by owner's name (text input) |
| `OLD_SCAN_6` | 6 | Scanned VF-6 entry details |
| `E_CHAVDI` | 13 | e-Chavdi records |

---

*End of briefing. When in doubt: read the file before editing it, keep the design system intact, and push via git from `/Users/chinmaymistry/Downloads/SATYALEKH` which has an authenticated remote.*
