"""Bound portal traffic in a single API process; never retry explicit refusals."""
import asyncio
import os
import time


class PortalGate:
    def __init__(self, concurrency=1, interval=5.0, cooldown=300.0, clock=time.monotonic):
        self._slots = asyncio.Semaphore(max(1, concurrency))
        self._spacing = asyncio.Lock()
        self.interval = interval
        self.cooldown = cooldown
        self.clock = clock
        self.next_start = 0.0
        self.blocked_until = 0.0

    async def run(self, operation):
        async with self._slots:
            async with self._spacing:
                if self.clock() < self.blocked_until:
                    return {"error": "AnyROR is temporarily unavailable. Please try later or upload an official record.",
                            "code": "PORTAL_UNAVAILABLE"}
                await asyncio.sleep(max(0, self.next_start - self.clock()))
                self.next_start = self.clock() + self.interval
            result = await operation()
            if result.get("code") == "PORTAL_UNAVAILABLE":
                self.blocked_until = self.clock() + self.cooldown
            return result


portal_gate = PortalGate(
    concurrency=int(os.getenv("PORTAL_CONCURRENCY", "1")),
    interval=max(0, float(os.getenv("PORTAL_MIN_INTERVAL_SECONDS", "5"))),
    cooldown=max(1, float(os.getenv("PORTAL_COOLDOWN_SECONDS", "300"))),
)
