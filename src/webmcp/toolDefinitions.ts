import { hasPersonalization, resolveAdaptationManifest } from '../adaptation/manifest';
import { startPointerPrecisionCalibration } from '../calibration/startCalibration';
import { useCalibrationStore } from '../calibration/calibrationStore';
import { demoBill, demoInsurance, rescheduleSlots } from '../data/demoData';
import { runGuideAction } from '../presence/presenceController';
import { semanticTargetForSlot, usePortalStore } from '../state/portalStore';
import {
  portalSections,
  type AccessibilitySettings,
  type PortalSection,
  type SemanticTarget,
} from '../types';

export const semanticTargetMetadata: Record<
  SemanticTarget,
  { title: string; description: string }
> = {
  home_navigation: { title: 'Home navigation', description: 'The control that opens the portal home section.' },
  appointments_navigation: { title: 'Appointments navigation', description: 'The control that opens appointments.' },
  messages_navigation: { title: 'Messages navigation', description: 'The control that opens administrative messages.' },
  billing_navigation: { title: 'Billing navigation', description: 'The control that opens billing.' },
  insurance_navigation: { title: 'Insurance navigation', description: 'The control that opens insurance.' },
  documents_navigation: { title: 'Documents navigation', description: 'The control that opens documents.' },
  settings_navigation: { title: 'Settings navigation', description: 'The control that opens portal settings.' },
  guide_status: { title: 'Guide status', description: 'The portal indicator showing whether Guide tools are available.' },
  portal_surface: { title: 'Portal content', description: 'The main visible portal content area.' },
  upcoming_appointment: { title: 'Upcoming appointment', description: 'The visible card or summary for the upcoming appointment.' },
  reschedule_button: { title: 'Reschedule appointment', description: 'The control that opens appointment rescheduling.' },
  appointment_slot_sep_11: { title: 'September 11 at 9:00 AM', description: 'The September 11 reschedule option.' },
  appointment_slot_sep_12: { title: 'September 12 at 11:30 AM', description: 'The September 12 reschedule option.' },
  appointment_slot_sep_14: { title: 'September 14 at 3:00 PM', description: 'The September 14 reschedule option.' },
  confirm_reschedule_button: { title: 'Confirm new time', description: 'The consequential control that commits the reviewed appointment time.' },
  billing_balance: { title: 'Billing balance', description: 'The visible account balance summary.' },
  insurance_status: { title: 'Insurance status', description: 'The visible insurance coverage status.' },
  patient_responsibility: { title: 'Patient responsibility', description: 'The patient portion of the fictional bill.' },
  update_insurance_button: { title: 'Update insurance', description: 'The control that opens the simulated insurance update.' },
  accessibility_controls: { title: 'Accessibility preferences', description: 'The manual controls for portal presentation preferences.' },
  personalize_interface: { title: 'Personalize interface', description: 'The control that opens bounded component personalization and safe calibration.' },
  calibration_practice_target: { title: 'Calibration practice target', description: 'The safe non-operational control used during pointer precision calibration.' },
};

export const semanticTargets = Object.keys(semanticTargetMetadata) as SemanticTarget[];

export const accessibilityKeys: Array<keyof AccessibilitySettings> = [
  'textScale',
  'contrast',
  'density',
  'controlSize',
  'spacing',
  'emphasizeInteractive',
  'colorIndependentStatus',
  'readAloud',
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
  const personalized = hasPersonalization(
    state.accessibility,
    state.functionalProfile,
    state.componentOverrides,
  );
  return {
    interfaceMode: personalized ? 'adapted' : 'legacy',
    currentSection: state.currentSection,
    appointment: state.appointment,
    reschedule: state.reschedule,
    selectedRescheduleSlot:
      rescheduleSlots.find((slot) => slot.id === state.reschedule.selectedSlotId) ?? null,
    accessibility: state.accessibility,
    pendingAction: state.pendingAction,
    recentHumanOverrides: state.recentHumanOverrides,
    uiRevision: state.uiRevision,
    navigationRevision: state.navigationRevision,
    rescheduleRevision: state.rescheduleRevision,
    personalization: {
      functionalProfile: state.functionalProfile,
      componentOverrides: state.componentOverrides,
      effectiveManifest: resolveAdaptationManifest(
        state.accessibility,
        state.functionalProfile,
        state.componentOverrides,
      ),
      rememberPreferences: state.rememberPreferences,
      manifestRevision: state.manifestRevision,
    },
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

function describeAccessibilityPatch(patch: Partial<AccessibilitySettings>) {
  const phrases: Partial<Record<keyof AccessibilitySettings, (value: never) => string>> = {
    textScale: (value) => `set text to ${String(value)}%`,
    contrast: (value) => value === 'high' ? 'strengthened contrast' : 'restored standard contrast',
    density: (value) => value === 'simplified' ? 'simplified the page' : 'restored standard detail',
    controlSize: (value) => value === 'large' ? 'enlarged controls' : 'restored standard controls',
    spacing: (value) => value === 'increased' ? 'increased spacing' : 'restored standard spacing',
    emphasizeInteractive: (value) => value ? 'emphasized buttons and links' : 'restored standard link emphasis',
    colorIndependentStatus: (value) => value ? 'added icons and labels to statuses' : 'restored color-led statuses',
    readAloud: (value) => value ? 'enabled read-aloud for Guide' : 'disabled read-aloud',
  };

  return Object.entries(patch)
    .map(([key, value]) => phrases[key as keyof AccessibilitySettings]?.(value as never) ?? `${titleCase(key)} ${String(value)}`)
    .join(', ');
}

export function createStaticTools(): WebMCP.ModelContextTool[] {
  return [
    {
      name: 'get_portal_state',
      title: 'Get portal state',
      description:
        'Read what Robert currently sees in the fictional Northstar Health portal, including bounded component personalization, human overrides, and pending actions. Calibration attempts and simulator state are intentionally excluded. Call this before continuing a shared workflow.',
      inputSchema: noInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ ok: true, state: portalSnapshot() }),
    },
    {
      name: 'configure_accessibility',
      title: 'Adapt the portal',
      description:
        'Apply one or more explicitly requested Northstar settings, such as “make text 175%” or “use stronger contrast.” Preserve omitted settings. For vague pointer-acquisition difficulty without requested values, use start_interface_calibration instead.',
      inputSchema: {
        type: 'object',
        properties: {
          textScale: {
            type: 'number',
            enum: [100, 125, 150, 175, 200],
            description: 'Changes the visible text scale percentage.',
          },
          contrast: {
            type: 'string',
            enum: ['standard', 'high'],
            description: 'Switches between standard and stronger visual contrast.',
          },
          density: {
            type: 'string',
            enum: ['standard', 'simplified'],
            description: 'Simplified prioritizes primary tasks and reduces secondary information.',
          },
          controlSize: {
            type: 'string',
            enum: ['standard', 'large'],
            description: 'Changes the visible size of interactive controls.',
          },
          spacing: {
            type: 'string',
            enum: ['standard', 'increased'],
            description: 'Changes separation between controls and content groups.',
          },
          emphasizeInteractive: {
            type: 'boolean',
            description: 'Makes buttons and links more visually distinct when true.',
          },
          colorIndependentStatus: {
            type: 'boolean',
            description: 'Adds icons, shapes, and text so status is not conveyed by color alone.',
          },
          readAloud: {
            type: 'boolean',
            description: 'Enables optional webpage speech for visible Guide messages when true.',
          },
        },
        minProperties: 1,
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, options) => {
        const signal = options?.signal;
        const patch = input as Partial<AccessibilitySettings>;
        const previousAccessibility = { ...usePortalStore.getState().accessibility };
        const changed = accessibilityKeys.filter(
          (key) => Object.hasOwn(patch, key) && patch[key] !== previousAccessibility[key],
        );
        const changedPatch = Object.fromEntries(
          changed.map((key) => [key, patch[key]]),
        ) as Partial<AccessibilitySettings>;
        const settings = changed.length > 0
          ? describeAccessibilityPatch(changedPatch)
          : 'found that those settings were already active';
        const result = await runGuideAction({
          target: 'guide_status',
          message: `I ${settings}. You can review or change every setting yourself.`,
          signal,
          beforeActionStatus: 'previewing',
          actionTiming: changed.length > 0 ? 'before-presence' : 'after-presence',
          action: changed.length > 0
            ? () => usePortalStore.getState().setAccessibility(changedPatch, 'guide')
            : undefined,
        });
        if (!result.ok) return cancelledResult(result.code);
        const state = usePortalStore.getState();
        return {
          ok: true,
          changed,
          previousAccessibility,
          accessibility: state.accessibility,
          interfaceMode: hasPersonalization(
            state.accessibility,
            state.functionalProfile,
            state.componentOverrides,
          ) ? 'adapted' : 'legacy',
          uiRevision: state.uiRevision,
          presentedVisually: result.presentedVisually,
          spokenByPage: result.spokenByPage,
        };
      },
    },
    {
      name: 'start_interface_calibration',
      title: 'Start interface calibration',
      description:
        'Open a safe, local pointer-precision calibration when the person describes functional difficulty acquiring controls, such as shaking hands or repeatedly missing buttons, without specifying a target size. Do not call from a diagnosis word alone. This selects a calibration family, never a diagnosis or disability template. The webpage handles practice attempts locally and never automatically confirms an appointment.',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: ['pointer_precision'],
            description: 'The implemented functional calibration family. Use pointer_precision for difficulty accurately acquiring controls.',
          },
          goal: {
            type: 'string',
            enum: ['reschedule_appointment'],
            description: 'The bounded portal task to continue locally after the person approves their preferences.',
          },
        },
        required: ['domain', 'goal'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, options) => {
        const signal = options?.signal;
        if (signal?.aborted) return cancelledResult('cancelled');
        if (input.domain !== 'pointer_precision' || input.goal !== 'reschedule_appointment') {
          return failed('unsupported_calibration', 'That calibration is not available in this demonstration.');
        }

        const calibrationId = startPointerPrecisionCalibration('guide');
        const calibration = useCalibrationStore.getState();
        return {
          ok: true,
          calibrationId,
          domain: calibration.domain,
          goal: calibration.goal,
          phase: calibration.phase,
          localPractice: true,
          profileApplied: false,
          presentedVisually: calibration.isOpen,
          spokenByPage: false,
          next: 'The person completes safe practice attempts and explicitly approves the resulting preferences on the webpage.',
        };
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
          target: {
            type: 'string',
            enum: semanticTargets,
            oneOf: semanticTargets.map((target) => ({
              type: 'string',
              const: target,
              title: semanticTargetMetadata[target].title,
              description: semanticTargetMetadata[target].description,
            })),
            description: 'A stable semantic target in the visible Northstar interface.',
          },
          message: {
            type: 'string',
            maxLength: 180,
            description: 'Short plain-text guidance to display beside the target.',
          },
        },
        required: ['target'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, options) => {
        const signal = options?.signal;
        const target = input.target as SemanticTarget;
        const message =
          typeof input.message === 'string'
            ? input.message
            : 'This is the part of the portal you asked about.';
        const result = await runGuideAction({ target, message, signal });
        if (!result.ok) return cancelledResult(result.code);
        return {
          ok: true,
          target,
          activated: false,
          presentedVisually: result.presentedVisually,
          spokenByPage: result.spokenByPage,
        };
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
      execute: async (input, options) => {
        const signal = options?.signal;
        const section = input.section as PortalSection;
        const result = await runGuideAction({
          target: sectionTarget[section],
          message: `I’ll open ${titleCase(section)} so we can look at it together.`,
          signal,
          action: () => usePortalStore.getState().openSection(section, 'guide'),
        });
        if (!result.ok) return cancelledResult(result.code);
        return {
          ok: true,
          currentSection: section,
          presentedVisually: result.presentedVisually,
          spokenByPage: result.spokenByPage,
        };
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
      title: 'Get reschedule options',
      description:
        'Read the available times for Robert’s fictional appointment without opening a workflow, selecting a time, or changing the appointment.',
      inputSchema: {
        type: 'object',
        properties: { appointmentId: { type: 'string', enum: ['appointment_robert_2026_09_10'] } },
        required: ['appointmentId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input) => {
        const state = usePortalStore.getState();
        if (input.appointmentId !== state.appointment.id) {
          return failed('appointment_not_found', 'That appointment is not available in this fictional portal.');
        }

        return { ok: true, appointmentId: input.appointmentId, options: rescheduleSlots, committed: false };
      },
    },
    {
      name: 'open_reschedule',
      title: 'Open appointment rescheduling',
      description:
        'Visibly guide Robert to the reschedule control and open the non-committing time chooser. Nothing changes until a selected time is explicitly confirmed.',
      inputSchema: {
        type: 'object',
        properties: { appointmentId: { type: 'string', enum: ['appointment_robert_2026_09_10'] } },
        required: ['appointmentId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, options) => {
        const signal = options?.signal;
        const state = usePortalStore.getState();
        if (input.appointmentId !== state.appointment.id) {
          return failed('appointment_not_found', 'That appointment is not available in this fictional portal.');
        }

        let presentedVisually = false;
        let spokenByPage = false;
        if (state.currentSection !== 'appointments') {
          const opened = await runGuideAction({
            target: 'appointments_navigation',
            message: 'Appointments are here. I’ll open that section first.',
            signal,
            action: () => usePortalStore.getState().openSection('appointments', 'guide'),
          });
          if (!opened.ok) return cancelledResult(opened.code);
          presentedVisually ||= opened.presentedVisually;
          spokenByPage ||= opened.spokenByPage;
        }

        if (!usePortalStore.getState().reschedule.dialogOpen) {
          const shown = await runGuideAction({
            target: 'reschedule_button',
            message: 'This opens available times. You can choose one yourself, and nothing changes until confirmation.',
            signal,
            action: () => usePortalStore.getState().openReschedule('guide'),
          });
          if (!shown.ok) return cancelledResult(shown.code);
          presentedVisually ||= shown.presentedVisually;
          spokenByPage ||= shown.spokenByPage;
        }

        return {
          ok: true,
          appointmentId: input.appointmentId,
          options: rescheduleSlots,
          chooserOpen: true,
          committed: false,
          presentedVisually,
          spokenByPage,
        };
      },
    },
    createSelectSlotTool(),
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
    execute: async (input, options) => {
      const signal = options?.signal;
      const state = usePortalStore.getState();
      if (input.appointmentId !== state.appointment.id) {
        return failed('appointment_not_found', 'The requested appointment does not match the shared portal state.');
      }
      if (!state.reschedule.dialogOpen) {
        return failed('chooser_closed', 'Open the reschedule workflow before selecting a time.');
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
      return {
        ok: true,
        selectedSlot: slot,
        committed: false,
        next: 'Review the change with the person before confirming.',
        presentedVisually: result.presentedVisually,
        spokenByPage: result.spokenByPage,
      };
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
    execute: async (input, options) => {
      const signal = options?.signal;
      const before = usePortalStore.getState();
      const slotId = input.slotId as string;
      const slot = rescheduleSlots.find((candidate) => candidate.id === slotId);
      if (input.appointmentId !== before.appointment.id) {
        return failed('appointment_not_found', 'The appointment changed or is not available. Re-read portal state.');
      }
      if (!slot || before.reschedule.selectedSlotId !== slotId) {
        return failed('selection_changed', 'The person’s current selection differs from the requested slot. Re-read portal state and do not overwrite it.');
      }

      const expectedRescheduleRevision = before.rescheduleRevision;
      const result = await runGuideAction({
        target: 'confirm_reschedule_button',
        message: `Current: ${before.appointment.dateLabel} at ${before.appointment.time}. New: ${slot.dateLabel} at ${slot.time}. I’ll confirm this visible change now.`,
        signal,
        beforeActionStatus: 'previewing',
        action: () => {
          const latest = usePortalStore.getState();
          if (
            latest.rescheduleRevision !== expectedRescheduleRevision ||
            latest.appointment.id !== input.appointmentId ||
            !latest.reschedule.dialogOpen ||
            latest.reschedule.selectedSlotId !== slotId
          ) return false;
          return latest.confirmReschedule(slotId, 'guide');
        },
      });
      if (!result.ok) {
        if (result.code === 'action_rejected') {
          return failed('selection_changed', 'The person changed the selection before confirmation. Nothing was committed.');
        }
        return cancelledResult(result.code);
      }
      return {
        ok: true,
        appointment: usePortalStore.getState().appointment,
        committed: true,
        presentedVisually: result.presentedVisually,
        spokenByPage: result.spokenByPage,
      };
    },
  };
}
