# test_demo.py — DEMO MODE unit + endpoint tests (no network, no Playwright,
# no Gemini, no Supabase). Run from backend/ with:  python3 -m pytest -q
#
# Covers: demo credential check, token issue/expiry, the simulated title-
# report job driven through the real JobStore + real report builders, the
# survey-999 error/suggestions demo, and demo watchlist isolation from
# Supabase.

import asyncio
import os

import pytest

# Fake env so importing main.py never requires real keys
os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ.pop("SUPABASE_URL", None)
os.environ.pop("SUPABASE_KEY", None)
os.environ.pop("STRIPE_ENABLED", None)
os.environ.pop("DEMO_USERNAME", None)
os.environ.pop("DEMO_PASSWORD", None)

import demo
from title_report import JobStore


@pytest.fixture(autouse=True)
def _fast_and_pristine(monkeypatch):
    """Instant simulated sleeps + fresh demo state around every test."""
    async def _instant(_seconds):
        return None
    monkeypatch.setattr(demo, "_sleep", _instant)
    demo.reset_demo_state()
    yield
    demo.reset_demo_state()


@pytest.fixture()
def main_mod(monkeypatch):
    import main
    # backend/.env may set real SUPABASE_* vars via load_dotenv() — force
    # persistence off so these tests never touch the network.
    monkeypatch.setattr(main, "_get_supabase", lambda: None)
    return main


@pytest.fixture()
def client(main_mod):
    from fastapi.testclient import TestClient
    # Context manager keeps one event loop alive across requests so the
    # asyncio background task launched by POST /jobs/title-report can run.
    with TestClient(main_mod.app) as c:
        yield c


# ── Credentials + token store ────────────────────────────────────────────────

class TestCredentials:
    def test_default_credentials_accepted(self):
        assert demo.verify_credentials(demo.DEMO_USERNAME, demo.DEMO_PASSWORD)

    def test_wrong_password_rejected(self):
        assert not demo.verify_credentials(demo.DEMO_USERNAME, "wrong")

    def test_wrong_username_rejected(self):
        assert not demo.verify_credentials("intruder", demo.DEMO_PASSWORD)

    def test_empty_and_none_rejected(self):
        assert not demo.verify_credentials("", "")
        assert not demo.verify_credentials(None, None)


class TestTokens:
    def test_issue_and_validate(self):
        token, expires_in = demo.issue_token()
        assert expires_in == demo.TOKEN_TTL_SECONDS
        assert demo.is_valid_token(token)

    def test_unknown_and_empty_tokens_invalid(self):
        assert not demo.is_valid_token("not-a-token")
        assert not demo.is_valid_token("")
        assert not demo.is_valid_token(None)

    def test_token_expires_after_ttl(self, monkeypatch):
        clock = {"t": 1_000_000.0}
        monkeypatch.setattr(demo, "_clock", lambda: clock["t"])
        token, _ = demo.issue_token()
        assert demo.is_valid_token(token)

        clock["t"] += demo.TOKEN_TTL_SECONDS - 1
        assert demo.is_valid_token(token)

        clock["t"] += 2  # past the 24h TTL
        assert not demo.is_valid_token(token)

    def test_token_survives_restart(self, monkeypatch):
        """Signed tokens must stay valid across process restarts (Render
        free tier cold-starts constantly) — no in-memory state allowed."""
        token, _ = demo.issue_token()
        import importlib
        importlib.reload(demo)
        try:
            assert demo.is_valid_token(token)
        finally:
            importlib.reload(demo)

    def test_tampered_token_rejected(self):
        token, _ = demo.issue_token()
        payload, sig = token.rsplit(".", 1)
        exp = str(int(payload.split(".", 1)[0]) + 99999)
        assert not demo.is_valid_token(exp + "." + payload.split(".", 1)[1] + "." + sig)
        assert not demo.is_valid_token(payload + "." + sig[:-4] + "beef")


# ── Login + session endpoints ────────────────────────────────────────────────

class TestDemoLoginEndpoint:
    def test_login_success_returns_token(self, client):
        r = client.post("/demo/login", json={
            "username": demo.DEMO_USERNAME, "password": demo.DEMO_PASSWORD})
        assert r.status_code == 200
        body = r.json()
        assert body["expires_in"] == demo.TOKEN_TTL_SECONDS
        assert demo.is_valid_token(body["demo_token"])

    def test_login_failure_is_401(self, client, monkeypatch):
        # Shrink the constant failure delay so the test stays fast
        real_sleep = asyncio.sleep
        monkeypatch.setattr(asyncio, "sleep", lambda s: real_sleep(0))
        r = client.post("/demo/login", json={"username": "x", "password": "y"})
        assert r.status_code == 401

    def test_session_endpoint(self, client):
        token, _ = demo.issue_token()
        assert client.get("/demo/session",
                          headers={"X-Demo-Token": token}).json() == {"valid": True}
        assert client.get("/demo/session",
                          headers={"X-Demo-Token": "stale"}).json() == {"valid": False}
        assert client.get("/demo/session").json() == {"valid": False}


# ── Simulated title-report job (real JobStore, real report builders) ─────────

def _run_job(req: dict) -> dict:
    jobs = JobStore()
    job_id = jobs.create()
    asyncio.run(demo.run_demo_title_report_job(jobs, job_id, req))
    return jobs.get(job_id)


class TestDemoJob:
    def test_clear_parcel_runs_to_done(self):
        job = _run_job({"district": "Ahmedabad", "taluka": "City",
                        "village": "Navrangpura", "survey_no": "128 P"})
        assert job["status"] == "done"
        assert job["progress"] == 100

        report = job["result"]
        assert report["demo"] is True
        assert report["cached"] is False
        assert report["record"]["owner_name"] == "Rameshbhai Ambalal Patel"
        assert len(report["chain_of_title"]) == 6
        assert report["risk"]["verdict"] == "CLEAR"
        # Valid TitleReport shape: every check has name/status/detail
        assert {c["name"] for c in report["risk"]["checks"]} == {
            "tenure_type", "encumbrances", "ownership_churn",
            "chain_continuity", "litigation_mentions"}

    def test_caution_parcel_live_boja(self):
        job = _run_job({"district": "Ahmedabad", "taluka": "Sanand",
                        "village": "Sanand", "survey_no": "45"})
        report = job["result"]
        assert report["risk"]["verdict"] == "CAUTION"
        encum = next(c for c in report["risk"]["checks"] if c["name"] == "encumbrances")
        assert encum["status"] == "fail"

    def test_high_risk_parcel_flags(self):
        job = _run_job({"district": "Ahmedabad", "taluka": "Dholera",
                        "village": "Dholera", "survey_no": "72"})
        report = job["result"]
        assert report["risk"]["verdict"] == "HIGH_RISK"
        all_flags = {f for e in report["chain_of_title"] for f in e["flags"]}
        assert "RECENT_CHURN" in all_flags       # 2 sales in the last 3 years
        assert "CHAIN_GAP" in all_flags          # seller ≠ previous owner
        assert "RESTRICTED_TENURE" in all_flags  # Navi Sharat / 72-AA

    def test_unknown_survey_gets_default_fixture(self):
        job = _run_job({"district": "Rajkot", "taluka": "Gondal",
                        "village": "Vasavad", "survey_no": "777"})
        report = job["result"]
        assert job["status"] == "done"
        assert report["record"]["survey_no"] == "777"
        assert report["record"]["village"] == "Vasavad"
        assert report["record"]["district"] == "Rajkot"

    def test_survey_999_errors_with_suggestions(self):
        job = _run_job({"district": "Ahmedabad", "taluka": "City",
                        "village": "Navrangpura", "survey_no": "999"})
        assert job["status"] == "error"
        assert "999" in job["error"]
        assert job["suggestions"] == demo.ERROR_SUGGESTIONS

    def test_stage_sequence_matches_live_pipeline(self):
        jobs = JobStore()
        job_id = jobs.create()
        stages = []
        original = jobs.set_progress

        def spy(jid, stage, label=None, progress=None):
            stages.append(stage)
            original(jid, stage, label, progress)

        jobs.set_progress = spy
        asyncio.run(demo.run_demo_title_report_job(jobs, job_id, {
            "district": "Ahmedabad", "taluka": "City",
            "village": "Navrangpura", "survey_no": "128 P"}))
        assert stages[0] == "connecting"
        assert {"selecting_location", "solving_captcha", "reading_record",
                "fetching_chain", "building_report"} <= set(stages)


# ── Jobs endpoint routing (valid token → demo path, stale → paid path) ──────

class TestJobsEndpointDemoRouting:
    def test_valid_token_launches_demo_job(self, client):
        token, _ = demo.issue_token()
        r = client.post("/jobs/title-report", headers={"X-Demo-Token": token},
                        json={"district": "Ahmedabad", "taluka": "City",
                              "village": "Navrangpura", "survey_no": "128 P"})
        assert r.status_code == 202
        job_id = r.json()["job_id"]

        # Sleeps are patched to instant, so a few polls complete the job.
        status = None
        for _ in range(50):
            body = client.get(f"/jobs/{job_id}").json()
            status = body["status"]
            if status in ("done", "error"):
                break
        assert status == "done"
        assert body["result"]["demo"] is True
        assert body["result"]["risk"]["verdict"] == "CLEAR"

    def test_stale_token_falls_through_to_normal_path(self, client, main_mod, monkeypatch):
        """A stale/invalid token must never be an error — the request takes the
        regular path exactly as if no token were sent."""
        monkeypatch.setattr(main_mod, "_get_cached_title_report",
                            lambda req: {"record": {"owner_name": "Cached Owner"},
                                         "chain_of_title": [], "risk": {},
                                         "generated_at": "", "cached": True})
        r = client.post("/jobs/title-report", headers={"X-Demo-Token": "stale-token"},
                        json={"district": "Ahmedabad", "taluka": "City",
                              "village": "Navrangpura", "survey_no": "1"})
        assert r.status_code == 202
        assert r.json()["status"] == "done"          # served from (mocked) cache
        job = client.get(f"/jobs/{r.json()['job_id']}").json()
        assert job["result"]["record"]["owner_name"] == "Cached Owner"
        assert "demo" not in job["result"]


# ── Demo watchlist: fixtures served, mutations in-memory, Supabase untouched ─

class TestDemoWatchlist:
    def test_demo_reads_and_mutations_never_touch_supabase(self, client, main_mod, monkeypatch):
        def _boom():
            raise AssertionError("Supabase must never be touched in demo mode")
        monkeypatch.setattr(main_mod, "_get_supabase", _boom)
        token, _ = demo.issue_token()
        h = {"X-Demo-Token": token}

        # Fixture list (2 seeded parcels), no email needed
        items = client.get("/watchlist", headers=h).json()["items"]
        assert len(items) == 2
        assert {i["survey_no"] for i in items} == {"128 P", "72"}

        # Add — in-memory only, idempotent
        payload = {"email": "demo@satya-lekh.example", "district": "Ahmedabad",
                   "taluka": "Sanand", "village": "Sanand", "survey_no": "45"}
        added = client.post("/watchlist", headers=h, json=payload).json()
        assert added["survey_no"] == "45"
        again = client.post("/watchlist", headers=h, json=payload).json()
        assert again["id"] == added["id"]
        assert len(client.get("/watchlist", headers=h).json()["items"]) == 3

        # Alerts — joined with parcel context, newest first
        alerts = client.get("/watchlist/alerts", headers=h).json()["alerts"]
        assert len(alerts) == 2
        assert alerts[0]["seen"] is False
        assert alerts[0]["survey_no"] == "72"

        # Mark seen
        assert client.post(f"/watchlist/{alerts[0]['watchlist_id']}/alerts/seen",
                           headers=h).json() == {"updated": 1}
        alerts = client.get("/watchlist/alerts", headers=h).json()["alerts"]
        assert all(a["seen"] for a in alerts)

        # Delete — removes the row and its alerts from the demo set only
        assert client.delete(f"/watchlist/{added['id']}", headers=h).json()["deleted"] is True
        assert len(client.get("/watchlist", headers=h).json()["items"]) == 2
        assert client.delete("/watchlist/nope", headers=h).status_code == 404

    def test_without_token_normal_path_unchanged(self, client):
        # No Supabase configured (fixture forces None) → the real endpoint
        # still 503s and never leaks demo fixtures to non-demo callers.
        r = client.get("/watchlist", params={"email": "someone@example.com"})
        assert r.status_code == 503
        r = client.get("/watchlist")  # missing email, no token
        assert r.status_code == 400


# ── Demo dropdown options ────────────────────────────────────────────────────

class TestDemoOptions:
    def test_surveys_endpoint_with_token(self, client):
        token, _ = demo.issue_token()
        r = client.get("/options/surveys", headers={"X-Demo-Token": token},
                       params={"district": "Ahmedabad", "taluka": "City",
                               "village": "Navrangpura"})
        assert r.json()["surveys"] == demo.DEMO_SURVEY_OPTIONS
        assert "128 P" in r.json()["surveys"]

    def test_villages_endpoint_with_token(self, client):
        token, _ = demo.issue_token()
        r = client.get("/options/villages", headers={"X-Demo-Token": token},
                       params={"district": "Ahmedabad", "taluka": "City"})
        villages = r.json()["villages"]
        assert {"english": "Navrangpura", "gujarati": "નવરંગપુરા"} in villages


# ── Frictionless guest entry (POST /demo/start) ──────────────────────────────

class TestDemoStartEndpoint:
    def test_start_issues_valid_token_no_credentials(self, client):
        r = client.post("/demo/start")
        assert r.status_code == 200
        body = r.json()
        assert body["expires_in"] == demo.TOKEN_TTL_SECONDS
        assert demo.is_valid_token(body["demo_token"])

    def test_start_matches_login_shape(self, client):
        start = client.post("/demo/start").json()
        login = client.post("/demo/login", json={
            "username": demo.DEMO_USERNAME, "password": demo.DEMO_PASSWORD}).json()
        assert set(start.keys()) == set(login.keys()) == {"demo_token", "expires_in"}


# ── Whole-product demo-aware endpoints ───────────────────────────────────────
# Each newly demo-aware endpoint must (a) return a realistic fixture — never an
# error or empty state — when a valid X-Demo-Token is supplied, and (b) still
# take the normal (non-demo) path when no token is present.

def _token():
    token, _ = demo.issue_token()
    return token


class TestDemoLandReport:
    def test_with_token_returns_full_report(self, client):
        r = client.post("/land-report", headers={"X-Demo-Token": _token()},
                        json={"lat": 22.9612, "lng": 72.3809, "area_sqm": 8093})
        assert r.status_code == 200
        body = r.json()
        assert {"lat", "lng", "area_sqm", "elevation_m", "annual_rain_mm", "report"} <= set(body)
        report = body["report"]
        # All 8 narrative sections + suitability + red_flags present
        for k in ("executive_summary", "location_summary", "soil_terrain",
                  "water_flood_risk", "climate", "connectivity", "land_use_zoning",
                  "development_potential", "market_outlook", "legal_notes"):
            assert report[k]
        assert set(report["suitability"]) == {"agriculture", "residential", "commercial"}
        assert len(report["red_flags"]) >= 1

    def test_without_token_takes_normal_path(self, client, monkeypatch):
        # No token → the real handler runs. Invalid coords → 400 (proves the
        # demo branch was NOT taken and no fixture leaked).
        r = client.post("/land-report", json={"lat": 999, "lng": 0})
        assert r.status_code == 400


class TestDemoLitigationSearch:
    def test_with_token_returns_mixed_cases(self, client):
        r = client.post("/litigation-search", headers={"X-Demo-Token": _token()},
                        json={"name": "Rameshbhai Ambalal Patel",
                              "district": "Ahmedabad", "year": "2021"})
        assert r.status_code == 200
        body = r.json()
        assert {"cases", "court_complex", "message"} <= set(body)
        statuses = {c["status"] for c in body["cases"]}
        assert "Pending" in statuses and "Disposed" in statuses
        for c in body["cases"]:
            assert {"case_no", "parties", "case_type", "status", "court"} <= set(c)
        # Honest same-name caveat must be surfaced
        assert "name" in body["message"].lower()

    def test_without_token_validates_normally(self, client):
        # No token → real validation runs; too-short name → 400 (demo not taken)
        r = client.post("/litigation-search",
                        json={"name": "ab", "district": "Ahmedabad"})
        assert r.status_code == 400


class TestDemoGujaratNews:
    def test_with_token_returns_articles(self, client):
        r = client.get("/news/gujarat", headers={"X-Demo-Token": _token()})
        assert r.status_code == 200
        articles = r.json()["articles"]
        assert len(articles) >= 3
        for a in articles:
            assert {"source", "title", "desc", "url", "date"} <= set(a)

    def test_without_token_503_when_unconfigured(self, client):
        # No NEWSDATA_API_KEY in the test env → real path 503s (not a fixture)
        r = client.get("/news/gujarat")
        assert r.status_code == 503


class TestDemoManualOrders:
    def test_with_token_lists_sample_orders(self, client, main_mod, monkeypatch):
        def _boom():
            raise AssertionError("Supabase must never be touched in demo mode")
        monkeypatch.setattr(main_mod, "_get_supabase", _boom)
        h = {"X-Demo-Token": _token()}

        orders = client.get("/manual-orders", headers=h).json()["orders"]
        assert len(orders) == 3
        assert {o["status"] for o in orders} == {"pending", "in_progress", "delivered"}

        # POST echoes back a created order (status pending), in-memory only
        created = client.post("/manual-orders", headers=h, json={
            "email": "demo@satya-lekh.example", "state": "GJ",
            "district": "Ahmedabad", "taluka": "City", "village": "Navrangpura",
            "survey_no": "128 P", "sku": "certified_712_index2",
            "notes": "demo order"}).json()
        assert created["status"] == "pending"
        assert created["price_inr"] == 1500       # server-side price, not client's
        assert len(client.get("/manual-orders", headers=h).json()["orders"]) == 4

    def test_without_token_requires_email_and_supabase(self, client):
        # No token → real path: missing email → 400 (demo fixture never served)
        r = client.get("/manual-orders")
        assert r.status_code == 400


class TestDemoAnalyzeRecord:
    def test_with_token_returns_analysis(self, client):
        # A demo token short-circuits before any file processing / Gemini call.
        r = client.post("/analyze-record", headers={"X-Demo-Token": _token()},
                        files={"file": ("dummy.txt", b"not-an-image", "text/plain")})
        assert r.status_code == 200
        body = r.json()
        assert {"owner_name", "survey_no", "total_area", "tenure_type",
                "encumbrances", "risk_level", "risk_reason"} == set(body)
        assert body["risk_level"] in ("GREEN", "YELLOW", "RED")

    def test_without_token_rejects_bad_upload(self, client):
        # No token → real path validates the upload and rejects a text file (400)
        r = client.post("/analyze-record",
                        files={"file": ("dummy.txt", b"not-an-image", "text/plain")})
        assert r.status_code == 400


class TestDemoCredits:
    def test_with_token_returns_generous_credits(self, client):
        r = client.get("/credits", headers={"X-Demo-Token": _token()})
        assert r.status_code == 200
        body = r.json()
        assert body["credits"] == demo.DEMO_CREDITS
        assert body["payments_enabled"] is False

    def test_without_token_uses_normal_path(self, client):
        # No token, payments disabled in test env → real handler returns 0
        r = client.get("/credits", params={"email": "someone@example.com"})
        assert r.status_code == 200
        assert r.json()["credits"] == 0


class TestDemoRiskScreen:
    def test_with_token_and_empty_inputs_returns_populated(self, client):
        r = client.post("/risk-screen", headers={"X-Demo-Token": _token()}, json={})
        assert r.status_code == 200
        body = r.json()
        assert len(body["layers"]) == 12
        # Sample defaults populate real (non-unknown) findings
        assert body["summary"]["unknown"] < 12
        assert body["verdict"]

    def test_with_token_honours_supplied_inputs(self, client):
        # Explicit inputs override the demo defaults (proves we don't clobber).
        r = client.post("/risk-screen", headers={"X-Demo-Token": _token()},
                        json={"region": "Kutch"})
        assert r.status_code == 200
        assert r.json()["inputs"]["region"] == "Kutch"

    def test_without_token_normal_behavior(self, client):
        # No token, empty inputs → real screener runs (mostly unknown), 200.
        r = client.post("/risk-screen", json={})
        assert r.status_code == 200
        assert len(r.json()["layers"]) == 12
