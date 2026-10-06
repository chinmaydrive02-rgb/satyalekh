"""Account-owned persistence of server-built reviewed uploads, never a public cache.

HTTP callers must authenticate the bearer token before calling these helpers and
must build the analysis from the original upload; do not expose a client JSON save.
"""
from copy import deepcopy
import json
import re
import unicodedata
from uuid import UUID

from fastapi import HTTPException

from authentication import AuthenticatedUser

RECORD_TYPE = "UPLOADED_RECORD"
SUMMARY_FIELDS = "id,created_at,district,taluka,village,survey_no,record_type"
_EMPTY = {"", "unknown", "null", "n/a", "na", "-", "—"}


def _unavailable():
    return HTTPException(status_code=503, detail="Saved reports are temporarily unavailable. Check your saved reports before retrying a save.")


def _owner(identity):
    if not isinstance(identity, AuthenticatedUser):
        raise HTTPException(status_code=401, detail="Sign in with a verified account to access saved reports.")
    try:
        return str(UUID(identity.user_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=401, detail="Sign in with a verified account to access saved reports.") from None


def _known(value):
    if not isinstance(value, str) or value.strip().casefold() in _EMPTY:
        return None
    return value.strip()


def _saved_identity(row):
    if not isinstance(row, dict) or not isinstance(row.get("created_at"), str) or not row["created_at"].strip():
        raise _unavailable()
    try:
        ident = str(UUID(row["id"]))
    except (KeyError, ValueError, TypeError, AttributeError):
        raise _unavailable() from None
    return {"id": ident, "created_at": row["created_at"]}


def _rows(response):
    rows = getattr(response, "data", None)
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise _unavailable()
    return rows


def save_reviewed_report(sb, identity: AuthenticatedUser, analysis: dict) -> dict:
    """Strictly persist a server-built reviewed upload, returning its saved ID."""
    owner = _owner(identity)
    report = analysis.get("report") if isinstance(analysis, dict) else None
    coverage = report.get("coverage") if isinstance(report, dict) else None
    document = report.get("source_document") if isinstance(report, dict) else None
    metadata = analysis.get("metadata") if isinstance(analysis, dict) else None
    evidence = analysis.get("evidence") if isinstance(analysis, dict) else None
    if (not isinstance(report, dict) or report.get("demo") or analysis.get("demo")
            or not isinstance(coverage, dict) or coverage.get("user_review_confirmed") is not True
            or coverage.get("source") not in {"user_supplied_record", "user_supplied_record_bundle"}
            or not isinstance(document, dict) or not isinstance(document.get("sha256"), str)
            or not re.fullmatch(r"[0-9a-f]{64}", document["sha256"])
            or not isinstance(metadata, dict) or not isinstance(evidence, list)
            or not isinstance(report.get("record"), dict)):
        raise HTTPException(status_code=422, detail="Only a reviewed report rebuilt from an original uploaded record can be saved.")
    record = report["record"]
    survey = _known(record.get("survey_no"))
    if survey is None:
        raise HTTPException(status_code=422, detail="Review the original record's survey number before saving.")
    locations = {key: _known(record.get(key)) for key in ("district", "taluka", "village")}
    if all(locations.values()):
        # JSON encoding prevents separator-containing source labels colliding.
        key_parts = [unicodedata.normalize("NFC", " ".join(value.split()))
                     for value in [*locations.values(), survey]]
        location_key = "user_source|" + json.dumps(key_parts, ensure_ascii=False, separators=(",", ":"))
    else:
        location_key = "user_source|sha256|" + document["sha256"]
    stored = deepcopy(report)
    stored["source_review_metadata"] = deepcopy(metadata)
    stored["source_review_evidence"] = deepcopy(evidence)
    payload = {"owner_id": owner, "user_email": identity.email,
               "record_type": RECORD_TYPE, "location_key": location_key,
               **locations, "survey_no": survey, "report": stored}
    try:
        if sb is None:
            raise _unavailable()
        rows = _rows(sb.table("title_reports").insert(payload).execute())
        if len(rows) != 1:
            raise _unavailable()
        return _saved_identity(rows[0])
    except Exception:
        # Provider messages may contain source data, emails or credentials.
        raise _unavailable() from None


def get_reviewed_reports(sb, identity: AuthenticatedUser, limit: int = 30, offset: int = 0) -> list:
    """List lightweight saved-upload summaries for this verified account."""
    owner = _owner(identity)
    if type(limit) is not int or not 1 <= limit <= 100:
        raise HTTPException(status_code=422, detail="Choose a saved-report limit between 1 and 100.")
    if type(offset) is not int or not 0 <= offset <= 10000:
        raise HTTPException(status_code=422, detail="Choose a saved-report offset between 0 and 10000.")
    try:
        if sb is None:
            raise _unavailable()
        rows = _rows(sb.table("title_reports").select(SUMMARY_FIELDS)
                     .eq("owner_id", owner).eq("record_type", RECORD_TYPE)
                     .order("created_at", desc=True).order("id", desc=True)
                     .range(offset, offset + limit - 1).execute())
        return [{**_saved_identity(row), **{key: row.get(key) for key in
                 ("district", "taluka", "village", "survey_no", "record_type")}} for row in rows]
    except Exception:
        raise _unavailable() from None


def get_reviewed_report(sb, identity: AuthenticatedUser, report_id: str) -> dict:
    """Read one saved upload without exposing other accounts or official caches."""
    owner = _owner(identity)
    try:
        ident = str(UUID(report_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=422, detail="The saved report link has an invalid identifier.") from None
    try:
        if sb is None:
            raise _unavailable()
        rows = _rows(sb.table("title_reports").select("id,created_at,report")
                     .eq("id", ident).eq("owner_id", owner).eq("record_type", RECORD_TYPE)
                     .limit(1).execute())
        if rows:
            row = rows[0]
            if not isinstance(row.get("report"), dict):
                raise _unavailable()
            return {**_saved_identity(row), "report": deepcopy(row["report"])}
    except Exception:
        raise _unavailable() from None
    raise HTTPException(status_code=404, detail="Saved report not found in your account.")
