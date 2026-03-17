# Tello Web Controller

A locally-deployed web application for controlling a DJI Tello drone via browser. React frontend communicates with a FastAPI backend, which drives the drone through the `djitellopy` Python library.

```
Browser (React) ←HTTP/WS→ FastAPI + djitellopy ←UDP→ DJI Tello (192.168.10.1)
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (optional)
- DJI Tello drone (or use mock mode for development)

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# With mock drone (no hardware needed)
TELLO_USE_MOCK_DRONE=true uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# With real drone (connect to Tello Wi-Fi first)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev    # http://localhost:5173
```

### 3. Docker (both services)

```bash
docker compose up --build
```

> **macOS note**: `network_mode: host` in `docker-compose.yml` won't give the container UDP access to the drone. Run the backend natively on macOS.

## Flying with the API

```bash
# Connect
curl -X POST http://localhost:8000/api/control/connect

# Check status
curl http://localhost:8000/api/status

# Takeoff
curl -X POST http://localhost:8000/api/control/takeoff

# Move forward 100cm
curl -X POST http://localhost:8000/api/control/move \
  -H 'Content-Type: application/json' \
  -d '{"direction":"forward","distance_cm":100}'

# Rotate 90° clockwise
curl -X POST http://localhost:8000/api/control/rotate \
  -H 'Content-Type: application/json' \
  -d '{"direction":"cw","angle_deg":90}'

# Land
curl -X POST http://localhost:8000/api/control/land

# Emergency stop (kills motors instantly)
curl -X POST http://localhost:8000/api/control/emergency

# Disconnect
curl -X POST http://localhost:8000/api/control/disconnect
```

### Video Stream

Open in browser or use in an `<img>` tag:

```
http://localhost:8000/api/video/stream
```

### Telemetry (WebSocket)

```bash
wscat -c ws://localhost:8000/api/ws/telemetry
```

## Running Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest -v    # 44 tests, all use MockTello (no drone needed)
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/control/connect` | Connect to drone |
| POST | `/api/control/disconnect` | Disconnect (auto-lands if flying) |
| POST | `/api/control/takeoff` | Take off |
| POST | `/api/control/land` | Land |
| POST | `/api/control/emergency` | Emergency motor kill |
| POST | `/api/control/move` | Move (body: `{direction, distance_cm}`) |
| POST | `/api/control/rotate` | Rotate (body: `{direction, angle_deg}`) |
| GET | `/api/video/stream` | MJPEG video stream |
| POST | `/api/video/stream/start` | Start video stream |
| POST | `/api/video/stream/stop` | Stop video stream |
| POST | `/api/video/snapshot` | Capture single JPEG frame |
| GET | `/api/status` | `{connected, flying, streaming, battery}` |
| GET | `/api/sequences` | List flight sequences (stub) |
| WS | `/api/ws/telemetry` | Telemetry push (~4Hz) + command logs |

### Allowed Values

| Parameter | Values |
|-----------|--------|
| Move direction | `forward`, `back`, `left`, `right`, `up`, `down` |
| Move distance | 20–500 cm |
| Rotate direction | `cw`, `ccw` |
| Rotate angle | 1–360° |

## Configuration

All environment variables are prefixed with `TELLO_`:

| Variable | Default | Description |
|----------|---------|-------------|
| `TELLO_USE_MOCK_DRONE` | `false` | Use fake drone for development |
| `TELLO_TELLO_HOST` | `192.168.10.1` | Drone IP address |
| `TELLO_TELEMETRY_POLL_HZ` | `4.0` | Telemetry polling frequency |
| `TELLO_VIDEO_FPS` | `30` | Video stream frame rate |
| `TELLO_VIDEO_JPEG_QUALITY` | `70` | JPEG compression quality |

## Project Structure

```
├── backend/                 # FastAPI + djitellopy
│   ├── app/
│   │   ├── main.py          # App entry point, lifespan, CORS
│   │   ├── config.py        # Settings via env vars
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # DroneManager, TelemetryService
│   │   └── models/          # Pydantic schemas
│   └── tests/               # pytest (44 tests)
├── frontend/                # React + Vite + TailwindCSS
│   └── src/
├── docs/                    # PRD & Architecture docs
└── docker-compose.yml
```

## Safety

- Always have clear space around the drone before takeoff
- Keep battery above 30%
- `/api/control/emergency` bypasses all locks — use if anything goes wrong
- Disconnecting while airborne auto-lands first
