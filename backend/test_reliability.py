import asyncio

from scraper import _find_exact_survey_option, _count_populated_fields
from scrape_control import PortalGate
from durable_jobs import DurableJobStore


def test_survey_does_not_match_another_parcel():
    options = [('a', '123'), ('b', '12/A'), ('c', '12')]
    assert _find_exact_survey_option(options, '12') == 'c'
    assert _find_exact_survey_option(options[:2], '12') is None
    assert _find_exact_survey_option(options, '0012') == 'c'
    assert _find_exact_survey_option(options, '૧૨') == 'c'
    assert _find_exact_survey_option(options, '12/B') is None
    assert _find_exact_survey_option([('a', '12'), ('b', '012')], '12') is None


def test_malformed_extraction_is_not_a_record():
    assert _count_populated_fields([]) == 0
    assert _count_populated_fields({'owner_name': '—', 'area': None}) == 0


def test_portal_refusal_stops_followup_requests():
    async def scenario():
        now = [0.0]
        gate = PortalGate(interval=0, cooldown=30, clock=lambda: now[0])
        calls = []
        async def denied():
            calls.append(1)
            return {'code': 'PORTAL_UNAVAILABLE', 'error': 'refused'}
        await gate.run(denied)
        assert (await gate.run(denied))['code'] == 'PORTAL_UNAVAILABLE'
        assert len(calls) == 1
        now[0] = 31
        await gate.run(denied)
        assert len(calls) == 2
    asyncio.run(scenario())


def test_scrapes_are_serialized():
    async def scenario():
        gate = PortalGate(interval=0)
        active = 0
        peak = 0
        async def operation():
            nonlocal active, peak
            active += 1
            peak = max(peak, active)
            await asyncio.sleep(0.001)
            active -= 1
            return {'status': 'SUCCESS'}
        await asyncio.gather(*(gate.run(operation) for _ in range(5)))
        assert peak == 1
    asyncio.run(scenario())


def test_restart_preserves_reports_and_explains_interrupted_work(tmp_path):
    path = str(tmp_path / 'jobs.sqlite3')
    store = DurableJobStore(path)
    completed = store.create()
    store.finish(completed, {'record': {'owner_name': 'Test'}})
    running = store.create()
    store.update(running, status='running')
    store._db.close()
    restored = DurableJobStore(path)
    assert restored.get(completed)['result']['record']['owner_name'] == 'Test'
    assert restored.get(running)['status'] == 'error'
    assert 'restarted' in restored.get(running)['error']
    restored._db.close()


def test_chromium_closes_when_context_creation_fails(monkeypatch):
    import scraper
    closed = []
    class Browser:
        async def new_context(self, **kwargs):
            raise RuntimeError('context failed')
        async def close(self):
            closed.append(True)
    class Chromium:
        async def launch(self, **kwargs):
            return Browser()
    class Playwright:
        chromium = Chromium()
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
    monkeypatch.setattr(scraper, 'async_playwright', Playwright)
    result = asyncio.run(scraper._scrape_anyror_data('District', 'Taluka', 'Village', '12'))
    assert 'error' in result
    assert 'context failed' not in result['error']
    assert closed == [True]


def test_location_match_never_substitutes_city_or_similar_village():
    from scraper import _find_best_option
    assert _find_best_option([('city', 'Anand City')], 'Anand') is None
    assert _find_best_option([('city', 'આણંદ (શહેર)')], 'Anand') is None
    assert _find_best_option([('a', 'Kalol'), ('b', 'Kalol East')], 'Kal') is None
    assert _find_best_option([('a', 'Village 12')], 'Village 1') is None
    assert _find_best_option([('a', 'Kalol'), ('b', 'Kalol')], 'Kalol') is None
    assert _find_best_option([('a', '')], 'Kalol') is None
    assert _find_best_option([('a', 'Kalol')], '') is None


def test_location_match_preserves_known_english_gujarati_aliases():
    from scraper import _find_best_option
    assert _find_best_option([('a', 'અમદાવાદ')], 'Ahmedabad') == 'a'
    assert _find_best_option([('a', 'સાણંદ')], 'Sanand') == 'a'
    assert _find_best_option([('a', 'આણંદ'), ('b', 'આણંદ (શહેર)')], 'Anand City') == 'b'
    assert _find_best_option([('a', 'Detroj-Rampura')], ' detroj-rampura ') == 'a'


def test_placeholder_or_invalid_fields_cannot_qualify_as_extracted_record():
    assert _count_populated_fields({
        'owner_name': ' Unknown ', 'area': {}, 'tenure_type': [],
        'cultivation': False, 'mutation_entries': 'N/A',
    }) == 0
    assert _count_populated_fields({
        'owner_name': 'Example Owner', 'area': '1.5 ha', 'tenure_type': 'Old tenure',
    }) == 3


def test_extraction_removes_search_controls_before_truncating_html():
    from scraper import _record_html
    html = ('<INPUT type="hidden" value="' + 'x' * 16000 + '">'
            '<SELECT><option>Wrong owner from another parcel</option></SELECT>'
            '<SCRIPT>untrusted code</SCRIPT><STYLE>irrelevant styles</STYLE>'
            '<table><tr><td>Actual record owner</td></tr></table>')
    cleaned = _record_html(html)
    assert 'Actual record owner' in cleaned
    assert 'Wrong owner' not in cleaned
    assert 'untrusted code' not in cleaned
    assert 'irrelevant styles' not in cleaned


def test_extracted_identity_must_match_requested_survey():
    from scraper import _record_identity_error
    assert _record_identity_error({'survey_no': '૦૧૨/A'}, '12/a', 'VF7') is None
    assert _record_identity_error({'survey_no': '123'}, '12', 'VF7')['code'] == 'RECORD_IDENTITY_MISMATCH'
    assert _record_identity_error({'survey_no': '12/A'}, '12', 'OLD_SCAN_712')['code'] == 'RECORD_IDENTITY_MISMATCH'
    for missing in [None, '—', '', 'Unknown', [], 12]:
        assert _record_identity_error({'survey_no': missing}, '12', 'VF7')['code'] == 'RECORD_IDENTITY_UNVERIFIED'
    # An entry number or khata number is not a survey number.
    assert _record_identity_error({'survey_no': '123'}, '12', 'VF6') is None
    assert _record_identity_error({'survey_no': '123'}, '12', 'VF8A') is None
