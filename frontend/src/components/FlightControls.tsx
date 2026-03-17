import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RotateCw,
  RotateCcw,
} from 'lucide-react';
import { useDroneStore } from '@/stores/droneStore';
import * as api from '@/lib/api';
import type { FlipDirection } from '@/types/drone';

const FLIP_LABELS: Record<FlipDirection, string> = {
  forward: 'FWD',
  back: 'BACK',
  left: 'LEFT',
  right: 'RIGHT',
};

export default function FlightControls() {
  const {
    isFlying,
    commandPending,
    moveDistance,
    rotateAngle,
    setMoveDistance,
    setRotateAngle,
    sendCommand,
    telemetry,
  } = useDroneStore();

  const disabled = !isFlying || commandPending;
  const lowBattery = (telemetry?.battery ?? 100) <= 50;

  return (
    <div className="hud-panel animate-fade-in-up max-w-[320px] !p-3">
      <h3 className="hud-label mb-2">Flight Controls</h3>

      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-2 justify-items-center">
        <div />
        <button
          className="control-btn w-10 h-10 relative"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('forward', moveDistance), 'MOVE FWD')}
          aria-label="Move forward"
        >
          <ChevronUp size={20} />
          <span className="absolute bottom-0.5 right-1 text-[9px] text-white/30">W</span>
        </button>
        <div />

        <button
          className="control-btn w-10 h-10 relative"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('left', moveDistance), 'MOVE LEFT')}
          aria-label="Move left"
        >
          <ChevronLeft size={20} />
          <span className="absolute bottom-0.5 right-1 text-[9px] text-white/30">A</span>
        </button>
        <div className="flex items-center justify-center">
          <span className="block w-2 h-2 rounded-full bg-white/30" />
        </div>
        <button
          className="control-btn w-10 h-10 relative"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('right', moveDistance), 'MOVE RIGHT')}
          aria-label="Move right"
        >
          <ChevronRight size={20} />
          <span className="absolute bottom-0.5 right-1 text-[9px] text-white/30">D</span>
        </button>

        <div />
        <button
          className="control-btn w-10 h-10 relative"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('back', moveDistance), 'MOVE BACK')}
          aria-label="Move back"
        >
          <ChevronDown size={20} />
          <span className="absolute bottom-0.5 right-1 text-[9px] text-white/30">S</span>
        </button>
        <div />
      </div>

      {/* Vertical Controls */}
      <div className="flex gap-2 mt-3">
        <button
          className="control-btn flex-1 h-10 relative"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('up', moveDistance), 'MOVE UP')}
          aria-label="Move up"
        >
          <ArrowUp size={18} />
          UP
          <span className="absolute bottom-0.5 right-1.5 text-[9px] text-white/30 normal-case">Space</span>
        </button>
        <button
          className="control-btn flex-1 h-10 relative"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('down', moveDistance), 'MOVE DOWN')}
          aria-label="Move down"
        >
          <ArrowDown size={18} />
          DOWN
          <span className="absolute bottom-0.5 right-1.5 text-[9px] text-white/30 normal-case">Shift</span>
        </button>
      </div>

      {/* Rotation Controls */}
      <div className="mt-3">
        <span className="hud-label block mb-1.5">Rotation</span>
        <div className="flex gap-2">
          <button
            className="control-btn flex-1 h-10 relative"
            disabled={disabled}
            onClick={() => sendCommand(() => api.rotate('ccw', rotateAngle), 'ROTATE CCW')}
            aria-label="Rotate counter-clockwise"
          >
            <RotateCcw size={18} />
            CCW
            <span className="absolute bottom-0.5 right-1.5 text-[9px] text-white/30">Q</span>
          </button>
          <button
            className="control-btn flex-1 h-10 relative"
            disabled={disabled}
            onClick={() => sendCommand(() => api.rotate('cw', rotateAngle), 'ROTATE CW')}
            aria-label="Rotate clockwise"
          >
            <RotateCw size={18} />
            CW
            <span className="absolute bottom-0.5 right-1.5 text-[9px] text-white/30">E</span>
          </button>
        </div>
      </div>

      {/* Flip Controls */}
      <div className="mt-3">
        <span className="hud-label block mb-1.5">Flips</span>
        <div className="flex gap-1.5">
          {(['forward', 'back', 'left', 'right'] as FlipDirection[]).map((dir) => (
            <button
              key={dir}
              className={`control-btn flex-1 text-hud-xs px-1.5 py-2 ${lowBattery ? 'opacity-50' : ''}`}
              disabled={disabled}
              title={lowBattery ? 'Low battery — flips may fail below 50%' : `Flip ${dir}`}
              onClick={() =>
                sendCommand(
                  () => api.flip(dir),
                  `FLIP ${dir.toUpperCase()}`,
                )
              }
            >
              {FLIP_LABELS[dir]}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="hud-label">Distance</span>
          <span className="font-mono text-hud-xs">{moveDistance} cm</span>
        </div>
        <input
          type="range"
          className="hud-slider"
          min={20}
          max={500}
          step={10}
          value={moveDistance}
          onChange={(e) => setMoveDistance(Number(e.target.value))}
        />
      </div>

      {/* Angle Slider */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="hud-label">Angle</span>
          <span className="font-mono text-hud-xs">{rotateAngle}&deg;</span>
        </div>
        <input
          type="range"
          className="hud-slider"
          min={1}
          max={360}
          step={1}
          value={rotateAngle}
          onChange={(e) => setRotateAngle(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
