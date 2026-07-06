# adapters/maharashtra.py — Maharashtra (MahaBhulekh), state #2 on the
# roadmap. Honest scaffold: the portal follows the same UX pattern as AnyROR
# (district→taluka→village cascades, CAPTCHA, Devanagari→English translation
# — Marathi is the same Gemini muscle as Gujarati), so the build is an
# adapter file, not a fork. Until it ships, every method raises a clean
# AdapterNotLiveError naming the alternatives and their SLAs.

from typing import Optional

from adapters.base import RawRecord, StateAdapter


class MaharashtraAdapter(StateAdapter):
    state_code = "MH"
    state_name = "Maharashtra"
    portal_name = "MahaBhulekh"
    portal_url = "https://bhulekh.mahabhumi.gov.in"
    record_names = ["7/12", "8A", "Property Card"]
    status = "next"
    channels = ["cache", "digilocker", "scrape", "manual"]
    digilocker_issuer = True     # Maharashtra 7/12 has a live DigiLocker issuer
    hierarchy = ("District", "Taluka", "Village")

    async def fetch_ror(self, location: dict, survey_no: str,
                        record_type: Optional[str] = None,
                        progress=None) -> RawRecord:
        raise self.not_live("automated 7/12 fetch")
