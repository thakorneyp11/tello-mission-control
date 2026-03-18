# Tello Web Controller

A locally-deployed web application for controlling a DJI Tello drone via browser. React frontend communicates with a FastAPI backend, which drives the drone through the `djitellopy` Python library.

```
Browser (React) ←HTTP/WS→ FastAPI + djitellopy ←UDP→ DJI Tello (192.168.10.1)
```

<img width="800" alt="Tello Web Controller Interface" src="https://github.com/user-attachments/assets/9ba9d593-b2ef-4b7d-b769-9882847af1cb">

Demo video: https://youtube.com/shorts/Ex-KBuxlEQw


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

Server pushes telemetry frames at ~4 Hz:

```json
{
  "type": "telemetry",
  "data": {
    "battery": 85,
    "height": 120,
    "flight_time": 42,
    "temperature": { "high": 65, "low": 60 },
    "attitude": { "pitch": 2, "roll": -1, "yaw": 180 },
    "speed": { "x": 0, "y": 10, "z": 0 },
    "barometer": 150.5,
    "tof_distance": 120
  },
  "timestamp": "2026-03-17T10:30:00.123Z"
}
```

Command log events are also pushed over the same connection:

```json
{
  "type": "command_log",
  "data": {
    "command": "move",
    "params": { "direction": "forward", "distance_cm": 100 },
    "result": "ok",
    "timestamp": "2026-03-17T10:30:01.456Z"
  }
}
```

## Running Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest -v    # 54 tests, all use MockTello (no drone needed)
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

## Future Implementations

A roadmap of where this project could go, roughly ordered from most practical to most ambitious.

### Phase 1 — Platform Hardening

- **MCP Server** — Expose drone commands as MCP tools so Claude (or any MCP client) can fly the drone through natural language
- **Flight Logging & Replay** — Persist every command + telemetry snapshot to SQLite/TimescaleDB, replay sessions in the UI as a timeline
- **Gamepad Support** — Map PS5/Xbox controllers via the Gamepad API to `send_rc_control()` for proper analog stick flying
- **WebRTC Video** — Replace MJPEG with WebRTC for lower latency, better compression, and future peer-to-peer streaming

### Phase 2 — Computer Vision

- **Object Detection Overlay** — Run YOLOv8/v10 on the video stream (on the ground station GPU or via edge TPU) and draw bounding boxes on the HUD
- **Face / Person Tracking** — Detect a target and auto-generate RC commands to keep them centered in frame — "follow me" mode
- **Optical Flow & SLAM** — Estimate drone position drift without GPS using visual odometry, display estimated position on a 2D minimap
- **QR / ArUco Marker Navigation** — Place markers as waypoints; drone reads them mid-flight to self-correct position

### Phase 3 — Autonomous Flight

- **Waypoint Mission Planner** — Draw a flight path on a 2D/3D grid UI, convert to a sequence of `go_xyz_speed()` commands
- **Geofencing & Safety Zones** — Define virtual boundaries the drone can't cross; auto-hover or return if breached
- **Auto-Landing on Low Battery** — Monitor battery in real-time, trigger autonomous return-and-land below a threshold
- **Obstacle Avoidance** — Fuse TOF sensor + video depth estimation to halt forward movement when obstacles detected

### Phase 4 — AI Agent Layer

- **Claude-Powered Mission Planning** — Describe a mission in natural language ("survey this room in a grid pattern"), agent generates and executes the command sequence
- **Voice Control** — Whisper STT → Claude intent parsing → MCP tool call → drone action, full voice-to-flight pipeline
- **Anomaly Narration** — AI watches the video stream and narrates what it sees, flags unusual objects or changes
- **Multi-Modal Reporting** — After a flight, AI auto-generates a summary report with captured images, telemetry charts, and observations

### Phase 5 — Multi-Drone & Swarm

- **Swarm Support** — Leverage `djitellopy.Swarm` with Tello EDUs, manage multiple drones from one UI with individual + synchronized controls
- **Formation Flying** — Define geometric formations (line, V-shape, grid) that maintain relative positions
- **Collaborative Mapping** — Multiple drones scan different zones simultaneously, stitch results into a combined map

### Phase 6 — Hardware & Integration

- **Raspberry Pi Ground Station Image** — Pre-built SD card image with Docker stack, auto-connects to Tello on boot, zero-config
- **Custom Companion Board** — ESP32 or Pi Pico as a relay for additional sensors (LIDAR, gas, thermal) mounted on the Tello
- **Home Assistant Integration** — Trigger drone patrols from HA automations (e.g. "fly a perimeter check when motion is detected at night")
- **3D Print Accessories** — Custom payload mounts, sensor brackets, and landing gear extensions

> The MCP server is the single highest-leverage next step — once drone control is exposed as tools, everything in Phases 4+ becomes dramatically easier to build because Claude can orchestrate it all.

## Challenges

### The Networking Problem: Tello WiFi vs. Internet

This is the fundamental challenge. The Tello drone creates its own WiFi access point (`TELLO-XXXXXX` at `192.168.10.1`), and when your machine connects to it, you lose internet access. This is a dealbreaker for production use — you can't reach MCP servers, cloud APIs, or anything else online.

There are a few ways to solve this, each with different trade-offs.

**Option 1: Dual Network Interfaces (simplest and most reliable)**

Use your machine's built-in WiFi to connect to the Tello, and plug in an Ethernet cable for internet. Most laptops and all desktops support this out of the box. Your OS routing table will send traffic to `192.168.10.x` over WiFi and everything else over Ethernet. This "just works" on Linux, macOS, and Windows without any special configuration — the OS prefers the wired interface for default gateway automatically.

**Option 2: USB WiFi Adapter (no Ethernet available)**

If you don't have Ethernet access, grab a cheap USB WiFi dongle. Connect the dongle to the Tello AP, and keep your built-in WiFi on your home/office network. You'd then configure the backend to bind specifically to the USB adapter's interface for Tello UDP traffic. This requires a small amount of OS-level network config but works well.

**Option 3: Dedicated Ground Station Device (best for production)**

Deploy a small dedicated device — a Raspberry Pi 4/5 or an Intel NUC mini PC — as your permanent "ground station." This device connects its WiFi to the Tello drone and its Ethernet to your local network (router). Your webapp runs on this device via Docker, and you access it from any browser on your regular network.

```
                        YOUR LOCAL NETWORK (with internet)
                        ┌──────────────────────────────────┐
                        │                                  │
  ┌──────────┐    WiFi  │   ┌──────────┐     Ethernet      │    ┌──────────┐
  │  Tello   │◄─────────┤   │  Ground  │◄─────────────────►├───►│  Router  │──► Internet
  │  Drone   │  AP mode  │   │  Station │    192.168.1.x    │    │          │
  │192.168.  │          │   │  (Pi/NUC)│                   │    └──────────┘
  │  10.1    │ UDP 8889 │   │          │                   │
  └──────────┘   8890   │   │ Docker:  │     :3000 (UI)    │    ┌──────────┐
               11111   │   │ backend  │◄────────────────────────│ Your     │
                        │   │ frontend │     :8000 (API)    │    │ Laptop/  │
                        │   └──────────┘                   │    │ Desktop  │
                        │                                  │    └──────────┘
                        └──────────────────────────────────┘
```

The beauty of this setup is that the ground station has two network paths simultaneously — WiFi to the drone, Ethernet to your LAN and internet. Your laptop just opens `http://groundstation.local:3000` in a browser. The backend on the ground station can reach both the Tello (via WiFi UDP) and the internet (via Ethernet) for MCP servers, AI APIs, etc.
