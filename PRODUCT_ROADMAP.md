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

## Hard dependencies, in order
1. **Indian IP for the scraper** — see DEPLOY_INDIA.md (Oracle Cloud Mumbai, free). Without this nothing else matters.
2. Keep-warm + uptime monitor (cron-job.org, free).
3. Stripe (or Razorpay for INR UPI — UPI is how individuals will actually pay).
4. Supabase Auth before the watch-list feature.
