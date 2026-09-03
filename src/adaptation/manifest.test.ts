import { beforeEach, describe, expect, it } from 'vitest';
import { defaultAccessibility } from '../data/demoData';
import {
  baseAdaptationManifest,
  componentCapabilities,
  resolveAdaptationManifest,
  sanitizeComponentAdaptation,
} from './manifest';
import type { FunctionalProfile } from './types';

const calibratedProfile: FunctionalProfile = {
  version: 1,
  input: {
    preferredMethod: 'pointer',
    minimumTargetSize: 64,
    minimumControlGap: 24,
    accidentalActivationProtection: 'review',
    focusVisibility: 'enhanced',
  },
  presentation: { density: 'focused' },
};

describe('bounded adaptation manifest', () => {
  beforeEach(() => window.localStorage.clear());

  it('declares capabilities per semantic component instead of a global template', () => {
    expect(componentCapabilities.appointment_actions.supports).toContain('minimumTargetSize');
    expect(componentCapabilities.status_indicators.supports).not.toContain('minimumTargetSize');
    expect(componentCapabilities.secondary_content.supports).toContain('secondaryContent');
  });

  it('composes an approved profile across only compatible regions', () => {
    const manifest = resolveAdaptationManifest(defaultAccessibility, calibratedProfile, {});

    expect(manifest.primary_navigation).toMatchObject({ minimumTargetSize: 64, minimumControlGap: 24 });
    expect(manifest.appointment_actions).toMatchObject({
      minimumTargetSize: 64,
      minimumControlGap: 24,
      layout: 'column',
      activationProtection: 'review',
      destructiveActionPlacement: 'separate',
    });
    expect(manifest.forms).toMatchObject({ minimumTargetSize: 64, layout: 'step-by-step' });
    expect(manifest.status_indicators).toEqual(baseAdaptationManifest.status_indicators);
  });

  it('keeps a measured 28px profile honest without shrinking safer regional defaults', () => {
    const measuredProfile: FunctionalProfile = {
      ...calibratedProfile,
      input: {
        ...calibratedProfile.input,
        minimumTargetSize: 28,
        minimumControlGap: 8,
      },
    };

    const manifest = resolveAdaptationManifest(defaultAccessibility, measuredProfile, {});

    expect(manifest.primary_navigation.minimumTargetSize).toBe(36);
    expect(manifest.appointment_actions.minimumTargetSize).toBe(28);
    expect(manifest.forms.minimumTargetSize).toBe(38);
    expect(manifest.appointment_actions).toMatchObject({
      minimumControlGap: 8,
      layout: 'column',
      activationProtection: 'review',
    });
  });

  it('applies bounded human region overrides after the calibrated profile', () => {
    const manifest = resolveAdaptationManifest(defaultAccessibility, calibratedProfile, {
      appointment_actions: { minimumTargetSize: 52, minimumControlGap: 16, layout: 'row' },
    });

    expect(manifest.appointment_actions).toMatchObject({
      minimumTargetSize: 52,
      minimumControlGap: 16,
      layout: 'row',
      activationProtection: 'review',
    });
  });

  it('drops unsupported and arbitrary properties at the manifest boundary', () => {
    const unsafe = {
      minimumTargetSize: 72,
      statusPresentation: 'icon-shape-text',
      selector: '#portal button',
      css: 'display:none',
      html: '<button>Injected</button>',
      x: 100,
      y: 100,
    } as never;

    expect(sanitizeComponentAdaptation('appointment_actions', unsafe)).toEqual({ minimumTargetSize: 72 });
  });
});
