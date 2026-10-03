import pytest
from fastapi import HTTPException
from local_report import build_local_analysis


def test_readable_source_is_not_full_title_clearance():
    result = build_local_analysis({"owner_name": "Test", "survey_no": "TEST-1",
        "total_area": "123 sqm", "tenure_type": "Old tenure", "encumbrances": "None"})
    assert result["risk_level"] == "YELLOW"
    assert result["report"]["risk"]["verdict"] != "CLEAR"
    assert result["report"]["coverage"]["official_source_verified"] is False
    assert result["report"]["coverage"]["chain_complete"] is False


def test_mortgage_keeps_red_flag_and_source_evidence():
    evidence = [{"field": "encumbrances", "page": 1, "snippet": "Mortgage: Test Bank"}]
    result = build_local_analysis({"encumbrances": "Mortgage to Test Bank", "evidence": evidence})
    assert result["risk_level"] == "RED"
    assert result["report"]["source_evidence"] == evidence
    assert result["owner_name"] == "Unknown"


def test_unreadable_fields_do_not_generate_a_report():
    with pytest.raises(HTTPException) as exc:
        build_local_analysis({})
    assert exc.value.status_code == 422


def test_default_upload_never_calls_external_provider(monkeypatch):
    from fastapi.testclient import TestClient
    import main
    import local_document_reader
    monkeypatch.delenv('DOCUMENT_READER', raising=False)
    monkeypatch.setattr(local_document_reader, 'read_document', lambda *_: {
        'owner_name': 'Test', 'encumbrances': 'Mortgage to Test Bank',
        'metadata': {'reader': 'local', 'external_processing': False},
        'evidence': [{'field': 'owner_name', 'page': 1, 'snippet': 'Owner Name: Test'}]})
    def forbidden(*args, **kwargs):
        raise AssertionError('External provider must not be called')
    monkeypatch.setattr(main.genai, 'Client', forbidden)
    response = TestClient(main.app).post('/analyze-record', files={
        'file': ('test.pdf', b'%PDF synthetic', 'application/pdf')})
    assert response.status_code == 200
    assert response.json()['metadata']['external_processing'] is False
    assert response.json()['report']['coverage']['chain_complete'] is False
    assert response.json()['evidence'][0]['page'] == 1


def test_external_reader_fails_closed_without_approval(monkeypatch):
    from fastapi.testclient import TestClient
    import main
    monkeypatch.setenv('DOCUMENT_READER', 'gemini')
    monkeypatch.delenv('GEMINI_PERSONAL_DATA_APPROVED', raising=False)
    response = TestClient(main.app).post('/analyze-record', files={
        'file': ('test.pdf', b'%PDF synthetic', 'application/pdf')})
    assert response.status_code == 503


def test_personal_data_provider_gate_stops_external_analysis(monkeypatch):
    import main
    from fastapi.testclient import TestClient
    monkeypatch.delenv('GEMINI_PERSONAL_DATA_APPROVED', raising=False)
    with pytest.raises(HTTPException) as exc:
        main._require_personal_data_provider()
    assert exc.value.status_code == 503
    response = TestClient(main.app).post('/litigation-search', json={
        'name': 'Synthetic Party', 'district': 'Ahmedabad', 'year': '2026'})
    assert response.status_code == 503
