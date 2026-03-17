# Tello Web Controller — Backend

FastAPI backend service for controlling a DJI Tello drone via REST API and WebSocket telemetry.

## Quick Start

### Without a Drone (Mock Mode)

```bash
cd backend
source .venv/bin/activate
TELLO_USE_MOCK_DRONE=true uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Starts the server with a fake drone that logs commands. Good for verifying the API works.

### With a Real DJI Tello Drone

**1. Connect your computer to the Tello's Wi-Fi**

- Power on the Tello — it creates a Wi-Fi network named `TELLO-XXXXXX`
- Connect your Mac to that Wi-Fi network
- You'll lose internet access while connected

**2. Start the backend**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

No `TELLO_USE_MOCK_DRONE` flag — it defaults to `false`, connecting to the real drone at `192.168.10.1`.

**3. Fly via curl**

```bash
# Connect to drone
curl -X POST http://localhost:8000/api/control/connect

# Check status & battery
curl http://localhost:8000/api/status

# Takeoff (drone will hover ~50cm)
curl -X POST http://localhost:8000/api/control/takeoff

# Move forward 50cm
curl -X POST http://localhost:8000/api/control/move \
  -H 'Content-Type: application/json' \
  -d '{"direction":"forward","distance_cm":50}'

# Rotate 90° clockwise
curl -X POST http://localhost:8000/api/control/rotate \
  -H 'Content-Type: application/json' \
  -d '{"direction":"cw","angle_deg":90}'

# Land
curl -X POST http://localhost:8000/api/control/land

# Disconnect
curl -X POST http://localhost:8000/api/control/disconnect
```

**Emergency stop** (kills motors instantly — drone will fall):

```bash
curl -X POST http://localhost:8000/api/control/emergency
```

**4. Monitor telemetry via WebSocket**

```bash
# Install wscat if needed: npm install -g wscat
wscat -c ws://localhost:8000/api/ws/telemetry
```

You'll see JSON frames at ~4Hz with battery, height, flight time, and temperature.

## Running Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest -v                          # All 36 tests
python -m pytest tests/test_drone_manager.py # Unit tests only
python -m pytest tests/test_control.py       # API integration tests only
python -m pytest tests/test_telemetry.py     # WebSocket tests only
```

All tests use `MockTello` — no drone needed.

## Via Docker

```bash
# From project root
docker compose up --build
```

> **Note**: On macOS, `network_mode: host` in `docker-compose.yml` won't give the container access to the Tello's UDP ports. For macOS, run the backend natively (not in Docker) while connected to the Tello's Wi-Fi.

## API Reference

### Control Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/control/connect` | — | `{ ok, status, battery }` |
| POST | `/api/control/disconnect` | — | `{ ok, message }` |
| POST | `/api/control/takeoff` | — | `{ ok, message }` |
| POST | `/api/control/land` | — | `{ ok, message }` |
| POST | `/api/control/emergency` | — | `{ ok, message }` |
| POST | `/api/control/move` | `{ direction, distance_cm }` | `{ ok, message }` |
| POST | `/api/control/rotate` | `{ direction, angle_deg }` | `{ ok, message }` |

### Status Endpoint

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/status` | `{ connected, flying, battery }` |

### WebSocket

| Path | Description |
|------|-------------|
| `WS /api/ws/telemetry` | Pushes telemetry frames (~4Hz) and command log events |

### Allowed Values

| Parameter | Values |
|-----------|--------|
| Move direction | `forward`, `back`, `left`, `right`, `up`, `down` |
| Move distance | 20–500 cm |
| Rotate direction | `cw`, `ccw` |
| Rotate angle | 1–360° |

## Environment Variables

All prefixed with `TELLO_`:

| Variable | Default | Description |
|----------|---------|-------------|
| `TELLO_USE_MOCK_DRONE` | `false` | Use fake drone for development |
| `TELLO_TELLO_HOST` | `192.168.10.1` | Drone IP address |
| `TELLO_API_PORT` | `8000` | Server port |
| `TELLO_TELEMETRY_POLL_HZ` | `4.0` | Telemetry polling frequency |
| `TELLO_CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | Allowed CORS origins |

## Safety Tips

- Always have a clear area around the drone before takeoff
- Keep battery above 30% for safe flight
- The `/emergency` endpoint bypasses all locks — use it if anything goes wrong
- Disconnecting while airborne will auto-land the drone first
