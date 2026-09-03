import { sanitizeComponentAdaptation } from './manifest';
import {
  semanticComponentIds,
  type ComponentAdaptation,
  type FunctionalProfile,
  type RememberedPreferences,
  type SemanticComponentId,
} from './types';

export const REMEMBERED_PREFERENCES_KEY = 'northstar.functional-preferences.v1';

const targetSizes = new Set([28, 44, 52, 64, 72]);
const controlGaps = new Set([8, 16, 24, 32]);

export function normalizeFunctionalProfile(value: unknown): FunctionalProfile | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Partial<FunctionalProfile>;
  const input = profile.input;
  const presentation = profile.presentation;
  if (
    profile.version !== 1 ||
    !input ||
    !presentation ||
    (input.preferredMethod !== 'pointer' && input.preferredMethod !== 'keyboard') ||
    !targetSizes.has(input.minimumTargetSize ?? -1) ||
    !controlGaps.has(input.minimumControlGap ?? -1) ||
    input.accidentalActivationProtection !== 'review' ||
    input.focusVisibility !== 'enhanced' ||
    (presentation.density !== 'standard' && presentation.density !== 'focused')
  ) return null;

  return {
    version: 1,
    input: {
      preferredMethod: input.preferredMethod,
      minimumTargetSize: input.minimumTargetSize!,
      minimumControlGap: input.minimumControlGap!,
      accidentalActivationProtection: 'review',
      focusVisibility: 'enhanced',
    },
    presentation: { density: presentation.density },
  };
}

function normalizeOverrides(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, ComponentAdaptation>;
  const entries = semanticComponentIds.flatMap((component) => {
    const patch = raw[component];
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return [];
    return [[component, sanitizeComponentAdaptation(component, patch)] as const];
  });
  return Object.fromEntries(entries) as Partial<Record<SemanticComponentId, ComponentAdaptation>>;
}

export function readRememberedPreferences(): RememberedPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(REMEMBERED_PREFERENCES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedPreferences>;
    const profile = normalizeFunctionalProfile(parsed.profile);
    if (parsed.version !== 1 || !profile) return null;
    return { version: 1, profile, componentOverrides: normalizeOverrides(parsed.componentOverrides) };
  } catch {
    return null;
  }
}

export function writeRememberedPreferences(preferences: RememberedPreferences) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REMEMBERED_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Storage is optional. The active session remains fully functional.
  }
}

export function clearRememberedPreferences() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REMEMBERED_PREFERENCES_KEY);
  } catch {
    // Reset still clears in-memory state when storage is unavailable.
  }
}
