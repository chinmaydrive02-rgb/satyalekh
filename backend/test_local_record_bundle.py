"""Synthetic record linkage fixtures; never store personal source pages."""
from copy import deepcopy
import hashlib
import json

import pytest

from anyror_vf6_reader import read_anyror_vf6_html
from anyror_vf7_reader import read_anyror_vf7_html
from local_record_bundle import attach_mutation_records
from review_record import build_reviewed_analysis, parse_review
from test_anyror_vf6_reader import fixture as vf6_fixture
from test_anyror_vf7_reader import fixture as vf7_fixture


def primary(data=None):
    parsed = read_anyror_vf7_html(data or vf7_fixture())
    review = parse_review(json.dumps({"confirmed": True, "fields": {
        key: {"value": parsed[key], "page": 1, "source_excerpt": parsed[key]}
        for key in ("owner_name", "survey_no", "total_area")}}))
    return build_reviewed_analysis(parsed, review)


def mutation(**overrides):
    values = {"lblEntryNo": "23", "lblSNoS": "3(255), 30(255)",
              "lblDistrict": "નમૂના જિલ્લો", "lblTaluka": "નમૂના તાલુકો", "lblVillage": "નમૂના ગામ"}
    values.update(overrides)
    return read_anyror_vf6_html(vf6_fixture(values))


def test_matched_bundle_preserves_source_evidence_and_hashes_without_mutating_input():
    analysis, detail = primary(), mutation()
    before, detail_before = deepcopy(analysis), deepcopy(detail)
    result = attach_mutation_records(analysis, [detail])
    report = result["report"]
    assert analysis == before and detail == detail_before
    assert report["source_document"]["sha256"] == hashlib.sha256(vf7_fixture()).hexdigest()
    assert report["supporting_records"] == [{key: detail[key] for key in ("mutation_record", "source_record", "metadata")}]
    for key in ("record", "source_evidence", "source_record", "source_document", "generated_at"):
        assert report[key] == before["report"][key]
    assert result["evidence"] == before["evidence"]
    assert report["chain_of_title"] == [{"entry_no": "23", "date": "01/02/2024", "mutation_type": "unknown",
        "from_party": "", "to_party": "", "description": detail["mutation_record"]["narrative"],
        "flags": ["Source record; parties and legal effect require review"]}]
    assert result["metadata"]["external_ai"] is False
    assert result["metadata"]["external_processing"] is False


@pytest.mark.parametrize("field", ["lblDistrict", "lblTaluka", "lblVillage"])
def test_location_mismatch_refused(field):
    with pytest.raises(ValueError, match="does not exactly match"):
        attach_mutation_records(primary(), [mutation(**{field: "બીજું સ્થળ"})])


def test_nfc_and_whitespace_normalization_and_true_gujarati_digits():
    analysis = primary()
    analysis["report"]["source_record"]["locations"]["village"] = "Cafe\u0301  નમૂના"
    result = attach_mutation_records(analysis, [mutation(lblVillage="Café નમૂના", lblEntryNo="૨૩", lblSNoS="૩(૨૫૫), ૩૦(૨૫૫)")])
    assert result["report"]["chain_of_title"][0]["entry_no"] == "૨૩"


@pytest.mark.parametrize("surveys", ["30(255)", "13(255)", "30(3)", "૩પ(૨૫૫)", "3(255),garbled"])
def test_exact_survey_tokens_not_substrings_or_accounts(surveys):
    with pytest.raises(ValueError, match="survey"):
        attach_mutation_records(primary(), [mutation(lblSNoS=surveys)])


def test_reviewed_survey_cannot_diverge_from_native_source():
    analysis = primary()
    analysis["report"]["record"]["survey_no"] = "30"
    with pytest.raises(ValueError, match="reviewed survey number differs"):
        attach_mutation_records(analysis, [mutation()])


@pytest.mark.parametrize("entry", ["2", "123", "15", "૧પ"])
def test_entry_requires_exact_numeric_source_reference(entry):
    with pytest.raises(ValueError, match="entry number"):
        attach_mutation_records(primary(), [mutation(lblEntryNo=entry)])


def test_numeric_parenthesized_owner_reference_supported_without_party_inference():
    data = vf7_fixture().replace("(૧પ)".encode(), "(૪૦૬૮)".encode())
    result = attach_mutation_records(primary(data), [mutation(lblEntryNo="4068")])
    assert "4068" in result["report"]["mutation_references"]["recognized"]
    assert result["report"]["chain_of_title"][0]["from_party"] == ""


def test_yearlike_references_and_full_reference_count_are_retained():
    numbers = ",".join(str(n) for n in range(2000, 2080))
    data = vf7_fixture().replace("૨૩,".encode(), ("૨૩," + numbers + ",").encode())
    result = attach_mutation_records(primary(data), [mutation(lblEntryNo="2020", lblEdt="")])
    assert result["report"]["coverage"]["mutation_entries_identified"] == 82
    assert result["report"]["chain_of_title"][0]["date"] == ""
    assert "2021" in result["report"]["coverage"]["unresolved_mutation_references"]


def test_duplicate_entries_refused_even_with_different_digit_alphabet():
    with pytest.raises(ValueError, match="duplicates"):
        attach_mutation_records(primary(), [mutation(), mutation(lblEntryNo="૨૩")])


def test_bundle_always_incomplete_and_unavailable_checks_preserve_overall_risk():
    analysis = primary()
    analysis["report"]["risk"]["verdict"] = "HIGH_RISK"
    result = attach_mutation_records(analysis, [mutation(), mutation(lblEntryNo="40")])
    coverage = result["report"]["coverage"]
    assert coverage["chain_requested"] is True and coverage["chain_complete"] is False
    assert coverage["mutation_records_uploaded"] == 2
    assert coverage["mutation_entries_identified"] == 2
    assert coverage["source"] == "user_supplied_record_bundle"
    assert coverage["mutation_references_requiring_review"] == ["1પ"]
    assert result["report"]["source_record"]["mutation_refs"] == analysis["report"]["source_record"]["mutation_refs"]
    checks = {c["name"]: c for c in result["report"]["risk"]["checks"]}
    for name in ("chain_continuity", "ownership_churn", "litigation_mentions"):
        assert checks[name]["status"] == "unavailable"
    assert result["report"]["risk"]["verdict"] == "HIGH_RISK"


def test_future_effective_date_is_flagged_without_rewriting_source():
    detail = mutation(lblEffDt="06/02/2024", lblEdt="2020")
    result = attach_mutation_records(primary(), [detail])
    assert any("effective date is after" in warning for warning in result["metadata"]["warnings"])
    assert result["report"]["chain_of_title"][0]["date"] == "2020"
    assert result["report"]["supporting_records"][0]["mutation_record"]["effective_date"] == "06/02/2024"


def test_missing_primary_source_and_unsupported_attachment_refused():
    analysis = primary()
    del analysis["report"]["source_record"]
    with pytest.raises(ValueError, match="original saved VF7"):
        attach_mutation_records(analysis, [mutation()])
    with pytest.raises(ValueError, match="supported locally parsed VF6"):
        attach_mutation_records(primary(), [{}])
    with pytest.raises(ValueError, match="at least one"):
        attach_mutation_records(primary(), [])


def test_missing_hash_or_changed_raw_fields_refused():
    detail = mutation()
    detail["metadata"].pop("source_sha256")
    with pytest.raises(ValueError, match="fingerprint"):
        attach_mutation_records(primary(), [detail])
    detail = mutation()
    detail["mutation_record"]["entry_no"] = "40"
    with pytest.raises(ValueError, match="inconsistent"):
        attach_mutation_records(primary(), [detail])


@pytest.mark.parametrize("field", ["locations", "identifiers"])
def test_malformed_source_identity_gives_actionable_validation_error(field):
    detail = mutation()
    detail["source_record"][field] = None
    with pytest.raises(ValueError, match="location or entry identity"):
        attach_mutation_records(primary(), [detail])
