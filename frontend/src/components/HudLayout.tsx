import { useState } from 'react';
import TelemetryPanel from '@/components/TelemetryPanel';
import StatusBar from '@/components/StatusBar';
import CommandLog from '@/components/CommandLog';
import FlightControls from '@/components/FlightControls';
import ActionButtons from '@/components/ActionButtons';
import SequenceModal from '@/components/SequenceModal';
import { useDroneStore } from '@/stores/droneStore';
import * as api from '@/lib/api';

export default function HudLayout() {
  const [sequenceModalOpen, setSequenceModalOpen] = useState(false);
  const sendCommand = useDroneStore((s) => s.sendCommand);

  return (
    <>
      <div
        className="fixed inset-0 z-[2] grid pointer-events-none"
        style={{
          padding: 'clamp(8px, 1vw, 16px)',
          gap: 'clamp(4px, 0.5vw, 8px)',
          gridTemplateColumns: 'minmax(180px, 220px) 1fr minmax(200px, 260px)',
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "telemetry  .  status"
            "controls   .  ."
          `,
        }}
      >
        <div className="pointer-events-auto self-start" style={{ gridArea: 'telemetry' }}>
          <TelemetryPanel />
        </div>

        {/* StatusBar + CommandLog stacked together in top-right */}
        <div className="pointer-events-auto self-start justify-self-end flex flex-col gap-2" style={{ gridArea: 'status' }}>
          <StatusBar />
          <CommandLog />
        </div>

        <div className="pointer-events-auto self-end" style={{ gridArea: 'controls' }}>
          <FlightControls />
        </div>
      </div>

      {/* Action buttons — fixed bottom-center, outside grid */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[2] pointer-events-auto sm:bottom-5">
        <ActionButtons onOpenSequences={() => setSequenceModalOpen(true)} />
      </div>

      <SequenceModal
        isOpen={sequenceModalOpen}
        onClose={() => setSequenceModalOpen(false)}
        onSelect={(id) => {
          sendCommand(() => api.runSequence(id), `RUN SEQUENCE ${id}`);
        }}
      />
    </>
  );
}
