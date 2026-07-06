# adapters/registry.py — STATE_REGISTRY: every playbook state, one adapter
# instance each, keyed by state code.
#
# Gujarat is live; Maharashtra and Karnataka are next (real scaffolds in
# their own files); the remaining ten are planned and share the generic
# PlannedAdapter, built straight from the playbook's state-portal cheat
# sheet. GET /states serializes this registry (plus the DocumentRouter's
# per-channel SLAs) for the frontend coverage page.

from typing import Optional

from adapters.base import RawRecord, StateAdapter
from adapters.gujarat import GujaratAdapter
from adapters.karnataka import KarnatakaAdapter
from adapters.maharashtra import MaharashtraAdapter


class PlannedAdapter(StateAdapter):
    """Metadata-only adapter for states we have not started building.
    fetch_ror always raises AdapterNotLiveError with the SLA'd alternatives."""

    status = "planned"

    def __init__(self, state_code: str, state_name: str, portal_name: str,
                 portal_url: str, record_names: list, channels: list,
                 digilocker_issuer: bool = False,
                 hierarchy: tuple = ("District", "Taluka", "Village")):
        self.state_code = state_code
        self.state_name = state_name
        self.portal_name = portal_name
        self.portal_url = portal_url
        self.record_names = record_names
        self.channels = channels
        self.digilocker_issuer = digilocker_issuer
        self.hierarchy = hierarchy

    async def fetch_ror(self, location: dict, survey_no: str,
                        record_type: Optional[str] = None,
                        progress=None) -> RawRecord:
        raise self.not_live("automated RoR fetch")


_ALL_CHANNELS = ["cache", "digilocker", "scrape", "manual"]
_NO_DIGILOCKER = ["cache", "scrape", "manual"]

_ADAPTERS = [
    # ── Live ──────────────────────────────────────────────────────────────
    GujaratAdapter(),
    # ── Next (scaffolds) ──────────────────────────────────────────────────
    MaharashtraAdapter(),
    KarnatakaAdapter(),
    # ── Planned (playbook cheat sheet, prioritised by transaction volume) ─
    PlannedAdapter("UP", "Uttar Pradesh", "UP Bhulekh", "https://upbhulekh.gov.in",
                   ["Khasra", "Khatauni"], _ALL_CHANNELS, digilocker_issuer=True,
                   hierarchy=("District", "Tehsil", "Village")),
    PlannedAdapter("TN", "Tamil Nadu", "TN e-Services", "https://eservices.tn.gov.in",
                   ["Patta", "Chitta"], _NO_DIGILOCKER,
                   hierarchy=("District", "Taluk", "Village")),
    PlannedAdapter("RJ", "Rajasthan", "Apna Khata", "https://apnakhata.rajasthan.gov.in",
                   ["Jamabandi Nakal"], _NO_DIGILOCKER,
                   hierarchy=("District", "Tehsil", "Village")),
    PlannedAdapter("PB", "Punjab", "Jamabandi Punjab", "https://jamabandi.punjab.gov.in",
                   ["Jamabandi"], _NO_DIGILOCKER,
                   hierarchy=("District", "Tehsil", "Village")),
    PlannedAdapter("HR", "Haryana", "Jamabandi Haryana", "https://jamabandi.nic.in",
                   ["Jamabandi"], _NO_DIGILOCKER,
                   hierarchy=("District", "Tehsil", "Village")),
    PlannedAdapter("MP", "Madhya Pradesh", "MP Bhulekh / RCMS", "https://mpbhulekh.gov.in",
                   ["Khasra"], _ALL_CHANNELS, digilocker_issuer=True,
                   hierarchy=("District", "Tehsil", "Village")),
    PlannedAdapter("TG", "Telangana", "Bhu Bharati", "https://bhubharati.telangana.gov.in",
                   ["RoR", "Encumbrance Certificate"], _ALL_CHANNELS, digilocker_issuer=True,
                   hierarchy=("District", "Mandal", "Village")),
    PlannedAdapter("AP", "Andhra Pradesh", "Meebhoomi", "https://meebhoomi.ap.gov.in",
                   ["1-B", "Adangal"], _NO_DIGILOCKER,
                   hierarchy=("District", "Mandal", "Village")),
    PlannedAdapter("WB", "West Bengal", "Banglarbhumi", "https://banglarbhumi.gov.in",
                   ["Porcha (RoR)"], _NO_DIGILOCKER,
                   hierarchy=("District", "Block", "Mouza")),
    PlannedAdapter("KL", "Kerala", "Ente Bhoomi", "https://entebhoomi.kerala.gov.in",
                   ["RoR"], _NO_DIGILOCKER,
                   hierarchy=("District", "Taluk", "Village")),
]

STATE_REGISTRY: dict = {a.state_code: a for a in _ADAPTERS}


def get_adapter(state_code: str) -> Optional[StateAdapter]:
    """Adapter for a state code (case-insensitive), or None if unknown."""
    return STATE_REGISTRY.get((state_code or "").strip().upper())
