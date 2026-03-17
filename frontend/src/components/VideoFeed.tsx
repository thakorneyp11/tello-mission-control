import { useState } from 'react';
import { VIDEO_STREAM_URL } from '@/lib/api';

type FeedState = 'loading' | 'active' | 'error';

export default function VideoFeed() {
  const [state, setState] = useState<FeedState>('loading');

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
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-red-950/40">
          <span className="text-hud-lg font-semibold uppercase tracking-[0.08em] text-danger">
            VIDEO FEED LOST
          </span>
        </div>
      )}
    </>
  );
}
