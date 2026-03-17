# Product Requirements Document (PRD)

## Tello Web Controller — DJI Tello Drone Control WebApp

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **Version**      | 1.0                            |
| **Status**       | Draft                          |
| **Author**       | Eyp (ThakornS)                 |
| **Date**         | 2026-03-17                     |
| **Last Updated** | 2026-03-17                     |

---

## 1. Overview

**Tello Web Controller** is a locally-deployed web application that provides a browser-based interface for controlling a DJI Tello drone. A React frontend communicates with a FastAPI backend, which in turn drives the drone through the `djitellopy` Python library. The entire stack runs on the operator's local machine via Docker containers.

### 1.1 Problem Statement

Controlling a DJI Tello drone currently requires writing and running Python scripts directly. This creates a high barrier for non-developer users and makes it difficult to perform ad-hoc flight maneuvers, monitor telemetry, or view the live camera feed without custom code for each session.

### 1.2 Goals

- Provide a polished, intuitive browser UI for real-time drone control.
- Expose live telemetry (battery, altitude, temperature, flight time, IMU) in a dashboard.
- Stream the drone's camera feed to the browser in near real-time.
- Allow users to execute both manual commands and pre-built flight routines (sequences).
- Run entirely on a local network with zero cloud dependency.
- Containerize with Docker for one-command setup.

### 1.3 Non-Goals (v1)

- Multi-drone swarm control.
- Autonomous / AI-based flight (e.g. object tracking, path planning).
- Persistent flight logging or database storage.
- Mobile-native apps (responsive web is acceptable).
- Authentication / multi-user access control.

---

## 2. Target Users

| Persona              | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| **Hobbyist Pilot**   | Wants an easy GUI to fly without writing code.                     |
| **Developer / Maker**| Uses the UI for quick testing; may extend the API.                 |
| **Educator**         | Demonstrates drone programming concepts in a classroom setting.    |

---

## 3. Functional Requirements

### 3.1 Drone Connection Management

| ID     | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-01  | User can connect to the Tello drone with a single button click.                                 | P0       |
| FR-02  | System displays connection status (Disconnected / Connecting / Connected / Error).               | P0       |
| FR-03  | User can disconnect gracefully, which lands the drone if airborne and calls `end()`.             | P0       |
| FR-04  | System auto-reconnects once if the connection drops mid-session.                                 | P2       |

### 3.2 Flight Controls

| ID     | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-10  | Takeoff button triggers `takeoff()`.                                                            | P0       |
| FR-11  | Land button triggers `land()`.                                                                  | P0       |
| FR-12  | Emergency Stop button triggers `emergency()` — kills motors immediately.                        | P0       |
| FR-13  | Directional movement buttons: Forward, Back, Left, Right, Up, Down with configurable distance (20–500 cm). | P0 |
| FR-14  | Rotation controls: Rotate CW / CCW with configurable angle (1–360°).                           | P0       |
| FR-15  | Flip buttons: Forward, Back, Left, Right flips.                                                 | P1       |
| FR-16  | RC-style virtual joystick for continuous `send_rc_control(lr, fb, ud, yaw)` commands.           | P1       |
| FR-17  | Keyboard shortcut support (WASD for movement, arrow keys for rotation, Space for takeoff/land). | P1       |

### 3.3 Telemetry Dashboard

| ID     | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-20  | Display battery percentage with low-battery warning (< 30%).                                    | P0       |
| FR-21  | Display current height (cm).                                                                    | P0       |
| FR-22  | Display flight time (seconds).                                                                  | P0       |
| FR-23  | Display temperature (°C, high/low).                                                             | P1       |
| FR-24  | Display IMU attitude: pitch, roll, yaw.                                                         | P1       |
| FR-25  | Display speed (x, y, z velocity in cm/s).                                                       | P1       |
| FR-26  | Display barometer altitude and TOF distance.                                                    | P2       |
| FR-27  | Telemetry refreshes at 2–5 Hz via WebSocket push.                                               | P0       |

### 3.4 Video Streaming

| ID     | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-30  | User can start/stop the video stream from the drone camera.                                     | P0       |
| FR-31  | Live video renders in the browser at ≥ 15 FPS with < 500 ms latency.                           | P0       |
| FR-32  | User can capture a snapshot (still image) and download it as JPEG/PNG.                          | P1       |

### 3.5 Flight Sequences (Pre-built Routines)

| ID     | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-40  | System ships with built-in sequences: "Square Patrol", "Flip Combo", "360 Spin", "Grand Finale". | P1     |
| FR-41  | User can select and execute a sequence with one click.                                          | P1       |
| FR-42  | Sequence execution displays a real-time step log (which command is running).                    | P1       |
| FR-43  | User can cancel a running sequence, which lands the drone safely.                               | P1       |
| FR-44  | User can create custom sequences by composing commands in a simple JSON/form builder.           | P2       |

### 3.6 Command Log

| ID     | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-50  | All commands sent to the drone are logged with timestamp, command, and result (ok/error).       | P0       |
| FR-51  | Command log is visible in a collapsible panel in the UI.                                        | P1       |

---

## 4. Non-Functional Requirements

| ID     | Requirement                                                                 | Target               |
| ------ | --------------------------------------------------------------------------- | -------------------- |
| NFR-01 | Command round-trip latency (UI click → drone acknowledgment)                | < 300 ms             |
| NFR-02 | Video stream latency                                                        | < 500 ms             |
| NFR-03 | Application startup time (`docker compose up` to UI ready)                  | < 30 seconds         |
| NFR-04 | Browser support                                                             | Chrome, Firefox, Edge (latest 2 versions) |
| NFR-05 | The backend must be a single-threaded drone controller (one command at a time) to comply with Tello SDK constraints. | Mandatory |
| NFR-06 | Graceful error handling — all drone errors surfaced to the UI, never silent failures. | Mandatory |

---

## 5. System Constraints & Assumptions

- The host machine must be connected to the Tello's Wi-Fi network (`TELLO-XXXXXX`).
- Since the host is on the Tello's Wi-Fi (no internet), the Docker image must be pre-built or built while on a different network.
- The Tello drone communicates over UDP: commands on port 8889, state on port 8890, video on port 11111.
- Only one active connection to the Tello is supported at a time.
- The backend Docker container requires `network_mode: host` (Linux) or equivalent UDP port mapping to reach the drone on `192.168.10.1`.

---

## 6. User Flows

### 6.1 Basic Flight Session

```
1. User opens browser → http://localhost:3000
2. Dashboard shows "Disconnected"
3. User clicks "Connect" → status transitions to "Connected", telemetry populates
4. User clicks "Takeoff" → drone takes off, height telemetry updates
5. User uses directional controls or joystick to fly
6. User clicks "Land" → drone lands
7. User clicks "Disconnect" → session ends cleanly
```

### 6.2 Running a Pre-built Sequence

```
1. User connects and verifies battery ≥ 30%
2. User navigates to "Sequences" tab
3. User selects "Square Patrol" and clicks "Run"
4. Step log shows each command executing in real-time
5. On completion (or cancel), drone lands
```

---

## 7. UI Wireframe Concepts

The UI is organized into a single-page layout with the following regions:

```
┌──────────────────────────────────────────────────────────┐
│  Header:  Tello Web Controller     [Connect] [Disconnect]│
├───────────────────────────┬──────────────────────────────┤
│                           │  Telemetry Panel             │
│   Video Feed              │  ┌─────────────────────────┐ │
│   (or placeholder)        │  │ Battery: 85%  ██████░░  │ │
│                           │  │ Height:  120 cm         │ │
│                           │  │ Flight:  42 s           │ │
│                           │  │ Temp:    62°C           │ │
│                           │  │ Pitch/Roll/Yaw          │ │
│                           │  └─────────────────────────┘ │
├───────────────────────────┤──────────────────────────────┤
│  Flight Controls          │  Sequences / Command Log     │
│  ┌─────────────────────┐  │  ┌──────────────────────┐   │
│  │  [↑]  [Takeoff]     │  │  │ ▶ Square Patrol      │   │
│  │[←][■][→] [Land]     │  │  │ ▶ Flip Combo         │   │
│  │  [↓]  [Emergency]   │  │  │ ▶ Grand Finale       │   │
│  │                     │  │  │                      │   │
│  │ Flips: [F][B][L][R] │  │  │ --- Command Log ---  │   │
│  │ Rotate: [↻ CW][↺CCW]│  │  │ 12:01:03 takeoff  ok│   │
│  │ Dist: [___] cm      │  │  │ 12:01:05 up(80)   ok│   │
│  └─────────────────────┘  │  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Tech Stack Summary

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | React (Vite), TailwindCSS                   |
| Backend    | Python 3.11+, FastAPI, `djitellopy`         |
| Comm       | REST (commands) + WebSocket (telemetry, video) |
| Deployment | Docker Compose (2 services: `frontend`, `backend`) |

---

## 9. Milestones

| Phase | Scope                                                 | Target    |
| ----- | ----------------------------------------------------- | --------- |
| **M1** | Connection, basic controls (takeoff/land/move), telemetry dashboard, Docker setup | Week 1–2 |
| **M2** | Video streaming, keyboard shortcuts, flip controls     | Week 3    |
| **M3** | Flight sequences, command log, virtual joystick        | Week 4    |
| **M4** | Polish, error handling, custom sequences builder       | Week 5    |

---

## 10. Risks & Mitigations

| Risk                                           | Impact | Mitigation                                                   |
| ---------------------------------------------- | ------ | ------------------------------------------------------------ |
| Docker container can't reach Tello UDP ports    | High   | Use `network_mode: host` on Linux; document macOS/Windows workarounds. |
| Video latency too high over WebSocket           | Medium | Use MJPEG streaming or WebRTC as alternative transport.       |
| Tello disconnects during sequence execution     | High   | Wrap all commands in try/except; auto-land on connection loss. |
| Concurrent command conflicts (UI spam-clicking) | Medium | Backend command queue — process one command at a time.        |

---

## 11. Open Questions

1. Should we support the Tello EDU's mission pad features in v1?
2. Is WebRTC justified for video, or is MJPEG-over-HTTP simpler and sufficient?
3. Should custom sequences be stored as JSON files on disk or only in-memory per session?

---

## Appendix A: djitellopy API Surface (Key Methods)

**Connection**: `connect()`, `end()`
**Flight**: `takeoff()`, `land()`, `emergency()`
**Movement**: `move_forward(x)`, `move_back(x)`, `move_left(x)`, `move_right(x)`, `move_up(x)`, `move_down(x)` — all in cm
**Rotation**: `rotate_clockwise(deg)`, `rotate_counter_clockwise(deg)`
**Flips**: `flip_forward()`, `flip_back()`, `flip_left()`, `flip_right()`
**RC Control**: `send_rc_control(left_right, forward_backward, up_down, yaw)` — values -100 to 100
**Video**: `streamon()`, `streamoff()`, `get_frame_read()`
**Telemetry**: `get_battery()`, `get_height()`, `get_flight_time()`, `get_temperature()`, `get_pitch()`, `get_roll()`, `get_yaw()`, `get_speed_x()`, `get_speed_y()`, `get_speed_z()`, `get_barometer()`, `get_distance_tof()`
**Advanced**: `go_xyz_speed(x, y, z, speed)`, `curve_xyz_speed(x1, y1, z1, x2, y2, z2, speed)`
