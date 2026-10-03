"""Evidence-linked preliminary analysis, without external AI or title claims."""
from fastapi import HTTPException
from title_report import basic_risk_level, compose_title_report


def build_local_analysis(parsed):
    fields = {name: parsed.get(name) or "Unknown" for name in
              ("owner_name", "survey_no", "total_area", "tenure_type", "encumbrances")}
    if all(value == "Unknown" for value in fields.values()):
        raise HTTPException(status_code=422, detail="No labelled land-record fields could be read reliably. Try a clearer extract; complex layouts need manual review.")
    level, reason = basic_risk_level(fields["tenure_type"], fields["encumbrances"])
    if level != "RED":
        level, reason = "YELLOW", "Preliminary source reading; supporting title evidence and lawyer review are required."
    record = {**fields, "area": fields["total_area"], "source": "user_supplied_record",
              "record_type": "UPLOADED_RECORD", "mutation_entries": "Unknown"}
    report = compose_title_report(record, [])
    report["coverage"] = {
        "assessment_version": 2, "chain_requested": False, "chain_complete": False,
        "mutation_entries_identified": 0, "mutation_records_retrieved": 0,
        "mutation_records_failed": 0, "mutation_records_not_attempted": 0,
        "source": "user_supplied_record", "official_source_verified": False,
    }
    report["risk"]["checks"].append({"name": "supporting_title_evidence", "status": "unavailable",
        "detail": "Only the supplied extract was read. Deeds, registration, full mutation history, encumbrance evidence and litigation have not been verified."})
    if report["risk"]["verdict"] == "CLEAR":
        report["risk"]["verdict"] = "CAUTION"
    report["source_evidence"] = parsed.get("evidence", [])
    return {**fields, "risk_level": level, "risk_reason": reason, "report": report,
            "evidence": parsed.get("evidence", []), "metadata": parsed.get("metadata", {}),
            "raw_text": parsed.get("raw_text", "")}
