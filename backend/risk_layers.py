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
# proximity, forest/ESZ boundaries, pipeline ROU alignments, HT-line corridors,
# CRZ, TP scheme registers) return outcome "unknown" with a "needs site/geodata
# verification" finding rather than a fabricated distance. The layers we CAN
# compute from inputs — seismic (from region), GDCR base-FSI (from zone + road
# width) and agricultural/NA status (from is_agricultural) — return real,
# deterministic findings derived from the tables below.
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
# Region keys are normalised (lower-case, stripped) before lookup; a small set
# of common district names is aliased onto their region so callers can pass
# either a region ("Kutch", "Saurashtra") or a district ("Bhuj", "Rajkot").
SEISMIC_ZONE_BY_REGION: dict[str, dict] = {
    "kutch": {"zone": "V", "factor": 0.36, "severity": "severe"},
    "saurashtra": {"zone": "IV", "factor": 0.24, "severity": "high"},
    "north gujarat": {"zone": "IV", "factor": 0.24, "severity": "high"},
    "central gujarat": {"zone": "III", "factor": 0.16, "severity": "moderate"},
    "south gujarat": {"zone": "III", "factor": 0.16, "severity": "moderate"},
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


# ── HT transmission — minimum horizontal clearance (metres) by voltage ───────
# Source: Indian Electricity Rules 1956 r.77–80 and CEA (Measures relating to
# Safety and Electric Supply) Regulations 2010, Schedule VII. These are the
# statutory minimum HORIZONTAL clearances from a building to the nearest
# conductor for overhead lines (low/medium up to 33 kV = 1.2 m; then +0.3 m per
# additional 33 kV over 33 kV). Common voltage classes tabulated:
#   11 kV / 66 kV  -> 1.2 m ; 132 kV -> 2.2 m ; 220 kV -> 3.7 m ; 400 kV -> 6.4 m
HT_HORIZONTAL_CLEARANCE_M: dict[str, float] = {
    "11kV": 1.2,
    "66kV": 1.2,
    "132kV": 2.2,
    "220kV": 3.7,
    "400kV": 6.4,
}


# ── CGDCR-2017 — base FSI by zone and abutting-road-width band ────────────────
# Source: Comprehensive General Development Control Regulations 2017 (Gujarat),
# Table for permissible base FSI keyed to zone and the width of the abutting
# road. Values below are the widely-applied CGDCR base-FSI slabs; chargeable
# (premium) FSI can lift these further on payment (not computed here).
#
# Road-width bands (metres): <9, 9–<12, 12–<18, 18–<24, 24–<30, >=30.
# Zones: agriculture, R1 (residential-affordable / gamtal fringe),
#        R2 (general residential), R3 (high-density residential), commercial.
# A base FSI of 0.0 for the agriculture zone reflects that development requires
# NA conversion + zone change first (see the agri/NA layer).
ROAD_WIDTH_BANDS_M = [9.0, 12.0, 18.0, 24.0, 30.0]   # lower edges of slabs >9m

# For each zone: FSI for [<9m, 9–12, 12–18, 18–24, 24–30, >=30]
GDCR_BASE_FSI: dict[str, list[float]] = {
    "agriculture": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "r1":          [1.2, 1.2, 1.8, 1.8, 1.8, 1.8],
    "r2":          [1.2, 1.8, 1.8, 2.7, 2.7, 3.0],
    "r3":          [1.8, 1.8, 2.7, 3.0, 3.6, 4.0],
    "commercial":  [1.5, 2.0, 3.0, 4.0, 4.0, 5.4],
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
        "citation": "Petroleum & Minerals Pipelines (Acquisition of Right of User) Act 1962",
        "status": "planned",
        "checks": "No-construction Right-of-User corridor and restricted-activity bands around ONGC/GAIL trunk lines.",
    },
    {
        "key": "ht_line",
        "title": "High-tension transmission lines",
        "citation": "Indian Electricity Rules 1956 r.77–80 · CEA (Measures of Safety) Regs 2010 Sch. VII",
        "status": "planned",
        "checks": "Horizontal/vertical clearances by voltage class (11/66/132/220/400 kV) and tower-footing setbacks.",
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
        "checks": "Base FSI by zone (R1/R2/R3/commercial/agriculture) and abutting-road-width band; chargeable premium noted.",
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

def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _screen_seismic(region: Optional[str]) -> tuple[str, str]:
    """IS-1893 zone from the region/district. Computable from inputs."""
    if not region or not _norm(region):
        return "unknown", "No region provided — supply a Gujarat region/district to resolve the IS-1893 seismic zone."
    key = _norm(region)
    key = _SEISMIC_REGION_ALIASES.get(key, key)
    info = SEISMIC_ZONE_BY_REGION.get(key)
    if info is None:
        return "unknown", (
            f"Region '{region}' not in the encoded Gujarat seismic table — "
            "pass Kutch / Saurashtra / North Gujarat / Central Gujarat / South Gujarat "
            "or a known district.")
    zone, factor, severity = info["zone"], info["factor"], info["severity"]
    if zone == "V":
        outcome = "restricted"
    elif zone == "IV":
        outcome = "caution"
    else:
        outcome = "clear"
    return outcome, (
        f"IS-1893 Zone {zone} ({severity}, seismic zone factor Z={factor}). "
        f"{'Severe seismic hazard — ductile detailing and higher structural cost apply.' if zone == 'V' else ''}"
        f"{'High seismic hazard — IS-1893 zone-IV design mandatory.' if zone == 'IV' else ''}"
        f"{'Moderate hazard — standard IS-1893 zone-III design.' if zone == 'III' else ''}"
    ).strip()


def _screen_gdcr(zone: Optional[str], road_width_m: Optional[float]) -> tuple[str, str]:
    """CGDCR-2017 base FSI from zone + abutting road width. Computable."""
    if not zone or not _norm(zone):
        return "unknown", "No zone provided — supply CGDCR zone (agriculture/R1/R2/R3/commercial) to compute base FSI."
    zkey = _ZONE_ALIASES.get(_norm(zone))
    if zkey is None:
        return "unknown", (
            f"Zone '{zone}' not recognised — use agriculture / R1 / R2 / R3 / commercial.")
    if road_width_m is None:
        return "unknown", (
            f"Zone {zkey.upper()} recognised but no abutting road width provided — "
            "CGDCR base FSI is road-width-linked; supply road_width_m.")
    try:
        rw = float(road_width_m)
    except (TypeError, ValueError):
        return "unknown", "road_width_m is not a number."
    if rw <= 0:
        return "unknown", "road_width_m must be positive."
    idx = _road_slab_index(rw)
    fsi = GDCR_BASE_FSI[zkey][idx]
    slab = _road_slab_label(idx)
    if zkey == "agriculture":
        return "restricted", (
            f"Agriculture zone: base FSI 0.0 — development is not permissible without "
            f"zone change + NA conversion. Abutting road {rw:g} m ({slab}).")
    # Non-agricultural zones: clear (development permissible under FSI regime),
    # but call out constrained FSI on narrow roads as caution.
    outcome = "caution" if rw < 12.0 else "clear"
    caution_note = " Narrow abutting road constrains FSI and may cap height." if outcome == "caution" else ""
    return outcome, (
        f"CGDCR {zkey.upper()} zone @ {rw:g} m road ({slab} slab): base FSI {fsi:g}. "
        f"Chargeable/premium FSI may lift this further on payment (not computed here)."
        f"{caution_note}")


def _screen_agri_na(is_agricultural: Optional[bool]) -> tuple[str, str]:
    """Agricultural/NA status from the is_agricultural flag. Computable."""
    if is_agricultural is None:
        return "unknown", (
            "Agricultural status not supplied — set is_agricultural to determine whether "
            "s.65 NA conversion is required.")
    if is_agricultural:
        return "restricted", (
            "Parcel is agricultural — Gujarat Land Revenue Code s.65 NA (non-agricultural) "
            "conversion is required before any non-agricultural development; also verify "
            "Ganotdhara tenancy and Navi Sharat (new-tenure) transfer restrictions.")
    return "clear", (
        "Parcel is recorded non-agricultural — s.65 NA conversion not required for "
        "development. Still confirm the NA order and tenure (Juni/Navi Sharat) on the 7/12.")


def _screen_needs_geodata(layer_key: str, what: str,
                          lat: Optional[float], lng: Optional[float]) -> tuple[str, str]:
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
    return "unknown", (
        f"{coord_note}{what} needs site/geodata verification — "
        "the reference dataset for this layer is not yet wired into the screener."
    )


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
        "layers": [ {key, title, citation, status, outcome, finding}, ... 12 ],
        "summary": {"clear", "caution", "restricted", "unknown"},
        "verdict": "<headline verdict string>",
      }

    Determinism: no randomness, no wall-clock, no I/O — same inputs -> same output.
    """
    # Compute the outcomes we can derive from inputs.
    seismic_outcome, seismic_finding = _screen_seismic(region)
    gdcr_outcome, gdcr_finding = _screen_gdcr(zone, road_width_m)
    agri_outcome, agri_finding = _screen_agri_na(is_agricultural)

    # Layers needing geodata -> honest "unknown".
    heritage = _screen_needs_geodata(
        "heritage_asi", "AMASR 100 m prohibited / 100–200 m regulated proximity", lat, lng)
    forest = _screen_needs_geodata(
        "forest_ecozone", "protected-area / eco-sensitive-zone proximity", lat, lng)
    airport = _screen_needs_geodata(
        "airport_defence", "AAI NOCAS funnel-surface / defence-band proximity", lat, lng)
    pipeline = _screen_needs_geodata(
        "pipeline_rou", "PMP Act Right-of-User corridor proximity", lat, lng)
    ht = _screen_needs_geodata(
        "ht_line", "HT-line corridor proximity / voltage-class clearance", lat, lng)
    water = _screen_needs_geodata(
        "water_crz", "water-body buffer / CRZ classification", lat, lng)
    tp = _screen_needs_geodata(
        "tp_scheme", "GTPUDA TP-scheme final-plot mapping and finalisation status", lat, lng)
    fraud = _screen_needs_geodata(
        "fraud_litigation", "eCourts litigation / mutation-velocity screening (owner name required)", lat, lng)

    # prohibited_category is a title-record screen (needs the 7/12), not a
    # coordinate check — mark unknown here with an honest pointer.
    prohibited = (
        "unknown",
        "Prohibited-category screen runs on the title record (7/12 owner/tenure fields), "
        "not on coordinates — supply the parcel's land record to evaluate government/gauchar/"
        "wakf/trust/forest flags.",
    )

    outcomes: dict[str, tuple[str, str]] = {
        "heritage_asi": heritage,
        "forest_ecozone": forest,
        "airport_defence": airport,
        "seismic": (seismic_outcome, seismic_finding),
        "agri_na": (agri_outcome, agri_finding),
        "prohibited_category": prohibited,
        "pipeline_rou": pipeline,
        "ht_line": ht,
        "water_crz": water,
        "gdcr": (gdcr_outcome, gdcr_finding),
        "tp_scheme": tp,
        "fraud_litigation": fraud,
    }

    layers_out: list[dict] = []
    summary = {"clear": 0, "caution": 0, "restricted": 0, "unknown": 0}
    for layer in LAYERS:
        key = layer["key"]
        outcome, finding = outcomes[key]
        summary[outcome] += 1
        layers_out.append({
            "key": key,
            "title": layer["title"],
            "citation": layer["citation"],
            "status": layer["status"],
            "outcome": outcome,
            "finding": finding,
        })

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
