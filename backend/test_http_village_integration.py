"""HTTP acquisition participates in the existing cache/gate/API contract."""
import asyncio

import pytest
import anyror_http
import scraper
import scrape_control


@pytest.fixture
def http_portal(monkeypatch):
    monkeypatch.delenv("ANYROR_VILLAGE_TRANSPORT", raising=False)
    monkeypatch.setattr(scraper, "_village_cache", {})
    monkeypatch.setattr(scraper, "_get_supabase_or_none", lambda: None)
    class LazyGate:
        gate = None
        async def run(self, operation):
            if self.gate is None:
                self.gate = scrape_control.PortalGate(interval=0)
            return await self.gate.run(operation)
    monkeypatch.setattr(scrape_control, "portal_gate", LazyGate())
    events = []
    state = {"fail": False, "ambiguous": False}
    class Session:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): events.append("close")
        async def open(self):
            events.append("open")
            if state["fail"]:
                raise anyror_http.AnyRORFormError("Unavailable")
        def options(self, control):
            labels = {
                "ContentPlaceHolder1_ddlDistrict": "ગાંધીનગર",
                "ContentPlaceHolder1_ddlTaluka": "કલોલ",
                "ContentPlaceHolder1_ddlVillage": "અઢાણા - 039",
            }
            result = [{"value": "7", "label": labels[control], "disabled": False}]
            if state["ambiguous"]: result.append(dict(result[0], value="8"))
            return result
        async def select(self, control, value): events.append((control, value))
    monkeypatch.setattr(anyror_http, "AnyRORHTTPSession", Session)
    async def translate(names, *args):
        return [{"english": name, "gujarati": name} for name in names]
    monkeypatch.setattr(scraper, "_batch_translate_villages", translate)
    # A failure must never cause browser fallback.
    monkeypatch.setattr(scraper, "async_playwright", lambda: pytest.fail("Unexpected browser"))
    return events, state


def test_default_transport_exact_sequence_and_cache(http_portal):
    events, _ = http_portal
    async def run():
        result = await scraper.fetch_villages("Gandhinagar", "Kalol")
        assert result == [{"english": "અઢાણા - 039", "gujarati": "અઢાણા - 039"}]
        assert await scraper.fetch_villages("Gandhinagar", "Kalol") == result
    asyncio.run(run())
    assert events == ["open", ("ContentPlaceHolder1_drpLandRecord", "1"),
                      ("ContentPlaceHolder1_ddlDistrict", "7"),
                      ("ContentPlaceHolder1_ddlTaluka", "7"), "close"]


def test_http_failure_stops_and_shared_gate_prevents_retry(http_portal):
    events, state = http_portal
    state["fail"] = True
    async def run():
        for _ in range(2):
            with pytest.raises(scraper.VillageLookupUnavailable):
                await scraper.fetch_villages("Gandhinagar", "Kalol")
    asyncio.run(run())
    assert events == ["open", "close"]


def test_ambiguous_location_never_posts_a_guess(http_portal):
    events, state = http_portal
    state["ambiguous"] = True
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages("Gandhinagar", "Kalol"))
    assert events == ["open", ("ContentPlaceHolder1_drpLandRecord", "1"), "close"]
