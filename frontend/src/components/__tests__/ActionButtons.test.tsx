import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionButtons from '@/components/ActionButtons';
import { useDroneStore } from '@/stores/droneStore';

vi.mock('@/lib/api', () => ({
  takeoff: vi.fn().mockResolvedValue({ ok: true }),
  land: vi.fn().mockResolvedValue({ ok: true }),
  cancelSequence: vi.fn().mockResolvedValue({ ok: true }),
  runSequence: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('ActionButtons', () => {
  beforeEach(() => {
    useDroneStore.setState({
      connectionStatus: 'connected',
      isFlying: false,
      commandPending: false,
      sequenceProgress: null,
    });
  });

  it('enables takeoff when grounded and connected', () => {
    render(<ActionButtons />);
    expect(screen.getByText('Takeoff')).not.toBeDisabled();
  });

  it('disables takeoff when flying', () => {
    useDroneStore.setState({ isFlying: true });
    render(<ActionButtons />);
    expect(screen.getByText('Takeoff')).toBeDisabled();
  });

  it('disables land when grounded', () => {
    render(<ActionButtons />);
    expect(screen.getByText('Land')).toBeDisabled();
  });

  it('enables land when flying', () => {
    useDroneStore.setState({ isFlying: true });
    render(<ActionButtons />);
    expect(screen.getByText('Land')).not.toBeDisabled();
  });

  it('disables buttons when commandPending', () => {
    useDroneStore.setState({ commandPending: true });
    render(<ActionButtons />);
    expect(screen.getByText('Takeoff')).toBeDisabled();
  });

  it('shows abort when sequence is running', () => {
    useDroneStore.setState({
      isFlying: true,
      sequenceProgress: {
        sequence_id: 'patrol',
        current_step: 2,
        total_steps: 8,
        step_description: 'Moving forward',
        status: 'running',
      },
    });
    render(<ActionButtons />);
    expect(screen.getByText('Abort')).toBeInTheDocument();
    expect(screen.queryByText('Takeoff')).not.toBeInTheDocument();
  });
});
