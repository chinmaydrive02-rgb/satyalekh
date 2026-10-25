import asyncio
import base64
from unittest.mock import AsyncMock

import httpx
import pytest

import anyror_worker as worker

JOB = {"id": "sample-job", "lease_token": "private-lease", "request": {
    "record_type": "VF7", "district": "Gandhinagar", "taluka": "Kalol",
    "village": "અઢાણા - 039", "survey_no": "3"}}


@pytest.fixture
def portal(monkeypatch):
    session = type("Session", (), {})()
    session.challenge_image = AsyncMock(return_value=b"raster-challenge")
    session.submit_vf7_challenge = AsyncMock(return_value=b"exact-source-bytes")
    class Context:
        async def __aenter__(self): return session
        async def __aexit__(self, *args): pass
    monkeypatch.setattr(worker, "prepare_vf7", AsyncMock())
    return session, Context


def test_website_answer_is_used_once_and_original_bytes_delivered(portal):
    session, factory = portal
    events = []
    class API:
        async def action(self, job, action, **payload):
            events.append((action, payload))
            if action == "control": return {"status": "running", "answer": "ABC123"}
            return {}
    asyncio.run(worker.run_job(API(), JOB, session_factory=factory))
    session.submit_vf7_challenge.assert_awaited_once_with("ABC123")
    assert [event[0] for event in events] == ["challenge", "control", "complete"]
    assert base64.b64decode(events[-1][1]["source_base64"]) == b"exact-source-bytes"


def test_revoked_or_expired_job_never_submits_to_portal(portal):
    session, factory = portal
    class API:
        async def action(self, job, action, **payload):
            return {"status": "failed"} if action == "control" else {}
    asyncio.run(worker.run_job(API(), JOB, session_factory=factory))
    session.submit_vf7_challenge.assert_not_awaited()


def test_uncertain_completion_does_not_replay_portal_answer(portal):
    session, factory = portal
    events = []
    class API:
        async def action(self, job, action, **payload):
            events.append(action)
            if action == "control": return {"status": "running", "answer": "ABC123"}
            if action == "complete": raise worker.BrokerError("connection lost")
            return {}
    asyncio.run(worker.run_job(API(), JOB, session_factory=factory))
    session.submit_vf7_challenge.assert_awaited_once()
    assert events == ["challenge", "control", "complete", "fail"]


def test_device_secret_is_header_only_never_printed(capsys):
    token = "private-device-token-that-must-not-be-printed"
    def transport(request):
        if request.url.path == "/health/live": return httpx.Response(200, json={"status": "ok"})
        if request.url.path.endswith("register"):
            return httpx.Response(200, json={"worker_id": "worker", "worker_token": token,
                "pairing_code": "ABCD2345EFGH", "pairing_expires_at": "later"})
        assert request.headers["x-acquisition-worker-token"] == token
        assert token.encode() not in request.content
        return httpx.Response(200, json={"connected": False})
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(transport)) as client:
            api = worker.Broker("https://example.test", client)
            await api.register()
            await api.poll()
            await api.close()
    asyncio.run(run())
    assert token not in capsys.readouterr().out


@pytest.mark.parametrize("origin", ["http://example.com", "https://user:secret@example.com", "https://example.com/?key=secret"])
def test_connector_refuses_credentials_in_origins(origin):
    with pytest.raises(ValueError): worker.Broker(origin)


def test_heartbeat_only_renews_lease_and_stops_for_ended_job(monkeypatch):
    events = []
    async def immediate(seconds):
        assert seconds == 15
    monkeypatch.setattr(worker.asyncio, "sleep", immediate)
    class API:
        async def action(self, job, action, **payload):
            events.append(action)
            return {"status": "completed"}
    asyncio.run(worker.keep_lease_alive(API(), JOB))
    assert events == ["heartbeat"]
