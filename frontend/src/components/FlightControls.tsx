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
    <div className="hud-panel animate-fade-in-up max-w-[320px] space-y-4">
      <h3 className="hud-label">Flight Controls</h3>

      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <button
          className="control-btn w-11 h-11"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('forward', moveDistance), 'MOVE FWD')}
        >
          <ChevronUp size={18} />
        </button>
        <div />

        <button
          className="control-btn w-11 h-11"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('left', moveDistance), 'MOVE LEFT')}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center justify-center">
          <span className="block w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        <button
          className="control-btn w-11 h-11"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('right', moveDistance), 'MOVE RIGHT')}
        >
          <ChevronRight size={18} />
        </button>

        <div />
        <button
          className="control-btn w-11 h-11"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('back', moveDistance), 'MOVE BACK')}
        >
          <ChevronDown size={18} />
        </button>
        <div />
      </div>

      {/* Vertical Controls */}
      <div className="flex gap-1.5">
        <button
          className="control-btn flex-1 px-3 py-2"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('up', moveDistance), 'MOVE UP')}
        >
          <ArrowUp size={18} />
          UP
        </button>
        <button
          className="control-btn flex-1 px-3 py-2"
          disabled={disabled}
          onClick={() => sendCommand(() => api.move('down', moveDistance), 'MOVE DOWN')}
        >
          <ArrowDown size={18} />
          DOWN
        </button>
      </div>

      {/* Rotation Controls */}
      <div className="space-y-1.5">
        <span className="hud-label">Rotation</span>
        <div className="flex gap-1.5">
          <button
            className="control-btn flex-1 px-3 py-2"
            disabled={disabled}
            onClick={() => sendCommand(() => api.rotate('ccw', rotateAngle), 'ROTATE CCW')}
          >
            <RotateCcw size={18} />
            CCW
          </button>
          <button
            className="control-btn flex-1 px-3 py-2"
            disabled={disabled}
            onClick={() => sendCommand(() => api.rotate('cw', rotateAngle), 'ROTATE CW')}
          >
            <RotateCw size={18} />
            CW
          </button>
        </div>
      </div>

      {/* Flip Controls */}
      <div className="space-y-1.5">
        <span className="hud-label">Flips</span>
        <div className="flex gap-1.5">
          {(['forward', 'back', 'left', 'right'] as FlipDirection[]).map((dir) => (
            <button
              key={dir}
              className={`control-btn flex-1 text-hud-xs px-2.5 py-1.5 ${lowBattery ? 'opacity-50' : ''}`}
              disabled={disabled}
              title={lowBattery ? 'Low battery — flips may fail below 50%' : undefined}
              onClick={() =>
                sendCommand(
                  () => api.flip(dir),
                  `FLIP ${dir.toUpperCase()}`,
                )
              }
            >
              {dir[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
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
      <div className="space-y-1">
        <div className="flex items-center justify-between">
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
