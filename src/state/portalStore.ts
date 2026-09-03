import { create } from 'zustand';
import { clearRememberedPreferences, readRememberedPreferences, writeRememberedPreferences } from '../adaptation/persistence';
import { sanitizeComponentAdaptation } from '../adaptation/manifest';
import type {
  ActiveTaskExperience,
  ComponentAdaptation,
  FunctionalProfile,
  SemanticComponentId,
  TaskExperience,
} from '../adaptation/types';
import type { TaskAccessibilityKey } from '../adaptation/taskExperience';
import {
  defaultAccessibility,
  originalAppointment,
  rescheduleSlots,
} from '../data/demoData';
import type {
  AccessibilitySettings,
  Actor,
  ActivityEvent,
  AgentPresenceState,
  Appointment,
  HumanOverride,
  PendingAction,
  PortalSection,
  RescheduleState,
  SemanticTarget,
} from '../types';

interface AppointmentUndo {
  previous: Appointment;
  changed: Appointment;
}

export interface PortalStore {
  currentSection: PortalSection;
  appointment: Appointment;
  reschedule: RescheduleState;
  accessibility: AccessibilitySettings;
  agentPresence: AgentPresenceState;
  activityLog: ActivityEvent[];
  recentHumanOverrides: HumanOverride[];
  pendingAction: PendingAction | null;
  functionalProfile: FunctionalProfile | null;
  taskExperience: ActiveTaskExperience | null;
  componentOverrides: Partial<Record<SemanticComponentId, ComponentAdaptation>>;
  rememberPreferences: boolean;
  manifestRevision: number;
  uiRevision: number;
  navigationRevision: number;
  rescheduleRevision: number;
  insuranceUpdateOpen: boolean;
  insuranceUpdateSaved: boolean;
  appointmentUndo: AppointmentUndo | null;
  openSection: (section: PortalSection, actor: Actor) => void;
  setAccessibility: (patch: Partial<AccessibilitySettings>, actor: Actor) => void;
  openReschedule: (actor: Actor) => void;
  closeReschedule: (actor: Actor) => void;
  selectRescheduleSlot: (slotId: string, actor: Actor) => boolean;
  backToRescheduleChoices: (actor: Actor) => void;
  confirmReschedule: (slotId: string, actor: Actor) => boolean;
  undoReschedule: (actor: Actor) => boolean;
  applyFunctionalProfile: (profile: FunctionalProfile, actor: Actor, remember: boolean) => void;
  applyTaskExperience: (
    experience: TaskExperience,
    accessibilityPatch: Partial<AccessibilitySettings>,
    openWorkflow: boolean,
    actor: Actor,
  ) => boolean;
  clearTaskExperience: (actor: Actor) => boolean;
  setComponentAdaptation: (
    component: SemanticComponentId,
    patch: ComponentAdaptation,
    actor: Actor,
  ) => void;
  resetComponentAdaptation: (component: SemanticComponentId, actor: Actor) => void;
  openInsuranceUpdate: (actor: Actor) => void;
  closeInsuranceUpdate: (actor: Actor) => void;
  saveInsuranceUpdate: (actor: Actor) => void;
  setAgentPresence: (patch: Partial<AgentPresenceState>) => void;
  recordActivity: (actor: Actor, type: string, message: string) => void;
  resetDemo: () => void;
}

const hiddenPresence: AgentPresenceState = {
  visible: false,
  target: null,
  message: null,
  status: 'hidden',
  operationId: 0,
  position: null,
};

const initialReschedule: RescheduleState = {
  phase: 'idle',
  dialogOpen: false,
  selectedSlotId: null,
};

const rememberedPreferences = readRememberedPreferences();

let eventSequence = 0;

function makeEvent(actor: Actor, type: string, message: string): ActivityEvent {
  eventSequence += 1;
  return {
    id: `${Date.now()}-${eventSequence}`,
    actor,
    type,
    message,
    timestamp: Date.now(),
  };
}

function appendEvent(events: ActivityEvent[], event: ActivityEvent) {
  return [...events, event].slice(-16);
}

function navigationLabel(section: PortalSection) {
  return section[0].toUpperCase() + section.slice(1);
}

export const usePortalStore = create<PortalStore>((set, get) => ({
  currentSection: 'home',
  appointment: { ...originalAppointment },
  reschedule: { ...initialReschedule },
  accessibility: { ...defaultAccessibility },
  agentPresence: { ...hiddenPresence },
  activityLog: [],
  recentHumanOverrides: [],
  pendingAction: null,
  functionalProfile: rememberedPreferences?.profile ?? null,
  taskExperience: null,
  componentOverrides: rememberedPreferences?.componentOverrides ?? {},
  rememberPreferences: Boolean(rememberedPreferences),
  manifestRevision: rememberedPreferences ? 1 : 0,
  uiRevision: 0,
  navigationRevision: 0,
  rescheduleRevision: 0,
  insuranceUpdateOpen: false,
  insuranceUpdateSaved: false,
  appointmentUndo: null,

  openSection: (section, actor) => {
    if (get().currentSection === section) return;
    set((state) => ({
      currentSection: section,
      uiRevision: state.uiRevision + 1,
      navigationRevision: state.navigationRevision + 1,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(actor, 'navigation', `${actor === 'guide' ? 'Guide opened' : 'You opened'} ${navigationLabel(section)}`),
      ),
    }));
  },

  setAccessibility: (patch, actor) => {
    const entries = Object.entries(patch).filter(
      ([key, value]) => get().accessibility[key as keyof AccessibilitySettings] !== value,
    );
    if (entries.length === 0) return;

    set((state) => {
      const nextAccessibility = { ...state.accessibility, ...patch };
      const descriptions = entries.map(([key, value]) => `${key} to ${String(value)}`);
      const overrides =
        actor === 'you'
          ? entries.map(([field, value]) => ({ field, value: value as string | number | boolean, timestamp: Date.now() }))
          : [];

      let taskExperience = state.taskExperience;
      if (taskExperience) {
        const changedKeys = new Set(entries.map(([field]) => field));
        const temporaryAccessibilityKeys = taskExperience.temporaryAccessibilityKeys.filter(
          (key) => !changedKeys.has(key),
        );
        taskExperience = {
          ...taskExperience,
          informationDensity: Object.hasOwn(patch, 'density')
            ? patch.density === 'simplified' ? 'focused' : 'balanced'
            : taskExperience.informationDensity,
          temporaryAccessibilityKeys,
        };
      }

      return {
        accessibility: nextAccessibility,
        taskExperience,
        manifestRevision: state.manifestRevision + (
          state.taskExperience && Object.hasOwn(patch, 'density') ? 1 : 0
        ),
        uiRevision: state.uiRevision + 1,
        recentHumanOverrides: [...state.recentHumanOverrides, ...overrides].slice(-8),
        activityLog: appendEvent(
          state.activityLog,
          makeEvent(
            actor,
            'accessibility',
            `${actor === 'guide' ? 'Guide changed' : 'You changed'} ${descriptions.join(', ')}`,
          ),
        ),
      };
    });
  },

  openReschedule: (actor) => {
    set((state) => ({
      currentSection: 'appointments',
      reschedule: { phase: 'choosing', dialogOpen: true, selectedSlotId: null },
      pendingAction: null,
      appointmentUndo: null,
      uiRevision: state.uiRevision + 1,
      navigationRevision:
        state.currentSection === 'appointments' ? state.navigationRevision : state.navigationRevision + 1,
      rescheduleRevision: state.rescheduleRevision + 1,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(actor, 'reschedule_opened', `${actor === 'guide' ? 'Guide opened' : 'You opened'} available appointment times`),
      ),
    }));
  },

  closeReschedule: () => {
    if (!get().reschedule.dialogOpen) return;
    set((state) => ({
      reschedule: { ...initialReschedule },
      pendingAction: null,
      uiRevision: state.uiRevision + 1,
      rescheduleRevision: state.rescheduleRevision + 1,
    }));
  },

  selectRescheduleSlot: (slotId, actor) => {
    const slot = rescheduleSlots.find((candidate) => candidate.id === slotId);
    if (!slot || !get().reschedule.dialogOpen) return false;
    if (get().reschedule.selectedSlotId === slotId) return true;

    set((state) => ({
      reschedule: { phase: 'reviewing', dialogOpen: true, selectedSlotId: slotId },
      pendingAction: { type: 'reschedule', appointmentId: state.appointment.id, slotId },
      uiRevision: state.uiRevision + 1,
      rescheduleRevision: state.rescheduleRevision + 1,
      recentHumanOverrides:
        actor === 'you'
          ? [...state.recentHumanOverrides, { field: 'selectedRescheduleSlot', value: slotId, timestamp: Date.now() }].slice(-8)
          : state.recentHumanOverrides,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(
          actor,
          'slot_selected',
          `${actor === 'guide' ? 'Guide selected' : 'You selected'} ${slot.dateLabel} at ${slot.time}`,
        ),
      ),
    }));
    return true;
  },

  backToRescheduleChoices: (actor) => {
    const state = get();
    if (!state.reschedule.dialogOpen || state.reschedule.phase !== 'reviewing') return;
    set((current) => ({
      reschedule: { phase: 'choosing', dialogOpen: true, selectedSlotId: null },
      pendingAction: null,
      uiRevision: current.uiRevision + 1,
      rescheduleRevision: current.rescheduleRevision + 1,
      recentHumanOverrides:
        actor === 'you'
          ? [...current.recentHumanOverrides, { field: 'selectedRescheduleSlot', value: 'cleared', timestamp: Date.now() }].slice(-8)
          : current.recentHumanOverrides,
      activityLog: appendEvent(
        current.activityLog,
        makeEvent(actor, 'reschedule_back', `${actor === 'guide' ? 'Guide returned' : 'You returned'} to available appointment times`),
      ),
    }));
  },

  confirmReschedule: (slotId, actor) => {
    const state = get();
    const slot = rescheduleSlots.find((candidate) => candidate.id === slotId);
    if (!slot || state.reschedule.selectedSlotId !== slotId || !state.reschedule.dialogOpen) return false;

    set((current) => {
      const changedAppointment = {
        ...current.appointment,
        date: slot.date,
        dateLabel: slot.dateLabel,
        time: slot.time,
      };
      return {
        appointment: changedAppointment,
        appointmentUndo: { previous: { ...current.appointment }, changed: changedAppointment },
        reschedule: { phase: 'complete', dialogOpen: true, selectedSlotId: slotId },
        pendingAction: null,
        uiRevision: current.uiRevision + 1,
        rescheduleRevision: current.rescheduleRevision + 1,
        activityLog: appendEvent(
          current.activityLog,
          makeEvent(
            actor,
            'reschedule_confirmed',
            `${actor === 'guide' ? 'Guide confirmed' : 'You confirmed'} the appointment change to ${slot.dateLabel} at ${slot.time}`,
          ),
        ),
      };
    });
    return true;
  },

  undoReschedule: (actor) => {
    const state = get();
    const undo = state.appointmentUndo;
    if (!undo || state.reschedule.phase !== 'complete') return false;
    if (
      state.appointment.date !== undo.changed.date ||
      state.appointment.time !== undo.changed.time
    ) return false;

    set((current) => ({
      appointment: { ...undo.previous },
      appointmentUndo: null,
      reschedule: { phase: 'undone', dialogOpen: true, selectedSlotId: null },
      pendingAction: null,
      uiRevision: current.uiRevision + 1,
      rescheduleRevision: current.rescheduleRevision + 1,
      activityLog: appendEvent(
        current.activityLog,
        makeEvent(actor, 'reschedule_undone', `${actor === 'guide' ? 'Guide restored' : 'You restored'} the previous appointment time`),
      ),
    }));
    return true;
  },

  applyFunctionalProfile: (profile, actor, remember) => {
    set((state) => ({
      functionalProfile: profile,
      rememberPreferences: remember,
      manifestRevision: state.manifestRevision + 1,
      uiRevision: state.uiRevision + 1,
      recentHumanOverrides:
        actor === 'you'
          ? [
              ...state.recentHumanOverrides,
              { field: 'functionalProfile.input.minimumTargetSize', value: profile.input.minimumTargetSize, timestamp: Date.now() },
              { field: 'functionalProfile.input.minimumControlGap', value: profile.input.minimumControlGap, timestamp: Date.now() },
            ].slice(-8)
          : state.recentHumanOverrides,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(
          actor,
          'profile_approved',
          `${actor === 'guide' ? 'Guide applied' : 'You approved'} target size ${profile.input.minimumTargetSize}px and spacing ${profile.input.minimumControlGap}px`,
        ),
      ),
    }));
    const current = get();
    if (remember) {
      writeRememberedPreferences({
        version: 1,
        profile: current.functionalProfile!,
        componentOverrides: current.componentOverrides,
      });
    } else {
      clearRememberedPreferences();
    }
  },

  applyTaskExperience: (experience, accessibilityPatch, openWorkflow, actor) => {
    const before = get();
    const accessibilityEntries = Object.entries(accessibilityPatch).filter(
      ([key, value]) => before.accessibility[key as keyof AccessibilitySettings] !== value,
    ) as Array<[TaskAccessibilityKey, AccessibilitySettings[TaskAccessibilityKey]]>;
    const publicBefore = before.taskExperience
      ? {
          goal: before.taskExperience.goal,
          assistanceLevel: before.taskExperience.assistanceLevel,
          informationDensity: before.taskExperience.informationDensity,
          languageStyle: before.taskExperience.languageStyle,
          workflowLayout: before.taskExperience.workflowLayout,
          navigationPresentation: before.taskExperience.navigationPresentation,
          guideVisibility: before.taskExperience.guideVisibility,
          timeSelection: before.taskExperience.timeSelection,
          regionAdjustments: before.taskExperience.regionAdjustments,
        }
      : null;
    const experienceChanged = JSON.stringify(publicBefore) !== JSON.stringify(experience);
    const shouldNavigate = before.currentSection !== 'appointments';
    const shouldOpenWorkflow = openWorkflow && !before.reschedule.dialogOpen;
    if (!experienceChanged && accessibilityEntries.length === 0 && !shouldNavigate && !shouldOpenWorkflow) {
      return false;
    }

    set((state) => {
      const previousAccessibility = { ...(state.taskExperience?.previousAccessibility ?? {}) };
      const temporaryAccessibilityKeys = new Set(
        state.taskExperience?.temporaryAccessibilityKeys ?? [],
      );
      for (const [key] of accessibilityEntries) {
        if (!temporaryAccessibilityKeys.has(key)) {
          previousAccessibility[key] = state.accessibility[key] as never;
        }
        temporaryAccessibilityKeys.add(key);
      }

      const nextAccessibility = { ...state.accessibility, ...accessibilityPatch };
      const nextTaskExperience: ActiveTaskExperience = {
        ...experience,
        previousAccessibility,
        temporaryAccessibilityKeys: [...temporaryAccessibilityKeys],
      };
      const nextReschedule = shouldOpenWorkflow
        ? { phase: 'choosing' as const, dialogOpen: true, selectedSlotId: null }
        : state.reschedule;

      return {
        currentSection: 'appointments',
        accessibility: nextAccessibility,
        taskExperience: nextTaskExperience,
        reschedule: nextReschedule,
        pendingAction: shouldOpenWorkflow ? null : state.pendingAction,
        appointmentUndo: shouldOpenWorkflow ? null : state.appointmentUndo,
        manifestRevision: state.manifestRevision + 1,
        uiRevision: state.uiRevision + 1,
        navigationRevision: shouldNavigate
          ? state.navigationRevision + 1
          : state.navigationRevision,
        rescheduleRevision: shouldOpenWorkflow
          ? state.rescheduleRevision + 1
          : state.rescheduleRevision,
        activityLog: appendEvent(
          state.activityLog,
          makeEvent(
            actor,
            'interface_personalized',
            `${actor === 'guide' ? 'Guide personalized' : 'You personalized'} the interface for appointment rescheduling`,
          ),
        ),
      };
    });
    return true;
  },

  clearTaskExperience: (actor) => {
    const before = get();
    if (!before.taskExperience) return false;
    const restoredAccessibility = { ...before.accessibility };
    for (const key of before.taskExperience.temporaryAccessibilityKeys) {
      const previous = before.taskExperience.previousAccessibility[key];
      if (previous !== undefined) {
        (restoredAccessibility as Record<string, unknown>)[key] = previous;
      }
    }
    set((state) => ({
      accessibility: restoredAccessibility,
      taskExperience: null,
      manifestRevision: state.manifestRevision + 1,
      uiRevision: state.uiRevision + 1,
      recentHumanOverrides: actor === 'you'
        ? [...state.recentHumanOverrides, {
            field: 'taskExperience',
            value: 'cleared',
            timestamp: Date.now(),
          }].slice(-8)
        : state.recentHumanOverrides,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(
          actor,
          'task_presentation_restored',
          `${actor === 'guide' ? 'Guide restored' : 'You restored'} the previous portal presentation`,
        ),
      ),
    }));
    return true;
  },

  setComponentAdaptation: (component, patch, actor) => {
    const sanitized = sanitizeComponentAdaptation(component, patch);
    const previous = get().componentOverrides[component] ?? {};
    const changed = Object.entries(sanitized).filter(
      ([key, value]) => previous[key as keyof ComponentAdaptation] !== value,
    );
    if (changed.length === 0) return;

    set((state) => ({
      componentOverrides: {
        ...state.componentOverrides,
        [component]: { ...previous, ...sanitized },
      },
      manifestRevision: state.manifestRevision + 1,
      uiRevision: state.uiRevision + 1,
      recentHumanOverrides:
        actor === 'you'
          ? [
              ...state.recentHumanOverrides,
              ...changed.map(([field, value]) => ({
                field: `componentOverrides.${component}.${field}`,
                value: value as string | number | boolean,
                timestamp: Date.now(),
              })),
            ].slice(-8)
          : state.recentHumanOverrides,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(actor, 'component_personalized', `${actor === 'guide' ? 'Guide changed' : 'You changed'} ${component.replaceAll('_', ' ')}`),
      ),
    }));
    const current = get();
    if (current.rememberPreferences && current.functionalProfile) {
      writeRememberedPreferences({
        version: 1,
        profile: current.functionalProfile,
        componentOverrides: current.componentOverrides,
      });
    }
  },

  resetComponentAdaptation: (component, actor) => {
    if (!get().componentOverrides[component]) return;
    set((state) => {
      const next = { ...state.componentOverrides };
      delete next[component];
      return {
        componentOverrides: next,
        manifestRevision: state.manifestRevision + 1,
        uiRevision: state.uiRevision + 1,
        recentHumanOverrides:
          actor === 'you'
            ? [...state.recentHumanOverrides, { field: `componentOverrides.${component}`, value: 'reset', timestamp: Date.now() }].slice(-8)
            : state.recentHumanOverrides,
        activityLog: appendEvent(
          state.activityLog,
          makeEvent(actor, 'component_personalized', `${actor === 'guide' ? 'Guide reset' : 'You reset'} ${component.replaceAll('_', ' ')}`),
        ),
      };
    });
  },

  openInsuranceUpdate: (actor) => {
    if (get().insuranceUpdateOpen) return;
    set((state) => ({
      currentSection: 'insurance',
      insuranceUpdateOpen: true,
      insuranceUpdateSaved: false,
      uiRevision: state.uiRevision + 1,
      navigationRevision:
        state.currentSection === 'insurance' ? state.navigationRevision : state.navigationRevision + 1,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(actor, 'insurance_update_opened', `${actor === 'guide' ? 'Guide opened' : 'You opened'} insurance update`),
      ),
    }));
  },

  closeInsuranceUpdate: () => {
    if (!get().insuranceUpdateOpen) return;
    set((state) => ({
      insuranceUpdateOpen: false,
      uiRevision: state.uiRevision + 1,
    }));
  },

  saveInsuranceUpdate: (actor) => {
    if (get().insuranceUpdateSaved) return;
    set((state) => ({
      insuranceUpdateSaved: true,
      uiRevision: state.uiRevision + 1,
      activityLog: appendEvent(
        state.activityLog,
        makeEvent(actor, 'insurance_update_saved', `${actor === 'guide' ? 'Guide saved' : 'You saved'} the fictional insurance update`),
      ),
    }));
  },

  setAgentPresence: (patch) => {
    set((state) => ({ agentPresence: { ...state.agentPresence, ...patch } }));
  },

  recordActivity: (actor, type, message) => {
    set((state) => ({ activityLog: appendEvent(state.activityLog, makeEvent(actor, type, message)) }));
  },

  resetDemo: () => {
    eventSequence = 0;
    clearRememberedPreferences();
    set((state) => ({
      currentSection: 'home',
      appointment: { ...originalAppointment },
      reschedule: { ...initialReschedule },
      accessibility: { ...defaultAccessibility },
      agentPresence: { ...hiddenPresence, operationId: state.agentPresence.operationId + 1 },
      activityLog: [],
      recentHumanOverrides: [],
      pendingAction: null,
      functionalProfile: null,
      taskExperience: null,
      componentOverrides: {},
      rememberPreferences: false,
      manifestRevision: state.manifestRevision + 1,
      uiRevision: state.uiRevision + 1,
      navigationRevision: state.navigationRevision + 1,
      rescheduleRevision: state.rescheduleRevision + 1,
      insuranceUpdateOpen: false,
      insuranceUpdateSaved: false,
      appointmentUndo: null,
    }));
  },
}));

export function semanticTargetForSlot(slotId: string): SemanticTarget | null {
  const mapping: Record<string, SemanticTarget> = {
    slot_2026_09_11_0900: 'appointment_slot_sep_11',
    slot_2026_09_12_1130: 'appointment_slot_sep_12',
    slot_2026_09_14_1500: 'appointment_slot_sep_14',
  };
  return mapping[slotId] ?? null;
}
