# digilocker.py — DigiLocker / API Setu channel (playbook channel 2).
#
# ⚠ NOT LIVE. Everything here is a stub pending DigiLocker Requester
# approval via partners.apisetu.gov.in (needs a registered business entity —
# paperwork first, build later). Once approved, set DIGILOCKER_ENABLED=true
# plus the client credentials and implement the three functions below; the
# router already knows how to slot this channel between cache and scrape.
#
# Why it matters: ONE integration yields RoR-class documents for the ~12
# states with live DigiLocker issuers — government-signed PDFs, no CAPTCHA,
# no IP games. Flow: user authorises via DigiLocker OAuth → we pull the
# record → the same TitleReport pipeline parses it (Gemini already parses
# scanned documents; a DigiLocker PDF is the easy case).
#
# Field caveat: issuer uptime is patchy and older records are missing —
# always keep the scrape channel as per-state fallback.

import os

# Flip to true ONLY after API Setu requester approval + credentials are set.
DIGILOCKER_ENABLED = os.getenv("DIGILOCKER_ENABLED", "").strip().lower() in ("1", "true", "yes")

# States with a live DigiLocker RoR issuer (subset we track in the registry;
# mirrors the digilocker_issuer flag on each adapter).
ISSUER_LIVE_STATES = {"KA", "MH", "TG", "MP", "UP"}

_NOT_LIVE_MSG = (
    "DigiLocker channel is not live yet — pending API Setu requester approval "
    "(partners.apisetu.gov.in). Use the scrape channel (live states, ~2 minutes) "
    "or manual fulfilment (2-5 working days) meanwhile."
)


class DigiLockerNotLiveError(Exception):
    """Raised by every stub below until the requester approval lands."""


def is_available(state_code: str) -> bool:
    """True only when the integration is enabled AND the state has a live
    RoR issuer. Always False today (DIGILOCKER_ENABLED defaults off)."""
    return DIGILOCKER_ENABLED and (state_code or "").strip().upper() in ISSUER_LIVE_STATES


def get_authorization_url(redirect_uri: str, state: str) -> str:
    """Step 1 of the OAuth flow: URL the user visits to authorise us to pull
    documents from their DigiLocker. `state` is the CSRF token we verify on
    callback."""
    raise DigiLockerNotLiveError(_NOT_LIVE_MSG)


def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """Step 2: exchange the OAuth callback code for an access token dict
    ({"access_token":…, "expires_in":…, "refresh_token":…})."""
    raise DigiLockerNotLiveError(_NOT_LIVE_MSG)


async def pull_ror(access_token: str, state_code: str, location: dict,
                   survey_no: str) -> bytes:
    """Step 3: pull the state's RoR document for a parcel via the issuer API.
    Returns the government-signed PDF bytes — feed them to the existing
    Gemini document parser, then compose_title_report as usual."""
    raise DigiLockerNotLiveError(_NOT_LIVE_MSG)
