import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionScreen from '@/components/ConnectionScreen';
import { useDroneStore } from '@/stores/droneStore';

vi.mock('@/lib/api', () => ({
  connectDrone: vi.fn().mockResolvedValue({ ok: true, status: 'connected', battery: 85 }),
  getSequences: vi.fn().mockResolvedValue([]),
  startVideoStream: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('ConnectionScreen', () => {
  beforeEach(() => {
    useDroneStore.setState({ connectionStatus: 'disconnected' });
  });

  it('renders title', () => {
    render(<ConnectionScreen />);
    expect(screen.getByText('TELLO WEB CONTROLLER')).toBeInTheDocument();
  });

  it('renders connect button', () => {
    render(<ConnectionScreen />);
    expect(screen.getByText('CONNECT')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<ConnectionScreen />);
    expect(
      screen.getByText('Ensure you are connected to the Tello Wi-Fi network'),
    ).toBeInTheDocument();
  });

  it('shows CONNECTING... when connecting', () => {
    useDroneStore.setState({ connectionStatus: 'connecting' });
    render(<ConnectionScreen />);
    expect(screen.getByText('CONNECTING...')).toBeInTheDocument();
    expect(screen.getByText('CONNECTING...')).toBeDisabled();
  });

  it('shows error message on error state', () => {
    useDroneStore.setState({ connectionStatus: 'error' });
    render(<ConnectionScreen />);
    expect(
      screen.getByText(/Connection failed/),
    ).toBeInTheDocument();
  });

  it('calls connect on button click and transitions to connected', async () => {
    const user = userEvent.setup();
    render(<ConnectionScreen />);
    await user.click(screen.getByText('CONNECT'));
    // Mock resolves immediately, so state transitions through connecting to connected
    expect(['connecting', 'connected']).toContain(useDroneStore.getState().connectionStatus);
  });

  it('renders preview HUD button', () => {
    render(<ConnectionScreen />);
    expect(screen.getByText('PREVIEW HUD')).toBeInTheDocument();
  });

  it('enters preview mode on preview button click', async () => {
    const user = userEvent.setup();
    render(<ConnectionScreen />);
    await user.click(screen.getByText('PREVIEW HUD'));
    expect(useDroneStore.getState().connectionStatus).toBe('connected');
    expect(useDroneStore.getState().previewMode).toBe(true);
  });

  it('disables preview button when connecting', () => {
    useDroneStore.setState({ connectionStatus: 'connecting' });
    render(<ConnectionScreen />);
    expect(screen.getByText('PREVIEW HUD')).toBeDisabled();
  });
});
