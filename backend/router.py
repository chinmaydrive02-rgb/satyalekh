# router.py — the document-fulfilment router (the playbook's core insight).
#
# Stop thinking "scraper per state": every search is a document_request that
# gets routed to one of four channels based on (state, document type), with
# the per-channel SLA shown to the user UP FRONT:
#
#   cache      → instant, free (already-fetched parcels in Supabase)
#   digilocker → seconds (government-signed PDF; only issuer states; NOT
#                LIVE pending API Setu requester approval — see digilocker.py)
#   scrape     → ~2 minutes (Playwright + CAPTCHA; only live-adapter states)
#   manual     → 2-5 working days (human SRO runs; certified SKUs)
#
# DocumentRouter.route() returns the ORDERED attempt plan — callers try each
# live channel in turn and can show the not-yet-live ones as "coming soon".

from dataclasses import asdict, dataclass
from typing import Optional

import digilocker
from adapters.base import StateAdapter
from adapters.registry import get_adapter

# ── Document types ──────────────────────────────────────────────────────────
# "ror" is the free/cheap record-of-rights class (7/12, RTC, Khasra, …).
# The certified SKUs are manual-channel products (playbook channel 3):
# start tiny, price high, one partner in Ahmedabad.
DOC_TYPE_ROR = "ror"

MANUAL_SKUS = {
    "certified_712_index2": {
        "label": "Certified 7/12 + Index-2 copy",
        "price_inr": 1500,
    },
    "search_report_30yr": {
        "label": "30-year search report (advocate-certified)",
        "price_inr": 4999,
    },
}

# States where a manual-fulfilment partner is actually on the ground (v1:
# one document writer in Ahmedabad — don't build a runner network before
# one partner in one city is profitable).
MANUAL_LIVE_STATES = {"GJ"}

# Per-channel SLA labels, shown to the user before they commit.
CHANNEL_SLAS = {
    "cache": "instant",
    "digilocker": "seconds",
    "scrape": "~2 minutes",
    "manual": "2-5 working days",
}


@dataclass
class ChannelPlan:
    """One ordered attempt in a document request's fulfilment plan."""
    channel: str                     # cache | digilocker | scrape | manual
    sla: str                         # human SLA label (CHANNEL_SLAS)
    live: bool                       # can this channel actually run today?
    note: str = ""                   # e.g. why it isn't live, or what it costs
    price_inr: Optional[int] = None  # None/0 = free

    def as_dict(self) -> dict:
        return asdict(self)


class DocumentRouter:
    """Route (state, doc_type) → ordered list of ChannelPlan attempts."""

    def route(self, state_code: str, doc_type: str = DOC_TYPE_ROR) -> list:
        adapter = get_adapter(state_code)
        if adapter is None:
            raise ValueError(f"Unknown state code '{state_code}'")

        # Certified SKUs are manual-channel-only products (no cache/scrape
        # shortcut — a human fetches a stamped paper document).
        if doc_type in MANUAL_SKUS:
            sku = MANUAL_SKUS[doc_type]
            return [self._manual_plan(adapter, price_inr=sku["price_inr"],
                                      label=sku["label"])]

        if doc_type != DOC_TYPE_ROR:
            raise ValueError(
                f"Unknown document type '{doc_type}' — expected '{DOC_TYPE_ROR}' "
                f"or one of {sorted(MANUAL_SKUS)}")

        plans = [ChannelPlan(
            channel="cache", sla=CHANNEL_SLAS["cache"], live=True, price_inr=0,
            note="Already-verified parcels are served instantly and free.")]

        if "digilocker" in adapter.channels and adapter.digilocker_issuer:
            live = digilocker.is_available(adapter.state_code)
            plans.append(ChannelPlan(
                channel="digilocker", sla=CHANNEL_SLAS["digilocker"], live=live,
                note="" if live else "Not live — pending API Setu requester approval."))

        if "scrape" in adapter.channels:
            live = adapter.status == "live"
            plans.append(ChannelPlan(
                channel="scrape", sla=CHANNEL_SLAS["scrape"], live=live,
                note=f"Automated fetch from {adapter.portal_name}." if live else
                     f"{adapter.portal_name} adapter is "
                     f"{'next on the roadmap' if adapter.status == 'next' else 'planned'}."))

        if "manual" in adapter.channels:
            plans.append(self._manual_plan(
                adapter, price_inr=MANUAL_SKUS["certified_712_index2"]["price_inr"],
                label="Certified copy fetched by a human (order via POST /manual-orders)."))

        return plans

    @staticmethod
    def _manual_plan(adapter: StateAdapter, price_inr: int, label: str) -> ChannelPlan:
        live = adapter.state_code in MANUAL_LIVE_STATES
        note = label if live else (
            f"{label} Manual fulfilment currently covers Gujarat only.")
        return ChannelPlan(channel="manual", sla=CHANNEL_SLAS["manual"],
                           live=live, note=note, price_inr=price_inr)
