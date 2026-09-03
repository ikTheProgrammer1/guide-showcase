import type { FunctionalProfile } from '../adaptation/types';
import type {
  CalibrationAggregates,
  CalibrationAttempt,
  CalibrationPhase,
} from './types';

export const TARGET_SIZE_STEPS = [44, 52, 64, 72] as const;
export const CONTROL_GAP_STEPS = [8, 16, 24, 32] as const;
export const REQUIRED_SUCCESSFUL_ATTEMPTS = 3;

export const emptyCalibrationAggregates = (): CalibrationAggregates => ({
  attempts: 0,
  successes: 0,
  misses: 0,
  pointerAttempts: 0,
  keyboardActivations: 0,
  corrections: 0,
  totalMissDistance: 0,
});

export function nextStep(current: number, steps: readonly number[]) {
  return steps.find((step) => step > current) ?? steps.at(-1)!;
}

export function previousStep(current: number, steps: readonly number[]) {
  return [...steps].reverse().find((step) => step < current) ?? steps[0];
}

export function reduceAttempt(
  aggregates: CalibrationAggregates,
  attempt: CalibrationAttempt,
): CalibrationAggregates {
  return {
    attempts: aggregates.attempts + 1,
    successes: aggregates.successes + (attempt.success ? 1 : 0),
    misses: aggregates.misses + (attempt.success ? 0 : 1),
    pointerAttempts: aggregates.pointerAttempts + (attempt.method === 'pointer' ? 1 : 0),
    keyboardActivations: aggregates.keyboardActivations + (attempt.method === 'keyboard' ? 1 : 0),
    corrections: aggregates.corrections + Math.max(0, Math.round(attempt.corrections)),
    totalMissDistance: aggregates.totalMissDistance + (attempt.success ? 0 : Math.max(0, attempt.missDistance)),
  };
}

export function advanceCalibration(
  phase: CalibrationPhase,
  targetSize: number,
  controlGap: number,
  consecutiveSuccesses: number,
  attempt: CalibrationAttempt,
) {
  const nextSuccesses = attempt.success ? consecutiveSuccesses + 1 : 0;
  if (phase === 'target-size') {
    if (!attempt.success) {
      const nextSize = nextStep(targetSize, TARGET_SIZE_STEPS);
      return {
        phase,
        targetSize: nextSize,
        controlGap,
        consecutiveSuccesses: 0,
        feedback: nextSize === targetSize
          ? 'That attempt missed. The practice target is already at the largest available size.'
          : `That attempt missed, so the practice target increased to ${nextSize} pixels. Try again.`,
      };
    }
    if (nextSuccesses >= REQUIRED_SUCCESSFUL_ATTEMPTS) {
      return {
        phase: 'spacing' as const,
        targetSize,
        controlGap,
        consecutiveSuccesses: 0,
        feedback: 'Target size is now consistent. Next, try the same safe control while spacing is calibrated.',
      };
    }
    return {
      phase,
      targetSize,
      controlGap,
      consecutiveSuccesses: nextSuccesses,
      feedback: `Successful practice attempt ${nextSuccesses} of ${REQUIRED_SUCCESSFUL_ATTEMPTS}.`,
    };
  }

  if (phase === 'spacing') {
    if (!attempt.success) {
      const nextGap = nextStep(controlGap, CONTROL_GAP_STEPS);
      return {
        phase,
        targetSize,
        controlGap: nextGap,
        consecutiveSuccesses: 0,
        feedback: nextGap === controlGap
          ? 'That attempt missed. The practice controls already use the widest available separation.'
          : `That attempt missed, so the control gap increased to ${nextGap} pixels. Try again.`,
      };
    }
    if (nextSuccesses >= REQUIRED_SUCCESSFUL_ATTEMPTS) {
      return {
        phase: 'comfort' as const,
        targetSize,
        controlGap,
        consecutiveSuccesses: nextSuccesses,
        feedback: 'The practice attempts are consistent. Adjust the result if needed, then confirm whether it feels comfortable.',
      };
    }
    return {
      phase,
      targetSize,
      controlGap,
      consecutiveSuccesses: nextSuccesses,
      feedback: `Successful spacing attempt ${nextSuccesses} of ${REQUIRED_SUCCESSFUL_ATTEMPTS}.`,
    };
  }

  return { phase, targetSize, controlGap, consecutiveSuccesses, feedback: '' };
}

export function createFunctionalProfile(
  preferredMethod: 'pointer' | 'keyboard',
  targetSize: number,
  controlGap: number,
): FunctionalProfile {
  return {
    version: 1,
    input: {
      preferredMethod,
      minimumTargetSize: nextStep(targetSize - 1, TARGET_SIZE_STEPS),
      minimumControlGap: nextStep(controlGap - 1, CONTROL_GAP_STEPS),
      accidentalActivationProtection: 'review',
      focusVisibility: 'enhanced',
    },
    presentation: { density: 'focused' },
  };
}
