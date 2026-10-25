"""Outbound-only connector for website-managed AnyROR requests.

No inbound port, remote commands, browser cookies or service-role keys. The
website owner pairs this process using a short-lived code. Device credentials
remain in memory; exiting disconnects this process from portal sessions.
"""
import argparse
import asyncio
import base64
from contextlib import suppress
import json
import time
from urllib.parse import urlsplit

import httpx

from anyror_acquire import prepare_vf7
from anyror_http import AnyRORHTTPSession, AnyRORFormError, CHALLENGE_SECONDS


DEFAULT_API = "https://satyalekh-api-sg.onrender.com"


class BrokerError(Exception):
    pass


class Broker:
    def __init__(self, api_url=DEFAULT_API, client=None):
        parsed = urlsplit(api_url)
        if parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
            raise ValueError("Use a backend origin without credentials or a path")
        if parsed.scheme != "https" and not (parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"}):
            raise ValueError("The connector requires HTTPS outside localhost")
        self.origin = api_url.rstrip("/")
        self.client = client or httpx.AsyncClient(timeout=30, follow_redirects=False)
        self.owned = client is None
        self.token = None
        self.worker_id = None

    async def close(self):
        self.token = None
        if self.owned:
            await self.client.aclose()

    async def post(self, path, data):
        headers = {"X-Acquisition-Worker-Token": self.token} if self.token else {}
        try:
            response = await self.client.post(self.origin + path, json=data, headers=headers)
            if response.status_code not in (200, 201, 202):
                raise BrokerError("The website refused this connector action (HTTP %s)" % response.status_code)
            if len(response.content) > 2 * 1024 * 1024:
                raise BrokerError("The website response exceeds the connector limit")
            result = response.json()
            if not isinstance(result, dict):
                raise BrokerError("The website returned an unexpected response")
            return result
        except (httpx.HTTPError, ValueError):
            raise BrokerError("The website connection failed; no portal submission was retried") from None

    async def register(self):
        # A read-only warm-up allows free hosting to wake before registration.
        try:
            ready = await self.client.get(self.origin + "/health/live", timeout=100)
            ready.raise_for_status()
        except httpx.HTTPError:
            raise BrokerError("The website backend did not wake; try again later") from None
        data = await self.post("/acquisition/workers/register", {})
        self.worker_id, self.token = data["worker_id"], data["worker_token"]
        # Print the pairing code, never the device token or a lease token.
        print(json.dumps({"state": "pair_on_website", "pairing_code": data["pairing_code"],
                          "pairing_expires_at": data["pairing_expires_at"],
                          "website": "https://satyalekh.vercel.app/retrieve"}), flush=True)

    async def poll(self):
        return await self.post("/acquisition/workers/%s/poll" % self.worker_id, {})

    async def action(self, job, action, **data):
        return await self.post("/acquisition/jobs/%s/%s" % (job["id"], action),
                               {"worker_id": self.worker_id, "lease_token": job["lease_token"], **data})


async def keep_lease_alive(broker, job):
    """Renew the lease while portal requests run; never consume an answer."""
    while True:
        await asyncio.sleep(15)
        state = await broker.action(job, "heartbeat")
        if state.get("status") in {"failed", "completed", "cancelled"}:
            return


async def run_job(broker, job, session_factory=AnyRORHTTPSession, pause=asyncio.sleep):
    """A portal submission occurs once for one website-supplied answer."""
    submitted = False
    heartbeat = asyncio.create_task(keep_lease_alive(broker, job))
    try:
        request = job["request"]
        if request.get("record_type") != "VF7":
            raise AnyRORFormError("This connector currently supports VF7 only")
        async with session_factory() as session:
            await prepare_vf7(session, request["district"], request["taluka"],
                              request["village"], request["survey_no"])
            image = await session.challenge_image()
            await broker.action(job, "challenge", image_base64=base64.b64encode(image).decode("ascii"))
            print(json.dumps({"state": "captcha_on_website", "job_id": job["id"]}), flush=True)
            deadline = time.monotonic() + CHALLENGE_SECONDS
            while time.monotonic() < deadline:
                control = await broker.action(job, "control")
                if control.get("status") in {"failed", "completed", "cancelled"}:
                    return
                answer = control.get("answer")
                if answer:
                    submitted = True
                    source = await session.submit_vf7_challenge(answer)
                    await broker.action(job, "complete", source_base64=base64.b64encode(source).decode("ascii"))
                    print(json.dumps({"state": "source_delivered_to_website", "job_id": job["id"]}), flush=True)
                    return
                await pause(2)
            raise AnyRORFormError("Challenge expired; start a new website lookup")
    except (AnyRORFormError, BrokerError, KeyError):
        # Never replay an uncertain answer, completion or portal request. The
        # website's lease and state machine reject stale or duplicate actions.
        try:
            await broker.action(job, "fail", message="record_invalid" if submitted else "portal_unavailable")
        except BrokerError:
            pass
        print(json.dumps({"state": "lookup_stopped", "job_id": job.get("id"),
                          "portal_answer_submitted": submitted}), flush=True)

    finally:
        heartbeat.cancel()
        with suppress(asyncio.CancelledError, BrokerError):
            await heartbeat


async def serve(api_url):
    broker = Broker(api_url)
    try:
        await broker.register()
        deadline = time.monotonic() + 8 * 60 * 60
        pairing_deadline = time.monotonic() + 600
        connected = False
        while time.monotonic() < deadline:
            state = await broker.poll()
            connected = connected or bool(state.get("connected"))
            if not connected and time.monotonic() > pairing_deadline:
                raise BrokerError("The pairing code expired. Restart the connector for a fresh code")
            if state.get("job"):
                await run_job(broker, state["job"])
            await asyncio.sleep(2)
    finally:
        await broker.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", default=DEFAULT_API)
    args = parser.parse_args()
    try:
        asyncio.run(serve(args.api_url))
    except BrokerError as error:
        print(json.dumps({"state": "connector_stopped", "reason": str(error)}), flush=True)
        raise SystemExit(1)
    except KeyboardInterrupt:
        print("Connector stopped.", flush=True)


if __name__ == "__main__":
    main()
