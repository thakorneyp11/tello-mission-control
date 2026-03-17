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
        className="fixed inset-0 z-[2] grid pointer-events-none p-4 gap-3"
        style={{
          gridTemplateColumns: '220px 1fr 280px',
          gridTemplateRows: 'auto 1fr auto',
          gridTemplateAreas: `
            "telemetry  .        status"
            ".          .        cmdlog"
            "controls   actions  ."
          `,
        }}
      >
        <div className="pointer-events-auto self-start" style={{ gridArea: 'telemetry' }}>
          <TelemetryPanel />
        </div>

        <div className="pointer-events-auto self-start justify-self-end" style={{ gridArea: 'status' }}>
          <StatusBar />
        </div>

        <div className="pointer-events-auto self-start" style={{ gridArea: 'cmdlog' }}>
          <CommandLog />
        </div>

        <div className="pointer-events-auto self-end" style={{ gridArea: 'controls' }}>
          <FlightControls />
        </div>

        <div className="pointer-events-auto self-end justify-self-center" style={{ gridArea: 'actions' }}>
          <ActionButtons onOpenSequences={() => setSequenceModalOpen(true)} />
        </div>
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
