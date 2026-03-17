from fastapi import APIRouter, HTTPException, Request

from app.models.commands import (
    CommandResponse,
    ConnectResponse,
    MoveRequest,
    RotateRequest,
)
from app.services.drone_manager import DroneNotConnectedError, DroneNotFlyingError

router = APIRouter(prefix="/api/control", tags=["control"])


def _get_dm(request: Request):
    return request.app.state.drone_manager


@router.post("/connect", response_model=ConnectResponse)
async def connect(request: Request):
    dm = _get_dm(request)
    try:
        result = await dm.connect()
        return ConnectResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect: {e}")


@router.post("/disconnect", response_model=CommandResponse)
async def disconnect(request: Request):
    dm = _get_dm(request)
    try:
        result = await dm.disconnect()
        return CommandResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Disconnect failed: {e}")


@router.post("/takeoff", response_model=CommandResponse)
async def takeoff(request: Request):
    dm = _get_dm(request)
    try:
        result = await dm.takeoff()
        return CommandResponse(**result)
    except DroneNotConnectedError:
        raise HTTPException(status_code=409, detail="Drone is not connected")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Takeoff failed: {e}")


@router.post("/land", response_model=CommandResponse)
async def land(request: Request):
    dm = _get_dm(request)
    try:
        result = await dm.land()
        return CommandResponse(**result)
    except DroneNotConnectedError:
        raise HTTPException(status_code=409, detail="Drone is not connected")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Land failed: {e}")


@router.post("/emergency", response_model=CommandResponse)
async def emergency(request: Request):
    dm = _get_dm(request)
    result = await dm.emergency()
    return CommandResponse(**result)


@router.post("/move", response_model=CommandResponse)
async def move(request: Request, body: MoveRequest):
    dm = _get_dm(request)
    try:
        result = await dm.move(body.direction.value, body.distance_cm)
        return CommandResponse(**result)
    except DroneNotConnectedError:
        raise HTTPException(status_code=409, detail="Drone is not connected")
    except DroneNotFlyingError:
        raise HTTPException(status_code=409, detail="Drone is not flying")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Move failed: {e}")


@router.post("/rotate", response_model=CommandResponse)
async def rotate(request: Request, body: RotateRequest):
    dm = _get_dm(request)
    try:
        result = await dm.rotate(body.direction.value, body.angle_deg)
        return CommandResponse(**result)
    except DroneNotConnectedError:
        raise HTTPException(status_code=409, detail="Drone is not connected")
    except DroneNotFlyingError:
        raise HTTPException(status_code=409, detail="Drone is not flying")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rotate failed: {e}")
