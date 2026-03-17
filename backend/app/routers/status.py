import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(tags=["status"])
logger = logging.getLogger(__name__)


class StatusResponse(BaseModel):
    connected: bool
    flying: bool
    streaming: bool
    battery: int


@router.get("/api/status", response_model=StatusResponse)
async def get_status(request: Request):
    dm = request.app.state.drone_manager
    battery = 0
    if dm.is_connected:
        try:
            battery = await dm.get_battery()
        except Exception:
            battery = -1
    return StatusResponse(
        connected=dm.is_connected,
        flying=dm.is_flying,
        streaming=dm.is_streaming,
        battery=battery,
    )
