from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Callable

from app.config import settings
from app.models.telemetry import TelemetryData, TelemetryFrame
from app.services.drone_manager import DroneManager

logger = logging.getLogger(__name__)


class TelemetryService:
    """Background polling loop that reads drone telemetry and broadcasts to subscribers."""

    def __init__(self, drone_manager: DroneManager) -> None:
        self._dm = drone_manager
        self._subscribers: set[Callable] = set()
        self._task: asyncio.Task | None = None
        self._running = False

    def subscribe(self, callback: Callable) -> None:
        self._subscribers.add(callback)

    def unsubscribe(self, callback: Callable) -> None:
        self._subscribers.discard(callback)

    async def start(self) -> None:
        if self._task is not None:
            return
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())
        logger.info("TelemetryService started at %.1f Hz", settings.telemetry_poll_hz)

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("TelemetryService stopped")

    async def _poll_loop(self) -> None:
        interval = 1.0 / settings.telemetry_poll_hz
        while self._running:
            if self._dm.is_connected:
                try:
                    raw = await self._dm.get_telemetry()
                    frame = TelemetryFrame(
                        data=TelemetryData(**raw),
                        timestamp=datetime.now(timezone.utc),
                    )
                    await self._broadcast(frame)
                except Exception as e:
                    logger.warning("Telemetry poll error: %s", e)
            await asyncio.sleep(interval)

    async def _broadcast(self, frame: TelemetryFrame) -> None:
        dead: list[Callable] = []
        for cb in self._subscribers:
            try:
                await cb(frame)
            except Exception:
                dead.append(cb)
        for cb in dead:
            self._subscribers.discard(cb)
