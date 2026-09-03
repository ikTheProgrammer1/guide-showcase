import type { AccessibilitySettings } from '../types';
import {
  assistanceLevels,
  defaultTaskExperience,
  semanticComponentIds,
  type ActiveTaskExperience,
  type TaskExperience,
  type TaskExperienceInput,
} from './types';
import { sanitizeComponentAdaptation } from './manifest';

export type TaskAccessibilityKey = ActiveTaskExperience['temporaryAccessibilityKeys'][number];

export interface ResolvedTaskExperience {
  experience: TaskExperience;
  accessibilityPatch: Partial<AccessibilitySettings>;
  openWorkflow: boolean;
}

function boundedValue<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

export function resolveTaskExperience(
  current: ActiveTaskExperience | null,
  input: TaskExperienceInput,
): ResolvedTaskExperience {
  const continuing = current?.goal === input.goal;
  const previous = continuing ? current : defaultTaskExperience;
  const regionAdjustments = Array.isArray(input.regionAdjustments)
    ? input.regionAdjustments.filter(({ region }) => semanticComponentIds.includes(region))
    : null;
  const experience: TaskExperience = {
    goal: input.goal,
    assistanceLevel: boundedValue(input.assistanceLevel, assistanceLevels, previous.assistanceLevel),
    informationDensity: boundedValue(input.informationDensity, ['focused', 'balanced', 'detailed'], previous.informationDensity),
    languageStyle: boundedValue(input.languageStyle, ['standard', 'plain'], previous.languageStyle),
    workflowLayout: boundedValue(input.workflowLayout, ['step-by-step', 'one-page'], previous.workflowLayout),
    navigationPresentation: boundedValue(input.navigationPresentation, ['focused', 'full'], previous.navigationPresentation),
    guideVisibility: boundedValue(input.guideVisibility, ['visible', 'minimal'], previous.guideVisibility),
    timeSelection: boundedValue(input.timeSelection, ['person', 'shared'], previous.timeSelection),
    regionAdjustments: regionAdjustments
      ? {
          ...previous.regionAdjustments,
          ...Object.fromEntries(regionAdjustments.map(({ region, ...adjustment }) => [
            region,
            sanitizeComponentAdaptation(region, adjustment),
          ])),
        }
      : previous.regionAdjustments,
  };

  const accessibilityPatch: Partial<AccessibilitySettings> = continuing
    ? {}
    : {
        controlSize: 'large',
        spacing: 'increased',
        colorIndependentStatus: true,
        emphasizeInteractive: true,
      };

  if ([100, 125, 150, 175, 200].includes(input.textScale as number)) {
    accessibilityPatch.textScale = input.textScale;
  }
  if (input.contrast === 'standard' || input.contrast === 'high') {
    accessibilityPatch.contrast = input.contrast;
  }
  if (input.controlSize === 'standard' || input.controlSize === 'large') {
    accessibilityPatch.controlSize = input.controlSize;
  }
  if (input.controlSpacing === 'standard' || input.controlSpacing === 'increased') {
    accessibilityPatch.spacing = input.controlSpacing;
  }
  if (typeof input.colorIndependentStatus === 'boolean') {
    accessibilityPatch.colorIndependentStatus = input.colorIndependentStatus;
  }
  if (typeof input.emphasizeInteractive === 'boolean') {
    accessibilityPatch.emphasizeInteractive = input.emphasizeInteractive;
  }

  return {
    experience,
    accessibilityPatch,
    openWorkflow: input.openWorkflow
      ?? (experience.assistanceLevel !== 'show' && experience.assistanceLevel !== 'explain'),
  };
}

export function taskExperienceSummary(experience: TaskExperience) {
  const changes = [
    experience.goal === 'reschedule_appointment' ? 'rescheduling prioritized' : null,
    experience.languageStyle === 'plain' ? 'plain-language labels' : 'standard labels',
    experience.informationDensity === 'focused'
      ? 'secondary information collapsed'
      : experience.informationDensity === 'detailed'
        ? 'supporting information expanded'
        : 'balanced information',
    experience.workflowLayout === 'one-page' ? 'one-page workflow' : 'step-by-step workflow',
  ];
  return changes.filter(Boolean).join(', ');
}
