import copy
import json

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from review_record import parse_review, build_reviewed_analysis, pending_source_review


def payload():
    return {'confirmed': True, 'fields': {
        'owner_name': {'value': 'Synthetic Owner', 'source_excerpt': 'Synthetic Owner', 'page': 1},
        'survey_no': {'value': 'TEST-999', 'source_excerpt': 'TEST-999', 'page': 1},
        'total_area': {'value': '123 sqm', 'source_excerpt': '123 sqm', 'page': 1},
    }}


def machine():
    return {'owner_name': 'Original OCR Owner', 'raw_text': '[Page 1]\nUnreadable layout',
            'metadata': {'pages_processed': 1, 'reader': 'local', 'external_processing': False},
            'evidence': [{'field': 'owner_name', 'value': 'Original OCR Owner', 'method': 'local_tesseract_ocr'}]}


def test_review_keeps_machine_fields_and_distinct_user_provenance_without_clearance():
    parsed = machine()
    before = copy.deepcopy(parsed)
    result = build_reviewed_analysis(parsed, parse_review(json.dumps(payload())))
    assert parsed == before
    assert result['owner_name'] == 'Synthetic Owner'
    assert result['tenure_type'] == 'Unknown'
    assert result['metadata']['machine_fields']['owner_name'] == 'Original OCR Owner'
    assert result['metadata']['source_excerpt_verified'] is False
    assert result['metadata']['reviewer_identity_verified'] is False
    assert result['evidence'][0]['method'] == 'local_tesseract_ocr'
    assert result['evidence'][1]['method'] == 'user_review'
    assert result['report']['risk']['verdict'] != 'CLEAR'
    assert result['risk_level'] == 'YELLOW'
    assert result['status'] == 'reviewed_preliminary'


@pytest.mark.parametrize('change', ['false', 'numeric_true', 'string_true', 'extra', 'missing_owner', 'unknown_field', 'no_units', 'long_value', 'long_excerpt', 'empty_excerpt', 'page_zero', 'page_four', 'page_string'])
def test_strict_review_rejects_unsupported_or_unconfirmed_input(change):
    value = payload()
    if change == 'false': value['confirmed'] = False
    elif change == 'numeric_true': value['confirmed'] = 1
    elif change == 'string_true': value['confirmed'] = 'true'
    elif change == 'extra': value['identity'] = 'lawyer'
    elif change == 'missing_owner': del value['fields']['owner_name']
    elif change == 'unknown_field': value['fields']['district'] = value['fields']['survey_no']
    elif change == 'no_units': value['fields']['total_area']['value'] = '123'
    elif change == 'long_value': value['fields']['owner_name']['value'] = 'x' * 251
    elif change == 'long_excerpt': value['fields']['owner_name']['source_excerpt'] = 'x' * 501
    elif change == 'empty_excerpt': value['fields']['owner_name']['source_excerpt'] = ' '
    elif change == 'page_zero': value['fields']['owner_name']['page'] = 0
    elif change == 'page_four': value['fields']['owner_name']['page'] = 4
    elif change == 'page_string': value['fields']['owner_name']['page'] = '1'
    with pytest.raises(HTTPException) as exc:
        parse_review(json.dumps(value))
    assert exc.value.status_code == 422


def test_duplicate_json_and_oversized_review_rejected():
    with pytest.raises(HTTPException) as exc:
        parse_review('{"confirmed":false,"confirmed":true,"fields":{}}')
    assert exc.value.status_code == 422
    with pytest.raises(HTTPException) as exc:
        parse_review('x' * 12001)
    assert exc.value.status_code == 413


def test_deeply_nested_review_is_rejected_without_server_error():
    with pytest.raises(HTTPException) as exc:
        parse_review('[' * 1500 + '0' + ']' * 1500)
    assert exc.value.status_code == 422


def test_page_must_exist_in_reread_source():
    value = payload()
    value['fields']['owner_name']['page'] = 2
    with pytest.raises(HTTPException) as exc:
        build_reviewed_analysis(machine(), parse_review(json.dumps(value)))
    assert exc.value.status_code == 422


def test_pending_ocr_preserves_text_without_report_or_invented_fields():
    result = pending_source_review({'raw_text': '[Page 1]\nReal OCR words', 'metadata': {'reader': 'local'}})
    assert result['status'] == 'review_required'
    assert result['survey_no'] == 'Unknown'
    assert 'report' not in result
    with pytest.raises(HTTPException):
        pending_source_review({'raw_text': '[Page 1]\n\n'})


def test_review_endpoint_rereads_original_locally_even_if_gemini_selected(monkeypatch):
    import main
    calls = []
    async def local(contents, mime):
        calls.append((contents, mime))
        return machine()
    monkeypatch.setattr(main, '_read_uploaded_locally', local)
    monkeypatch.setenv('DOCUMENT_READER', 'gemini')
    monkeypatch.setattr(main.genai, 'Client', lambda: pytest.fail('No external processing permitted'))
    client = TestClient(main.app)
    response = client.post('/review-record', files={'file': ('original.pdf', b'%PDF synthetic original', 'application/pdf')}, data={'review':json.dumps(payload())})
    assert response.status_code == 200
    assert calls == [(b'%PDF synthetic original', 'application/pdf')]
    assert response.json()['metadata']['external_processing'] is False
    assert response.json()['status'] == 'reviewed_preliminary'
    assert client.post('/review-record', files={'file': ('bad.pdf', b'fake', 'application/pdf')}, data={'review':json.dumps(payload())}).status_code == 400


def test_analysis_endpoint_retains_unlabelled_ocr(monkeypatch):
    import main
    async def local(*_): return {'raw_text': '[Page 1]\nReal OCR words', 'metadata': {'pages_processed': 1}}
    monkeypatch.setattr(main, '_read_uploaded_locally', local)
    monkeypatch.setenv('DOCUMENT_READER', 'local')
    response = TestClient(main.app).post('/analyze-record', files={'file': ('original.pdf', b'%PDF synthetic', 'application/pdf')})
    assert response.status_code == 200
    assert response.json()['status'] == 'review_required'
    assert 'report' not in response.json()
    assert response.json()['raw_text'] == '[Page 1]\nReal OCR words'
