import { useMemo, type CSSProperties, type HTMLAttributes } from 'react';
import { usePortalStore } from '../state/portalStore';
import { resolveAdaptationManifest } from './manifest';
import type { SemanticComponentId } from './types';

export function useAdaptationManifest() {
  const accessibility = usePortalStore((state) => state.accessibility);
  const functionalProfile = usePortalStore((state) => state.functionalProfile);
  const componentOverrides = usePortalStore((state) => state.componentOverrides);
  return useMemo(
    () => resolveAdaptationManifest(accessibility, functionalProfile, componentOverrides),
    [accessibility, componentOverrides, functionalProfile],
  );
}

type AdaptationRegionAttributes = HTMLAttributes<HTMLElement> & {
  'data-adaptation-region': SemanticComponentId;
  'data-layout': string | undefined;
  'data-priority': string | undefined;
  'data-secondary': string | undefined;
  'data-label-style': string | undefined;
  'data-status-presentation': string | undefined;
  'data-activation-protection': string | undefined;
  'data-focus-visibility': string | undefined;
  'data-destructive-placement': string | undefined;
};

export function useAdaptationRegion(component: SemanticComponentId): AdaptationRegionAttributes {
  const manifest = useAdaptationManifest();
  const adaptation = manifest[component];
  return {
    'data-adaptation-region': component,
    'data-layout': adaptation.layout,
    'data-priority': adaptation.informationPriority,
    'data-secondary': adaptation.secondaryContent,
    'data-label-style': adaptation.labelStyle,
    'data-status-presentation': adaptation.statusPresentation,
    'data-activation-protection': adaptation.activationProtection,
    'data-focus-visibility': adaptation.focusVisibility,
    'data-destructive-placement': adaptation.destructiveActionPlacement,
    style: {
      '--region-target-size': `${adaptation.minimumTargetSize ?? 36}px`,
      '--region-control-gap': `${adaptation.minimumControlGap ?? 8}px`,
    } as CSSProperties,
  };
}
