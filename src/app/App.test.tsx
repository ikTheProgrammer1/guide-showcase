import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTargetRegistry } from '../presence/targetRegistry';
import { useSimulationStore } from '../simulation/simulationStore';
import { useCalibrationStore } from '../calibration/calibrationStore';
import { usePortalStore } from '../state/portalStore';
import { App } from './App';

describe('Guide portal UI', () => {
  beforeEach(() => {
    usePortalStore.getState().resetDemo();
    useSimulationStore.getState().resetSimulation();
    useCalibrationStore.getState().resetCalibration();
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool: vi.fn(async () => undefined),
        getTools: vi.fn(async () => []),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    cleanup();
    clearTargetRegistry();
    Object.defineProperty(document, 'modelContext', { configurable: true, value: undefined });
  });

  it('supports a complete manual reschedule flow', () => {
    usePortalStore.getState().setAccessibility({ density: 'simplified' }, 'guide');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Appointments' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule appointment' }));
    fireEvent.click(screen.getByRole('radio', { name: /Monday, September 14/ }));

    expect(screen.getByRole('button', { name: 'Confirm new time' })).toBeEnabled();
    expect(screen.getByText('September 14, 2026', { selector: '[data-new="true"] strong' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm new time' }));
    expect(screen.getByRole('heading', { name: 'Your new time is confirmed.' })).toBeInTheDocument();
  });

  it('lets the person override accessibility settings and reset them', () => {
    usePortalStore.getState().openSection('settings', 'you');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '175%' }));
    fireEvent.click(screen.getByRole('button', { name: 'High contrast' }));
    expect(usePortalStore.getState().accessibility).toMatchObject({ textScale: 175, contrast: 'high' });

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(usePortalStore.getState().accessibility).toMatchObject({ textScale: 100, contrast: 'standard' });
    expect(screen.getByRole('heading', { name: 'Primary care visit' })).toBeInTheDocument();
  });

  it('composes the same semantic component tree instead of swapping templates', async () => {
    render(<App />);
    expect(screen.getByText('Northstar Health')).toBeInTheDocument();
    const originalControl = screen.getByRole('button', { name: 'Reschedule appointment' });
    expect(document.querySelector('[data-personalized="false"]')).toBeInTheDocument();

    act(() => usePortalStore.getState().setAccessibility({ density: 'simplified' }, 'you'));
    await waitFor(() => expect(document.querySelector('[data-personalized="true"]')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Reschedule appointment' })).toBe(originalControl);
    expect(screen.getByRole('heading', { name: 'Primary care visit' })).toBeInTheDocument();
    expect(document.querySelector('[data-interface]')).not.toBeInTheDocument();
  });

  it('runs the complete local calibration and stops before time selection', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Personalize interface' }));
    fireEvent.click(screen.getByRole('button', { name: /Calibrate pointer precision/ }));

    const practice = await screen.findByRole('button', { name: 'Practice appointment' });
    for (let attempt = 0; attempt < 6; attempt += 1) fireEvent.click(practice);

    expect(screen.getByRole('heading', { name: 'Does this feel comfortable?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /This feels comfortable/ }));

    expect(screen.getByRole('heading', { name: 'Reschedule your appointment' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Available reschedule times' })).toBeInTheDocument();
    expect(usePortalStore.getState().reschedule).toMatchObject({ phase: 'choosing', selectedSlotId: null });
    expect(usePortalStore.getState().appointment.date).toBe('2026-09-10');
  });
});
