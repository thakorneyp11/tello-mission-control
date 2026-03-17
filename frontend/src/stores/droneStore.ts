import { create } from 'zustand';
import type {
  ApiResponse,
  CommandLogEntry,
  ConnectionStatus,
  Sequence,
  SequenceProgress,
  TelemetryData,
} from '@/types/drone';
import * as api from '@/lib/api';

const MAX_LOG_ENTRIES = 200;

interface DroneStore {
  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // Flight state
  isFlying: boolean;
  setIsFlying: (flying: boolean) => void;

  // Command lock
  commandPending: boolean;
  setCommandPending: (pending: boolean) => void;

  // Telemetry
  telemetry: TelemetryData | null;
  setTelemetry: (data: TelemetryData) => void;

  // Command log
  commandLog: CommandLogEntry[];
  addCommandLog: (entry: CommandLogEntry) => void;
  clearCommandLog: () => void;

  // Sequences
  sequences: Sequence[];
  setSequences: (sequences: Sequence[]) => void;
  sequenceProgress: SequenceProgress | null;
  setSequenceProgress: (progress: SequenceProgress | null) => void;

  // Control settings
  moveDistance: number;
  setMoveDistance: (d: number) => void;
  rotateAngle: number;
  setRotateAngle: (a: number) => void;

  // UI state
  commandLogCollapsed: boolean;
  toggleCommandLog: () => void;
  previewMode: boolean;

  // Compound actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  enterPreview: () => void;
  sendCommand: (commandFn: () => Promise<ApiResponse>) => Promise<boolean>;
}

export const useDroneStore = create<DroneStore>((set, get) => ({
  // Connection
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Flight state
  isFlying: false,
  setIsFlying: (flying) => set({ isFlying: flying }),

  // Command lock
  commandPending: false,
  setCommandPending: (pending) => set({ commandPending: pending }),

  // Telemetry
  telemetry: null,
  setTelemetry: (data) => set({ telemetry: data }),

  // Command log
  commandLog: [],
  addCommandLog: (entry) =>
    set((state) => ({
      commandLog: [...state.commandLog, entry].slice(-MAX_LOG_ENTRIES),
    })),
  clearCommandLog: () => set({ commandLog: [] }),

  // Sequences
  sequences: [],
  setSequences: (sequences) => set({ sequences }),
  sequenceProgress: null,
  setSequenceProgress: (progress) => set({ sequenceProgress: progress }),

  // Control settings
  moveDistance: 100,
  setMoveDistance: (d) => set({ moveDistance: Math.max(20, Math.min(500, d)) }),
  rotateAngle: 90,
  setRotateAngle: (a) => set({ rotateAngle: Math.max(1, Math.min(360, a)) }),

  // UI state
  commandLogCollapsed: false,
  toggleCommandLog: () => set((s) => ({ commandLogCollapsed: !s.commandLogCollapsed })),
  previewMode: false,

  // Enter preview mode — shows HUD without drone connection
  enterPreview: () => {
    set({
      connectionStatus: 'connected',
      previewMode: true,
      isFlying: false,
      telemetry: null,
      commandLog: [],
      sequenceProgress: null,
    });
  },

  // Connect to drone
  connect: async () => {
    set({ connectionStatus: 'connecting' });
    try {
      const res = await api.connectDrone();
      if (res.ok && res.battery !== undefined) {
        set({
          connectionStatus: 'connected',
          telemetry: get().telemetry
            ? { ...get().telemetry!, battery: res.battery }
            : null,
        });
        // Start video stream (fire-and-forget, non-blocking)
        api.startVideoStream().catch(() => {});
        // Fetch available sequences
        try {
          const sequences = await api.getSequences();
          set({ sequences });
        } catch {
          // Non-critical — sequences panel just stays empty
        }
      } else {
        set({ connectionStatus: 'error' });
      }
    } catch {
      set({ connectionStatus: 'error' });
    }
  },

  // Disconnect from drone
  disconnect: async () => {
    const wasPreview = get().previewMode;
    if (!wasPreview) {
      // Stop video stream and disconnect (best effort)
      api.stopVideoStream().catch(() => {});
      try {
        await api.disconnectDrone();
      } catch {
        // Best effort
      }
    }
    set({
      connectionStatus: 'disconnected',
      isFlying: false,
      telemetry: null,
      sequenceProgress: null,
      commandPending: false,
      previewMode: false,
    });
  },

  // Generic command wrapper — prevents double-sends
  sendCommand: async (commandFn) => {
    if (get().commandPending) return false;

    set({ commandPending: true });
    try {
      const res = await commandFn();
      return res.ok;
    } catch {
      return false;
    } finally {
      set({ commandPending: false });
    }
  },
}));
