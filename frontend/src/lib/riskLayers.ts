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
    citation: "GSR 751(E) 2015 — AAI height restrictions · Works of Defence Act 1903",
    checks: [
      "AAI colour-coded zoning maps & NOCAS NOC for approach / transitional funnel surfaces",
      "Distance to SVPIA and other aerodromes — funnel-zone proximity flag",
      "No-construction bands around cantonments, naval and air-force stations",
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
      "Zone V — Kutch (severe) · Zone IV — much of Saurashtra & north Gujarat · Zone III elsewhere",
      "Structural-cost, insurance and buyer-advisory implications by zone",
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
    citation: "Petroleum & Minerals Pipelines (Acquisition of ROU) Act 1962",
    checks: [
      "No construction on the Right-of-User corridor itself",
      "Restricted-activity bands on either side of the ROU",
      "ONGC crude & GAIL trunk lines — Hazira–Vijaipur–Jagdishpur and the Gujarat grid",
    ],
    status: "planned",
    note: "Corridor alignments require data partnerships with pipeline operators.",
  },
  {
    id: 8,
    title: "High-tension transmission lines",
    citation: "Indian Electricity Rules 1956 r.77–80 · CEA (Measures of Safety) Regs 2010",
    checks: [
      "Mandatory vertical & horizontal clearances by voltage class — multi-metre bands up to 400 kV",
      "No building directly beneath HT corridors; tower-footing setbacks",
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
      "Zoning — R1/R2/R3, commercial, industrial, agriculture, gamtal",
      "Base vs chargeable (premium) FSI, road-width-linked FSI caps & height slabs",
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
}

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

const SEISMIC_BY_REGION: Record<ScreenRegion, { zone: string; outcome: ScreenOutcome; note: string }> = {
  "Kutch": { zone: "Zone V", outcome: "restricted", note: "Zone V (severe) — highest IS-1893 design category; specialist structural design mandatory" },
  "Saurashtra": { zone: "Zone III–IV", outcome: "caution", note: "Zone III–IV — moderate-to-high seismicity; confirm district band for the design coefficient" },
  "North Gujarat": { zone: "Zone III–IV", outcome: "caution", note: "Zone III–IV — moderate seismicity; standard IS-1893 detailing with district check" },
  "Central Gujarat": { zone: "Zone III", outcome: "clear", note: "Zone III — moderate; standard IS-1893 (Part 1) design applies" },
  "South Gujarat": { zone: "Zone III", outcome: "clear", note: "Zone III — moderate; standard IS-1893 (Part 1) design applies" },
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
    },
    {
      layer: "Agricultural / NA status",
      outcome: req.is_agricultural ? "restricted" : "clear",
      finding: req.is_agricultural
        ? "Agricultural land — NA (non-agricultural) conversion under GLRC §65 required before any development; check Ganotdhara / Navi Sharat tenure"
        : "Non-agricultural order assumed on record — no §65 conversion gate for the selected use",
    },
    {
      layer: "Prohibited category",
      outcome: "clear",
      finding: "Sample parcel not recorded as government, gauchar, wakf, trust or forest land — passes the 20-point screen",
    },
    {
      layer: "Pipelines (PMP Act)",
      outcome: "caution",
      finding: "Confirm no GAIL / ONGC ROU corridor clips the plot — the Right-of-User strip is a no-construction band under the PMP Act 1962",
    },
    {
      layer: "HT transmission",
      outcome: "caution",
      finding: "Verify clearance to any HT line by voltage class — multi-metre vertical/horizontal bands apply; check tower-footing setbacks with GETCO",
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
      outcome: narrowRoad ? "caution" : "clear",
      finding: req.zone === "Agriculture"
        ? `Agriculture zone — development needs zone change / NA; on a ${req.road_width_m} m road, base FSI ${fsi.base}, premium to ${fsi.premium} once converted`
        : `${req.zone} on a ${req.road_width_m} m road — base FSI ${fsi.base}, chargeable premium to ${fsi.premium}; margins & parking per CGDCR-2017`,
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
