---
name: Satya-Lekh Project Context
description: Comprehensive architecture, routing, and RPA scraper logic for the Satya-Lekh real estate intelligence platform.
---

# Satya-Lekh Project Context & Comprehensive Handoff

## 🤖 To Claude Code: Read This First
Hello Claude! You are taking over "Satya-Lekh," a comprehensive Real Estate Intelligence Platform built for Gujarat, India. The foundation has been perfectly set by Antigravity (Google DeepMind). Please read this entire document carefully, as it details the full architecture, routing, and critical business logic.

---

## 🚀 The Product: Satya-Lekh
Satya-Lekh provides automated due diligence, land record (AnyROR) scraping, and market intelligence for real estate investors and lawyers in Gujarat. It transforms complex government data into actionable, visual insights.

## 🏗️ Architecture Stack
- **Frontend:** Next.js 16.2 (App Router), React 19, TypeScript, TailwindCSS, Framer Motion, Recharts, Lucide React.
- **Backend:** FastAPI (Python 3.9+). Note: Python 3.9 means you MUST use `typing.Optional` instead of `| None` for type hints!
- **RPA Engine:** Playwright (`v1.52.0`) + Gemini 1.5 Flash (for AI vision/parsing).
- **Database/Auth:** Supabase.
- **Deployment Configured For:** Render (`render.yaml` exists for the backend).

---

## 🗺️ Frontend Structure & Routing (`frontend/src/app`)
The frontend is a fully responsive, glassmorphic dashboard. It uses a persistent `Sidebar` and `Navbar` layout.

**Core Routes:**
1. `page.tsx` (Home): An interactive "Intel Map" with a `SearchWidget` for looking up land parcels. The widget uses free-text inputs for District, Taluka, and Village.
2. `/dashboard`: The main portfolio view. Shows aggregated statistics (using `recharts`) and allows users to manually track land parcels via a free-text form.
3. `/upload` (Title Scanner): The core RPA interface. Users select an AnyROR Record Type and enter District/Taluka/Village/Survey to trigger the backend scraper. Features a beautiful multi-stage progress animation while the bot runs.
4. `/property/[id]`: Dynamic route displaying the fetched AnyROR data. **Crucial:** Next.js 16 requires `params` and `searchParams` to be unwrapped as Promises using `React.use()`. *Do not revert this to synchronous access.*
5. `/market`: Market intelligence feed. Displays live charts and actionable real estate news (wrapped in functional `<a>` tags to source URLs).
6. `/compliance` & `/directory` & `/pricing` & `/contact`: Supporting pages for legal workflows, lawyer directories, and platform information.

---

## 🛠️ The AnyROR Scraper Core (`backend/scraper.py`)
This is the "crown jewel" of the project. It bypasses the severe limitations of the Gujarat Government's portal (`https://anyror.gujarat.gov.in/LandRecordRural.aspx`):

### 1. The "English to Gujarati" AI Translation Pipeline
The government portal's dropdowns are strictly in Gujarati. Users input English names (e.g., "Daskroi", "Kathwada").
- **The Process:** The scraper first attempts a direct fuzzy match. If that fails, it uses **Gemini 1.5 Flash** to translate the English input into Gujarati script.
- **Advanced Matching:** It uses `difflib.SequenceMatcher` to fuzzy-match the translated Gujarati against the actual dropdown options. It specifically strips out trailing village codes (e.g., ` - 049`) before matching. *Do not touch this fuzzy matching logic, it took extensive tuning to perfect.*

### 2. Verified DOM Selectors & Dynamic Postbacks
AnyROR uses ancient ASP.NET `__doPostBack` mechanics.
- The Survey Number field **does not exist** on initial load. It appears dynamically after the Record Type is selected.
- The field type changes dynamically! For `VF7` it's a dropdown (`ddlSurveyNo`). For `VF8A` it's a text input (`txtNo`). For `OWNER_NAME` it's another text input (`txtownername`).
- These dynamic flows and exact HTML IDs are fully mapped in `FIELD_TYPE_MAP` and `ELEMENTS`. 

### 3. Record Type Values
Verified exact integer values for the dropdowns (Never change these):
- `OLD_SCAN_712`: "11"
- `VF7`: "1", `VF8A`: "2", `VF6`: "3", `INTEGRATED`: "8", `OWNER_NAME`: "10"

### 4. AI CAPTCHA Solving
The scraper uses Gemini Vision to capture the base64 image of the numeric CAPTCHA and solve it. It has a retry loop configured for `max_captcha_attempts=5`.

---

## 📡 Backend API Endpoints (`backend/main.py`)
1. `POST /fetch-anyror`: Triggers the RPA bot. Validates inputs (requires District, Taluka, Village, Survey No) and returns HTTP 422 on bad data.
2. `POST /analyze-record`: A secondary feature. Accepts a PDF or Image upload of a physical 7/12 land record document. Uses Gemini Vision to perform OCR, extract details, and assign a Risk Level (Green/Yellow/Red) based on the tenure type and encumbrances.
3. `GET /health`: Comprehensive health check validating Playwright, Gemini (`GOOGLE_API_KEY`), and Env Vars.

---

## 🚦 Claude's Directives
When you start working, please follow these rules:
1. **Preserve the RPA Bot:** If you edit `scraper.py`, test it by hitting the `/fetch-anyror` endpoint. Do not simplify the fuzzy matching or ASP.NET wait times.
2. **Respect Python 3.9:** No modern union syntax (`str | int`) in the backend. Use `typing.Optional`.
3. **Keep the UI Premium:** Ensure any new frontend components match the vibrant, modern glassmorphic design system already in place (use Tailwind utilities like `bg-white/5 backdrop-blur-md`). Do not introduce generic, unstyled elements.
4. **Assume Backend Foundation is Solid:** The AnyROR data fetching is 100% stable. Focus your efforts on extending functionality, adding persistent database storage via Supabase, or improving the frontend user experience.
