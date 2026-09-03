export const semanticComponentIds = [
  'primary_navigation',
  'appointment_summary',
  'appointment_actions',
  'status_indicators',
  'forms',
  'secondary_content',
] as const;

export type SemanticComponentId = (typeof semanticComponentIds)[number];

export type ComponentLayout = 'row' | 'column' | 'step-by-step';
export type InformationPriority = 'all' | 'primary';
export type SecondaryContentVisibility = 'visible' | 'collapsed';
export type LabelStyle = 'concise' | 'descriptive' | 'plain-language';
export type StatusPresentation = 'color-and-text' | 'icon-shape-text';
export type ActivationProtection = 'standard' | 'review';
export type FocusVisibility = 'standard' | 'enhanced';
export type DestructiveActionPlacement = 'inline' | 'separate';

export interface ComponentAdaptation {
  minimumTargetSize?: number;
  minimumControlGap?: number;
  layout?: ComponentLayout;
  informationPriority?: InformationPriority;
  secondaryContent?: SecondaryContentVisibility;
  labelStyle?: LabelStyle;
  statusPresentation?: StatusPresentation;
  activationProtection?: ActivationProtection;
  focusVisibility?: FocusVisibility;
  destructiveActionPlacement?: DestructiveActionPlacement;
}

export type ComponentAdaptationKey = keyof ComponentAdaptation;

export type AdaptationManifest = Record<SemanticComponentId, ComponentAdaptation>;

export interface FunctionalProfile {
  version: 1;
  input: {
    preferredMethod: 'pointer' | 'keyboard';
    minimumTargetSize: number;
    minimumControlGap: number;
    accidentalActivationProtection: ActivationProtection;
    focusVisibility: FocusVisibility;
  };
  presentation: {
    density: 'standard' | 'focused';
  };
}

export interface RememberedPreferences {
  version: 1;
  profile: FunctionalProfile;
  componentOverrides: Partial<Record<SemanticComponentId, ComponentAdaptation>>;
}
