import { useDroneStore } from '@/stores/droneStore';

function formatFlightTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function batteryBarColor(level: number): string {
  if (level > 50) return 'bg-ok';
  if (level >= 20) return 'bg-caution';
  return 'bg-danger animate-pulse-glow';
}

export default function TelemetryPanel() {
  const telemetry = useDroneStore((s) => s.telemetry);

  const battery = telemetry?.battery ?? null;
  const height = telemetry?.height ?? null;
  const flightTime = telemetry?.flight_time ?? null;
  const speed = telemetry
    ? Math.round(
        Math.sqrt(
          telemetry.speed.x ** 2 +
            telemetry.speed.y ** 2 +
            telemetry.speed.z ** 2,
        ),
      )
    : null;
  const attitude = telemetry?.attitude ?? null;
  const tempHigh = telemetry?.temperature.high ?? null;

  const nullValue = <span className="text-hud-dim">--</span>;

  return (
    <div className="hud-panel animate-fade-in-up w-[200px]">
      <h2 className="hud-label mb-3">Telemetry</h2>

      <div className="flex flex-col">
        {/* Battery */}
        <div className="py-2 border-b border-white/[0.06]">
          <div className="hud-label">Battery</div>
          <div className="hud-value text-hud-xl">
            {battery !== null ? `${battery}%` : nullValue}
          </div>
          {battery !== null && (
            <div className="mt-1 h-[3px] w-full rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${batteryBarColor(battery)}`}
                style={{ width: `${Math.min(100, Math.max(0, battery))}%` }}
              />
            </div>
          )}
        </div>

        {/* Altitude */}
        <div className="py-2 border-b border-white/[0.06]">
          <div className="hud-label">Altitude</div>
          <div className="hud-value text-hud-xl">
            {height !== null ? `${height} cm` : nullValue}
          </div>
        </div>

        {/* Speed */}
        <div className="py-2 border-b border-white/[0.06]">
          <div className="hud-label">Speed</div>
          <div className="hud-value text-hud-xl">
            {speed !== null ? `${speed} cm/s` : nullValue}
          </div>
        </div>

        {/* Flight Time */}
        <div className="py-2 border-b border-white/[0.06]">
          <div className="hud-label">Flight Time</div>
          <div className="hud-value text-hud-xl">
            {flightTime !== null ? formatFlightTime(flightTime) : nullValue}
          </div>
        </div>

        {/* Attitude */}
        <div className="py-2 border-b border-white/[0.06]">
          <div className="hud-label">Attitude</div>
          <div className="hud-value text-hud-xs font-mono">
            {attitude !== null
              ? `P ${attitude.pitch}\u00B0 R ${attitude.roll}\u00B0 Y ${attitude.yaw}\u00B0`
              : nullValue}
          </div>
        </div>

        {/* Temperature */}
        <div className="py-2">
          <div className="hud-label">Temp</div>
          <div className="hud-value text-hud-xl">
            {tempHigh !== null ? `${tempHigh}\u00B0C` : nullValue}
          </div>
        </div>
      </div>
    </div>
  );
}
