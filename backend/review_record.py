"""User-confirmed source reading, distinctly attributed from local extraction."""
import json
import re
from typing import Dict, Literal

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from local_report import build_local_analysis

FIELD_NAMES = ("owner_name", "survey_no", "total_area", "tenure_type", "encumbrances")
MAX_REVIEW_CHARS = 12000
_EMPTY = {"", "unknown", "null", "n/a", "na", "-", "—"}


class SourceReviewField(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    value: str = Field(min_length=1, max_length=250)
    source_excerpt: str = Field(min_length=1, max_length=500)
    page: int = Field(ge=1, le=3)

    @model_validator(mode="after")
    def meaningful_source(self):
        if self.value.strip().casefold() in _EMPTY or not self.source_excerpt.strip():
            raise ValueError("Filled fields require a meaningful value and source excerpt")
        return self


class SourceReview(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    confirmed: Literal[True]
    fields: Dict[str, SourceReviewField] = Field(min_length=3, max_length=5)

    @model_validator(mode="after")
    def fixed_fields_and_area_units(self):
        if set(self.fields) - set(FIELD_NAMES):
            raise ValueError("Unsupported review field")
        if not {"owner_name", "survey_no", "total_area"}.issubset(self.fields):
            raise ValueError("Owner, survey number and area are required")
        area = self.fields["total_area"].value
        if not re.search(r"[0-9\u0ae6-\u0aef]", area) or not re.search(
            r"(?i)(?:\bsq\.?\s*(?:m|met(?:er|re)s?|ft|feet)\b|\bm[²2]\b|\bsqm\b|\bhectares?\b|\bha\b|\bacres?\b|\bgunthas?\b|\bsquare\s*(?:met(?:er|re)s?|feet)\b|ચો\.?\s*(?:મી|ફૂટ)|હેક્ટર|આર(?:ે)?|ગુઠા|ગુંઠા|એકર)", area
        ):
            raise ValueError("Area requires a number and explicit units")
        return self


def parse_review(raw):
    if len(raw) > MAX_REVIEW_CHARS:
        raise HTTPException(status_code=413, detail="The source review exceeds the allowed size.")
    try:
        # Reject repeated keys rather than silently accepting a last value.
        def unique_keys(pairs):
            result = {}
            for key, value in pairs:
                if key in result:
                    raise ValueError("Repeated JSON key")
                result[key] = value
            return result
        payload = json.loads(raw, object_pairs_hook=unique_keys)
        if not isinstance(payload, dict) or payload.get("confirmed") is not True:
            raise ValueError("Explicit boolean confirmation required")
        return SourceReview.model_validate(payload)
    except (ValueError, TypeError, ValidationError, RecursionError):
        raise HTTPException(status_code=422, detail="Confirm the review and provide owner, survey number, area with units, and a source excerpt/page for each entered field.") from None


def pending_source_review(parsed):
    """Retain readable text when machine labels cannot be found."""
    raw_text = parsed.get("raw_text") or ""
    # Page markers alone do not constitute readable source content.
    if not re.sub(r"\[Page \d+\]|\s", "", raw_text):
        raise HTTPException(status_code=422, detail="No readable text was found. Upload a clearer document for manual source review.")
    return {**{field: "Unknown" for field in FIELD_NAMES}, "risk_level": "YELLOW",
            "risk_reason": "Local text is available but fields need confirmation against the original source.",
            "status": "review_required", "raw_text": raw_text,
            "evidence": parsed.get("evidence", []),
            "metadata": {**parsed.get("metadata", {}), "manual_review_required": True,
                         "review_required": True, "official_source_verified": False}}


def build_reviewed_analysis(parsed, review):
    pages = parsed.get("metadata", {}).get("pages_processed", 0)
    if not isinstance(pages, int) or pages < 1:
        raise HTTPException(status_code=422, detail="The original source pages could not be verified for this review.")
    if any(field.page > pages for field in review.fields.values()):
        raise HTTPException(status_code=422, detail="A reviewed field refers to a page that was not processed. Upload that page separately.")
    fields = {name: "Unknown" for name in FIELD_NAMES}
    evidence = list(parsed.get("evidence", []))
    for name, field in review.fields.items():
        fields[name] = field.value.strip()
        evidence.append({"field": name, "value": fields[name], "page": field.page,
                         "snippet": field.source_excerpt.strip(), "method": "user_review",
                         "confidence": "user_confirmed_source_unverified",
                         "source_excerpt_verified": False})
    reviewed = {**parsed, **fields, "evidence": evidence,
                "metadata": {**parsed.get("metadata", {}),
                             "machine_fields": {name: parsed.get(name) or "Unknown" for name in FIELD_NAMES},
                             "review_changes": [{"field": name, "machine_value": parsed.get(name) or "Unknown", "reviewed_value": fields[name]}
                                                for name in FIELD_NAMES if (parsed.get(name) or "Unknown") != fields[name]],
                             "user_review_confirmed": True, "reviewer_identity_verified": False,
                             "source_excerpt_verified": False, "official_source_verified": False,
                             "manual_review_required": True}}
    result = build_local_analysis(reviewed)
    result["status"] = "reviewed_preliminary"
    result["report"]["coverage"].update(user_review_confirmed=True, source_excerpt_verified=False)
    result["report"]["risk"]["checks"].append({"name": "user_source_review", "status": "unavailable",
        "detail": "Entered values and excerpts were confirmed by the user; their accuracy, reviewer identity and official source authenticity have not been independently verified."})
    return result
