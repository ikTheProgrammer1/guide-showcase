import { defaultAccessibility } from '../data/demoData';
import type { AccessibilitySettings } from '../types';
import {
  semanticComponentIds,
  type AdaptationManifest,
  type ActiveTaskExperience,
  type ComponentAdaptation,
  type ComponentAdaptationKey,
  type FunctionalProfile,
  type SemanticComponentId,
} from './types';

export interface ComponentCapability {
  label: string;
  description: string;
  supports: ComponentAdaptationKey[];
}

export const componentCapabilities: Record<SemanticComponentId, ComponentCapability> = {
  primary_navigation: {
    label: 'Navigation',
    description: 'Portal section controls and their labels.',
    supports: ['minimumTargetSize', 'minimumControlGap', 'layout', 'labelStyle', 'focusVisibility'],
  },
  appointment_summary: {
    label: 'Appointment summary',
    description: 'The visible details for the upcoming appointment.',
    supports: ['layout', 'informationPriority', 'secondaryContent', 'labelStyle', 'placement'],
  },
  appointment_actions: {
    label: 'Appointment actions',
    description: 'Controls for viewing, changing, or cancelling an appointment.',
    supports: [
      'minimumTargetSize',
      'minimumControlGap',
      'layout',
      'labelStyle',
      'activationProtection',
      'focusVisibility',
      'destructiveActionPlacement',
      'placement',
    ],
  },
  status_indicators: {
    label: 'Statuses',
    description: 'Appointment, billing, insurance, and message status indicators.',
    supports: ['statusPresentation', 'labelStyle', 'informationPriority', 'placement'],
  },
  forms: {
    label: 'Forms and choices',
    description: 'Inputs, appointment times, and review controls.',
    supports: [
      'minimumTargetSize',
      'minimumControlGap',
      'layout',
      'labelStyle',
      'activationProtection',
      'focusVisibility',
      'placement',
    ],
  },
  secondary_content: {
    label: 'Secondary content',
    description: 'Earlier visits, shortcuts, and supporting portal information.',
    supports: ['informationPriority', 'secondaryContent', 'labelStyle', 'placement'],
  },
};

export const baseAdaptationManifest: AdaptationManifest = {
  primary_navigation: {
    minimumTargetSize: 36,
    minimumControlGap: 5,
    layout: 'column',
    labelStyle: 'concise',
    focusVisibility: 'standard',
  },
  appointment_summary: {
    layout: 'row',
    informationPriority: 'all',
    secondaryContent: 'visible',
    labelStyle: 'concise',
    placement: 'default',
  },
  appointment_actions: {
    minimumTargetSize: 28,
    minimumControlGap: 5,
    layout: 'row',
    labelStyle: 'concise',
    activationProtection: 'standard',
    focusVisibility: 'standard',
    destructiveActionPlacement: 'inline',
    placement: 'default',
  },
  status_indicators: {
    statusPresentation: 'color-and-text',
    labelStyle: 'concise',
    informationPriority: 'all',
    placement: 'default',
  },
  forms: {
    minimumTargetSize: 38,
    minimumControlGap: 10,
    layout: 'row',
    labelStyle: 'descriptive',
    activationProtection: 'review',
    focusVisibility: 'standard',
    placement: 'default',
  },
  secondary_content: {
    informationPriority: 'all',
    secondaryContent: 'visible',
    labelStyle: 'concise',
    placement: 'default',
  },
};

const cloneManifest = (): AdaptationManifest => Object.fromEntries(
  semanticComponentIds.map((component) => [component, { ...baseAdaptationManifest[component] }]),
) as AdaptationManifest;

function mergeComponent(
  manifest: AdaptationManifest,
  component: SemanticComponentId,
  patch: ComponentAdaptation,
) {
  manifest[component] = { ...manifest[component], ...sanitizeComponentAdaptation(component, patch) };
}

export function sanitizeComponentAdaptation(
  component: SemanticComponentId,
  patch: ComponentAdaptation,
): ComponentAdaptation {
  const supported = new Set(componentCapabilities[component].supports);
  const validValues: Record<ComponentAdaptationKey, readonly unknown[]> = {
    minimumTargetSize: [28, 36, 38, 44, 52, 56, 64, 72],
    minimumControlGap: [5, 8, 10, 16, 24, 32],
    layout: ['row', 'column', 'step-by-step'],
    informationPriority: ['all', 'primary'],
    secondaryContent: ['visible', 'collapsed'],
    labelStyle: ['concise', 'descriptive', 'plain-language'],
    statusPresentation: ['color-and-text', 'icon-shape-text'],
    activationProtection: ['standard', 'review'],
    focusVisibility: ['standard', 'enhanced'],
    destructiveActionPlacement: ['inline', 'separate'],
    placement: ['default', 'first', 'last'],
  };
  return Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => {
      const adaptationKey = key as ComponentAdaptationKey;
      return supported.has(adaptationKey)
        && value !== undefined
        && validValues[adaptationKey].includes(value);
    }),
  ) as ComponentAdaptation;
}

export function resolveAdaptationManifest(
  accessibility: AccessibilitySettings,
  profile: FunctionalProfile | null,
  overrides: Partial<Record<SemanticComponentId, ComponentAdaptation>>,
  taskExperience: ActiveTaskExperience | null = null,
): AdaptationManifest {
  const manifest = cloneManifest();

  if (accessibility.controlSize === 'large') {
    for (const component of ['primary_navigation', 'appointment_actions', 'forms'] as const) {
      mergeComponent(manifest, component, { minimumTargetSize: 56 });
    }
  }
  if (accessibility.spacing === 'increased') {
    for (const component of ['primary_navigation', 'appointment_actions', 'forms'] as const) {
      mergeComponent(manifest, component, { minimumControlGap: 24 });
    }
  }
  if (accessibility.density === 'simplified') {
    mergeComponent(manifest, 'appointment_summary', { informationPriority: 'primary', secondaryContent: 'collapsed' });
    mergeComponent(manifest, 'secondary_content', { informationPriority: 'primary', secondaryContent: 'collapsed' });
  }
  if (accessibility.colorIndependentStatus) {
    mergeComponent(manifest, 'status_indicators', { statusPresentation: 'icon-shape-text' });
  }
  if (accessibility.emphasizeInteractive) {
    for (const component of ['primary_navigation', 'appointment_actions', 'forms'] as const) {
      mergeComponent(manifest, component, { focusVisibility: 'enhanced' });
    }
  }

  if (profile) {
    const input = profile.input;
    mergeComponent(manifest, 'primary_navigation', {
      minimumTargetSize: Math.max(baseAdaptationManifest.primary_navigation.minimumTargetSize!, input.minimumTargetSize),
      minimumControlGap: input.minimumControlGap,
      focusVisibility: input.focusVisibility,
    });
    mergeComponent(manifest, 'appointment_actions', {
      minimumTargetSize: Math.max(baseAdaptationManifest.appointment_actions.minimumTargetSize!, input.minimumTargetSize),
      minimumControlGap: input.minimumControlGap,
      layout: 'column',
      labelStyle: 'descriptive',
      activationProtection: input.accidentalActivationProtection,
      focusVisibility: input.focusVisibility,
      destructiveActionPlacement: 'separate',
    });
    mergeComponent(manifest, 'forms', {
      minimumTargetSize: Math.max(baseAdaptationManifest.forms.minimumTargetSize!, input.minimumTargetSize),
      minimumControlGap: input.minimumControlGap,
      layout: 'step-by-step',
      activationProtection: input.accidentalActivationProtection,
      focusVisibility: input.focusVisibility,
    });
    if (profile.presentation.density === 'focused') {
      mergeComponent(manifest, 'appointment_summary', {
        informationPriority: 'primary',
        secondaryContent: 'collapsed',
        labelStyle: 'descriptive',
      });
      mergeComponent(manifest, 'secondary_content', {
        informationPriority: 'primary',
        secondaryContent: 'collapsed',
      });
    }
  }

  if (taskExperience) {
    const focused = taskExperience.informationDensity === 'focused';
    const detailed = taskExperience.informationDensity === 'detailed';
    const plainLanguage = taskExperience.languageStyle === 'plain';
    const onePage = taskExperience.workflowLayout === 'one-page';

    mergeComponent(manifest, 'primary_navigation', {
      layout: 'column',
      labelStyle: plainLanguage ? 'plain-language' : 'descriptive',
      focusVisibility: 'enhanced',
    });
    mergeComponent(manifest, 'appointment_summary', {
      layout: onePage ? 'row' : 'column',
      informationPriority: focused ? 'primary' : 'all',
      secondaryContent: focused ? 'collapsed' : 'visible',
      labelStyle: plainLanguage ? 'plain-language' : 'descriptive',
      placement: 'first',
    });
    mergeComponent(manifest, 'appointment_actions', {
      layout: onePage ? 'row' : 'column',
      labelStyle: plainLanguage ? 'plain-language' : 'descriptive',
      activationProtection: 'review',
      focusVisibility: 'enhanced',
      destructiveActionPlacement: 'separate',
    });
    mergeComponent(manifest, 'forms', {
      layout: onePage ? 'row' : 'step-by-step',
      labelStyle: plainLanguage ? 'plain-language' : 'descriptive',
      activationProtection: 'review',
      focusVisibility: 'enhanced',
    });
    mergeComponent(manifest, 'secondary_content', {
      informationPriority: focused ? 'primary' : 'all',
      secondaryContent: detailed ? 'visible' : focused ? 'collapsed' : 'visible',
      labelStyle: plainLanguage ? 'plain-language' : 'descriptive',
      placement: 'last',
    });
    for (const component of semanticComponentIds) {
      const adjustment = taskExperience.regionAdjustments?.[component];
      if (adjustment) mergeComponent(manifest, component, adjustment);
    }
  }

  for (const component of semanticComponentIds) {
    const patch = overrides[component];
    if (patch) mergeComponent(manifest, component, patch);
  }

  return manifest;
}

export function hasPersonalization(
  accessibility: AccessibilitySettings,
  profile: FunctionalProfile | null,
  overrides: Partial<Record<SemanticComponentId, ComponentAdaptation>>,
  taskExperience: ActiveTaskExperience | null = null,
) {
  if (profile || taskExperience || Object.keys(overrides).length > 0) return true;
  return Object.entries(defaultAccessibility).some(
    ([key, value]) => accessibility[key as keyof AccessibilitySettings] !== value,
  );
}
