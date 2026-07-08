/* ──────────────────────────────────────────────────────────────
   /investors — data layer for the fundraising narrative.
   Every figure here traces to the repo's own strategy docs:
   PAN_INDIA_PLAYBOOK.md, PRODUCT_ROADMAP.md, AGENT_BRIEFING.md,
   LAUNCH_CHECKLIST.md — or to commonly-cited public estimates
   clearly labelled as market framing. No invented traction:
   no user counts, no MRR, no signed customers.
   ────────────────────────────────────────────────────────────── */

/* ── Hero counters — only honest, shipped numbers ─────────────── */
export const HERO_STATS: { n: number; suffix: string; label: string }[] = [
  { n: 1, suffix: "", label: "state pipeline live" },
  { n: 13, suffix: "", label: "states in the adapter registry" },
  { n: 4, suffix: "", label: "fulfilment channels" },
  { n: 12, suffix: "", label: "restriction layers designed" },
  { n: 33, suffix: "", label: "Gujarat districts indexed" },
  { n: 18000, suffix: "+", label: "villages indexed" },
];

/* ── Problem cards — quantified, honestly attributed ──────────── */
export const PROBLEM_CARDS: {
  stat: string;
  statLabel: string;
  body: string;
}[] = [
  {
    stat: "~2/3",
    statLabel: "of civil litigation",
    body:
      "Land and property disputes are commonly estimated to account for roughly two-thirds of India's civil caseload. Land is the country's largest asset class — and its most litigated.",
  },
  {
    stat: "Presumptive",
    statLabel: "not guaranteed",
    body:
      "Indian land titles are presumptive: the record shows who the revenue department believes holds the land, not a state-guaranteed ownership. The burden of verification sits entirely on the buyer.",
  },
  {
    stat: "Weeks",
    statLabel: "and lakhs in fees",
    body:
      "The standard answer is a lawyer-run 30-year search: registrar-office queues, regional-script records, opinion letters. Buyers pay lakhs and wait weeks for a verdict a machine can assemble in minutes.",
  },
];

/* ── Router channels (diagram legend) ─────────────────────────── */
export const CHANNEL_LEGEND: {
  name: string;
  sla: string;
  note: string;
  accent?: boolean;
}[] = [
  { name: "Verified cache", sla: "Instant", note: "already-checked parcels, served free" },
  { name: "DigiLocker rails", sla: "Seconds", note: "government-signed PDFs, ~12 issuer states" },
  { name: "Live portal fetch", sla: "Minutes", note: "CAPTCHA solved, local script translated" },
  { name: "Human network", sla: "Days", note: "certified copies from the Sub-Registrar's office", accent: true },
];

/* ── The 12-layer restriction engine — the wedge ──────────────── */
/* Facts from riskLayers / restriction wedge: "others fetch documents;
   we answer is this buildable and is the title clean." */
export const RESTRICTION_LAYERS: string[] = [
  "Tenure & Juni Sharat",
  "Encumbrances (boja)",
  "Mutation-chain gaps",
  "Litigation (eCourts)",
  "Agricultural / NA status",
  "FSI & zoning (CGDCR)",
  "Coastal / CRZ",
  "Forest & eco-sensitive",
  "Water-body buffers",
  "Road & TP-scheme lines",
  "Acquisition notices",
  "Wakf / trust / government",
];

/* ── Market framing — TAM → SAM → SOM (ranges, not precision) ── */
export const MARKET_BANDS: {
  key: string;
  ring: string;
  r: number;
  fill: string;
  stroke: string;
  cite: string;
}[] = [
  {
    key: "TAM",
    ring: "India real-estate transactions",
    r: 168,
    fill: "var(--color-brand-soft)",
    stroke: "var(--color-brand)",
    cite: "The country's largest asset class, by transaction volume",
  },
  {
    key: "SAM",
    ring: "Annual title & diligence spend",
    r: 116,
    fill: "var(--color-surface)",
    stroke: "var(--color-brand)",
    cite: "What buyers, lawyers & banks already pay to verify title",
  },
  {
    key: "SOM",
    ring: "Digital-first serviceable slice",
    r: 66,
    fill: "var(--color-accent-soft)",
    stroke: "var(--color-accent)",
    cite: "Where we start: Gujarat, live — one state, one city",
  },
];

/* ── Roadmap / GTM — Ahmedabad-first → enterprise ─────────────── */
export const ROADMAP: { phase: string; title: string; body: string }[] = [
  {
    phase: "Now · live",
    title: "Ahmedabad-first, Gujarat depth",
    body:
      "Highest land-transaction velocity in Gujarat — Dholera, Sanand, SG Highway — plus NRI money that can't read Gujarati records. All 33 districts indexed from AnyROR. Win the city's brokers and lawyers, then Surat / Vadodara / Rajkot.",
  },
  {
    phase: "Step 1 · gating",
    title: "Indian-infrastructure deployment",
    body:
      "NIC-hosted portals throttle foreign data-center traffic. One Mumbai deployment unlocks the Gujarat scraper and eCourts litigation search in production — the single gating dependency, and the first use of funds.",
  },
  {
    phase: "Step 2",
    title: "Maharashtra + Karnataka",
    body:
      "MahaBhulekh (India's biggest land market, next door) then Bhoomi RTC for Bangalore demand. Same adapter pattern; Marathi and Kannada are the same translation muscle as Gujarati. The launch moment: multi-state title checks in English.",
  },
  {
    phase: "Step 3",
    title: "DigiLocker requester status",
    body:
      "One official integration yields government-signed land records across ~12 issuer states — no CAPTCHA, no IP games. Pure paperwork now, a coverage step-change on approval: the jump from a handful of states to a dozen on the map.",
  },
  {
    phase: "Step 4",
    title: "Enterprise & bank verification",
    body:
      "The certified/manual channel and API access turn one-off searches into bulk collateral verification — the boring, lucrative end-state. The incumbent's home states come last: we fight where they are weakest.",
  },
];

/* ── Business-model ladder ────────────────────────────────────── */
export const PRICING_LADDER: {
  tier: string;
  price: string;
  note: string;
  accent?: boolean;
}[] = [
  { tier: "Free trials", price: "2 searches", note: "See the verdict before paying — the funnel starts at zero." },
  { tier: "Per-search", price: "from ₹299", note: "Impulse-purchasable single verdicts for individual buyers." },
  { tier: "Title Pack", price: "5-search bundle", note: "Bundled searches today; per-state document packs as states come online." },
  { tier: "Certified & manual", price: "₹1,500–4,999", note: "SRO-fetched certified copies and 30-year search reports, advocate-reviewed.", accent: true },
  { tier: "Bank & enterprise", price: "Custom", note: "Bulk collateral verification and API access — the boring, lucrative tier.", accent: true },
];

/* ── Illustrative unit economics ──────────────────────────────── */
/* CLEARLY LABELLED ILLUSTRATIVE. These are cost-structure intuitions,
   not measured margins — the point is the shape, not a claimed figure. */
export const UNIT_ECONOMICS: {
  label: string;
  price: string;
  cost: string;
  intuition: string;
  accent?: boolean;
}[] = [
  {
    label: "Instant search (per-search)",
    price: "₹299",
    cost: "portal fetch + parse",
    intuition: "Marginal cost is a scrape and an AI parse; a cached repeat costs almost nothing.",
  },
  {
    label: "Certified & manual",
    price: "₹1,500–4,999",
    cost: "SRO fee + partner run",
    intuition: "Priced to clear the on-ground cost with margin — the tier that earns the enterprise conversation.",
    accent: true,
  },
];

/* ── Competition — honest positioning vs the incumbent ────────── */
export const COMPETITION: {
  dimension: string;
  incumbent: string;
  us: string;
}[] = [
  { dimension: "Coverage", incumbent: "Broad — many states, 120+ document types", us: "Deep — fewer states, every check that matters, one verdict" },
  { dimension: "Output", incumbent: "Fetches the document", us: "Answers the question: is this title clean, is this buildable" },
  { dimension: "Restriction engine", incumbent: "Document retrieval", us: "12-layer development-restriction analysis on top of the record" },
  { dimension: "Corpus", incumbent: "Large document store", us: "Risk-scored English-language index that compounds per search" },
  { dimension: "Funding", incumbent: "~$16.3M raised over five rounds", us: "Raising our first institutional round" },
];
