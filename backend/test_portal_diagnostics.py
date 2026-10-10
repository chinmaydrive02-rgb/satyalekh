"""Offline checks for passive, bounded, non-personal portal observations."""
import asyncio
import json
from types import SimpleNamespace

import pytest

import portal_diagnostics as diagnostics
import scraper
from test_village_reliability import portal


@pytest.fixture(autouse=True)
def clean_observation(monkeypatch):
    monkeypatch.setattr(diagnostics, "_latest", None)
    monkeypatch.setattr(diagnostics, "_latest_at", None)


def test_passive_initial_state_and_snapshot_copies(monkeypatch):
    assert diagnostics.get_portal_observation() == {"observed": False}
    monkeypatch.setattr(diagnostics.time, "monotonic", lambda: 100)
    diagnostics.record_portal_observation(stage="navigation", outcome="unavailable", elapsed_ms=20,
                                          failure_kind="deadline", timeout_ms=20000, cache_source="live")
    first = diagnostics.get_portal_observation()
    first["stage"] = "changed"
    monkeypatch.setattr(diagnostics.time, "monotonic", lambda: 105)
    latest = diagnostics.get_portal_observation()
    assert latest["stage"] == "navigation"
    assert latest["age_seconds"] == 5
    assert latest["observed_at"]
    diagnostics.record_portal_observation(stage="cache_read", outcome="cached", cache_source="memory")
    assert "failure_kind" not in diagnostics.get_portal_observation()


def test_arbitrary_keys_and_unsafe_values_never_enter_observation():
    diagnostics.record_portal_observation(
        stage="navigation", outcome="unavailable", failure_kind="navigation", elapsed_ms=1,
        district="PRIVATE LOCATION", url="https://secret/?token=SECRET", error="PRIVATE ERROR",
        route="https://secret/", cache_source="SECRET", network_error="ERR_SECRET",
        http_status=True, timeout_ms=float("inf"), option_count=-1, cooldown_remaining_s=999999)
    result = diagnostics.get_portal_observation()
    assert set(result) == {"observed", "operation", "observed_at", "age_seconds", "stage", "outcome", "failure_kind", "elapsed_ms"}
    assert "PRIVATE" not in json.dumps(result)
    assert "SECRET" not in json.dumps(result)


@pytest.mark.parametrize("error,expected", [
    (RuntimeError("net::ERR_NAME_NOT_RESOLVED at https://secret/?token=PRIVATE"), "ERR_NAME_NOT_RESOLVED"),
    (RuntimeError("net::ERR_CONNECTION_RESET PRIVATE"), "ERR_CONNECTION_RESET"),
    (RuntimeError("net::ERR_SECRET PRIVATE"), None),
    (RuntimeError("PRIVATE ERROR"), None),
])
def test_network_error_tokens_are_strictly_allowlisted(error, expected):
    assert diagnostics.network_error_code(error) == expected


def test_internal_observer_failure_is_nonfatal(monkeypatch):
    monkeypatch.setattr(diagnostics.time, "monotonic", lambda: (_ for _ in ()).throw(RuntimeError("broken")))
    diagnostics.record_portal_observation(stage="navigation")
    assert diagnostics.get_portal_observation() == {"observed": False}


@pytest.mark.parametrize("status", [403, 429, 503])
def test_http_failure_and_followup_cooldown_are_distinct(portal, status):
    portal["status"] = status
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE DISTRICT", "PRIVATE TALUKA"))
    result = diagnostics.get_portal_observation()
    assert result["stage"] == "navigation"
    assert result["failure_kind"] == "http_status"
    assert result["http_status"] == status
    assert result["timeout_ms"] == 20000
    assert "PRIVATE" not in json.dumps(result)
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE DISTRICT", "PRIVATE TALUKA"))
    result = diagnostics.get_portal_observation()
    assert result["stage"] == "gate"
    assert result["failure_kind"] == "cooldown"
    assert "http_status" not in result
    assert portal["launches"] == 1


def test_navigation_timeout_never_claims_http_response(portal):
    from playwright.async_api import TimeoutError as BrowserTimeoutError
    portal["error"] = BrowserTimeoutError("secret URL and PRIVATE LOCATION")
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["stage"] == "navigation"
    assert result["failure_kind"] == "deadline"
    assert result["timeout_ms"] == 20000
    assert "http_status" not in result
    assert "PRIVATE" not in json.dumps(result)


def test_navigation_network_error_retains_only_classification(portal):
    portal["error"] = RuntimeError("net::ERR_NAME_NOT_RESOLVED at https://PRIVATE/?token=SECRET")
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["failure_kind"] == "navigation"
    assert result["network_error"] == "ERR_NAME_NOT_RESOLVED"
    assert "PRIVATE" not in json.dumps(result)
    assert "SECRET" not in json.dumps(result)


def test_browser_failure_is_not_navigation_failure(portal):
    portal["context_error"] = True
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["stage"] == "browser_context"
    assert result["failure_kind"] == "browser"
    assert "http_status" not in result


def test_control_failure_preserves_successful_navigation_status(portal, monkeypatch):
    async def unavailable(*args, **kwargs): return False
    monkeypatch.setattr(scraper, "_wait_for_dropdown_options", unavailable)
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["stage"] == "record_type_ready"
    assert result["failure_kind"] == "control"
    assert result["http_status"] == 200
    assert result["timeout_ms"] == 30000


def test_live_success_and_memory_cache_are_distinct(portal):
    asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    live = diagnostics.get_portal_observation()
    assert live["stage"] == "complete"
    assert live["outcome"] == "ready"
    assert live["cache_source"] == "live"
    assert live["option_count"] == 1
    asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    cached = diagnostics.get_portal_observation()
    assert cached["outcome"] == "cached"
    assert cached["cache_source"] == "memory"
    assert "http_status" not in cached
    assert portal["launches"] == 1


def test_persistent_cache_is_observed_without_browser(portal, monkeypatch):
    class Cache:
        def table(self, *_): return self
        def select(self, *_): return self
        def eq(self, *_): return self
        def limit(self, *_): return self
        def execute(self): return SimpleNamespace(data=[{"villages": [{"english": "PRIVATE", "gujarati": "PRIVATE"}]}])
    monkeypatch.setattr(scraper, "_get_supabase_or_none", Cache)
    result = asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    assert len(result) == 1
    observation = diagnostics.get_portal_observation()
    assert observation["cache_source"] == "persistent"
    assert observation["option_count"] == 1
    assert "PRIVATE" not in json.dumps(observation)
    assert portal["launches"] == 0


def test_broken_observer_does_not_change_success_or_failure(portal, monkeypatch):
    def broken(**kwargs): raise RuntimeError("broken diagnostics")
    monkeypatch.setattr(diagnostics, "record_portal_observation", broken)
    assert asyncio.run(scraper.fetch_villages("A", "B"))
    portal["status"] = 403
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("C", "D"))
    assert diagnostics.get_portal_observation() == {"observed": False}


def test_application_error_redirect_is_distinct_from_http_failure(portal, monkeypatch):
    async def redirected(page, *args, **kwargs):
        page.url = "https://anyror.gujarat.gov.in/CustomError.htm?PRIVATE=SECRET"
        return False
    monkeypatch.setattr(scraper, "_wait_for_dropdown_options", redirected)
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["failure_kind"] == "redirect"
    assert result["route"] == "custom_error"
    assert result["http_status"] == 200
    assert "SECRET" not in json.dumps(result)


def test_overall_deadline_preserves_stage_and_actual_budget(portal, monkeypatch):
    async def stuck(*args, **kwargs): await asyncio.Event().wait()
    monkeypatch.setattr(scraper, "_select_cascading_option", stuck)
    original = asyncio.wait_for
    async def short_wait_for(awaitable, timeout):
        return await original(awaitable, timeout=0.005 if timeout == 40.0 else timeout)
    monkeypatch.setattr(scraper.asyncio, "wait_for", short_wait_for)
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["failure_kind"] == "deadline"
    assert result["stage"] == "district_to_taluka"
    assert result["timeout_ms"] == 40000
    assert portal["closed"] == ["context", "browser"]


def test_cooldown_remaining_comes_from_shared_gate(portal, monkeypatch):
    import scrape_control
    portal["status"] = 403
    async def scenario():
        gate = scrape_control.PortalGate(interval=0, cooldown=300)
        monkeypatch.setattr(scrape_control, "portal_gate", gate)
        for _ in range(2):
            with pytest.raises(scraper.VillageLookupUnavailable):
                await scraper.fetch_villages("PRIVATE", "PRIVATE")
            assert 299 <= diagnostics.get_portal_observation()["cooldown_remaining_s"] <= 300
    asyncio.run(scenario())
    assert diagnostics.get_portal_observation()["failure_kind"] == "cooldown"
    assert portal["launches"] == 1


def test_cascade_application_redirect_keeps_latest_route(portal, monkeypatch):
    async def redirected(page, *args, **kwargs):
        page.url = "https://anyror.gujarat.gov.in/CustomError.htm?SECRET"
        raise scraper.PortalControlsUnavailable("PRIVATE DETAIL")
    monkeypatch.setattr(scraper, "_select_cascading_option", redirected)
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("PRIVATE", "PRIVATE"))
    result = diagnostics.get_portal_observation()
    assert result["stage"] == "district_to_taluka"
    assert result["failure_kind"] == "redirect"
    assert result["route"] == "custom_error"
    assert "SECRET" not in json.dumps(result)
