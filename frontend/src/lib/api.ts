import type {
  ApiResponse,
  ConnectResponse,
  FlipDirection,
  MoveDirection,
  RotateDirection,
  Sequence,
  StatusResponse,
} from '@/types/drone';

export const VIDEO_STREAM_URL = '/api/video/stream';

async function post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, error: `HTTP ${res.status}: ${text}` } as T;
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' } as T;
  }
}

async function get<T>(path: string): Promise<T> {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error('Network error');
  }
}

export function connectDrone(): Promise<ConnectResponse> {
  return post<ConnectResponse>('/api/control/connect');
}

export function disconnectDrone(): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/disconnect');
}

export function takeoff(): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/takeoff');
}

export function land(): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/land');
}

export function emergencyStop(): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/emergency');
}

export function move(direction: MoveDirection, distance_cm: number): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/move', { direction, distance_cm });
}

export function rotate(direction: RotateDirection, angle_deg: number): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/rotate', { direction, angle_deg });
}

export function flip(direction: FlipDirection): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/flip', { direction });
}

export function sendRc(lr: number, fb: number, ud: number, yaw: number): Promise<ApiResponse> {
  return post<ApiResponse>('/api/control/rc', { lr, fb, ud, yaw });
}

export function getStatus(): Promise<StatusResponse> {
  return get<StatusResponse>('/api/status');
}

export async function takeSnapshot(): Promise<Blob> {
  const res = await fetch('/api/video/snapshot', { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Snapshot failed: HTTP ${res.status}`);
  }
  return res.blob();
}

export function getSequences(): Promise<Sequence[]> {
  return get<Sequence[]>('/api/sequences');
}

export function runSequence(id: string): Promise<ApiResponse> {
  return post<ApiResponse>(`/api/sequences/${encodeURIComponent(id)}/run`);
}

export function cancelSequence(): Promise<ApiResponse> {
  return post<ApiResponse>('/api/sequences/cancel');
}
