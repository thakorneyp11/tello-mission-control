import { useCallback } from 'react';
import { Camera, Settings } from 'lucide-react';
import { useDroneStore } from '@/stores/droneStore';
import * as api from '@/lib/api';

const STATUS_DOT_CLASS: Record<string, string> = {
  connected: 'bg-ok',
  connecting: 'bg-caution animate-pulse',
  disconnected: 'bg-hud-dim',
  error: 'bg-danger',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function StatusBar() {
  const connectionStatus = useDroneStore((s) => s.connectionStatus);
  const isFlying = useDroneStore((s) => s.isFlying);

  const canSnapshot = connectionStatus === 'connected' && isFlying;

  const handleSnapshot = useCallback(async () => {
    try {
      const blob = await api.takeSnapshot();
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `tello_${timestamp}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Snapshot failed silently — could surface via toast in the future
    }
  }, []);

  return (
    <div className="hud-panel animate-fade-in-up flex flex-row items-center gap-3">
      {/* Status dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_CLASS[connectionStatus] ?? 'bg-hud-dim'}`}
      />

      {/* Status label */}
      <span className="font-mono uppercase text-hud-sm tracking-[0.08em]">
        {connectionStatus}
      </span>

      {/* Separator */}
      <span className="w-px h-4 bg-white/10" />

      {/* Drone ID */}
      <span className="text-hud-secondary font-mono text-hud-sm">TELLO</span>

      {/* Snapshot button */}
      <button
        type="button"
        className="control-btn p-2"
        disabled={!canSnapshot}
        onClick={handleSnapshot}
        aria-label="Take Snapshot"
      >
        <Camera size={18} strokeWidth={1.5} />
      </button>

      {/* Settings button (placeholder) */}
      <button
        type="button"
        className="control-btn p-2"
        disabled
        aria-label="Settings"
      >
        <Settings size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
