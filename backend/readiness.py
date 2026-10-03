"""Dependency readiness without reading user records or calling paid providers."""
import os

STORAGE_TABLES = ("title_reports", "watchlist", "watchlist_alerts", "manual_orders")


def storage_readiness(client):
    if client is None:
        return {name: "not_configured" for name in STORAGE_TABLES}
    checks = {}
    for name in STORAGE_TABLES:
        try:
            # LIMIT 0 checks the relation and access without retrieving client data.
            client.table(name).select("id").limit(0).execute()
            checks[name] = "accessible"
        except Exception:
            # Provider exceptions can contain URLs, SQL or credentials.
            checks[name] = "unavailable"
    return checks


def capability_readiness(client):
    storage = storage_readiness(client)
    reader_configured = bool(os.getenv("GOOGLE_API_KEY"))
    return {
        "ready": reader_configured and all(v == "accessible" for v in storage.values()),
        "storage": storage,
        "document_reader": "configured_not_probed" if reader_configured else "not_configured",
        "government_retrieval": "requires_live_record_verification",
        "news": "configured_not_probed" if os.getenv("NEWSDATA_API_KEY") else "not_configured",
        "watchlist_scheduler": "secret_configured_scheduler_unverified" if os.getenv("CRON_SECRET") else "not_configured",
        "job_storage": "local_file_not_verified_durable" if os.getenv("JOB_DB_PATH") else "process_memory",
        "note": "Readiness checks storage access and configuration only; it does not certify title, portal retrieval, provider generation or scheduled execution.",
    }
