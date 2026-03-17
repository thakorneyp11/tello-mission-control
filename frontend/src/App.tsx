import { useDroneStore } from '@/stores/droneStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKeyboard } from '@/hooks/useKeyboard';
import ConnectionScreen from '@/components/ConnectionScreen';
import VideoFeed from '@/components/VideoFeed';
import Vignette from '@/components/Vignette';
import HudLayout from '@/components/HudLayout';
import EmergencyButton from '@/components/EmergencyButton';

export default function App() {
  const connectionStatus = useDroneStore((s) => s.connectionStatus);

  // Side-effect hooks
  useWebSocket();
  useKeyboard();

  const isConnected = connectionStatus === 'connected';
  const showEmergency = connectionStatus !== 'disconnected';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {isConnected ? (
        <>
          <VideoFeed />
          <Vignette />
          <HudLayout />
        </>
      ) : (
        <ConnectionScreen />
      )}
      {showEmergency && <EmergencyButton />}
    </div>
  );
}
