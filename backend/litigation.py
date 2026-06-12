# litigation.py — eCourts party-name litigation search (TEAL-style title check).
# Selectors verified against services.ecourts.gov.in/ecourtindia_v6 (June 2026):
#   state: #sess_state_code (Gujarat=17), district: #sess_dist_code,
#   complex: #court_complex_code, party tab: #partyname-tabMenu,
#   name: #petres_name, year: #rgyearP, radios: radP/radD/radB,
#   captcha img: #captcha_image, captcha input: #fcaptcha_code,
#   submit: js submit_party_name()

import asyncio
import json
from playwright.async_api import async_playwright
from scraper import get_gemini_client, solve_captcha_with_gemini, _find_best_option

ECOURTS_URL = "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"

_lit_cache: dict = {}


async def search_litigation(name: str, district: str, year: str, state_code: str = "17") -> dict:
    key = f"{state_code}|{district.lower()}|{name.lower()}|{year}"
    if key in _lit_cache:
        return _lit_cache[key]
    try:
        result = await asyncio.wait_for(
            _run(name, district, year, state_code), timeout=240.0)
    except asyncio.TimeoutError:
        return {"error": "eCourts portal timed out — try again in a few minutes."}
    except Exception as e:
        return {"error": f"Litigation search failed: {e}"}
    if "error" not in result:
        _lit_cache[key] = result
    return result


async def _run(name: str, district: str, year: str, state_code: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
                  "--disable-gpu", "--single-process", "--no-zygote"])
        page = await (await browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )).new_page()
        try:
            await page.goto(ECOURTS_URL, wait_until="commit", timeout=100000)
            await page.wait_for_selector("#sess_state_code", timeout=60000)
            # Dismiss any modal/banner
            try:
                await page.keyboard.press("Escape")
            except Exception:
                pass

            await page.select_option("#sess_state_code", value=state_code)
            await page.wait_for_function(
                "document.querySelectorAll('#sess_dist_code option').length > 1", timeout=30000)

            # Fuzzy-match the district among English option texts
            opts = await page.locator("#sess_dist_code option").all()
            pairs = []
            for o in opts:
                v = await o.get_attribute("value") or ""
                t = (await o.text_content() or "").strip()
                if v and v != "0":
                    pairs.append((v, t))
            best = _find_best_option(pairs, district)
            if not best:
                return {"error": f"District '{district}' not found on eCourts. "
                                 f"Available: {[t for _, t in pairs[:20]]}"}
            await page.select_option("#sess_dist_code", value=best)
            await page.wait_for_function(
                "document.querySelectorAll('#court_complex_code option').length > 1", timeout=30000)

            # Principal court complex = first real option (v1 limitation)
            copts = await page.locator("#court_complex_code option").all()
            complex_name = ""
            for o in copts:
                v = await o.get_attribute("value") or ""
                if v and v != "0":
                    await page.select_option("#court_complex_code", value=v)
                    complex_name = (await o.text_content() or "").strip()
                    break
            await page.wait_for_timeout(1500)

            # Party-name tab + form
            try:
                await page.click("#partyname-tabMenu", timeout=5000)
            except Exception:
                pass
            await page.fill("#petres_name", name)
            await page.fill("#rgyearP", year)
            try:
                await page.check("#radB")  # both pending & disposed
            except Exception:
                pass

            # CAPTCHA loop
            for attempt in range(1, 4):
                img = page.locator("#captcha_image")
                await img.wait_for(state="visible", timeout=20000)
                solved = await solve_captcha_with_gemini(await img.screenshot(type="png"))
                if not solved:
                    continue
                await page.fill("#fcaptcha_code", solved.strip())
                await page.evaluate("submit_party_name()")
                await page.wait_for_timeout(6000)
                body = (await page.inner_text("body"))[:30000]
                low = body.lower()
                if "invalid captcha" in low or "captcha not match" in low:
                    try:
                        await page.evaluate("refreshCaptcha && refreshCaptcha()")
                    except Exception:
                        pass
                    await page.wait_for_timeout(1500)
                    continue
                if "record not found" in low or "no record" in low or "not found" in low and "case" not in low:
                    return {"cases": [], "court_complex": complex_name,
                            "message": f"No cases found for '{name}' ({year}) in {complex_name}."}
                # Gemini-parse the results region into structured cases
                parsed = _parse_cases(body, name)
                return {"cases": parsed, "court_complex": complex_name,
                        "message": f"{len(parsed)} case(s) found in {complex_name} for {year}."}
            return {"error": "CAPTCHA could not be solved after 3 attempts — try again."}
        finally:
            await browser.close()


def _parse_cases(body_text: str, name: str) -> list:
    try:
        response = get_gemini_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                "Below is text from an Indian eCourts case-status results page after a "
                f"party-name search for '{name}'. Extract every case row into JSON array: "
                '[{"case_no": "...", "parties": "X vs Y", "case_type": "...", '
                '"status": "Pending/Disposed", "court": "..."}] '
                "Return ONLY the JSON array, [] if no case rows present.\n\n" + body_text[:20000]
            ])
        t = response.text.strip()
        if t.startswith("```json"):
            t = t[7:]
        if t.startswith("```"):
            t = t[3:]
        if t.endswith("```"):
            t = t[:-3]
        out = json.loads(t.strip())
        return out if isinstance(out, list) else []
    except Exception:
        return []
