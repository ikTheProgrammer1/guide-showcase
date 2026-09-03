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
    expect(screen.getByRole('heading', { name: 'PATIENT SUMMARY' })).toBeInTheDocument();
  });

  it('starts as Northstar legacy software and structurally transforms when adapted', async () => {
    render(<App />);
    expect(screen.getByText('Northstar Health')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PATIENT SUMMARY' })).toBeInTheDocument();
    expect(document.querySelector('[data-interface="legacy"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Simplify page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));

    expect(await screen.findByRole('heading', { name: 'Good afternoon, Robert.' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'PATIENT SUMMARY' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-interface="adapted"]')).toBeInTheDocument();
  });
});
