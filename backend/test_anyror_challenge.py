"""One-shot challenge/result retrieval with exact parcel identity, offline."""
import asyncio
import base64
from urllib.parse import parse_qs

import httpx
import pytest

from anyror_http import AnyRORHTTPSession, AnyRORFormError, URL, VF7_RESULT
from anyror_acquire import verify_vf7_source
from test_anyror_http import form, response
from test_anyror_vf7_reader import fixture

EXTRA = '''<img id="ContentPlaceHolder1_i_captcha_1" src="/challenge.ashx?id=synthetic">
<input id="ContentPlaceHolder1_txt_captcha_1" name="ctl00$ContentPlaceHolder1$txt_captcha_1" value="">
<input type="submit" id="ContentPlaceHolder1_btnGo" name="ctl00$ContentPlaceHolder1$btnGo" value="Get Record Detail">'''
PNG = b"\x89PNG\r\n\x1a\nsynthetic-no-actual-challenge"


def run_case(submission=None, result=None, extra=EXTRA, image=None, change=None):
    requests = []
    def handler(request):
        requests.append(request)
        if request.url.path == "/challenge.ashx":
            assert "ASP.NET_SessionId=test" in request.headers["cookie"]
            return image or httpx.Response(200, content=PNG, headers={"content-type": "image/png"})
        if str(request.url) == VF7_RESULT:
            assert "ASP.NET_SessionId=test" in request.headers["cookie"]
            return result or response(fixture().decode())
        if request.method == "GET":
            return response(form(record="1", extra=extra), **{"set-cookie": "ASP.NET_SessionId=test; Secure; Path=/"})
        data = parse_qs(request.content.decode(), keep_blank_values=True)
        assert data["__VIEWSTATE"] == ["first&token"]
        assert data["ctl00$ContentPlaceHolder1$txt_captcha_1"] == ["ABC123"]
        assert data["ctl00$ContentPlaceHolder1$btnGo"] == ["Get Record Detail"]
        assert data["__EVENTTARGET"] == [""]
        assert "submit" not in data and "image" not in data
        return submission or response("<script>window.open('Information_pages/Info712Details.aspx','_blank');</script>")
    async def run():
        async with AnyRORHTTPSession(transport=httpx.MockTransport(handler)) as session:
            await session.open()
            assert await session.challenge_image() == PNG
            if change: change(session)
            source = await session.submit_vf7_challenge("ABC123")
            with pytest.raises(AnyRORFormError, match="fresh challenge"):
                await session.submit_vf7_challenge("ABC123")
            return source
    return run, requests


def test_same_session_posts_actual_button_and_follows_only_observed_result():
    run, requests = run_case()
    assert asyncio.run(run()) == fixture()
    assert [r.method for r in requests] == ["GET", "GET", "POST", "GET"]


def test_portal_embedded_png_does_not_make_an_extra_image_request():
    src = "data:image/png;base64," + base64.b64encode(PNG).decode()
    run, requests = run_case(extra=EXTRA.replace("/challenge.ashx?id=synthetic", src))
    assert asyncio.run(run()) == fixture()
    assert [r.method for r in requests] == ["GET", "POST", "GET"]


@pytest.mark.parametrize("html", [
    "<form>Invalid captcha</form>",
    "<script>window.open('https://example.com/steal');</script>",
    "<script>window.open('/Information_pages/Info8ADetails.aspx');</script>",
    "<script>window.open('Information_pages/Info712Details.aspx?x=1');</script>",
    "<script>window.open('Information_pages/Info712Details.aspx');window.open('https://example.com');</script>",
])
def test_rejection_and_unexpected_routes_never_become_records(html):
    run, requests = run_case(submission=response(html))
    with pytest.raises(AnyRORFormError): asyncio.run(run())
    assert len(requests) == 3


def test_expired_challenge_never_submits():
    run, requests = run_case(change=lambda session: setattr(session, "_challenge_at", -10000))
    with pytest.raises(AnyRORFormError, match="expired"): asyncio.run(run())
    assert len(requests) == 2


@pytest.mark.parametrize("src", ["https://example.com/image.png", "http://anyror.gujarat.gov.in/image", "https://anyror.gujarat.gov.in@evil.example/image", "data:image/png;base64,abc"])
def test_external_or_insecure_challenge_is_never_requested(src):
    run, requests = run_case(extra=EXTRA.replace("/challenge.ashx?id=synthetic", src))
    with pytest.raises(AnyRORFormError): asyncio.run(run())
    assert len(requests) == 1


def test_redirect_to_result_is_not_followed_automatically():
    run, requests = run_case(submission=httpx.Response(302, headers={"location": VF7_RESULT}))
    with pytest.raises(AnyRORFormError): asyncio.run(run())
    assert len(requests) == 3


def test_result_must_pass_existing_strict_vf7_reader():
    run, _ = run_case(result=response("<html>VF7 result unavailable</html>"))
    with pytest.raises(AnyRORFormError, match="No complete VF7"): asyncio.run(run())


def test_parcel_identity_all_locations_and_survey_required():
    from anyror_vf7_reader import read_anyror_vf7_html
    parsed = read_anyror_vf7_html(fixture())
    expected = {name.title(): value for name, value in parsed["source_record"]["locations"].items()}
    expected["SurveyNo"] = parsed["survey_no"]
    assert verify_vf7_source(fixture(), expected)["survey_no"] == parsed["survey_no"]
    for key in expected:
        with pytest.raises(AnyRORFormError, match="differs"):
            verify_vf7_source(fixture(), {**expected, key: "different"})


def test_form_village_code_may_be_absent_from_result_but_no_nearby_match():
    from anyror_vf7_reader import read_anyror_vf7_html
    parsed = read_anyror_vf7_html(fixture())
    expected = {name.title(): value for name, value in parsed["source_record"]["locations"].items()}
    expected.update(SurveyNo=parsed["survey_no"], Village=expected["Village"] + " - 039")
    verify_vf7_source(fixture(), expected)
