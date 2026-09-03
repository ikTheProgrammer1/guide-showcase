import { demoBill, demoInsurance, rescheduleSlots } from '../data/demoData';
import { runGuideAction } from '../presence/presenceController';
import { semanticTargetForSlot, usePortalStore } from '../state/portalStore';
import {
  portalSections,
  type AccessibilitySettings,
  type PortalSection,
  type SemanticTarget,
} from '../types';

export const semanticTargets: SemanticTarget[] = [
  'home_navigation',
  'appointments_navigation',
  'messages_navigation',
  'billing_navigation',
  'insurance_navigation',
  'documents_navigation',
  'settings_navigation',
  'upcoming_appointment',
  'reschedule_button',
  'appointment_slot_sep_11',
  'appointment_slot_sep_12',
  'appointment_slot_sep_14',
  'confirm_reschedule_button',
  'patient_responsibility',
  'update_insurance_button',
  'accessibility_controls',
];

const noInputSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

const sectionTarget: Record<PortalSection, SemanticTarget> = {
  home: 'home_navigation',
  appointments: 'appointments_navigation',
  messages: 'messages_navigation',
  billing: 'billing_navigation',
  insurance: 'insurance_navigation',
  documents: 'documents_navigation',
  settings: 'settings_navigation',
};

function portalSnapshot() {
  const state = usePortalStore.getState();
  return {
    currentSection: state.currentSection,
    appointment: state.appointment,
    reschedule: state.reschedule,
    selectedRescheduleSlot:
      rescheduleSlots.find((slot) => slot.id === state.reschedule.selectedSlotId) ?? null,
    accessibility: state.accessibility,
    pendingAction: state.pendingAction,
    recentHumanOverrides: state.recentHumanOverrides,
    insuranceUpdateOpen: state.insuranceUpdateOpen,
  };
}

function failed(code: string, message: string) {
  return { ok: false, error: { code, message }, state: portalSnapshot() };
}

function cancelledResult(code?: string) {
  if (code === 'interrupted_by_user') {
    return failed('interrupted_by_user', 'The person changed the shared interface while Guide was acting. Re-read portal state before continuing.');
  }
  if (code === 'target_not_visible') {
    return failed('target_not_visible', 'That semantic target is not visible in the current interface. Open its section first.');
  }
  return failed(code ?? 'cancelled', 'The visible Guide action did not complete.');
}

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

export function createStaticTools(): WebMCP.ModelContextTool[] {
  return [
    {
      name: 'get_portal_state',
      title: 'Get portal state',
      description:
        'Read what Robert currently sees in the fictional Guide Patient Portal, including human overrides and pending actions. Call this before continuing a shared workflow.',
      inputSchema: noInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ ok: true, state: portalSnapshot() }),
    },
    {
      name: 'configure_accessibility',
      title: 'Adapt the portal',
      description:
        'Visibly adapt the shared portal to a functional need. Provide only settings the person requested. The person can change every setting afterward.',
      inputSchema: {
        type: 'object',
        properties: {
          textScale: { type: 'number', enum: [100, 125, 150, 175, 200] },
          contrast: { type: 'string', enum: ['standard', 'high'] },
          density: { type: 'string', enum: ['standard', 'simplified'] },
          controlSize: { type: 'string', enum: ['standard', 'large'] },
          spacing: { type: 'string', enum: ['standard', 'increased'] },
          emphasizeInteractive: { type: 'boolean' },
          readAloud: { type: 'boolean' },
        },
        minProperties: 1,
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, { signal }) => {
        const patch = input as Partial<AccessibilitySettings>;
        const settings = Object.entries(patch)
          .map(([key, value]) => `${titleCase(key)} ${String(value)}`)
          .join(', ');
        const result = await runGuideAction({
          target: 'accessibility_controls',
          message: `I’ll adapt the portal: ${settings}. You can change any of these controls yourself.`,
          signal,
          beforeActionStatus: 'previewing',
          action: () => usePortalStore.getState().setAccessibility(patch, 'guide'),
        });
        if (!result.ok) return cancelledResult(result.code);
        return { ok: true, accessibility: usePortalStore.getState().accessibility };
      },
    },
    {
      name: 'guide_to',
      title: 'Show an interface element',
      description:
        'Move the distinct Guide pointer to a visible semantic target, highlight it, and explain it without activating the target. Use this when the person asks where something is or what it does.',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', enum: semanticTargets },
          message: { type: 'string', maxLength: 180 },
        },
        required: ['target'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, { signal }) => {
        const target = input.target as SemanticTarget;
        const message =
          typeof input.message === 'string'
            ? input.message
            : 'This is the part of the portal you asked about.';
        const result = await runGuideAction({ target, message, signal });
        if (!result.ok) return cancelledResult(result.code);
        return { ok: true, target, activated: false };
      },
    },
    {
      name: 'open_section',
      title: 'Open a portal section',
      description: 'Visibly navigate the shared portal to a named section using its semantic navigation control.',
      inputSchema: {
        type: 'object',
        properties: { section: { type: 'string', enum: portalSections } },
        required: ['section'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, { signal }) => {
        const section = input.section as PortalSection;
        const result = await runGuideAction({
          target: sectionTarget[section],
          message: `I’ll open ${titleCase(section)} so we can look at it together.`,
          signal,
          action: () => usePortalStore.getState().openSection(section, 'guide'),
        });
        if (!result.ok) return cancelledResult(result.code);
        return { ok: true, currentSection: section };
      },
    },
    {
      name: 'get_upcoming_appointments',
      title: 'Get upcoming appointments',
      description: 'Read Robert’s fictional upcoming appointment without changing the interface or appointment.',
      inputSchema: noInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ ok: true, appointments: [usePortalStore.getState().appointment] }),
    },
    {
      name: 'get_reschedule_options',
      title: 'Show reschedule options',
      description:
        'Read and visibly show available times for Robert’s fictional appointment. This opens a chooser but does not select or commit a time.',
      inputSchema: {
        type: 'object',
        properties: { appointmentId: { type: 'string', enum: ['appointment_robert_2026_09_10'] } },
        required: ['appointmentId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input, { signal }) => {
        const state = usePortalStore.getState();
        if (input.appointmentId !== state.appointment.id) {
          return failed('appointment_not_found', 'That appointment is not available in this fictional portal.');
        }

        if (state.currentSection !== 'appointments') {
          const opened = await runGuideAction({
            target: 'appointments_navigation',
            message: 'Your appointment tools are here.',
            signal,
            action: () => usePortalStore.getState().openSection('appointments', 'guide'),
          });
          if (!opened.ok) return cancelledResult(opened.code);
        }

        if (!usePortalStore.getState().reschedule.dialogOpen) {
          const shown = await runGuideAction({
            target: 'reschedule_button',
            message: 'I’ll open the available times. Nothing will be changed until you confirm.',
            signal,
            action: () => usePortalStore.getState().openReschedule('guide'),
          });
          if (!shown.ok) return cancelledResult(shown.code);
        }

        return { ok: true, appointmentId: input.appointmentId, options: rescheduleSlots, committed: false };
      },
    },
    {
      name: 'get_bill_details',
      title: 'Get bill details',
      description: 'Read the fictional office-visit bill and its provider, insurance, and patient portions without giving financial advice.',
      inputSchema: noInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ ok: true, bill: demoBill, note: 'Administrative explanation only; not financial advice.' }),
    },
    {
      name: 'get_insurance_status',
      title: 'Get insurance status',
      description: 'Read the status of Robert’s fictional insurance card.',
      inputSchema: noInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ ok: true, insurance: demoInsurance }),
    },
    {
      name: 'open_insurance_update',
      title: 'Open insurance update',
      description: 'Visibly open the simulated insurance-update screen. No real file is uploaded and no real policy is changed.',
      inputSchema: noInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (_input, { signal }) => {
        if (usePortalStore.getState().currentSection !== 'insurance') {
          const opened = await runGuideAction({
            target: 'insurance_navigation',
            message: 'Your insurance information is in this section.',
            signal,
            action: () => usePortalStore.getState().openSection('insurance', 'guide'),
          });
          if (!opened.ok) return cancelledResult(opened.code);
        }

        const result = await runGuideAction({
          target: 'update_insurance_button',
          message: 'I’ll open the demonstration update screen. It does not send or store real information.',
          signal,
          action: () => usePortalStore.getState().openInsuranceUpdate('guide'),
        });
        if (!result.ok) return cancelledResult(result.code);
        return { ok: true, currentSection: 'insurance', updateOpen: true, simulated: true };
      },
    },
  ];
}

export function createSelectSlotTool(): WebMCP.ModelContextTool {
  return {
    name: 'select_reschedule_slot',
    title: 'Select a reschedule time',
    description:
      'Select one available fictional appointment time in the visible chooser. This prepares a review and never commits the appointment change.',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', enum: ['appointment_robert_2026_09_10'] },
        slotId: { type: 'string', enum: rescheduleSlots.map((slot) => slot.id) },
      },
      required: ['appointmentId', 'slotId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async (input, { signal }) => {
      const state = usePortalStore.getState();
      if (input.appointmentId !== state.appointment.id) {
        return failed('appointment_not_found', 'The requested appointment does not match the shared portal state.');
      }
      if (!state.reschedule.dialogOpen) {
        return failed('chooser_closed', 'Open the reschedule options before selecting a time.');
      }

      const slotId = input.slotId as string;
      const slot = rescheduleSlots.find((candidate) => candidate.id === slotId);
      const target = semanticTargetForSlot(slotId);
      if (!slot || !target) return failed('slot_not_found', 'That time is not one of the available options.');

      const result = await runGuideAction({
        target,
        message: `I’ll select ${slot.dayLabel} at ${slot.time}. This will not change the appointment yet.`,
        signal,
        action: () => usePortalStore.getState().selectRescheduleSlot(slotId, 'guide'),
      });
      if (!result.ok) return cancelledResult(result.code);
      return { ok: true, selectedSlot: slot, committed: false, next: 'Review the change with the person before confirming.' };
    },
  };
}

export function createConfirmTool(): WebMCP.ModelContextTool {
  return {
    name: 'confirm_reschedule',
    title: 'Confirm appointment change',
    description:
      'Consequential action: visibly confirm the currently selected fictional appointment time after the person has delegated completion. Fails rather than overwriting a changed human selection.',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', enum: ['appointment_robert_2026_09_10'] },
        slotId: { type: 'string', enum: rescheduleSlots.map((slot) => slot.id) },
      },
      required: ['appointmentId', 'slotId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async (input, { signal }) => {
      const before = usePortalStore.getState();
      const slotId = input.slotId as string;
      const slot = rescheduleSlots.find((candidate) => candidate.id === slotId);
      if (input.appointmentId !== before.appointment.id) {
        return failed('appointment_not_found', 'The appointment changed or is not available. Re-read portal state.');
      }
      if (!slot || before.reschedule.selectedSlotId !== slotId) {
        return failed('selection_changed', 'The person’s current selection differs from the requested slot. Re-read portal state and do not overwrite it.');
      }

      const expectedVersion = before.interactionVersion;
      const result = await runGuideAction({
        target: 'confirm_reschedule_button',
        message: `Current: ${before.appointment.dateLabel} at ${before.appointment.time}. New: ${slot.dateLabel} at ${slot.time}. I’ll confirm this visible change now.`,
        signal,
        beforeActionStatus: 'previewing',
        action: () => {
          const latest = usePortalStore.getState();
          if (latest.interactionVersion !== expectedVersion || latest.reschedule.selectedSlotId !== slotId) return false;
          return latest.confirmReschedule(slotId, 'guide');
        },
      });
      if (!result.ok) {
        if (result.code === 'action_rejected') {
          return failed('selection_changed', 'The person changed the selection before confirmation. Nothing was committed.');
        }
        return cancelledResult(result.code);
      }
      return { ok: true, appointment: usePortalStore.getState().appointment, committed: true };
    },
  };
}
