"""Bounded, cookie-preserving full ASP.NET postbacks to the public rural form.

Challenge completion accepts a user-supplied answer once in the same session.
There are no live-network fallbacks, retries, arbitrary URLs, or TLS bypasses.
"""
import asyncio
import base64
import binascii
import re
import time
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Dict, List, Optional
from urllib.parse import urlencode, urljoin, urlsplit

import httpx

URL = "https://anyror.gujarat.gov.in/LandRecordRural.aspx"
MAX_BODY = 1024 * 1024
REQUEST_SECONDS = 20
RECORD_CONTROL = "ContentPlaceHolder1_drpLandRecord"
VF7_RESULT = "https://anyror.gujarat.gov.in/Information_pages/Info712Details.aspx"
CHALLENGE_SECONDS = 180


def _challenge_bytes(data):
    if len(data) > 128 * 1024 or not (data.startswith(b"\x89PNG\r\n\x1a\n") or data.startswith(b"\xff\xd8\xff") or data.startswith((b"GIF87a", b"GIF89a"))):
        raise AnyRORFormError("Invalid challenge image")
    return data


class AnyRORFormError(ValueError):
    """The official form could not be safely read or advanced."""
    def __init__(self, message, stage="form"):
        super().__init__(message)
        self.stage = stage


@dataclass
class _Select:
    name: str
    identifier: str
    disabled: bool
    multiple: bool
    options: List[dict] = field(default_factory=list)


class _Form(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.controls = []
        self.selects: Dict[str, _Select] = {}
        self.images = {}
        self.inputs = {}
        self.action = None
        self.forms = 0
        self.inside = False
        self.current = None
        self.option = None
        self.textarea = None
        self.disabled_groups = 0
        self.disabled_fieldsets = []
        self.feed(html)
        self.close()
        if self.forms != 1 or self.inside:
            raise AnyRORFormError("Expected one complete rural form")
        if urljoin(URL, self.action or URL) != URL:
            raise AnyRORFormError("Unexpected rural form action")
        if RECORD_CONTROL not in self.selects:
            raise AnyRORFormError("Rural record selector missing")

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "form":
            self.forms += 1
            self.inside = True
            self.action = a.get("action", "")
            if a.get("method", "get").lower() != "post":
                raise AnyRORFormError("Expected a POST form")
        if not self.inside:
            return
        if tag == "fieldset":
            self.disabled_fieldsets.append("disabled" in a)
        disabled = "disabled" in a or any(self.disabled_fieldsets)
        name = a.get("name")
        if tag == "img" and a.get("id"):
            if a["id"] in self.images:
                raise AnyRORFormError("Duplicate image identifier")
            self.images[a["id"]] = a.get("src", "")
        if tag == "input" and a.get("id"):
            if a["id"] in self.inputs:
                raise AnyRORFormError("Duplicate input identifier")
            self.inputs[a["id"]] = {**a, "disabled": disabled}
        if tag == "select" and name:
            self.current = _Select(name, a.get("id", name), disabled, "multiple" in a)
            if self.current.identifier in self.selects:
                raise AnyRORFormError("Duplicate selector")
            self.selects[self.current.identifier] = self.current
            self.controls.append(self.current)
        elif tag == "optgroup" and self.current:
            self.disabled_groups = int("disabled" in a)
        elif tag == "option" and self.current:
            self._finish_option()
            self.option = {"value": a.get("value"), "label": "",
                           "disabled": disabled or bool(self.disabled_groups),
                           "selected": "selected" in a}
        elif tag == "input" and name and not disabled:
            kind = a.get("type", "text").lower()
            if kind in {"submit", "button", "image", "reset", "file"}:
                return
            if kind in {"checkbox", "radio"} and "checked" not in a:
                return
            self.controls.append((name, a.get("value", "on" if kind in {"checkbox", "radio"} else "")))
        elif tag == "textarea" and name and not disabled:
            self.textarea = [name, ""]

    def handle_data(self, data):
        if self.option is not None:
            self.option["label"] += data
        elif self.textarea is not None:
            self.textarea[1] += data

    def _finish_option(self):
        if self.option is not None:
            self.option["label"] = self.option["label"].strip()
            if self.option["value"] is None:
                self.option["value"] = self.option["label"]
            self.current.options.append(self.option)
            self.option = None

    def handle_endtag(self, tag):
        if tag == "option":
            self._finish_option()
        elif tag == "select":
            self._finish_option()
            self.current = None
        elif tag == "optgroup":
            self.disabled_groups = 0
        elif tag == "textarea" and self.textarea is not None:
            self.controls.append(tuple(self.textarea))
            self.textarea = None
        elif tag == "fieldset" and self.disabled_fieldsets:
            self.disabled_fieldsets.pop()
        elif tag == "form":
            self.inside = False

    def selector(self, control):
        matches = [s for s in self.selects.values() if control in (s.identifier, s.name)]
        if len(matches) != 1 or matches[0].disabled:
            raise AnyRORFormError("Selector missing, ambiguous or disabled")
        return matches[0]

    def payload(self, chosen, value):
        pairs = []
        for item in self.controls:
            if isinstance(item, tuple):
                if item[0] not in {"__EVENTTARGET", "__EVENTARGUMENT", "__ASYNCPOST"}:
                    pairs.append(item)
                continue
            if item.disabled:
                continue
            if item is chosen:
                pairs.append((item.name, value))
                continue
            options = [o for o in item.options if o["selected"]]
            if not options and not item.multiple:
                options = item.options[:1]
            for option in options:
                if not option["disabled"]:
                    pairs.append((item.name, option["value"]))
        return pairs + [("__EVENTTARGET", chosen.name if chosen else ""), ("__EVENTARGUMENT", "")]


class AnyRORHTTPSession:
    """Use async with, then await open()/select(id_or_name, exact_value).

    options(id_or_name) returns copied dictionaries with value, label, disabled
    and selected fields. Inject a transport for offline tests. An injected client
    remains owned by its caller and must retain TLS certificate verification.
    No form content is logged or exposed in exceptions.
    """
    def __init__(self, client: Optional[httpx.AsyncClient] = None, *, transport=None):
        if client is not None and transport is not None:
            raise ValueError("Choose client or transport")
        self._owned = client is None
        self._client = client or httpx.AsyncClient(
            verify=True, follow_redirects=False, trust_env=False,
            timeout=httpx.Timeout(10), transport=transport or httpx.AsyncHTTPTransport(
                local_address="0.0.0.0", retries=0, verify=True, http1=True, http2=False),
            headers={"User-Agent": "Satyalekh/1.0", "Accept": "text/html"},
        )
        self._form = None
        self._lock = asyncio.Lock()
        self._challenge_at = None
        self.last_source_url = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        self._form = None
        self._challenge_at = None
        if self._owned:
            await self._client.aclose()

    async def _read(self, method, url=URL, payload=None, image=False):
        async def read():
            kwargs = {"follow_redirects": False, "timeout": 10}
            if payload is not None:
                kwargs.update(content=urlencode(payload).encode("utf-8"), headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": URL, "Origin": "https://anyror.gujarat.gov.in"})
            async with self._client.stream(method, url, **kwargs) as response:
                if response.status_code != 200:
                    raise AnyRORFormError("Official form returned an unsuccessful status")
                content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
                allowed = {"image/png", "image/jpeg", "image/gif"} if image else {"text/html", "application/xhtml+xml"}
                if content_type not in allowed:
                    raise AnyRORFormError("Unexpected official response type")
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    if len(body) + len(chunk) > (128 * 1024 if image else MAX_BODY):
                        raise AnyRORFormError("Official form exceeds size limit")
                    body.extend(chunk)
                data = bytes(body)
                return _challenge_bytes(data) if image else data
        try:
            return await asyncio.wait_for(read(), REQUEST_SECONDS)
        except (httpx.HTTPError, asyncio.TimeoutError, UnicodeError):
            raise AnyRORFormError("Official form request failed", stage="request") from None

    async def _request(self, method, payload=None):
        raw = await self._read(method, payload=payload)
        try:
            return _Form(raw.decode("utf-8", errors="strict"))
        except UnicodeError:
            raise AnyRORFormError("Unreadable official form") from None

    async def open(self):
        async with self._lock:
            self._form = None
            self._challenge_at = None
            self.last_source_url = None
            self._form = await self._request("GET")
        return self

    def options(self, control):
        if self._form is None:
            raise AnyRORFormError("Open a fresh form first")
        return [dict(option) for option in self._form.selector(control).options]

    async def select(self, control, value):
        async with self._lock:
            if self._form is None:
                raise AnyRORFormError("Open a fresh form first")
            selected = self._form.selector(control)
            if selected.multiple or not isinstance(value, str) or not any(
                option["value"] == value and not option["disabled"] for option in selected.options
            ):
                raise AnyRORFormError("Exact enabled option not found")
            payload = self._form.payload(selected, value)
            self._challenge_at = None
            self._form = None  # Never retry with consumed or uncertain ViewState.
            fresh = await self._request("POST", payload)
            chosen = fresh.selector(control)
            if not any(o["value"] == value and o["selected"] for o in chosen.options):
                raise AnyRORFormError("Official form did not retain the requested selection")
            self._form = fresh
        return self

    async def challenge_image(self):
        """Fetch the displayed challenge; caller asks the user for its answer."""
        async with self._lock:
            self._challenge_at = None
            if self._form is None:
                raise AnyRORFormError("Open a fresh form first")
            src = self._form.images.get("ContentPlaceHolder1_i_captcha_1", "")
            if src.startswith("data:"):
                # The live portal embeds its PNG in the form response. Decode
                # only bounded raster bytes; never render HTML or execute data.
                match = re.fullmatch(r"data:image/(png|jpeg|gif);base64,([A-Za-z0-9+/=]+)", src)
                if match is None or len(match[2]) > 180000:
                    raise AnyRORFormError("Unexpected embedded challenge")
                try:
                    data = _challenge_bytes(base64.b64decode(match[2], validate=True))
                except (ValueError, binascii.Error):
                    raise AnyRORFormError("Invalid embedded challenge") from None
                self._challenge_at = time.monotonic()
                return data
            target = urljoin(URL, src)
            parts = urlsplit(target)
            if not src or parts.scheme != "https" or parts.netloc != "anyror.gujarat.gov.in" or parts.fragment or "\\" in target:
                raise AnyRORFormError("Unexpected challenge source")
            data = await self._read("GET", target, image=True)
            self._challenge_at = time.monotonic()
            return data

    async def submit_vf7_challenge(self, answer):
        """Submit once; return only a structurally valid VF7 source page.

        Does not solve challenges, retry rejected answers or execute scripts.
        The caller must also validate the returned parcel against its request.
        """
        async with self._lock:
            if self._form is None or self._challenge_at is None:
                raise AnyRORFormError("Fetch a fresh challenge first")
            if time.monotonic() - self._challenge_at > CHALLENGE_SECONDS:
                self._form, self._challenge_at = None, None
                raise AnyRORFormError("Challenge expired; start a fresh lookup")
            if not isinstance(answer, str) or not re.fullmatch(r"[A-Za-z0-9]{3,12}", answer):
                raise AnyRORFormError("Enter the displayed challenge characters")
            form = self._form
            if not any(o["value"] == "1" and o["selected"] for o in form.selector(RECORD_CONTROL).options):
                raise AnyRORFormError("Only VF7 result retrieval is supported")
            field = form.inputs.get("ContentPlaceHolder1_txt_captcha_1", {})
            button = form.inputs.get("ContentPlaceHolder1_btnGo", {})
            if not field.get("name") or field.get("disabled") or not button.get("name") or button.get("disabled") or button.get("type", "").lower() != "submit":
                raise AnyRORFormError("Challenge controls unavailable")
            payload = [(key, answer if key == field["name"] else value)
                       for key, value in form.payload(None, "")]
            if sum(key == field["name"] for key, _ in payload) != 1:
                raise AnyRORFormError("Ambiguous challenge input")
            payload.append((button["name"], button.get("value", "")))
            # A failed or uncertain submission must never reuse consumed state.
            self._form, self._challenge_at = None, None
            raw = await self._read("POST", payload=payload)
            source_url = URL
            try:
                text = raw.decode("utf-8-sig", errors="strict")
            except UnicodeError:
                raise AnyRORFormError("Unreadable portal response") from None
            # Follow only the known VF7 route if the response actually opens it.
            # This does not evaluate JavaScript or follow arbitrary redirects.
            opened = re.findall(r"window\.open\(\s*(['\"])([^'\"]+)\1", text)
            targets = [urljoin(URL, target) for _, target in opened]
            if targets:
                if len(targets) != 1 or targets[0] != VF7_RESULT:
                    raise AnyRORFormError("Unexpected result route")
                raw = await self._read("GET", VF7_RESULT)
                source_url = VF7_RESULT
            from anyror_vf7_reader import read_anyror_vf7_html
            from local_document_reader import LocalDocumentError
            try:
                read_anyror_vf7_html(raw)
            except LocalDocumentError:
                raise AnyRORFormError("No complete VF7 returned; the challenge may have failed or the session expired") from None
            self.last_source_url = source_url
            return raw
