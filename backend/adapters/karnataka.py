# adapters/karnataka.py — Karnataka (Bhoomi RTC), state #3 on the roadmap.
# Honest scaffold: well-digitised portal, big Bangalore demand, and a live
# DigiLocker RoR issuer (so channel 2 may land here before the scraper
# does). Until either ships, every method raises a clean AdapterNotLiveError
# naming the alternatives and their SLAs.

from typing import Optional

from adapters.base import RawRecord, StateAdapter


class KarnatakaAdapter(StateAdapter):
    state_code = "KA"
    state_name = "Karnataka"
    portal_name = "Bhoomi"
    portal_url = "https://landrecords.karnataka.gov.in"
    record_names = ["RTC (Pahani)"]
    status = "next"
    channels = ["cache", "digilocker", "scrape", "manual"]
    digilocker_issuer = True     # Karnataka Bhoomi is a live DigiLocker issuer
    hierarchy = ("District", "Taluk", "Village")

    async def fetch_ror(self, location: dict, survey_no: str,
                        record_type: Optional[str] = None,
                        progress=None) -> RawRecord:
        raise self.not_live("automated RTC fetch")
