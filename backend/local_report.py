"""Evidence-linked preliminary analysis, without external AI or title claims."""
from fastapi import HTTPException
import re
from title_report import basic_risk_level, compose_title_report


def build_local_analysis(parsed):
    fields = {name: parsed.get(name) or "Unknown" for name in
              ("owner_name", "survey_no", "total_area", "tenure_type", "encumbrances")}
    if all(value == "Unknown" for value in fields.values()):
        raise HTTPException(status_code=422, detail="No labelled land-record fields could be read reliably. Try a clearer extract; complex layouts need manual review.")
    # The legacy risk rules expect English. Native Gujarati must never be
    # interpreted as unrestricted tenure or as a confirmed encumbrance merely
    # because it is nonempty. Preserve it as evidence, require language review.
    assessment = dict(fields)
    untranslated = []
    for name in ("tenure_type", "encumbrances"):
        if re.search(r"[\u0a80-\u0aff]", fields[name]):
            assessment[name] = "Unknown"
            untranslated.append(name)
    level, reason = basic_risk_level(assessment["tenure_type"], assessment["encumbrances"])
    if level != "RED":
        level, reason = "YELLOW", "Preliminary source reading; supporting title evidence and lawyer review are required."
    record = {**fields, "area": fields["total_area"], "source": "user_supplied_record",
              "record_type": "UPLOADED_RECORD", "mutation_entries": "Unknown"}
    report = compose_title_report({**record, "tenure_type": assessment["tenure_type"],
                                   "encumbrances": assessment["encumbrances"]}, [])
    report["record"] = record
    for check in report["risk"]["checks"]:
        if check["name"] == "litigation_mentions" and check["status"] == "pass":
            check.update(status="unavailable", detail="A labelled-field extract cannot establish absence of litigation; the source and court records require review.")
    if untranslated:
        report["risk"]["checks"].append({"name": "source_language_review", "status": "unavailable",
            "detail": "Gujarati tenure or encumbrance text is preserved but has not been translated or legally assessed."})
    report["coverage"] = {
        "assessment_version": 2, "chain_requested": False, "chain_complete": False,
        "mutation_entries_identified": 0, "mutation_records_retrieved": 0,
        "mutation_records_failed": 0, "mutation_records_not_attempted": 0,
        "source": "user_supplied_record", "official_source_verified": False,
    }
    report["risk"]["checks"].append({"name": "supporting_title_evidence", "status": "unavailable",
        "detail": "Only the supplied extract was read. Deeds, registration, full mutation history, encumbrance evidence and litigation have not been verified."})
    if level == "RED":
        # A disclosed burden needs resolution even when unavailable supporting
        # checks contribute no points to the aggregate heuristic score.
        report["risk"]["verdict"] = "HIGH_RISK"
    elif report["risk"]["verdict"] == "CLEAR":
        report["risk"]["verdict"] = "CAUTION"
    report["source_evidence"] = parsed.get("evidence", [])
    return {**fields, "risk_level": level, "risk_reason": reason, "report": report,
            "evidence": parsed.get("evidence", []), "metadata": parsed.get("metadata", {}),
            "raw_text": parsed.get("raw_text", "")}
