# Playwright official Python image — includes all Chromium system deps
FROM mcr.microsoft.com/playwright/python:v1.52.0-jammy

WORKDIR /app

# Install Python deps first (layer cache-friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install only Chromium (skip Firefox/WebKit to save ~500 MB)
RUN playwright install chromium --with-deps

COPY . /app/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
