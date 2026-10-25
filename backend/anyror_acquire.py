"""Exact VF7 selection and source identity checks for an interactive local session."""
import re
from copy import deepcopy

from anyror_http import AnyRORFormError, RECORD_CONTROL
from anyror_vf7_reader import read_anyror_vf7_html


def _location(value):
    return " ".join(str(value).strip().casefold().split())


async def prepare_vf7(session, district, taluka, village, survey):
    from anyror_matching import _find_best_option, _find_exact_survey_option
    await session.open()
    await session.select(RECORD_CONTROL, "1")
    expected = {}
    for field, target in (("District", district), ("Taluka", taluka), ("Village", village), ("SurveyNo", survey)):
        control = "ContentPlaceHolder1_ddl" + field
        options = [(o["value"], o["label"]) for o in session.options(control)
                   if not o["disabled"] and o["value"] not in ("", "0")]
        selected = (_find_exact_survey_option(options, target) if field == "SurveyNo"
                    else _find_best_option(options, target))
        if selected is None:
            raise AnyRORFormError("Exact requested " + field + " missing or ambiguous")
        labels = [label for value, label in options if value == selected]
        if len(labels) != 1:
            raise AnyRORFormError("Ambiguous official option value")
        expected[field] = labels[0]
        await session.select(control, selected)
    return expected


def verify_vf7_source(source, expected):
    """A structurally valid record for a different parcel is still a failure."""
    from anyror_matching import _normalize_survey
    parsed = read_anyror_vf7_html(source)
    actual = parsed["source_record"]["locations"]
    for field in ("District", "Taluka", "Village"):
        label = expected[field]
        allowed = {_location(label)}
        if field == "Village":
            # The form appends a three-digit village code; VF7 omits that code.
            allowed.add(_location(re.sub(r"\s+-\s+[0-9૦-૯]{3}$", "", label)))
        if _location(actual[field.lower()]) not in allowed:
            raise AnyRORFormError("Returned record location differs from the requested parcel", stage="identity")
    if _normalize_survey(parsed["survey_no"]) != _normalize_survey(expected["SurveyNo"]):
        raise AnyRORFormError("Returned survey differs from the requested parcel", stage="identity")
    return parsed


def build_acquired_draft(parsed, acquisition):
    """Compose a source-backed draft without asserting user/legal review."""
    from local_report import build_local_analysis
    from local_record_bundle import _references
    draft = build_local_analysis(deepcopy(parsed))
    draft["status"] = "unreviewed_preliminary"
    draft["acquisition"] = dict(acquisition)
    draft["metadata"].update(user_review_confirmed=False, manual_review_required=True,
                             review_required=True, external_processing=False)
    report = draft["report"]
    report["record"].update(source="anyror_http_user_challenge", record_type="VF7")
    references, ambiguous = _references(parsed["source_record"])
    report["mutation_references"] = {"recognized": references, "unresolved": references[:],
                                      "unrecognized": ambiguous,
                                      "raw": deepcopy(parsed["source_record"]["mutation_refs"])}
    report["coverage"].update(source="anyror_http_user_challenge", user_review_confirmed=False,
                              chain_complete=False, mutation_entries_identified=len(references),
                              mutation_records_not_attempted=len(references),
                              unresolved_mutation_references=references[:],
                              mutation_references_requiring_review=ambiguous)
    report["source_document"].update(acquisition)
    return draft
