# test_security.py — security-hardening behaviour added in the 2026-07 pass:
# per-IP rate limiting (429 + Retry-After), fail-closed cron + Stripe webhook,
# upload size/type rejection, input length bounds, and job-store caps.
# No network, no Playwright, no Gemini, no Supabase.

import io
import os

import pytest

os.environ.setdefault("GOOGLE_API_KEY", "test-key")

import demo


@pytest.fixture()
def main_mod(monkeypatch):
    import main
    # Never touch the network even if backend/.env configured Supabase.
    monkeypatch.setattr(main, "_get_supabase", lambda: None)
    return main


@pytest.fixture()
def client(main_mod):
    from fastapi.testclient import TestClient
    with TestClient(main_mod.app) as c:
        yield c


@pytest.fixture()
def limited(main_mod, monkeypatch):
    """Re-enable rate limiting (conftest disables it globally for tests)."""
    monkeypatch.setattr(main_mod, "RATE_LIMITS_DISABLED", False)
    main_mod._rate_buckets.clear()
    yield main_mod
    main_mod._rate_buckets.clear()


# ── Rate limiting (F-08) ─────────────────────────────────────────────────────

class TestRateLimiting:
    def test_demo_login_limited_to_5_per_minute(self, client, limited):
        for _ in range(5):
            r = client.post("/demo/login", json={
                "username": demo.DEMO_USERNAME, "password": demo.DEMO_PASSWORD})
            assert r.status_code == 200
        r = client.post("/demo/login", json={
            "username": demo.DEMO_USERNAME, "password": demo.DEMO_PASSWORD})
        assert r.status_code == 429
        assert "retry-after" in {k.lower() for k in r.headers.keys()}

    def test_separate_ips_have_separate_buckets(self, client, limited):
        # Exhaust the bucket for one forwarded IP...
        for _ in range(5):
            client.post("/demo/login",
                        headers={"X-Forwarded-For": "203.0.113.7"},
                        json={"username": demo.DEMO_USERNAME,
                              "password": demo.DEMO_PASSWORD})
        r = client.post("/demo/login",
                        headers={"X-Forwarded-For": "203.0.113.7"},
                        json={"username": demo.DEMO_USERNAME,
                              "password": demo.DEMO_PASSWORD})
        assert r.status_code == 429
        # ...a different first-hop IP is unaffected.
        r = client.post("/demo/login",
                        headers={"X-Forwarded-For": "198.51.100.9, 203.0.113.7"},
                        json={"username": demo.DEMO_USERNAME,
                              "password": demo.DEMO_PASSWORD})
        assert r.status_code == 200

    def test_title_report_limited(self, client, limited):
        # Oversized district → 400 (validation runs after the limiter), so no
        # real scrape is ever launched; after 5 hits the limiter kicks in.
        bad = {"district": "X" * 200, "taluka": "City",
               "village": "Navrangpura", "survey_no": "1"}
        for _ in range(5):
            assert client.post("/jobs/title-report", json=bad).status_code == 400
        assert client.post("/jobs/title-report", json=bad).status_code == 429


# ── Fail-closed cron secret (F-10) ──────────────────────────────────────────

class TestCronFailClosed:
    def test_503_when_cron_secret_unset(self, client, monkeypatch):
        monkeypatch.delenv("CRON_SECRET", raising=False)
        r = client.post("/watchlist/run-checks")
        assert r.status_code == 503

    def test_403_on_wrong_secret(self, client, monkeypatch):
        monkeypatch.setenv("CRON_SECRET", "s3cret")
        r = client.post("/watchlist/run-checks", headers={"X-Cron-Secret": "nope"})
        assert r.status_code == 403


# ── Fail-closed Stripe webhook (F-09) ───────────────────────────────────────

class TestStripeWebhookFailClosed:
    def test_503_when_webhook_secret_unset(self, client, main_mod, monkeypatch):
        monkeypatch.setattr(main_mod, "STRIPE_ENABLED", True)
        monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
        r = client.post("/webhook/stripe", json={"type": "checkout.session.completed"})
        assert r.status_code == 503

    def test_503_when_payments_disabled(self, client, main_mod, monkeypatch):
        monkeypatch.setattr(main_mod, "STRIPE_ENABLED", False)
        r = client.post("/webhook/stripe", json={})
        assert r.status_code == 503


# ── Upload hardening (F-11) ─────────────────────────────────────────────────

class TestUploadHardening:
    def test_disallowed_extension_and_type_rejected(self, client):
        r = client.post("/analyze-record", files={
            "file": ("malware.exe", io.BytesIO(b"MZ....."), "application/octet-stream")})
        assert r.status_code == 400

    def test_oversized_file_rejected(self, client, main_mod):
        big = b"\xff\xd8\xff" + b"0" * (main_mod.MAX_UPLOAD_BYTES + 10)
        r = client.post("/analyze-record", files={
            "file": ("big.jpg", io.BytesIO(big), "image/jpeg")})
        assert r.status_code == 413

    def test_spoofed_content_type_rejected_by_magic_bytes(self, client):
        r = client.post("/analyze-record", files={
            "file": ("fake.png", io.BytesIO(b"just plain text, not an image"), "image/png")})
        assert r.status_code == 400
        assert "not a recognised" in r.json()["detail"]

    def test_magic_byte_sniffer(self, main_mod):
        assert main_mod._sniff_upload_mime(b"\x89PNG\r\n\x1a\nxxxx") == "image/png"
        assert main_mod._sniff_upload_mime(b"%PDF-1.7 xxxx") == "application/pdf"
        assert main_mod._sniff_upload_mime(b"RIFF\x00\x00\x00\x00WEBPVP8 ") == "image/webp"
        assert main_mod._sniff_upload_mime(b"\xff\xd8\xff\xe0") == "image/jpeg"
        assert main_mod._sniff_upload_mime(b"<html>") is None


# ── Input validation bounds ─────────────────────────────────────────────────

class TestInputBounds:
    def test_title_report_rejects_oversized_fields(self, client):
        r = client.post("/jobs/title-report", json={
            "district": "A" * 500, "taluka": "City",
            "village": "Navrangpura", "survey_no": "1"})
        assert r.status_code == 400
        assert "too long" in r.json()["detail"]

    def test_fetch_anyror_rejects_oversized_survey_no(self, client):
        r = client.post("/fetch-anyror", json={
            "district": "Ahmedabad", "taluka": "City",
            "village": "Navrangpura", "survey_no": "9" * 100})
        assert r.status_code == 400

    def test_credits_rejects_invalid_email(self, client):
        assert client.get("/credits", params={"email": "not-an-email"}).status_code == 400
        assert client.get("/credits", params={"email": "a@b.co"}).status_code == 200

    def test_litigation_rejects_bad_year(self, client):
        r = client.post("/litigation-search", json={
            "name": "Patel", "district": "Ahmedabad", "year": "20xx"})
        assert r.status_code == 400


# ── Job-store bounds (F-08) ─────────────────────────────────────────────────

class TestJobStoreBounds:
    def test_stored_jobs_cap(self, client, main_mod, monkeypatch):
        monkeypatch.setattr(main_mod, "MAX_STORED_JOBS", 0)
        r = client.post("/jobs/title-report", json={
            "district": "Ahmedabad", "taluka": "City",
            "village": "Navrangpura", "survey_no": "1"})
        assert r.status_code == 503

    def test_concurrent_scrape_cap(self, client, main_mod, monkeypatch):
        monkeypatch.setattr(main_mod, "MAX_CONCURRENT_SCRAPE_JOBS", 0)
        r = client.post("/jobs/title-report", json={
            "district": "Ahmedabad", "taluka": "City",
            "village": "Navrangpura", "survey_no": "1"})
        assert r.status_code == 429

    def test_running_count_distinguishes_demo_jobs(self):
        from title_report import JobStore
        store = JobStore()
        real = store.create(meta={"email": "x@y.z"})
        demo_job = store.create(meta={"demo": True})
        assert store.running_count() == 2
        assert store.running_count(demo=False) == 1
        assert store.running_count(demo=True) == 1
        store.finish(real, {})
        assert store.running_count(demo=False) == 0


# ── News proxy (F-06) ───────────────────────────────────────────────────────

class TestNewsProxy:
    def test_503_when_key_unset(self, client, monkeypatch):
        monkeypatch.delenv("NEWSDATA_API_KEY", raising=False)
        assert client.get("/news/gujarat").status_code == 503


# ── CORS configuration (F-07) ───────────────────────────────────────────────

class TestCors:
    def test_wildcard_origin_not_used(self, main_mod):
        assert "*" not in main_mod._allowed_origins
        assert "http://localhost:3000" in main_mod._allowed_origins

    def test_disallowed_origin_gets_no_cors_headers(self, client):
        r = client.get("/", headers={"Origin": "https://evil.example"})
        assert "access-control-allow-origin" not in {k.lower() for k in r.headers}

    def test_allowed_origin_echoed(self, client):
        r = client.get("/", headers={"Origin": "http://localhost:3000"})
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
