"""Application authorization tests using a service-role-style fake database.

The fake deliberately applies no RLS; security must come from API predicates.
Production RLS/storage isolation still needs a live two-account acceptance test.
"""
from copy import deepcopy
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

A = 'd2f5b917-9289-4f60-909b-1b829f43e47a'
B = '6b4b0b34-493f-43ed-a65f-0b43c404e32d'
PARCEL = dict(district='Ahmedabad', taluka='City', village='Test', survey_no='12', record_type='OLD_SCAN_712')


class Query:
    def __init__(self, db, name):
        self.db, self.name, self.filters, self.operation, self.payload = db, name, [], 'select', None
    def select(self, *args): return self
    def order(self, *args, **kwargs): return self
    def limit(self, *args): return self
    def gte(self, *args): return self
    def eq(self, key, value):
        self.filters.append(lambda row: row.get(key) == value)
        return self
    def in_(self, key, values):
        self.filters.append(lambda row: row.get(key) in values)
        return self
    def insert(self, payload):
        self.operation, self.payload = 'insert', payload
        return self
    def delete(self):
        self.operation = 'delete'
        return self
    def update(self, payload):
        self.operation, self.payload = 'update', payload
        return self
    def execute(self):
        rows = self.db.rows.setdefault(self.name, [])
        selected = [row for row in rows if all(f(row) for f in self.filters)]
        if self.operation == 'insert':
            row = dict(id='new-' + self.name, **self.payload)
            rows.append(row)
            selected = [row]
        elif self.operation == 'delete':
            self.db.rows[self.name] = [row for row in rows if row not in selected]
        elif self.operation == 'update':
            for row in selected: row.update(self.payload)
        return SimpleNamespace(data=deepcopy(selected))


class Database:
    def __init__(self):
        self.rows = {
            'watchlist': [dict(id='watch-a', owner_id=A, user_email='a@example.com', **PARCEL)],
            'watchlist_alerts': [dict(id='alert-a', watchlist_id='watch-a', changes={'owner': 'changed'}, seen=False)],
            'manual_orders': [dict(id='order-a', owner_id=A, user_email='a@example.com', state='GJ', sku='certified_712_index2', price_inr=1500, status='pending', **{k:v for k,v in PARCEL.items() if k != 'record_type'})],
        }
        self.auth = SimpleNamespace(get_user=self.get_user)
    def get_user(self, token):
        identity = {'token-a': (A, 'a@example.com'), 'token-b': (B, 'b@example.com')}.get(token)
        user = SimpleNamespace(id=identity[0], email=identity[1], email_confirmed_at='2026-10-03') if identity else None
        return SimpleNamespace(user=user)
    def table(self, name): return Query(self, name)


@pytest.fixture()
def setup(monkeypatch):
    import main
    from title_report import JobStore
    db = Database()
    monkeypatch.setattr(main, '_get_supabase', lambda: db)
    monkeypatch.setattr(main, 'JOBS', JobStore())
    with TestClient(main.app) as client:
        yield main, db, client


def headers(account='a'): return {'Authorization': f'Bearer token-{account}'}


@pytest.mark.parametrize('method,path,payload', [
    ('get', '/watchlist?email=a@example.com', None),
    ('get', '/watchlist/alerts?email=a@example.com', None),
    ('delete', '/watchlist/watch-a?email=a@example.com', None),
    ('post', '/watchlist/watch-a/alerts/seen', None),
    ('get', '/manual-orders?email=a@example.com', None),
    ('post', '/watchlist', dict(email='a@example.com', **PARCEL)),
    ('post', '/manual-orders', dict(email='a@example.com', sku='certified_712_index2', **PARCEL)),
    ('post', '/jobs/title-report', PARCEL),
    ('post', '/fetch-anyror', PARCEL),
    ('get', '/credits?email=a@example.com', None),
])
def test_anonymous_private_routes_fail_without_mutations(setup, method, path, payload):
    _, db, client = setup
    before = deepcopy(db.rows)
    response = client.request(method, path, json=payload)
    assert response.status_code == 401
    assert db.rows == before


def test_other_account_cannot_claim_email_or_access_rows(setup):
    _, db, client = setup
    assert client.get('/watchlist?email=a@example.com', headers=headers('b')).status_code == 403
    assert client.get('/watchlist', headers=headers('b')).json() == {'items': []}
    assert client.get('/manual-orders', headers=headers('b')).json() == {'orders': []}
    assert client.get('/watchlist/alerts', headers=headers('b')).json() == {'alerts': []}
    assert client.delete('/watchlist/watch-a', headers=headers('b')).status_code == 404
    assert client.post('/watchlist/watch-a/alerts/seen', headers=headers('b')).status_code == 404
    assert db.rows['watchlist_alerts'][0]['seen'] is False


def test_owner_reads_alerts_marks_seen_and_deletes(setup):
    _, _, client = setup
    assert len(client.get('/watchlist', headers=headers()).json()['items']) == 1
    assert len(client.get('/watchlist/alerts', headers=headers()).json()['alerts']) == 1
    assert client.post('/watchlist/watch-a/alerts/seen', headers=headers()).json() == {'updated': 1}
    assert client.delete('/watchlist/watch-a', headers=headers()).status_code == 200


def test_new_watch_and_order_owner_is_server_identity(setup):
    _, db, client = setup
    response = client.post('/watchlist', headers=headers('b'), json=dict(email='b@example.com', **PARCEL))
    assert response.status_code == 200
    assert db.rows['watchlist'][-1]['owner_id'] == B
    response = client.post('/manual-orders', headers=headers('b'), json=dict(email='b@example.com', sku='certified_712_index2', **PARCEL))
    assert response.status_code == 200
    assert db.rows['manual_orders'][-1]['owner_id'] == B
    assert client.post('/watchlist', headers=headers('b'), json=dict(email='a@example.com', **PARCEL)).status_code == 403


def test_private_job_polling_rejects_other_user_and_legacy_unowned_jobs(setup):
    main, _, client = setup
    job = main.JOBS.create(meta={'owner_id': A})
    main.JOBS.finish(job, {'private': 'case data'})
    assert client.get(f'/jobs/{job}').status_code == 401
    assert client.get(f'/jobs/{job}', headers=headers('b')).status_code == 404
    assert client.get(f'/jobs/{job}', headers=headers()).json()['result']['private'] == 'case data'
    legacy = main.JOBS.create()
    assert client.get(f'/jobs/{legacy}', headers=headers()).status_code == 404


def test_cached_report_is_scoped_to_owner_and_new_job_has_owner(setup, monkeypatch):
    main, db, client = setup
    key = main._location_key('Ahmedabad', 'City', 'Test', '12')
    report = {'coverage': {'assessment_version': 2, 'chain_requested': True}, 'private': 'A only'}
    db.rows['title_reports'] = [dict(id='report-a', owner_id=A, location_key=key, record_type='OLD_SCAN_712', report=report)]
    req = main.TitleReportJobRequest(**PARCEL)
    assert main._get_cached_title_report(req, B) is None
    assert main._get_cached_title_report(req) is None
    response = client.post('/jobs/title-report', headers=headers(), json=PARCEL)
    assert response.status_code == 202
    job = main.JOBS.get(response.json()['job_id'])
    assert job['meta']['owner_id'] == A
    assert job['result']['private'] == 'A only'


def test_checkout_identity_is_checked_before_payment_provider(setup, monkeypatch):
    main, _, client = setup
    monkeypatch.setattr(main, 'STRIPE_ENABLED', True)
    monkeypatch.setattr(main, '_get_stripe', lambda: pytest.fail('provider must not be reached'))
    assert client.post('/create-checkout-session', json={'email':'a@example.com'}).status_code == 401
    assert client.post('/create-checkout-session', headers=headers('b'), json={'email':'a@example.com'}).status_code == 403
