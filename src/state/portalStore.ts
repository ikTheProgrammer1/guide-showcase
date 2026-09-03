import { create } from 'zustand';
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

interface PortalStore {
  currentSection: PortalSection;
  appointment: Appointment;
  reschedule: RescheduleState;
  accessibility: AccessibilitySettings;
  agentPresence: AgentPresenceState;
  activityLog: ActivityEvent[];
  recentHumanOverrides: HumanOverride[];
  pendingAction: PendingAction | null;
  uiRevision: number;
  navigationRevision: number;
  rescheduleRevision: number;
  insuranceUpdateOpen: boolean;
  insuranceUpdateSaved: boolean;
  openSection: (section: PortalSection, actor: Actor) => void;
  setAccessibility: (patch: Partial<AccessibilitySettings>, actor: Actor) => void;
  openReschedule: (actor: Actor) => void;
  closeReschedule: (actor: Actor) => void;
  selectRescheduleSlot: (slotId: string, actor: Actor) => boolean;
  confirmReschedule: (slotId: string, actor: Actor) => boolean;
  openInsuranceUpdate: (actor: Actor) => void;
  closeInsuranceUpdate: (actor: Actor) => void;
  saveInsuranceUpdate: (actor: Actor) => void;
  setAgentPresence: (patch: Partial<AgentPresenceState>) => void;
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
  uiRevision: 0,
  navigationRevision: 0,
  rescheduleRevision: 0,
  insuranceUpdateOpen: false,
  insuranceUpdateSaved: false,

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

      return {
        accessibility: nextAccessibility,
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

  confirmReschedule: (slotId, actor) => {
    const state = get();
    const slot = rescheduleSlots.find((candidate) => candidate.id === slotId);
    if (!slot || state.reschedule.selectedSlotId !== slotId || !state.reschedule.dialogOpen) return false;

    set((current) => ({
      appointment: {
        ...current.appointment,
        date: slot.date,
        dateLabel: slot.dateLabel,
        time: slot.time,
      },
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
    }));
    return true;
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

  resetDemo: () => {
    eventSequence = 0;
    set((state) => ({
      currentSection: 'home',
      appointment: { ...originalAppointment },
      reschedule: { ...initialReschedule },
      accessibility: { ...defaultAccessibility },
      agentPresence: { ...hiddenPresence, operationId: state.agentPresence.operationId + 1 },
      activityLog: [],
      recentHumanOverrides: [],
      pendingAction: null,
      uiRevision: state.uiRevision + 1,
      navigationRevision: state.navigationRevision + 1,
      rescheduleRevision: state.rescheduleRevision + 1,
      insuranceUpdateOpen: false,
      insuranceUpdateSaved: false,
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
