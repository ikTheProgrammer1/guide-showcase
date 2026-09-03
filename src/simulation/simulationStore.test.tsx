import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { usePortalStore } from '../state/portalStore';
import {
  simulationGroups,
  useSimulationStore,
  type SimulationId,
} from './simulationStore';

describe('barrier simulator', () => {
  beforeEach(() => {
    usePortalStore.getState().resetDemo();
    useSimulationStore.getState().resetSimulation();
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
    Object.defineProperty(document, 'modelContext', { configurable: true, value: undefined });
  });

  it('publishes the exact four-category hierarchy', () => {
    expect(simulationGroups.map((group) => [
      group.label,
      group.options.map((option) => option.label),
    ])).toEqual([
      ['Sight', [
        'Total color blindness',
        'Yellow–Blue color blindness',
        'Red–Green color blindness',
        'Far-sightedness',
        'Tunnel vision',
        'Sunshine',
      ]],
      ['Mobility', ['Parkinson’s']],
      ['Read and write', ['Dyslexia', 'Small vocabulary']],
      ['Concentration', ['Concentration difficulty']],
    ]);
  });

  it('opens deliberately, keeps focus passive, and expands one category at a time', async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Simulate a barrier' });

    trigger.focus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const sight = screen.getByRole('button', { name: 'Sight' });
    sight.focus();
    expect(sight).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(sight).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Total color blindness' })).toBeVisible();

    await user.keyboard(' ');
    expect(sight).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');

    await user.click(screen.getByRole('button', { name: 'Mobility' }));
    expect(sight).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Mobility' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Parkinson’s' })).toBeVisible();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('opens from mouse hover but not from category focus', () => {
    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Simulate a barrier' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const category = screen.getByRole('button', { name: 'Read and write' });
    category.focus();
    expect(category).toHaveAttribute('aria-expanded', 'false');
  });

  it('activates exactly one simulation and exposes a persistent escape hatch', async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Simulate a barrier' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Read and write' }));
    await user.click(screen.getByRole('button', { name: 'Dyslexia, illustrative simulation' }));

    expect(document.querySelector('[data-simulation="dyslexia"]')).toBeInTheDocument();
    expect(screen.getByText('Illustrative simulation:', { exact: false })).toHaveTextContent('Dyslexia');
    expect(screen.getByText(/This approximates one interaction barrier/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop simulation' })).toBeVisible();

    act(() => useSimulationStore.getState().activateSimulation('sunshine'));
    expect(useSimulationStore.getState().activeSimulation).toBe('sunshine');
    expect(document.querySelector('[data-simulation="sunshine"]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stop simulation' }));
    expect(useSimulationStore.getState().activeSimulation).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('does not change portal state and Reset Demo clears both state domains', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = usePortalStore.getState();
    const portalSnapshot = {
      accessibility: { ...before.accessibility },
      uiRevision: before.uiRevision,
      navigationRevision: before.navigationRevision,
      rescheduleRevision: before.rescheduleRevision,
      activityLog: [...before.activityLog],
    };

    useSimulationStore.getState().activateSimulation('parkinsons');
    expect(usePortalStore.getState()).toMatchObject(portalSnapshot);
    usePortalStore.getState().setAccessibility({ controlSize: 'large' }, 'you');
    await user.click(screen.getByRole('button', { name: 'Reset demo' }));

    expect(useSimulationStore.getState()).toMatchObject({
      activeSimulation: null,
      menuOpen: false,
      expandedCategory: null,
    });
    expect(usePortalStore.getState()).toMatchObject({
      currentSection: 'home',
      accessibility: { controlSize: 'standard' },
      activityLog: [],
    });
  });

  it('preserves content for illustrative reading effects and accessible vocabulary', () => {
    render(<App />);
    const portal = document.querySelector('#portal-content')!;
    const before = portal.textContent;

    useSimulationStore.getState().activateSimulation('dyslexia');
    expect(portal.textContent).toBe(before);

    useSimulationStore.getState().activateSimulation('small-vocabulary');
    expect(screen.getByText('MRN', { selector: '[class*="jargonOriginal"]' })).toBeInTheDocument();
    const masks = screen.getAllByText('unfamiliar term');
    expect(masks.every((mask) => mask.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('keeps activation human-only through the dedicated store', () => {
    const sequence: SimulationId[] = ['parkinsons', 'dyslexia', 'concentration-difficulty'];
    sequence.forEach((simulation) => useSimulationStore.getState().activateSimulation(simulation));
    expect(useSimulationStore.getState().activeSimulation).toBe('concentration-difficulty');
    expect(usePortalStore.getState().activityLog).toEqual([]);
  });
});
