"""Bounded, cookie-preserving full ASP.NET postbacks to the public rural form.

This transport does not submit CAPTCHA answers or retrieve record results. It
has no live-network fallback, retries, arbitrary URLs, or TLS bypass.
"""
import asyncio
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Dict, List, Optional
from urllib.parse import urlencode, urljoin

import httpx

URL = "https://anyror.gujarat.gov.in/LandRecordRural.aspx"
MAX_BODY = 1024 * 1024
REQUEST_SECONDS = 20
RECORD_CONTROL = "ContentPlaceHolder1_drpLandRecord"


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
        return pairs + [("__EVENTTARGET", chosen.name), ("__EVENTARGUMENT", "")]


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

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        self._form = None
        if self._owned:
            await self._client.aclose()

    async def _request(self, method, payload=None):
        async def read():
            kwargs = {"follow_redirects": False, "timeout": 10}
            if payload is not None:
                kwargs.update(content=urlencode(payload).encode("utf-8"), headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": URL, "Origin": "https://anyror.gujarat.gov.in"})
            async with self._client.stream(method, URL, **kwargs) as response:
                if response.status_code != 200:
                    raise AnyRORFormError("Official form returned an unsuccessful status")
                content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
                if content_type not in {"text/html", "application/xhtml+xml"}:
                    raise AnyRORFormError("Expected an HTML form")
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    if len(body) + len(chunk) > MAX_BODY:
                        raise AnyRORFormError("Official form exceeds size limit")
                    body.extend(chunk)
                return _Form(body.decode("utf-8", errors="strict"))
        try:
            return await asyncio.wait_for(read(), REQUEST_SECONDS)
        except (httpx.HTTPError, asyncio.TimeoutError, UnicodeError):
            raise AnyRORFormError("Official form request failed", stage="request") from None

    async def open(self):
        async with self._lock:
            self._form = None
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
            self._form = None  # Never retry with consumed or uncertain ViewState.
            fresh = await self._request("POST", payload)
            chosen = fresh.selector(control)
            if not any(o["value"] == value and o["selected"] for o in chosen.options):
                raise AnyRORFormError("Official form did not retain the requested selection")
            self._form = fresh
        return self
