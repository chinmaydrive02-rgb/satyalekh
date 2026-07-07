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
