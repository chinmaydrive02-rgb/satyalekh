from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Satya-Lekh API")

# Allow CORS for Next.js app (local + Vercel + Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_noindex_header(request: Request, call_next):
    """Prevent search engines from indexing the API during development."""
    response = await call_next(request)
    response.headers["X-Robots-Tag"] = "noindex"
    return response


# ─── Payments / Credits (Stripe + Supabase) ───────────────────────────────
# Graceful degradation: if STRIPE_ENABLED is not "true", all credit checks
# are skipped and the app behaves exactly as before (free searches).
# Owner must set on Render: STRIPE_ENABLED=true, STRIPE_SECRET_KEY,
# STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_KEY (and optionally FRONTEND_URL).

STRIPE_ENABLED = os.getenv("STRIPE_ENABLED", "").strip().lower() in ("1", "true", "yes")
PRICE_PER_SEARCH_PAISE = 150000   # ₹1,500 per search credit
PRICE_FIVE_PACK_PAISE = 600000    # ₹6,000 for 5 credits (20% discount)
# New users automatically get this many free searches (the conversion funnel:
# try for free → see the value → buy credits). Set FREE_TRIAL_CREDITS=0 to disable.
FREE_TRIAL_CREDITS = int(os.getenv("FREE_TRIAL_CREDITS", "2"))


def _get_stripe():
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe is not configured (STRIPE_SECRET_KEY missing)")
    return stripe


def _get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None
    from supabase import create_client
    return create_client(url, key)


def _get_credits(email: str) -> int:
    """Read credit balance from the Supabase user_credits table.
    First-time emails are auto-created with FREE_TRIAL_CREDITS free searches."""
    sb = _get_supabase()
    if sb is None:
        return 0
    try:
        res = sb.table("user_credits").select("credits").eq("user_email", email).limit(1).execute()
        if res.data:
            return int(res.data[0].get("credits") or 0)
        # New user → grant the free trial
        sb.table("user_credits").insert({"user_email": email, "credits": FREE_TRIAL_CREDITS}).execute()
        print(f"[credits] new user {email} granted {FREE_TRIAL_CREDITS} trial credits")
        return FREE_TRIAL_CREDITS
    except Exception as e:
        print(f"[credits] read failed: {e}")
    return 0


def _add_credits(email: str, amount: int) -> int:
    """Increment (or decrement, with negative amount) a user's credits. Clamps at 0."""
    sb = _get_supabase()
    if sb is None:
        return 0
    try:
        res = sb.table("user_credits").select("id, credits").eq("user_email", email).limit(1).execute()
        if res.data:
            new_balance = max(0, int(res.data[0].get("credits") or 0) + amount)
            sb.table("user_credits").update({"credits": new_balance}).eq("id", res.data[0]["id"]).execute()
            return new_balance
        new_balance = max(0, amount)
        sb.table("user_credits").insert({"user_email": email, "credits": new_balance}).execute()
        return new_balance
    except Exception as e:
        print(f"[credits] write failed: {e}")
        return 0


class CheckoutRequest(BaseModel):
    email: str
    quantity: int = 1


@app.post("/create-checkout-session")
async def create_checkout_session(body: CheckoutRequest, request: Request):
    """Create a Stripe Checkout session for search credits (₹1,500 each, ₹6,000 for 5)."""
    if not STRIPE_ENABLED:
        raise HTTPException(status_code=503, detail="Payments are not enabled yet. Please use the contact form on the pricing page.")
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email is required")
    quantity = max(1, min(int(body.quantity or 1), 100))

    stripe = _get_stripe()
    if quantity == 5:
        # Discounted 5-pack: ₹6,000 total (20% off)
        line_items = [{
            "price_data": {
                "currency": "inr",
                "unit_amount": PRICE_FIVE_PACK_PAISE,
                "product_data": {"name": "Satya-Lekh — 5 AnyROR Search Credits (20% off)"},
            },
            "quantity": 1,
        }]
        credits = 5
    else:
        line_items = [{
            "price_data": {
                "currency": "inr",
                "unit_amount": PRICE_PER_SEARCH_PAISE,
                "product_data": {"name": "Satya-Lekh — AnyROR Search Credit"},
            },
            "quantity": quantity,
        }]
        credits = quantity

    origin = request.headers.get("origin") or os.getenv("FRONTEND_URL", "http://localhost:3000")
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            customer_email=email,
            line_items=line_items,
            success_url=f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/pricing",
            metadata={"user_email": email, "credits": str(credits)},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe checkout creation failed: {e}")
    return {"checkout_url": session.url}


@app.get("/credits")
def credits_endpoint(email: str):
    """Return the current search-credit balance for an email."""
    email = email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="email query param is required")
    return {
        "email": email,
        "credits": _get_credits(email) if STRIPE_ENABLED else 0,
        "payments_enabled": STRIPE_ENABLED,
        "free_trial_credits": FREE_TRIAL_CREDITS,
    }


@app.get("/config")
def config_endpoint():
    """Lightweight public config — lets the frontend adapt its UI without an email."""
    return {
        "payments_enabled": STRIPE_ENABLED,
        "free_trial_credits": FREE_TRIAL_CREDITS,
        "price_single_inr": PRICE_PER_SEARCH_PAISE // 100,
        "price_pack5_inr": PRICE_FIVE_PACK_PAISE // 100,
    }


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook: on checkout.session.completed, grant purchased credits."""
    if not STRIPE_ENABLED:
        raise HTTPException(status_code=503, detail="Payments are not enabled")
    stripe = _get_stripe()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            # No secret configured — accept unverified (development only)
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook payload: {e}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id") or ""
        metadata = session.get("metadata") or {}
        email = (metadata.get("user_email") or session.get("customer_email") or "").strip().lower()
        credits = int(metadata.get("credits") or "1")
        if email:
            # Idempotency: Stripe retries webhooks — never credit the same session twice
            sb = _get_supabase()
            if sb is not None and session_id:
                try:
                    existing = sb.table("payments").select("id").eq("stripe_session_id", session_id).limit(1).execute()
                    if existing.data:
                        print(f"[stripe] session {session_id} already processed — skipping")
                        return {"received": True, "duplicate": True}
                    sb.table("payments").insert({
                        "stripe_session_id": session_id,
                        "user_email": email,
                        "credits": credits,
                        "amount_paise": session.get("amount_total") or 0,
                    }).execute()
                except Exception as e:
                    print(f"[stripe] payments table write failed (continuing): {e}")
            new_balance = _add_credits(email, credits)
            print(f"[stripe] +{credits} credits for {email} → balance {new_balance}")
    return {"received": True}


# ─── Manual OCR Upload Endpoint ───────────────────────────────────────────

class AnalysisResult(BaseModel):
    owner_name: str
    survey_no: str
    total_area: str
    tenure_type: str
    encumbrances: str
    risk_level: str
    risk_reason: str

@app.post("/analyze-record", response_model=AnalysisResult)
async def analyze_record(file: UploadFile = File(...)):
    """
    Analyzes an uploaded 7/12 Land Record using Gemini Vision.
    Extracts key information and assigns a risk label.
    """
    if not file.content_type.startswith("image/") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only image or PDF files are supported.")
        
    try:
        contents = await file.read()
        client = genai.Client()

        prompt = (
            "Analyze this Gujarati Land Record. Extract: 'Owner Name', 'Survey No', "
            "'Total Area', 'Tenure Type (Satta Prakar)', and 'Encumbrances (Boj)'. "
            "Translate the content to English and return ONLY valid JSON in the "
            "following format:\n"
            "{\n"
            "  \"owner_name\": \"...\",\n"
            "  \"survey_no\": \"...\",\n"
            "  \"total_area\": \"...\",\n"
            "  \"tenure_type\": \"...\",\n"
            "  \"encumbrances\": \"...\"\n"
            "}"
        )
        
        document = types.Part.from_bytes(
            data=contents,
            mime_type=file.content_type,
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, document]
        )
        
        json_text = response.text
        if json_text.startswith("```json"):
            json_text = json_text[7:-3]
        elif json_text.startswith("```"):
            json_text = json_text[3:-3]
            
        data = json.loads(json_text)
        
        # Risk Logic
        tenure = data.get("tenure_type", "").lower()
        encum = data.get("encumbrances", "").strip()
        
        risk_level = "GREEN"
        risk_reason = "Clear Title"
        
        if "new" in tenure or "navi" in tenure:
            risk_level = "YELLOW"
            risk_reason = "Restricted Development / New Tenure"
        
        if encum and encum.lower() not in ["none", "null", "", "n/a", "no", "nil", "—"]:
            risk_level = "RED"
            risk_reason = "Mortgaged or Encumbered"
            
        if ("new" in tenure or "navi" in tenure) and risk_level == "RED":
            risk_reason = "Restricted & Mortgaged"
        
        return {
            "owner_name": data.get("owner_name", "Unknown"),
            "survey_no": data.get("survey_no", "Unknown"),
            "total_area": data.get("total_area", "Unknown"),
            "tenure_type": data.get("tenure_type", "Unknown"),
            "encumbrances": encum.capitalize() if encum else "None",
            "risk_level": risk_level,
            "risk_reason": risk_reason
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ─── Automated AnyROR RPA Endpoint ────────────────────────────────────────

from scraper import scrape_anyror_data

class AnyRORRequest(BaseModel):
    district: str
    taluka: str
    village: str
    survey_no: str
    record_type: Optional[str] = "OLD_SCAN_712"

@app.post("/fetch-anyror")
async def fetch_anyror_endpoint(request: AnyRORRequest, x_user_email: Optional[str] = Header(default=None)):
    """
    Automated RPA endpoint to scrape AnyROR 7/12 Land Records.
    Uses Playwright + Gemini Vision for CAPTCHA solving and data extraction.
    When STRIPE_ENABLED=true, requires an X-User-Email header with credits > 0;
    one credit is deducted per successful fetch.
    """
    # Validate inputs
    if not request.district or not request.district.strip():
        raise HTTPException(status_code=400, detail="District is required")
    if not request.taluka or not request.taluka.strip():
        raise HTTPException(status_code=400, detail="Taluka is required")
    if not request.village or not request.village.strip():
        raise HTTPException(status_code=400, detail="Village is required")
    if not request.survey_no or not request.survey_no.strip():
        raise HTTPException(status_code=400, detail="Survey number is required")

    # Credit gate (only enforced when payments are enabled)
    email = (x_user_email or "").strip().lower()
    if STRIPE_ENABLED:
        if not email:
            raise HTTPException(
                status_code=402,
                detail="Payment required: send your account email in the X-User-Email header. Buy search credits on the pricing page."
            )
        if _get_credits(email) <= 0:
            raise HTTPException(
                status_code=402,
                detail="No search credits remaining. Purchase credits on the pricing page (₹1,500/search)."
            )

    result = await scrape_anyror_data(
        district=request.district.strip(),
        taluka=request.taluka.strip(),
        village=request.village.strip(),
        survey_number=request.survey_no.strip(),
        record_type=request.record_type or "OLD_SCAN_712"
    )
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    # Deduct one credit on success
    if STRIPE_ENABLED and email:
        try:
            _add_credits(email, -1)
        except Exception as e:
            print(f"[credits] deduction failed for {email}: {e}")

    return result


# ─── Cascading Dropdown Options ───────────────────────────────────────────

from gujarat_data import get_districts, get_talukas

@app.get("/options/districts")
def districts_endpoint():
    """Return all Gujarat districts (static dataset)."""
    return {"districts": get_districts()}

@app.get("/options/talukas")
def talukas_endpoint(district: str):
    """Return talukas for a given district (static dataset)."""
    talukas = get_talukas(district)
    if not talukas:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found")
    return {"district": district, "talukas": talukas}

@app.get("/options/villages")
async def villages_endpoint(district: str, taluka: str):
    """
    Fetch villages from AnyROR for a given district+taluka.
    First call takes ~20-30s (Playwright scrape + Gemini translation).
    Subsequent calls are instant (in-memory cache).
    """
    from scraper import fetch_villages
    villages = await fetch_villages(district=district.strip(), taluka=taluka.strip())
    return {"district": district, "taluka": taluka, "villages": villages}

@app.get("/options/surveys")
def surveys_endpoint(district: str, taluka: str, village: str):
    """
    Return previously-seen survey numbers for a village (cached from past
    scrapes in Supabase). Instant — returns [] if nothing cached yet.
    """
    from scraper import get_cached_survey_options
    options = get_cached_survey_options(district, taluka, village)
    return {"district": district, "taluka": taluka, "village": village, "surveys": options}


# ─── Health Check ──────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "Satya-Lekh API is running", "version": "2.1"}

@app.get("/health")
async def health_check():
    """Comprehensive health check — verifies Playwright, Gemini, and env vars."""
    checks = {}
    
    # Check env vars
    checks["google_api_key"] = "SET" if os.getenv("GOOGLE_API_KEY") else "MISSING"
    
    # Check Playwright
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            await browser.close()
        checks["playwright"] = "OK"
    except Exception as e:
        checks["playwright"] = f"ERROR: {str(e)[:100]}"
    
    # Check Gemini
    try:
        from scraper import get_gemini_client
        client = get_gemini_client()
        checks["gemini"] = "OK"
    except Exception as e:
        checks["gemini"] = f"ERROR: {str(e)[:100]}"
    
    all_ok = all(v in ("OK", "SET") for v in checks.values())
    return {"healthy": all_ok, "checks": checks}
