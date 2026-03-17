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

### 1. Environment Setup

```bash
cp .env.template .env
# Edit .env as needed (mock mode is enabled by default)
```

### 2. Docker (recommended)

```bash
docker compose up --build
```

This starts both services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### 3. Native Development

**Backend:**
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

**Frontend:**
```bash
cd frontend
npm ci
npm run dev    # http://localhost:5173
```

> **Real drone on Linux**: If you need direct UDP access to the drone (192.168.10.1), add `network_mode: host` to the backend service in `docker-compose.yml`. Note that `network_mode: host` does not work on macOS/Windows — run the backend natively instead.

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

All environment variables are prefixed with `TELLO_`. See `.env.template` for the full list with defaults.

| Variable | Default | Description |
|----------|---------|-------------|
| `TELLO_USE_MOCK_DRONE` | `false` | Use fake drone for development |
| `TELLO_TELLO_HOST` | `192.168.10.1` | Drone IP address |
| `TELLO_API_PORT` | `8000` | Backend server port |
| `TELLO_FRONTEND_PORT` | `3000` | Frontend server port (Docker) |
| `TELLO_TELEMETRY_POLL_HZ` | `4.0` | Telemetry polling frequency |
| `TELLO_VIDEO_FPS` | `30` | Video stream frame rate |
| `TELLO_VIDEO_JPEG_QUALITY` | `70` | JPEG compression quality |
| `TELLO_CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | Allowed CORS origins |

## Project Structure

```
├── backend/                        # FastAPI + djitellopy
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py                 # App entry point, lifespan, CORS
│   │   ├── config.py               # Settings via env vars
│   │   ├── routers/                # API endpoints
│   │   ├── services/               # DroneManager, TelemetryService
│   │   └── models/                 # Pydantic schemas
│   └── tests/                      # pytest (44 tests)
├── frontend/                       # React + Vite + TailwindCSS
│   ├── Dockerfile
│   ├── nginx.conf                  # Nginx reverse proxy config
│   └── src/
├── sample_drone_integration/       # djitellopy reference scripts
│   ├── droneeyes.py                # Video streaming example
│   ├── drone_control_simple.py     # Basic flight control example
│   └── drone_control_full.py       # Advanced flight choreography
├── docs/                           # PRD & Architecture docs
├── docker-compose.yml              # Both services orchestration
├── .env.template                   # Environment variable template
└── .env                            # Local environment config (gitignored)
```

## Safety

- Always have clear space around the drone before takeoff
- Keep battery above 30%
- `/api/control/emergency` bypasses all locks — use if anything goes wrong
- Disconnecting while airborne auto-lands first
