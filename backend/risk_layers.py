# risk_layers.py — Development-restriction screening engine (12 layers).
#
# Encodes the twelve development-restriction layers surfaced on the /risk-intel
# page (see frontend/src/lib/riskLayers.ts) as a data registry + a deterministic
# screener. The registry mirrors the frontend's titles, citations, statuses and
# per-layer "checks" so the UI can render honest coverage; screen_parcel()
# evaluates a parcel against the layers using ONLY the encoded parameter tables
# and the caller-supplied inputs.
#
# Honesty principle: layers that need geodata we do not have yet (heritage
# proximity, forest/ESZ boundaries, pipeline RoU alignments, HT-line corridors,
# CRZ, TP scheme registers) return outcome "unknown" with a "needs site/geodata
# verification" finding rather than a fabricated distance. The layers we CAN
# compute from inputs — seismic (from region), GDCR base-FSI (from zone + road
# width) and agricultural/NA status (from is_agricultural) — return real,
# deterministic findings derived from the tables below.
#
# Each per-layer result carries `layer`/`outcome`/`finding` (the fields the
# frontend depends on) PLUS optional `citation` and `advice` fields — the
# statute bit the finding rests on, and a plain-English "what to do about it".
# These are additive; older frontends that ignore them keep working.
#
# NO randomness anywhere: same inputs -> same output.

from __future__ import annotations

from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# ENCODED PARAMETER TABLES
# ─────────────────────────────────────────────────────────────────────────────

# ── IS 1893 (Part 1): 2016 — seismic zone by Gujarat region ──────────────────
# Source: IS 1893 (Part 1):2016 seismic zoning map of India + BMTPC Vulnerability
# Atlas district assignments for Gujarat.
#   Zone V (severe / Z=0.36)   — Kutch region (2001 Bhuj epicentre belt)
#   Zone IV (high / Z=0.24)    — Saurashtra & North Gujarat
#   Zone III (moderate/Z=0.16) — Central/South Gujarat and the rest of the state
# `advice` carries the design/insurance-cost intuition per zone (informational,
# not a quote): higher zones -> ductile detailing, heavier steel, higher premia.
SEISMIC_ZONE_BY_REGION: dict[str, dict] = {
    "kutch": {
        "zone": "V", "factor": 0.36, "severity": "severe",
        "advice": "Severe hazard: IS-13920 ductile detailing mandatory, deeper/raft "
                  "foundations common, ~8–15% structural-cost uplift and higher "
                  "property-insurance loading vs Zone III. Budget for a geotechnical report.",
    },
    "saurashtra": {
        "zone": "IV", "factor": 0.24, "severity": "high",
        "advice": "High hazard: Zone-IV seismic design + ductile detailing; ~4–8% "
                  "structural-cost uplift over Zone III and a modest insurance loading.",
    },
    "north gujarat": {
        "zone": "IV", "factor": 0.24, "severity": "high",
        "advice": "High hazard: Zone-IV seismic design + ductile detailing; ~4–8% "
                  "structural-cost uplift over Zone III and a modest insurance loading.",
    },
    "central gujarat": {
        "zone": "III", "factor": 0.16, "severity": "moderate",
        "advice": "Moderate hazard: standard IS-1893 Zone-III design; no material "
                  "seismic cost or insurance premium beyond code compliance.",
    },
    "south gujarat": {
        "zone": "III", "factor": 0.16, "severity": "moderate",
        "advice": "Moderate hazard: standard IS-1893 Zone-III design; no material "
                  "seismic cost or insurance premium beyond code compliance.",
    },
}

# District / city -> region alias, so a caller passing a district still resolves.
_SEISMIC_REGION_ALIASES: dict[str, str] = {
    # Kutch (Zone V)
    "bhuj": "kutch", "kachchh": "kutch", "kutchh": "kutch", "gandhidham": "kutch",
    "anjar": "kutch", "mandvi": "kutch",
    # Saurashtra (Zone IV)
    "rajkot": "saurashtra", "jamnagar": "saurashtra", "junagadh": "saurashtra",
    "bhavnagar": "saurashtra", "morbi": "saurashtra", "surendranagar": "saurashtra",
    "amreli": "saurashtra", "porbandar": "saurashtra", "gir somnath": "saurashtra",
    "botad": "saurashtra", "devbhoomi dwarka": "saurashtra",
    # North Gujarat (Zone IV)
    "banaskantha": "north gujarat", "patan": "north gujarat", "mehsana": "north gujarat",
    "sabarkantha": "north gujarat", "aravalli": "north gujarat", "palanpur": "north gujarat",
    # Central Gujarat (Zone III)
    "ahmedabad": "central gujarat", "gandhinagar": "central gujarat",
    "kheda": "central gujarat", "anand": "central gujarat", "vadodara": "central gujarat",
    "baroda": "central gujarat", "panchmahal": "central gujarat", "dahod": "central gujarat",
    "mahisagar": "central gujarat", "chhota udepur": "central gujarat",
    # South Gujarat (Zone III)
    "surat": "south gujarat", "navsari": "south gujarat", "valsad": "south gujarat",
    "bharuch": "south gujarat", "narmada": "south gujarat", "tapi": "south gujarat",
    "dang": "south gujarat",
}


# ── AMASR Act 1958 (2010 amendment) — heritage proximity bands ───────────────
# Source: Ancient Monuments and Archaeological Sites and Remains (Amendment and
# Validation) Act 2010, §20A/20B.
#   0–100 m from a centrally protected monument  = PROHIBITED area (no
#     construction / reconstruction).
#   100–200 m                                     = REGULATED area (works only
#     with NOC from the National Monuments Authority / Competent Authority).
# We hold the bands here so that once monument coordinates are wired in, the
# same thresholds drive the screen. Distances themselves are NOT fabricated.
ASI_PROHIBITED_M = 100     # <=100 m: prohibited
ASI_REGULATED_M = 200      # 100–200 m: regulated (NOC required)


# ── HT transmission — statutory clearances (metres) by voltage class ─────────
# Source: Indian Electricity Rules 1956 r.77 (vertical, lines crossing over a
# building) and r.80 (horizontal, from a building to the nearest conductor),
# carried into CEA (Measures relating to Safety and Electric Supply) Regulations
# 2010, Reg. 58 / Schedule VII. r.77/80 also give the base + increment rule:
#   Horizontal — up to 33 kV = 1.2 m; then +0.3 m per additional 33 kV (or part).
#   Vertical   — up to 33 kV = 2.5 m; then +0.3 m per additional 33 kV (or part).
# The overriding rule (CEA 2010, Reg. 58) is that NO habitable/permanent
# structure may exist directly under or within these bands of an overhead line.
HT_CLEARANCE_M: dict[str, dict] = {
    "11kV":  {"horizontal": 1.2, "vertical": 2.5},
    "66kV":  {"horizontal": 1.2, "vertical": 2.5},
    "132kV": {"horizontal": 2.2, "vertical": 3.7},
    "220kV": {"horizontal": 3.7, "vertical": 4.6},
    "400kV": {"horizontal": 6.4, "vertical": 7.3},
}
# Back-compat: horizontal-only view kept for any existing importer.
HT_HORIZONTAL_CLEARANCE_M: dict[str, float] = {
    k: v["horizontal"] for k, v in HT_CLEARANCE_M.items()
}


# ── PMP (RoU) Act 1962 — petroleum & gas pipeline corridors ──────────────────
# Source: Petroleum & Minerals Pipelines (Acquisition of Right of User in Land)
# Act 1962, §§ 4–7. The operator acquires a Right-of-User (RoU) strip — the land
# owner retains title but CANNOT build on / obstruct the RoU. Typical operator
# alignment sheets use a ~18–30 m RoU width (trunk gas lines wider), with a
# further "restricted activity" band either side (deep excavation, blasting,
# heavy foundations need operator NOC). Major Gujarat trunk lines encoded so the
# UI can name them honestly; exact alignments still need the operator's sheet.
PMP_ROU_WIDTH_M = 30          # indicative no-construction RoU strip (verify per line)
PMP_RESTRICTED_BAND_M = 60    # indicative restricted-activity band beyond the RoU
GUJARAT_TRUNK_PIPELINES: list[dict] = [
    {
        "name": "HVJ trunk (Hazira–Vijaipur–Jagdishpur)",
        "operator": "GAIL",
        "product": "natural gas",
        "note": "National gas trunk line originating at Hazira (Surat) — runs NE "
                "across South & Central Gujarat before leaving the state.",
    },
    {
        "name": "Dahej–Uran / Gujarat gas grid",
        "operator": "GAIL / GSPL",
        "product": "natural gas",
        "note": "Dense gas-grid spurs across the Bharuch–Vadodara–Ahmedabad belt.",
    },
    {
        "name": "ONGC crude & product lines",
        "operator": "ONGC",
        "product": "crude oil / petroleum products",
        "note": "Ankleshwar, Gandhar, Hazira and Cambay-basin crude/product lines "
                "criss-cross Central & South Gujarat.",
    },
]


# ── Other utility easements (advisory) ───────────────────────────────────────
# Grouped advisory for the everyday buried/overhead services that also carry
# easements or setback expectations but are not a single statute: piped-gas
# distribution (PNGRB-licensed CGD networks), municipal water & sewer mains,
# and OFC / telecom right-of-way (Indian Telegraph RoW Rules 2016). Not a hard
# restriction on their own — but a service easement across the plot constrains
# where you can put foundations, basements and boundary walls.
UTILITY_EASEMENTS = [
    "Piped natural-gas (CGD) distribution mains — PNGRB-licensed operator setbacks",
    "Municipal water & sewer trunk mains — no-build easement over the alignment",
    "OFC / telecom right-of-way — Indian Telegraph RoW Rules 2016 easements",
]


# ── AAI NOCAS / Works of Defence — aviation & defence height zones ───────────
# Source: GSR 751(E) 2015 (Aircraft — Demolition of Obstructions Caused by
# Buildings and Trees etc. Rules) administered via AAI's NOCAS colour-coded
# height maps around aerodromes, plus the approach/transition funnel surfaces of
# the ICAO obstacle-limitation surfaces; and the Works of Defence Act 1903
# (restricted zones around cantonments / naval / air-force stations).
# Colour zones are the AAI convention (green = tallest permissible, red =
# near-zero / NOC mandatory). Exact caps are site- and elevation-specific — we
# encode the schema, never a fabricated per-plot height.
AAI_COLOUR_ZONES = [
    {"colour": "green", "meaning": "Outermost — highest permissible top elevation; NOCAS NOC still advisable"},
    {"colour": "blue", "meaning": "Intermediate — reduced height cap; NOCAS NOC required above the cap"},
    {"colour": "yellow", "meaning": "Inner — low height cap near approach/transition surfaces"},
    {"colour": "red", "meaning": "Innermost / funnel — near-zero cap; construction needs explicit AAI NOC"},
]
DEFENCE_ADVISORY = (
    "Works of Defence Act 1903 imposes no-construction / restricted-works zones "
    "around notified defence installations (cantonments, naval & air-force "
    "stations); some also fall under 'no-fly' / security bands. Verify with the "
    "local Station HQ / Defence Estates before planning near one."
)


# ── CGDCR-2017 — base FSI, permitted use & height intuition by zone ───────────
# Source: Comprehensive General Development Control Regulations 2017 (Gujarat).
# Base FSI is keyed to zone AND the width of the abutting road; chargeable
# (premium) FSI can lift these further on payment (not computed here). Height is
# not a single statutory number in CGDCR (it flows from FSI, margins, road width
# and the fire/high-rise rules) — so we carry a plain-English HEIGHT INTUITION,
# not a fabricated metre cap.
#
# Road-width bands (metres): <9, 9–<12, 12–<18, 18–<24, 24–<30, >=30.
# Residential intensity distinctions:
#   R1 — low-intensity / affordable / gamtal-fringe residential (low rise)
#   R2 — general residential (mid rise)
#   R3 — high-density residential (high rise, towers on wide roads)
ROAD_WIDTH_BANDS_M = [9.0, 12.0, 18.0, 24.0, 30.0]   # lower edges of slabs >9m

# For each zone: FSI for [<9m, 9–12, 12–18, 18–24, 24–30, >=30]
GDCR_BASE_FSI: dict[str, list[float]] = {
    "agriculture": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "r1":          [1.2, 1.2, 1.8, 1.8, 1.8, 1.8],
    "r2":          [1.2, 1.8, 1.8, 2.7, 2.7, 3.0],
    "r3":          [1.8, 1.8, 2.7, 3.0, 3.6, 4.0],
    "commercial":  [1.5, 2.0, 3.0, 4.0, 4.0, 5.4],
}

# Per-zone descriptors: permitted-use intuition + height intuition. Informational
# strings (CGDCR-2017 style), NOT a substitute for the sanctioned DP/TP zoning.
GDCR_ZONE_PROFILE: dict[str, dict] = {
    "agriculture": {
        "use": "Farming / farmhouse only — no urban development without a zone "
               "change to a developable use plus s.65 NA conversion.",
        "height": "No habitable-building height until converted.",
    },
    "r1": {
        "use": "Low-intensity residential (plotted / affordable / gamtal-fringe); "
               "small shops on the ground floor typically permitted.",
        "height": "Low-rise — typically up to ~2–4 floors on narrow roads.",
    },
    "r2": {
        "use": "General residential — apartments and mixed residential with "
               "convenience commercial along wider roads.",
        "height": "Mid-rise; height rises with road width and chargeable FSI.",
    },
    "r3": {
        "use": "High-density residential — apartment towers, higher ground coverage.",
        "height": "High-rise on 18 m+ roads; high-rise fire/NOC rules apply above 15/23/45 m.",
    },
    "commercial": {
        "use": "Commercial / mixed use — offices, retail, hospitality.",
        "height": "Mid- to high-rise on wide roads; high-rise NOC regime applies.",
    },
}

# ── Non-developable / no-building CGDCR zones (explicit outcomes) ─────────────
# Zones where the sanctioned plan permits little or no building. Passing any of
# these returns a hard "restricted" so the UI never green-lights construction on
# land the DP has reserved.
NON_DEVELOPABLE_ZONES: dict[str, str] = {
    "non-development": "Non-development / no-development zone — the DP reserves this "
                       "land against building; development is not permitted.",
    "green-belt": "Green-belt / agricultural-green zone — reserved as open/green; "
                  "no urban building (limited farm/utility uses only).",
    "green belt": "Green-belt / agricultural-green zone — reserved as open/green; "
                  "no urban building (limited farm/utility uses only).",
    "gamtal": "Gamtal (village abadi) — old settlement core; special/relaxed norms "
              "apply and title/tenure needs care, but it is NOT a general "
              "developable zone — verify the sanctioned use plot-by-plot.",
    "recreation": "Recreation / garden reservation — reserved as open space; no "
                  "private building.",
    "water-body": "Water-body / lake reservation — no building; buffer applies.",
    "water body": "Water-body / lake reservation — no building; buffer applies.",
}

# Zone-name aliases so callers can pass friendly labels.
_ZONE_ALIASES: dict[str, str] = {
    "agri": "agriculture", "agricultural": "agriculture", "agriculture": "agriculture",
    "r1": "r1", "residential-1": "r1", "residential1": "r1",
    "r2": "r2", "residential-2": "r2", "residential2": "r2", "residential": "r2",
    "r3": "r3", "residential-3": "r3", "residential3": "r3",
    "commercial": "commercial", "comm": "commercial",
}


def _road_slab_index(road_width_m: float) -> int:
    """Map a road width (m) to its FSI-table column index (0..5)."""
    idx = 0
    for edge in ROAD_WIDTH_BANDS_M:
        if road_width_m >= edge:
            idx += 1
        else:
            break
    return idx


def _road_slab_label(idx: int) -> str:
    labels = ["<9 m", "9–12 m", "12–18 m", "18–24 m", "24–30 m", ">=30 m"]
    return labels[idx]


# ─────────────────────────────────────────────────────────────────────────────
# LAYER REGISTRY — 12 entries mirroring frontend/src/lib/riskLayers.ts
# ─────────────────────────────────────────────────────────────────────────────
# Each entry: key, title, citation (real statute/rule), status ("live" |
# "partial" | "beta" | "planned" — consistent with the frontend), and a short
# `checks` description of what the layer screens.

LAYERS: list[dict] = [
    {
        "key": "heritage_asi",
        "title": "Heritage & ASI monuments",
        "citation": "AMASR Act 1958 (2010 amdt) §20A–20B — 100 m prohibited / 100–200 m regulated bands",
        "status": "beta",
        "checks": "Proximity to centrally protected monuments: 100 m prohibited zone, 100–200 m regulated zone (NOC required).",
    },
    {
        "key": "forest_ecozone",
        "title": "Forests, parks & eco-sensitive zones",
        "citation": "Wildlife (Protection) Act 1972 · Forest (Conservation) Act 1980 · ESZ notifications (10 km default)",
        "status": "planned",
        "checks": "Distance to protected areas (Gir, Velavadar, Nalsarovar, Wild Ass Sanctuary) and eco-sensitive-zone bands.",
    },
    {
        "key": "airport_defence",
        "title": "Airport & defence zones",
        "citation": "GSR 751(E) 2015 — AAI NOCAS height restrictions · Works of Defence Act 1903",
        "status": "partial",
        "checks": "AAI colour-zone / NOCAS funnel-surface proximity to aerodromes and no-construction bands around defence establishments.",
    },
    {
        "key": "seismic",
        "title": "Seismic risk (IS 1893)",
        "citation": "IS 1893 (Part 1): 2016 — seismic zoning map of India (Zone III/IV/V)",
        "status": "beta",
        "checks": "Region -> IS-1893 seismic zone: Kutch = V (severe), Saurashtra/N.Gujarat = IV (high), rest = III (moderate).",
    },
    {
        "key": "agri_na",
        "title": "Agricultural status & tenure",
        "citation": "Gujarat Land Revenue Code §65 (NA conversion) · Ganotdhara tenancy · Navi Sharat rules",
        "status": "partial",
        "checks": "Whether the parcel is agricultural (NA conversion required before development) and tenure/Navi-Sharat transfer restrictions.",
    },
    {
        "key": "prohibited_category",
        "title": "Prohibited ownership categories",
        "citation": "Government · gauchar (grazing) · wakf · trust · forest-department land — 20-point title screen",
        "status": "live",
        "checks": "Flags parcels recorded as government, gauchar, wakf, trust or forest land (runs inside the title score).",
    },
    {
        "key": "pipeline_rou",
        "title": "Petroleum & gas pipelines",
        "citation": "Petroleum & Minerals Pipelines (Acquisition of Right of User) Act 1962 §§4–7",
        "status": "planned",
        "checks": "No-construction RoU corridor + restricted-activity band around GAIL HVJ gas trunk & ONGC crude lines.",
    },
    {
        "key": "ht_line",
        "title": "High-tension transmission lines",
        "citation": "Indian Electricity Rules 1956 r.77 (vertical) / r.80 (horizontal) · CEA (Safety) Regs 2010 Reg.58",
        "status": "planned",
        "checks": "Horizontal & vertical clearances by voltage class (11/66/132/220/400 kV); no habitable structure under the line.",
    },
    {
        "key": "water_crz",
        "title": "Water bodies & CRZ",
        "citation": "CRZ Notification 2019 · Sabarmati riverfront DC regulations · lake/river buffers",
        "status": "live",
        "checks": "Lake/river no-development buffers (live in Land Intel) and CRZ I–IV classification for coastal parcels.",
    },
    {
        "key": "gdcr",
        "title": "GDCR engine",
        "citation": "Comprehensive GDCR (CGDCR-2017) — zoning, base/premium FSI, margins, parking",
        "status": "live",
        "checks": "Permitted use, base FSI & height intuition by zone (R1/R2/R3/commercial/agriculture) and abutting-road-width band; non-developable zones flagged.",
    },
    {
        "key": "tp_scheme",
        "title": "Town Planning schemes",
        "citation": "Gujarat Town Planning & Urban Development Act 1976 (GTPUDA) — TP schemes",
        "status": "planned",
        "checks": "Original-plot -> final-plot mapping, ~40% deduction, betterment charges and scheme-finalisation status.",
    },
    {
        "key": "fraud_litigation",
        "title": "Fraud & litigation signals",
        "citation": "eCourts district data · Benami Transactions (Prohibition) Act 1988",
        "status": "live",
        "checks": "District-court cases naming the owner (live), mutation-velocity analysis and benami/news adjacency screening.",
    },
]

# Convenience lookup by key.
LAYERS_BY_KEY: dict[str, dict] = {layer["key"]: layer for layer in LAYERS}


# ─────────────────────────────────────────────────────────────────────────────
# PER-LAYER SCREENERS (deterministic)
# ─────────────────────────────────────────────────────────────────────────────
# Each screener returns (outcome, finding, advice). `advice` may be "" when the
# layer has nothing actionable to add. `citation` is attached from the registry
# by screen_parcel(), so screeners only return the finding-level trio.

def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _screen_seismic(region: Optional[str]) -> tuple[str, str, str]:
    """IS-1893 zone from the region/district. Computable from inputs."""
    if not region or not _norm(region):
        return ("unknown",
                "No region provided — supply a Gujarat region/district to resolve the IS-1893 seismic zone.",
                "")
    key = _norm(region)
    key = _SEISMIC_REGION_ALIASES.get(key, key)
    info = SEISMIC_ZONE_BY_REGION.get(key)
    if info is None:
        return ("unknown",
                (f"Region '{region}' not in the encoded Gujarat seismic table — "
                 "pass Kutch / Saurashtra / North Gujarat / Central Gujarat / South Gujarat "
                 "or a known district."),
                "")
    zone, factor, severity = info["zone"], info["factor"], info["severity"]
    if zone == "V":
        outcome = "restricted"
    elif zone == "IV":
        outcome = "caution"
    else:
        outcome = "clear"
    finding = (
        f"IS-1893 Zone {zone} ({severity}, seismic zone factor Z={factor}). "
        f"{'Severe seismic hazard — ductile detailing and higher structural cost apply.' if zone == 'V' else ''}"
        f"{'High seismic hazard — IS-1893 zone-IV design mandatory.' if zone == 'IV' else ''}"
        f"{'Moderate hazard — standard IS-1893 zone-III design.' if zone == 'III' else ''}"
    ).strip()
    return outcome, finding, info["advice"]


def _screen_gdcr(zone: Optional[str], road_width_m: Optional[float]) -> tuple[str, str, str]:
    """CGDCR-2017 use / base FSI / height intuition from zone + road width."""
    if not zone or not _norm(zone):
        return ("unknown",
                "No zone provided — supply CGDCR zone (agriculture/R1/R2/R3/commercial) to compute base FSI.",
                "")
    zkey_raw = _norm(zone)

    # Non-developable / no-building DP zones -> explicit hard restriction.
    if zkey_raw in NON_DEVELOPABLE_ZONES:
        return ("restricted",
                NON_DEVELOPABLE_ZONES[zkey_raw],
                "Land reserved against building in the sanctioned Development Plan — a "
                "buildable-zone change is required before any construction is even applied for.")

    zkey = _ZONE_ALIASES.get(zkey_raw)
    if zkey is None:
        return ("unknown",
                (f"Zone '{zone}' not recognised — use agriculture / R1 / R2 / R3 / commercial "
                 "(or a non-developable zone: non-development / green-belt / gamtal / recreation)."),
                "")

    profile = GDCR_ZONE_PROFILE.get(zkey, {})
    use_note = profile.get("use", "")
    height_note = profile.get("height", "")

    if road_width_m is None:
        return ("unknown",
                (f"Zone {zkey.upper()} recognised ({use_note}) but no abutting road width provided — "
                 "CGDCR base FSI is road-width-linked; supply road_width_m."),
                height_note)
    try:
        rw = float(road_width_m)
    except (TypeError, ValueError):
        return "unknown", "road_width_m is not a number.", ""
    if rw <= 0:
        return "unknown", "road_width_m must be positive.", ""

    idx = _road_slab_index(rw)
    fsi = GDCR_BASE_FSI[zkey][idx]
    slab = _road_slab_label(idx)

    if zkey == "agriculture":
        return ("restricted",
                (f"Agriculture zone: base FSI 0.0 — development is not permissible without "
                 f"zone change + NA conversion. Abutting road {rw:g} m ({slab}). {use_note}"),
                height_note)

    outcome = "caution" if rw < 12.0 else "clear"
    caution_note = " Narrow abutting road constrains FSI and may cap height." if outcome == "caution" else ""
    finding = (
        f"CGDCR {zkey.upper()} zone @ {rw:g} m road ({slab} slab): base FSI {fsi:g}. "
        f"{use_note} Chargeable/premium FSI may lift this further on payment (not computed here)."
        f"{caution_note}"
    )
    return outcome, finding, height_note


def _screen_agri_na(is_agricultural: Optional[bool]) -> tuple[str, str, str]:
    """Agricultural/NA status from the is_agricultural flag. Computable."""
    if is_agricultural is None:
        return ("unknown",
                ("Agricultural status not supplied — set is_agricultural to determine whether "
                 "s.65 NA conversion is required."),
                "")
    if is_agricultural:
        return ("restricted",
                ("Parcel is agricultural — Gujarat Land Revenue Code s.65 NA (non-agricultural) "
                 "conversion is required before any non-agricultural development; also verify "
                 "Ganotdhara tenancy and Navi Sharat (new-tenure) transfer restrictions."),
                "Obtain the s.65 NA order (and pay any Navi-Sharat premium / collector permission) "
                "before you transact or apply for a building plan.")
    return ("clear",
            ("Parcel is recorded non-agricultural — s.65 NA conversion not required for "
             "development. Still confirm the NA order and tenure (Juni/Navi Sharat) on the 7/12."),
            "")


def _screen_needs_geodata(what: str, advice: str,
                          lat: Optional[float], lng: Optional[float]) -> tuple[str, str, str]:
    """Honest 'unknown' for layers that need geodata we don't yet hold.

    Does NOT fabricate a distance. Notes whether coordinates were supplied so
    the caller knows the input is present but the reference dataset is not.
    """
    have_coords = lat is not None and lng is not None
    coord_note = (
        f"Coordinates ({lat}, {lng}) supplied, but "
        if have_coords else
        "No coordinates supplied; "
    )
    finding = (
        f"{coord_note}{what} needs site/geodata verification — "
        "the reference dataset for this layer is not yet wired into the screener."
    )
    return "unknown", finding, advice


# ─────────────────────────────────────────────────────────────────────────────
# TOP-LEVEL SCREENER
# ─────────────────────────────────────────────────────────────────────────────

def screen_parcel(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    region: Optional[str] = None,
    zone: Optional[str] = None,
    road_width_m: Optional[float] = None,
    is_agricultural: Optional[bool] = None,
) -> dict:
    """Deterministically screen a parcel against all 12 restriction layers.

    Inputs are all optional. Layers computable from the given inputs return real
    findings from the encoded tables (seismic from region, GDCR FSI from
    zone+road_width, agri/NA from is_agricultural). Layers that need geodata we
    do not yet hold return outcome "unknown" with an honest verification note —
    never a fabricated distance.

    Returns a dict:
      {
        "inputs": {...echo of inputs...},
        "layers": [ {key, title, citation, status, outcome, finding,
                     advice?, ...}, ... 12 ],
        "summary": {"clear", "caution", "restricted", "unknown"},
        "verdict": "<headline verdict string>",
      }

    The per-layer object always carries key/title/citation/status/outcome/finding
    (the fields the frontend depends on) and ADDS an `advice` string (may be "").
    Determinism: no randomness, no wall-clock, no I/O — same inputs -> same output.
    """
    # Compute the outcomes we can derive from inputs.
    seismic = _screen_seismic(region)
    gdcr = _screen_gdcr(zone, road_width_m)
    agri = _screen_agri_na(is_agricultural)

    # Layers needing geodata -> honest "unknown", each with actionable advice.
    heritage = _screen_needs_geodata(
        "AMASR 100 m prohibited / 100–200 m regulated proximity",
        "Confirm the nearest ASI monument; within 100 m no NOC is possible, 100–200 m "
        "needs a National Monuments Authority / Competent Authority NOC.",
        lat, lng)
    forest = _screen_needs_geodata(
        "protected-area / eco-sensitive-zone proximity",
        "Check distance to the nearest sanctuary/national park and its ESZ notification "
        "(10 km default where un-notified); FC Act clearance applies on forest land.",
        lat, lng)
    airport = _screen_needs_geodata(
        "AAI NOCAS colour-zone / approach-transition funnel & defence-band proximity",
        "Raise a NOCAS application for the height you intend; near a defence installation "
        + DEFENCE_ADVISORY,
        lat, lng)
    pipeline = _screen_needs_geodata(
        f"PMP-Act Right-of-User corridor proximity (indicative ~{PMP_ROU_WIDTH_M} m RoU "
        f"+ ~{PMP_RESTRICTED_BAND_M} m restricted band) — GAIL HVJ gas trunk & ONGC crude lines cross Gujarat",
        "No construction is permitted on a pipeline RoU strip (PMP Act 1962); obtain the "
        "operator's alignment sheet (GAIL/GSPL/ONGC) and their NOC for any work in the band.",
        lat, lng)
    ht = _screen_needs_geodata(
        "HT-line corridor proximity — horizontal & vertical clearance by voltage class "
        "(11/66/132/220/400 kV); no habitable structure under the line",
        "IE Rules r.77/80 + CEA 2010 Reg.58: keep the statutory horizontal & vertical "
        "clearance to conductors and never build under the line; confirm sag & tower "
        "footing with GETCO/PGCIL/DISCOM.",
        lat, lng)
    water = _screen_needs_geodata(
        "water-body buffer / CRZ classification",
        "Confirm lake/river no-development buffers and (for coastal parcels) the CRZ "
        "I–IV category before layout.",
        lat, lng)
    tp = _screen_needs_geodata(
        "GTPUDA TP-scheme final-plot mapping and finalisation status",
        "Match the deed's original survey number to its Final Plot (FP) number, and "
        "confirm betterment charges are paid on a finalised scheme.",
        lat, lng)
    fraud = _screen_needs_geodata(
        "eCourts litigation / mutation-velocity screening (owner name required)",
        "Run the live district-court litigation check on the recorded owner and review "
        "mutation velocity / PoA chains for benami patterns.",
        lat, lng)

    # prohibited_category is a title-record screen (needs the 7/12), not a
    # coordinate check — mark unknown here with an honest pointer.
    prohibited = (
        "unknown",
        ("Prohibited-category screen runs on the title record (7/12 owner/tenure fields), "
         "not on coordinates — supply the parcel's land record to evaluate government/gauchar/"
         "wakf/trust/forest flags."),
        "Pull the 7/12 extract and run the 20-point prohibited-category screen inside the title score.",
    )

    outcomes: dict[str, tuple[str, str, str]] = {
        "heritage_asi": heritage,
        "forest_ecozone": forest,
        "airport_defence": airport,
        "seismic": seismic,
        "agri_na": agri,
        "prohibited_category": prohibited,
        "pipeline_rou": pipeline,
        "ht_line": ht,
        "water_crz": water,
        "gdcr": gdcr,
        "tp_scheme": tp,
        "fraud_litigation": fraud,
    }

    layers_out: list[dict] = []
    summary = {"clear": 0, "caution": 0, "restricted": 0, "unknown": 0}
    for layer in LAYERS:
        key = layer["key"]
        outcome, finding, advice = outcomes[key]
        summary[outcome] += 1
        entry = {
            "key": key,
            "title": layer["title"],
            "citation": layer["citation"],
            "status": layer["status"],
            "outcome": outcome,
            "finding": finding,
        }
        if advice:
            entry["advice"] = advice
        layers_out.append(entry)

    verdict = _verdict(summary)

    return {
        "inputs": {
            "lat": lat, "lng": lng, "region": region, "zone": zone,
            "road_width_m": road_width_m, "is_agricultural": is_agricultural,
        },
        "layers": layers_out,
        "summary": summary,
        "verdict": verdict,
    }


def _verdict(summary: dict) -> str:
    """Deterministic headline verdict from the outcome counts."""
    restricted = summary["restricted"]
    caution = summary["caution"]
    unknown = summary["unknown"]
    if restricted > 0:
        return (
            f"{restricted} restricted layer(s) — hard development restrictions apply; "
            f"resolve these before proceeding. ({caution} caution, {unknown} need verification.)")
    if caution > 0:
        return (
            f"No hard restrictions from the supplied inputs, but {caution} caution layer(s) "
            f"need review, and {unknown} layer(s) need site/geodata verification.")
    return (
        f"No restrictions or cautions from the supplied inputs; {unknown} layer(s) still "
        "need site/geodata verification before a clean opinion.")
