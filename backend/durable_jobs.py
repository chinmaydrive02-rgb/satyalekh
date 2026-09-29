"""Optional single-process durable job history on a persistent disk.

Completed reports survive restarts. Interrupted work fails explicitly instead of
silently disappearing or replaying a possibly charged request. This is not a
multi-worker queue; run one Uvicorn worker until a shared queue is introduced.
"""
import json
import sqlite3
import threading
from pathlib import Path

from title_report import JobStore


class DurableJobStore(JobStore):
    def __init__(self, path):
        super().__init__()
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._db.execute("PRAGMA journal_mode=WAL")
        self._db.execute("CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        self._db.commit()
        self._jobs = {jid: json.loads(payload) for jid, payload in self._db.execute("SELECT id, payload FROM jobs")}
        for jid, job in list(self._jobs.items()):
            if job['status'] in ('queued', 'running'):
                self.fail(jid, "The server restarted during this request. Please start a new search.")
        self.cleanup()

    def _save(self, job_id):
        job = self._jobs.get(job_id)
        if job:
            with self._db:
                self._db.execute("INSERT OR REPLACE INTO jobs VALUES (?, ?)", (job_id, json.dumps(job)))

    def create(self, meta=None):
        with self._lock:
            jid = super().create(meta)
            self._save(jid)
            return jid

    def update(self, job_id, **fields):
        with self._lock:
            super().update(job_id, **fields)
            self._save(job_id)

    def cleanup(self):
        with self._lock:
            before = set(self._jobs)
            super().cleanup()
            with self._db:
                self._db.executemany("DELETE FROM jobs WHERE id = ?", [(jid,) for jid in before - set(self._jobs)])

    def get(self, job_id):
        with self._lock:
            job = super().get(job_id)
            return dict(job) if job else None

    def running_count(self, demo=None):
        with self._lock:
            return super().running_count(demo)

    def __len__(self):
        with self._lock:
            return super().__len__()
