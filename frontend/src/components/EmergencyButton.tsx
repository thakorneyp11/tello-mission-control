import { useCallback } from 'react';
import { AlertOctagon } from 'lucide-react';
import * as api from '@/lib/api';

export default function EmergencyButton() {
  const handleEmergency = useCallback(() => {
    api.emergencyStop();
  }, []);

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[3]">
      <button
        type="button"
        className="emergency-btn"
        onClick={handleEmergency}
        tabIndex={1}
        aria-label="Emergency Stop"
      >
        <AlertOctagon size={20} />
        EMERGENCY STOP
      </button>
    </div>
  );
}
