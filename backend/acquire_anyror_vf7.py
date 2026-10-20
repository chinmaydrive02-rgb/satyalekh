"""Local operator tool: exact selection → user CAPTCHA → verified source files.

This is not a background worker or a hosted endpoint. Never auto-confirms legal
review or claims title clearance. Run with --help for required parcel arguments.
"""
import argparse
import asyncio
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys

from anyror_http import AnyRORHTTPSession, AnyRORFormError
from anyror_acquire import prepare_vf7, verify_vf7_source


def private_file(path, contents):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as stream:
        stream.write(contents)


async def user_answer():
    """Wait on terminal input without leaving a blocked input thread behind."""
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    def ready():
        line = sys.stdin.readline()
        if not future.done():
            if line:
                future.set_result(line.rstrip("\r\n"))
            else:
                future.set_exception(EOFError("No challenge answer supplied"))
    print("Type the displayed CAPTCHA: ", end="", flush=True)
    loop.add_reader(sys.stdin.fileno(), ready)
    try:
        return await asyncio.wait_for(future, 180)
    except asyncio.TimeoutError:
        raise AnyRORFormError("Challenge expired; start a fresh lookup") from None
    finally:
        loop.remove_reader(sys.stdin.fileno())


async def acquire(args):
    output = Path(args.output).expanduser().resolve()
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    async with AnyRORHTTPSession() as session:
        expected = await prepare_vf7(session, args.district, args.taluka, args.village, args.survey)
        challenge = await session.challenge_image()
        challenge_path = output / "challenge.png"
        private_file(challenge_path, challenge)
        print(json.dumps({"state": "awaiting_user_captcha", "image": str(challenge_path),
                          "parcel": expected, "expires_after_seconds": 180}, ensure_ascii=False), flush=True)
        # This input is supplied by the operator; no OCR/provider solves it.
        try:
            answer = await user_answer()
            source = await session.submit_vf7_challenge(answer.strip())
        finally:
            challenge_path.unlink(missing_ok=True)
        parsed = verify_vf7_source(source, expected)
        private_file(output / "source.html", source)
        parsed["acquisition"] = {"method": "direct_http_user_challenge", "source_url": session.last_source_url,
                                 "retrieved_at": datetime.now(timezone.utc).isoformat(),
                                 "parcel_identity_matched": True, "certified_copy": False}
        private_file(output / "source-reading.json", json.dumps(parsed, ensure_ascii=False, indent=2).encode("utf-8"))
        print(json.dumps({"state": "source_retrieved_review_required", "directory": str(output),
                          "owners": len(parsed["source_record"]["owners"]),
                          "rights": len(parsed["source_record"]["rights"]),
                          "source_sha256": parsed["metadata"]["source_sha256"]}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("district", "taluka", "village", "survey", "output"):
        parser.add_argument("--" + name, required=True)
    args = parser.parse_args()
    try:
        asyncio.run(acquire(args))
    except (AnyRORFormError, EOFError) as error:
        print(json.dumps({"state": "stopped", "reason": str(error)}), flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
