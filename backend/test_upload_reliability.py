"""Offline checks for real upload parsing (no demo token or paid AI calls)."""
import asyncio
import json
from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient

import main


VALID = {
    'owner_name': 'Example Owner', 'survey_no': '12/A', 'total_area': '1.20 ha',
    'tenure_type': 'Old tenure', 'encumbrances': 'None',
}
UPLOAD = {'file': ('record.png', b'\x89PNG\r\n\x1a\nmock-image', 'image/png')}


def install_reader(monkeypatch, text=None, operation=None):
    state = {'closed': [], 'prompts': []}

    async def generate_content(**kwargs):
        state['prompts'].append(kwargs['contents'][0])
        if operation:
            return await operation()
        return SimpleNamespace(text=text)

    class AsyncClient:
        models = SimpleNamespace(generate_content=generate_content)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            state['closed'].append('async')

    class Client:
        aio = AsyncClient()

        def __enter__(self):
            return self

        def __exit__(self, *args):
            state['closed'].append('sync')

    monkeypatch.setattr(main.genai, 'Client', Client)
    return state


def test_real_upload_keeps_names_and_does_not_claim_title_clearance(monkeypatch):
    record = {**VALID, 'encumbrances': 'Mortgage to HDFC Bank'}
    state = install_reader(monkeypatch, ' \n```json\n' + json.dumps(record) + '\n```\n')
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == 200
    assert response.json()['encumbrances'] == 'Mortgage to HDFC Bank'
    assert response.json()['risk_level'] == 'RED'
    assert state['closed'] == ['async', 'sync']
    assert 'blank encumbrance section means unknown' in state['prompts'][0]


@pytest.mark.parametrize('missing', [None, '', '   ', {}, [], False])
def test_missing_encumbrance_is_unknown_and_never_clear(monkeypatch, missing):
    install_reader(monkeypatch, json.dumps({**VALID, 'encumbrances': missing}))
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == 200
    assert response.json()['encumbrances'] == 'Unknown'
    assert response.json()['risk_level'] == 'YELLOW'


def test_partial_extraction_preserves_readable_evidence(monkeypatch):
    install_reader(monkeypatch, json.dumps({**VALID, 'owner_name': None, 'total_area': []}))
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == 200
    assert response.json()['owner_name'] == 'Unknown'
    assert response.json()['total_area'] == 'Unknown'
    assert response.json()['survey_no'] == '12/A'
    assert response.json()['risk_level'] == 'YELLOW'


def test_explicit_absence_of_encumbrances_retained_with_limited_conclusion(monkeypatch):
    install_reader(monkeypatch, json.dumps(VALID))
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == 200
    assert response.json()['encumbrances'] == 'None'
    assert response.json()['risk_level'] == 'GREEN'
    assert 'title verification still required' in response.json()['risk_reason']


@pytest.mark.parametrize('text,status', [('[]', 502), ('null', 502), ('not json', 502), (None, 502), ('{}', 422)])
def test_unreadable_or_malformed_output_does_not_become_report(monkeypatch, text, status):
    install_reader(monkeypatch, text)
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == status
    assert 'risk_level' not in response.json()


def test_reader_timeout_is_bounded_and_clients_close(monkeypatch):
    async def pending():
        await asyncio.Event().wait()

    state = install_reader(monkeypatch, operation=pending)
    actual_wait_for = asyncio.wait_for

    async def short_wait_for(awaitable, timeout):
        assert timeout == 90.0
        return await actual_wait_for(awaitable, timeout=0.001)

    monkeypatch.setattr(main.asyncio, 'wait_for', short_wait_for)
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == 504
    assert state['closed'] == ['async', 'sync']


def test_liveness_served_while_real_upload_waits_for_reader(monkeypatch):
    async def scenario():
        started, release = asyncio.Event(), asyncio.Event()

        async def pending():
            started.set()
            await release.wait()
            return SimpleNamespace(text=json.dumps(VALID))

        install_reader(monkeypatch, operation=pending)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url='http://test') as client:
            upload = asyncio.create_task(client.post('/analyze-record', files=UPLOAD))
            try:
                await asyncio.wait_for(started.wait(), timeout=1)
                health = await asyncio.wait_for(client.get('/health/live'), timeout=1)
                assert health.status_code == 200
                assert not upload.done()
            finally:
                release.set()
                response = await upload
            assert response.status_code == 200
    asyncio.run(scenario())


@pytest.mark.parametrize('upstream,status,phrase', [
    (503, 503, 'temporarily busy'),
    (429, 429, 'service limit'),
    (500, 502, 'service could not complete'),
])
def test_provider_failure_reports_service_problem_not_bad_document(monkeypatch, upstream, status, phrase):
    from google.genai.errors import APIError

    async def unavailable():
        raise APIError(upstream, {'error': {'code': upstream,
                       'message': 'Internal provider details must not be exposed'}})

    state = install_reader(monkeypatch, operation=unavailable)
    response = TestClient(main.app).post('/analyze-record', files=UPLOAD)
    assert response.status_code == status
    assert phrase in response.json()['detail']
    assert 'clearer document' not in response.json()['detail']
    assert 'Internal provider details' not in response.text
    if upstream in (429, 503):
        assert response.headers['retry-after'] == '60'
    assert state['closed'] == ['async', 'sync']
    assert len(state['prompts']) == 1  # no automatic model fallback
