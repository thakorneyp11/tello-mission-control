import { useState } from 'react';
import { VIDEO_STREAM_URL } from '@/lib/api';
import { useDroneStore } from '@/stores/droneStore';

type FeedState = 'loading' | 'active' | 'error';

export default function VideoFeed() {
  const previewMode = useDroneStore((s) => s.previewMode);
  const [state, setState] = useState<FeedState>('loading');

  // In preview mode, show a dark placeholder — no video stream to connect to
  if (previewMode) {
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#0A0A0A]">
        {/* Subtle grid pattern */}
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

  return (
    <>
      <img
        src={VIDEO_STREAM_URL}
        alt="Tello video feed"
        className="fixed inset-0 z-0 h-full w-full object-cover"
        onLoad={() => setState('active')}
        onError={() => setState('error')}
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
