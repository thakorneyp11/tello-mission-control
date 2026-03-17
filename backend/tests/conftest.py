import os

# Force mock mode before any app imports
os.environ["TELLO_USE_MOCK_DRONE"] = "true"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.drone_manager import DroneManager, MockTello
from app.services.telemetry_service import TelemetryService


@pytest.fixture
def mock_tello():
    return MockTello()


@pytest.fixture
def drone_manager():
    return DroneManager()


@pytest.fixture
def test_client():
    """Synchronous test client with fresh DroneManager in mock mode."""
    dm = DroneManager()
    ts = TelemetryService(dm)
    app.state.drone_manager = dm
    app.state.telemetry_service = ts
    with TestClient(app) as client:
        yield client
