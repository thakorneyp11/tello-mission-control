from enum import Enum

from pydantic import BaseModel, Field


class MoveDirection(str, Enum):
    forward = "forward"
    back = "back"
    left = "left"
    right = "right"
    up = "up"
    down = "down"


class RotateDirection(str, Enum):
    cw = "cw"
    ccw = "ccw"


class MoveRequest(BaseModel):
    direction: MoveDirection
    distance_cm: int = Field(..., ge=20, le=500, description="Distance in cm (20-500)")


class RotateRequest(BaseModel):
    direction: RotateDirection
    angle_deg: int = Field(..., ge=1, le=360, description="Angle in degrees (1-360)")


class CommandResponse(BaseModel):
    ok: bool
    message: str = ""
    error: str | None = None


class ConnectResponse(BaseModel):
    ok: bool
    status: str
    battery: int | None = None
