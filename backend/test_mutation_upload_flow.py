"""HTTP acceptance checks using synthetic saved VF7/VF6 pages only."""
import hashlib
import json

import pytest
from fastapi.testclient import TestClient

from anyror_vf7_reader import read_anyror_vf7_html
from review_record import build_reviewed_analysis, parse_review
from test_anyror_vf6_reader import fixture as vf6_fixture
from test_anyror_vf7_reader import fixture as vf7_fixture


def matched_mutation(overrides=None):
    values = {
        "lblEntryNo": "૨૩",
        "lblDistrict": "નમૂના જિલ્લો",
        "lblTaluka": "નમૂના તાલુકો",
        "lblVillage": "નમૂના ગામ",
    }
    values.update(overrides or {})
    return vf6_fixture(values)


def review_payload():
    values = {
        "owner_name": "નમૂના ખાતેદાર 1(૧પ)",
        "survey_no": "૩",
        "total_area": "૦-૧૦-૦૦ H.Are.SqMt.",
    }
    return json.dumps({"confirmed": True, "fields": {
        key: {"value": value, "source_excerpt": value, "page": 1}
        for key, value in values.items()
    }})


@pytest.fixture
def client(monkeypatch):
    import main

    monkeypatch.setattr(main, "RATE_LIMITS_DISABLED", True)
    # The endpoint must stay local even when deployment defaults select Gemini.
    monkeypatch.setenv("DOCUMENT_READER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "synthetic-test-key")

    def external_call(*args, **kwargs):
        pytest.fail("Reviewing saved source files must not call an external provider")

    monkeypatch.setattr(main.genai, "Client", external_call)
    monkeypatch.setattr(main, "_get_supabase", external_call)
    with TestClient(main.app) as test_client:
        yield test_client


def upload(client, mutations=(), original=None):
    files = [("file", ("synthetic-vf7.html", original or vf7_fixture(), "text/html"))]
    files.extend(("mutation_files", (f"synthetic-mutation-{index}.html", data, "text/html"))
                 for index, data in enumerate(mutations))
    return client.post("/review-record", files=files, data={"review": review_payload()})


def test_without_mutation_attachments_preserves_existing_review_response(client):
    original = vf7_fixture()
    expected = build_reviewed_analysis(read_anyror_vf7_html(original), parse_review(review_payload()))
    response = upload(client, original=original)
    assert response.status_code == 200, response.text
    result = response.json()
    # Each report gets its own timestamp; every other original-only field stays identical.
    assert result["report"].pop("generated_at")
    expected["report"].pop("generated_at")
    assert result == expected
    assert result["report"]["coverage"]["chain_complete"] is False


@pytest.mark.parametrize("overrides", [
    {"lblEntryNo": "૯૯૯"},
    {"lblDistrict": "બીજો નમૂના જિલ્લો"},
    {"lblTaluka": "બીજો નમૂના તાલુકો"},
    {"lblVillage": "બીજું નમૂના ગામ"},
    {"lblSNoS": "૩૩ (નમૂના ખાતું)"},
])
def test_unrelated_mutation_is_rejected_without_partial_report(client, overrides):
    response = upload(client, [matched_mutation(overrides)])
    assert response.status_code == 422, response.text
    assert "detail" in response.json()
    assert "report" not in response.json()


def test_wrong_record_type_cannot_be_used_as_mutation_attachment(client):
    response = upload(client, [vf7_fixture()])
    assert response.status_code == 422, response.text
    assert "report" not in response.json()


@pytest.mark.parametrize("contents", [b"%PDF-1.5 synthetic", b"plain text", b"\x89PNG\r\n\x1a\n"])
def test_non_html_mutation_content_is_rejected_despite_html_filename(client, contents):
    response = upload(client, [contents])
    assert response.status_code == 400, response.text
    assert "report" not in response.json()


def test_six_mutation_files_are_rejected(client):
    response = upload(client, [matched_mutation()] * 6)
    assert response.status_code == 413, response.text
    assert "five" in response.json()["detail"]


def test_mutation_html_over_one_megabyte_is_rejected(client):
    data = matched_mutation()
    data += b" " * (1024 * 1024 + 1 - len(data))
    response = upload(client, [data])
    assert response.status_code == 413, response.text
    assert "1 MB" in response.json()["detail"]


def test_bad_second_attachment_rejects_whole_bundle(client):
    response = upload(client, [matched_mutation(), matched_mutation({"lblEntryNo": "૯૯૯"})])
    assert response.status_code == 422, response.text
    assert "report" not in response.json()


@pytest.mark.parametrize("count", [1, 2])
def test_matched_saved_mutations_preserve_hashes_and_unknown_parties_locally(client, count):
    original = vf7_fixture()
    mutations = [matched_mutation(), matched_mutation({"lblEntryNo": "૪૦"})][:count]
    response = upload(client, mutations, original=original)
    assert response.status_code == 200, response.text
    result = response.json()
    report = result["report"]
    assert result["status"] == "reviewed_preliminary"
    assert result["metadata"]["external_processing"] is False
    assert result["metadata"]["source_sha256"] == hashlib.sha256(original).hexdigest()
    assert report["source_document"]["sha256"] == hashlib.sha256(original).hexdigest()
    assert report["source_record"] == read_anyror_vf7_html(original)["source_record"]
    assert report["coverage"]["chain_complete"] is False
    assert report["coverage"]["official_source_verified"] is False
    assert report["coverage"]["mutation_records_uploaded"] == count
    assert report["coverage"]["mutation_records_retrieved"] == 0
    assert report["risk"]["verdict"] != "CLEAR"
    assert len(report["supporting_records"]) == count
    assert len(report["chain_of_title"]) == count
    for data, supporting, entry in zip(mutations, report["supporting_records"], report["chain_of_title"]):
        assert supporting["metadata"]["source_sha256"] == hashlib.sha256(data).hexdigest()
        assert supporting["metadata"]["source_bytes"] == len(data)
        assert supporting["metadata"]["external_processing"] is False
        assert supporting["metadata"]["translation_performed"] is False
        assert supporting["source_record"]["raw_fields"] == supporting["mutation_record"]
        assert entry["date"] == supporting["mutation_record"]["entry_date"]
        assert entry["description"] == supporting["mutation_record"]["narrative"]
        assert entry["mutation_type"] == "unknown"
        assert entry["from_party"] == entry["to_party"] == ""
        assert entry["flags"]
