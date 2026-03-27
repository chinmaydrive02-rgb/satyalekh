# Satya-Lekh — Sovereign Land Intelligence Platform

> Real-time Indian land title forensics powered by AI + Government Data Scraping

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-4264FB?logo=mapbox)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)

## What is Satya-Lekh?

Satya-Lekh is a cyberpunk-themed SaaS platform for Indian real estate title intelligence. It integrates **real-time government data scraping** (AnyROR Gujarat) with **AI-driven forensic analysis** (Google Gemini) to provide:

- **Autonomous Land Record Retrieval** — RPA bot scrapes AnyROR government portal with AI CAPTCHA solving
- **Title Genealogy Mapping** — Full ownership chain with encumbrance detection
- **Heritage & NMA Proximity Radar** — Satellite-verified proximity to protected monuments
- **Market Intelligence** — Demand heatmaps, Jantri hike predictions, news-driven analytics
- **Compliance Terminal** — Blockchain-immutable document verification with AI legal counsel

## Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (Next.js 16)           │
│   Tailwind v4 • Mapbox GL • Framer Motion   │
├─────────────────────────────────────────────┤
│              Backend (FastAPI)               │
│   Playwright RPA • Gemini Vision • Supabase  │
└─────────────────────────────────────────────┘
```

## Pages

| Route | Module | Description |
|-------|--------|-------------|
| `/` | Intel Map | Mapbox GL satellite view with plot overlays, risk coloring, heritage zones |
| `/upload` | Title Scanner | AnyROR RPA bot with cascading District→Taluka→Village→Survey selects |
| `/dashboard` | Portfolio | Asset ledger with live "Add Custom Asset" ingestion via government scraper |
| `/compliance` | Compliance | Blockchain audit terminal with AI counsel directives |
| `/market` | Market Intel | Demand heatmaps, news intelligence, Jantri analysis |
| `/property/[id]` | Property Deep-Dive | Title genealogy, heritage proximity, vicinity analytics |
| `/directory` | Legal Counsel | Verified legal professional directory |
| `/pricing` | API Pricing | Tier-based API access plans |
| `/contact` | Contact | Professional inquiry form |

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhb...
```

### Backend (`.env`)
```
GOOGLE_API_KEY=your_gemini_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_service_role_key
```

## AnyROR Integration

The platform mirrors the exact field hierarchy from the Gujarat government's AnyROR portal:

1. **Record Type** — VF-7 Survey Details, VF-8A Khata, VF-6 Mutation, Old Scanned
2. **District (જીલ્લો)** — All 33 Gujarat districts
3. **Taluka (તાલુકો)** — Cascading based on district
4. **Village (ગામ)** — Cascading based on taluka
5. **Survey/Block No.** — Auto-populated from village selection
6. **CAPTCHA** — Auto-solved via Gemini Vision AI

## License

Proprietary — Satya-Lekh Intelligence Corp
