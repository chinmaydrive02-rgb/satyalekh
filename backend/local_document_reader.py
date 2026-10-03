"""Bounded, local-only extraction. OCR evidence is preliminary, never title clearance."""
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time

MAX_BYTES = 10 * 1024 * 1024
MAX_PAGES = 3
MAX_TEXT_BYTES = 256 * 1024
MAX_RENDER_BYTES = 12 * 1024 * 1024
TOTAL_TIMEOUT = 45
# Apply limits in a fresh child interpreter, avoiding preexec_fn in the
# multithreaded API process. Child then execs a fixed local tool directly.
_LIMITED_EXEC = (
    "import os,resource,sys;"
    "resource.setrlimit(resource.RLIMIT_FSIZE,(12582912,12582912));"
    "resource.setrlimit(resource.RLIMIT_AS,(268435456,268435456)) if sys.platform.startswith('linux') else None;"
    "resource.setrlimit(resource.RLIMIT_CPU,(20,20));"
    "\ntry:\n os.execvp(sys.argv[1],sys.argv[1:])"
    "\nexcept FileNotFoundError:\n sys.exit(127)"
)
FIELDS = {
    "owner_name": [r"owner\s*name", r"holder\s*name", r"ખાતેદાર(?:નું)?\s*નામ", r"માલિક(?:નું)?\s*નામ"],
    "survey_no": [r"survey\s*(?:no\.?|number)", r"સર્વે\s*(?:નંબર|નં\.?)", r"બ્લોક\s*(?:નંબર|નં\.?)"],
    "total_area": [r"total\s*area", r"area", r"કુલ\s*ક્ષેત્રફળ", r"ક્ષેત્રફળ"],
    "tenure_type": [r"tenure\s*type", r"satta\s*prakar", r"સત્તા\s*પ્રકાર"],
    "encumbrances": [r"encumbrances?", r"બોજો?"],
}
MIME_EXTENSIONS = {"application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}


class LocalDocumentError(Exception):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code, self.detail = status_code, detail


def _run(arguments, deadline, output_path=None):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise LocalDocumentError(504, "Local document reading timed out. Try a smaller or clearer document.")
    # stdout is written to disk, not retained without a bound in process memory.
    target = open(output_path, "wb") if output_path else open(os.devnull, "wb")
    try:
        subprocess.run([sys.executable, "-c", _LIMITED_EXEC, *arguments], shell=False, check=True, stdout=target,
                       stderr=subprocess.DEVNULL, timeout=min(20, remaining),
                       env={**os.environ, "OMP_THREAD_LIMIT": "1", "LC_ALL": "C.UTF-8"})
    except FileNotFoundError:
        raise LocalDocumentError(503, "Local document reading is not installed on this server.") from None
    except subprocess.TimeoutExpired:
        raise LocalDocumentError(504, "Local document reading timed out. Try a smaller or clearer document.") from None
    except subprocess.CalledProcessError as exc:
        if exc.returncode == 127:
            raise LocalDocumentError(503, "Local document reading is not installed on this server.") from None
        raise LocalDocumentError(422, "This document could not be read locally. Upload a readable, unlocked PDF or image.") from None
    finally:
        target.close()


def _read_text(path):
    if not path.exists():
        raise LocalDocumentError(422, "The document reader produced no readable text.")
    if path.stat().st_size > MAX_TEXT_BYTES:
        raise LocalDocumentError(413, "Document text exceeds the local reading limit. Upload a smaller extract.")
    return path.read_bytes().decode("utf-8", errors="replace").replace("\x00", "")


def extract_fields(pages):
    """Only labelled values on a single source line; preserve Gujarati verbatim."""
    evidence, warnings = [], []
    result = {field: "Unknown" for field in FIELDS}
    for field, labels in FIELDS.items():
        pattern = re.compile(r"^\s*(?:" + "|".join(labels) + r")\s*(?::|：|=|\t| {2,})\s*(.*?)\s*$", re.IGNORECASE)
        matches = []
        for page in pages:
            for line in page["text"].splitlines():
                matched = pattern.match(line)
                if not matched:
                    continue
                value = matched.group(1).strip()
                if not value or value.casefold() in {"unknown", "n/a", "null", "-", "—"}:
                    continue
                # Never guess where adjacent table cells start/end.
                if len(value) > 250 or "\t" in value or re.search(r" {3,}\S", value):
                    warnings.append(f"Ambiguous {field} layout requires manual review.")
                    continue
                matches.append(value)
                evidence.append({"field": field, "value": value, "page": page["page"],
                                 "snippet": line[:400], "method": page["method"],
                                 "confidence": "unverified_label_match"})
        unique = list(dict.fromkeys(matches))
        if len(unique) == 1:
            result[field] = unique[0]
        elif len(unique) > 1:
            warnings.append(f"Conflicting {field} values require manual review.")
    return result, evidence, warnings


def read_document(contents, mime_type):
    """Read at most three PDF pages or one image without external processing.

    Caller must enforce a concurrency cap and run this synchronous function off
    the API event loop. File names are generated internally, never client input.
    """
    if mime_type not in MIME_EXTENSIONS:
        raise LocalDocumentError(400, "Only PDF, PNG, JPG and WebP documents are supported.")
    if not contents or len(contents) > MAX_BYTES:
        raise LocalDocumentError(413 if contents else 400, "Upload a non-empty document of at most 10 MB.")
    deadline = time.monotonic() + TOTAL_TIMEOUT
    pages, warnings = [], []
    with tempfile.TemporaryDirectory(prefix="satyalekh-local-") as temporary:
        directory = Path(temporary)
        source = directory / ("record" + MIME_EXTENSIONS[mime_type])
        source.write_bytes(contents)
        if mime_type == "application/pdf":
            info = directory / "info.txt"
            _run(["pdfinfo", str(source)], deadline, info)
            match = re.search(r"^Pages:\s*(\d+)\s*$", _read_text(info), re.MULTILINE)
            if not match or int(match.group(1)) < 1:
                raise LocalDocumentError(422, "PDF page count could not be determined safely.")
            total_pages = int(match.group(1))
            count = min(total_pages, MAX_PAGES)
            text_path = directory / "native.txt"
            _run(["pdftotext", "-f", "1", "-l", str(count), "-layout", str(source), str(text_path)], deadline)
            native = _read_text(text_path).split("\f")
            for number in range(1, count + 1):
                text = native[number - 1] if number <= len(native) else ""
                method = "pdf_native_text"
                if len(re.sub(r"\s", "", text)) < 25:
                    prefix = directory / f"page-{number}"
                    _run(["pdftoppm", "-f", str(number), "-l", str(number), "-singlefile", "-scale-to", "1600", "-png", str(source), str(prefix)], deadline)
                    image = prefix.with_suffix(".png")
                    if not image.exists() or image.stat().st_size > MAX_RENDER_BYTES:
                        raise LocalDocumentError(413, "Rendered page exceeds the local reading limit.")
                    output = directory / f"ocr-{number}"
                    _run(["tesseract", str(image), str(output), "-l", "eng+guj", "--psm", "6"], deadline)
                    text, method = _read_text(output.with_suffix(".txt")), "local_tesseract_ocr"
                pages.append({"page": number, "text": text, "method": method})
        else:
            try:
                from PIL import Image
            except ImportError:
                raise LocalDocumentError(503, "Local image reading is not installed on this server.") from None
            try:
                with Image.open(source) as image:
                    width, height = image.size
                    if width * height > 16_000_000 or max(width, height) > 6000:
                        raise LocalDocumentError(413, "Image dimensions exceed the local reading limit. Resize the image.")
                    image.verify()
            except LocalDocumentError:
                raise
            except Exception:
                raise LocalDocumentError(422, "The image is malformed or unreadable.") from None
            output = directory / "image-ocr"
            _run(["tesseract", str(source), str(output), "-l", "eng+guj", "--psm", "6"], deadline)
            pages = [{"page": 1, "text": _read_text(output.with_suffix(".txt")), "method": "local_tesseract_ocr"}]
            total_pages, count = 1, 1
    fields, evidence, field_warnings = extract_fields(pages)
    warnings.extend(field_warnings)
    if total_pages > count:
        warnings.append(f"Only the first {count} of {total_pages} pages were processed.")
    if any(page["method"] == "local_tesseract_ocr" for page in pages):
        warnings.append("OCR text and field labels require comparison with the original document.")
    if not evidence:
        warnings.append("No supported field labels were identified; manual extraction is required.")
    return {**fields, "raw_text": "\n\n".join(f"[Page {p['page']}]\n{p['text']}" for p in pages),
            "evidence": evidence, "metadata": {"reader": "local", "external_processing": False,
            "translation_performed": False, "pages_total": total_pages, "pages_processed": count,
            "truncated": total_pages > count, "manual_review_required": True, "warnings": warnings}}
