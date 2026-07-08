# demo.py — DEMO MODE for Satya-Lekh.
#
# The live AnyROR scraper needs an Indian IP (the portal blocks cloud IPs),
# so the deployed site can't demonstrate the product. This module powers a
# login-gated demo that exercises the REAL code paths — job creation, the
# same JobStore, the same progress stages, and the REAL TitleReport builder
# (compose_title_report → apply_chain_flags → compute_risk) — fed with
# realistic Gujarat fixture data instead of a live scrape.
#
# Everything here is pure Python + asyncio (no network, no Playwright, no
# Gemini) so it is fully unit-testable and instant to deploy.

import asyncio
import hashlib
import hmac
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

from title_report import compose_title_report, parse_mutation_entries

# ──────────────────────────────────────────────────────────────────────────────
# Credentials + stateless signed tokens (24h TTL)
#
# Tokens are HMAC-signed ("<expiry>.<sig>") rather than stored in memory, so
# they survive server restarts — critical on Render's free tier, which spins
# the process down after 15 minutes of idle. A stored-token approach silently
# invalidated live demo sessions on every cold start, dropping demo users onto
# the real (blocked) scraper path.
# ──────────────────────────────────────────────────────────────────────────────

DEMO_USERNAME = os.getenv("DEMO_USERNAME", "chinmay2004")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "satyalekh")
TOKEN_TTL_SECONDS = 24 * 3600

_clock = time.time          # monkeypatch-able in tests


def _signing_key() -> bytes:
    """Deterministic per-deployment key: stable across restarts, changes when
    the demo credentials are rotated. DEMO_TOKEN_SECRET env overrides."""
    secret = os.getenv("DEMO_TOKEN_SECRET") or f"{DEMO_USERNAME}:{DEMO_PASSWORD}"
    return hashlib.sha256(("satyalekh-demo|" + secret).encode("utf-8")).digest()


def verify_credentials(username: str, password: str) -> bool:
    """Constant-time credential check (hmac.compare_digest on both fields)."""
    ok_user = hmac.compare_digest(
        str(username or "").encode("utf-8"), DEMO_USERNAME.encode("utf-8"))
    ok_pass = hmac.compare_digest(
        str(password or "").encode("utf-8"), DEMO_PASSWORD.encode("utf-8"))
    return ok_user and ok_pass


def _sign(payload: str) -> str:
    return hmac.new(_signing_key(), payload.encode("utf-8"), hashlib.sha256).hexdigest()


def issue_token() -> tuple:
    """Create a fresh demo session token. Returns (token, expires_in_seconds)."""
    expiry = int(_clock()) + TOKEN_TTL_SECONDS
    payload = f"{expiry}.{secrets.token_urlsafe(8)}"
    return f"{payload}.{_sign(payload)}", TOKEN_TTL_SECONDS


def is_valid_token(token: Optional[str]) -> bool:
    if not token:
        return False
    parts = str(token).rsplit(".", 1)
    if len(parts) != 2:
        return False
    payload, sig = parts
    if not hmac.compare_digest(_sign(payload), sig):
        return False
    try:
        expiry = int(payload.split(".", 1)[0])
    except (ValueError, IndexError):
        return False
    return _clock() < expiry


# ──────────────────────────────────────────────────────────────────────────────
# Fixture parcels — realistic Gujarat 7/12 records + rich mutation chains.
# Built fresh per call (compose_title_report mutates entry flags in place).
# ──────────────────────────────────────────────────────────────────────────────

ERROR_SURVEY_NO = "999"
ERROR_SUGGESTIONS = ["1", "2", "3 P", "128", "128 P"]


def _rel_date(months_ago: int) -> str:
    """dd/mm/yyyy for N months before now — keeps 'recent churn' fixtures
    permanently recent no matter when the demo is shown."""
    return (datetime.now() - timedelta(days=30 * months_ago)).strftime("%d/%m/%Y")


def _navrangpura_128p():
    """CLEAR — old tenure, no live encumbrance, clean 6-entry chain
    (includes a historical boja + release so the timeline looks real)."""
    record = {
        "status": "SUCCESS",
        "message": "Record found via scanned document",
        "owner_name": "Rameshbhai Ambalal Patel",
        "survey_no": "128 P",
        "village": "Navrangpura",
        "district": "Ahmedabad",
        "taluka": "City",
        "area": "1857 sq. m.",
        "tenure_type": "Old Tenure (Juni Sharat)",
        "cultivation": "Non-agricultural — residential use",
        "mutation_entries": ("Entry No. 2201 (1978), Entry No. 3054 (1994), "
                             "Entry No. 4102 (2003), Entry No. 5220 (2009), "
                             "Entry No. 6103 (2014), Entry No. 6841 (2016)"),
        "encumbrances": "None",
        "jantri_rate": "₹45,000 / sq. m.",
        "last_sale": "21/06/2003 — ₹64,00,000",
    }
    chain = [
        {"entry_no": "2201", "date": "12/03/1978", "mutation_type": "inheritance",
         "from_party": "Maganbhai Kalidas Patel", "to_party": "Ambalal Maganbhai Patel",
         "description": "Varsai entry after death of Maganbhai Kalidas Patel", "flags": []},
        {"entry_no": "3054", "date": "05/11/1994", "mutation_type": "sale",
         "from_party": "Ambalal Maganbhai Patel", "to_party": "Jayantibhai Chunilal Shah",
         "description": "Registered sale deed, Sub-Registrar Ahmedabad-2", "flags": []},
        {"entry_no": "4102", "date": "21/06/2003", "mutation_type": "sale",
         "from_party": "Jayantibhai Chunilal Shah", "to_party": "Rameshbhai Ambalal Patel",
         "description": "Registered sale deed — consideration ₹64,00,000", "flags": []},
        {"entry_no": "5220", "date": "14/08/2009", "mutation_type": "mortgage",
         "from_party": "Rameshbhai Ambalal Patel", "to_party": "State Bank of India, Navrangpura",
         "description": "Boja entry — housing loan of ₹38,00,000", "flags": []},
        {"entry_no": "6103", "date": "02/02/2014", "mutation_type": "mortgage release",
         "from_party": "State Bank of India, Navrangpura", "to_party": "Rameshbhai Ambalal Patel",
         "description": "Boja released — loan fully repaid", "flags": []},
        {"entry_no": "6841", "date": "19/09/2016", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "Area re-measurement under city survey; no ownership change", "flags": []},
    ]
    return record, chain


def _sanand_45():
    """CAUTION — live boja (bank encumbrance) on an otherwise clean title."""
    record = {
        "status": "SUCCESS",
        "message": "Record found via scanned document",
        "owner_name": "Kanubhai Somabhai Chaudhary",
        "survey_no": "45",
        "village": "Sanand",
        "district": "Ahmedabad",
        "taluka": "Sanand",
        "area": "12140 sq. m. (3 Acre)",
        "tenure_type": "Old Tenure (Juni Sharat)",
        "cultivation": "Agricultural — cotton, castor",
        "mutation_entries": ("Entry No. 1120 (1985), Entry No. 2456 (2004), "
                             "Entry No. 3610 (2018), Entry No. 3988 (2019), "
                             "Entry No. 4275 (2022)"),
        "encumbrances": "Boja of ₹52,00,000 — Bank of Baroda, Sanand branch (Entry 3988)",
        "jantri_rate": "₹6,500 / sq. m.",
        "last_sale": "22/01/2018 — ₹2,85,00,000",
    }
    chain = [
        {"entry_no": "1120", "date": "17/07/1985", "mutation_type": "inheritance",
         "from_party": "Somabhai Ranchhodbhai Chaudhary", "to_party": "Kanubhai Somabhai Chaudhary",
         "description": "Varsai entry — agricultural holding passed to son", "flags": []},
        {"entry_no": "2456", "date": "09/02/2004", "mutation_type": "partition",
         "from_party": "Kanubhai Somabhai Chaudhary (joint family)", "to_party": "Kanubhai Somabhai Chaudhary",
         "description": "Family partition (vehchani) — survey 45 allotted to Kanubhai", "flags": []},
        {"entry_no": "3610", "date": "22/01/2018", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "Adjoining survey 44/2 consolidated; area corrected to 3 acre", "flags": []},
        {"entry_no": "3988", "date": "30/05/2019", "mutation_type": "mortgage",
         "from_party": "Kanubhai Somabhai Chaudhary", "to_party": "Bank of Baroda, Sanand branch",
         "description": "Boja entry — crop and equipment loan of ₹52,00,000", "flags": []},
        {"entry_no": "4275", "date": "11/10/2022", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "e-Chavdi crop record update — no ownership change", "flags": []},
    ]
    return record, chain


def _dholera_72():
    """HIGH_RISK — 72-AA restricted tenure + two transfers inside the last
    3 years (recent churn) + a seller who never appears as prior owner
    (chain gap). Dates are computed relative to now so churn stays recent."""
    record = {
        "status": "SUCCESS",
        "message": "Record found via scanned document",
        "owner_name": "Meghraj Landcorp LLP",
        "survey_no": "72",
        "village": "Dholera",
        "district": "Ahmedabad",
        "taluka": "Dholera",
        "area": "20234 sq. m. (5 Acre)",
        "tenure_type": "New Tenure (Navi Sharat) — Restricted under Section 72-AA",
        "cultivation": "Agricultural — fallow",
        "mutation_entries": ("Entry No. 1450 (1992), Entry No. 2890 (2012), "
                             "Entry No. 3311, Entry No. 3412"),
        "encumbrances": "None",
        "jantri_rate": "₹1,800 / sq. m.",
        "last_sale": f"{_rel_date(3)} — ₹4,10,00,000",
    }
    chain = [
        {"entry_no": "1450", "date": "03/07/1992", "mutation_type": "inheritance",
         "from_party": "Jesangbhai Rupabhai Thakor", "to_party": "Bharatbhai Jesangbhai Thakor",
         "description": "Varsai entry after death of Jesangbhai Rupabhai Thakor", "flags": []},
        {"entry_no": "2890", "date": "20/10/2012", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "Parcel included in Dholera SIR draft development plan", "flags": []},
        {"entry_no": "3311", "date": _rel_date(16), "mutation_type": "sale",
         "from_party": "Bharatbhai Jesangbhai Thakor", "to_party": "Sureshkumar Manilal Panchal",
         "description": "Sale deed — Navi Sharat land, collector premium pending", "flags": []},
        {"entry_no": "3412", "date": _rel_date(3), "mutation_type": "sale",
         "from_party": "Dineshbhai Karsanbhai Rabari", "to_party": "Meghraj Landcorp LLP",
         "description": "Registered sale deed — consideration ₹4,10,00,000", "flags": []},
    ]
    return record, chain


def _surat_301():
    """CLEAR — Surat peri-urban parcel with a tidy 4-entry chain."""
    record = {
        "status": "SUCCESS",
        "message": "Record found via scanned document",
        "owner_name": "Ishwarbhai Naranbhai Desai",
        "survey_no": "301",
        "village": "Bhimrad",
        "district": "Surat",
        "taluka": "Choryasi",
        "area": "4046 sq. m. (1 Acre)",
        "tenure_type": "Old Tenure (Juni Sharat)",
        "cultivation": "Agricultural — sugarcane",
        "mutation_entries": ("Entry No. 980 (1989), Entry No. 1755 (2001), "
                             "Entry No. 2540 (2011), Entry No. 3120 (2021)"),
        "encumbrances": "None",
        "jantri_rate": "₹22,000 / sq. m.",
        "last_sale": "18/12/2011 — ₹1,15,00,000",
    }
    chain = [
        {"entry_no": "980", "date": "25/04/1989", "mutation_type": "inheritance",
         "from_party": "Naranbhai Govindbhai Desai", "to_party": "Ishwarbhai Naranbhai Desai",
         "description": "Varsai entry — holding passed to son", "flags": []},
        {"entry_no": "1755", "date": "13/09/2001", "mutation_type": "partition",
         "from_party": "Ishwarbhai Naranbhai Desai (joint)", "to_party": "Ishwarbhai Naranbhai Desai",
         "description": "Family partition — survey 301 recorded solely to Ishwarbhai", "flags": []},
        {"entry_no": "2540", "date": "18/12/2011", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "TP scheme final plot alignment — area unchanged", "flags": []},
        {"entry_no": "3120", "date": "07/03/2021", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "e-Chavdi crop record update — no ownership change", "flags": []},
    ]
    return record, chain


_FIXTURES = {
    "128 P": _navrangpura_128p,
    "45": _sanand_45,
    "72": _dholera_72,
    "301": _surat_301,
}


def _default_fixture(district: str, taluka: str, village: str, survey_no: str):
    """Plausible CLEAR record echoing whatever the user searched for —
    every demo search returns something believable."""
    record = {
        "status": "SUCCESS",
        "message": "Record found via scanned document",
        "owner_name": "Prakashbhai Mohanbhai Patel",
        "survey_no": survey_no,
        "village": village or "Navrangpura",
        "district": district or "Ahmedabad",
        "taluka": taluka or "City",
        "area": "8093 sq. m. (2 Acre)",
        "tenure_type": "Old Tenure (Juni Sharat)",
        "cultivation": "Agricultural — wheat, bajra",
        "mutation_entries": ("Entry No. 1310 (1991), Entry No. 2088 (2002), "
                             "Entry No. 2977 (2013), Entry No. 3542 (2020)"),
        "encumbrances": "None",
        "jantri_rate": "₹9,500 / sq. m.",
        "last_sale": "04/06/2013 — ₹78,00,000",
    }
    chain = [
        {"entry_no": "1310", "date": "08/01/1991", "mutation_type": "inheritance",
         "from_party": "Mohanbhai Ravjibhai Patel", "to_party": "Prakashbhai Mohanbhai Patel",
         "description": "Varsai entry after death of Mohanbhai Ravjibhai Patel", "flags": []},
        {"entry_no": "2088", "date": "16/05/2002", "mutation_type": "partition",
         "from_party": "Prakashbhai Mohanbhai Patel (joint family)", "to_party": "Prakashbhai Mohanbhai Patel",
         "description": "Family partition (vehchani) — parcel allotted to Prakashbhai", "flags": []},
        {"entry_no": "2977", "date": "04/06/2013", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "Boundary re-survey under DILRMP — area confirmed", "flags": []},
        {"entry_no": "3542", "date": "23/11/2020", "mutation_type": "other",
         "from_party": "", "to_party": "",
         "description": "e-Chavdi crop record update — no ownership change", "flags": []},
    ]
    return record, chain


def get_fixture(district: str, taluka: str, village: str, survey_no: str):
    """Return (record, chain) for a demo search. Known survey numbers map to
    curated parcels; anything else gets a plausible default echoing the input."""
    key = (survey_no or "").strip()
    for fixture_key, builder in _FIXTURES.items():
        if key.casefold() == fixture_key.casefold():
            return builder()
    return _default_fixture(district.strip(), taluka.strip(), village.strip(), key)


# ──────────────────────────────────────────────────────────────────────────────
# Simulated background job — same JobStore, same stages, real report builder
# ──────────────────────────────────────────────────────────────────────────────

_sleep = asyncio.sleep  # monkeypatch-able in tests


async def run_demo_title_report_job(jobs, job_id: str, req: dict):
    """Drive a title-report job through the SAME stage sequence as the live
    scraper (~13-16s total), then finish with a TitleReport built by the
    REAL pipeline (compose_title_report → apply_chain_flags → compute_risk)."""
    district = str(req.get("district") or "")
    taluka = str(req.get("taluka") or "")
    village = str(req.get("village") or "")
    survey_no = str(req.get("survey_no") or "").strip()

    try:
        jobs.update(job_id, status="running")

        jobs.set_progress(job_id, "connecting", "Contacting AnyROR portal…", 5)
        await _sleep(1.6)
        jobs.set_progress(job_id, "selecting_location",
                          f"Locating {village}, {taluka}…", 20)
        await _sleep(2.2)
        jobs.set_progress(job_id, "solving_captcha",
                          "Solving the security CAPTCHA (attempt 1/5)…", 49)
        await _sleep(2.6)
        jobs.set_progress(job_id, "solving_captcha",
                          "Solving the security CAPTCHA (attempt 2/5)…", 53)
        await _sleep(2.4)
        jobs.set_progress(job_id, "reading_record", "Reading the land record…", 68)
        await _sleep(2.6)

        # Error-path demo: survey 999 → suggestions chips flow
        if survey_no == ERROR_SURVEY_NO:
            jobs.fail(
                job_id,
                f"Survey number '{ERROR_SURVEY_NO}' not found in '{village or 'this village'}'. "
                f"Available options (first 15): {ERROR_SUGGESTIONS}",
                suggestions=list(ERROR_SUGGESTIONS))
            return

        record, chain = get_fixture(district, taluka, village, survey_no)
        entry_nos = parse_mutation_entries(str(record.get("mutation_entries") or ""))
        jobs.set_progress(
            job_id, "fetching_chain",
            f"Fetching VF-6 details for {max(len(entry_nos), len(chain))} mutation entries…", 78)
        await _sleep(2.2)
        jobs.set_progress(job_id, "building_report", "Building your title report…", 90)
        await _sleep(1.4)

        # REAL builder: deterministic flags + genuine risk scoring
        report = compose_title_report(record, chain, cached=False)
        report["demo"] = True
        jobs.finish(job_id, report)
    except Exception as e:  # pragma: no cover — defensive
        jobs.fail(job_id, f"Demo simulation failed: {e}")


# ──────────────────────────────────────────────────────────────────────────────
# Demo watchlist — in-memory only, never touches Supabase
# ──────────────────────────────────────────────────────────────────────────────

DEMO_EMAIL = "demo@satya-lekh.example"


def _iso_days_ago(days: int, hour: int = 9) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days)
    return dt.replace(hour=hour, minute=15, second=0, microsecond=0).isoformat()


def _initial_watchlist() -> list:
    return [
        {
            "id": "demo-w-1", "user_email": DEMO_EMAIL,
            "district": "Ahmedabad", "taluka": "City", "village": "Navrangpura",
            "survey_no": "128 P", "record_type": "OLD_SCAN_712",
            "last_snapshot": {
                "owner_name": "Rameshbhai Ambalal Patel", "encumbrances": "None",
                "mutation_entries": "Entry No. 6841 (2016)",
                "tenure_type": "Old Tenure (Juni Sharat)",
                "area": "1857 sq. m.", "survey_no": "128 P",
            },
            "last_checked_at": _iso_days_ago(1), "created_at": _iso_days_ago(45),
        },
        {
            "id": "demo-w-2", "user_email": DEMO_EMAIL,
            "district": "Ahmedabad", "taluka": "Dholera", "village": "Dholera",
            "survey_no": "72", "record_type": "OLD_SCAN_712",
            "last_snapshot": {
                "owner_name": "Meghraj Landcorp LLP", "encumbrances": "None",
                "mutation_entries": "Entry No. 3412",
                "tenure_type": "New Tenure (Navi Sharat) — Restricted under Section 72-AA",
                "area": "20234 sq. m. (5 Acre)", "survey_no": "72",
            },
            "last_checked_at": _iso_days_ago(1), "created_at": _iso_days_ago(30),
        },
    ]


def _initial_alerts() -> list:
    return [
        {   # UNSEEN — ownership changed on the watched Dholera parcel
            "id": "demo-a-1", "watchlist_id": "demo-w-2",
            "changes": {
                "owner_name": {"old": "Sureshkumar Manilal Panchal",
                               "new": "Meghraj Landcorp LLP"},
                "mutation_entries": {"old": "Entry No. 3311",
                                     "new": "Entry No. 3311, Entry No. 3412"},
            },
            "seen": False, "created_at": _iso_days_ago(2),
        },
        {   # seen — historical encumbrance alert on the Navrangpura parcel
            "id": "demo-a-2", "watchlist_id": "demo-w-1",
            "changes": {
                "encumbrances": {"old": "None",
                                 "new": "Boja — State Bank of India ₹38,00,000"},
            },
            "seen": True, "created_at": _iso_days_ago(20),
        },
    ]


_watchlist: list = _initial_watchlist()
_alerts: list = _initial_alerts()
_next_watch_id = 3


def reset_demo_state():
    """Restore pristine demo fixtures (used by tests; could be cron'd)."""
    global _watchlist, _alerts, _next_watch_id
    global _manual_orders, _next_order_id
    _watchlist = _initial_watchlist()
    _alerts = _initial_alerts()
    _next_watch_id = 3
    # Manual-fulfilment orders are defined lower in the module; reset them too
    # when the loader has already run (they are always defined by the time a
    # test calls reset_demo_state, but guard for import-time ordering).
    if "_initial_manual_orders" in globals():
        _manual_orders = _initial_manual_orders()
        _next_order_id = 4


def demo_list_watchlist() -> list:
    return [dict(w) for w in _watchlist]


def demo_add_watch(email: str, district: str, taluka: str, village: str,
                   survey_no: str, record_type: str = "OLD_SCAN_712") -> dict:
    """Idempotent add to the in-memory demo watchlist (never Supabase)."""
    global _next_watch_id
    for w in _watchlist:
        if (w["district"].casefold() == district.strip().casefold()
                and w["taluka"].casefold() == taluka.strip().casefold()
                and w["village"].casefold() == village.strip().casefold()
                and w["survey_no"].casefold() == survey_no.strip().casefold()
                and (w.get("record_type") or "OLD_SCAN_712") == (record_type or "OLD_SCAN_712")):
            return dict(w)
    row = {
        "id": f"demo-w-{_next_watch_id}", "user_email": email or DEMO_EMAIL,
        "district": district.strip(), "taluka": taluka.strip(),
        "village": village.strip(), "survey_no": survey_no.strip(),
        "record_type": record_type or "OLD_SCAN_712",
        "last_snapshot": None, "last_checked_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _next_watch_id += 1
    _watchlist.append(row)
    return dict(row)


def demo_remove_watch(watchlist_id: str) -> bool:
    global _watchlist, _alerts
    before = len(_watchlist)
    _watchlist = [w for w in _watchlist if w["id"] != watchlist_id]
    if len(_watchlist) == before:
        return False
    _alerts = [a for a in _alerts if a["watchlist_id"] != watchlist_id]
    return True


def demo_list_alerts() -> list:
    """Alerts newest-first, joined with parcel context (mirrors the real API)."""
    parcels = {w["id"]: w for w in _watchlist}
    out = []
    for a in sorted(_alerts, key=lambda x: x.get("created_at") or "", reverse=True):
        parcel = parcels.get(a["watchlist_id"], {})
        row = dict(a)
        row.update({
            "district": parcel.get("district"), "taluka": parcel.get("taluka"),
            "village": parcel.get("village"), "survey_no": parcel.get("survey_no"),
        })
        out.append(row)
    return out


def demo_mark_alerts_seen(watchlist_id: str) -> int:
    updated = 0
    for a in _alerts:
        if a["watchlist_id"] == watchlist_id and not a["seen"]:
            a["seen"] = True
            updated += 1
    return updated


# ──────────────────────────────────────────────────────────────────────────────
# Instant demo dropdown options
# ──────────────────────────────────────────────────────────────────────────────

DEMO_SURVEY_OPTIONS = ["1", "2", "3 P", "7", "12/2", "45", "72", "101", "128", "128 P", "301"]

DEMO_VILLAGES = [
    {"english": "Navrangpura", "gujarati": "નવરંગપુરા"},
    {"english": "Vejalpur", "gujarati": "વેજલપુર"},
    {"english": "Bopal", "gujarati": "બોપલ"},
    {"english": "Sanand", "gujarati": "સાણંદ"},
    {"english": "Dholera", "gujarati": "ધોલેરા"},
    {"english": "Bhimrad", "gujarati": "ભીમરાડ"},
]


def demo_survey_options() -> list:
    return list(DEMO_SURVEY_OPTIONS)


def demo_villages() -> list:
    return [dict(v) for v in DEMO_VILLAGES]


# ──────────────────────────────────────────────────────────────────────────────
# Whole-product demo fixtures — every remaining feature returns a realistic,
# deterministic result so an investor can click through the entire deployed
# site (which can't reach Open-Meteo / eCourts / newsdata.io / Gemini /
# Supabase) and never hit an error or an empty state.
#
# Every builder here is:
#   • deterministic — no randomness; dates use _rel_date/_iso_days_ago so the
#     output stays stable-ish (permanently "recent") no matter when it's shown;
#   • network-free — no scrape, no Gemini, no Playwright, no Supabase;
#   • schema-exact — the dict shape matches the real handler's response so the
#     frontend renders it unchanged.
# ──────────────────────────────────────────────────────────────────────────────


def demo_land_report() -> dict:
    """Full land-intelligence report for a believable Sanand / Dholera-corridor
    parcel. Matches POST /land-report's real response exactly:
    {lat, lng, area_sqm, elevation_m, annual_rain_mm, report{...}} where the
    nested report carries the 8 narrative sections + suitability + red_flags
    (see the LandReportRequest handler / frontend land-intel page)."""
    report = {
        "executive_summary": (
            "The subject parcel lies in the Sanand–Bavla belt of the Ahmedabad "
            "district, within the influence corridor of the Dholera Special "
            "Investment Region and the Ahmedabad–Dholera expressway. Location "
            "fundamentals are strong and the terrain is developable, but the "
            "holding is recorded as agricultural (Old Tenure) and its principal "
            "risks are pre-development: s.65 NA conversion, verification of the "
            "sanctioned DP/TP zoning, and a clean 7/12 + Index-2 title search "
            "before any transaction."),
        "location_summary": (
            "Peri-urban Sanand taluka, ~30 km south-west of Ahmedabad and inside "
            "the Dholera SIR / DMIC investment corridor. Established industrial "
            "anchors (Sanand GIDC, Tata Nano, Ford estate) drive demand; the "
            "locality is transitioning from agrarian to industrial-logistics use."),
        "soil_terrain": (
            "Gently sloping alluvial plain with medium-black to sandy-loam soils "
            "typical of the Nal Sarovar catchment fringe. Bearing capacity is "
            "adequate for low- to mid-rise construction; a plot-level geotechnical "
            "investigation is advised before foundation design."),
        "water_flood_risk": (
            "No mapped river or lake abutment, so no immediate CRZ/water-body "
            "buffer applies, but the wider Nal Sarovar depression drains sluggishly "
            "and localised monsoon waterlogging is on record for low points in this "
            "belt. Confirm the parcel's spot level against the village drainage line "
            "and check for any lake/tank reservation on the sanctioned plan."),
        "climate": (
            "Semi-arid (BSh): hot summers to ~42 °C, a concentrated June–September "
            "south-west monsoon delivering the bulk of annual rainfall, and mild "
            "winters. Design for high summer cooling loads and monsoon-season "
            "drainage."),
        "connectivity": (
            "~4 km to the Sarkhej–Sanand (SH-17) arterial and the Ahmedabad–Rajkot "
            "NH-47; ~30 km to Sardar Vallabhbhai Patel International Airport; on the "
            "Ahmedabad–Dholera expressway influence line, with the Sanand rail "
            "goods terminal nearby. Road access to the parcel edge should be "
            "confirmed against the TP road alignment."),
        "land_use_zoning": (
            "Likely falls under the AUDA / Dholera SIR development-plan ambit; the "
            "sanctioned DP zone (agricultural vs. residential-R zone vs. industrial) "
            "and any TP-scheme final-plot number must be verified from the "
            "sanctioned plan before assuming a buildable use. CGDCR-2017 base FSI "
            "and margins will follow the confirmed zone and abutting road width."),
        "development_potential": (
            "On NA conversion and a residential/industrial DP zone, the plot suits "
            "plotted development, warehousing/logistics, or a gated residential "
            "scheme given the DMIC-driven employment catchment. FSI and height "
            "follow the CGDCR zone and the abutting road width; wider TP roads "
            "unlock higher intensity."),
        "market_outlook": (
            "Demand is investment- and infrastructure-led (Dholera SIR, expressway, "
            "GIDC expansion) rather than end-user-led, so the horizon is medium-term. "
            "Indicative agricultural-land values in the belt run ~₹0.9–1.8 crore/acre "
            "depending on road frontage and NA status; confirm the applicable jantri "
            "(ASR) rate for stamp-duty and premium exposure."),
        "legal_notes": (
            "Before transacting, obtain and verify: the 7/12 (VF-7/12) extract and "
            "VF-6 mutation entries, the Index-2 of the last registered deed, the "
            "s.65 NA conversion order (or budget for it), a 30-year title search, an "
            "encumbrance certificate, and — for any organised sale of plots/units — "
            "RERA registration. Confirm the parcel is not Navi-Sharat / gauchar / "
            "trust land."),
        "suitability": {"agriculture": 6, "residential": 7, "commercial": 8},
        "red_flags": [
            "Recorded as agricultural land — s.65 NA conversion required before any "
            "non-agricultural development.",
            "Sanctioned DP/TP zone unconfirmed — do not assume a buildable use until "
            "the sanctioned plan and final-plot number are verified.",
            "Dholera SIR / expressway reservations can clip parcels — check for any "
            "road-widening or public-purpose reservation over the survey number.",
            "Investment-led demand means a medium-term horizon and price volatility "
            "tied to infrastructure milestones.",
        ],
    }
    return {
        "lat": 22.9612,
        "lng": 72.3809,
        "area_sqm": 8093.0,          # ~2 acres
        "elevation_m": 34.0,
        "annual_rain_mm": 741,
        "report": report,
    }


def demo_litigation_search() -> dict:
    """Realistic mixed eCourts result naming the recorded owner, matching
    litigation.py's output: {cases[], court_complex, message}. Each case
    carries case_no / parties / case_type / status / court. Includes the
    honest same-name/spelling caveat the product must always surface."""
    court_complex = "District & Sessions Court, Ahmedabad (Rural)"
    cases = [
        {
            "case_no": "R.C.S./412/2021",
            "parties": "Rameshbhai Ambalal Patel vs Jayantibhai Chunilal Shah",
            "case_type": "Regular Civil Suit — specific performance / boundary dispute",
            "status": "Pending",
            "court": "3rd Addl. Senior Civil Judge, Ahmedabad (Rural)",
        },
        {
            "case_no": "R.C.S./88/2016",
            "parties": "Rameshbhai Ambalal Patel vs State of Gujarat & Anr.",
            "case_type": "Regular Civil Suit — mutation entry challenge",
            "status": "Disposed",
            "court": "2nd Addl. Senior Civil Judge, Ahmedabad (Rural)",
        },
        {
            "case_no": "Misc./1207/2019",
            "parties": "Bank of Baroda vs Rameshbhai A. Patel",
            "case_type": "Misc. Civil Application — recovery / mortgage",
            "status": "Disposed",
            "court": "Principal Senior Civil Judge, Ahmedabad (Rural)",
        },
    ]
    return {
        "cases": cases,
        "court_complex": court_complex,
        "message": (
            f"{len(cases)} case(s) found in {court_complex} for 2021. "
            "IMPORTANT: eCourts matches on party name only — these results may "
            "include a different person who shares the same (or a similarly "
            "spelt) name, and may miss cases where the name is spelt "
            "differently. Confirm identity against the parcel's recorded owner "
            "before relying on any match."),
    }


def demo_gujarat_news() -> dict:
    """Plausible Gujarat land/property news feed matching GET /news/gujarat:
    {articles[], cached} where each article has source/title/desc/url/date.
    Dates use _iso_days_ago so the feed always looks fresh; url is a real
    outlet homepage placeholder (no live fetch)."""
    articles = [
        {
            "source": "The Times of India",
            "title": ("Dholera SIR: activation area land allotment gathers pace as "
                      "expressway nears completion"),
            "desc": ("The Dholera Special Investment Region has cleared a fresh round "
                     "of industrial plot allotments, with developers citing the "
                     "Ahmedabad–Dholera expressway and the international airport "
                     "groundwork as demand drivers along the corridor."),
            "url": "https://timesofindia.indiatimes.com/city/ahmedabad",
            "date": _iso_days_ago(2),
        },
        {
            "source": "The Indian Express",
            "title": "Gujarat revises jantri (ASR) rates; Ahmedabad peripheries see steepest rise",
            "desc": ("The revised Annual Statement of Rates lifts benchmark land "
                     "valuations across Ahmedabad's growth corridors, raising stamp "
                     "duty and Navi-Sharat premium exposure for buyers in Sanand, "
                     "Bavla and the SIR influence belt."),
            "url": "https://indianexpress.com/section/cities/ahmedabad/",
            "date": _iso_days_ago(5),
        },
        {
            "source": "Business Standard",
            "title": "AUDA notifies new TP schemes around Sanand–Bavla industrial belt",
            "desc": ("The Ahmedabad Urban Development Authority has notified draft "
                     "town-planning schemes covering villages in the Sanand and Bavla "
                     "talukas, converting swathes of agricultural land into planned "
                     "residential and industrial final plots."),
            "url": "https://www.business-standard.com/",
            "date": _iso_days_ago(9),
        },
        {
            "source": "The Economic Times",
            "title": "DMIC pull: warehousing and logistics demand firms up along Ahmedabad–Dholera line",
            "desc": ("Institutional interest in grade-A warehousing is rising along "
                     "the Delhi–Mumbai Industrial Corridor's Gujarat segment, with "
                     "the Sanand and Dholera nodes drawing the bulk of new "
                     "land-aggregation activity."),
            "url": "https://economictimes.indiatimes.com/industry/services/property-/-cstruction",
            "date": _iso_days_ago(13),
        },
        {
            "source": "Ahmedabad Mirror",
            "title": "Gujarat tightens Navi-Sharat land transfer scrutiny after mutation-fraud cases",
            "desc": ("The state revenue department has flagged closer scrutiny of "
                     "new-tenure (Navi Sharat) land transfers following a spate of "
                     "mutation-entry disputes, urging buyers to verify collector "
                     "permission and premium payment before registration."),
            "url": "https://www.ahmedabadmirror.com/",
            "date": _iso_days_ago(18),
        },
    ]
    return {"articles": articles, "cached": True}


# ── Manual fulfilment orders (in-memory, never Supabase) ─────────────────────

_MANUAL_ORDER_SKUS = {
    "certified_712_index2": {"label": "Certified 7/12 + Index-2 copy", "price_inr": 1500},
    "search_report_30yr": {"label": "30-year search report (advocate-certified)", "price_inr": 4999},
}


def _initial_manual_orders() -> list:
    """3 sample certified-copy orders in varied statuses (delivered /
    in_progress / pending) so the orders page renders a full lifecycle.
    Shape matches ManualOrderItem exactly."""
    return [
        {
            "id": "demo-o-1", "user_email": DEMO_EMAIL, "state": "GJ",
            "district": "Ahmedabad", "taluka": "City", "village": "Navrangpura",
            "survey_no": "128 P", "sku": "certified_712_index2",
            "price_inr": 1500, "status": "delivered",
            "notes": "Certified copy collected from Sub-Registrar Ahmedabad-2.",
            "created_at": _iso_days_ago(12), "updated_at": _iso_days_ago(8),
        },
        {
            "id": "demo-o-2", "user_email": DEMO_EMAIL, "state": "GJ",
            "district": "Ahmedabad", "taluka": "Sanand", "village": "Sanand",
            "survey_no": "45", "sku": "search_report_30yr",
            "price_inr": 4999, "status": "in_progress",
            "notes": "Advocate compiling 30-year chain; encumbrance search under way.",
            "created_at": _iso_days_ago(4), "updated_at": _iso_days_ago(1),
        },
        {
            "id": "demo-o-3", "user_email": DEMO_EMAIL, "state": "GJ",
            "district": "Ahmedabad", "taluka": "Dholera", "village": "Dholera",
            "survey_no": "72", "sku": "certified_712_index2",
            "price_inr": 1500, "status": "pending",
            "notes": "Awaiting partner pickup at Dholera taluka office.",
            "created_at": _iso_days_ago(1), "updated_at": _iso_days_ago(1),
        },
    ]


_manual_orders: list = _initial_manual_orders()
_next_order_id = 4


def demo_list_manual_orders() -> list:
    """Sample orders newest-first (mirrors the real API ordering)."""
    return sorted((dict(o) for o in _manual_orders),
                  key=lambda x: x.get("created_at") or "", reverse=True)


def demo_create_manual_order(email: str, state: str, district: str, taluka: str,
                             village: str, survey_no: str, sku: str,
                             notes: str = "") -> dict:
    """Echo back a created order (status 'pending') in-memory only — never
    touches Supabase. Server-side price comes from the SKU table, not the
    client, matching the real endpoint."""
    global _next_order_id
    sku_info = _MANUAL_ORDER_SKUS.get(sku) or _MANUAL_ORDER_SKUS["certified_712_index2"]
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "id": f"demo-o-{_next_order_id}", "user_email": email or DEMO_EMAIL,
        "state": (state or "GJ").strip().upper(),
        "district": district.strip(), "taluka": taluka.strip(),
        "village": village.strip(), "survey_no": survey_no.strip(),
        "sku": sku if sku in _MANUAL_ORDER_SKUS else "certified_712_index2",
        "price_inr": sku_info["price_inr"], "status": "pending",
        "notes": (notes or "").strip(),
        "created_at": now, "updated_at": now,
    }
    _next_order_id += 1
    _manual_orders.append(row)
    return dict(row)


# ── Uploaded-record analysis (title scanner OCR path, no Gemini) ─────────────

def demo_analyze_record() -> dict:
    """Parsed TitleReport-style analysis for the upload/OCR demo, matching
    main.py's AnalysisResult exactly (owner_name / survey_no / total_area /
    tenure_type / encumbrances / risk_level / risk_reason). Uses a CAUTION
    (restricted new-tenure) parcel so the risk badge is visibly meaningful."""
    return {
        "owner_name": "Kanubhai Somabhai Chaudhary",
        "survey_no": "45",
        "total_area": "12140 sq. m. (3 Acre)",
        "tenure_type": "New Tenure (Navi Sharat)",
        "encumbrances": "Boja of ₹52,00,000 — Bank of Baroda, Sanand branch",
        "risk_level": "RED",
        "risk_reason": "Restricted & Mortgaged",
    }


# ── Credits (generous demo balance so the nav never prompts payment) ─────────

DEMO_CREDITS = 999


def demo_credits(email: str) -> dict:
    """Generous demo credits so nothing in the UI prompts for payment.
    Matches GET /credits: {email, credits, payments_enabled, free_trial_credits}."""
    return {
        "email": (email or "").strip().lower() or DEMO_EMAIL,
        "credits": DEMO_CREDITS,
        "payments_enabled": False,
        "free_trial_credits": DEMO_CREDITS,
    }


# ── Risk screen defaults (a nicely-populated sample screening) ───────────────

# Sensible demo inputs for the Sanand parcel so screen_parcel() returns a
# populated result (seismic zone, GDCR FSI, agri/NA) instead of all-unknown.
DEMO_RISK_SCREEN_DEFAULTS = {
    "lat": 22.9612, "lng": 72.3809,
    "region": "Ahmedabad", "zone": "r2", "road_width_m": 18.0,
    "is_agricultural": True,
}
