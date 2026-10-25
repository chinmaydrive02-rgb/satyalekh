"""Exact public location/survey matching shared by browser and HTTP transports."""
import re
from typing import Optional as Opt

DISTRICT_MAP = {
    "kutch": "કચ્છ", "kachchh": "કચ્છ",
    "banaskantha": "બનાસકાંઠા",
    "patan": "પાટણ",
    "mehsana": "મહેસાણા",
    "sabarkantha": "સાબરકાંઠા",
    "gandhinagar": "ગાંધીનગર",
    "ahmedabad": "અમદાવાદ", "amdavad": "અમદાવાદ",
    "surendranagar": "સુરેન્દ્રનગર",
    "rajkot": "રાજકોટ",
    "jamnagar": "જામનગર",
    "porbandar": "પોરબંદર",
    "junagadh": "જુનાગઢ",
    "amreli": "અમરેલી",
    "bhavnagar": "ભાવનગર",
    "anand": "આણંદ",
    "kheda": "ખેડા",
    "panchmahal": "પંચમહાલ",
    "dahod": "દાહોદ",
    "vadodara": "વડોદરા", "baroda": "વડોદરા",
    "narmada": "નર્મદા",
    "bharuch": "ભરુચ",
    "surat": "સુરત",
    "dang": "ડાંગ", "dangs": "ડાંગ",
    "navsari": "નવસારી",
    "valsad": "વલસાડ",
    "tapi": "તાપી",
    "devbhumi dwarka": "દેવભુમિ દ્વારકા", "dwarka": "દેવભુમિ દ્વારકા",
    "morbi": "મોરબી",
    "gir somnath": "ગીર સોમનાથ",
    "botad": "બોટાદ",
    "aravalli": "અરવલ્લી",
    "mahisagar": "મહિસાગર",
    "chhota udaipur": "છોટાઉદેપુર", "chhotaudepur": "છોટાઉદેપુર",
    "vav tharad": "વાવ-થરાદ",
}


def _normalize_survey(value: str) -> str:
    value = str(value).translate(str.maketrans("૦૧૨૩૪૫૬૭૮૯", "0123456789"))
    value = re.sub(r"\s+", "", value).casefold()
    return re.sub(r"\d+", lambda m: str(int(m.group())), value)


def _find_exact_survey_option(options: list, target: str):
    """Never substitute a nearby parcel or a different subdivision."""
    matches = [value for value, label in options
               if _normalize_survey(label) == _normalize_survey(target)]
    return matches[0] if len(matches) == 1 else None


def _find_best_option(options_texts: list, target: str) -> Opt[str]:
    """Match one location unambiguously; never guess a neighbouring locality.

    Preserve city/rural and parenthetical qualifiers: they can distinguish
    legally different locations. Known English aliases are translated by the
    static maps, but a substring or a similar spelling is not an identity.
    """
    def normalize(value):
        return " ".join(str(value).strip().casefold().split())

    target_normalized = normalize(target)
    if not target_normalized:
        return None

    def unique_match(names):
        matches = [val for val, label in options_texts
                   if normalize(label) in names]
        return matches[0] if len(matches) == 1 else None

    exact = [val for val, label in options_texts
             if normalize(label) == target_normalized]
    if exact:
        return exact[0] if len(exact) == 1 else None

    aliases = set()
    gujarati = DISTRICT_MAP.get(target_normalized)
    if gujarati:
        aliases.add(normalize(gujarati))
    try:
        from gujarat_data import get_taluka_gujarati
        aliases.update(normalize(name) for name in get_taluka_gujarati(target_normalized))
    except (ImportError, KeyError):
        pass
    return unique_match(aliases)

