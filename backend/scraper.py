import os
import asyncio
import json
import re
from playwright.async_api import async_playwright
from google import genai
from google.genai import types

_gemini_client = None

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


# ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
# AnyROR Page Element IDs â verified from https://anyror.gujarat.gov.in/LandRecordRural.aspx
# ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
ELEMENTS = {
    "record_type":    "#ContentPlaceHolder1_drpLandRecord",
    "district":       "#ContentPlaceHolder1_ddlDistrict",
    "taluka":         "#ContentPlaceHolder1_ddlTaluka",
    "village":        "#ContentPlaceHolder1_ddlVillage",
    # Dynamic fields inside divSurvayno_khatano (appear after record type + village selection)
    "survey_dropdown": "#ContentPlaceHolder1_ddlSurveyNo",     # For VF-7, Old Scan 7/12, Integrated
    "entry_input":     "#ContentPlaceHolder1_txtNo",            # For VF-8A, VF-6
    "owner_input":     "#ContentPlaceHolder1_txtownername",     # For Know Khata by Owner Name
    # CAPTCHA & Submit
    "captcha_img":     "#ContentPlaceHolder1_i_captcha_1",
    "captcha_input":   "#ContentPlaceHolder1_txt_captcha_1",
    "submit_btn":      "#ContentPlaceHolder1_btnGo",
    "refresh_captcha": "#ContentPlaceHolder1_lb_refresh_1",
}

# Record type dropdown values â verified from live portal HTML
RECORD_TYPE_MAP = {
    "VF7":           "1",
    "VF8A":          "2",
    "VF6":           "3",
    "135D":          "4",
    "NEW_FROM_OLD":  "5",
    "OLD_SCAN_6":    "6",
    "ENTRY_LIST":    "7",
    "INTEGRATED":    "8",
    "REVENUE_CASE":  "9",
    "OWNER_NAME":    "10",
    "OLD_SCAN_712":  "11",
    "E_CHAVDI":      "13",
    "CLOSED_SURVEY": "15",
    "OTHER_LANG":    "16",
}

FIELD_TYPE_MAP = {
    "VF7":           "dropdown",
    "VF8A":          "text",
    "VF6":           "text",
    "135D":          "dropdown",
    "OLD_SCAN_6":    "dropdown",
    "INTEGRATED":    "dropdown",
    "OWNER_NAME":    "owner",
    "OLD_SCAN_712":  "dropdown",
    "E_CHAVDI":      "dropdown",
    "CLOSED_SURVEY": "dropdown",
    "NEW_FROM_OLD":  "dropdown",
    "ENTRY_LIST":    "text",
    "REVENUE_CASE":  "dropdown",
    "OTHER_LANG":    "owner",
}

DISTRICT_MAP = {
    "kutch": "àªàªà«àª", "kachchh": "àªàªà«àª",
    "banaskantha": "àª¬àª¨àª¾àª¸àªàª¾àªàª àª¾",
    "patan": "àªªàª¾àªàª£",
    "mehsana": "àª®àª¹à«àª¸àª¾àª£àª¾",
    "sabarkantha": "àª¸àª¾àª¬àª°àªàª¾àªàª àª¾",
    "gandhinagar": "àªàª¾àªàª§à«àª¨àªàª°",
    "ahmedabad": "àªàª®àª¦àª¾àªµàª¾àª¦", "amdavad": "àªàª®àª¦àª¾àªµàª¾àª¦",
    "surendranagar": "àª¸à«àª°à«àª¨à«àª¦à«àª°àª¨àªàª°",
    "rajkot": "àª°àª¾àªàªà«àª",
    "jamnagar": "àªàª¾àª®àª¨àªàª°",
    "porbandar": "àªªà«àª°àª¬àªàª¦àª°",
    "junagadh": "àªà«àª¨àª¾àªàª¢",
    "amreli": "àªàª®àª°à«àª²à«",
    "bhavnagar": "àª­àª¾àªµàª¨àªàª°",
    "anand": "àªàª£àªàª¦",
    "kheda": "àªà«àª¡àª¾",
    "panchmahal": "àªªàªàªàª®àª¹àª¾àª²",
    "dahod": "àª¦àª¾àª¹à«àª¦",
    "vadodara": "àªµàª¡à«àª¦àª°àª¾", "baroda": "àªµàª¡à«àª¦àª°àª¾",
    "narmada": "àª¨àª°à«àª®àª¦àª¾",
    "bharuch": "àª­àª°à«àª",
    "surat": "àª¸à«àª°àª¤",
    "dang": "àª¡àª¾àªàª", "dangs": "àª¡àª¾àªàª",
    "navsari": "àª¨àªµàª¸àª¾àª°à«",
    "valsad": "àªµàª²àª¸àª¾àª¡",
    "tapi": "àª¤àª¾àªªà«",
    "devbhumi dwarka": "àª¦à«àªµàª­à«àª®àª¿ àª¦à«àªµàª¾àª°àªàª¾", "dwarka": "àª¦à«àªµàª­à«àª®àª¿ àª¦à«àªµàª¾àª°àªàª¾",
    "morbi": "àª®à«àª°àª¬à«",
    "gir somnath": "àªà«àª° àª¸à«àª®àª¨àª¾àª¥",
    "botad": "àª¬à«àªàª¾àª¦",
    "aravalli": "àªàª°àªµàª²à«àª²à«",
    "mahisagar": "àª®àª¹àª¿àª¸àª¾àªàª°",
    "chhota udaipur": "àªà«àªàª¾àªàª¦à«àªªà«àª°", "chhotaudepur": "àªà«àªàª¾àªàª¦à«àªªà«àª°",
    "vav tharad": "àªµàª¾àªµ-àª¥àª°àª¾àª¦",
}

GUJARATI_ERROR_PHRASES = [
    "àª®àª¾àª¹àª¿àª¤à« àª®àª³à« àª¨àª¥à«",
    "àªàªªàª²àª¬à«àª§ àª¨àª¥à«",
    "àª¡à«àªàª¾ àª®àª³à«àª¯à« àª¨àª¥à«",
    "invalid captcha",
    "wrong captcha",
    "no record found",
    "record not found",
    "not found",
]

GUJARATI_NO_RECORD_PHRASES = [
    "àª®àª¾àª¹àª¿àª¤à« àª®àª³à« àª¨àª¥à«",
    "àª¡à«àªàª¾ àª®àª³à«àª¯à« àª¨àª¥à«",
    "no record found",
    "record not found",
]


async def solve_captcha_with_gemini(screenshot_bytes: bytes) -> str:
    """Uses Gemini Vision to decode the AnyROR CAPTCHA."""
    try:
        document = types.Part.from_bytes(data=screenshot_bytes, mime_type="image/png")
        response = get_gemini_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                "Read the exact text in this CAPTCHA image. "
                "The CAPTCHA may contain digits, letters, or both â read it exactly as shown. "
                "Reply ONLY with the characters you see, with no spaces, no extra words, no punctuation. "
                "Common patterns: 5-6 digit numbers like '38291', or mixed like 'A3B7C'. "
                "Output ONLY the CAPTCHA characters.",
                document
            ]
        )
        solved = response.text.strip().replace(" ", "")
        solved = re.sub(r'[`"\']', '', solved).strip()
        print(f"  Gemini CAPTCHA solution: '{solved}'")
        return solved
    except Exception as e:
        print(f"  Gemini Captcha Solve Error: {e}")
        return ""


async def parse_result_with_gemini_vision(screenshot_bytes: bytes, district: str, taluka: str,
                                           village: str, survey_number: str) -> dict:
    """Parse AnyROR result using Gemini Vision (screenshot-based)."""
    try:
        document = types.Part.from_bytes(data=screenshot_bytes, mime_type="image/png")
        response = get_gemini_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                f"""This is a screenshot of a Gujarat government land record (7/12 extract) from the AnyROR portal.
The user searched for: District={district}, Taluka={taluka}, Village={village}, Survey No={survey_number}.

The document may contain Gujarati text in a scanned form or table layout.
Extract ALL visible land record information. Translate Gujarati text to English.

Return ONLY valid JSON with these fields (use "â" if not visible):
{{
  "message": "Record found via scanned document",
  "owner_name": "Owner full name in English",
  "survey_no": "{survey_number}",
  "village": "{village}",
  "district": "{district}",
  "taluka": "{taluka}",
  "area": "Total area with units",
  "tenure_type": "Type of tenure/land use",
  "cultivation": "Land use or cultivation classification",
  "mutation_entries": "Summary of mutation entries if visible",
  "encumbrances": "Any liens or encumbrances. Say 'None' if clear",
  "jantri_rate": "Government jantri rate if shown",
  "last_sale": "Last sale date/amount if shown"
}}""",
                document
            ]
        )

        json_text = response.text.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        return json.loads(json_text.strip())

    except Exception as e:
        print(f"  Gemini Vision Parse Error: {e}")
        return {
            "message": "Record retrieved (image) but parsing failed",
            "owner_name": "â", "survey_no": survey_number, "village": village,
            "district": district, "taluka": taluka, "area": "â",
            "tenure_type": "â", "cultivation": "â", "mutation_entries": "â",
            "encumbrances": "â", "jantri_rate": "â", "last_sale": "â"
        }


async def parse_result_with_gemini(html: str, district: str, taluka: str, village: str, survey_number: str) -> dict:
    """Uses Gemini to extract structured land record data from the AnyROR result HTML."""
    try:
        html_clean = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        html_clean = re.sub(r'<style[^>]*>.*?</style>', '', html_clean, flags=re.DOTALL)
        if len(html_clean) > 15000:
            html_clean = html_clean[:15000]

        response = get_gemini_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                f"""You are analyzing a Gujarat government land record HTML page from AnyROR.
The user searched for: District={district}, Taluka={taluka}, Village={village}, Survey No={survey_number}.

Return ONLY valid JSON with these fields (use "â" if not found):
{{
  "message": "Record type description",
  "owner_name": "Owner full name in English",
  "survey_no": "{survey_number}",
  "village": "{village}",
  "district": "{district}",
  "taluka": "{taluka}",
  "area": "Total area with units",
  "tenure_type": "Type of tenure/land use",
  "cultivation": "Cultivation type or land use classification",
  "mutation_entries": "Number and years of mutation entries",
  "encumbrances": "Any liens, mortgages, or encumbrances. Say 'None' if clear",
  "jantri_rate": "Government rate if available",
  "last_sale": "Last sale date and amount if available"
}}

HTML content:
{html_clean}""",
            ]
        )

        json_text = response.text.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        return json.loads(json_text.strip())

    except Exception as e:
        print(f"  Gemini Parse Error: {e}")
        return {
            "message": "Record retrieved but parsing failed",
            "owner_name": "â", "survey_no": survey_number, "village": village,
            "district": district, "taluka": taluka, "area": "â",
            "tenure_type": "â", "cultivation": "â", "mutation_entries": "â",
            "encumbrances": "â", "jantri_rate": "â", "last_sale": "â"
        }


def _count_populated_fields(parsed: dict) -> int:
    """Count how many meaningful fields were actually extracted (not "â")."""
    meaningful_keys = ["owner_name", "area", "tenure_type", "cultivation", "mutation_entries"]
    return sum(1 for k in meaningful_keys if parsed.get(k, "â") not in ("â", "", None))


from typing import Optional as Opt

def _find_best_option(options_texts: list, target: str) -> Opt[str]:
    """Fuzzy-match a target string against a list of (value, text) tuples."""
    target_lower = target.lower().strip()
    target_digits = re.sub(r'\D', '', target)

    for val, text in options_texts:
        if text.lower().strip() == target_lower:
            return val

    for val, text in options_texts:
        t = text.lower().strip()
        if target_lower in t or t in target_lower:
            return val

    if target_digits:
        for val, text in options_texts:
            text_digits = re.sub(r'\D', '', text)
            if text_digits == target_digits:
                return val
        for val, text in options_texts:
            text_digits = re.sub(r'\D', '', text)
            if text_digits and (text_digits.startswith(target_digits) or target_digits.startswith(text_digits)):
                return val

    gujarati = DISTRICT_MAP.get(target_lower)
    if gujarati:
        for val, text in options_texts:
            if gujarati in text:
                return val

    return None


async def _translate_to_gujarati(english_name: str) -> str:
    """Use Gemini to translate an English place name to Gujarati script."""
    try:
        response = get_gemini_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                f"Translate this Gujarat place name to Gujarati script. "
                f"Return ONLY the Gujarati text, nothing else.\n"
                f"Place name: {english_name}"
            ]
        )
        result = response.text.strip()
        print(f"    Gemini translated '{english_name}' -> '{result}'")
        return result
    except Exception as e:
        print(f"    Translation failed: {e}")
        return ""


async def _wait_for_dropdown_options(page, css_selector: str, min_options: int = 2, timeout_ms: int = 20000):
    """Wait until a dropdown has at least min_options options."""
    try:
        escaped = css_selector.replace("'", "\\'")
        await page.wait_for_function(
            f"document.querySelectorAll('{escaped} option').length >= {min_options}",
            timeout=timeout_ms
        )
        print(f"    {css_selector} populated with options")
    except Exception:
        print(f"    Timeout waiting for {css_selector}, adding grace wait...")
        await page.wait_for_timeout(3000)


async def _select_cascading_option(page, selector: str, target: str, field_name: str,
                                    next_selector: str = None) -> bool:
    """Select an option from a cascading dropdown with fuzzy matching + Gemini translation."""
    el = page.locator(selector)
    if await el.count() == 0:
        print(f"    {field_name} dropdown not found")
        return False

    options = await el.locator("option").all()
    options_texts = []
    for opt in options:
        text = (await opt.text_content() or "").strip()
        val = await opt.get_attribute("value") or ""
        if val and val != "0":
            options_texts.append((val, text))

    if not options_texts:
        print(f"    {field_name} dropdown has no options yet")
        return False

    best = _find_best_option(options_texts, target)
    if best:
        await el.select_option(value=best)
        print(f"    {field_name}: matched value={best}")
        if next_selector:
            await _wait_for_dropdown_options(page, next_selector)
        else:
            try:
                await page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass
            await page.wait_for_timeout(2500)
        return True

    print(f"    {field_name}: no direct match for '{target}', trying Gemini translation...")
    gujarati_name = await _translate_to_gujarati(target)
    if gujarati_name:
        import difflib
        best_match = None
        highest_ratio = 0.0

        for val, text in options_texts:
            clean_text = text.split('(')[0].split('-')[0].strip()
            if gujarati_name in clean_text or clean_text in gujarati_name:
                best_match = val
                highest_ratio = 1.0
                break
            ratio = difflib.SequenceMatcher(None, gujarati_name, clean_text).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = val

        if best_match and highest_ratio > 0.6:
            await el.select_option(value=best_match)
            print(f"    {field_name}: Gemini-translated match value={best_match} (ratio: {highest_ratio:.2f})")
            if next_selector:
                await _wait_for_dropdown_options(page, next_selector)
            else:
                try:
                    await page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    pass
                await page.wait_for_timeout(2500)
            return True

    print(f"    {field_name}: no match for '{target}' (even after translation)")
    print(f"      Available: {[t for _, t in options_texts[:10]]}")
    return False


async def fetch_villages_from_anyror(district: str, taluka: str, record_type: str = "OLD_SCAN_712") -> list:
    """
    Navigates AnyROR to populate the village dropdown for a given district+taluka.
    Returns village names exactly as they appear on the government portal so the
    frontend can present them verbatim - eliminating all fuzzy-matching errors.
    """
    record_val = RECORD_TYPE_MAP.get(record_type, "11")
    print(f"\n Fetching villages: {district} > {taluka} (record={record_type})")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process",
                "--no-zygote",
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()
        try:
            await page.goto(
                "https://anyror.gujarat.gov.in/LandRecordRural.aspx",
                wait_until="domcontentloaded",
                timeout=45000
            )
            await _wait_for_dropdown_options(page, ELEMENTS["district"], min_options=5, timeout_ms=20000)

            await page.select_option(ELEMENTS["record_type"], value=record_val)
            await page.wait_for_timeout(1000)

            if not await _select_cascading_option(
                page, ELEMENTS["district"], district, "District",
                next_selector=ELEMENTS["taluka"]
            ):
                print(f"  District '{district}' not matched")
                return []

            if not await _select_cascading_option(
                page, ELEMENTS["taluka"], taluka.replace("_", " "), "Taluka",
                next_selector=ELEMENTS["village"]
            ):
                print(f"  Taluka '{taluka}' not matched")
                return []

            village_el = page.locator(ELEMENTS["village"])
            options = await village_el.locator("option").all()
            villages = []
            for opt in options:
                text = (await opt.text_content() or "").strip()
                val = (await opt.get_attribute("value") or "").strip()
                if val and val not in ("0", "") and text:
                    villages.append(text)

            print(f"  Found {len(villages)} villages for {district} > {taluka}")
            return villages

        finally:
            try:
                await context.close()
            except Exception:
                pass
            try:
                await browser.close()
            except Exception:
                pass


async def scrape_anyror_data(
    district: str,
    taluka: str,
    village: str,
    survey_number: str,
    record_type: str = "OLD_SCAN_712",
    max_captcha_attempts: int = 5
):
    """
    Automates fetching Land Records from AnyROR Gujarat using Playwright.
    Uses Gemini Vision to solve CAPTCHAs and parse results.
    """
    print(f"\n{'='*60}")
    print(f"  AnyROR Scraper: {record_type}")
    print(f"  {district} > {taluka} > {village} > Survey {survey_number}")
    print(f"{'='*60}")

    async def _run_scrape():
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--single-process",
                    "--no-zygote",
                ]
            )
            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            async def _cleanup_and_return(result):
                try:
                    await context.close()
                except Exception:
                    pass
                try:
                    await browser.close()
                except Exception:
                    pass
                return result

            print("  [1/8] Navigating to AnyROR...")
            nav_ok = False
            for nav_attempt in range(1, 4):
                try:
                    await page.goto(
                        "https://anyror.gujarat.gov.in/LandRecordRural.aspx",
                        wait_until="domcontentloaded",
                        timeout=45000
                    )
                    nav_ok = True
                    break
                except Exception as e:
                    print(f"    Navigation attempt {nav_attempt} failed: {e}")
                    if nav_attempt < 3:
                        await asyncio.sleep(3)

            if not nav_ok:
                return await _cleanup_and_return(
                    {"error": "AnyROR portal is not reachable. Check your internet connection."}
                )

            await _wait_for_dropdown_options(page, ELEMENTS["district"], min_options=5, timeout_ms=20000)

            record_val = RECORD_TYPE_MAP.get(record_type, "11")
            print(f"  [2/8] Selecting record type: {record_type} (value={record_val})")
            await page.select_option(ELEMENTS["record_type"], value=record_val)
            await page.wait_for_timeout(1500)

            print(f"  [3/8] Selecting district: {district}")
            if not await _select_cascading_option(
                page, ELEMENTS["district"], district, "District",
                next_selector=ELEMENTS["taluka"]
            ):
                return await _cleanup_and_return(
                    {"error": f"District '{district}' not found in AnyROR. Try an English name like 'Ahmedabad'."}
                )

            print(f"  [4/8] Selecting taluka: {taluka}")
            taluka_clean = taluka.replace("_", " ")
            if not await _select_cascading_option(
                page, ELEMENTS["taluka"], taluka_clean, "Taluka",
                next_selector=ELEMENTS["village"]
            ):
                return await _cleanup_and_return(
                    {"error": f"Taluka '{taluka}' not found. Check spelling."}
                )

            print(f"  [5/8] Selecting village: {village}")
            field_type = FIELD_TYPE_MAP.get(record_type, "dropdown")
            next_sel = ELEMENTS["survey_dropdown"] if field_type == "dropdown" else None
            if not await _select_cascading_option(
                page, ELEMENTS["village"], village, "Village",
                next_selector=next_sel
            ):
                return await _cleanup_and_return(
                    {"error": f"Village '{village}' not found under taluka '{taluka}'."}
                )

            print(f"  [6/8] Entering search value: {survey_number} (field_type={field_type})")

            if field_type == "owner":
                owner_el = page.locator(ELEMENTS["owner_input"])
                if await owner_el.count() > 0 and await owner_el.is_visible():
                    await owner_el.fill(survey_number)
                else:
                    entry_el = page.locator(ELEMENTS["entry_input"])
                    if await entry_el.count() > 0:
                        await entry_el.fill(survey_number)

            elif field_type == "text":
                entry_el = page.locator(ELEMENTS["entry_input"])
                if await entry_el.count() > 0 and await entry_el.is_visible():
                    await entry_el.fill(survey_number)
                else:
                    print(f"    Text input not found")

            else:
                survey_el = page.locator(ELEMENTS["survey_dropdown"])
                if await survey_el.count() > 0 and await survey_el.is_visible():
                    options = await survey_el.locator("option").all()
                    options_texts = []
                    for opt in options:
                        text = (await opt.text_content() or "").strip()
                        val = await opt.get_attribute("value") or ""
                        if val and val != "0":
                            options_texts.append((val, text))

                    best = _find_best_option(options_texts, survey_number)
                    if best:
                        await survey_el.select_option(value=best)
                        print(f"    Survey matched")
                    else:
                        avail = [t for _, t in options_texts[:15]]
                        return await _cleanup_and_return(
                            {"error": f"Survey number '{survey_number}' not found in '{village}'. "
                                      f"Available options (first 15): {avail}"}
                        )
                else:
                    print(f"    Survey dropdown not visible, trying text input fallback")
                    entry_el = page.locator(ELEMENTS["entry_input"])
                    if await entry_el.count() > 0 and await entry_el.is_visible():
                        await entry_el.fill(survey_number)

            await page.wait_for_timeout(500)

            result_html = ""
            captcha_accepted = False

            for attempt in range(1, max_captcha_attempts + 1):
                print(f"  [7/8] CAPTCHA attempt {attempt}/{max_captcha_attempts}...")

                if attempt > 1:
                    refresh_btn = page.locator(ELEMENTS["refresh_captcha"])
                    if await refresh_btn.count() > 0:
                        await refresh_btn.click()
                        await page.wait_for_timeout(2000)

                captcha_img = page.locator(ELEMENTS["captcha_img"])
                if await captcha_img.count() > 0:
                    captcha_bytes = await captcha_img.screenshot(type="png")
                    solved_text = await solve_captcha_with_gemini(captcha_bytes)

                    if not solved_text:
                        continue

                    captcha_input = page.locator(ELEMENTS["captcha_input"])
                    await captcha_input.fill("")
                    await captcha_input.fill(solved_text)
                else:
                    print("    No CAPTCHA image found, proceeding anyway...")

                submit_btn = page.locator(ELEMENTS["submit_btn"])
                if await submit_btn.count() > 0:
                    await submit_btn.click()
                    try:
                        await page.wait_for_load_state("networkidle", timeout=20000)
                    except Exception:
                        pass
                    await page.wait_for_timeout(3000)

                result_html = await page.content()
                lower = result_html.lower()

                captcha_rejected = (
                    ("invalid" in lower and "captcha" in lower) or
                    ("wrong" in lower and "captcha" in lower) or
                    "invalid captcha" in lower or
                    "àªà«àªà« captcha" in result_html or
                    "captcha àªà«àªà«" in result_html
                )

                if captcha_rejected:
                    print(f"    CAPTCHA rejected on attempt {attempt}")
                    continue
                else:
                    print(f"    CAPTCHA accepted on attempt {attempt}!")
                    captcha_accepted = True
                    break

            if not result_html:
                return await _cleanup_and_return({"error": "No response from AnyROR portal"})

            if not captcha_accepted:
                return await _cleanup_and_return(
                    {"error": "All CAPTCHA attempts failed. Please try again later."}
                )

            lower_html = result_html.lower()
            for phrase in GUJARATI_NO_RECORD_PHRASES:
                if phrase.lower() in lower_html:
                    return await _cleanup_and_return(
                        {"error": f"No record found for Survey {survey_number} in {village}, {taluka}, {district}"}
                    )

            print("  [8/8] Parsing result with Gemini AI...")

            if record_type == "OLD_SCAN_712":
                print("    Using Gemini Vision for scanned document (OLD_SCAN_712)...")
                screenshot = await page.screenshot(full_page=True, type="png")
                parsed = await parse_result_with_gemini_vision(
                    screenshot, district, taluka, village, survey_number
                )
            else:
                parsed = await parse_result_with_gemini(
                    result_html, district, taluka, village, survey_number
                )
                if _count_populated_fields(parsed) < 2:
                    print("    HTML parse yielded sparse results, falling back to vision...")
                    screenshot = await page.screenshot(full_page=True, type="png")
                    vision_parsed = await parse_result_with_gemini_vision(
                        screenshot, district, taluka, village, survey_number
                    )
                    if _count_populated_fields(vision_parsed) > _count_populated_fields(parsed):
                        parsed = vision_parsed

            await _cleanup_and_return(None)

            parsed["status"] = "SUCCESS"
            print(f"  Done! Owner: {parsed.get('owner_name', 'â')}")
            return parsed

    try:
        return await asyncio.wait_for(_run_scrape(), timeout=120.0)
    except asyncio.TimeoutError:
        print("  Scraper timed out after 120 seconds")
        return {"error": "AnyROR scrape timed out. The government portal may be slow â try again."}
    except Exception as e:
        print(f"  Fatal Scraper Error: {e}")
        return {"error": str(e)}


# Direct test runner
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    result = asyncio.run(scrape_anyror_data(
        district="Ahmedabad",
        taluka="CITY",
        village="NAVRANGPURA",
        survey_number="1",
        record_type="OLD_SCAN_712"
    ))
    print(json.dumps(result, indent=2, ensure_ascii=False))
