import { useDroneStore } from '@/stores/droneStore';

export default function ConnectionScreen() {
  const connectionStatus = useDroneStore((s) => s.connectionStatus);
  const connect = useDroneStore((s) => s.connect);

  const isConnecting = connectionStatus === 'connecting';
  const isError = connectionStatus === 'error';

  const ringStroke = isError ? '#FF3B30' : '#4A4D53';
  const ringClass = isConnecting ? 'animate-[spin-ring_1s_linear_infinite]' : 'animate-spin-ring';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <h1 className="text-hud-3xl font-semibold uppercase tracking-[0.08em] text-white">
        TELLO WEB CONTROLLER
      </h1>

      <svg
        className={`mt-10 h-24 w-24 ${ringClass}`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke={ringStroke}
          strokeWidth="1.5"
          strokeDasharray="251.2"
          fill="none"
        />
      </svg>

      <button
        className="control-btn mt-8 px-8 py-3 text-hud-base"
        disabled={isConnecting}
        onClick={connect}
      >
        {isConnecting ? 'CONNECTING...' : 'CONNECT'}
      </button>

      {isError && (
        <p className="mt-4 text-hud-sm text-danger">
          Connection failed. Check that the drone is powered on and retry.
        </p>
      )}

      <p className="mt-6 text-hud-sm text-hud-secondary">
        Ensure you are connected to the Tello Wi-Fi network
      </p>
    </div>
  );
}
