# test_title_report.py — pure-Python unit tests (no network, no Playwright
# browsers, no Gemini). Run from backend/ with:  python3 -m pytest -q
#
# Covers: mutation-entry parsing, survey-suggestion parsing, chain flag
# detection, risk scoring, snapshot diffing, and the async job-store
# lifecycle with a mocked scraper.

import asyncio
import os
from datetime import datetime

import pytest

# Fake env so importing main.py never requires real keys
os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ.pop("SUPABASE_URL", None)
os.environ.pop("SUPABASE_KEY", None)
os.environ.pop("STRIPE_ENABLED", None)
os.environ.pop("CRON_SECRET", None)

from title_report import (
    JobStore, apply_chain_flags, basic_risk_level, compose_title_report,
    compute_risk, diff_snapshot, fallback_chain_from_entries,
    parse_available_options, parse_entry_date, parse_mutation_entries,
)

NOW = datetime(2026, 7, 1)  # fixed clock for deterministic date math


def _entry(entry_no="1", date="", mtype="sale", frm="A", to="B", desc=""):
    return {"entry_no": entry_no, "date": date, "mutation_type": mtype,
            "from_party": frm, "to_party": to, "description": desc, "flags": []}


# ── Mutation-entry parsing ───────────────────────────────────────────────────

class TestParseMutationEntries:
    def test_entry_no_format(self):
        assert parse_mutation_entries("Entry No. 4501; Entry No. 4790") == ["4501", "4790"]

    def test_years_in_parens_excluded(self):
        assert parse_mutation_entries("Entries 4501 (2015), 4790 (2018)") == ["4501", "4790"]

    def test_gujarati_prefix(self):
        assert parse_mutation_entries("નોંધ નં 301, 302") == ["301", "302"]

    def test_bare_numbers_fallback(self):
        assert parse_mutation_entries("3 mutations recorded: 1201, 1305, 2210") == ["1201", "1305", "2210"]

    def test_bare_year_not_treated_as_entry(self):
        assert "2015" not in parse_mutation_entries("Last mutation in 2015, entry 88")

    def test_empty_and_dash(self):
        assert parse_mutation_entries("") == []
        assert parse_mutation_entries("—") == []
        assert parse_mutation_entries(None) == []

    def test_dedupe_and_cap(self):
        assert parse_mutation_entries("entry 5, entry 5, entry 7") == ["5", "7"]
        many = ", ".join(f"entry {i}" for i in range(100, 200))
        assert len(parse_mutation_entries(many)) == 20


class TestParseAvailableOptions:
    def test_parses_scraper_error(self):
        err = ("Survey number '999' not found in 'Navrangpura'. "
               "Available options (first 15): ['1', '2', '3 P', '45/A']")
        assert parse_available_options(err) == ["1", "2", "3 P", "45/A"]

    def test_no_list_returns_none(self):
        assert parse_available_options("All CAPTCHA attempts failed.") is None
        assert parse_available_options("") is None


class TestParseEntryDate:
    def test_formats(self):
        assert parse_entry_date("15/03/2024").year == 2024
        assert parse_entry_date("2024-03-15").month == 3
        assert parse_entry_date("2019").year == 2019
        assert parse_entry_date("dated 2021 by order").year == 2021

    def test_garbage(self):
        assert parse_entry_date("—") is None
        assert parse_entry_date("") is None
        assert parse_entry_date(None) is None


# ── Chain flag detection ─────────────────────────────────────────────────────

class TestChainFlags:
    def test_recent_churn_flagged(self):
        chain = [
            _entry("1", "2005", frm="Patel A", to="Patel B"),
            _entry("2", "10/01/2025", frm="Patel B", to="Shah C"),
            _entry("3", "01/06/2026", frm="Shah C", to="Mehta D"),
        ]
        apply_chain_flags(chain, now=NOW)
        assert "RECENT_CHURN" in chain[1]["flags"]
        assert "RECENT_CHURN" in chain[2]["flags"]
        assert "RECENT_CHURN" not in chain[0]["flags"]

    def test_single_recent_transfer_not_churn(self):
        chain = [_entry("1", "2005"), _entry("2", "01/06/2026", frm="B", to="C")]
        apply_chain_flags(chain, now=NOW)
        assert all("RECENT_CHURN" not in e["flags"] for e in chain)

    def test_restricted_tenure_flag(self):
        chain = [_entry("1", desc="Converted to Navi Sharat (new tenure) under 72-AA")]
        apply_chain_flags(chain, now=NOW)
        assert "RESTRICTED_TENURE" in chain[0]["flags"]

    def test_encumbrance_flag_on_court_stay_boja(self):
        for word in ("court order", "stay granted", "boja of Dena Bank", "mortgage deed"):
            chain = [_entry("1", desc=word)]
            apply_chain_flags(chain, now=NOW)
            assert "ENCUMBRANCE" in chain[0]["flags"], word

    def test_chain_gap_detected(self):
        chain = [
            _entry("1", "2010", frm="Ramesh Patel", to="Suresh Patel"),
            _entry("2", "2015", frm="Unrelated Person", to="Kirit Shah"),
        ]
        apply_chain_flags(chain, now=NOW)
        assert "CHAIN_GAP" in chain[1]["flags"]

    def test_no_gap_when_names_overlap_reordered(self):
        chain = [
            _entry("1", "2010", frm="Ramesh Patel", to="Suresh Kumar Patel"),
            _entry("2", "2015", frm="Patel Suresh", to="Kirit Shah"),
        ]
        apply_chain_flags(chain, now=NOW)
        assert "CHAIN_GAP" not in chain[1]["flags"]

    def test_mortgage_entries_skipped_for_continuity(self):
        chain = [
            _entry("1", "2010", "sale", "A B", "Ramesh Patel"),
            _entry("2", "2012", "mortgage", "Ramesh Patel", "Dena Bank"),
            _entry("3", "2015", "sale", "Ramesh Patel", "Kirit Shah"),
        ]
        apply_chain_flags(chain, now=NOW)
        assert "CHAIN_GAP" not in chain[2]["flags"]


# ── Risk scoring ─────────────────────────────────────────────────────────────

CLEAN_RECORD = {
    "owner_name": "Ramesh Patel", "tenure_type": "Old Tenure (Juni Sharat)",
    "encumbrances": "None", "mutation_entries": "Entry 12 (1998)",
}


class TestRiskScoring:
    def test_clean_record_is_clear(self):
        chain = apply_chain_flags(
            [_entry("12", "1998", frm="Ambalal Patel", to="Ramesh Patel")], now=NOW)
        risk = compute_risk(CLEAN_RECORD, chain, now=NOW)
        assert risk["verdict"] == "CLEAR"
        assert risk["score"] < 20
        assert all(c["status"] in ("pass", "unavailable") for c in risk["checks"])

    def test_encumbered_restricted_is_high_risk(self):
        record = dict(CLEAN_RECORD, tenure_type="New Tenure (Navi Sharat)",
                      encumbrances="Mortgage with SBI, court stay pending")
        risk = compute_risk(record, [], now=NOW)
        assert risk["verdict"] == "HIGH_RISK"
        assert risk["score"] >= 50
        statuses = {c["name"]: c["status"] for c in risk["checks"]}
        assert statuses["tenure_type"] == "fail"
        assert statuses["encumbrances"] == "fail"
        assert statuses["litigation_mentions"] == "fail"

    def test_churn_and_gap_produce_caution(self):
        chain = apply_chain_flags([
            _entry("1", "2024", frm="Aaa Bbb", to="Ccc Ddd"),
            _entry("2", "2026", frm="Xxx Yyy", to="Zzz Www"),
        ], now=NOW)
        risk = compute_risk(CLEAN_RECORD, chain, now=NOW)
        assert risk["verdict"] == "CAUTION"
        statuses = {c["name"]: c["status"] for c in risk["checks"]}
        assert statuses["ownership_churn"] == "warn"
        assert statuses["chain_continuity"] == "warn"

    def test_unavailable_checks_when_no_data(self):
        risk = compute_risk({"tenure_type": "—", "encumbrances": "—"}, [], now=NOW)
        statuses = {c["name"]: c["status"] for c in risk["checks"]}
        assert statuses["tenure_type"] == "unavailable"
        assert statuses["ownership_churn"] == "unavailable"
        assert statuses["chain_continuity"] == "unavailable"

    def test_basic_risk_level_matches_legacy_behaviour(self):
        assert basic_risk_level("Old Tenure", "None") == ("GREEN", "Clear Title")
        assert basic_risk_level("New Tenure", "nil")[0] == "YELLOW"
        assert basic_risk_level("Old Tenure", "Mortgage SBI")[0] == "RED"
        assert basic_risk_level("Navi Sharat", "Boja") == ("RED", "Restricted & Mortgaged")

    def test_compose_title_report_shape(self):
        report = compose_title_report(CLEAN_RECORD, fallback_chain_from_entries(["12"]), now=NOW)
        assert set(report.keys()) == {"record", "chain_of_title", "risk", "generated_at", "cached"}
        assert report["cached"] is False
        assert report["chain_of_title"][0]["entry_no"] == "12"
        assert 0 <= report["risk"]["score"] <= 100


# ── Snapshot diffing (watchlist) ─────────────────────────────────────────────

class TestDiffSnapshot:
    def test_change_detected(self):
        old = {"owner_name": "Ramesh Patel", "encumbrances": "None",
               "mutation_entries": "Entry 12", "tenure_type": "Old"}
        new = dict(old, owner_name="Kirit Shah", encumbrances="Mortgage SBI")
        changes = diff_snapshot(old, new)
        assert set(changes.keys()) == {"owner_name", "encumbrances"}
        assert changes["owner_name"] == {"old": "Ramesh Patel", "new": "Kirit Shah"}

    def test_first_check_is_baseline(self):
        assert diff_snapshot(None, {"owner_name": "X"}) == {}
        assert diff_snapshot({}, {"owner_name": "X"}) == {}

    def test_no_change(self):
        snap = {"owner_name": "A", "encumbrances": "None",
                "mutation_entries": "—", "tenure_type": "Old"}
        assert diff_snapshot(snap, dict(snap)) == {}


# ── Job store lifecycle ──────────────────────────────────────────────────────

class TestJobStore:
    def test_lifecycle(self):
        store = JobStore()
        job_id = store.create(meta={"survey_no": "1"})
        job = store.get(job_id)
        assert job["status"] == "queued" and job["progress"] == 0

        store.set_progress(job_id, "solving_captcha", "Solving the security CAPTCHA (attempt 2/5)…", 53)
        job = store.get(job_id)
        assert job["status"] == "running"
        assert job["stage"] == "solving_captcha"
        assert "attempt 2/5" in job["stage_label"]
        assert job["progress"] == 53

        store.finish(job_id, {"record": {}, "cached": False})
        job = store.get(job_id)
        assert job["status"] == "done" and job["progress"] == 100 and job["result"]["cached"] is False

    def test_fail_with_suggestions(self):
        store = JobStore()
        job_id = store.create()
        store.fail(job_id, "Survey number '999' not found", suggestions=["1", "2 P"])
        job = store.get(job_id)
        assert job["status"] == "error"
        assert job["suggestions"] == ["1", "2 P"]

    def test_ttl_cleanup(self):
        clock = {"t": 1000.0}
        store = JobStore(clock=lambda: clock["t"])
        done_id = store.create()
        store.finish(done_id, {"ok": True})
        running_id = store.create()
        store.update(running_id, status="running")

        clock["t"] += 3 * 3600  # past finished-job TTL (2h), inside hard TTL (6h)
        store.cleanup()
        assert store.get(done_id) is None
        assert store.get(running_id) is not None  # running jobs survive soft TTL

        clock["t"] += 7 * 3600  # past hard TTL
        store.cleanup()
        assert store.get(running_id) is None

    def test_unknown_job(self):
        assert JobStore().get("nope") is None


# ── End-to-end job runner with a mocked scraper (imports main.py) ────────────

class TestJobRunnerWithMockedScraper:
    @pytest.fixture()
    def main_mod(self, monkeypatch):
        import main
        # backend/.env may set real SUPABASE_* vars via load_dotenv() — force
        # persistence off so these tests never touch the network.
        monkeypatch.setattr(main, "_get_supabase", lambda: None)
        return main

    def test_job_runner_success_path(self, main_mod, monkeypatch):
        """Full pipeline: mocked scrape emits progress stages, mocked Gemini
        structuring returns a chain, job ends 'done' with a TitleReport."""
        stages_seen = []

        async def fake_scrape(district, taluka, village, survey_number,
                              record_type="OLD_SCAN_712", max_captcha_attempts=5,
                              progress=None, **kw):
            if record_type == "VF6":
                return {"status": "SUCCESS", "message": f"VF6 entry {survey_number}",
                        "mutation_entries": f"entry {survey_number} sale details"}
            for stage, label, pct in [
                ("connecting", "Contacting AnyROR portal…", 5),
                ("selecting_location", "Locating…", 20),
                ("solving_captcha", "Solving the security CAPTCHA (attempt 1/5)…", 49),
                ("reading_record", "Reading the land record…", 68),
            ]:
                if progress:
                    progress(stage, label, pct)
                    stages_seen.append(stage)
            return {"status": "SUCCESS", "owner_name": "Ramesh Patel",
                    "survey_no": survey_number, "tenure_type": "Old Tenure",
                    "encumbrances": "None",
                    "mutation_entries": "Entry No. 4501 (2015), Entry No. 4790 (2018)"}

        def fake_structure(mutation_text, vf6_texts, ctx):
            assert len(vf6_texts) == 2  # both parsed entries fetched via VF6
            return [
                {"entry_no": "4501", "date": "2015", "mutation_type": "sale",
                 "from_party": "Ambalal Patel", "to_party": "Ramesh Patel",
                 "description": "Sale", "flags": []},
                {"entry_no": "4790", "date": "2018", "mutation_type": "mortgage",
                 "from_party": "Ramesh Patel", "to_party": "Dena Bank",
                 "description": "Boja entry", "flags": []},
            ]

        monkeypatch.setattr(main_mod, "scrape_anyror_data", fake_scrape)
        monkeypatch.setattr(main_mod, "structure_chain_with_gemini", fake_structure)

        req = main_mod.TitleReportJobRequest(
            district="Ahmedabad", taluka="City", village="Navrangpura", survey_no="1")
        job_id = main_mod.JOBS.create()
        asyncio.run(main_mod._run_title_report_job(job_id, req, ""))

        job = main_mod.JOBS.get(job_id)
        assert job["status"] == "done"
        assert job["progress"] == 100
        assert {"connecting", "selecting_location", "solving_captcha", "reading_record"} <= set(stages_seen)

        report = job["result"]
        assert report["cached"] is False
        assert len(report["chain_of_title"]) == 2
        assert "ENCUMBRANCE" in report["chain_of_title"][1]["flags"]
        assert report["risk"]["verdict"] in ("CLEAR", "CAUTION", "HIGH_RISK")
        assert report["record"]["owner_name"] == "Ramesh Patel"

    def test_job_runner_surfaces_survey_suggestions(self, main_mod, monkeypatch):
        async def fake_scrape(*a, **kw):
            return {"error": "Survey number '999' not found in 'Navrangpura'. "
                             "Available options (first 15): ['1', '2', '3 P']"}

        monkeypatch.setattr(main_mod, "scrape_anyror_data", fake_scrape)
        req = main_mod.TitleReportJobRequest(
            district="Ahmedabad", taluka="City", village="Navrangpura", survey_no="999")
        job_id = main_mod.JOBS.create()
        asyncio.run(main_mod._run_title_report_job(job_id, req, ""))

        job = main_mod.JOBS.get(job_id)
        assert job["status"] == "error"
        assert job["suggestions"] == ["1", "2", "3 P"]
        assert "not found" in job["error"]

    def test_job_runner_gemini_failure_falls_back(self, main_mod, monkeypatch):
        async def fake_scrape(*a, **kw):
            return {"status": "SUCCESS", "owner_name": "X", "tenure_type": "Old",
                    "encumbrances": "None", "mutation_entries": "Entry No. 55"}

        def broken_structure(*a, **kw):
            raise RuntimeError("Gemini quota exceeded")

        monkeypatch.setattr(main_mod, "scrape_anyror_data", fake_scrape)
        monkeypatch.setattr(main_mod, "structure_chain_with_gemini", broken_structure)
        req = main_mod.TitleReportJobRequest(
            district="Ahmedabad", taluka="City", village="Navrangpura",
            survey_no="1", include_chain=True)
        job_id = main_mod.JOBS.create()
        asyncio.run(main_mod._run_title_report_job(job_id, req, ""))

        job = main_mod.JOBS.get(job_id)
        assert job["status"] == "done"  # Gemini failure is non-fatal
        chain = job["result"]["chain_of_title"]
        assert len(chain) == 1 and chain[0]["entry_no"] == "55"

    def test_job_runner_include_chain_false(self, main_mod, monkeypatch):
        async def fake_scrape(*a, **kw):
            return {"status": "SUCCESS", "owner_name": "X", "tenure_type": "Old",
                    "encumbrances": "None", "mutation_entries": "Entry No. 55"}

        def must_not_be_called(*a, **kw):
            raise AssertionError("structure_chain_with_gemini called with include_chain=False")

        monkeypatch.setattr(main_mod, "scrape_anyror_data", fake_scrape)
        monkeypatch.setattr(main_mod, "structure_chain_with_gemini", must_not_be_called)
        req = main_mod.TitleReportJobRequest(
            district="Ahmedabad", taluka="City", village="Navrangpura",
            survey_no="1", include_chain=False)
        job_id = main_mod.JOBS.create()
        asyncio.run(main_mod._run_title_report_job(job_id, req, ""))
        job = main_mod.JOBS.get(job_id)
        assert job["status"] == "done"
        assert job["result"]["chain_of_title"] == []
