# Satya-Lekh → India's Premier Land Title Clearance Checker
> Ahmedabad-first strategy. Written June 2026.

## The one-line product
"Paste a survey number, get a lawyer-grade title clearance verdict in minutes — in English, with proof from official government records."

## Why Ahmedabad first
Highest land-transaction velocity in Gujarat (Dholera SIR, Sanand industrial belt, SG Highway/Shela residential boom), a 100-200% jantri revision creating urgency, English-speaking buyer class + NRI money that can't read Gujarati records, and AnyROR already covers it. Win one city's brokers and lawyers; the playbook then copies to Surat/Vadodara/Rajkot, then other states (MahaBhulekh for Maharashtra is the same scraping pattern).

## What "premier" means — the moat ladder
1. **Coverage** (done): every district/taluka, live from AnyROR.
2. **Trust artifact** (shipped today): the Title Clearance Score (0-100, CLEAR/CAUTION/HIGH RISK) with a check-by-check breakdown and printable report. This is what people forward on WhatsApp — make every report shareable and branded.
3. **Data flywheel** (foundations done): every search persists villages, survey lists, and records to Supabase. At scale you own the cleanest English-language index of Gujarat land records that exists. Cached records = instant repeat lookups = marginal cost → 0.
4. **Multi-source verdicts** (next): a real clearance check cross-references more than the 7/12 —
   - VF-6 mutation history (already scrapeable: record type exists in the app) → detect recent ownership churn, a classic fraud signal.
   - Index-2 / Garvi (sub-registrar sale deeds) → last registered transaction vs claimed owner.
   - Court-case search (eCourts API by party name + survey no) → pending litigation flag.
   - RERA Gujarat project register → is a builder already claiming this plot?
   Each source = one more check row in the score and one more thing competitors must replicate.
5. **Distribution**: brokers and DSA agents are the channel. Give them a referral code + bulk dashboard (10 free searches for every paying client they bring).

## Feature roadmap (ordered, each is shippable alone)
1. **WhatsApp-ready PDF report** — the print view styled as a 2-page branded report with QR linking back. (Print CSS exists; this is polish + share button.)
2. **Owner-name search productisation** — "find all plots owned by X in taluka Y" is the killer feature for lawyers doing due diligence; the record type already exists in the UI.
3. **Monitoring/alerts (recurring revenue!)** — "Watch this survey number": weekly re-scrape, email/WhatsApp alert on any mutation or encumbrance change. ₹99/plot/month beats one-off search revenue and uses the existing scraper + a cron.
4. **VF-6 timeline view** — render mutation history as a visual ownership chain; flags 72-AA/ganot transfers.
5. **Hindi + Gujarati UI toggle** — the report's value is English, but the *interface* should welcome vernacular users.
6. **Jantri valuation API** — auto-fill jantri rate by village (Garvi data) into the FSI calculator and report; lets you quote stamp-duty estimates.
7. **Auth + teams** (before scale): Supabase magic-link auth replacing localStorage email; law-firm team accounts with shared portfolios.
8. **Ahmedabad land-intel newsletter** — weekly auto-digest of jantri/DP/TP changes (content marketing that the market intel page already half-does).

## Pricing architecture (revisit once Indian server is live)
- Free: 2 trial searches (live).
- Individual: ₹299/search or ₹999/5 — impulse-purchasable.
- Professional (brokers/lawyers): ₹2,499/mo — 30 searches + watch-list + owner-name search.
- Enterprise (banks/NBFCs): API + bulk verification, custom (the current "Bank Bulk Deals" card).
- The ₹1,500/search current price should become the *report* price for enterprise, not the consumer price.

## Competitive landscape — what to take from every land app in India (researched June 2026)

**Landeed** (the category leader, ₹19.5 Cr funded, 24 states, 120+ document types) — steal four things:
(1) *Prohibited Property Checker* — flag wakf, forest, government, 72-AA/restricted and blacklisted parcels before purchase; for Gujarat this is a deterministic checklist against tenure + owner fields we already extract. (2) *Property Locker* — let users store their deeds/7-12/EC in an encrypted vault (Supabase storage; drives retention + account creation). (3) *Watchlist with mutation alerts* — already on our roadmap; Landeed proves people pay for it. (4) *Document bundles* — sell a "Title Pack" (7/12 + VF-6 history + index-2 + EC) as one purchase instead of per-search.

**TEAL** (bank-grade diligence, aggregates 900+ sources incl. courts) — the lesson: **litigation search**. eCourts API lookup by owner name + village turns our report from "record check" into "title check". Banks/NBFCs pay for exactly this; it's the enterprise wedge.

**Zapkey** (registered transaction data) — *comparable sales*: Gujarat's Garvi/IGR index-2 data gives actual registered sale prices near a parcel. A "Recent registered transactions within 1 km" section in the land report is the single most persuasive data point for buyers.

**Bhunaksha** (govt cadastral maps, NIC, many states) — the holy grail integration: render actual survey-number plot boundaries on our map so users *click a plot → get its survey number → run the title check*, no typing. HydraLakes does this for Telangana; Gujarat's cadastral layer via Bhunaksha/RoR maps should be investigated from the Indian server (likely same IP-blocking as AnyROR).

**MagicBricks PropWorth / NoBroker valuation** — instant price estimate per locality; we approximate with jantri × locality multiplier until we have transaction data.

**Govt quick wins (deterministic, free, build anytime):** stamp duty + registration fee calculator for Gujarat (4.9% + 1%, female-owner concession) fed by the jantri rate — pairs with the FSI calculator; RERA Gujarat project lookup by location; bullet-train (MAHSR) and DMIC corridor proximity in the infra layer — both pass through Ahmedabad and move land prices.

**Expansion sequencing by state portal:** Maharashtra (MahaBhulekh + most liquid market) → Karnataka (Bhoomi RTC) → Telangana/AP (Dharani/Webland, where Landeed started — fight them last, not first).

## Hard dependencies, in order
1. **Indian IP for the scraper** — see DEPLOY_INDIA.md (Oracle Cloud Mumbai, free). Without this nothing else matters.
2. Keep-warm + uptime monitor (cron-job.org, free).
3. Stripe (or Razorpay for INR UPI — UPI is how individuals will actually pay).
4. Supabase Auth before the watch-list feature.
