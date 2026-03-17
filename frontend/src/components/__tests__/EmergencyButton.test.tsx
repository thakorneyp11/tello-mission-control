import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmergencyButton from '@/components/EmergencyButton';

vi.mock('@/lib/api', () => ({
  emergencyStop: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('EmergencyButton', () => {
  it('renders with correct text', () => {
    render(<EmergencyButton />);
    expect(screen.getByText('EMERGENCY STOP')).toBeInTheDocument();
  });

  it('has aria-label', () => {
    render(<EmergencyButton />);
    expect(screen.getByRole('button', { name: 'Emergency Stop' })).toBeInTheDocument();
  });

  it('has tabIndex 1 for priority focus', () => {
    render(<EmergencyButton />);
    const btn = screen.getByRole('button', { name: 'Emergency Stop' });
    expect(btn).toHaveAttribute('tabindex', '1');
  });

  it('calls emergencyStop on click', async () => {
    const { emergencyStop } = await import('@/lib/api');
    const user = userEvent.setup();
    render(<EmergencyButton />);

    await user.click(screen.getByRole('button', { name: 'Emergency Stop' }));
    expect(emergencyStop).toHaveBeenCalled();
  });

  it('is never disabled', () => {
    render(<EmergencyButton />);
    const btn = screen.getByRole('button', { name: 'Emergency Stop' });
    expect(btn).not.toBeDisabled();
  });
});
