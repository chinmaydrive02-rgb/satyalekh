import asyncio
from urllib.parse import parse_qs

import httpx
import pytest

from anyror_http import AnyRORHTTPSession, AnyRORFormError, RECORD_CONTROL, URL, MAX_BODY

DISTRICT = "ContentPlaceHolder1_ddlDistrict"


def form(state="first", record="", district="", action="LandRecordRural.aspx", extra=""):
    return f'''<html><form method="post" action="{action}">
    <input type="hidden" name="__VIEWSTATE" value="{state}&amp;token">
    <input type="hidden" name="__EVENTVALIDATION" value="validation-{state}">
    <input type="hidden" name="__VIEWSTATE1" value="split-{state}">
    <input type="hidden" name="__EVENTTARGET" value="old">
    <input type="hidden" name="__EVENTARGUMENT" value="old">
    <input type="hidden" name="__ASYNCPOST" value="true">
    <select id="{RECORD_CONTROL}" name="ctl00$ContentPlaceHolder1$drpLandRecord">
    <option value="" {"selected" if not record else ""}>Select</option>
    <option value="1" {"selected" if record == "1" else ""}>VF-7</option>
    <option value="2" disabled>Unavailable</option></select>
    <select id="{DISTRICT}" name="ctl00$ContentPlaceHolder1$ddlDistrict">
    <option value="" {"selected" if not district else ""}>Select</option>
    <option value="7" {"selected" if district == "7" else ""}>ગાંધીનગર</option></select>
    <input type="text" name="captcha" value="">
    <input type="submit" name="submit" value="View">
    <input type="image" name="image" value="image">
    <button name="button" value="go">Go</button>
    <input disabled name="disabled" value="bad">
    <input type="checkbox" name="unchecked" value="bad">
    <input type="checkbox" checked name="checked" value="yes">
    {extra}</form></html>'''


def response(html, **kwargs):
    return httpx.Response(200, text=html, headers={"content-type": "text/html; charset=utf-8", **kwargs})


def test_cookie_and_fresh_viewstate_across_exact_record_and_district_postbacks():
    requests = []
    def handler(request):
        requests.append(request)
        assert str(request.url) == URL
        if len(requests) == 1:
            assert request.method == "GET"
            return response(form(), **{"set-cookie": "ASP.NET_SessionId=synthetic; Path=/; Secure"})
        assert "ASP.NET_SessionId=synthetic" in request.headers["cookie"]
        data = parse_qs(request.content.decode(), keep_blank_values=True)
        previous = "first" if len(requests) == 2 else "second"
        assert data["__VIEWSTATE"] == [previous + "&token"]
        assert data["__EVENTVALIDATION"] == ["validation-" + previous]
        assert data["__VIEWSTATE1"] == ["split-" + previous]
        assert data["__EVENTARGUMENT"] == [""]
        for absent in ["submit", "image", "button", "disabled", "unchecked", "__ASYNCPOST"]:
            assert absent not in data
        assert data["checked"] == ["yes"]
        assert data["captcha"] == [""]
        assert data["ctl00$ContentPlaceHolder1$drpLandRecord"] == ["1"]
        if len(requests) == 2:
            assert data["__EVENTTARGET"] == ["ctl00$ContentPlaceHolder1$drpLandRecord"]
            return response(form("second", record="1"))
        assert data["__EVENTTARGET"] == ["ctl00$ContentPlaceHolder1$ddlDistrict"]
        return response(form("third", record="1", district="7"))
    async def run():
        async with AnyRORHTTPSession(transport=httpx.MockTransport(handler)) as session:
            await session.open()
            opts = session.options(DISTRICT)
            assert opts[1]["label"] == "ગાંધીનગર"
            opts[1]["value"] = "tampered"
            assert session.options(DISTRICT)[1]["value"] == "7"
            await session.select(RECORD_CONTROL, "1")
            await session.select(DISTRICT, "7")
            assert session.options(DISTRICT)[1]["selected"]
    asyncio.run(run())
    assert len(requests) == 3


@pytest.mark.parametrize("value", ["2", "99", 1, "1&x=y"])
def test_selection_must_match_enabled_exact_value(value):
    requests = []
    def handler(request):
        requests.append(request)
        return response(form())
    async def run():
        async with AnyRORHTTPSession(transport=httpx.MockTransport(handler)) as session:
            await session.open()
            with pytest.raises(AnyRORFormError):
                await session.select(RECORD_CONTROL, value)
    asyncio.run(run())
    assert len(requests) == 1


@pytest.mark.parametrize("bad_response", [
    httpx.Response(302, headers={"location": "https://example.com"}),
    httpx.Response(500),
    response(form(action="https://example.com")),
    response(form(action="/Information_pages/Info712Details.aspx")),
    response("<html>Error</html>"),
    response(form() + form()),
    response(form() + "x" * MAX_BODY),
    httpx.Response(200, text=form(), headers={"content-type": "application/json"}),
])
def test_rejects_redirect_errors_unexpected_page_or_oversized_body(bad_response):
    count = 0
    def handler(request):
        nonlocal count
        count += 1
        return bad_response
    async def run():
        async with AnyRORHTTPSession(transport=httpx.MockTransport(handler)) as session:
            with pytest.raises(AnyRORFormError):
                await session.open()
    asyncio.run(run())
    assert count == 1


def test_failed_postback_invalidates_state_and_does_not_retry():
    count = 0
    def handler(request):
        nonlocal count
        count += 1
        if count == 1:
            return response(form())
        raise httpx.ConnectError("secret response content must not escape")
    async def run():
        async with AnyRORHTTPSession(transport=httpx.MockTransport(handler)) as session:
            await session.open()
            with pytest.raises(AnyRORFormError, match="Official form request failed") as caught:
                await session.select(RECORD_CONTROL, "1")
            assert caught.value.stage == "request"
            with pytest.raises(AnyRORFormError, match="Open a fresh form"):
                await session.select(RECORD_CONTROL, "1")
    asyncio.run(run())
    assert count == 2


def test_postback_must_preserve_requested_selection():
    async def run():
        async with AnyRORHTTPSession(transport=httpx.MockTransport(lambda request: response(form()))) as session:
            await session.open()
            with pytest.raises(AnyRORFormError, match="did not retain"):
                await session.select(RECORD_CONTROL, "1")
            with pytest.raises(AnyRORFormError, match="Open a fresh form"):
                session.options(RECORD_CONTROL)
    asyncio.run(run())


def test_injected_client_is_not_closed():
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: response(form()))) as client:
            async with AnyRORHTTPSession(client) as session:
                await session.open()
            assert not client.is_closed
    asyncio.run(run())
