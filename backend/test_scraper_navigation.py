"""Offline navigation regression tests; never contact a government portal."""
import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
import scraper


@pytest.mark.parametrize('response,url,unavailable', [
    (None, '', True), (SimpleNamespace(status=404), '', True),
    (SimpleNamespace(status=403), '', True), (SimpleNamespace(status=503), '', True),
    (SimpleNamespace(status=200), 'https://anyror.gujarat.gov.in/CustomError.htm', True),
    (SimpleNamespace(status=200), 'https://anyror.gujarat.gov.in/LandRecordRural.aspx', False),
])
def test_response_classification(response, url, unavailable):
    assert scraper._portal_response_unavailable(response, url) == unavailable


def test_dropdown_timeout_is_false_without_grace_success():
    page = SimpleNamespace(url='https://portal/record', wait_for_function=AsyncMock(side_effect=TimeoutError()))
    assert asyncio.run(scraper._wait_for_dropdown_options(page, '#district')) is False
    assert page.wait_for_function.call_args.kwargs['timeout'] == 20000


def test_ready_dropdown_error_redirect_is_not_ready():
    page = SimpleNamespace(url='https://portal/CustomError.htm', wait_for_function=AsyncMock())
    assert asyncio.run(scraper._wait_for_dropdown_options(page, '#district')) is False


class CascadePage:
    url = 'https://portal/record'
    def __init__(self, changed=True, busy=False):
        self.changed, self.busy, self.events = changed, busy, []
        self.parent_value = 'old'
    async def evaluate(self, script, args):
        if isinstance(args, dict):
            self.events.append('observe-before-select')
            assert 'MutationObserver' in script
        else:
            self.events.append('observer-disconnected')
            assert 'disconnect' in script
    async def wait_for_function(self, script, *, arg, timeout):
        self.events.append('wait-after-select')
        assert self.parent_value == arg['value']
        assert 'state.changed' in script and 'get_isInAsyncPostBack' in script
        assert 'parent.value === args.value' in script
        assert timeout == 20000
        # Simulates the portal updating asynchronously after select returned;
        # a populated but unchanged child must not satisfy the predicate.
        if not self.changed or self.busy:
            raise TimeoutError('stale or unfinished postback')
        await asyncio.sleep(0)


class Element:
    def __init__(self, page): self.page = page
    async def select_option(self, *, value):
        self.page.events.append('select')
        self.page.parent_value = value


@pytest.mark.parametrize('changed,busy,expected', [(True, False, True), (False, False, False), (True, True, False)])
def test_child_wait_observes_late_postback_rejects_stale_and_busy(changed, busy, expected):
    page = CascadePage(changed, busy)
    result = asyncio.run(scraper._select_and_wait_for_child(page, Element(page), '#district', '7', '#taluka'))
    assert result is expected
    assert page.events == ['observe-before-select', 'select', 'wait-after-select', 'observer-disconnected']


def test_selection_timeout_disconnects_observer():
    page = CascadePage()
    element = SimpleNamespace(select_option=AsyncMock(side_effect=TimeoutError()))
    assert asyncio.run(scraper._select_and_wait_for_child(page, element, '#district', '7', '#taluka')) is False
    assert page.events[-1] == 'observer-disconnected'


@pytest.mark.parametrize('response,url', [(None, 'https://portal/record'), (SimpleNamespace(status=404), 'https://portal/record'), (SimpleNamespace(status=200), 'https://portal/CustomError.htm')])
def test_full_record_invalid_navigation_closes_resources_and_never_selects(monkeypatch, response, url):
    events = []
    class Page:
        async def goto(self, *args, **kwargs):
            events.append('goto')
            return response
    page = Page(); page.url = url
    class Context:
        async def new_page(self): return page
        async def close(self): events.append('context-close')
    class Browser:
        async def new_context(self, **kwargs): return Context()
        async def close(self): events.append('browser-close')
    class Playwright:
        async def __aenter__(self): self.chromium = self; return self
        async def __aexit__(self, *args): pass
        async def launch(self, **kwargs): return Browser()
    monkeypatch.setattr(scraper, 'async_playwright', Playwright)
    result = asyncio.run(scraper._scrape_anyror_data('A', 'B', 'C', '1'))
    assert result['code'] == 'PORTAL_UNAVAILABLE'
    assert events.count('goto') == 1
    assert 'context-close' in events and 'browser-close' in events


def test_full_record_overall_timeout_is_cooldown_eligible(monkeypatch):
    async def timeout(awaitable, timeout):
        awaitable.close()
        raise asyncio.TimeoutError()
    monkeypatch.setattr(scraper.asyncio, 'wait_for', timeout)
    result = asyncio.run(scraper._scrape_anyror_data('A', 'B', 'C', '1'))
    assert result['code'] == 'PORTAL_UNAVAILABLE'


def test_matched_location_child_timeout_triggers_cooldown_not_missing_location(monkeypatch):
    from scrape_control import PortalGate
    events = []
    class Option:
        async def text_content(self): return 'અમદાવાદ'
        async def get_attribute(self, name): return '7'
    class Locator:
        async def count(self): return 1
        def locator(self, *args): return self
        async def all(self): return [Option()]
    class Page:
        url = 'https://portal/LandRecordRural.aspx'
        async def goto(self, *args, **kwargs):
            events.append('navigation')
            return SimpleNamespace(status=200)
        async def wait_for_function(self, *args, **kwargs): return None
        async def select_option(self, selector, **kwargs): events.append('record-type')
        async def wait_for_timeout(self, *args): return None
        def locator(self, selector): return Locator()
    class Context:
        async def new_page(self): return Page()
        async def close(self): events.append('context-close')
    class Browser:
        async def new_context(self, **kwargs): return Context()
        async def close(self): events.append('browser-close')
    class Playwright:
        async def __aenter__(self): self.chromium = self; return self
        async def __aexit__(self, *args): pass
        async def launch(self, **kwargs): return Browser()
    async def child_timeout(*args):
        events.append('child-timeout')
        return False
    monkeypatch.setattr(scraper, 'async_playwright', Playwright)
    monkeypatch.setattr(scraper, '_select_and_wait_for_child', child_timeout)
    async def scenario():
        gate = PortalGate(interval=0, cooldown=300)
        result = await gate.run(lambda: scraper._scrape_anyror_data('Ahmedabad', 'Sanand', 'Test', '1'))
        assert result['code'] == 'PORTAL_UNAVAILABLE'
        assert 'not found' not in result['error'].lower()
        assert 'selected location' in result['error']
        assert gate.blocked_until > gate.clock()
        await gate.run(lambda: scraper._scrape_anyror_data('Ahmedabad', 'Sanand', 'Test', '1'))
    asyncio.run(scenario())
    assert events.count('navigation') == 1
    assert events.count('child-timeout') == 1
    assert 'browser-close' in events


def test_unmatched_input_remains_false_without_portal_failure(monkeypatch):
    class Option:
        async def text_content(self): return 'અમદાવાદ'
        async def get_attribute(self, name): return '7'
    class Locator:
        async def count(self): return 1
        def locator(self, *args): return self
        async def all(self): return [Option()]
    page = SimpleNamespace(locator=lambda selector: Locator())
    monkeypatch.setattr(scraper, '_translate_to_gujarati', AsyncMock(return_value=''))
    assert asyncio.run(scraper._select_cascading_option(page, '#district', 'Unmatched', 'District', '#taluka')) is False
