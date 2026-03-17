import asyncio
import logging

import cv2
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse

from app.config import settings
from app.models.commands import CommandResponse
from app.services.drone_manager import DroneNotConnectedError

router = APIRouter(prefix="/api/video", tags=["video"])
logger = logging.getLogger(__name__)


async def _generate_mjpeg_frames(drone_manager):
    """Yield JPEG frames as multipart/x-mixed-replace chunks."""
    interval = 1.0 / settings.video_fps
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, settings.video_jpeg_quality]

    while drone_manager.is_streaming:
        frame = drone_manager.get_frame()
        if frame is None:
            await asyncio.sleep(interval)
            continue

        _, jpeg = cv2.imencode(".jpg", frame, encode_params)
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + jpeg.tobytes()
            + b"\r\n"
        )
        await asyncio.sleep(interval)


@router.get("/stream")
async def video_stream(request: Request):
    """MJPEG video stream. Frontend uses <img src="/api/video/stream" />."""
    dm = request.app.state.drone_manager

    if not dm.is_connected:
        raise HTTPException(status_code=409, detail="Drone is not connected")

    # Auto-start the stream if not already running
    if not dm.is_streaming:
        try:
            await dm.stream_on()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start stream: {e}")

    return StreamingResponse(
        _generate_mjpeg_frames(dm),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.post("/stream/start", response_model=CommandResponse)
async def stream_start(request: Request):
    """Explicitly start the video stream."""
    dm = request.app.state.drone_manager
    try:
        result = await dm.stream_on()
        return CommandResponse(**result)
    except DroneNotConnectedError:
        raise HTTPException(status_code=409, detail="Drone is not connected")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start stream: {e}")


@router.post("/stream/stop", response_model=CommandResponse)
async def stream_stop(request: Request):
    """Explicitly stop the video stream."""
    dm = request.app.state.drone_manager
    try:
        result = await dm.stream_off()
        return CommandResponse(**result)
    except DroneNotConnectedError:
        raise HTTPException(status_code=409, detail="Drone is not connected")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop stream: {e}")


@router.post("/snapshot")
async def snapshot(request: Request):
    """Capture a single frame as JPEG."""
    dm = request.app.state.drone_manager

    if not dm.is_connected:
        raise HTTPException(status_code=409, detail="Drone is not connected")

    # Auto-start stream if needed to get a frame
    if not dm.is_streaming:
        try:
            await dm.stream_on()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start stream: {e}")

    frame = dm.get_frame()
    if frame is None:
        raise HTTPException(status_code=503, detail="No frame available")

    _, jpeg = cv2.imencode(".jpg", frame)
    return Response(
        content=jpeg.tobytes(),
        media_type="image/jpeg",
        headers={"Content-Disposition": "attachment; filename=tello_snapshot.jpg"},
    )
