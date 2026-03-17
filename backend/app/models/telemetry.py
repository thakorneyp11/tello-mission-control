from datetime import datetime

from pydantic import BaseModel


class TelemetryData(BaseModel):
    battery: int
    height: int  # cm
    flight_time: int  # seconds
    temperature: float  # celsius


class TelemetryFrame(BaseModel):
    type: str = "telemetry"
    data: TelemetryData
    timestamp: datetime


class CommandLogEntry(BaseModel):
    type: str = "command_log"
    data: dict
