# adapters/base.py — the per-state adapter interface.
#
# The playbook insight (PAN_INDIA_PLAYBOOK.md): stop thinking "scraper per
# state" and treat every search as a document_request routed to one of four
# channels — cache | digilocker | scrape | manual. A StateAdapter is the
# scrape-channel implementation (plus location-hierarchy metadata) for ONE
# state. Survey-number formats, hierarchies (taluka vs tehsil vs mandal) and
# record names differ per state — the TitleReport schema stays universal;
# only the adapter and its labels change.

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


class AdapterNotLiveError(Exception):
    """Raised when a state's automated fetch is not built yet.

    Carries a user-presentable message that always names the state, its
    roadmap status and the alternatives (with SLA) so callers can surface
    it directly instead of a bare 'not implemented'."""

    def __init__(self, message: str, state_code: str = "", alternatives: Optional[list] = None):
        super().__init__(message)
        self.state_code = state_code
        self.alternatives = alternatives or []


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class RawRecord:
    """A land record fetched through any channel, before TitleReport
    composition. `data` keeps the exact scraper contract (owner_name, area,
    tenure_type, encumbrances, mutation_entries, … or an "error" key) so
    the existing title_report pipeline consumes it unchanged."""

    state_code: str
    channel: str                 # cache | digilocker | scrape | manual
    location: dict               # {"district":…, "taluka":…, "village":…} (labels vary per state)
    survey_no: str
    record_type: str
    data: dict                   # parsed record fields, or {"error": …}
    fetched_at: str = field(default_factory=_utc_now_iso)

    @property
    def ok(self) -> bool:
        return "error" not in self.data


class StateAdapter(ABC):
    """One state's land-record source. Subclasses set the class attributes
    below and implement fetch_ror(); everything else has safe defaults."""

    state_code: str = ""          # ISO-style short code, e.g. "GJ"
    state_name: str = ""
    portal_name: str = ""         # e.g. "AnyROR"
    portal_url: str = ""
    record_names: list = []       # RoR-class documents this state issues, e.g. ["7/12", "8A"]
    status: str = "planned"       # live | next | planned
    channels: list = []           # subset of ["cache", "digilocker", "scrape", "manual"]
    digilocker_issuer: bool = False   # True where the state has a live DigiLocker RoR issuer
    hierarchy: tuple = ("District", "Taluka", "Village")  # location labels, top-down

    # ── Location-hierarchy helpers ─────────────────────────────────────────
    def location_labels(self) -> list:
        """Human labels for the location cascade, top-down (varies per state:
        taluka vs tehsil vs mandal, village vs mouza)."""
        return list(self.hierarchy)

    def get_districts(self) -> list:
        """Static district list, [] until the state's location data lands."""
        return []

    def get_talukas(self, district: str) -> list:
        """Second-level units for a district, [] until data lands."""
        return []

    async def fetch_villages(self, district: str, taluka: str) -> list:
        """Third-level units, usually a live portal scrape. Not-live default."""
        raise self.not_live("village lookup")

    # ── The scrape channel ─────────────────────────────────────────────────
    @abstractmethod
    async def fetch_ror(self, location: dict, survey_no: str,
                        record_type: Optional[str] = None,
                        progress=None) -> RawRecord:
        """Fetch the state's RoR document for a parcel.

        location: dict keyed "district"/"taluka"/"village" (whatever the
        state calls them, the keys stay these three).
        progress: optional callback(stage, label, pct) — same contract as
        scraper.scrape_anyror_data.
        """

    # ── Shared helpers ─────────────────────────────────────────────────────
    def not_live(self, action: str) -> AdapterNotLiveError:
        """Build the standard 'not live yet' error with SLA'd alternatives."""
        alternatives = []
        if self.digilocker_issuer:
            alternatives.append("DigiLocker pull (seconds — pending API Setu requester approval)")
        alternatives.append("certified copy via manual fulfilment (2-5 working days, POST /manual-orders)")
        roadmap = {"next": "it is next on the roadmap",
                   "planned": "it is on the roadmap"}.get(self.status, "it is not available")
        return AdapterNotLiveError(
            f"{self.state_name} ({self.portal_name}) {action} is not live yet — {roadmap}. "
            f"Alternatives: {'; '.join(alternatives)}.",
            state_code=self.state_code, alternatives=alternatives)

    def describe(self) -> dict:
        """Registry metadata for GET /states (channel SLAs are added by the
        DocumentRouter, which knows per-channel liveness)."""
        return {
            "state_code": self.state_code,
            "state_name": self.state_name,
            "portal": self.portal_name,
            "portal_url": self.portal_url,
            "records": list(self.record_names),
            "status": self.status,
            "digilocker_issuer": self.digilocker_issuer,
            "location_labels": self.location_labels(),
        }
