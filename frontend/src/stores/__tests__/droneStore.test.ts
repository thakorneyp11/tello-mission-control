import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDroneStore } from '@/stores/droneStore';

// Mock the api module
vi.mock('@/lib/api', () => ({
  connectDrone: vi.fn(),
  disconnectDrone: vi.fn(),
  getSequences: vi.fn(),
  startVideoStream: vi.fn().mockResolvedValue({ ok: true }),
  stopVideoStream: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('droneStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useDroneStore.setState({
      connectionStatus: 'disconnected',
      isFlying: false,
      commandPending: false,
      telemetry: null,
      commandLog: [],
      sequences: [],
      sequenceProgress: null,
      moveDistance: 100,
      rotateAngle: 90,
      commandLogCollapsed: false,
      previewMode: false,
    });
  });

  describe('connectionStatus', () => {
    it('starts as disconnected', () => {
      expect(useDroneStore.getState().connectionStatus).toBe('disconnected');
    });

    it('updates connection status', () => {
      useDroneStore.getState().setConnectionStatus('connected');
      expect(useDroneStore.getState().connectionStatus).toBe('connected');
    });
  });

  describe('commandLog', () => {
    it('adds entries', () => {
      const entry = {
        command: 'takeoff',
        params: {},
        result: 'ok' as const,
        timestamp: '2026-03-17T10:00:00Z',
      };
      useDroneStore.getState().addCommandLog(entry);
      expect(useDroneStore.getState().commandLog).toHaveLength(1);
      expect(useDroneStore.getState().commandLog[0].command).toBe('takeoff');
    });

    it('caps at 200 entries', () => {
      for (let i = 0; i < 210; i++) {
        useDroneStore.getState().addCommandLog({
          command: `cmd-${i}`,
          params: {},
          result: 'ok',
          timestamp: `2026-03-17T10:00:${String(i).padStart(2, '0')}Z`,
        });
      }
      expect(useDroneStore.getState().commandLog).toHaveLength(200);
      // Should keep the latest entries
      expect(useDroneStore.getState().commandLog[199].command).toBe('cmd-209');
    });

    it('clears log', () => {
      useDroneStore.getState().addCommandLog({
        command: 'test',
        params: {},
        result: 'ok',
        timestamp: '2026-03-17T10:00:00Z',
      });
      useDroneStore.getState().clearCommandLog();
      expect(useDroneStore.getState().commandLog).toHaveLength(0);
    });
  });

  describe('sendCommand', () => {
    it('sets commandPending during execution', async () => {
      let resolveCommand: (v: { ok: boolean }) => void;
      const commandFn = () =>
        new Promise<{ ok: boolean }>((res) => {
          resolveCommand = res;
        });

      const promise = useDroneStore.getState().sendCommand(commandFn, 'TEST');
      expect(useDroneStore.getState().commandPending).toBe(true);

      resolveCommand!({ ok: true });
      const result = await promise;

      expect(useDroneStore.getState().commandPending).toBe(false);
      expect(result).toBe(true);
    });

    it('prevents double-send when commandPending', async () => {
      useDroneStore.setState({ commandPending: true });
      const commandFn = vi.fn().mockResolvedValue({ ok: true });

      const result = await useDroneStore.getState().sendCommand(commandFn, 'TEST');
      expect(commandFn).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      const commandFn = vi.fn().mockRejectedValue(new Error('fail'));
      const result = await useDroneStore.getState().sendCommand(commandFn, 'TEST');
      expect(result).toBe(false);
      expect(useDroneStore.getState().commandPending).toBe(false);
    });
  });

  describe('control settings', () => {
    it('clamps moveDistance to valid range', () => {
      useDroneStore.getState().setMoveDistance(10);
      expect(useDroneStore.getState().moveDistance).toBe(20);

      useDroneStore.getState().setMoveDistance(600);
      expect(useDroneStore.getState().moveDistance).toBe(500);

      useDroneStore.getState().setMoveDistance(200);
      expect(useDroneStore.getState().moveDistance).toBe(200);
    });

    it('clamps rotateAngle to valid range', () => {
      useDroneStore.getState().setRotateAngle(0);
      expect(useDroneStore.getState().rotateAngle).toBe(1);

      useDroneStore.getState().setRotateAngle(400);
      expect(useDroneStore.getState().rotateAngle).toBe(360);
    });
  });

  describe('enterPreview', () => {
    it('sets connected status and previewMode', () => {
      useDroneStore.getState().enterPreview();
      const state = useDroneStore.getState();
      expect(state.connectionStatus).toBe('connected');
      expect(state.previewMode).toBe(true);
      expect(state.isFlying).toBe(false);
      expect(state.telemetry).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('resets all state', async () => {
      useDroneStore.setState({
        connectionStatus: 'connected',
        isFlying: true,
        commandPending: true,
        sequenceProgress: {
          sequence_id: 'test',
          current_step: 1,
          total_steps: 3,
          step_description: 'test',
          status: 'running',
        },
      });

      await useDroneStore.getState().disconnect();

      const state = useDroneStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.isFlying).toBe(false);
      expect(state.commandPending).toBe(false);
      expect(state.telemetry).toBeNull();
      expect(state.sequenceProgress).toBeNull();
    });

    it('resets previewMode on disconnect', async () => {
      useDroneStore.getState().enterPreview();
      expect(useDroneStore.getState().previewMode).toBe(true);

      await useDroneStore.getState().disconnect();
      expect(useDroneStore.getState().previewMode).toBe(false);
      expect(useDroneStore.getState().connectionStatus).toBe('disconnected');
    });

    it('does not call backend API when disconnecting from preview mode', async () => {
      const { disconnectDrone, stopVideoStream } = await import('@/lib/api');
      vi.mocked(disconnectDrone).mockClear();
      vi.mocked(stopVideoStream).mockClear();

      useDroneStore.getState().enterPreview();
      await useDroneStore.getState().disconnect();

      expect(disconnectDrone).not.toHaveBeenCalled();
      expect(stopVideoStream).not.toHaveBeenCalled();
    });
  });

  describe('toggleCommandLog', () => {
    it('toggles collapsed state', () => {
      expect(useDroneStore.getState().commandLogCollapsed).toBe(false);
      useDroneStore.getState().toggleCommandLog();
      expect(useDroneStore.getState().commandLogCollapsed).toBe(true);
      useDroneStore.getState().toggleCommandLog();
      expect(useDroneStore.getState().commandLogCollapsed).toBe(false);
    });
  });
});
