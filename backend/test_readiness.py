from readiness import capability_readiness, storage_readiness, STORAGE_TABLES


class FakeStorage:
    def __init__(self, fail=None):
        self.fail = fail
        self.calls = []

    def table(self, name):
        self.name = name
        self.calls.append(name)
        return self

    def select(self, columns):
        assert columns == "id"
        return self

    def limit(self, value):
        assert value == 0
        return self

    def execute(self):
        if self.name == self.fail:
            raise RuntimeError("provider error containing a secret")


def test_missing_storage_is_not_ready(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    assert capability_readiness(None)["ready"] is False


def test_storage_probe_does_not_read_rows_or_leak_errors():
    storage = FakeStorage("watchlist")
    result = storage_readiness(storage)
    assert storage.calls == list(STORAGE_TABLES)
    assert result["watchlist"] == "unavailable"
    assert result["title_reports"] == "accessible"
    assert "secret" not in str(result)


def test_configuration_does_not_claim_generation_or_durability(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test")
    monkeypatch.setenv("JOB_DB_PATH", "/tmp/jobs.sqlite")
    monkeypatch.delenv("CRON_SECRET", raising=False)
    result = capability_readiness(FakeStorage())
    assert result["ready"] is True
    assert result["document_reader"] == "configured_not_probed"
    assert result["job_storage"] == "local_file_not_verified_durable"
    assert result["watchlist_scheduler"] == "not_configured"
