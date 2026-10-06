"""Bounded connection diagnosis of one fixed public page, without parcel data.

No CAPTCHA, provider, redirects, response logging, credentials or arbitrary URL.
TLS certificate and hostname verification remain enabled. One probe per process
per five minutes; cached observations are copies, never raw response contents.
"""
import asyncio
from datetime import datetime, timezone
import socket
import ssl
import time

HOST = "anyror.gujarat.gov.in"
PATH = "/LandRecordRural.aspx"
COOLDOWN = 300
_lock = asyncio.Lock()
_latest = None
_last_at = 0.0


async def _probe(loop=None):
    started = time.monotonic()
    result = {"observed_at": datetime.now(timezone.utc).isoformat(),
              "family": "ipv4", "stage": "dns", "outcome": "unavailable"}
    sock, writer = None, None
    try:
        loop = loop or asyncio.get_running_loop()
        stage_at = time.monotonic()
        addresses = await asyncio.wait_for(loop.getaddrinfo(
            HOST, 443, family=socket.AF_INET, type=socket.SOCK_STREAM), 3)
        result["dns_ms"] = int((time.monotonic() - stage_at) * 1000)
        if not addresses:
            result["failure"] = "dns"
            return result
        result["stage"] = "tcp"
        stage_at = time.monotonic()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setblocking(False)
        await asyncio.wait_for(loop.sock_connect(sock, addresses[0][4]), 5)
        result["tcp_ms"] = int((time.monotonic() - stage_at) * 1000)
        result["stage"] = "tls"
        stage_at = time.monotonic()
        reader, writer = await asyncio.wait_for(asyncio.open_connection(
            sock=sock, ssl=ssl.create_default_context(), server_hostname=HOST), 8)
        sock = None  # Stream owns the socket now.
        result["tls_ms"] = int((time.monotonic() - stage_at) * 1000)
        version = writer.get_extra_info("ssl_object").version()
        if version in {"TLSv1.2", "TLSv1.3"}:
            result["tls_version"] = version
        result["stage"] = "http"
        stage_at = time.monotonic()
        writer.write((f"GET {PATH} HTTP/1.1\r\nHost: {HOST}\r\n"
                      "User-Agent: Satyalekh-Connection-Check/1.0\r\n"
                      "Accept-Encoding: identity\r\nConnection: close\r\n\r\n").encode("ascii"))
        await asyncio.wait_for(writer.drain(), 2)
        head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 5)
        status = int(head.split(b"\r\n", 1)[0].split(b" ")[1])
        if not 100 <= status <= 599:
            raise ValueError("invalid response")
        result["http_status"] = status
        # Fixed cap, no personal record request, no response contents retained.
        body = bytearray()
        body_deadline = time.monotonic() + 5
        while len(body) < 65536:
            chunk = await asyncio.wait_for(reader.read(min(8192, 65536 - len(body))),
                                           max(0.001, body_deadline - time.monotonic()))
            if not chunk:
                break
            body.extend(chunk)
        result["http_ms"] = int((time.monotonic() - stage_at) * 1000)
        result["district_control"] = b"ContentPlaceHolder1_ddlDistrict" in body
        result["record_control"] = b"ContentPlaceHolder1_drpLandRecord" in body
        result["body_limit_reached"] = len(body) == 65536
        if status == 200 and result["district_control"] and result["record_control"]:
            result.update(stage="complete", outcome="ready")
        else:
            result["failure"] = "http_status" if status != 200 else "controls"
    except (asyncio.TimeoutError, TimeoutError):
        result["failure"] = "deadline"
    except ssl.SSLCertVerificationError:
        result["failure"] = "certificate"
    except ssl.SSLError:
        result["failure"] = "tls"
    except Exception:
        result["failure"] = "connection"
    finally:
        if writer:
            writer.close()
        if sock:
            sock.close()
        result["elapsed_ms"] = int((time.monotonic() - started) * 1000)
    return result


async def check_connection():
    global _latest, _last_at
    async with _lock:
        if _latest is not None and time.monotonic() - _last_at < COOLDOWN:
            return {**_latest, "cached": True}
        # Stage deadlines sum to28s including bounded response-body reading.
        _latest = await _probe()
        _last_at = time.monotonic()
        return {**_latest, "cached": False}
