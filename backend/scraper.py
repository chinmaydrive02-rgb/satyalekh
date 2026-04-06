import os
import asyncio
import json
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

# AnyROR Page Element IDs (discovered from https://anyror.gujarat.gov.in/LandRecordRural.aspx)
ELEMENTS = {
    "record_type": "#ContentPlaceHolder1_drpLandRecord",
    "district": "#ContentPlaceHolder1_ddlDistrict",
    "taluka": "#ContentPlaceHolder1_ddlTaluka",
    "village": "#ContentPlaceHolder1_ddlVillage",
    "survey_no": "#ContentPlaceHolder1_ddlOldScannedSno",       # For Old Scanned / VF-7 types
    "entry_input": "#ContentPlaceHolder1_txtNo",                 # For VF-6 / VF-8A entry numbers
    "captcha_img": "img[src*='CaptchaImage.aspx']",
    "captcha_input": "#ContentPlaceHolder1_txt_captcha_1",
    "submit_btn": "#ContentPlaceHolder1_btnGo",
    "refresh_captcha": "#ContentPlaceHolder1_lb_refresh_1",
}

# Record type values as they appear in the AnyROR dropdown
RECORD_TYPE_MAP = {
    "OLD_SCAN_712": "1",  # Old Scanned VF-7/12
    "OLD_SCAN_6": "2",    # Old Scanned VF-6
    "VF7": "3",           # VF-7 Survey No Details
    "VF8A": "4",          # VF-8A Khata Details
    "VF6": "5",           # VF-6 Entry Details
    "135D": "6",          # 135-D Notice
    "OWNER_NAME": "7",    # Know Khata by Owner Name
    "INTEGRATED": "8",    # Integrated ROR
}


async def solve_captcha_with_gemini(screenshot_bytes: bytes) -> str:
    """Uses Gemini Vision to decode the AnyROR CAPTCHA."""
    try:
        document = types.Part.from_bytes(
            data=screenshot_bytes,
            mime_type="image/png",
        )
        response = get_gemini_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                "Read the exact alpha-numeric text in this CAPTCHA image. "
                "Reply ONLY with the text you see, no extra characters, spaces, or punctuation. "
                "The text is usually 5-6 characters. Output ONLY the characters.",
                document
            ]
        )
        solved = response.text.strip().replace(" ", "")
        print(f"  Gemini CAPTCHA solution: '{solved}'")
        return solved
    except Exception as e:
        print(f"  Gemini Captcha Solve Error: {e}")
        return ""


async def parse_result_with_gemini(html: str, district: str, taluka: str, village: str, survey_number: str) -> dict:
    """Uses Gemini to extract structured land record data from the AnyROR result HTML."""
    try:
        # Trim HTML to relevant portion (the result tables are usually in the middle)
        # Remove scripts and styles to reduce token usage
        import re
        html_clean = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        html_clean = re.sub(r'<style[^>]*>.*?</style>', '', html_clean, flags=re.DOTALL)
        # Take a reasonable slice around the result area
        if len(html_clean) > 15000:
            html_clean = html_clean[:15000]

        response = get_gemini_client().models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                f"""You are analyzing a Gujarat government land record (7/12 extract) HTML page from AnyROR.
The user searched for: District={district}, Taluka={taluka}, Village={village}, Survey No={survey_number}.

Extract ALL available land record information from the HTML below and return as JSON. 
Translate any Gujarati text to English.

Return ONLY valid JSON with these fields (use "—" if a field is not found):
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
        # Clean markdown wrapping
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        json_text = json_text.strip()

        data = json.loads(json_text)
        return data

    except Exception as e:
        print(f"  Gemini Parse Error: {e}")
        return {
            "message": "Record retrieved but parsing failed",
            "owner_name": "—",
            "survey_no": survey_number,
            "village": village,
            "district": district,
            "taluka": taluka,
            "area": "—",
            "tenure_type": "—",
            "cultivation": "—",
            "mutation_entries": "—",
            "encumbrances": "—",
            "jantri_rate": "—",
            "last_sale": "—"
        }


async def scrape_anyror_data(
    district: str,
    taluka: str,
    village: str,
    survey_number: str,
    record_type: str = "OLD_SCAN_712",
    max_captcha_attempts: int = 3
):
    """
    Automates fetching Land Records from AnyROR Gujarat using Playwright.
    Uses Gemini Vision to solve CAPTCHAs and parse results.
    """
    print(f"\n{'='*60}")
    print(f"  AnyROR Scraper: {record_type}")
    print(f"  {district} > {taluka} > {village} > Survey {survey_number}")
    print(f"{'='*60}")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            print("  [1/8] Navigating to AnyROR...")
            await page.goto(
                "https://anyror.gujarat.gov.in/LandRecordRural.aspx",
                wait_until="networkidle",
                timeout=30000
            )

            # 1. Select Record Type
            print(f"  [2/8] Selecting record type: {record_type}")
            record_val = RECORD_TYPE_MAP.get(record_type, "1")
            await page.select_option(ELEMENTS["record_type"], value=record_val)
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(1000)

            # 2. Select District
            print(f"  [3/8] Selecting district: {district}")
            dist_el = page.locator(ELEMENTS["district"])
            if await dist_el.count() > 0:
                try:
                    await dist_el.select_option(label=district)
                except:
                    # Try by partial text match
                    options = await dist_el.locator("option").all()
                    for opt in options:
                        text = await opt.text_content()
                        if text and district.lower() in text.lower():
                            val = await opt.get_attribute("value")
                            await dist_el.select_option(value=val)
                            break
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(1000)

            # 3. Select Taluka
            print(f"  [4/8] Selecting taluka: {taluka}")
            taluka_el = page.locator(ELEMENTS["taluka"])
            if await taluka_el.count() > 0:
                taluka_clean = taluka.replace("_", " ")
                try:
                    await taluka_el.select_option(label=taluka_clean)
                except:
                    options = await taluka_el.locator("option").all()
                    for opt in options:
                        text = await opt.text_content()
                        if text and taluka_clean.lower() in text.lower():
                            val = await opt.get_attribute("value")
                            await taluka_el.select_option(value=val)
                            break
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(1000)

            # 4. Select Village
            print(f"  [5/8] Selecting village: {village}")
            village_el = page.locator(ELEMENTS["village"])
            if await village_el.count() > 0:
                try:
                    await village_el.select_option(label=village)
                except:
                    options = await village_el.locator("option").all()
                    for opt in options:
                        text = await opt.text_content()
                        if text and village.lower() in text.lower():
                            val = await opt.get_attribute("value")
                            await village_el.select_option(value=val)
                            break
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(1000)

            # 5. Enter Survey/Block Number
            print(f"  [6/8] Entering survey no: {survey_number}")
            # Try the survey dropdown first (for Old Scanned types)
            survey_el = page.locator(ELEMENTS["survey_no"])
            if await survey_el.count() > 0 and await survey_el.is_visible():
                try:
                    await survey_el.select_option(label=survey_number)
                except:
                    # Try value-based
                    options = await survey_el.locator("option").all()
                    for opt in options:
                        text = await opt.text_content()
                        if text and survey_number in text.strip():
                            val = await opt.get_attribute("value")
                            await survey_el.select_option(value=val)
                            break
            else:
                # Fall back to text input (for VF-6, VF-8A, etc.)
                entry_el = page.locator(ELEMENTS["entry_input"])
                if await entry_el.count() > 0 and await entry_el.is_visible():
                    await entry_el.fill(survey_number)
            await page.wait_for_timeout(500)

            # 6. CAPTCHA solving loop
            result_html = ""
            for attempt in range(1, max_captcha_attempts + 1):
                print(f"  [7/8] CAPTCHA attempt {attempt}/{max_captcha_attempts}...")
                
                # Refresh captcha on retry
                if attempt > 1:
                    refresh_btn = page.locator(ELEMENTS["refresh_captcha"])
                    if await refresh_btn.count() > 0:
                        await refresh_btn.click()
                        await page.wait_for_timeout(1500)

                captcha_img = page.locator(ELEMENTS["captcha_img"]).first
                if await captcha_img.count() > 0:
                    captcha_bytes = await captcha_img.screenshot(type="png")
                    solved_text = await solve_captcha_with_gemini(captcha_bytes)

                    if not solved_text:
                        print(f"    CAPTCHA solve returned empty, retrying...")
                        continue

                    captcha_input = page.locator(ELEMENTS["captcha_input"])
                    await captcha_input.fill("")
                    await captcha_input.fill(solved_text)
                else:
                    print("    No CAPTCHA image found, proceeding...")

                # Click submit
                submit_btn = page.locator(ELEMENTS["submit_btn"])
                if await submit_btn.count() > 0:
                    await submit_btn.click()
                    await page.wait_for_load_state("networkidle")
                    await page.wait_for_timeout(2000)

                result_html = await page.content()

                # Check if CAPTCHA failed
                if "invalid" in result_html.lower() and "captcha" in result_html.lower():
                    print(f"    CAPTCHA rejected on attempt {attempt}")
                    continue
                else:
                    print(f"    CAPTCHA accepted on attempt {attempt}!")
                    break

            await browser.close()

            # Check for various failure modes
            if not result_html:
                return {"error": "No response from AnyROR portal"}

            lower_html = result_html.lower()
            if "invalid captcha" in lower_html or "wrong captcha" in lower_html:
                return {"error": "All CAPTCHA attempts failed. Please try again."}

            if "no record found" in lower_html or "record not found" in lower_html:
                return {"error": f"No record found for Survey {survey_number} in {village}, {taluka}, {district}"}

            # 8. Parse result with Gemini
            print("  [8/8] Parsing result with Gemini AI...")
            parsed = await parse_result_with_gemini(
                result_html, district, taluka, village, survey_number
            )
            parsed["status"] = "SUCCESS"
            print(f"  ✓ Done! Owner: {parsed.get('owner_name', '—')}")
            return parsed

    except Exception as e:
        print(f"  ✗ Fatal Scraper Error: {e}")
        return {"error": str(e)}


# Direct test runner
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    result = asyncio.run(scrape_anyror_data(
        district="AHMEDABAD",
        taluka="CITY",
        village="NAVRANGPURA",
        survey_number="1",
        record_type="OLD_SCAN_712"
    ))
    print(json.dumps(result, indent=2, ensure_ascii=False))
