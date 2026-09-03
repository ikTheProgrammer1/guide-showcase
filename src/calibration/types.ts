import type { FunctionalProfile } from '../adaptation/types';
import type { Actor } from '../types';

export const calibrationDomains = [
  'pointer_precision',
  'visual_readability',
  'color_distinction',
  'plain_language',
  'attention_focus',
  'keyboard_switch',
] as const;

export type CalibrationDomain = (typeof calibrationDomains)[number];
export const implementedCalibrationDomains = ['pointer_precision'] as const;
export type ImplementedCalibrationDomain = (typeof implementedCalibrationDomains)[number];

export const calibrationGoals = ['reschedule_appointment'] as const;
export type CalibrationGoal = (typeof calibrationGoals)[number];
export type CalibrationPhase = 'idle' | 'target-size' | 'spacing' | 'comfort' | 'approved';

export interface CalibrationAttempt {
  success: boolean;
  method: 'pointer' | 'keyboard';
  missDistance: number;
  corrections: number;
}

export interface CalibrationAggregates {
  attempts: number;
  successes: number;
  misses: number;
  pointerAttempts: number;
  keyboardActivations: number;
  corrections: number;
  totalMissDistance: number;
}

export interface InterfaceCalibrationState {
  calibrationId: string | null;
  domain: ImplementedCalibrationDomain | null;
  goal: CalibrationGoal | null;
  startedBy: Actor | null;
  phase: CalibrationPhase;
  isOpen: boolean;
  initialTargetSize: number;
  targetSize: number;
  initialTargetWidth: number;
  controlGap: number;
  consecutiveSuccesses: number;
  preferredMethod: 'pointer' | 'keyboard';
  remember: boolean;
  aggregates: CalibrationAggregates;
  feedback: string;
  revision: number;
  approvedProfile: FunctionalProfile | null;
}
