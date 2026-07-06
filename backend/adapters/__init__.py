# adapters — per-state land-record adapters (PAN_INDIA_PLAYBOOK.md, channel 1).
# Each state is an adapter file, not a fork of scraper.py: the TitleReport
# schema stays universal; only the adapter and its labels change.

from adapters.base import AdapterNotLiveError, RawRecord, StateAdapter

__all__ = ["AdapterNotLiveError", "RawRecord", "StateAdapter"]
