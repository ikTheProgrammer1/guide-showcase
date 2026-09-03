import { beforeEach, describe, expect, it } from 'vitest';
import { REMEMBERED_PREFERENCES_KEY } from '../adaptation/persistence';
import { useSimulationStore } from '../simulation/simulationStore';
import { usePortalStore } from '../state/portalStore';
import { REQUIRED_SUCCESSFUL_ATTEMPTS } from './calibrationEngine';
import { useCalibrationStore } from './calibrationStore';

const success = { success: true, method: 'pointer' as const, missDistance: 0, corrections: 0 };

function completePractice() {
  for (let attempt = 0; attempt < REQUIRED_SUCCESSFUL_ATTEMPTS * 2; attempt += 1) {
    useCalibrationStore.getState().recordAttempt(success);
  }
}

describe('pointer precision calibration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useCalibrationStore.getState().resetCalibration();
    useSimulationStore.getState().resetSimulation();
    usePortalStore.getState().resetDemo();
  });

  it('changes target size first and spacing only after target consistency', () => {
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'guide', 28, 92);
    useCalibrationStore.getState().recordAttempt({
      success: false,
      method: 'pointer',
      missDistance: 13.2,
      corrections: 2,
    });
    const afterTargetMiss = useCalibrationStore.getState();
    expect(afterTargetMiss).toMatchObject({ phase: 'target-size', targetSize: 44, controlGap: 8 });

    for (let attempt = 0; attempt < REQUIRED_SUCCESSFUL_ATTEMPTS; attempt += 1) {
      useCalibrationStore.getState().recordAttempt(success);
    }
    expect(useCalibrationStore.getState()).toMatchObject({ phase: 'spacing', targetSize: 44, controlGap: 8 });

    useCalibrationStore.getState().recordAttempt({ ...success, success: false, missDistance: 9 });
    expect(useCalibrationStore.getState()).toMatchObject({ phase: 'spacing', targetSize: 44, controlGap: 16 });
  });

  it('restarts the current attempt set after a manual measurement adjustment', () => {
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'you', 28, 92);
    useCalibrationStore.getState().recordAttempt(success);
    useCalibrationStore.getState().recordAttempt(success);
    expect(useCalibrationStore.getState()).toMatchObject({
      phase: 'target-size',
      initialTargetSize: 28,
      consecutiveSuccesses: 2,
    });

    useCalibrationStore.getState().adjustTargetSize('larger');
    expect(useCalibrationStore.getState()).toMatchObject({ targetSize: 44, consecutiveSuccesses: 0 });

    for (let attempt = 0; attempt < REQUIRED_SUCCESSFUL_ATTEMPTS; attempt += 1) {
      useCalibrationStore.getState().recordAttempt(success);
    }
    useCalibrationStore.getState().recordAttempt(success);
    useCalibrationStore.getState().recordAttempt(success);
    useCalibrationStore.getState().adjustControlGap('farther');
    expect(useCalibrationStore.getState()).toMatchObject({
      phase: 'spacing',
      controlGap: 16,
      consecutiveSuccesses: 0,
    });
  });

  it('retains only aggregate attempt data and discards it after approval', () => {
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'guide');
    useCalibrationStore.getState().recordAttempt({ success: false, method: 'pointer', missDistance: 12.7, corrections: 3 });

    const aggregateState = useCalibrationStore.getState();
    expect(aggregateState.aggregates).toEqual({
      attempts: 1,
      successes: 0,
      misses: 1,
      pointerAttempts: 1,
      keyboardActivations: 0,
      corrections: 3,
      totalMissDistance: 12.7,
    });
    expect(JSON.stringify(aggregateState.aggregates)).not.toMatch(/clientX|clientY|coordinate|parkinson/i);

    completePractice();
    expect(useCalibrationStore.getState().approve()).toBe(true);
    expect(useCalibrationStore.getState().aggregates.attempts).toBe(0);
  });

  it('requires successful practice and explicit approval before applying a profile', () => {
    const calibrationId = useCalibrationStore.getState().start(
      'pointer_precision',
      'reschedule_appointment',
      'guide',
    );
    expect(calibrationId).toMatch(/^calibration-/);
    expect(useCalibrationStore.getState().approve()).toBe(false);
    expect(usePortalStore.getState().functionalProfile).toBeNull();

    completePractice();
    useCalibrationStore.getState().adjustTargetSize('larger');
    useCalibrationStore.getState().adjustControlGap('farther');
    expect(useCalibrationStore.getState().approve()).toBe(true);

    const portal = usePortalStore.getState();
    expect(portal.functionalProfile).toMatchObject({
      input: { minimumTargetSize: 44, minimumControlGap: 16 },
      presentation: { density: 'focused' },
    });
    expect(portal.reschedule).toMatchObject({ phase: 'choosing', dialogOpen: true, selectedSlotId: null });
    expect(portal.appointment.date).toBe('2026-09-10');
    expect(portal.activityLog.find((event) => event.type === 'calibration_started')).toMatchObject({ actor: 'guide' });
    expect(portal.activityLog.find((event) => event.type === 'profile_approved')).toMatchObject({ actor: 'you' });
  });

  it('stores the exact target size established by successful practice', () => {
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'you', 28, 92);
    completePractice();

    expect(useCalibrationStore.getState().approve()).toBe(true);
    expect(usePortalStore.getState().functionalProfile?.input).toMatchObject({
      minimumTargetSize: 28,
      minimumControlGap: 8,
    });
  });

  it('persists only an explicitly remembered functional profile', () => {
    useSimulationStore.getState().activateSimulation('parkinsons');
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'you');
    completePractice();
    useCalibrationStore.getState().setRemember(true);
    expect(useCalibrationStore.getState().approve()).toBe(true);

    const stored = window.localStorage.getItem(REMEMBERED_PREFERENCES_KEY);
    expect(stored).not.toBeNull();
    expect(stored).not.toMatch(/parkinson|simulation|miss|attempt|coordinate|calibration/i);
    expect(JSON.parse(stored!)).toEqual({
      version: 1,
      profile: usePortalStore.getState().functionalProfile,
      componentOverrides: {},
    });
  });

  it('never reads or changes the separate simulator state', () => {
    useSimulationStore.getState().activateSimulation('parkinsons');
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'guide');
    completePractice();
    useCalibrationStore.getState().approve();

    expect(useSimulationStore.getState().activeSimulation).toBe('parkinsons');
    expect(JSON.stringify(usePortalStore.getState().functionalProfile)).not.toMatch(/parkinson|simulation/i);
  });

  it('clears remembered preferences and calibration data on Reset Demo', () => {
    useCalibrationStore.getState().start('pointer_precision', 'reschedule_appointment', 'you');
    completePractice();
    useCalibrationStore.getState().setRemember(true);
    useCalibrationStore.getState().approve();

    useCalibrationStore.getState().resetCalibration();
    usePortalStore.getState().resetDemo();

    expect(useCalibrationStore.getState()).toMatchObject({ phase: 'idle', isOpen: false, approvedProfile: null });
    expect(usePortalStore.getState().functionalProfile).toBeNull();
    expect(window.localStorage.getItem(REMEMBERED_PREFERENCES_KEY)).toBeNull();
  });
});
