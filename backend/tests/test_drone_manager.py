import asyncio

import pytest

from app.models.commands import MoveDirection, RotateDirection
from app.services.drone_manager import (
    DroneManager,
    DroneNotConnectedError,
    DroneNotFlyingError,
    MockTello,
)


@pytest.fixture
def dm():
    return DroneManager()


@pytest.mark.asyncio
async def test_connect_sets_connected(dm):
    result = await dm.connect()
    assert result["ok"] is True
    assert result["status"] == "connected"
    assert result["battery"] == 85
    assert dm.is_connected is True


@pytest.mark.asyncio
async def test_connect_when_already_connected(dm):
    await dm.connect()
    result = await dm.connect()
    assert result["status"] == "already_connected"
    assert dm.is_connected is True


@pytest.mark.asyncio
async def test_disconnect(dm):
    await dm.connect()
    result = await dm.disconnect()
    assert result["ok"] is True
    assert result["status"] == "disconnected"
    assert dm.is_connected is False
    assert dm.tello is None


@pytest.mark.asyncio
async def test_disconnect_when_not_connected(dm):
    result = await dm.disconnect()
    assert result["status"] == "already_disconnected"


@pytest.mark.asyncio
async def test_disconnect_lands_if_flying(dm):
    await dm.connect()
    await dm.takeoff()
    assert dm.is_flying is True
    result = await dm.disconnect()
    assert result["ok"] is True
    assert dm.is_flying is False
    assert dm.is_connected is False


@pytest.mark.asyncio
async def test_takeoff_sets_flying(dm):
    await dm.connect()
    result = await dm.takeoff()
    assert result["ok"] is True
    assert dm.is_flying is True


@pytest.mark.asyncio
async def test_takeoff_when_not_connected_raises(dm):
    with pytest.raises(DroneNotConnectedError):
        await dm.takeoff()


@pytest.mark.asyncio
async def test_land_clears_flying(dm):
    await dm.connect()
    await dm.takeoff()
    result = await dm.land()
    assert result["ok"] is True
    assert dm.is_flying is False


@pytest.mark.asyncio
async def test_emergency_bypasses_lock(dm):
    """Emergency should work even when a command is in progress."""
    await dm.connect()
    await dm.takeoff()

    # Acquire the lock to simulate a long-running command
    async with dm._lock:
        # Emergency should not deadlock — it bypasses the lock
        result = await asyncio.wait_for(dm.emergency(), timeout=2.0)
        assert result["ok"] is True
        assert dm.is_flying is False


@pytest.mark.asyncio
async def test_emergency_when_not_connected(dm):
    result = await dm.emergency()
    assert result["ok"] is True


@pytest.mark.asyncio
async def test_move_requires_connected(dm):
    with pytest.raises(DroneNotConnectedError):
        await dm.move(MoveDirection.forward, 100)


@pytest.mark.asyncio
async def test_move_requires_flying(dm):
    await dm.connect()
    with pytest.raises(DroneNotFlyingError):
        await dm.move(MoveDirection.forward, 100)


@pytest.mark.asyncio
async def test_move_all_directions(dm):
    await dm.connect()
    await dm.takeoff()
    for direction in MoveDirection:
        result = await dm.move(direction, 50)
        assert result["ok"] is True
        assert direction.value in result["message"]


@pytest.mark.asyncio
async def test_rotate_cw_and_ccw(dm):
    await dm.connect()
    await dm.takeoff()
    result_cw = await dm.rotate(RotateDirection.cw, 90)
    assert result_cw["ok"] is True
    result_ccw = await dm.rotate(RotateDirection.ccw, 180)
    assert result_ccw["ok"] is True


@pytest.mark.asyncio
async def test_rotate_requires_connected_and_flying(dm):
    with pytest.raises(DroneNotConnectedError):
        await dm.rotate(RotateDirection.cw, 90)
    await dm.connect()
    with pytest.raises(DroneNotFlyingError):
        await dm.rotate(RotateDirection.cw, 90)


@pytest.mark.asyncio
async def test_get_battery(dm):
    await dm.connect()
    battery = await dm.get_battery()
    assert battery == 85


@pytest.mark.asyncio
async def test_get_battery_when_not_connected(dm):
    battery = await dm.get_battery()
    assert battery == 0


@pytest.mark.asyncio
async def test_get_telemetry(dm):
    await dm.connect()
    telemetry = await dm.get_telemetry()
    assert telemetry["battery"] == 85
    assert telemetry["height"] == 0
    assert telemetry["flight_time"] == 0
    assert telemetry["temperature"] == {"high": 65.0, "low": 60.0}
    assert telemetry["attitude"] == {"pitch": 0, "roll": 0, "yaw": 0}
    assert telemetry["speed"] == {"x": 0, "y": 0, "z": 0}
    assert telemetry["barometer"] == 0.0
    assert telemetry["tof_distance"] == 0


@pytest.mark.asyncio
async def test_get_telemetry_after_takeoff(dm):
    await dm.connect()
    await dm.takeoff()
    telemetry = await dm.get_telemetry()
    assert telemetry["height"] == 50
    assert telemetry["barometer"] == 50.0
    assert telemetry["tof_distance"] == 50


@pytest.mark.asyncio
async def test_get_telemetry_after_rotation(dm):
    await dm.connect()
    await dm.takeoff()
    await dm.rotate(RotateDirection.cw, 90)
    telemetry = await dm.get_telemetry()
    assert telemetry["attitude"]["yaw"] == 90


@pytest.mark.asyncio
async def test_get_telemetry_when_not_connected(dm):
    telemetry = await dm.get_telemetry()
    assert telemetry["battery"] == 0
    assert telemetry["temperature"] == {"high": 0.0, "low": 0.0}
    assert telemetry["attitude"] == {"pitch": 0, "roll": 0, "yaw": 0}
    assert telemetry["speed"] == {"x": 0, "y": 0, "z": 0}


@pytest.mark.asyncio
async def test_shutdown_disconnects(dm):
    await dm.connect()
    assert dm.is_connected is True
    await dm.shutdown()
    assert dm.is_connected is False


@pytest.mark.asyncio
async def test_command_log_callback(dm):
    logs = []

    async def log_cb(entry):
        logs.append(entry)

    dm.add_command_log_callback(log_cb)
    await dm.connect()
    assert len(logs) == 1
    assert logs[0]["data"]["command"] == "connect"

    dm.remove_command_log_callback(log_cb)
    await dm.takeoff()
    assert len(logs) == 1  # no new entries after removal
