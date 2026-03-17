# UX/UI Interface Requirements Document

## Tello Web Controller — "Focused Pilot" Interface

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **Version**      | 1.0                            |
| **Status**       | Draft                          |
| **Author**       | Eyp (ThakornS)                 |
| **Date**         | 2026-03-17                     |
| **Design Style** | Tesla / SpaceX Mission Control  |

---

## 1. Design Philosophy

### 1.1 Visual Identity — "Ground Control"

The interface draws direct inspiration from Tesla's automotive UI and SpaceX's mission control displays: dark environments where precision data glows against black, typography is clean and engineered, and every pixel serves a purpose.

**Core Principles:**

- **Data density without clutter** — Every element earns its screen space. No decorative chrome, no borders for borders' sake.
- **Video-first immersion** — The drone's camera feed IS the background. UI floats on top as translucent HUD panels, like a heads-up display in a cockpit.
- **Monochromatic with accent signals** — The UI is almost entirely grayscale/white-on-black. Color is reserved exclusively for status and alerts (green = ok, amber = caution, red = danger).
- **Functional animation only** — Transitions serve orientation (panel appearing) or feedback (button press). No decorative motion.
- **Always-accessible safety** — Emergency Stop is never occluded, never more than one click away, and visually distinct from everything else.

### 1.2 Inspiration References

| Source                       | What to borrow                                            |
| ---------------------------- | --------------------------------------------------------- |
| Tesla Model S/3 touchscreen  | Dark canvas, thin sans-serif type, minimal dividers, floating cards |
| SpaceX Dragon UI             | Monochrome HUD aesthetic, telemetry readout typography, status indicator dots |
| SpaceX launch webcast        | Data-dense telemetry bars, countdown styling, mission status badges |
| Fighter jet HUD              | Semi-transparent overlays on camera feed, pitch/roll indicators |

---

## 2. Design System

### 2.1 Color Palette

```
BACKGROUND
  --color-void:           #000000    Base black (behind video)
  --color-surface:        rgba(0, 0, 0, 0.65)    Floating panel background
  --color-surface-hover:  rgba(255, 255, 255, 0.08)    Hover state on panels

TEXT
  --color-text-primary:   #FFFFFF    Primary labels and values
  --color-text-secondary: #8B8F96    Secondary labels, descriptions
  --color-text-dim:       #4A4D53    Disabled / inactive text

STATUS (color used ONLY for status — never decoration)
  --color-ok:             #00D26A    Connected, success, healthy battery
  --color-caution:        #F5A623    Warning, battery 20-30%, slow response
  --color-danger:         #FF3B30    Error, emergency, battery < 20%, disconnect
  --color-info:           #3A8BFF    Informational highlights, active selection
  --color-active:         #FFFFFF    Active button border / text

ACCENTS
  --color-border:         rgba(255, 255, 255, 0.10)    Subtle panel borders
  --color-glow:           rgba(255, 255, 255, 0.04)    Backdrop blur glow
```

### 2.2 Typography

Following Tesla's use of clean, geometric sans-serif type:

```
FONT FAMILY
  Primary:    "Inter", "SF Pro Display", -apple-system, sans-serif
  Monospace:  "JetBrains Mono", "SF Mono", monospace    (telemetry values, logs)

SCALE (modular, 1.2 ratio)
  --text-xs:     11px / 1.4    Command log entries, timestamps
  --text-sm:     13px / 1.4    Secondary labels, descriptions
  --text-base:   15px / 1.5    Body text, button labels
  --text-lg:     18px / 1.3    Panel headings
  --text-xl:     24px / 1.2    Telemetry values (battery %, altitude)
  --text-2xl:    32px / 1.1    Hero telemetry (featured metric)
  --text-3xl:    48px / 1.0    Full-screen status messages ("CONNECTED")

WEIGHT
  Labels:        400 (regular)
  Values:        500 (medium)
  Headings:      600 (semibold)
  Emergency:     700 (bold)

CASING
  Labels & headings:     ALL CAPS, letter-spacing: 0.08em
  Values & body:         Normal case
  Button labels:         ALL CAPS, letter-spacing: 0.05em
```

### 2.3 Spacing & Layout

```
BASE UNIT:         4px
PANEL PADDING:     16px (4 units)
PANEL GAP:         12px (3 units)
PANEL RADIUS:      12px
BUTTON RADIUS:     8px
BUTTON PADDING:    12px 20px

BACKDROP FILTER:   blur(20px) saturate(1.2)

PANEL BORDER:      1px solid rgba(255, 255, 255, 0.08)
PANEL SHADOW:      0 4px 24px rgba(0, 0, 0, 0.4)
```

### 2.4 Iconography

Use **Lucide React** icons. Stroke width 1.5px, size 18px default. Icons are `--color-text-secondary` by default, `--color-text-primary` on hover/active. No filled icons — outline-only matches the SpaceX minimal aesthetic.

---

## 3. Layout Architecture

### 3.1 Screen Composition

The entire viewport is the canvas. Video fills it edge-to-edge. UI panels float as glassmorphic overlays anchored to screen edges.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─[A]──────┐                                   ┌──[B]──────────┐  │
│  │TELEMETRY │                                   │ STATUS BAR    │  │
│  │          │                                   │               │  │
│  │          │     ██████████████████████████     └───────────────┘  │
│  │          │     ██                      ██                        │
│  │          │     ██   FULL VIEWPORT      ██                        │
│  │          │     ██   VIDEO FEED         ██                        │
│  │          │     ██   (layer 0)          ██                        │
│  │          │     ██                      ██     ┌──[D]──────────┐  │
│  └──────────┘     ██                      ██     │ COMMAND LOG   │  │
│                   ██████████████████████████     │ (collapsible) │  │
│                                                  │               │  │
│  ┌─[C]──────────────────┐                        └───────────────┘  │
│  │ FLIGHT CONTROLS      │                                           │
│  │                      │   ┌──[E]──────┐    ┌──[F]──────────────┐  │
│  │                      │   │ ACTIONS   │    │  ⛔ EMERGENCY     │  │
│  └──────────────────────┘   └───────────┘    └───────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Z-INDEX LAYERS:
  0  Video feed (full viewport <img> or <video>)
  1  Gradient vignette overlay (aids panel readability)
  2  Floating HUD panels [A–F]
  3  Emergency Stop button (always on top)
  4  Modal overlays (sequence picker, settings)
```

### 3.2 Panel Inventory

| ID | Panel              | Position              | Size         | Behavior       |
| -- | ------------------ | --------------------- | ------------ | -------------- |
| A  | Telemetry          | Top-left              | 200px wide   | Always visible |
| B  | Status Bar         | Top-right             | Auto width   | Always visible |
| C  | Flight Controls    | Bottom-left           | 320px wide   | Always visible |
| D  | Command Log        | Right, mid-bottom     | 260px wide   | Collapsible    |
| E  | Action Buttons     | Bottom-center         | Auto width   | Always visible |
| F  | Emergency Stop     | Bottom-right (fixed)  | 180px wide   | Always visible, elevated z |

---

## 4. Panel Specifications

### 4.1 Panel [A] — Telemetry

Vertical stack of key metrics. SpaceX-style: uppercase dim label, large bright value, thin separator between groups.

```
┌──────────────────────┐
│  TELEMETRY           │  ← Panel heading, --text-sm, --color-text-secondary
│                      │
│  BATTERY             │  ← Label: --text-xs, caps, --color-text-secondary
│  72%  ██████░░░      │  ← Value: --text-xl, --color-text-primary
│                      │     Bar: gradient green→amber→red based on %
│  ─────────────────── │  ← 1px line, --color-border
│                      │
│  ALTITUDE            │
│  120 cm              │
│                      │
│  ─────────────────── │
│                      │
│  SPEED               │
│  12 cm/s             │
│                      │
│  ─────────────────── │
│                      │
│  FLIGHT TIME         │
│  0:42                │
│                      │
│  ─────────────────── │
│                      │
│  ATTITUDE            │  ← Compact row layout for IMU
│  P -2°  R 1°  Y 180°│
│                      │
│  ─────────────────── │
│                      │
│  TEMP                │
│  62°C                │
└──────────────────────┘
```

**Battery bar behavior:**
- `> 50%`: Green (`--color-ok`)
- `20–50%`: Amber (`--color-caution`)
- `< 20%`: Red (`--color-danger`), pulsing glow animation

**Update frequency:** All values refresh at 4 Hz via WebSocket. Values animate (CSS `transition: 200ms`) when changing to avoid jitter.

### 4.2 Panel [B] — Status Bar

Horizontal, compact. Shows connection state and quick actions.

```
┌───────────────────────────────────────┐
│  ● CONNECTED    TELLO-A8F2   [📷] [⚙]│
└───────────────────────────────────────┘
```

| Element           | States / Behavior                                                |
| ----------------- | ---------------------------------------------------------------- |
| Status dot `●`    | Green = connected, Red = disconnected, Amber pulsing = connecting |
| Status label      | `CONNECTED` / `DISCONNECTED` / `CONNECTING…` — uppercase, monospace |
| Drone ID          | SSID suffix, `--color-text-secondary`                             |
| Snapshot `[📷]`   | Captures current frame, downloads as `tello_YYYYMMDD_HHmmss.jpg` |
| Settings `[⚙]`    | Opens settings modal (distance default, video quality, etc.)      |

**Connection flow:** When disconnected, the Status Bar expands to show a `[CONNECT]` button center-screen with a subtle pulsing ring animation (SpaceX countdown style).

### 4.3 Panel [C] — Flight Controls

The primary pilot input. D-pad layout for directional movement, rotation row, flip row.

```
┌────────────────────────────────────┐
│  CONTROLS                          │
│                                    │
│           [  ↑  ]                  │    Movement D-pad
│        [←] [  ■  ] [→]            │    Center ■ = stop (sends RC 0,0,0,0)
│           [  ↓  ]                  │
│                                    │
│   [  ▲ UP  ]    [  ▼ DOWN  ]      │    Vertical movement
│                                    │
│   [  ↻ CW  ]    [  ↺ CCW  ]      │    Rotation
│                                    │
│   FLIPS                           │
│   [ ⤴ F ][ ⤵ B ][ ⤶ L ][ ⤷ R ] │    Flip buttons
│                                    │
│   DISTANCE ──────●────── 100 cm   │    Slider: 20–500, step 10
│   ANGLE    ────●──────── 90°      │    Slider: 1–360, step 1
│                                    │
└────────────────────────────────────┘
```

**Button styling (Tesla-inspired):**

```css
/* Default state */
.control-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  transition: all 150ms ease;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.05em;
}

/* Hover */
.control-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

/* Active (pressed) — brief flash */
.control-btn:active {
  background: rgba(255, 255, 255, 0.20);
  transform: scale(0.97);
}

/* Disabled (drone not connected / not airborne) */
.control-btn:disabled {
  opacity: 0.25;
  pointer-events: none;
}
```

**Slider styling:** Thin track (2px, `--color-border`), circular thumb (14px, white filled), value displayed inline right-aligned in monospace.

**Keyboard bindings (displayed as subtle key hints on hover):**

| Key        | Action             |
| ---------- | ------------------ |
| `W`        | Move forward       |
| `S`        | Move back          |
| `A`        | Move left          |
| `D`        | Move right         |
| `Space`    | Up                 |
| `Shift`    | Down               |
| `Q`        | Rotate CCW         |
| `E`        | Rotate CW          |
| `T`        | Takeoff            |
| `L`        | Land               |
| `Esc`      | Emergency stop     |

### 4.4 Panel [D] — Command Log

Scrollable, collapsible. Shows command history with SpaceX telemetry readout styling.

```
┌──────────────────────────┐
│  COMMAND LOG       [ ─ ] │  ← Collapse toggle
│                          │
│  10:01:03  TAKEOFF    ✓  │  ← Monospace, --text-xs
│  10:01:05  UP 80CM    ✓  │     ✓ = green, ✗ = red
│  10:01:08  FWD 100CM  ✓  │
│  10:01:10  ROT CW 90  ✓  │
│  10:01:12  FLIP FWD   ✗  │  ← Red text + error tooltip
│  10:01:14  LAND       ✓  │
│  │                       │  ← Blinking cursor = awaiting
└──────────────────────────┘
```

**Entry formatting:**
- Timestamp: `--color-text-dim`, monospace
- Command: `--color-text-primary`, uppercase, monospace
- Result `✓`: `--color-ok`
- Result `✗`: `--color-danger`, shows error on hover tooltip
- New entries slide in from bottom with 200ms ease-out
- Auto-scrolls to bottom; user scroll-up pauses auto-scroll

**Collapsed state:** Panel shrinks to a single line showing last command only.

### 4.5 Panel [E] — Action Buttons

Primary flight actions, center-bottom. Large, prominent.

```
  [ ▶  TAKEOFF ]     [ ▼  LAND ]     [ ▶ SEQUENCES ]
```

| Button       | Style                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| TAKEOFF      | Border: `--color-ok`, text: `--color-ok`. On hover: filled green bg.       |
| LAND         | Border: `--color-info`, text: `--color-info`. On hover: filled blue bg.    |
| SEQUENCES    | Border: `--color-text-secondary`. Opens sequence picker modal.             |

**State transitions:**
- Drone on ground: TAKEOFF enabled, LAND disabled
- Drone airborne: TAKEOFF disabled, LAND enabled
- Sequence running: Both disabled, replaced with `[ ■ ABORT SEQUENCE ]` in amber

### 4.6 Panel [F] — Emergency Stop

**Always visible. Always functional. Visually alarming by design.**

```
┌──────────────────────────┐
│                          │
│     ⛔ EMERGENCY STOP    │
│                          │
└──────────────────────────┘
```

**Styling:**

```css
.emergency-btn {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid #FF3B30;
  color: #FF3B30;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 12px;
  padding: 16px 28px;
  animation: pulse-border 2s ease-in-out infinite;
}

.emergency-btn:hover {
  background: rgba(255, 59, 48, 0.30);
  box-shadow: 0 0 20px rgba(255, 59, 48, 0.25);
}

.emergency-btn:active {
  background: #FF3B30;
  color: #FFFFFF;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgba(255, 59, 48, 0.6); }
  50%      { border-color: rgba(255, 59, 48, 1.0); }
}
```

**Behavior:**
- Sends `emergency()` immediately — bypasses command queue.
- No confirmation dialog. Immediate execution.
- Works regardless of connection state (attempts even if status shows disconnected).
- Keyboard shortcut: `Esc` (no modifier required).

---

## 5. Overlay & Modal Specifications

### 5.1 Vignette Overlay

A CSS gradient overlay between the video layer and HUD panels to ensure text readability regardless of video content brightness.

```css
.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    /* Top edge darken (status bar area) */
    linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 15%),
    /* Bottom edge darken (controls area) */
    linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 25%),
    /* Left edge darken (telemetry area) */
    linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 20%),
    /* Subtle overall darken */
    radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%);
  z-index: 1;
}
```

### 5.2 Disconnected State — Connection Screen

When not connected, the video area shows a dark canvas with a centered connection prompt.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                          ─── ✦ ───                                  │
│                                                                     │
│                    TELLO WEB CONTROLLER                             │
│                                                                     │
│                   ○ ─ ─ ─ ─ ─ ─ ─ ○                               │
│                   (pulsing ring animation)                          │
│                                                                     │
│                      [ ▶ CONNECT ]                                  │
│                                                                     │
│               Ensure you are connected to                          │
│               the Tello Wi-Fi network                              │
│                                                                     │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Pulsing ring:** SVG circle with `stroke-dasharray` animation, SpaceX docking-style. 3-second loop, `--color-text-dim` → `--color-text-secondary`.

**After clicking CONNECT:**
- Button text changes to `CONNECTING…` with a rotating spinner
- Ring animation speeds up
- On success: ring flashes green, panels fade in over 500ms, video feed begins
- On failure: ring flashes red, error message appears below button

### 5.3 Sequence Picker Modal

Triggered by `[ ▶ SEQUENCES ]` button. Centered modal with backdrop blur.

```
┌──────────────────────────────────────────┐
│                                          │
│  SELECT SEQUENCE                   [ ✕ ] │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ▶  SQUARE PATROL                 │  │
│  │     4× forward 60cm + rotate 90°  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ▶  FLIP COMBO                    │  │
│  │     Forward, back, left, right    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ▶  360 SPIN                      │  │
│  │     Full clockwise rotation       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ▶  GRAND FINALE                  │  │
│  │     Rise, flip, spin, bow, land   │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

**Sequence card hover:** left border accent `--color-info`, slight translate-x shift. On click: modal closes, sequence starts, Action Bar shows progress:

```
  [ ■ ABORT ]   GRAND FINALE  ━━━━━━━━━━░░░░  Step 5/12: FLIP FORWARD
```

Progress bar uses thin line style, `--color-info` filled, `--color-border` track.

---

## 6. Video Feed Specifications

### 6.1 Rendering

```html
<img
  src="http://localhost:8000/api/video/stream"
  class="video-feed"
  alt="Tello live feed"
/>
```

```css
.video-feed {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;     /* Fill viewport, crop if aspect differs */
  z-index: 0;
}
```

### 6.2 No-Video States

| State               | Display                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Not connected        | Solid `#000000` with connection prompt (§5.2)                      |
| Connected, no stream | Dark gray `#0A0A0A` with subtle grid pattern + "VIDEO OFF" label   |
| Stream loading       | Black with centered pulsing dot animation                          |
| Stream error         | Black with red-tinted border glow + "VIDEO FEED LOST" label       |

---

## 7. Responsive Behavior

The primary target is **desktop browsers (1280×720 and above)**. The layout degrades gracefully:

| Breakpoint    | Behavior                                                       |
| ------------- | -------------------------------------------------------------- |
| ≥ 1440px      | Full layout as designed, panels have generous spacing           |
| 1280–1439px   | Panels slightly narrower, font scale stays the same            |
| 1024–1279px   | Command Log auto-collapses, Telemetry panel shows 4 key metrics only |
| < 1024px      | Tablet/mobile: Stacked layout, video top half, controls bottom half. Panels opaque (no glassmorphism, readability on small screens). Not a priority for v1. |

---

## 8. Animation & Motion Specs

All motion follows **ease-out** curves. Duration is short — the UI should feel instant and mechanical, not smooth and playful.

| Element                  | Trigger        | Animation                             | Duration |
| ------------------------ | -------------- | ------------------------------------- | -------- |
| Panel appear (connect)   | Connection OK  | `opacity: 0→1`, `translateY: 8px→0`   | 400ms    |
| Button press feedback    | Click / keydown| `scale(0.97)`, bg brightness boost     | 100ms    |
| Telemetry value change   | WS update      | CSS `transition` on number             | 200ms    |
| Command log entry        | New command     | `translateY: 12px→0`, `opacity: 0→1`  | 200ms    |
| Emergency button pulse   | Idle           | Border opacity oscillation             | 2000ms   |
| Connection ring          | Disconnected   | SVG stroke-dashoffset rotation         | 3000ms   |
| Sequence progress bar    | Step complete  | Width transition                       | 300ms    |
| Battery low pulse        | `< 20%`       | Box-shadow glow red oscillation        | 1500ms   |
| Panel collapse           | Toggle click   | `height` auto→0 with `overflow:hidden` | 250ms    |

---

## 9. Accessibility

Even with the dark HUD aesthetic, accessibility is non-negotiable:

- All interactive elements are keyboard-navigable (`tabindex`, focus rings — subtle white outline on focus).
- ARIA labels on all icon-only buttons (`aria-label="Move forward"`).
- Contrast ratios: Primary text on panel background ≥ 7:1 (white on 65% black overlay). Status colors tested against dark backgrounds.
- Screen reader announcements for connection state changes and command results via `aria-live="polite"` regions.
- Emergency Stop is the first element in tab order (`tabindex="1"`).
- Reduced motion: Respect `prefers-reduced-motion` — disable pulse animations, use instant transitions.

---

## 10. Component Summary & Priority

| Component           | Priority | Milestone |
| ------------------- | -------- | --------- |
| Video Feed (full viewport) | P0  | M1       |
| Connection Screen    | P0      | M1        |
| Status Bar           | P0      | M1        |
| Telemetry Panel      | P0      | M1        |
| Flight Controls (D-pad + vertical) | P0 | M1 |
| Action Buttons (Takeoff/Land) | P0 | M1     |
| Emergency Stop       | P0      | M1        |
| Vignette Overlay     | P0      | M1        |
| Rotation Controls    | P0      | M1        |
| Command Log          | P1      | M2        |
| Flip Controls        | P1      | M2        |
| Keyboard Shortcuts   | P1      | M2        |
| Snapshot Button      | P1      | M2        |
| Sequence Picker Modal| P1      | M3        |
| Sequence Progress Bar| P1      | M3        |
| Distance/Angle Sliders | P1    | M2        |
| Settings Modal       | P2      | M4        |
| Virtual Joystick     | P2      | M4        |

---

## Appendix A: Panel Positioning (CSS Grid)

```css
.hud-layout {
  position: fixed;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "telemetry  .        status"
    "telemetry  .        cmdlog"
    "controls   actions  emergency";
  padding: 16px;
  gap: 12px;
  pointer-events: none;          /* Let clicks pass to video */
}

.hud-layout > * {
  pointer-events: auto;          /* Re-enable on panels */
}
```

---

## Appendix B: Glassmorphism Panel Mixin

```css
.hud-panel {
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  color: #FFFFFF;
  padding: 16px;
}
```
