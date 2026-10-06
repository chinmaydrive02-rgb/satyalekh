"""Saved-report HTTP acceptance using synthetic sources and a database without RLS."""
from copy import deepcopy
import hashlib
import json
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from test_anyror_vf7_reader import fixture as vf7_fixture
from test_mutation_upload_flow import matched_mutation, review_payload
from test_reviewed_report_store import Database, A, B


def headers(account="a"):
    return {"Authorization": f"Bearer synthetic-token-{account}"}


@pytest.fixture
def api(monkeypatch):
    import main
    db = Database()
    auth_calls = []

    def get_user(token):
        auth_calls.append(token)
        identity = {"synthetic-token-a": A, "synthetic-token-b": B}.get(token)
        user = SimpleNamespace(id=identity.user_id, email=identity.email,
                               email_confirmed_at="2026-10-06T00:00:00Z") if identity else None
        return SimpleNamespace(user=user)

    db.auth = SimpleNamespace(get_user=get_user)
    monkeypatch.setattr(main, "RATE_LIMITS_DISABLED", True)
    monkeypatch.setattr(main, "_get_supabase", lambda: db)
    monkeypatch.setenv("DOCUMENT_READER", "gemini")
    monkeypatch.delenv("GEMINI_PERSONAL_DATA_APPROVED", raising=False)
    monkeypatch.setattr(main.genai, "Client", lambda *args, **kwargs: pytest.fail("No external generation allowed"))
    with TestClient(main.app) as client:
        yield main, db, client, auth_calls


def submit(client, *, save=True, account="a", mutations=True, extra=None, request_headers=None, review=None):
    files = [("file", ("synthetic-vf7.html", vf7_fixture(), "text/html"))]
    if mutations:
        files.append(("mutation_files", ("synthetic-vf6.html", matched_mutation(), "text/html")))
    data = {"review": review or review_payload(), "save_to_account": str(save).lower(), **(extra or {})}
    return client.post("/review-record", files=files, data=data,
                       headers=request_headers if request_headers is not None else (headers(account) if account else {}))


def test_anonymous_save_is_rejected_before_reading_or_database_mutation(api, monkeypatch):
    main, db, client, auth_calls = api
    async def unexpected_read(*args): pytest.fail("Anonymous save must not read source")
    monkeypatch.setattr(main, "_read_uploaded_locally", unexpected_read)
    response = submit(client, account=None)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert not db.rows and not db.queries and not auth_calls
    assert client.get("/reports").status_code == 401
    assert client.get(f"/reports/{uuid4()}").status_code == 401
    assert not db.queries


def test_anonymous_preview_requires_neither_authentication_nor_storage(api, monkeypatch):
    main, _, client, _ = api
    def forbidden(*args, **kwargs): pytest.fail("Preview must remain independent of accounts and storage")
    monkeypatch.setattr(main, "_account_identity", forbidden)
    monkeypatch.setattr(main, "_get_supabase", forbidden)
    response = submit(client, save=False, account=None)
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "reviewed_preliminary"
    assert "saved_report_id" not in response.json()
    assert response.json()["metadata"]["external_processing"] is False


def test_authenticated_source_bundle_round_trips_through_list_and_detail(api):
    _, db, client, auth_calls = api
    response = submit(client)
    assert response.status_code == 200, response.text
    analysis = response.json()
    ident = analysis["saved_report_id"]
    assert analysis["saved_at"]
    assert db.rows[0]["owner_id"] == A.user_id
    assert db.rows[0]["user_email"] == A.email
    assert analysis["metadata"]["source_sha256"] == hashlib.sha256(vf7_fixture()).hexdigest()
    assert analysis["report"]["supporting_records"][0]["metadata"]["source_sha256"] == hashlib.sha256(matched_mutation()).hexdigest()
    listing = client.get("/reports?limit=1", headers=headers())
    assert listing.status_code == 200
    assert listing.json()["reports"][0]["id"] == ident
    assert "report" not in listing.json()["reports"][0]
    reopened = client.get(f"/reports/{ident}", headers=headers())
    assert reopened.status_code == 200
    report = reopened.json()["report"]
    expected = deepcopy(analysis["report"])
    expected["source_review_metadata"] = analysis["metadata"]
    expected["source_review_evidence"] = analysis["evidence"]
    assert report == expected
    assert report["coverage"]["chain_complete"] is False
    assert report["coverage"]["official_source_verified"] is False
    assert report["risk"]["verdict"] != "CLEAR"
    assert report["chain_of_title"][0]["from_party"] == report["chain_of_title"][0]["to_party"] == ""
    assert auth_calls == ["synthetic-token-a"] * 3


def test_other_accounts_and_unowned_or_official_records_are_inaccessible(api):
    _, db, client, _ = api
    saved = submit(client).json()["saved_report_id"]
    assert client.get("/reports", headers=headers("b")).json() == {"reports": []}
    assert client.get(f"/reports/{saved}", headers=headers("b")).status_code == 404
    db.rows[0]["owner_id"] = None
    assert client.get(f"/reports/{saved}", headers=headers()).status_code == 404
    db.rows[0]["owner_id"] = A.user_id
    db.rows[0]["record_type"] = "OLD_SCAN_712"
    assert client.get(f"/reports/{saved}", headers=headers()).status_code == 404
    assert client.get("/reports", headers=headers()).json() == {"reports": []}


def test_client_metadata_and_email_cannot_forge_saved_identity_or_source(api):
    _, db, client, _ = api
    forged = {"source_sha256": "0" * 64, "official_source_verified": True, "owner_id": A.user_id}
    response = submit(client, account="b", extra={
        "owner_id": A.user_id, "email": A.email, "user_email": A.email,
        "metadata": json.dumps(forged), "report": json.dumps({"risk": {"verdict": "CLEAR"}}),
        "analysis": json.dumps({"owner_name": "FORGED SOURCE"}), "district": "FORGED LOCATION",
    }, request_headers={**headers("b"), "X-User-Email": A.email})
    assert response.status_code == 200, response.text
    row = db.rows[0]
    assert row["owner_id"] == B.user_id and row["user_email"] == B.email
    assert row["report"]["source_document"]["sha256"] == hashlib.sha256(vf7_fixture()).hexdigest()
    assert row["report"]["source_review_metadata"]["official_source_verified"] is False
    assert "FORGED" not in json.dumps(row)
    assert row["report"]["risk"]["verdict"] != "CLEAR"
    ident = response.json()["saved_report_id"]
    assert client.get(f"/reports/{ident}", headers=headers()).status_code == 404
    assert client.get(f"/reports/{ident}?email={A.email}", headers=headers("b")).status_code == 200


def test_forged_metadata_inside_review_is_rejected_without_saving(api):
    _, db, client, _ = api
    review = json.loads(review_payload())
    review["metadata"] = {"official_source_verified": True}
    response = submit(client, review=json.dumps(review))
    assert response.status_code == 422
    assert not db.rows and not db.queries


@pytest.mark.parametrize("path", ["/reports/not-a-uuid", "/reports/123", "/reports?limit=0", "/reports?limit=51", "/reports?limit=-1", "/reports?limit=abc", "/reports?offset=-1", "/reports?offset=10001", "/reports?offset=abc"])
def test_invalid_id_and_limit_are_rejected_before_database_queries(api, path):
    _, db, client, _ = api
    assert client.get(path, headers=headers()).status_code == 422
    assert not db.queries


@pytest.mark.parametrize("operation", ["save", "list", "detail"])
@pytest.mark.parametrize("failure", ["missing", "unavailable"])
def test_missing_or_failed_storage_never_returns_success(api, monkeypatch, operation, failure):
    main, db, client, _ = api
    # Isolate storage failure after a verified account; auth failures are checked separately.
    monkeypatch.setattr(main, "_account_identity", lambda *_: A)
    if failure == "missing": monkeypatch.setattr(main, "_get_supabase", lambda: None)
    else: db.fail = True
    if operation == "save": response = submit(client)
    elif operation == "list": response = client.get("/reports", headers=headers())
    else: response = client.get(f"/reports/{uuid4()}", headers=headers())
    assert response.status_code == 503
    assert "saved_report_id" not in response.json()
    assert "secret" not in response.text and "private source" not in response.text
    assert not db.rows


def test_absent_auth_verifier_fails_before_source_read(api, monkeypatch):
    main, _, client, _ = api
    monkeypatch.setattr(main, "_get_supabase", lambda: None)
    async def forbidden(*args): pytest.fail("Unavailable verifier must stop save before source processing")
    monkeypatch.setattr(main, "_read_uploaded_locally", forbidden)
    assert submit(client).status_code == 503


def test_empty_insert_acknowledgement_does_not_claim_saved(api):
    _, db, client, _ = api
    db.empty_response = True
    response = submit(client)
    assert response.status_code == 503
    assert "saved_report_id" not in response.json()


def test_portal_health_is_passive_and_does_not_expose_record_inputs(api, monkeypatch):
    import portal_diagnostics
    import scraper
    import socket
    main, _, client, _ = api
    def forbidden(*args, **kwargs): pytest.fail("Passive health must not access external systems")
    monkeypatch.setattr(main, "_get_supabase", forbidden)
    monkeypatch.setattr(main, "_account_identity", forbidden)
    monkeypatch.setattr(scraper, "async_playwright", forbidden)
    monkeypatch.setattr(scraper, "get_gemini_client", forbidden)
    monkeypatch.setattr(socket, "create_connection", forbidden)
    monkeypatch.setattr(portal_diagnostics, "_latest", None)
    monkeypatch.setattr(portal_diagnostics, "_latest_at", None)
    assert client.get("/health/portal").json() == {"observed": False}
    portal_diagnostics.record_portal_observation(stage="navigation", outcome="unavailable",
        failure_kind="deadline", elapsed_ms=20000, timeout_ms=20000, district="PRIVATE", url="SECRET")
    response = client.get("/health/portal")
    assert response.status_code == 200
    assert response.json()["stage"] == "navigation"
    assert response.json()["failure_kind"] == "deadline"
    assert "PRIVATE" not in response.text and "SECRET" not in response.text


def test_http_pagination_returns_disjoint_account_scoped_pages(api):
    _, db, client, _ = api
    from reviewed_report_store import save_reviewed_report
    analysis = submit(client, save=False, account=None).json()
    for _ in range(3): save_reviewed_report(db, A, analysis)
    for _ in range(2): save_reviewed_report(db, B, analysis)
    first = client.get('/reports?limit=2&offset=0', headers=headers()).json()['reports']
    second = client.get('/reports?limit=2&offset=2', headers=headers()).json()['reports']
    assert len(first) == 2 and len(second) == 1
    assert {row['id'] for row in first}.isdisjoint({row['id'] for row in second})
    assert client.get('/reports?limit=2&offset=3', headers=headers()).json() == {'reports': []}
