# Playwright official Python image — includes all Chromium system deps
FROM mcr.microsoft.com/playwright/python:v1.52.0-jammy

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Local-only document reading; official Ubuntu packages, no cloud OCR upload.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr tesseract-ocr-eng tesseract-ocr-guj poppler-utils \
    && rm -rf /var/lib/apt/lists/*
RUN python -c "import shutil,subprocess; langs=subprocess.run(['tesseract','--list-langs'],check=True,capture_output=True,text=True).stdout.splitlines(); assert 'eng' in langs and 'guj' in langs; assert all(shutil.which(t) for t in ['pdfinfo','pdftotext','pdftoppm'])"

# Install Python deps first (layer cache-friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install the Chromium revision matching requirements.txt. The base image's
# bundled browsers may differ; do not assume they match the Python package.
RUN playwright install chromium --with-deps

# Fail the image build if Chromium or its system libraries cannot start.
RUN python -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); b = p.chromium.launch(headless=True); b.close(); p.stop()"

COPY . /app/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
