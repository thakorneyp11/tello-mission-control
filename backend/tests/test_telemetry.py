import pytest
from fastapi.testclient import TestClient


def test_websocket_connect_and_receive(test_client: TestClient):
    """Telemetry frame should contain all expected fields."""
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        assert data["type"] == "telemetry"
        assert "timestamp" in data

        d = data["data"]
        assert "battery" in d
        assert "height" in d
        assert "flight_time" in d
        assert "temperature" in d
        assert "attitude" in d
        assert "speed" in d
        assert "barometer" in d
        assert "tof_distance" in d


def test_telemetry_nested_structure(test_client: TestClient):
    """Temperature, attitude, and speed should have correct nested keys."""
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        d = data["data"]

        assert "high" in d["temperature"]
        assert "low" in d["temperature"]

        assert "pitch" in d["attitude"]
        assert "roll" in d["attitude"]
        assert "yaw" in d["attitude"]

        assert "x" in d["speed"]
        assert "y" in d["speed"]
        assert "z" in d["speed"]


def test_telemetry_values_types(test_client: TestClient):
    """Verify telemetry values have correct types."""
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        d = data["data"]

        assert isinstance(d["battery"], int)
        assert isinstance(d["height"], int)
        assert isinstance(d["flight_time"], int)
        assert isinstance(d["temperature"]["high"], (int, float))
        assert isinstance(d["temperature"]["low"], (int, float))
        assert isinstance(d["attitude"]["pitch"], int)
        assert isinstance(d["attitude"]["roll"], int)
        assert isinstance(d["attitude"]["yaw"], int)
        assert isinstance(d["speed"]["x"], int)
        assert isinstance(d["speed"]["y"], int)
        assert isinstance(d["speed"]["z"], int)
        assert isinstance(d["barometer"], (int, float))
        assert isinstance(d["tof_distance"], int)


def test_telemetry_initial_values(test_client: TestClient):
    """Before takeoff, height/speed/barometer should be zero."""
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        d = data["data"]

        assert d["battery"] == 85
        assert d["height"] == 0
        assert d["speed"]["x"] == 0
        assert d["speed"]["y"] == 0
        assert d["speed"]["z"] == 0
        assert d["barometer"] == 0.0
        assert d["tof_distance"] == 0
        assert d["attitude"]["yaw"] == 0


def test_telemetry_after_takeoff(test_client: TestClient):
    """After takeoff, height and barometer should be non-zero."""
    test_client.post("/api/control/connect")
    test_client.post("/api/control/takeoff")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        d = data["data"]

        assert d["height"] == 50
        assert d["barometer"] == 50.0
        assert d["tof_distance"] == 50


def test_telemetry_after_rotation(test_client: TestClient):
    """Yaw should change after rotation."""
    test_client.post("/api/control/connect")
    test_client.post("/api/control/takeoff")
    test_client.post(
        "/api/control/rotate",
        json={"direction": "cw", "angle_deg": 90},
    )

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        assert data["data"]["attitude"]["yaw"] == 90


def test_telemetry_temperature_range(test_client: TestClient):
    """Temperature high should be >= low."""
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        data = ws.receive_json(mode="text")
        temp = data["data"]["temperature"]
        assert temp["high"] >= temp["low"]


def test_websocket_receives_command_log(test_client: TestClient):
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        test_client.post("/api/control/takeoff")

        found_command_log = False
        for _ in range(20):
            data = ws.receive_json(mode="text")
            if data["type"] == "command_log":
                assert data["data"]["command"] == "takeoff"
                assert "timestamp" in data["data"]
                found_command_log = True
                break

        assert found_command_log, "Expected a command_log message for takeoff"


def test_command_log_structure(test_client: TestClient):
    """Command log entries should have command, params, result, and timestamp."""
    test_client.post("/api/control/connect")
    test_client.post("/api/control/takeoff")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        test_client.post(
            "/api/control/move",
            json={"direction": "forward", "distance_cm": 100},
        )

        for _ in range(20):
            data = ws.receive_json(mode="text")
            if data["type"] == "command_log" and data["data"]["command"] == "move":
                entry = data["data"]
                assert entry["params"]["direction"] == "forward"
                assert entry["params"]["distance_cm"] == 100
                assert entry["result"] == "ok"
                assert "timestamp" in entry
                break
        else:
            pytest.fail("Expected a command_log message for move")


def test_multiple_telemetry_frames(test_client: TestClient):
    """Should receive multiple telemetry frames in sequence."""
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        frames = []
        for _ in range(5):
            data = ws.receive_json(mode="text")
            if data["type"] == "telemetry":
                frames.append(data)
            if len(frames) >= 3:
                break

        assert len(frames) >= 3, f"Expected at least 3 telemetry frames, got {len(frames)}"
