# adapters/gujarat.py — Gujarat (AnyROR), the reference adapter.
#
# A THIN wrapper: all Playwright/CAPTCHA/translation logic stays in
# scraper.py (which /fetch-anyror and the title-report pipeline import
# directly and unchanged). This adapter only maps the AnyROR functions onto
# the StateAdapter interface so the router and future callers can treat
# Gujarat like every other state.

from typing import Optional

from adapters.base import RawRecord, StateAdapter
from gujarat_data import get_districts, get_talukas
from scraper import fetch_villages, scrape_anyror_data


class GujaratAdapter(StateAdapter):
    state_code = "GJ"
    state_name = "Gujarat"
    portal_name = "AnyROR"
    portal_url = "https://anyror.gujarat.gov.in"
    record_names = ["7/12 (VF-7/12)", "VF-6 mutation entry", "VF-8A khata"]
    status = "live"
    channels = ["cache", "scrape", "manual"]   # no live DigiLocker RoR issuer for Gujarat
    digilocker_issuer = False
    hierarchy = ("District", "Taluka", "Village")

    def get_districts(self) -> list:
        return get_districts()

    def get_talukas(self, district: str) -> list:
        return get_talukas(district)

    async def fetch_villages(self, district: str, taluka: str) -> list:
        return await fetch_villages(district=district, taluka=taluka)

    async def fetch_ror(self, location: dict, survey_no: str,
                        record_type: Optional[str] = None,
                        progress=None) -> RawRecord:
        """Delegate to the existing AnyROR scraper. The returned RawRecord
        keeps the scraper's dict contract verbatim in .data (including the
        "error" key on failure — check .ok before using the fields)."""
        record_type = record_type or "OLD_SCAN_712"
        data = await scrape_anyror_data(
            district=str(location.get("district", "")).strip(),
            taluka=str(location.get("taluka", "")).strip(),
            village=str(location.get("village", "")).strip(),
            survey_number=str(survey_no).strip(),
            record_type=record_type,
            progress=progress,
        )
        return RawRecord(
            state_code=self.state_code, channel="scrape",
            location=dict(location), survey_no=str(survey_no).strip(),
            record_type=record_type, data=data,
        )
