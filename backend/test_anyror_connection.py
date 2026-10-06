"""Offline proof of the fixed-target probe's stages, privacy and cooldown."""
import asyncio
import json
import socket
import ssl
from types import SimpleNamespace

import pytest
import anyror_connection as connection


class Loop:
    def __init__(self, fail=None):
        self.fail = fail
        self.hosts = []
    async def getaddrinfo(self, host, port, **kwargs):
        self.hosts.append((host, port, kwargs))
        if self.fail == "dns": raise RuntimeError("SECRET DNS MESSAGE")
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.0.2.1", 443))]
    async def sock_connect(self, sock, address):
        if self.fail == "tcp": raise asyncio.TimeoutError()


class Reader:
    def __init__(self, status=200, body=None):
        self.status = status
        self.body = body if body is not None else b"ContentPlaceHolder1_ddlDistrict ContentPlaceHolder1_drpLandRecord"
    async def readuntil(self, separator):
        return f"HTTP/1.1 {self.status} Test\r\nSet-Cookie: SECRET\r\n\r\n".encode()
    async def read(self, maximum):
        value, self.body = self.body[:maximum], self.body[maximum:]
        return value


class Writer:
    def __init__(self): self.request, self.closed = b"", False
    def write(self, value): self.request += value
    async def drain(self): pass
    def close(self): self.closed = True
    def get_extra_info(self, name): return SimpleNamespace(version=lambda: "TLSv1.2")


def run_probe(monkeypatch, fail=None, status=200, body=None):
    loop, writer = Loop(fail), Writer()
    async def open_connection(**kwargs):
        assert kwargs["server_hostname"] == connection.HOST
        assert kwargs["ssl"].check_hostname is True
        assert kwargs["ssl"].verify_mode == ssl.CERT_REQUIRED
        if fail == "tls": raise asyncio.TimeoutError()
        if fail == "certificate": raise ssl.SSLCertVerificationError("SECRET CERT MESSAGE")
        return Reader(status, body), writer
    monkeypatch.setattr(connection.asyncio, "open_connection", open_connection)
    return asyncio.run(connection._probe(loop)), loop, writer


def test_fixed_ipv4_target_verified_tls_and_no_raw_response(monkeypatch):
    result, loop, writer = run_probe(monkeypatch)
    assert result["outcome"] == "ready" and result["stage"] == "complete"
    assert loop.hosts == [(connection.HOST, 443, {"family": socket.AF_INET, "type": socket.SOCK_STREAM})]
    assert writer.request.startswith(b"GET /LandRecordRural.aspx HTTP/1.1")
    assert writer.closed
    assert "SECRET" not in json.dumps(result)
    assert "192.0.2.1" not in json.dumps(result)


@pytest.mark.parametrize("failure,stage,code", [("dns", "dns", "connection"),
    ("tcp", "tcp", "deadline"), ("tls", "tls", "deadline"),
    ("certificate", "tls", "certificate")])
def test_failure_stage_and_safe_error(monkeypatch, failure, stage, code):
    result, _, _ = run_probe(monkeypatch, failure)
    assert result["stage"] == stage and result["failure"] == code
    assert result["outcome"] == "unavailable"
    assert "SECRET" not in json.dumps(result)


@pytest.mark.parametrize("status", [302, 403, 429, 503])
def test_http_error_does_not_follow_redirect_or_hide_restriction(monkeypatch, status):
    result, _, _ = run_probe(monkeypatch, status=status)
    assert result["http_status"] == status and result["failure"] == "http_status"
    assert result["outcome"] == "unavailable"


def test_missing_controls_is_not_success(monkeypatch):
    result, _, _ = run_probe(monkeypatch, body=b"error page")
    assert result["failure"] == "controls"


def test_body_reading_is_capped(monkeypatch):
    result, _, _ = run_probe(monkeypatch, body=b"a" * 200000)
    assert result["body_limit_reached"] is True


def test_concurrent_calls_and_cooldown_do_not_repeat_probe(monkeypatch):
    calls = []
    async def probe():
        calls.append(1)
        await asyncio.sleep(0)
        return {"outcome": "ready"}
    monkeypatch.setattr(connection, "_probe", probe)
    monkeypatch.setattr(connection, "_lock", None)
    monkeypatch.setattr(connection, "_latest", None)
    async def exercise(): return await asyncio.gather(connection.check_connection(), connection.check_connection())
    one, two = asyncio.run(exercise())
    assert one["cached"] is False and two["cached"] is True
    one["outcome"] = "changed"
    assert connection._latest["outcome"] == "ready" and len(calls) == 1


def test_route_is_explicit_and_health_remains_passive(monkeypatch):
    import main
    from fastapi.testclient import TestClient
    calls = []
    async def check(): calls.append(1); return {"outcome": "ready"}
    monkeypatch.setattr(connection, "check_connection", check)
    monkeypatch.setattr(main, "RATE_LIMITS_DISABLED", False)
    monkeypatch.setattr(main, "_rate_buckets", {})
    with TestClient(main.app) as client:
        assert client.get("/health/portal").status_code == 200
        assert not calls
        assert client.post("/diagnostics/anyror-connection", json={"url": "http://PRIVATE"}).json() == {"outcome": "ready"}
        assert client.post("/diagnostics/anyror-connection").status_code == 429
        assert calls == [1]
