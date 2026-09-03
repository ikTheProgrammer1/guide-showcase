import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTargetRegistry } from '../presence/targetRegistry';
import { usePortalStore } from '../state/portalStore';
import { App } from './App';

describe('Guide portal UI', () => {
  beforeEach(() => {
    usePortalStore.getState().resetDemo();
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
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '175%' }));
    fireEvent.click(screen.getByRole('button', { name: 'High contrast' }));
    expect(usePortalStore.getState().accessibility).toMatchObject({ textScale: 175, contrast: 'high' });

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(usePortalStore.getState().accessibility).toMatchObject({ textScale: 100, contrast: 'standard' });
    expect(screen.getByText('Actions from you and Guide will appear here.')).toBeInTheDocument();
  });
});
