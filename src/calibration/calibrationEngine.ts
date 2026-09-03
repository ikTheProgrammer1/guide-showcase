import type { FunctionalProfile } from '../adaptation/types';
import type {
  CalibrationAggregates,
  CalibrationAttempt,
  CalibrationPhase,
} from './types';

export const TARGET_SIZE_STEPS = [28, 44, 52, 64, 72] as const;
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
          ? 'That one missed. This is the largest available target.'
          : `That one missed — I made the target ${nextSize}px tall. Try again.`,
      };
    }
    if (nextSuccesses >= REQUIRED_SUCCESSFUL_ATTEMPTS) {
      return {
        phase: 'spacing' as const,
        targetSize,
        controlGap,
        consecutiveSuccesses: 0,
        feedback: 'This target size feels consistent. Now let’s check the spacing.',
      };
    }
    return {
      phase,
      targetSize,
      controlGap,
      consecutiveSuccesses: nextSuccesses,
      feedback: `That worked. ${nextSuccesses} of ${REQUIRED_SUCCESSFUL_ATTEMPTS} at this size.`,
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
          ? 'That one missed. This is the widest available spacing.'
          : `That one missed — I moved the controls ${nextGap}px apart. Try again.`,
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
      feedback: `That worked. ${nextSuccesses} of ${REQUIRED_SUCCESSFUL_ATTEMPTS} at this spacing.`,
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
    presentation: { density: 'standard' },
  };
}
