"""One passive, sanitized portal observation; no request inputs or history."""
from datetime import datetime, timezone
import math
import re
import time

_latest = None
_latest_at = None
_ENUMS = {
    "stage": {"cache_read", "gate", "browser_launch", "browser_context", "navigation",
              "district_ready", "district_to_taluka", "taluka_to_village", "village_options", "complete"},
    "outcome": {"cached", "ready", "unavailable"},
    "route": {"rural", "custom_error", "other"},
    "cache_source": {"memory", "persistent", "live"},
    "failure_kind": {"deadline", "navigation", "http_status", "redirect", "control", "browser", "cooldown"},
    "network_error": {"ERR_NAME_NOT_RESOLVED", "ERR_CONNECTION_TIMED_OUT", "ERR_CONNECTION_REFUSED",
                      "ERR_CONNECTION_RESET", "ERR_CONNECTION_CLOSED", "ERR_ADDRESS_UNREACHABLE",
                      "ERR_INTERNET_DISCONNECTED", "ERR_NETWORK_CHANGED", "ERR_TIMED_OUT",
                      "ERR_CERT_AUTHORITY_INVALID", "ERR_CERT_DATE_INVALID", "ERR_CERT_COMMON_NAME_INVALID",
                      "ERR_SSL_PROTOCOL_ERROR", "ERR_HTTP_RESPONSE_CODE_FAILURE", "ERR_ABORTED"},
}
_NUMBERS = {"elapsed_ms": (0, 3600000), "timeout_ms": (0, 300000), "http_status": (100, 599),
            "option_count": (0, 100000), "cooldown_remaining_s": (0, 86400)}


def network_error_code(exc):
    """Extract only a recognized Chromium error token; discard all other text."""
    try:
        for code in re.findall(r"\bnet::(ERR_[A-Z_]+)\b", str(exc)):
            if code in _ENUMS["network_error"]:
                return code
    except Exception:
        pass
    return None


def record_portal_observation(**fields):
    """Diagnostics are best effort and must never change the lookup outcome."""
    global _latest, _latest_at
    try:
        observation = {"observed": True, "operation": "village_lookup",
                       "observed_at": datetime.now(timezone.utc).isoformat()}
        for key, allowed in _ENUMS.items():
            value = fields.get(key)
            if isinstance(value, str) and value in allowed:
                observation[key] = value
        for key, (low, high) in _NUMBERS.items():
            value = fields.get(key)
            if type(value) in (int, float) and math.isfinite(value) and low <= value <= high:
                observation[key] = int(value)
        now = time.monotonic()
        _latest, _latest_at = observation, now
    except Exception:
        pass


def get_portal_observation():
    """Return a copy without browser, provider, database, or other network work."""
    if _latest is None:
        return {"observed": False}
    result = dict(_latest)
    result["age_seconds"] = max(0, int(time.monotonic() - _latest_at))
    return result
