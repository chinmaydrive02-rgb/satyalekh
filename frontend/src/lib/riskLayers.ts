// ── Development Restrictions & Risk Engine — layer definitions ──
// Twelve screening layers, each anchored to the real Indian statute or
// regulation it encodes. Statuses are honest: "live" links to the page
// where the check already runs today; "partial" means part of the layer
// is live; "beta" means rules are encoded but not yet surfaced;
// "planned" means we still need the underlying dataset.

export type LayerStatus = "live" | "partial" | "beta" | "planned";

export interface RiskLayer {
  id: number;
  title: string;
  citation: string;          // the statute / rule the layer encodes
  checks: string[];          // what the engine actually screens
  status: LayerStatus;
  note: string;              // honest status detail
  href?: string;             // where the live piece runs today
  hrefLabel?: string;
}

export const RISK_LAYERS: RiskLayer[] = [
  {
    id: 1,
    title: "Heritage & ASI monuments",
    citation: "AMASR Act 1958 (2010 amdt) §20A–20B · Ahmedabad WHC heritage GDCR",
    checks: [
      "100 m prohibited zone — no construction around any centrally protected monument",
      "100–200 m regulated zone — works need NOC from the Competent Authority",
      "Ahmedabad walled city (UNESCO 2017) heritage precincts under the GDCR",
    ],
    status: "beta",
    note: "ASI monument coordinates encoded; walled-city precinct polygons in progress.",
  },
  {
    id: 2,
    title: "Forests, parks & eco-sensitive zones",
    citation: "Wildlife (Protection) Act 1972 · Forest (Conservation) Act 1980 · ESZ notifications",
    checks: [
      "Distance to protected areas — Gir, Blackbuck NP Velavadar, Nalsarovar, Wild Ass Sanctuary",
      "Eco-sensitive zone bands — 10 km default applies where the final ESZ is un-notified",
      "Forest-department land flags that trigger FC Act clearance before any use change",
    ],
    status: "planned",
    note: "Needs protected-area boundary data — sourcing from state ESZ notifications.",
  },
  {
    id: 3,
    title: "Airport & defence zones",
    citation: "GSR 751(E) 2015 — AAI NOCAS height rules · Works of Defence Act 1903",
    checks: [
      "AAI colour-coded height zones (green → red) & NOCAS NOC for approach / transition funnel surfaces",
      "Distance to SVPIA and other aerodromes — funnel-surface proximity flag",
      "No-construction bands & no-fly / security zones around cantonments, naval and air-force stations",
    ],
    status: "partial",
    note: "Airport-funnel & metro proximity screening runs live in Land Intel today; NOCAS colour-zone maps and defence bands are planned.",
    href: "/land-intel",
    hrefLabel: "Live in Land Intel",
  },
  {
    id: 4,
    title: "Seismic risk (IS 1893)",
    citation: "IS 1893 (Part 1): 2016 — seismic zoning map of India",
    checks: [
      "Zone V — Kutch (severe, Z=0.36) · Zone IV — much of Saurashtra & north Gujarat (Z=0.24) · Zone III elsewhere (Z=0.16)",
      "Investing advice by zone — ductile-detailing cost uplift & insurance loading vs Zone III baseline",
    ],
    status: "beta",
    note: "District → zone lookup table encoded; surfacing in reports next.",
  },
  {
    id: 5,
    title: "Agricultural status & tenure",
    citation: "Gujarat Land Revenue Code §65 · Ganotdhara tenancy law · Navi Sharat rules",
    checks: [
      "Is the parcel agricultural? NA (non-agricultural) conversion required before development",
      "Ganotdhara (tenancy) restrictions on transfer to non-agriculturists",
      "New-tenure (Navi Sharat) land — premium + collector permission before sale or NA use",
    ],
    status: "partial",
    note: "Tenure & Navi Sharat screening already runs inside every title report; the standalone NA-status flag is in beta.",
    href: "/",
    hrefLabel: "Live in the title score",
  },
  {
    id: 6,
    title: "Prohibited ownership categories",
    citation: "Government · gauchar (grazing) · wakf · trust · forest-department land",
    checks: [
      "20-point prohibited-category screen inside the 0–100 title score",
      "Flags parcels recorded as government, gauchar, wakf, trust or forest land",
    ],
    status: "live",
    note: "Live today in every Gujarat title report.",
    href: "/",
    hrefLabel: "Live in the title score",
  },
  {
    id: 7,
    title: "Petroleum & gas pipelines",
    citation: "Petroleum & Minerals Pipelines (Acquisition of Right of User) Act 1962 §§4–7",
    checks: [
      "No construction on the Right-of-User (RoU) corridor itself — the operator's strip is a no-build band",
      "Restricted-activity band beyond the RoU — deep excavation, blasting & heavy foundations need operator NOC",
      "GAIL HVJ gas trunk (Hazira–Vijaipur–Jagdishpur) · GSPL gas grid · ONGC crude & product lines — all cross Gujarat heavily",
    ],
    status: "planned",
    note: "Corridor alignments require the operator's alignment sheet (GAIL / GSPL / ONGC).",
  },
  {
    id: 8,
    title: "High-tension transmission lines",
    citation: "Indian Electricity Rules 1956 r.77 (vertical) / r.80 (horizontal) · CEA (Safety) Regs 2010 Reg.58",
    checks: [
      "Horizontal clearance by voltage class — 11/66 kV ≈ 1.2 m · 132 kV ≈ 2.2 m · 220 kV ≈ 3.7 m · 400 kV ≈ 6.4 m",
      "Vertical clearance where a line crosses over — 2.5 m up to 33 kV, +0.3 m per extra 33 kV",
      "No habitable structure directly under the line (CEA 2010 Reg.58); tower-footing setbacks",
    ],
    status: "planned",
    note: "GETCO / PGCIL corridor alignments required.",
  },
  {
    id: 9,
    title: "Water bodies & CRZ",
    citation: "CRZ Notification 2019 · Sabarmati riverfront DC regulations · lake buffers",
    checks: [
      "Lake and river no-development buffers — flagged in Land Intel red flags today",
      "CRZ I–IV classification for coastal parcels along India's longest coastline",
    ],
    status: "live",
    note: "Lake/river buffer flags live in Land Intel; CRZ classification is planned.",
    href: "/land-intel",
    hrefLabel: "Live in Land Intel",
  },
  {
    id: 10,
    title: "GDCR engine",
    citation: "Comprehensive GDCR (CGDCR-2017) — zoning, FSI, margins, parking",
    checks: [
      "Residential intensity — R1 (low-rise) · R2 (mid-rise) · R3 (high-rise); plus commercial, agriculture, gamtal",
      "Non-development / green-belt / recreation zones flagged as no-build outcomes",
      "Base vs chargeable (premium) FSI, road-width-linked FSI caps & height intuition",
      "Margins and parking norms by use and building height",
    ],
    status: "live",
    note: "FSI & chargeable-premium calculator live on Compliance; margins/parking engine in beta.",
    href: "/compliance",
    hrefLabel: "Live FSI calculator",
  },
  {
    id: 11,
    title: "Town Planning schemes",
    citation: "Gujarat Town Planning & Urban Development Act 1976",
    checks: [
      "Original plot → final plot mapping — records the FP number your deed should reference",
      "~40% land deduction for roads and amenities in draft schemes",
      "Betterment charges and scheme-finalisation status",
    ],
    status: "planned",
    note: "TP scheme registers being digitised authority by authority.",
  },
  {
    id: 12,
    title: "Fraud & litigation signals",
    citation: "eCourts district data · Benami Transactions (Prohibition) Act 1988",
    checks: [
      "District-court cases naming the recorded owner — live litigation check",
      "Repeated rapid mutations and power-of-attorney chains (velocity analysis)",
      "Benami patterns and news / land-mafia adjacency screening",
    ],
    status: "live",
    note: "Litigation check live; mutation-velocity in beta; news screening needs data partnerships.",
    href: "/",
    hrefLabel: "Live litigation check",
  },
];

// ── Sample screening — one mock Ahmedabad parcel, deterministic ──
// Clearly labelled illustrative sample: Final Plot 214, TP Scheme 74, Bopal.

export type CheckOutcome = "clear" | "caution" | "restricted";

export interface SampleCheck {
  layer: string;
  outcome: CheckOutcome;
  finding: string;
}

export const SAMPLE_PARCEL = {
  label: "Final Plot 214 · TP Scheme 74 (Bopal)",
  location: "Bopal, Daskroi, Ahmedabad",
  ref: "SL-RISK-0214",
};

// ── Interactive parcel screening — request / response contract ──
// The risk-intel page POSTs {region, zone, road_width_m, is_agricultural}
// to `${API_BASE_URL}/risk-screen`. The backend is expected to return a
// per-layer breakdown; every field is treated as optional and defensively
// normalised, so an incomplete or partial payload never breaks the page.

export type ScreenOutcome = CheckOutcome | "unknown";

export interface ScreenRequest {
  region: string;
  zone: string;
  road_width_m: number;
  is_agricultural: boolean;
}

export interface ScreenLayerResult {
  layer: string;
  outcome: ScreenOutcome;
  finding: string;
  advice?: string;    // plain-English "what to do about it" (optional)
  citation?: string;  // the statute / rule the finding rests on (optional)
}

// ── What each verdict means — a concise, honest legend ──────────
// Rendered under the interactive result so a first-time reader knows how to
// act on each outcome. Tolerant: purely presentational.
export interface OutcomeLegend {
  key: ScreenOutcome;
  label: string;
  meaning: string;
}

export const OUTCOME_LEGEND: OutcomeLegend[] = [
  { key: "clear", label: "Clear", meaning: "No restriction from the encoded rules for the inputs given — still verify on the real survey number." },
  { key: "caution", label: "Caution", meaning: "Buildable, but a site-specific NOC, clearance or confirmation is needed before plan submission." },
  { key: "restricted", label: "Restricted", meaning: "A hard restriction applies — resolve it (zone change, NA, NOC) or design around the affected area." },
  { key: "unknown", label: "Needs geodata", meaning: "The rule is encoded but the reference dataset isn't wired in yet — verify with a site survey / DILR / DISCOM / GAIL-ONGC sheet." },
];

export interface RiskScreenResponse {
  verdict?: string;
  summary?: string;
  layers?: ScreenLayerResult[];
  counts?: Partial<Record<ScreenOutcome, number>>;
}

export const SCREEN_REGIONS = [
  "Kutch", "Saurashtra", "North Gujarat", "Central Gujarat", "South Gujarat",
] as const;
export const SCREEN_ZONES = [
  "Agriculture", "R1", "R2", "R3", "Commercial",
] as const;
export const SCREEN_ROAD_WIDTHS = [9, 12, 18, 24, 30] as const;

export type ScreenRegion = (typeof SCREEN_REGIONS)[number];
export type ScreenZone = (typeof SCREEN_ZONES)[number];

// ── Deterministic local fallback ────────────────────────────────
// Used when the backend is unreachable. Produces an honest, rule-shaped
// per-layer breakdown from the same inputs, so the demo never looks broken.

const SEISMIC_BY_REGION: Record<ScreenRegion, { zone: string; outcome: ScreenOutcome; note: string; advice: string }> = {
  "Kutch": { zone: "Zone V", outcome: "restricted", note: "Zone V (severe, Z=0.36) — highest IS-1893 design category; specialist structural design mandatory", advice: "Severe hazard: IS-13920 ductile detailing, deeper/raft foundations, ~8–15% structural-cost uplift and higher insurance loading vs Zone III." },
  "Saurashtra": { zone: "Zone IV", outcome: "caution", note: "Zone IV (high, Z=0.24) — high seismicity; Zone-IV design + ductile detailing mandatory", advice: "High hazard: ~4–8% structural-cost uplift over Zone III and a modest insurance loading." },
  "North Gujarat": { zone: "Zone IV", outcome: "caution", note: "Zone IV (high, Z=0.24) — high seismicity; Zone-IV design + ductile detailing", advice: "High hazard: ~4–8% structural-cost uplift over Zone III and a modest insurance loading." },
  "Central Gujarat": { zone: "Zone III", outcome: "clear", note: "Zone III (moderate, Z=0.16) — standard IS-1893 (Part 1) design applies", advice: "Moderate hazard: no material seismic cost or insurance premium beyond code compliance." },
  "South Gujarat": { zone: "Zone III", outcome: "clear", note: "Zone III (moderate, Z=0.16) — standard IS-1893 (Part 1) design applies", advice: "Moderate hazard: no material seismic cost or insurance premium beyond code compliance." },
};

const FSI_BY_ROAD: Record<number, { base: string; premium: string }> = {
  9: { base: "1.2", premium: "1.8" },
  12: { base: "1.8", premium: "2.7" },
  18: { base: "1.8", premium: "2.7" },
  24: { base: "2.7", premium: "4.0" },
  30: { base: "3.0", premium: "5.4" },
};

/** Deterministic, clearly-labelled local screening — the fallback data. */
export function localScreen(req: ScreenRequest): RiskScreenResponse {
  const region = (SCREEN_REGIONS as readonly string[]).includes(req.region)
    ? (req.region as ScreenRegion)
    : "Central Gujarat";
  const seismic = SEISMIC_BY_REGION[region];
  const isCoastal = region === "Saurashtra" || region === "South Gujarat" || region === "Kutch";
  const fsi = FSI_BY_ROAD[req.road_width_m] ?? FSI_BY_ROAD[12];
  const narrowRoad = req.road_width_m <= 9;

  const layers: ScreenLayerResult[] = [
    {
      layer: "Heritage & ASI",
      outcome: "clear",
      finding: "No centrally-protected monument within the 100 m prohibited or 200 m regulated AMASR band on this sample parcel",
    },
    {
      layer: "Forests & ESZ",
      outcome: region === "Saurashtra" ? "caution" : "clear",
      finding: region === "Saurashtra"
        ? "Saurashtra hosts Gir & Blackbuck NP — confirm distance to the nearest sanctuary and its 10 km default ESZ band"
        : "No national park or sanctuary within the 10 km default ESZ band on this sample parcel",
    },
    {
      layer: "Airport & defence",
      outcome: "caution",
      finding: "Verify distance to the nearest aerodrome — heights above the AAI colour-zone cap need a NOCAS NOC before plan sanction",
    },
    {
      layer: "Seismic (IS 1893)",
      outcome: seismic.outcome,
      finding: `${seismic.zone} — ${seismic.note}`,
      citation: "IS 1893 (Part 1) : 2016",
      advice: seismic.advice,
    },
    {
      layer: "Agricultural / NA status",
      outcome: req.is_agricultural ? "restricted" : "clear",
      finding: req.is_agricultural
        ? "Agricultural land — NA (non-agricultural) conversion under GLRC §65 required before any development; check Ganotdhara / Navi Sharat tenure"
        : "Non-agricultural order assumed on record — no §65 conversion gate for the selected use",
      citation: "Gujarat Land Revenue Code §65",
      advice: req.is_agricultural
        ? "Obtain the §65 NA order (and pay any Navi-Sharat premium / collector permission) before you transact or apply for a plan."
        : undefined,
    },
    {
      layer: "Prohibited category",
      outcome: "clear",
      finding: "Sample parcel not recorded as government, gauchar, wakf, trust or forest land — passes the 20-point screen",
    },
    {
      layer: "Pipelines (PMP Act)",
      outcome: "caution",
      finding: "Confirm no GAIL HVJ gas trunk / GSPL grid / ONGC crude RoU corridor clips the plot — the Right-of-User strip is a no-construction band",
      citation: "PMP (RoU) Act 1962 §§4–7",
      advice: "Obtain the operator's alignment sheet (GAIL / GSPL / ONGC) and their NOC for any work in the restricted-activity band; never build on the RoU strip.",
    },
    {
      layer: "HT transmission",
      outcome: "caution",
      finding: "Verify clearance to any HT line by voltage class — 220 kV ≈ 3.7 m horizontal / 4.6 m vertical; no habitable structure under the line",
      citation: "IE Rules 1956 r.77/80 · CEA 2010 Reg.58",
      advice: "Keep the statutory horizontal & vertical clearance to conductors and confirm sag & tower-footing setbacks with GETCO / PGCIL / the DISCOM.",
    },
    {
      layer: "Water bodies & CRZ",
      outcome: isCoastal ? "caution" : "clear",
      finding: isCoastal
        ? `${region} is coastal — confirm CRZ I–IV classification and lake/river no-development buffers before layout`
        : "Non-coastal — CRZ not applicable; confirm no lake/river buffer clips the plot",
    },
    {
      layer: "GDCR",
      outcome: req.zone === "Agriculture" ? "restricted" : narrowRoad ? "caution" : "clear",
      finding: req.zone === "Agriculture"
        ? `Agriculture zone — base FSI 0.0; development needs a buildable-zone change + §65 NA. Once converted, a ${req.road_width_m} m road gives base FSI ${fsi.base}, premium to ${fsi.premium}`
        : `${req.zone} on a ${req.road_width_m} m road — base FSI ${fsi.base}, chargeable premium to ${fsi.premium}; margins & parking per CGDCR-2017`,
      citation: "CGDCR-2017",
      advice: req.zone === "Agriculture"
        ? "No building on agricultural land until the zone change and NA order are in hand."
        : narrowRoad
          ? "A narrow abutting road constrains FSI and may cap height — widening or a corner plot can lift the yield."
          : undefined,
    },
    {
      layer: "TP scheme",
      outcome: "caution",
      finding: "Confirm original-plot → final-plot mapping — the deed should cite the FP number, and check betterment charges are paid",
    },
    {
      layer: "Fraud & litigation",
      outcome: "clear",
      finding: "No district-court cases assumed against the sample owner; normal mutation velocity — run the live litigation check on the real survey number",
    },
  ];

  const counts: Record<ScreenOutcome, number> = {
    clear: layers.filter((l) => l.outcome === "clear").length,
    caution: layers.filter((l) => l.outcome === "caution").length,
    restricted: layers.filter((l) => l.outcome === "restricted").length,
    unknown: layers.filter((l) => l.outcome === "unknown").length,
  };

  const verdict = counts.restricted > 0
    ? "Buildable with conditions"
    : counts.caution > 0
      ? "Buildable — verify the cautions"
      : "Clear to proceed";

  const summary = counts.restricted > 0
    ? "One or more layers flag a hard restriction — quantify the affected area and design around it, or reconsider the parcel."
    : counts.caution > 0
      ? "No hard restrictions on the sample, but several layers need a site-specific NOC or confirmation before plan submission."
      : "No restrictions surfaced on this illustrative sample — still verify on the real survey number before you transact.";

  return { verdict, summary, layers, counts };
}

export const SAMPLE_CHECKS: SampleCheck[] = [
  { layer: "Heritage & ASI", outcome: "clear", finding: "Nearest ASI monument ≈ 4.9 km — outside the 100 m prohibited and 200 m regulated AMASR bands" },
  { layer: "Forests & ESZ", outcome: "clear", finding: "No national park or sanctuary within 10 km; Thol sanctuary ESZ ≈ 19 km NW" },
  { layer: "Airport & defence", outcome: "caution", finding: "11.2 km SW of SVPIA — inside outer AAI surfaces; heights above the colour-zone cap need a NOCAS NOC" },
  { layer: "Seismic (IS 1893)", outcome: "clear", finding: "Zone III — standard IS-1893 design; a Kutch parcel would flag Zone V (severe)" },
  { layer: "Agricultural / NA status", outcome: "clear", finding: "NA (residential) order on record · Juni Sharat — freely transferable" },
  { layer: "Prohibited category", outcome: "clear", finding: "Not government, gauchar, wakf, trust or forest land — passes the 20-pt screen" },
  { layer: "Pipelines (PMP Act)", outcome: "restricted", finding: "GAIL gas trunk-line ROU clips the NE corner — 20 m no-construction strip; exclude from the layout" },
  { layer: "HT transmission", outcome: "caution", finding: "220 kV line 40 m north — horizontal clearance ok; verify tower footing and sag with GETCO/DISCOM" },
  { layer: "Water bodies & CRZ", outcome: "clear", finding: "No lake within the no-development buffer; Sabarmati ≈ 6 km; non-coastal taluka — CRZ n/a" },
  { layer: "GDCR", outcome: "clear", finding: "R1 zone on an 18 m road — base FSI 1.8, premium to 2.7; margins & parking per CGDCR" },
  { layer: "TP scheme", outcome: "caution", finding: "TPS 74 finalised — deed must cite FP 214, not the original survey number; confirm betterment charges paid" },
  { layer: "Fraud & litigation", outcome: "clear", finding: "No district-court cases naming the owner; 2 mutations in 15 years — normal velocity" },
];
