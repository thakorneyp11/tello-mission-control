from fastapi.testclient import TestClient


def test_websocket_connect_and_receive(test_client: TestClient):
    # Connect the drone first so telemetry has data
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        # Send something to keep the connection alive
        # The telemetry service should push data
        # We'll wait for at most one telemetry frame
        data = ws.receive_json(mode="text")
        assert data["type"] == "telemetry"
        assert "battery" in data["data"]
        assert "height" in data["data"]
        assert "timestamp" in data


def test_websocket_receives_command_log(test_client: TestClient):
    test_client.post("/api/control/connect")

    with test_client.websocket_connect("/api/ws/telemetry") as ws:
        # Trigger a command that generates a log entry
        test_client.post("/api/control/takeoff")

        # Collect messages until we find a command_log
        found_command_log = False
        for _ in range(20):  # read up to 20 messages
            data = ws.receive_json(mode="text")
            if data["type"] == "command_log":
                assert data["data"]["command"] == "takeoff"
                found_command_log = True
                break

        assert found_command_log, "Expected a command_log message for takeoff"
