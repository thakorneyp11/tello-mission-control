import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TelemetryPanel from '@/components/TelemetryPanel';
import { useDroneStore } from '@/stores/droneStore';

describe('TelemetryPanel', () => {
  beforeEach(() => {
    useDroneStore.setState({ telemetry: null });
  });

  it('shows dashes when telemetry is null', () => {
    render(<TelemetryPanel />);
    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });

  it('shows battery percentage', () => {
    useDroneStore.setState({
      telemetry: {
        battery: 85,
        height: 120,
        flight_time: 42,
        temperature: { high: 65, low: 60 },
        attitude: { pitch: 2, roll: -1, yaw: 180 },
        speed: { x: 0, y: 10, z: 0 },
        barometer: 150.5,
        tof_distance: 120,
      },
    });
    render(<TelemetryPanel />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows altitude in cm', () => {
    useDroneStore.setState({
      telemetry: {
        battery: 50,
        height: 200,
        flight_time: 0,
        temperature: { high: 60, low: 55 },
        attitude: { pitch: 0, roll: 0, yaw: 0 },
        speed: { x: 0, y: 0, z: 0 },
        barometer: 0,
        tof_distance: 0,
      },
    });
    render(<TelemetryPanel />);
    expect(screen.getByText('200 cm')).toBeInTheDocument();
  });

  it('formats flight time as M:SS', () => {
    useDroneStore.setState({
      telemetry: {
        battery: 50,
        height: 0,
        flight_time: 125,
        temperature: { high: 60, low: 55 },
        attitude: { pitch: 0, roll: 0, yaw: 0 },
        speed: { x: 0, y: 0, z: 0 },
        barometer: 0,
        tof_distance: 0,
      },
    });
    render(<TelemetryPanel />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('computes speed magnitude', () => {
    useDroneStore.setState({
      telemetry: {
        battery: 50,
        height: 0,
        flight_time: 0,
        temperature: { high: 60, low: 55 },
        attitude: { pitch: 0, roll: 0, yaw: 0 },
        speed: { x: 3, y: 4, z: 0 },
        barometer: 0,
        tof_distance: 0,
      },
    });
    render(<TelemetryPanel />);
    expect(screen.getByText('5 cm/s')).toBeInTheDocument();
  });
});
