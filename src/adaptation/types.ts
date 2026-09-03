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
export type ComponentPlacement = 'default' | 'first' | 'last';

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
  placement?: ComponentPlacement;
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

export const taskGoals = ['reschedule_appointment'] as const;
export type TaskGoal = (typeof taskGoals)[number];

export const assistanceLevels = ['show', 'explain', 'guide', 'collaborate', 'act'] as const;
export type AssistanceLevel = (typeof assistanceLevels)[number];

export type TaskInformationDensity = 'focused' | 'balanced' | 'detailed';
export type TaskLanguageStyle = 'standard' | 'plain';
export type TaskWorkflowLayout = 'step-by-step' | 'one-page';
export type TaskNavigationPresentation = 'focused' | 'full';
export type GuideVisibility = 'visible' | 'minimal';
export type TimeSelectionOwner = 'person' | 'shared';

export interface TaskExperience {
  goal: TaskGoal;
  assistanceLevel: AssistanceLevel;
  informationDensity: TaskInformationDensity;
  languageStyle: TaskLanguageStyle;
  workflowLayout: TaskWorkflowLayout;
  navigationPresentation: TaskNavigationPresentation;
  guideVisibility: GuideVisibility;
  timeSelection: TimeSelectionOwner;
  regionAdjustments: Partial<Record<SemanticComponentId, ComponentAdaptation>>;
}

export interface TaskRegionAdjustment extends ComponentAdaptation {
  region: SemanticComponentId;
}

export interface TaskExperienceInput extends Partial<Omit<TaskExperience, 'goal' | 'regionAdjustments'>> {
  goal: TaskGoal;
  regionAdjustments?: TaskRegionAdjustment[];
  textScale?: 100 | 125 | 150 | 175 | 200;
  contrast?: 'standard' | 'high';
  controlSize?: 'standard' | 'large';
  controlSpacing?: 'standard' | 'increased';
  colorIndependentStatus?: boolean;
  emphasizeInteractive?: boolean;
  openWorkflow?: boolean;
}

export interface ActiveTaskExperience extends TaskExperience {
  temporaryAccessibilityKeys: Array<
    'textScale' | 'contrast' | 'controlSize' | 'spacing' | 'colorIndependentStatus' | 'emphasizeInteractive'
  >;
  previousAccessibility: Partial<{
    textScale: 100 | 125 | 150 | 175 | 200;
    contrast: 'standard' | 'high';
    controlSize: 'standard' | 'large';
    spacing: 'standard' | 'increased';
    colorIndependentStatus: boolean;
    emphasizeInteractive: boolean;
  }>;
}

export const defaultTaskExperience: TaskExperience = {
  goal: 'reschedule_appointment',
  assistanceLevel: 'collaborate',
  informationDensity: 'focused',
  languageStyle: 'plain',
  workflowLayout: 'step-by-step',
  navigationPresentation: 'focused',
  guideVisibility: 'visible',
  timeSelection: 'person',
  regionAdjustments: {},
};

export interface RememberedPreferences {
  version: 1;
  profile: FunctionalProfile;
  componentOverrides: Partial<Record<SemanticComponentId, ComponentAdaptation>>;
}
