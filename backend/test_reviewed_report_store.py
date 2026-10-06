"""Service-role-style fake: every ownership constraint must be in the query."""
from copy import deepcopy
from types import SimpleNamespace
from uuid import uuid4

from fastapi import HTTPException
import pytest

from authentication import AuthenticatedUser
from local_record_bundle import attach_mutation_records
from reviewed_report_store import save_reviewed_report, get_reviewed_reports, get_reviewed_report
from test_local_record_bundle import primary, mutation

A = AuthenticatedUser("d2f5b917-9289-4f60-909b-1b829f43e47a", "a@example.com")
B = AuthenticatedUser("6b4b0b34-493f-43ed-a65f-0b43c404e32d", "b@example.com")


class Query:
    def __init__(self, db):
        self.db, self.filters, self.payload, self.fields, self.maximum = db, [], None, None, None
        self.orders, self.bounds = [], None
    def insert(self, payload):
        self.payload = payload
        return self
    def select(self, fields):
        self.fields = fields
        return self
    def eq(self, field, value):
        self.filters.append((field, value))
        return self
    def order(self, field, desc=False):
        self.orders.append((field, desc))
        return self
    def range(self, start, end):
        self.bounds = (start, end)
        return self
    def limit(self, limit):
        self.maximum = limit
        return self
    def execute(self):
        self.db.queries.append(self)
        if self.db.fail:
            raise RuntimeError("private source and service-role secret must never leak")
        if self.db.empty_response:
            return SimpleNamespace(data=[])
        if self.payload is not None:
            row = {"id": str(uuid4()), "created_at": "2026-10-06T01:00:00+00:00", **deepcopy(self.payload)}
            self.db.rows.append(row)
            return SimpleNamespace(data=[deepcopy(row)])
        rows = [deepcopy(row) for row in self.db.rows if all(row.get(k) == v for k, v in self.filters)]
        for field, desc in reversed(self.orders):
            rows.sort(key=lambda row: row.get(field, ""), reverse=desc)
        if self.bounds is not None:
            rows = rows[self.bounds[0]:self.bounds[1] + 1]
        if self.maximum is not None:
            rows = rows[:self.maximum]
        if self.fields:
            rows = [{k: row.get(k) for k in self.fields.split(",")} for row in rows]
        return SimpleNamespace(data=rows)


class Database:
    def __init__(self):
        self.rows, self.queries, self.fail, self.empty_response = [], [], False, False
    def table(self, table):
        assert table == "title_reports"
        return Query(self)


def test_full_bundle_and_review_metadata_round_trip_without_input_mutation():
    db = Database()
    analysis = attach_mutation_records(primary(), [mutation()])
    analysis["metadata"]["review_changes"] = [{"field": "owner_name", "machine_value": "Synthetic source", "reviewed_value": "Synthetic reviewed"}]
    before = deepcopy(analysis)
    saved = save_reviewed_report(db, A, analysis)
    assert set(saved) == {"id", "created_at"}
    reopened = get_reviewed_report(db, A, saved["id"])
    assert analysis == before
    assert reopened["id"] == saved["id"]
    assert reopened["report"]["source_review_metadata"] == before["metadata"]
    assert reopened["report"]["source_review_evidence"] == before["evidence"]
    for key, value in before["report"].items():
        assert reopened["report"][key] == value
    assert reopened["report"]["coverage"]["chain_complete"] is False
    assert reopened["report"]["supporting_records"][0]["metadata"]["source_sha256"] == mutation()["metadata"]["source_sha256"]
    assert db.rows[0]["owner_id"] == A.user_id
    assert db.rows[0]["user_email"] == A.email
    assert db.rows[0]["record_type"] == "UPLOADED_RECORD"
    assert db.rows[0]["location_key"].startswith("user_source|")
    assert db.queries[-1].filters == [("id", saved["id"]), ("owner_id", A.user_id), ("record_type", "UPLOADED_RECORD")]


def test_authenticated_identity_wins_over_any_analysis_identity_fields():
    db, analysis = Database(), primary()
    analysis.update(owner_id=B.user_id, user_email=B.email)
    analysis["report"].update(owner_id=B.user_id, user_email=B.email)
    save_reviewed_report(db, A, analysis)
    assert db.rows[0]["owner_id"] == A.user_id
    assert db.rows[0]["user_email"] == A.email


def test_cross_account_and_unowned_records_invisible():
    db = Database()
    saved = save_reviewed_report(db, A, primary())
    assert get_reviewed_reports(db, B) == []
    with pytest.raises(HTTPException) as exc:
        get_reviewed_report(db, B, saved["id"])
    assert exc.value.status_code == 404
    db.rows[0]["owner_id"] = None
    assert get_reviewed_reports(db, A) == []
    with pytest.raises(HTTPException) as exc:
        get_reviewed_report(db, A, saved["id"])
    assert exc.value.status_code == 404


def test_list_is_lightweight_owned_and_bounded_and_excludes_official_cache():
    db = Database()
    save_reviewed_report(db, A, primary())
    save_reviewed_report(db, A, primary())
    save_reviewed_report(db, B, primary())
    official = {**deepcopy(db.rows[0]), "id": str(uuid4()), "record_type": "OLD_SCAN_712"}
    db.rows.insert(0, official)
    rows = get_reviewed_reports(db, A, limit=1)
    expected = max(row["id"] for row in db.rows if row["owner_id"] == A.user_id and row["record_type"] == "UPLOADED_RECORD")
    assert len(rows) == 1 and rows[0]["id"] == expected
    assert set(rows[0]) == {"id", "created_at", "district", "taluka", "village", "survey_no", "record_type"}
    assert "report" not in db.queries[-1].fields.split(",")
    assert db.queries[-1].orders == [("created_at", True), ("id", True)]
    assert db.queries[-1].bounds == (0, 0)
    with pytest.raises(HTTPException) as exc:
        get_reviewed_report(db, A, official["id"])
    assert exc.value.status_code == 404


def test_source_location_missing_uses_hash_without_inventing_location():
    db, analysis = Database(), primary()
    for key in ("district", "taluka", "village"):
        analysis["report"]["record"].pop(key, None)
    analysis["report"]["record"]["district"] = "Unknown"
    save_reviewed_report(db, A, analysis)
    row = db.rows[0]
    assert row["district"] is row["taluka"] is row["village"] is None
    assert row["location_key"] == "user_source|sha256|" + analysis["report"]["source_document"]["sha256"]


def test_source_key_cannot_collide_with_shared_cache_or_separator_labels():
    db, analysis = Database(), primary()
    record = analysis["report"]["record"]
    record.update(district="A|B", taluka="C", village="D")
    save_reviewed_report(db, A, analysis)
    record.update(district="A", taluka="B|C", village="D")
    save_reviewed_report(db, A, analysis)
    assert db.rows[0]["location_key"] != db.rows[1]["location_key"]
    assert all(row["location_key"].startswith("user_source|") for row in db.rows)
    assert all(row["record_type"] != "OLD_SCAN_712" for row in db.rows)


@pytest.mark.parametrize("operation", ["save", "list", "detail"])
@pytest.mark.parametrize("missing", [False, True])
def test_database_failure_is_safe_503(operation, missing):
    db = Database()
    db.fail = True
    if missing:
        db = None
    with pytest.raises(HTTPException) as exc:
        if operation == "save":
            save_reviewed_report(db, A, primary())
        elif operation == "list":
            get_reviewed_reports(db, A)
        else:
            get_reviewed_report(db, A, str(uuid4()))
    assert exc.value.status_code == 503
    assert "secret" not in exc.value.detail and "private source" not in exc.value.detail


def test_empty_insert_acknowledgement_never_claims_saved():
    db = Database()
    db.empty_response = True
    with pytest.raises(HTTPException) as exc:
        save_reviewed_report(db, A, primary())
    assert exc.value.status_code == 503


@pytest.mark.parametrize("change", ["unreviewed", "official_source", "missing_hash", "invalid_hash", "demo", "missing_metadata"])
def test_only_reviewed_source_upload_can_be_saved(change):
    db, analysis = Database(), primary()
    if change == "unreviewed":
        analysis["report"]["coverage"]["user_review_confirmed"] = False
    elif change == "official_source":
        analysis["report"]["coverage"]["source"] = "anyror"
    elif change == "missing_hash":
        analysis["report"].pop("source_document")
    elif change == "invalid_hash":
        analysis["report"]["source_document"]["sha256"] = "not-a-hash"
    elif change == "demo":
        analysis["report"]["demo"] = True
    else:
        analysis.pop("metadata")
    with pytest.raises(HTTPException) as exc:
        save_reviewed_report(db, A, analysis)
    assert exc.value.status_code == 422 and db.rows == [] and db.queries == []


@pytest.mark.parametrize("value", ["not-a-uuid", "", None, 10])
def test_invalid_lookup_id_rejected_before_database(value):
    db = Database()
    with pytest.raises(HTTPException) as exc:
        get_reviewed_report(db, A, value)
    assert exc.value.status_code == 422 and db.queries == []


@pytest.mark.parametrize("limit", [0, 101, -1, "30", True])
def test_invalid_list_limit_rejected(limit):
    with pytest.raises(HTTPException) as exc:
        get_reviewed_reports(Database(), A, limit)
    assert exc.value.status_code == 422


def test_missing_identity_is_never_an_unowned_save_or_read():
    db = Database()
    for call in (lambda: save_reviewed_report(db, None, primary()),
                 lambda: get_reviewed_reports(db, None),
                 lambda: get_reviewed_report(db, None, str(uuid4()))):
        with pytest.raises(HTTPException) as exc:
            call()
        assert exc.value.status_code == 401
    assert not db.queries


def test_unknown_valid_uuid_is_404():
    with pytest.raises(HTTPException) as exc:
        get_reviewed_report(Database(), A, str(uuid4()))
    assert exc.value.status_code == 404


def test_pagination_is_stable_for_equal_timestamps_and_scoped_before_range():
    db = Database()
    for _ in range(5):
        save_reviewed_report(db, A, primary())
        save_reviewed_report(db, B, primary())
    official = {**deepcopy(db.rows[0]), "id": str(uuid4()), "record_type": "OLD_SCAN_712"}
    db.rows.insert(0, official)
    pages = [get_reviewed_reports(db, A, limit=2, offset=offset) for offset in (0, 2, 4)]
    ids = [row["id"] for page in pages for row in page]
    expected = sorted((row["id"] for row in db.rows if row["owner_id"] == A.user_id and row["record_type"] == "UPLOADED_RECORD"), reverse=True)
    assert ids == expected and len(ids) == len(set(ids)) == 5
    assert [len(page) for page in pages] == [2, 2, 1]
    assert db.queries[-1].bounds == (4, 5)
    assert db.queries[-1].filters == [("owner_id", A.user_id), ("record_type", "UPLOADED_RECORD")]
    assert get_reviewed_reports(db, A, limit=2, offset=5) == []


@pytest.mark.parametrize("offset", [-1, 10001, "0", True, None])
def test_invalid_offset_rejected_before_database(offset):
    db = Database()
    with pytest.raises(HTTPException) as exc:
        get_reviewed_reports(db, A, offset=offset)
    assert exc.value.status_code == 422 and db.queries == []
