# Software Architecture Document

## Tello Web Controller

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **Version**      | 1.0                            |
| **Status**       | Draft                          |
| **Author**       | Eyp (ThakornS)                 |
| **Date**         | 2026-03-17                     |

---

## 1. Architecture Overview

The system follows a **two-tier client-server architecture** deployed as Docker containers on the operator's local machine. The React frontend communicates with the FastAPI backend over HTTP (commands) and WebSocket (telemetry + video). The backend exclusively owns the UDP connection to the DJI Tello drone.

```
┌─────────────────┐         ┌──────────────────┐         ┌───────────────┐
│                 │  HTTP   │                  │   UDP   │               │
│   React App     │◄───────►│   FastAPI Server  │◄───────►│   DJI Tello   │
│   (Browser)     │   WS    │   + djitellopy    │  8889   │   Drone       │
│                 │         │                  │  8890   │  192.168.10.1 │
│  localhost:3000  │         │  localhost:8000   │  11111  │               │
└─────────────────┘         └──────────────────┘         └───────────────┘
     Docker:                      Docker:
     frontend                     backend
     (nginx)                      (python)
```

---

## 2. Technology Stack

| Component        | Technology               | Version   | Purpose                              |
| ---------------- | ------------------------ | --------- | ------------------------------------ |
| Frontend         | React + Vite             | React 18  | SPA UI                               |
| Styling          | TailwindCSS              | 3.x       | Utility-first CSS                    |
| State Management | Zustand                  | 4.x       | Lightweight global state             |
| Backend          | FastAPI                  | 0.110+    | REST + WebSocket API                 |
| Drone SDK        | djitellopy               | 2.5+      | Tello UDP command abstraction        |
| Video Processing | OpenCV (cv2)             | 4.x       | Frame capture and JPEG encoding      |
| Task Queue       | asyncio.Queue            | stdlib    | Serialize drone commands             |
| Containerization | Docker + Docker Compose  | 24.x      | Local deployment                     |
| Reverse Proxy    | Nginx                    | alpine    | Serve React build + proxy API        |

---

## 3. Project Structure

```
tello-web-controller/
├── docker-compose.yml
├── README.md
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── stores/
│       │   └── droneStore.ts          # Zustand store (connection, telemetry, logs)
│       ├── hooks/
│       │   ├── useWebSocket.ts        # WebSocket connection manager
│       │   └── useKeyboard.ts         # Keyboard shortcut bindings
│       ├── components/
│       │   ├── Header.tsx             # Connection controls + status badge
│       │   ├── VideoFeed.tsx          # MJPEG / img stream display
│       │   ├── TelemetryPanel.tsx     # Battery, height, IMU gauges
│       │   ├── FlightControls.tsx     # Directional buttons, takeoff/land
│       │   ├── FlipControls.tsx       # Flip direction buttons
│       │   ├── RotationControls.tsx   # CW/CCW rotation
│       │   ├── VirtualJoystick.tsx    # Dual-stick RC control (P1)
│       │   ├── SequencePanel.tsx      # Pre-built routine selector
│       │   ├── CommandLog.tsx         # Scrollable command history
│       │   └── EmergencyButton.tsx    # Always-visible emergency stop
│       ├── types/
│       │   └── drone.ts              # TypeScript interfaces
│       └── lib/
│           └── api.ts                # REST API client helpers
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                   # FastAPI app, lifespan, CORS
│   │   ├── config.py                 # Settings (host, port, distances)
│   │   ├── routers/
│   │   │   ├── control.py            # POST /api/control/* endpoints
│   │   │   ├── telemetry.py          # WS  /api/ws/telemetry
│   │   │   ├── video.py              # GET /api/video/stream (MJPEG)
│   │   │   └── sequences.py          # POST /api/sequences/*
│   │   ├── services/
│   │   │   ├── drone_manager.py      # Singleton Tello wrapper + command queue
│   │   │   ├── telemetry_service.py  # Background telemetry polling loop
│   │   │   ├── video_service.py      # Frame capture → JPEG encoding
│   │   │   └── sequence_runner.py    # Async sequence executor
│   │   ├── models/
│   │   │   ├── commands.py           # Pydantic request/response schemas
│   │   │   └── telemetry.py          # Telemetry data model
│   │   └── sequences/
│   │       └── builtin.py            # Pre-defined flight routines
│   └── tests/
│       ├── test_control.py
│       └── test_mock_drone.py        # djitellopy mock for CI
```

---

## 4. Component Architecture

### 4.1 Frontend Components

```
App
├── Header
│   ├── ConnectionStatus (badge: Disconnected/Connected/Error)
│   ├── ConnectButton
│   └── DisconnectButton
├── MainLayout (2-column)
│   ├── LeftColumn
│   │   ├── VideoFeed
│   │   └── FlightControls
│   │       ├── DirectionalPad (↑↓←→ + Up/Down)
│   │       ├── RotationControls (CW / CCW + angle slider)
│   │       ├── FlipControls (4 directions)
│   │       ├── TakeoffButton
│   │       ├── LandButton
│   │       └── DistanceInput (slider: 20–500 cm)
│   └── RightColumn
│       ├── TelemetryPanel
│       ├── SequencePanel
│       └── CommandLog
└── EmergencyButton (fixed position, always visible)
```

### 4.2 Backend Services

```
FastAPI App
├── Lifespan (startup/shutdown hooks)
│
├── DroneManager (singleton)
│   ├── Tello instance
│   ├── asyncio.Lock (command serialization)
│   ├── connect() / disconnect()
│   ├── execute_command(cmd, **params)
│   └── state: connected, flying, streaming
│
├── TelemetryService
│   ├── Background task (polling at 4 Hz)
│   ├── Reads: battery, height, flight_time, temp, IMU, speed
│   └── Broadcasts via WebSocket to all clients
│
├── VideoService
│   ├── get_frame_read() → BackgroundFrameRead
│   ├── Encodes frames as JPEG
│   └── Serves as MJPEG stream (multipart/x-mixed-replace)
│
└── SequenceRunner
    ├── Loads built-in sequences
    ├── Executes step-by-step via DroneManager
    ├── Emits progress events over WebSocket
    └── Supports cancellation (sets cancel flag → land)
```

---

## 5. API Design

### 5.1 REST Endpoints

| Method | Path                         | Description                    | Request Body                    | Response                  |
| ------ | ---------------------------- | ------------------------------ | ------------------------------- | ------------------------- |
| POST   | `/api/control/connect`       | Connect to drone               | —                               | `{ status, battery }`     |
| POST   | `/api/control/disconnect`    | Disconnect (lands if flying)   | —                               | `{ status }`              |
| POST   | `/api/control/takeoff`       | Take off                       | —                               | `{ ok, message }`         |
| POST   | `/api/control/land`          | Land                           | —                               | `{ ok, message }`         |
| POST   | `/api/control/emergency`     | Emergency motor kill           | —                               | `{ ok }`                  |
| POST   | `/api/control/move`          | Directional movement           | `{ direction, distance_cm }`    | `{ ok, message }`         |
| POST   | `/api/control/rotate`        | Rotate CW/CCW                  | `{ direction, angle_deg }`      | `{ ok, message }`         |
| POST   | `/api/control/flip`          | Execute flip                   | `{ direction }`                 | `{ ok, message }`         |
| POST   | `/api/control/rc`            | RC control (joystick)          | `{ lr, fb, ud, yaw }`          | `{ ok }`                  |
| GET    | `/api/video/stream`          | MJPEG video stream             | —                               | `multipart/x-mixed-replace` |
| POST   | `/api/video/snapshot`        | Capture single frame           | —                               | JPEG binary               |
| GET    | `/api/sequences`             | List available sequences       | —                               | `[{ id, name, steps }]`  |
| POST   | `/api/sequences/{id}/run`    | Execute a sequence             | —                               | `{ ok, run_id }`          |
| POST   | `/api/sequences/cancel`      | Cancel running sequence         | —                               | `{ ok }`                  |
| GET    | `/api/status`                | Health check + drone state     | —                               | `{ connected, flying, battery }` |

### 5.2 WebSocket Endpoints

**`WS /api/ws/telemetry`**

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

Server pushes command log events:

```json
{
  "type": "command_log",
  "data": {
    "command": "move_forward",
    "params": { "distance_cm": 100 },
    "result": "ok",
    "timestamp": "2026-03-17T10:30:01.456Z"
  }
}
```

Server pushes sequence progress:

```json
{
  "type": "sequence_progress",
  "data": {
    "sequence_id": "square_patrol",
    "current_step": 3,
    "total_steps": 8,
    "step_description": "Rotate clockwise 90°",
    "status": "running"
  }
}
```

---

## 6. Key Design Decisions

### 6.1 Command Serialization

The Tello SDK processes one command at a time and blocks until acknowledgment. The backend uses an `asyncio.Lock` in `DroneManager` to ensure commands are never sent concurrently, even if multiple WebSocket clients or rapid button clicks generate overlapping requests.

```python
class DroneManager:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._tello: Tello | None = None

    async def execute(self, fn: Callable, *args) -> Any:
        async with self._lock:
            return await asyncio.to_thread(fn, *args)
```

### 6.2 Video Streaming — MJPEG over HTTP

Rather than piping frames through WebSocket (high overhead for binary data), the backend serves an MJPEG stream via a standard HTTP endpoint using `multipart/x-mixed-replace`. The frontend renders it in a simple `<img>` tag. This approach is simple, low-latency, and doesn't require WebRTC complexity.

```python
@router.get("/stream")
async def video_stream():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

async def generate_frames():
    while drone_manager.is_streaming:
        frame = drone_manager.get_frame()
        _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + jpeg.tobytes()
            + b"\r\n"
        )
        await asyncio.sleep(1 / 30)  # 30 FPS cap
```

### 6.3 Telemetry via WebSocket

Telemetry is pushed from backend → frontend (not polled) to minimize overhead. A background task reads `djitellopy`'s state properties at 4 Hz and broadcasts to all connected WebSocket clients.

### 6.4 Docker Networking

The Tello drone creates its own Wi-Fi AP at `192.168.10.1`. The backend container must be able to send/receive UDP on ports 8889, 8890, and 11111. On Linux, `network_mode: host` is the simplest solution. For macOS/Windows, explicit UDP port mapping is required since Docker Desktop runs containers in a Linux VM.

---

## 7. Docker Compose Configuration

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    container_name: tello-backend
    network_mode: host          # Required for UDP to 192.168.10.1
    environment:
      - TELLO_HOST=192.168.10.1
      - API_PORT=8000
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: tello-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 7.1 Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7.2 Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 7.3 Nginx Config (API Proxy)

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;    # Keep WS alive
    }
}
```

---

## 8. Data Flow Diagrams

### 8.1 Command Execution Flow

```
User clicks "Move Forward 100cm"
        │
        ▼
  React App ──POST /api/control/move──► FastAPI Router
        │                                    │
        │                          DroneManager.execute()
        │                          (acquires asyncio.Lock)
        │                                    │
        │                          tello.move_forward(100)
        │                          (blocks until drone ACK)
        │                                    │
        │                          ◄── UDP response ──── Tello
        │                                    │
        │                          Releases lock
        │                          Emits command_log via WS
        │                                    │
        ◄────── { ok: true } ───────────────┘
        │
  Update UI + append to CommandLog
```

### 8.2 Telemetry Push Flow

```
  Background Task (4 Hz loop)
        │
        ├─► tello.get_battery()
        ├─► tello.get_height()
        ├─► tello.get_flight_time()
        ├─► tello.get_pitch() / roll / yaw
        ├─► tello.get_speed_x() / y / z
        │
        ▼
  Assemble TelemetryFrame
        │
        ▼
  Broadcast to all WS clients ──► React TelemetryPanel updates
```

### 8.3 Video Streaming Flow

```
  Tello Drone ──UDP 11111──► djitellopy BackgroundFrameRead
                                       │
                                  frame (numpy array)
                                       │
                                  cv2.imencode('.jpg')
                                       │
                              MJPEG StreamingResponse
                                       │
                         GET /api/video/stream
                                       │
                              <img src="..."> in React
```

---

## 9. Error Handling Strategy

| Scenario                     | Backend Behavior                                    | Frontend Behavior                    |
| ---------------------------- | --------------------------------------------------- | ------------------------------------ |
| Tello not reachable          | `connect()` raises `TelloException` → 503 response  | Shows error toast, stays Disconnected |
| Command fails (e.g. flip at low battery) | `execute()` catches exception → returns `{ ok: false, error }` | Shows warning toast, logs in CommandLog |
| Connection lost mid-flight   | Telemetry loop detects timeout → auto-land attempt   | Status badge → "Error", reconnect prompt |
| WebSocket disconnect         | Client auto-reconnects with exponential backoff       | Brief "Reconnecting…" indicator      |
| Sequence step fails          | SequenceRunner catches error → lands drone → emits `sequence_error` | Shows failure at specific step       |

---

## 10. Security Considerations

This application runs on a **local, isolated network** (Tello Wi-Fi has no internet). The primary concerns are:

- **No authentication in v1** — acceptable since only the operator's machine is on the Tello network.
- **CORS** — Backend allows `http://localhost:3000` only.
- **Emergency stop** — The `/api/control/emergency` endpoint has no rate-limiting and requires no special authorization; it must always work instantly.
- **Input validation** — All Pydantic models enforce range constraints (e.g., distance 20–500 cm, angle 1–360°, RC values -100 to 100).

---

## 11. Testing Strategy

| Layer       | Approach                                                   | Tools                |
| ----------- | ---------------------------------------------------------- | -------------------- |
| Unit        | Test DroneManager with a mock Tello class                  | pytest, unittest.mock |
| Integration | Test API endpoints with TestClient + mock DroneManager     | pytest, httpx        |
| Frontend    | Component rendering + interaction tests                    | Vitest, React Testing Library |
| E2E (manual)| Full flow with real Tello drone                           | Manual checklist     |

The `djitellopy` library can be mocked by replacing `Tello()` with a fake class that returns predetermined telemetry values and logs commands, enabling CI without a physical drone.

---

## 12. Future Considerations (Out of Scope for v1)

- **WebRTC video** — lower latency alternative to MJPEG for higher-quality streaming.
- **Gamepad support** — map physical game controllers to RC control.
- **Flight recording & replay** — log all commands with timestamps for playback.
- **3D visualization** — render the drone's position/attitude in a Three.js scene.
- **Multi-drone (Swarm)** — leverage `djitellopy.Swarm` for Tello EDU fleets.
- **Autonomous waypoints** — define GPS-less waypoint sequences using relative coordinates.
