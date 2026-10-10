"""Village availability tests without portal, Supabase or Gemini requests."""
import asyncio
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import main
import scraper
import scrape_control


@pytest.fixture
def portal(monkeypatch):
    state = {'launches': 0, 'closed': [], 'status': 200, 'error': None, 'context_error': False}
    monkeypatch.setattr(scraper, '_village_cache', {})
    monkeypatch.setattr(scraper, '_get_supabase_or_none', lambda: None)
    class LazyGate:
        gate = None
        async def run(self, operation):
            if self.gate is None:
                self.gate = scrape_control.PortalGate(interval=0, cooldown=300)
            return await self.gate.run(operation)
    monkeypatch.setattr(scrape_control, 'portal_gate', LazyGate())

    class Option:
        async def text_content(self):
            return 'સાણંદ'
        async def get_attribute(self, name):
            return '1'

    class Page:
        async def evaluate(self, *args): pass
        async def wait_for_function(self, *args, **kwargs): pass
        async def select_option(self, **kwargs):
            assert kwargs['value'] == scraper.RECORD_TYPE_MAP['VF7']
            state['type_selected'] = True
        async def goto(self, *args, **kwargs):
            assert kwargs['timeout'] == 20000
            if state['error']:
                raise state['error']
            return SimpleNamespace(status=state['status'])
        def locator(self, *args):
            return self
        async def all(self):
            return [Option()]

    class Context:
        async def new_page(self):
            return Page()
        async def close(self):
            state['closed'].append('context')

    class Browser:
        async def new_context(self, **kwargs):
            if state['context_error']:
                raise RuntimeError('cannot create context')
            return Context()
        async def close(self):
            state['closed'].append('browser')

    class Playwright:
        chromium = None
        async def launch(self, **kwargs):
            state['launches'] += 1
            return Browser()
        async def __aenter__(self):
            self.chromium = self
            return self
        async def __aexit__(self, *args):
            pass

    async def ready(*args, **kwargs):
        return True
    async def cascade(*args, **kwargs):
        assert state.get('type_selected'), 'Record type must precede all location selections'
        return True
    async def translated(*args, **kwargs):
        return [{'english': 'Sanand', 'gujarati': 'સાણંદ'}]
    monkeypatch.setattr(scraper, 'async_playwright', Playwright)
    monkeypatch.setattr(scraper, '_wait_for_dropdown_options', ready)
    monkeypatch.setattr(scraper, '_select_cascading_option', cascade)
    monkeypatch.setattr(scraper, '_batch_translate_villages', translated)
    return state


@pytest.mark.parametrize('status', [403, 429, 503])
def test_refusal_returns_503_and_cooldown_prevents_next_browser(portal, status):
    portal['status'] = status
    client = TestClient(main.app)
    for _ in range(2):
        response = client.get('/options/villages?district=Ahmedabad&taluka=Sanand')
        assert response.status_code == 503
        assert 'upload an official record' in response.json()['detail']
    assert portal['launches'] == 1
    assert portal['closed'] == ['context', 'browser']


def test_navigation_timeout_is_unavailable_not_empty_success(portal):
    portal['error'] = asyncio.TimeoutError('upstream timeout')
    response = TestClient(main.app).get('/options/villages?district=Ahmedabad&taluka=Sanand')
    assert response.status_code == 503
    assert 'villages' not in response.json()
    assert portal['closed'] == ['context', 'browser']


def test_context_initialization_failure_closes_browser(portal):
    portal['context_error'] = True
    with pytest.raises(scraper.VillageLookupUnavailable):
        asyncio.run(scraper.fetch_villages('Ahmedabad', 'Sanand'))
    assert portal['closed'] == ['browser']


def test_successful_names_cached_and_available_even_during_cooldown(portal):
    async def scenario():
        villages = await scraper.fetch_villages('Ahmedabad', 'Sanand')
        assert villages == [{'english': 'Sanand', 'gujarati': 'સાણંદ'}]
        scrape_control.portal_gate.gate.blocked_until = float('inf')
        assert await scraper.fetch_villages('Ahmedabad', 'Sanand') == villages
    asyncio.run(scenario())
    assert portal['launches'] == 1


def test_successful_endpoint_preserves_list_contract(portal):
    response = TestClient(main.app).get('/options/villages?district=Ahmedabad&taluka=Sanand')
    assert response.status_code == 200
    assert response.json() == {'district': 'Ahmedabad', 'taluka': 'Sanand',
                               'villages': [{'english': 'Sanand', 'gujarati': 'સાણંદ'}]}


def test_translation_timeout_retains_real_gujarati_options(portal, monkeypatch):
    async def timed_out(*args):
        raise asyncio.TimeoutError()
    monkeypatch.setattr(scraper, '_batch_translate_villages', timed_out)
    villages = asyncio.run(scraper.fetch_villages('Ahmedabad', 'Sanand'))
    assert villages == [{'english': 'સાણંદ', 'gujarati': 'સાણંદ'}]


def test_overall_portal_timeout_closes_browser_and_enters_cooldown(portal, monkeypatch):
    async def stuck(*args, **kwargs):
        await asyncio.Event().wait()
    monkeypatch.setattr(scraper, '_select_cascading_option', stuck)
    original = asyncio.wait_for
    async def short_wait_for(awaitable, timeout):
        return await original(awaitable, timeout=0.005 if timeout == 40.0 else timeout)
    monkeypatch.setattr(scraper.asyncio, 'wait_for', short_wait_for)
    response = TestClient(main.app).get('/options/villages?district=Ahmedabad&taluka=Sanand')
    assert response.status_code == 503
    assert portal['closed'] == ['context', 'browser']
    assert scrape_control.portal_gate.gate.blocked_until > scrape_control.portal_gate.gate.clock()
