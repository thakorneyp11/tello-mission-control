import { useEffect } from 'react';
import { useDroneStore } from '@/stores/droneStore';
import * as api from '@/lib/api';

export function useKeyboard() {
  const connectionStatus = useDroneStore((s) => s.connectionStatus);
  const isFlying = useDroneStore((s) => s.isFlying);
  const commandPending = useDroneStore((s) => s.commandPending);
  const moveDistance = useDroneStore((s) => s.moveDistance);
  const rotateAngle = useDroneStore((s) => s.rotateAngle);
  const sendCommand = useDroneStore((s) => s.sendCommand);
  const setIsFlying = useDroneStore((s) => s.setIsFlying);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        // Esc still works in inputs
        if (e.key !== 'Escape') return;
      }

      // Emergency stop — always works regardless of state
      if (e.key === 'Escape') {
        e.preventDefault();
        api.emergencyStop();
        return;
      }

      // All other keys require connection
      if (connectionStatus !== 'connected') return;

      // Movement keys require flying and no pending command
      if (commandPending) return;

      switch (e.key.toLowerCase()) {
        case 'w':
          e.preventDefault();
          sendCommand(() => api.move('forward', moveDistance), 'MOVE FWD');
          break;
        case 's':
          e.preventDefault();
          sendCommand(() => api.move('back', moveDistance), 'MOVE BACK');
          break;
        case 'a':
          e.preventDefault();
          if (isFlying) sendCommand(() => api.move('left', moveDistance), 'MOVE LEFT');
          break;
        case 'd':
          e.preventDefault();
          if (isFlying) sendCommand(() => api.move('right', moveDistance), 'MOVE RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (isFlying) sendCommand(() => api.move('up', moveDistance), 'MOVE UP');
          break;
        case 'shift':
          e.preventDefault();
          if (isFlying) sendCommand(() => api.move('down', moveDistance), 'MOVE DOWN');
          break;
        case 'q':
          e.preventDefault();
          if (isFlying) sendCommand(() => api.rotate('ccw', rotateAngle), 'ROTATE CCW');
          break;
        case 'e':
          e.preventDefault();
          if (isFlying) sendCommand(() => api.rotate('cw', rotateAngle), 'ROTATE CW');
          break;
        case 't':
          e.preventDefault();
          if (!isFlying) {
            sendCommand(() => api.takeoff(), 'TAKEOFF').then((ok) => {
              if (ok) setIsFlying(true);
            });
          }
          break;
        case 'l':
          e.preventDefault();
          if (isFlying) {
            sendCommand(() => api.land(), 'LAND').then((ok) => {
              if (ok) setIsFlying(false);
            });
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectionStatus, isFlying, commandPending, moveDistance, rotateAngle, sendCommand, setIsFlying]);
}
