"""Attach exact-linked, unverified VF6 evidence without inferring title transfers."""
from copy import deepcopy
from datetime import datetime
import re
import unicodedata

_DIGITS = str.maketrans("૦૧૨૩૪૫૬૭૮૯", "0123456789")
_SURVEY = r"[0-9]+(?:[/-][0-9]+)*"
_REVIEW_FLAG = "Source record; parties and legal effect require review"


def _normal(value):
    # Gujarati letter પ is deliberately not a digit, including in old records.
    return " ".join(unicodedata.normalize("NFC", value).translate(_DIGITS).split()) if isinstance(value, str) else ""


def _references(source):
    refs = source.get("mutation_refs")
    owners = source.get("owners")
    if not isinstance(refs, dict) or not isinstance(owners, list):
        raise ValueError("Upload a supported primary saved VF7 page with original mutation references.")
    candidates = []
    for section in ("ownership_unclassified", "rights_unclassified"):
        rows = refs.get(section)
        if not isinstance(rows, list):
            raise ValueError("The primary VF7 mutation reference rows are missing; upload the original saved page.")
        for row in rows:
            if not isinstance(row, list) or any(not isinstance(cell, str) for cell in row):
                raise ValueError("The primary VF7 mutation reference rows are unsupported.")
            for cell in row:
                candidates.extend(token for token in re.split(r"[,;\s]+", _normal(cell)) if token)
    for owner in owners:
        if not isinstance(owner, str):
            raise ValueError("The primary VF7 ownership source rows are unsupported.")
        for parenthesized in re.findall(r"\(([^()]*)\)", owner):
            candidates.extend(token for token in re.split(r"[,;\s]+", _normal(parenthesized)) if token)
    recognized, unrecognized = [], []
    for token in candidates:
        target = recognized if re.fullmatch(r"[0-9]+", token) else unrecognized
        if token not in target:
            target.append(token)
    return recognized, unrecognized


def _surveys(raw):
    parts = _normal(raw).split(",")
    result = []
    for part in parts:
        match = re.fullmatch(rf"\s*({_SURVEY})(?:\s*\([^()]+\))?\s*", part)
        if not match:
            raise ValueError("VF6 affected survey numbers have an unsupported or ambiguous format; supply a clearer original VF6 page.")
        result.append(match.group(1))
    return result


def _source_date(value):
    """Read only a complete explicit date; never infer dates from entry numbers."""
    text = _normal(value)
    for pattern, fmt in ((r"(?<![0-9])[0-9]{2}/[0-9]{2}/[0-9]{4}(?![0-9])", "%d/%m/%Y"),
                         (r"(?<![0-9])[0-9]{4}-[0-9]{2}-[0-9]{2}(?![0-9])", "%Y-%m-%d")):
        match = re.search(pattern, text)
        if match:
            try:
                return datetime.strptime(match.group(), fmt).date()
            except ValueError:
                return None
    return None


def attach_mutation_records(analysis: dict, mutations: list[dict]) -> dict:
    """Return a copy with source evidence attached, or reject the entire bundle.

    Matching uses native VF7 source identity and user-reviewed survey identity.
    The title-risk engine is deliberately not rerun on untranslated narratives.
    """
    if not isinstance(analysis, dict) or not isinstance(analysis.get("report"), dict):
        raise ValueError("Build a reviewed primary VF7 report before attaching mutation records.")
    report = analysis["report"]
    source = report.get("source_record")
    if not isinstance(source, dict) or not isinstance(source.get("identifiers"), dict):
        raise ValueError("Mutation attachments require the original saved VF7 source record; upload and review that page first.")
    if source.get("record_type", "VF7") != "VF7":
        raise ValueError("Mutation attachments require a primary VF7 source record.")
    primary_survey = _normal(source["identifiers"].get("survey_no"))
    if not re.fullmatch(_SURVEY, primary_survey):
        raise ValueError("The primary VF7 survey number is ambiguous or unsupported; review the original source.")
    reviewed_record = report.get("record")
    if not isinstance(reviewed_record, dict) or _normal(reviewed_record.get("survey_no")) != primary_survey:
        raise ValueError("The reviewed survey number differs from the original VF7 source; correct the review before attaching VF6 evidence.")
    locations = source.get("locations")
    if not isinstance(locations, dict) or any(not _normal(locations.get(key)) for key in ("district", "taluka", "village")):
        raise ValueError("The primary VF7 lacks complete district, taluka and village source identity.")
    recognized, unrecognized = _references(source)
    if not isinstance(mutations, list) or not mutations:
        raise ValueError("Supply at least one parsed saved VF6 mutation record.")
    if report.get("supporting_records"):
        raise ValueError("This report already has mutation attachments; rebuild it with the complete bundle to avoid duplicates.")
    supporting, chain, seen, warnings = [], [], set(), []
    for index, parsed in enumerate(mutations, 1):
        if not isinstance(parsed, dict) or not all(isinstance(parsed.get(key), dict) for key in ("source_record", "mutation_record", "metadata")):
            raise ValueError(f"Attachment {index} is not a supported locally parsed VF6 record.")
        mutation, secondary, metadata = parsed["mutation_record"], parsed["source_record"], parsed["metadata"]
        if secondary.get("record_type") != "VF6" or metadata.get("method") != "local_anyror_vf6_saved_html":
            raise ValueError(f"Attachment {index} must be an original saved VF6 result page.")
        if not isinstance(secondary.get("identifiers"), dict) or not isinstance(secondary.get("locations"), dict):
            raise ValueError(f"Attachment {index} lacks supported VF6 location or entry identity; upload the original page again.")
        if secondary.get("raw_fields") != mutation or secondary.get("identifiers", {}).get("entry_no") != mutation.get("entry_no"):
            raise ValueError(f"Attachment {index} has inconsistent VF6 source fields; upload the original page again.")
        if not isinstance(metadata.get("source_sha256"), str) or not re.fullmatch(r"[0-9a-f]{64}", metadata["source_sha256"]):
            raise ValueError(f"Attachment {index} lacks its original file fingerprint; upload the VF6 page again.")
        for key in ("district", "taluka", "village"):
            if _normal(secondary.get("locations", {}).get(key)) != _normal(locations[key]):
                raise ValueError(f"Attachment {index} {key} does not exactly match the primary VF7; supply the VF6 for the same location.")
        if primary_survey not in _surveys(mutation.get("affected_surveys")):
            raise ValueError(f"Attachment {index} affected survey numbers do not exactly match the primary VF7 survey.")
        entry = _normal(mutation.get("entry_no"))
        if not re.fullmatch(r"[0-9]+", entry):
            raise ValueError(f"Attachment {index} entry number is ambiguous; Gujarati letters cannot be treated as digits.")
        if entry not in recognized:
            raise ValueError(f"Attachment {index} entry number is not an exact mutation reference in the primary VF7.")
        if entry in seen:
            raise ValueError(f"Attachment {index} duplicates an entry number already supplied; upload each VF6 entry only once.")
        if not isinstance(mutation.get("narrative"), str) or not mutation["narrative"].strip() or not isinstance(mutation.get("entry_date"), str):
            raise ValueError(f"Attachment {index} lacks supported narrative or entry date source fields.")
        seen.add(entry)
        supporting.append(deepcopy({"mutation_record": mutation, "source_record": secondary, "metadata": metadata}))
        chain.append({"entry_no": mutation["entry_no"], "date": mutation["entry_date"],
                      "mutation_type": "unknown", "from_party": "", "to_party": "",
                      "description": mutation["narrative"], "flags": [_REVIEW_FLAG]})
        effective, as_of = _source_date(mutation.get("effective_date")), _source_date(secondary.get("source_as_of"))
        if effective and as_of and effective > as_of:
            warnings.append(f"Attachment {index} effective date is after its source as-of date; review the original dates.")
    result = deepcopy(analysis)
    report = result["report"]
    unresolved = [entry for entry in recognized if entry not in seen]
    report["supporting_records"] = supporting
    report["chain_of_title"] = chain
    report["mutation_references"] = {"recognized": recognized, "unresolved": unresolved,
                                      "unrecognized": unrecognized, "raw": deepcopy(source["mutation_refs"])}
    report.setdefault("coverage", {}).update(
        chain_requested=True, chain_complete=False, source="user_supplied_record_bundle",
        mutation_records_uploaded=len(supporting), mutation_entries_identified=len(recognized),
        mutation_records_retrieved=0, mutation_records_failed=0, mutation_records_not_attempted=len(unresolved),
        unresolved_mutation_references=unresolved, mutation_references_requiring_review=unrecognized,
        official_source_verified=False)
    for check in report.get("risk", {}).get("checks", []):
        if check.get("name") in {"chain_continuity", "ownership_churn", "litigation_mentions"}:
            check.update(status="unavailable", detail="Uploaded native VF6 records are unverified source evidence; parties, legal effect, full history and court records require review.")
    if report.get("risk", {}).get("verdict") == "CLEAR":
        report["risk"]["verdict"] = "CAUTION"
    if unresolved or unrecognized:
        warnings.append("Primary VF7 mutation references remain unresolved or ambiguous; review the preserved references and supply the missing original records.")
    warnings.append("Uploaded VF6 records do not establish a complete chain of title; parties and legal effect require review.")
    result.setdefault("metadata", {}).update(external_ai=False, external_processing=False)
    result["metadata"]["warnings"] = list(result["metadata"].get("warnings", [])) + warnings
    return result
