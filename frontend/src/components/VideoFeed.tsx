import { useState, useEffect, useRef } from 'react';
import { VIDEO_STREAM_URL } from '@/lib/api';
import { useDroneStore } from '@/stores/droneStore';

type FeedState = 'loading' | 'active' | 'error';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export default function VideoFeed() {
  const previewMode = useDroneStore((s) => s.previewMode);
  const [state, setState] = useState<FeedState>('loading');
  const [streamUrl, setStreamUrl] = useState(VIDEO_STREAM_URL);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  // In preview mode, show a dark placeholder — no video stream to connect to
  if (previewMode) {
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#0A0A0A]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <span className="text-hud-sm font-mono uppercase tracking-[0.08em] text-hud-dim">
          No Video — Preview Mode
        </span>
      </div>
    );
  }

  const handleLoad = () => {
    setState('active');
    retryCount.current = 0;
  };

  const handleError = () => {
    if (retryCount.current < MAX_RETRIES) {
      setState('loading');
      retryTimer.current = setTimeout(() => {
        retryCount.current += 1;
        // Cache-buster forces browser to retry the stream
        setStreamUrl(`${VIDEO_STREAM_URL}?t=${Date.now()}`);
      }, RETRY_DELAY_MS);
    } else {
      setState('error');
    }
  };

  return (
    <>
      <img
        src={streamUrl}
        alt="Tello video feed"
        className="fixed inset-0 z-0 h-full w-full object-cover"
        onLoad={handleLoad}
        onError={handleError}
      />

      {state === 'loading' && (
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-black">
          <div className="h-3 w-3 animate-pulse rounded-full bg-white/60" />
        </div>
      )}

      {state === 'error' && (
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#0A0A0A]">
          <span className="text-hud-sm font-mono uppercase tracking-[0.08em] text-hud-dim">
            Video Feed Unavailable
          </span>
        </div>
      )}
    </>
  );
}
