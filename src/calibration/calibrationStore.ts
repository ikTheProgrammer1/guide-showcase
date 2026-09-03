import { create } from 'zustand';
import { usePortalStore } from '../state/portalStore';
import type { Actor } from '../types';
import {
  CONTROL_GAP_STEPS,
  TARGET_SIZE_STEPS,
  advanceCalibration,
  createFunctionalProfile,
  emptyCalibrationAggregates,
  nextStep,
  previousStep,
  reduceAttempt,
} from './calibrationEngine';
import type {
  CalibrationAttempt,
  CalibrationGoal,
  ImplementedCalibrationDomain,
  InterfaceCalibrationState,
} from './types';

interface CalibrationStore extends InterfaceCalibrationState {
  start: (
    domain: ImplementedCalibrationDomain,
    goal: CalibrationGoal,
    actor: Actor,
    initialTargetSize?: number,
    initialTargetWidth?: number,
  ) => string;
  recordAttempt: (attempt: CalibrationAttempt) => void;
  adjustTargetSize: (direction: 'larger' | 'smaller') => void;
  adjustControlGap: (direction: 'farther' | 'closer') => void;
  setRemember: (remember: boolean) => void;
  approve: () => boolean;
  stop: (actor: Actor) => void;
  resetCalibration: () => void;
}

const initialState: InterfaceCalibrationState = {
  calibrationId: null,
  domain: null,
  goal: null,
  startedBy: null,
  phase: 'idle',
  isOpen: false,
  targetSize: 28,
  initialTargetWidth: 92,
  controlGap: 8,
  consecutiveSuccesses: 0,
  preferredMethod: 'pointer',
  remember: false,
  aggregates: emptyCalibrationAggregates(),
  feedback: '',
  revision: 0,
  approvedProfile: null,
};

let calibrationSequence = 0;

export const useCalibrationStore = create<CalibrationStore>((set, get) => ({
  ...initialState,

  start: (domain, goal, actor, initialTargetSize = 28, initialTargetWidth = 92) => {
    calibrationSequence += 1;
    const calibrationId = `calibration-${calibrationSequence}`;
    set((state) => ({
      ...initialState,
      calibrationId,
      domain,
      goal,
      startedBy: actor,
      phase: 'target-size',
      isOpen: true,
      targetSize: Math.max(24, Math.min(72, Math.round(initialTargetSize))),
      initialTargetWidth: Math.max(72, Math.min(220, Math.round(initialTargetWidth))),
      revision: state.revision + 1,
      feedback: 'Try the practice appointment button. It cannot perform a real action.',
    }));
    usePortalStore.getState().recordActivity(
      actor,
      'calibration_started',
      `${actor === 'guide' ? 'Guide opened' : 'You opened'} pointer precision calibration`,
    );
    return calibrationId;
  },

  recordAttempt: (attempt) => {
    const state = get();
    if (!state.isOpen || (state.phase !== 'target-size' && state.phase !== 'spacing')) return;
    const next = advanceCalibration(
      state.phase,
      state.targetSize,
      state.controlGap,
      state.consecutiveSuccesses,
      attempt,
    );
    set((current) => ({
      ...next,
      aggregates: reduceAttempt(current.aggregates, attempt),
      preferredMethod: attempt.method === 'keyboard' ? 'keyboard' : current.preferredMethod,
      revision: current.revision + 1,
    }));
  },

  adjustTargetSize: (direction) => set((state) => ({
    targetSize: direction === 'larger'
      ? nextStep(state.targetSize, TARGET_SIZE_STEPS)
      : previousStep(state.targetSize, TARGET_SIZE_STEPS),
    feedback: `Target size set ${direction === 'larger' ? 'larger' : 'smaller'}.`,
    revision: state.revision + 1,
  })),

  adjustControlGap: (direction) => set((state) => ({
    controlGap: direction === 'farther'
      ? nextStep(state.controlGap, CONTROL_GAP_STEPS)
      : previousStep(state.controlGap, CONTROL_GAP_STEPS),
    feedback: `Controls moved ${direction === 'farther' ? 'farther apart' : 'closer together'}.`,
    revision: state.revision + 1,
  })),

  setRemember: (remember) => set((state) => ({ remember, revision: state.revision + 1 })),

  approve: () => {
    const state = get();
    if (state.phase !== 'comfort' || !state.domain || !state.goal) return false;
    const profile = createFunctionalProfile(state.preferredMethod, state.targetSize, state.controlGap);
    usePortalStore.getState().applyFunctionalProfile(profile, 'you', state.remember);
    set((current) => ({
      approvedProfile: profile,
      phase: 'approved',
      isOpen: false,
      aggregates: emptyCalibrationAggregates(),
      consecutiveSuccesses: 0,
      feedback: 'Preferences approved and applied.',
      revision: current.revision + 1,
    }));
    if (state.goal === 'reschedule_appointment') {
      usePortalStore.getState().openReschedule('you');
    }
    return true;
  },

  stop: (actor) => {
    if (get().phase === 'idle') return;
    set((state) => ({ ...initialState, revision: state.revision + 1 }));
    usePortalStore.getState().recordActivity(
      actor,
      'calibration_stopped',
      `${actor === 'guide' ? 'Guide stopped' : 'You stopped'} pointer precision calibration`,
    );
  },

  resetCalibration: () => {
    calibrationSequence = 0;
    set((state) => ({ ...initialState, revision: state.revision + 1 }));
  },
}));
