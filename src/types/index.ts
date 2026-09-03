export const portalSections = [
  'home',
  'appointments',
  'messages',
  'billing',
  'insurance',
  'documents',
  'settings',
] as const;

export type PortalSection = (typeof portalSections)[number];
export type Actor = 'guide' | 'you';
export type TextScale = 100 | 125 | 150 | 175 | 200;
export type Contrast = 'standard' | 'high';
export type Density = 'standard' | 'simplified';
export type ControlSize = 'standard' | 'large';
export type Spacing = 'standard' | 'increased';

export interface AccessibilitySettings {
  textScale: TextScale;
  contrast: Contrast;
  density: Density;
  controlSize: ControlSize;
  spacing: Spacing;
  emphasizeInteractive: boolean;
  readAloud: boolean;
}

export interface Appointment {
  id: string;
  provider: string;
  specialty: string;
  date: string;
  dateLabel: string;
  time: string;
  status: 'Confirmed';
}

export interface RescheduleSlot {
  id: string;
  date: string;
  dateLabel: string;
  dayLabel: string;
  time: string;
}

export type ReschedulePhase = 'idle' | 'choosing' | 'reviewing' | 'complete';

export interface RescheduleState {
  phase: ReschedulePhase;
  dialogOpen: boolean;
  selectedSlotId: string | null;
}

export type SemanticTarget =
  | 'home_navigation'
  | 'appointments_navigation'
  | 'messages_navigation'
  | 'billing_navigation'
  | 'insurance_navigation'
  | 'documents_navigation'
  | 'settings_navigation'
  | 'upcoming_appointment'
  | 'reschedule_button'
  | 'appointment_slot_sep_11'
  | 'appointment_slot_sep_12'
  | 'appointment_slot_sep_14'
  | 'confirm_reschedule_button'
  | 'patient_responsibility'
  | 'update_insurance_button'
  | 'accessibility_controls';

export type AgentStatus =
  | 'hidden'
  | 'appearing'
  | 'moving'
  | 'highlighting'
  | 'previewing'
  | 'acting'
  | 'complete';

export interface AgentPresenceState {
  visible: boolean;
  target: SemanticTarget | null;
  message: string | null;
  status: AgentStatus;
  operationId: number;
  position: { x: number; y: number } | null;
}

export interface ActivityEvent {
  id: string;
  actor: Actor;
  type: string;
  message: string;
  timestamp: number;
}

export interface HumanOverride {
  field: string;
  value: string | number | boolean;
  timestamp: number;
}

export interface PendingAction {
  type: 'reschedule';
  appointmentId: string;
  slotId: string;
}

export interface Bill {
  id: string;
  label: string;
  providerCharge: number;
  insurancePaid: number;
  patientResponsibility: number;
  status: 'Amount due';
}

export interface InsurancePolicy {
  carrier: string;
  plan: string;
  memberId: string;
  status: 'Active';
}
