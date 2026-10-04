"""Saved-page uploads must never enter the external provider path."""
import hashlib
import json

from fastapi.testclient import TestClient
import pytest
import main
from test_anyror_vf7_reader import fixture
from review_record import parse_review


def test_saved_html_requires_review_even_with_external_reader_configured(monkeypatch):
    monkeypatch.setenv("DOCUMENT_READER", "gemini")
    monkeypatch.delenv("GEMINI_PERSONAL_DATA_APPROVED", raising=False)
    monkeypatch.setattr(main, "_enforce_rate_limit", lambda *a, **k: None)
    def forbidden(*a, **k):
        raise AssertionError("Saved HTML must never invoke an external provider")
    monkeypatch.setattr(main.genai, "Client", forbidden)
    data = fixture()
    response = TestClient(main.app).post("/analyze-record", files={"file": ("record.html", data, "text/html")})
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "review_required"
    assert "report" not in result
    assert len(result["source_record"]["owners"]) == 6
    assert len(result["source_record"]["rights"]) == 3
    assert result["owner_name"] == "\n".join(result["source_record"]["owners"])
    assert result["metadata"]["source_sha256"] == hashlib.sha256(data).hexdigest()
    assert result["metadata"]["external_processing"] is False


def test_review_retains_original_rows_date_and_hash(monkeypatch):
    monkeypatch.setattr(main, "_enforce_rate_limit", lambda *a, **k: None)
    data = fixture(owners=15, rights=6)
    from anyror_vf7_reader import read_anyror_vf7_html
    parsed = read_anyror_vf7_html(data)
    fields = {name: {"value": parsed[name], "source_excerpt": parsed[name], "page": 1}
              for name in ("owner_name", "survey_no", "total_area", "tenure_type", "encumbrances")}
    assert len(fields["owner_name"]["value"]) > 250
    response = TestClient(main.app).post("/review-record", files={"file": ("record.html", data, "text/html")},
        data={"review": json.dumps({"confirmed": True, "fields": fields})})
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "reviewed_preliminary"
    assert result["report"]["source_record"] == parsed["source_record"]
    for name, value in parsed["source_record"]["locations"].items():
        assert result["report"]["record"][name] == value
    assert result["report"]["source_document"]["sha256"] == hashlib.sha256(data).hexdigest()
    assert result["report"]["coverage"]["chain_complete"] is False
    assert result["risk_level"] == "YELLOW"


def test_incomplete_html_does_not_become_a_record(monkeypatch):
    monkeypatch.setattr(main, "_enforce_rate_limit", lambda *a, **k: None)
    response = TestClient(main.app).post("/analyze-record", files={"file": ("record.html", b"<html><form>VF-7</form></html>", "text/html")})
    assert response.status_code == 422


def test_expanded_table_review_limits_do_not_expand_scalar_limits():
    fields = {name: {"value": value, "source_excerpt": value, "page": 1} for name, value in
              [("owner_name", "Holder " * 100), ("survey_no", "3"), ("total_area", "100 sqm")]}
    assert parse_review(json.dumps({"confirmed": True, "fields": fields})).fields["owner_name"].value == fields["owner_name"]["value"]
    fields["survey_no"]["value"] = "3" * 251
    with pytest.raises(main.HTTPException):
        parse_review(json.dumps({"confirmed": True, "fields": fields}))
