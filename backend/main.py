from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types

app = FastAPI(title="Satya-Lekh API")

# Allow CORS for Next.js app (local + Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
async def fetch_anyror_endpoint(request: AnyRORRequest):
    """
    Automated RPA endpoint to scrape AnyROR 7/12 Land Records.
    Uses Playwright + Gemini Vision for CAPTCHA solving and data extraction.
    """
    result = await scrape_anyror_data(
        district=request.district,
        taluka=request.taluka,
        village=request.village,
        survey_number=request.survey_no,
        record_type=request.record_type or "OLD_SCAN_712"
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result


# ─── Health Check ──────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "Satya-Lekh API is running", "version": "2.0"}
