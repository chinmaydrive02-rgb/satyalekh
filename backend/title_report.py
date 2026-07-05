# title_report.py — Chain-of-title construction, fraud/risk flagging, risk
# scoring, and the in-memory async job store that powers /jobs/title-report.
#
# Design rule: everything in this file except structure_chain_with_gemini()
# is pure Python (no network, no Playwright) so it can be unit-tested with
# fixture data. Gemini calls degrade gracefully to a deterministic fallback.

import ast
import json
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Callable, Optional


# ──────────────────────────────────────────────────────────────────────────────
# Mutation-entry parsing (deterministic)
# ──────────────────────────────────────────────────────────────────────────────

# Years look like entry numbers — exclude anything in a plausible year range
_YEAR_MIN, _YEAR_MAX = 1850, 2100

# "Entry No. 4501", "entry 4501", "note no 4501", "નોંધ નં 4501", "#4501"
_ENTRY_PATTERNS = [
    re.compile(r"(?:entry|entries|note|mutation|ferfar|નોંધ|ફેરફાર)\s*(?:no\.?|nos\.?|number|નં\.?|#)?\s*:?\s*(\d{1,6})", re.IGNORECASE),
    re.compile(r"#\s*(\d{1,6})"),
]


def _looks_like_year(n: int) -> bool:
    return _YEAR_MIN <= n <= _YEAR_MAX


def parse_mutation_entries(text: str, cap: int = 20) -> list:
    """Extract mutation entry numbers from free-form mutation_entries text.

    Handles formats like:
      "Entries 4501 (2015), 4790 (2018)"
      "Entry No. 1234; Entry No. 5678"
      "નોંધ નં 301, 302"
      "3 entries: 1201, 1305, 2210"
    Returns unique entry numbers as strings, in order of first appearance.
    """
    if not text or not isinstance(text, str) or text.strip() in ("—", "-", "None", "none", "N/A"):
        return []

    found: list = []

    def _add(num_str: str):
        n = num_str.lstrip("0") or "0"
        if n not in found and not _looks_like_year(int(num_str)):
            found.append(n)

    for pat in _ENTRY_PATTERNS:
        for m in pat.finditer(text):
            _add(m.group(1))

    # General pass: standalone numbers OUTSIDE parentheses (parenthesised
    # numbers are almost always years: "4501 (2015)"). Catches list tails like
    # "Entries 4501 (2015), 4790 (2018)" where only the first number follows
    # the keyword. Single digits are skipped here — they're usually counts
    # ("3 mutations recorded: ...") — keyword-prefixed ones are caught above.
    no_parens = re.sub(r"\([^)]*\)", " ", text)
    for m in re.finditer(r"\b(\d{2,6})\b", no_parens):
        _add(m.group(1))

    return found[:cap]


def parse_available_options(error_message: str) -> Optional[list]:
    """Extract the survey-number suggestion list from the scraper's
    "Survey number 'X' not found... Available options (first 15): [...]" error.
    Returns None if the message doesn't contain a parseable list."""
    if not error_message or "Available options" not in error_message:
        return None
    m = re.search(r"Available options[^:]*:\s*(\[.*\])", error_message, re.DOTALL)
    if not m:
        return None
    try:
        options = ast.literal_eval(m.group(1))
        if isinstance(options, list):
            return [str(o) for o in options]
    except Exception:
        pass
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Date parsing
# ──────────────────────────────────────────────────────────────────────────────

_DATE_FORMATS = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y", "%d.%m.%Y", "%Y/%m/%d"]


def parse_entry_date(raw) -> Optional[datetime]:
    """Best-effort parse of a mutation entry date string. Accepts dd/mm/yyyy,
    dd-mm-yyyy, yyyy-mm-dd, bare years ("2019"), or text containing a year."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s or s in ("—", "-"):
        return None
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    # Bare year or year embedded in text
    m = re.search(r"\b(1[89]\d{2}|20\d{2})\b", s)
    if m:
        return datetime(int(m.group(1)), 7, 1)  # mid-year to avoid edge bias
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Deterministic fraud/risk flag detection on a structured chain
# ──────────────────────────────────────────────────────────────────────────────

RESTRICTED_TENURE_KEYWORDS = [
    "new tenure", "navi sharat", "navi", "restricted", "72-aa", "72aa", "72 aa",
    "ganot", "prohibited", "premium", "non-transferable",
]

ENCUMBRANCE_KEYWORDS = [
    "court", "stay", "boja", "boj", "બોજ", "mortgage", "gahan", "lien",
    "charge", "injunction", "attachment", "loan", "bank", "decree", "lis pendens",
]

TRANSFER_TYPE_KEYWORDS = [
    "sale", "vechan", "transfer", "gift", "bakshis", "exchange", "will",
    "varsai", "inheritance", "succession", "partition", "vehchani",
]


def _norm_party(name) -> str:
    if not name:
        return ""
    s = re.sub(r"[^\w\s]", " ", str(name).lower())
    return re.sub(r"\s+", " ", s).strip()


def _parties_overlap(a: str, b: str) -> bool:
    """Fuzzy person-name comparison: True if the two party strings share at
    least one meaningful token (Indian records reorder names constantly)."""
    ta = {t for t in _norm_party(a).split() if len(t) > 2}
    tb = {t for t in _norm_party(b).split() if len(t) > 2}
    if not ta or not tb:
        return True  # can't prove a mismatch on empty data
    return bool(ta & tb)


def _is_transfer(entry: dict) -> bool:
    mtype = str(entry.get("mutation_type") or "").lower()
    if any(k in mtype for k in TRANSFER_TYPE_KEYWORDS):
        return True
    # Fallback heuristic: distinct from/to parties implies a transfer
    frm, to = _norm_party(entry.get("from_party")), _norm_party(entry.get("to_party"))
    return bool(frm and to and frm != to and not any(
        k in mtype for k in ("mortgage", "boja", "loan", "charge", "release")))


def _entry_text(entry: dict) -> str:
    return " ".join(str(entry.get(k) or "") for k in
                    ("mutation_type", "description", "from_party", "to_party")).lower()


def apply_chain_flags(chain: list, now: Optional[datetime] = None) -> list:
    """Annotate each chain entry's `flags` list in place (and return the chain).

    Flags detected deterministically:
      RECENT_CHURN   — 2+ ownership transfers within the last 3 years
      RESTRICTED_TENURE — new tenure / 72-AA / ganot language
      ENCUMBRANCE    — court / stay / boja / mortgage language
      CHAIN_GAP      — to_party of an entry doesn't connect to the next from_party
    """
    now = now or datetime.now()
    for entry in chain:
        entry.setdefault("flags", [])

    # Per-entry keyword flags
    for entry in chain:
        text = _entry_text(entry)
        if any(k in text for k in RESTRICTED_TENURE_KEYWORDS):
            if "RESTRICTED_TENURE" not in entry["flags"]:
                entry["flags"].append("RESTRICTED_TENURE")
        if any(k in text for k in ENCUMBRANCE_KEYWORDS):
            if "ENCUMBRANCE" not in entry["flags"]:
                entry["flags"].append("ENCUMBRANCE")

    # Recent ownership churn: 2+ transfers in the last 3 years
    cutoff_year_span = 3 * 365.25
    recent_transfers = []
    for entry in chain:
        if not _is_transfer(entry):
            continue
        dt = parse_entry_date(entry.get("date"))
        if dt and 0 <= (now - dt).days <= cutoff_year_span:
            recent_transfers.append(entry)
    if len(recent_transfers) >= 2:
        for entry in recent_transfers:
            if "RECENT_CHURN" not in entry["flags"]:
                entry["flags"].append("RECENT_CHURN")

    # Chain continuity: to_party of entry N should connect to from_party of N+1
    transfers = [e for e in chain if _is_transfer(e)]
    for prev, nxt in zip(transfers, transfers[1:]):
        if not _parties_overlap(prev.get("to_party"), nxt.get("from_party")):
            if "CHAIN_GAP" not in nxt["flags"]:
                nxt["flags"].append("CHAIN_GAP")

    return chain


# ──────────────────────────────────────────────────────────────────────────────
# Risk scoring
# ──────────────────────────────────────────────────────────────────────────────

_NO_ENCUMBRANCE_VALUES = {"none", "null", "", "n/a", "no", "nil", "—", "-", "clear"}


def basic_risk_level(tenure_type: str, encumbrances: str) -> tuple:
    """Shared GREEN/YELLOW/RED logic (also used by /analyze-record).
    Returns (risk_level, risk_reason)."""
    tenure = (tenure_type or "").lower()
    encum = (encumbrances or "").strip()

    risk_level, risk_reason = "GREEN", "Clear Title"
    restricted = "new" in tenure or "navi" in tenure or any(
        k in tenure for k in RESTRICTED_TENURE_KEYWORDS)
    if restricted:
        risk_level, risk_reason = "YELLOW", "Restricted Development / New Tenure"
    if encum and encum.lower() not in _NO_ENCUMBRANCE_VALUES:
        risk_level, risk_reason = "RED", "Mortgaged or Encumbered"
        if restricted:
            risk_reason = "Restricted & Mortgaged"
    return risk_level, risk_reason


def compute_risk(record: dict, chain: list, now: Optional[datetime] = None) -> dict:
    """Deterministic risk assessment of a fetched 7/12 record + structured chain.

    Returns {"score": 0-100 (0 = clean), "verdict": CLEAR|CAUTION|HIGH_RISK,
             "checks": [{name, status pass|warn|fail|unavailable, detail}]}.
    """
    now = now or datetime.now()
    checks = []
    score = 0

    def _add(name, status, detail, points=0):
        nonlocal score
        checks.append({"name": name, "status": status, "detail": detail})
        score += points

    # 1. Tenure type
    tenure = str(record.get("tenure_type") or "").strip()
    if not tenure or tenure in ("—", "-"):
        _add("tenure_type", "unavailable", "Tenure type not visible on the record.")
    elif any(k in tenure.lower() for k in RESTRICTED_TENURE_KEYWORDS) or "new" in tenure.lower():
        _add("tenure_type", "fail",
             f"Restricted tenure detected ('{tenure}'). Transfer may need collector permission / premium.", 25)
    else:
        _add("tenure_type", "pass", f"Tenure appears unrestricted ('{tenure}').")

    # 2. Encumbrances (boja)
    encum = str(record.get("encumbrances") or "").strip()
    if not encum or encum in ("—", "-"):
        _add("encumbrances", "unavailable", "Encumbrance column not readable on the record.")
    elif encum.lower() in _NO_ENCUMBRANCE_VALUES:
        _add("encumbrances", "pass", "No encumbrances (boja) recorded.")
    else:
        _add("encumbrances", "fail", f"Encumbrance recorded: {encum}", 30)

    # 3. Ownership churn (2+ transfers in last 3 years)
    if not chain:
        _add("ownership_churn", "unavailable", "No structured mutation chain available.")
    else:
        churned = [e for e in chain if "RECENT_CHURN" in (e.get("flags") or [])]
        if churned:
            _add("ownership_churn", "warn",
                 f"{len(churned)} ownership transfers in the last 3 years — rapid flipping is a fraud marker.", 20)
        else:
            _add("ownership_churn", "pass", "No rapid ownership turnover in the last 3 years.")

    # 4. Chain continuity
    if len(chain) < 2:
        _add("chain_continuity", "unavailable",
             "Fewer than 2 chain entries — continuity cannot be assessed.")
    else:
        gaps = [e for e in chain if "CHAIN_GAP" in (e.get("flags") or [])]
        if gaps:
            _add("chain_continuity", "warn",
                 f"{len(gaps)} possible gap(s): a seller does not match the previous recorded owner.", 15)
        else:
            _add("chain_continuity", "pass", "Each transfer connects to the previous recorded owner.")

    # 5. Court / stay / litigation language anywhere in the record or chain
    haystack = " ".join([
        str(record.get("mutation_entries") or ""),
        str(record.get("encumbrances") or ""),
    ] + [_entry_text(e) for e in chain]).lower()
    lit_hits = sorted({k for k in ("court", "stay", "injunction", "decree", "lis pendens", "attachment")
                       if k in haystack})
    if lit_hits:
        _add("litigation_mentions", "fail",
             f"Litigation language found in record/chain: {', '.join(lit_hits)}.", 25)
    else:
        _add("litigation_mentions", "pass", "No court/stay language found in the record or chain.")

    score = min(100, score)
    verdict = "CLEAR" if score < 20 else ("CAUTION" if score < 50 else "HIGH_RISK")
    return {"score": score, "verdict": verdict, "checks": checks}


# ──────────────────────────────────────────────────────────────────────────────
# Chain structuring (Gemini pass with deterministic fallback)
# ──────────────────────────────────────────────────────────────────────────────

def fallback_chain_from_entries(entry_nos: list) -> list:
    """Minimal chain when Gemini is unavailable: one skeleton entry per
    parsed mutation number, in the order they appeared."""
    return [{
        "entry_no": str(n), "date": "", "mutation_type": "unknown",
        "from_party": "", "to_party": "", "description": "Mutation entry (details not parsed)",
        "flags": [],
    } for n in entry_nos]


def structure_chain_with_gemini(mutation_text: str, vf6_texts: list, record_ctx: dict) -> list:
    """One strict-JSON Gemini pass turning mutation text (+ any VF-6 detail
    text) into an ordered chain of title. Raises on failure — callers fall
    back to fallback_chain_from_entries()."""
    from scraper import get_gemini_client  # lazy: keeps this module import-light

    vf6_block = "\n\n".join(
        f"--- VF-6 ENTRY DETAIL {i + 1} ---\n{t}" for i, t in enumerate(vf6_texts)) or "(none fetched)"
    prompt = f"""You are a Gujarat land-records title examiner. Build a chain of title from the
mutation (ferfar) information of a 7/12 extract. Translate Gujarati to English.

PARCEL: District={record_ctx.get('district')}, Taluka={record_ctx.get('taluka')}, Village={record_ctx.get('village')}, Survey No={record_ctx.get('survey_no')}

MUTATION ENTRIES TEXT (from the 7/12 extract):
{mutation_text or '(none)'}

VF-6 ENTRY DETAILS (per-entry documents, may be empty):
{vf6_block}

Return ONLY a valid JSON array, ordered OLDEST entry first. One object per
mutation entry, with exactly these keys:
[{{"entry_no": "entry number as string", "date": "date if known (dd/mm/yyyy or yyyy) else empty string", "mutation_type": "sale | inheritance | gift | mortgage | mortgage release | partition | will | court order | land acquisition | other", "from_party": "transferor name(s), empty if unknown", "to_party": "transferee name(s), empty if unknown", "description": "one-line English summary of the entry"}}]
If a field is unknown use an empty string. Do NOT invent entries not present
in the text. Return [] if no entries can be identified."""

    response = get_gemini_client().models.generate_content(
        model="gemini-2.5-flash", contents=[prompt])
    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    chain = json.loads(text.strip())
    if not isinstance(chain, list):
        raise ValueError("Gemini chain output was not a list")
    cleaned = []
    for e in chain:
        if not isinstance(e, dict):
            continue
        cleaned.append({
            "entry_no": str(e.get("entry_no") or ""),
            "date": str(e.get("date") or ""),
            "mutation_type": str(e.get("mutation_type") or "other"),
            "from_party": str(e.get("from_party") or ""),
            "to_party": str(e.get("to_party") or ""),
            "description": str(e.get("description") or ""),
            "flags": [],
        })
    return cleaned


def compose_title_report(record: dict, chain: list, cached: bool = False,
                         now: Optional[datetime] = None) -> dict:
    """Assemble the final TitleReport object served to the frontend."""
    now = now or datetime.now()
    chain = apply_chain_flags(list(chain), now=now)
    return {
        "record": record,
        "chain_of_title": chain,
        "risk": compute_risk(record, chain, now=now),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cached": cached,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Snapshot diffing (watchlist alerts)
# ──────────────────────────────────────────────────────────────────────────────

WATCH_FIELDS = ["owner_name", "encumbrances", "mutation_entries", "tenure_type"]


def diff_snapshot(old: Optional[dict], new: dict, fields: Optional[list] = None) -> dict:
    """Compare key fields of two record snapshots.
    Returns {field: {"old": ..., "new": ...}} for every changed field.
    A missing/None old snapshot yields no changes (first check = baseline)."""
    if not old:
        return {}
    changes = {}
    for f in (fields or WATCH_FIELDS):
        ov = str(old.get(f) or "").strip()
        nv = str(new.get(f) or "").strip()
        if ov != nv:
            changes[f] = {"old": ov, "new": nv}
    return changes


# ──────────────────────────────────────────────────────────────────────────────
# In-memory async job store (with TTL cleanup)
# ──────────────────────────────────────────────────────────────────────────────

JOB_TTL_SECONDS = 2 * 3600       # finished jobs kept 2h for polling stragglers
JOB_HARD_TTL_SECONDS = 6 * 3600  # any job (even stuck "running") purged after 6h

# Progress stage → human label (frontend shows stage_label verbatim)
STAGE_LABELS = {
    "queued":             "Queued",
    "connecting":         "Contacting AnyROR portal…",
    "selecting_location": "Selecting district, taluka and village…",
    "solving_captcha":    "Solving the security CAPTCHA…",
    "reading_record":     "Reading the land record…",
    "fetching_chain":     "Fetching mutation entry details…",
    "building_report":    "Building your title report…",
    "done":               "Report ready",
    "error":              "Something went wrong",
}


class JobStore:
    """Tiny in-memory job registry. Results are also mirrored to Supabase
    (title_reports table) by the job runner so restarts don't lose reports."""

    def __init__(self, clock: Callable[[], float] = time.time):
        self._jobs: dict = {}
        self._clock = clock

    def create(self, meta: Optional[dict] = None) -> str:
        self.cleanup()
        job_id = uuid.uuid4().hex
        now = self._clock()
        self._jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "stage": "queued",
            "stage_label": STAGE_LABELS["queued"],
            "progress": 0,
            "result": None,
            "error": None,
            "suggestions": None,
            "meta": meta or {},
            "created_at": now,
            "updated_at": now,
        }
        return job_id

    def update(self, job_id: str, **fields):
        job = self._jobs.get(job_id)
        if job is None:
            return
        job.update(fields)
        if "stage" in fields and "stage_label" not in fields:
            job["stage_label"] = STAGE_LABELS.get(fields["stage"], fields["stage"])
        job["updated_at"] = self._clock()

    def set_progress(self, job_id: str, stage: str, label: Optional[str] = None,
                     progress: Optional[int] = None):
        updates = {"stage": stage, "status": "running"}
        if label is not None:
            updates["stage_label"] = label
        if progress is not None:
            updates["progress"] = max(0, min(100, int(progress)))
        self.update(job_id, **updates)

    def finish(self, job_id: str, result: dict):
        self.update(job_id, status="done", stage="done", progress=100, result=result)

    def fail(self, job_id: str, error: str, suggestions: Optional[list] = None):
        self.update(job_id, status="error", stage="error", error=error,
                    suggestions=suggestions)

    def get(self, job_id: str) -> Optional[dict]:
        self.cleanup()
        return self._jobs.get(job_id)

    def running_count(self, demo: Optional[bool] = None) -> int:
        """Number of queued/running jobs. Pass demo=True/False to count only
        demo or only real jobs (a job is 'demo' when meta['demo'] is truthy)."""
        n = 0
        for job in self._jobs.values():
            if job["status"] in ("queued", "running"):
                if demo is None or bool((job.get("meta") or {}).get("demo")) == demo:
                    n += 1
        return n

    def cleanup(self):
        """Drop finished jobs older than JOB_TTL_SECONDS and any job older
        than JOB_HARD_TTL_SECONDS (protects against leaked 'running' jobs)."""
        now = self._clock()
        for jid in list(self._jobs.keys()):
            job = self._jobs[jid]
            age = now - job["updated_at"]
            if job["status"] in ("done", "error") and age > JOB_TTL_SECONDS:
                del self._jobs[jid]
            elif now - job["created_at"] > JOB_HARD_TTL_SECONDS:
                del self._jobs[jid]

    def __len__(self):
        return len(self._jobs)
