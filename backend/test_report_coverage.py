"""Evidence completeness and cache regressions; all services are mocked."""
import asyncio
from types import SimpleNamespace
import pytest
from title_report import compute_risk, fallback_chain_from_entries, JobStore

@pytest.mark.parametrize('missing', ['—', 'unknown', 'N/A', '', None])
def test_unknown_record_never_clears(missing):
    risk = compute_risk({'tenure_type': missing, 'encumbrances': missing}, [])
    assert risk['verdict'] == 'CAUTION'
    assert risk['score'] == 0  # missing evidence is not an invented adverse finding
    assert {c['name']: c['status'] for c in risk['checks']}['encumbrances'] == 'unavailable'


def test_skeleton_chain_never_passes_continuity():
    risk = compute_risk({'tenure_type': 'Old Tenure', 'encumbrances': 'None'},
                        fallback_chain_from_entries(['51', '52']))
    checks = {c['name']: c['status'] for c in risk['checks']}
    assert checks['ownership_churn'] == checks['chain_continuity'] == 'unavailable'
    assert risk['verdict'] == 'CAUTION'

@pytest.fixture
def api(monkeypatch):
    import main
    monkeypatch.setattr(main, 'JOBS', JobStore())
    monkeypatch.setattr(main, 'STRIPE_ENABLED', False)
    monkeypatch.setattr(main, '_get_supabase', lambda: None)
    monkeypatch.setattr(main, 'structure_chain_with_gemini', lambda *args: [])
    return main

@pytest.mark.parametrize('include_chain,fail,cap,expected', [
    (True, False, 5, (3, 0, 0, True)),
    (True, True, 5, (2, 1, 0, False)),
    (True, False, 1, (1, 0, 2, False)),
    (False, False, 5, (0, 0, 3, False)),
])
def test_report_tracks_retrieved_failed_and_unattempted(api, monkeypatch, include_chain, fail, cap, expected):
    async def scrape(**kwargs):
        if kwargs['record_type'] == 'VF6':
            if fail and kwargs['survey_number'] == '52':
                return {'error': 'Unavailable'}
            return {'mutation_entries': 'Entry detail', 'owner_name': 'Test Owner'}
        return {'owner_name': 'Test Owner', 'tenure_type': 'Old Tenure',
                'encumbrances': 'None', 'mutation_entries': 'Entry 51, entry 52, entry 53'}
    monkeypatch.setattr(api, 'scrape_anyror_data', scrape)
    monkeypatch.setattr(api, 'MAX_VF6_FETCHES', cap)
    req = api.TitleReportJobRequest(district='Ahmedabad', taluka='City', village='Test', survey_no='12', include_chain=include_chain)
    jid = api.JOBS.create()
    asyncio.run(api._run_title_report_job(jid, req, ''))
    report = api.JOBS.get(jid)['result']
    coverage = report['coverage']
    assert coverage['mutation_entries_identified'] == 3
    assert tuple(coverage[k] for k in ('mutation_records_retrieved','mutation_records_failed','mutation_records_not_attempted','chain_complete')) == expected
    if not expected[-1]:
        assert report['risk']['verdict'] != 'CLEAR'

@pytest.mark.parametrize('coverage,include_chain,hit', [
    (None, True, False),
    ({'assessment_version': 2, 'chain_requested': False}, True, False),
    ({'assessment_version': 2, 'chain_requested': True}, True, True),
    ({'assessment_version': 2, 'chain_requested': False}, False, True),
])
def test_cache_respects_assessment_version_and_requested_scope(api, monkeypatch, coverage, include_chain, hit):
    report = {'coverage': coverage}
    class Query:
        def __getattr__(self, name):
            return lambda *args, **kwargs: self
        def execute(self):
            return SimpleNamespace(data=[{'report': report}])
    monkeypatch.setattr(api, '_get_supabase', Query)
    req = api.TitleReportJobRequest(district='A', taluka='B', village='C', survey_no='12', include_chain=include_chain)
    assert (api._get_cached_title_report(req, "test-owner") is not None) is hit


def test_missing_neighbouring_entries_do_not_hide_known_risks():
    chain = fallback_chain_from_entries(['51', '52'])
    chain[0]['flags'] = ['RECENT_CHURN', 'CHAIN_GAP']
    risk = compute_risk({'tenure_type': 'Old Tenure', 'encumbrances': 'None'}, chain)
    statuses = {c['name']: c['status'] for c in risk['checks']}
    assert statuses['ownership_churn'] == statuses['chain_continuity'] == 'warn'
    assert risk['score'] == 35
