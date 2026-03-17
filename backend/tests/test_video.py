import pytest
from fastapi.testclient import TestClient


def test_stream_start_requires_connection(test_client: TestClient):
    resp = test_client.post("/api/video/stream/start")
    assert resp.status_code == 409


def test_stream_start_and_stop(test_client: TestClient):
    test_client.post("/api/control/connect")

    resp = test_client.post("/api/video/stream/start")
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    resp = test_client.post("/api/video/stream/stop")
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


def test_stream_start_idempotent(test_client: TestClient):
    test_client.post("/api/control/connect")
    test_client.post("/api/video/stream/start")

    resp = test_client.post("/api/video/stream/start")
    assert resp.status_code == 200
    assert "already" in resp.json()["message"].lower()


def test_snapshot_requires_connection(test_client: TestClient):
    resp = test_client.post("/api/video/snapshot")
    assert resp.status_code == 409


def test_snapshot_returns_jpeg(test_client: TestClient):
    test_client.post("/api/control/connect")

    resp = test_client.post("/api/video/snapshot")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/jpeg"
    # JPEG files start with FF D8
    assert resp.content[:2] == b"\xff\xd8"


def test_mjpeg_stream_requires_connection(test_client: TestClient):
    resp = test_client.get("/api/video/stream")
    assert resp.status_code == 409


def test_mjpeg_stream_auto_starts(test_client: TestClient):
    """Verify that GET /api/video/stream auto-starts streaming."""
    test_client.post("/api/control/connect")

    # Check streaming is off
    status = test_client.get("/api/status").json()
    assert status["streaming"] is False

    # Stop stream after first frame so the generator exits
    dm = test_client.app.state.drone_manager

    import threading

    def stop_after_delay():
        import time
        time.sleep(0.3)
        dm._streaming = False

    threading.Thread(target=stop_after_delay, daemon=True).start()

    resp = test_client.get("/api/video/stream")
    assert resp.status_code == 200
    assert "multipart/x-mixed-replace" in resp.headers["content-type"]
    # Response body should contain at least one JPEG frame
    assert b"--frame" in resp.content
    assert b"\xff\xd8" in resp.content  # JPEG magic bytes


def test_status_includes_streaming(test_client: TestClient):
    resp = test_client.get("/api/status")
    assert "streaming" in resp.json()

    test_client.post("/api/control/connect")
    test_client.post("/api/video/stream/start")

    resp = test_client.get("/api/status")
    assert resp.json()["streaming"] is True
