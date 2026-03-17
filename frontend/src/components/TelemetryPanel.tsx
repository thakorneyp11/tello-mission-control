import { useDroneStore } from '@/stores/droneStore';
import { formatFlightTime, batteryBarColor } from '@/lib/format';

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

  const nullValue = <span className="text-hud-secondary">---</span>;

  return (
    <div className="hud-panel animate-fade-in-up w-[200px] !p-3 max-h-[calc(50vh-32px)] overflow-y-auto">
      <h2 className="hud-label mb-2">Telemetry</h2>

      <div className="flex flex-col">
        {/* Battery */}
        <div className="py-1.5 border-b border-white/[0.06]">
          <div className="hud-label">Battery</div>
          <div className="hud-value text-hud-lg">
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
        <div className="py-1.5 border-b border-white/[0.06]">
          <div className="hud-label">Altitude</div>
          <div className="hud-value text-hud-lg">
            {height !== null ? `${height} cm` : nullValue}
          </div>
        </div>

        {/* Speed */}
        <div className="py-1.5 border-b border-white/[0.06]">
          <div className="hud-label">Speed</div>
          <div className="hud-value text-hud-lg">
            {speed !== null ? `${speed} cm/s` : nullValue}
          </div>
        </div>

        {/* Flight Time */}
        <div className="py-1.5 border-b border-white/[0.06]">
          <div className="hud-label">Flight Time</div>
          <div className="hud-value text-hud-lg">
            {flightTime !== null ? formatFlightTime(flightTime) : nullValue}
          </div>
        </div>

        {/* Attitude */}
        <div className="py-1.5 border-b border-white/[0.06]">
          <div className="hud-label">Attitude</div>
          <div className="hud-value text-hud-xs font-mono">
            {attitude !== null
              ? `P ${attitude.pitch}\u00B0 R ${attitude.roll}\u00B0 Y ${attitude.yaw}\u00B0`
              : nullValue}
          </div>
        </div>

        {/* Temperature */}
        <div className="py-1.5">
          <div className="hud-label">Temp</div>
          <div className="hud-value text-hud-lg">
            {tempHigh !== null ? `${tempHigh}\u00B0C` : nullValue}
          </div>
        </div>
      </div>
    </div>
  );
}
