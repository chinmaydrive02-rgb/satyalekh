# Pan-India Playbook — How Landeed Does It, and How Satya-Lekh Copies the Model
> Researched July 2026. Companion to PRODUCT_ROADMAP.md. Read this before building state #2.

## The headline finding

Landeed's "instant, 26 states + 4 UTs, 120+ document types" is **not one technology — it's four channels stacked behind one search box**, plus a data moat. Nobody, including Landeed, has a magic API into every state. They win by routing each document request to whichever channel can fulfil it, and being honest about speed per channel ("instant" for scraped/cached records, "under 2 minutes" for portal fetches, "same day to 5-7 working days" for certified copies fetched by humans).

**The four channels:**

1. **Automated portal fetch (what we already do for Gujarat).** Scrapers against state portals (AnyROR, MahaBhulekh, Bhoomi, UP Bhulekh, Jamabandi…), run from Indian infrastructure, with CAPTCHA solving. This is the "instant" tier and covers the free/cheap RoR-class documents (7/12, RTC, Khasra/Khatauni, Jamabandi, Porcha).
2. **Official digital rails where they exist.** DigiLocker has **live issuer integrations for land records/RoR in ~12 states** (Karnataka Bhoomi, Maharashtra 7/12, Telangana, MP RCMS, UP Bhulekh…), and Telangana's registration department issues certified property documents straight into DigiLocker. API Setu is the partner gateway. One integration, many states, zero CAPTCHA, government-verified PDFs — this is almost certainly how a 75-person company covers so much ground without an army of scraper engineers.
3. **A human fulfilment network for certified/offline documents.** Certified copies of sale deeds, ECs in states without online issuance, pre-digitisation records — Landeed's own product pages quote "3-4 working days", "5-7 working days", "48 hours in parts of Bangalore", "same-day in select locations". That is people standing in Sub-Registrar Office queues, coordinated through the app. ~120 document types is mostly THIS channel, not scraping.
4. **The corpus.** Every fetched document lands in their store — now "773M+ documents". Repeat lookups are served from cache instantly at zero marginal cost, and the corpus powers the AI layer (Terra, AI title reports in Telangana). We already started this flywheel with `title_reports`/`village_cache`/`survey_options` in Supabase.

Funding context: ~$16.3M raised over 5 rounds (YC S22, Draper), ~75 employees as of mid-2026, freemium + per-document + document packs. They also do boring-but-lucrative enterprise/bank verification.

## What this means for Satya-Lekh — the honest gap analysis

We already have, working today: channel 1 for one state (Gujarat scraper with Gemini CAPTCHA solving), channel 4's foundations (Supabase caching of reports/villages/surveys), the trust artifact (title score + chain of title + report), watchlist, locker, demo mode. What we don't have: Indian infrastructure (the single blocker — AnyROR/eCourts reject cloud IPs), channels 2 and 3 entirely, and any second state.

**The copyable insight is architectural:** stop thinking "scraper per state" and build a **document-fulfilment router**: every search becomes a `document_request` that the backend routes to `scrape | digilocker | cache | manual` based on state + document type, with per-channel SLA shown to the user up front (instant / minutes / days). Our async job pipeline (`/jobs/title-report` + polling + stage UI) is already the right chassis for this — a manual-fulfilment job is just a job whose stages are measured in hours and whose "worker" is a human with a phone.

## The four-channel build plan

### Channel 1 — scrapers (expand what we have)
- **Deploy the backend to an Indian IP first.** Oracle Cloud Mumbai free tier (DEPLOY_INDIA.md) unlocks Gujarat AND eCourts litigation search in one move. Nothing else in this playbook matters until this ships.
- **State #2: Maharashtra (MahaBhulekh).** Same pattern as AnyROR: district→taluka→village cascades, CAPTCHA, Devanagari→English translation (Gemini already does Gujarati; Marathi is the same muscle). Biggest land market in India, borders Gujarat, NRI-heavy.
- **State #3: Karnataka (Bhoomi RTC)** — well-digitised, Bangalore demand, Landeed's home turf but the market is huge.
- Refactor `scraper.py` into a **per-state adapter interface** (`fetch_ror(state, location, survey_no) -> RawRecord`) with shared CAPTCHA/translation/parsing utilities, so each new state is an adapter file, not a fork. Keep `gujarat_data.py`-style static location data per state, cached in Supabase.
- Survey-number formats, location hierarchies (taluka vs tehsil vs mandal) and record names differ per state — the `TitleReport` schema stays universal; only the adapter and labels change.

### Channel 2 — DigiLocker / API Setu (the force multiplier)
- Register as a **DigiLocker Requester** via partners.apisetu.gov.in (needs a registered business entity — do this paperwork NOW, approval takes time).
- One integration yields RoR-class documents for the ~12 live states, government-signed PDFs, no CAPTCHA, no IP games. Telangana even issues certified registration documents through it.
- Flow: user authorises via DigiLocker OAuth → we pull the record → same TitleReport pipeline parses it (Gemini already parses scanned documents — a DigiLocker PDF is the easy case).
- Caveat learned from the field: issuer uptime is patchy and older records are missing — always keep channel 1 as fallback per state. Route: try DigiLocker (seconds) → fall back to scrape (minutes) → offer manual (days).

### Channel 3 — human fulfilment (start tiny, price high)
- Don't build a national runner network. Start with **one partner in Ahmedabad** (a document writer / title clerk who already does SRO runs) for exactly two SKUs: certified 7/12 + index-2 copy, and 30-year search report. ₹1,500–4,999, 2-5 working days, powered by the existing "Advocate-Certified Report" upsell slot.
- Product plumbing: a `manual_orders` table + an admin page + WhatsApp notifications = v1. The job-polling UI already handles "in progress for days" gracefully.
- This channel is what justifies bank/enterprise pricing later; it's also Landeed's real moat (hard ops, not hard tech).

### Channel 4 — the corpus (already started, formalise it)
- Every record fetched through ANY channel persists to Supabase keyed by (state, district, taluka, village, survey_no) with fetch timestamp + channel + raw artifact (PDF/screenshot in storage) + parsed TitleReport.
- Serve repeats from cache instantly and free (already live for Gujarat) — advertise it: "already-verified parcels are free to view".
- This corpus is the defensible asset: the cleanest English-language, risk-scored index of Indian land records. It also feeds the watchlist diffing engine we already built.

## Sequencing (each step is independently shippable)

1. **Oracle Mumbai deployment** — unblocks Gujarat live + litigation search. (Days; free.)
2. **DigiLocker requester application** — pure paperwork, start immediately, build later. (Weeks of waiting; free.)
3. **Scraper adapter refactor** while waiting. (Days.)
4. **Maharashtra adapter** (MahaBhulekh) → launch "2 states". Marketing moment: "Gujarat + Maharashtra title checks in English". (1-2 weeks.)
5. **DigiLocker integration** when approved → instantly advertise every live-issuer state at "beta" coverage. This is the jump from 2 states to ~12 on the map. (1-2 weeks of build.)
6. **Karnataka adapter** + one Ahmedabad manual-fulfilment partner. (Parallel.)
7. Repeat: one adapter per fortnight, prioritised by transaction volume: TN (Patta/Chitta) → UP (Khasra/Khatauni) → Rajasthan (Apna Khata) → Punjab/Haryana (Jamabandi) → Telangana/AP last (Landeed's fortress; fight where they're weakest, not strongest).

## State portal cheat sheet (channel-1 targets)

| State | Portal | RoR document | Notes |
|---|---|---|---|
| Gujarat | AnyROR | 7/12, VF-6, VF-8A | DONE — our reference adapter |
| Maharashtra | bhulekh.mahabhumi.gov.in | 7/12, 8A, property cards | Same UX pattern as AnyROR; also on DigiLocker |
| Karnataka | landrecords.karnataka.gov.in (Bhoomi) | RTC/Pahani | Well-digitised; also on DigiLocker |
| UP | upbhulekh.gov.in | Khasra/Khatauni | CAPTCHA; also on DigiLocker |
| Telangana | Bhu Bharati (replaced Dharani 2025) | RoR, EC | Certified docs via DigiLocker; portal churn risk — adapter last |
| AP | Meebhoomi | 1-B, Adangal | |
| Tamil Nadu | eservices.tn.gov.in | Patta/Chitta | |
| Punjab / Haryana | jamabandi.punjab / jamabandi.nic (HR) | Jamabandi | Two similar portals |
| Rajasthan | Apna Khata | Jamabandi Nakal | |
| MP | MP Bhulekh / RCMS | Khasra | Also on DigiLocker |
| West Bengal | Banglarbhumi | Porcha RoR | Login-walled; harder |
| Kerala | Ente Bhoomi | RoR | Newer portal; has open-data APIs for some sets |

Signed/certified copies on most portals need OTP to an Indian mobile — a shared India-side phone number (or the manual channel) handles that.

## Pricing (copy the good parts)

Landeed: freemium first searches → per-document (~₹190 name-search, ~₹1,000 sale-deed soft copy) → document packs (Karnataka property pack bundles EC + deed + RTC + e-Khata…) → enterprise. We already match the shape (2 free trials, per-search, 5-pack "Title Pack"). Add per-state document packs as states come online, and keep the ₹1,500+ tier for the certified/manual channel, not the instant tier.

## What NOT to copy

- **Don't chase 120 document types.** That's their ops army. Our wedge stays the *risk-scored title verdict + chain of title* — Landeed fetches documents; we answer "is this title clean?". Depth over breadth.
- **Don't start in Telangana/AP.** Their home market, deepest coverage, AI reports already live there.
- **Don't build a runner network before one partner in one city is profitable.**
- **Don't skip the entity + DigiLocker paperwork** — every week of delay is a week the 12-state shortcut stays locked.

## Legal/organisational prerequisites

Register a business entity (needed for: DigiLocker requester status, Razorpay/Stripe live INR, enterprise contracts, and credibility on the report letterhead). Rotate the exposed GitHub PAT + Gemini key and run the RLS SQL (SECURITY_TODO.md) before any real customer data accumulates. Land-record data is public-record information, but publish a clear terms/privacy page before scaling paid usage.

---
*Sources: Landeed site/product pages and blog, Google Play/App Store listings, Tracxn/PitchBook/Entrackr funding coverage, DigiLocker/API Setu documentation and issuer-status reporting, state portal guides (Assetly, BhulekhIndia, Ghar.tv, Farmer.in), RTI Wiki DigiLocker issuer reality check (2026).*
