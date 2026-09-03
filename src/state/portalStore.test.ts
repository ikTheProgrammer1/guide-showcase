import { beforeEach, describe, expect, it } from 'vitest';
import { originalAppointment } from '../data/demoData';
import { defaultTaskExperience } from '../adaptation/types';
import { usePortalStore } from './portalStore';

describe('portalStore', () => {
  beforeEach(() => {
    usePortalStore.getState().resetDemo();
  });

  it('attributes human accessibility changes and exposes them as overrides', () => {
    const before = usePortalStore.getState();
    usePortalStore.getState().setAccessibility({ textScale: 175, density: 'simplified' }, 'guide');
    usePortalStore.getState().setAccessibility({ textScale: 150 }, 'you');

    const state = usePortalStore.getState();
    expect(state.accessibility.textScale).toBe(150);
    expect(state.recentHumanOverrides.at(-1)).toMatchObject({ field: 'textScale', value: 150 });
    expect(state.activityLog.at(-1)).toMatchObject({ actor: 'you', type: 'accessibility' });
    expect(state.uiRevision).toBe(before.uiRevision + 2);
    expect(state.navigationRevision).toBe(before.navigationRevision);
    expect(state.rescheduleRevision).toBe(before.rescheduleRevision);
  });

  it('preserves omitted accessibility settings and revisions for a no-op patch', () => {
    const state = usePortalStore.getState();
    state.setAccessibility({ contrast: 'high', spacing: 'increased' }, 'guide');
    const beforeNoOp = usePortalStore.getState();

    beforeNoOp.setAccessibility({ contrast: 'high' }, 'guide');
    const afterNoOp = usePortalStore.getState();

    expect(afterNoOp.accessibility).toMatchObject({ contrast: 'high', spacing: 'increased' });
    expect(afterNoOp.uiRevision).toBe(beforeNoOp.uiRevision);
    expect(afterNoOp.activityLog).toHaveLength(beforeNoOp.activityLog.length);
  });

  it('tracks navigation independently from appointment workflow revisions', () => {
    const before = usePortalStore.getState();
    before.openSection('appointments', 'guide');
    const navigated = usePortalStore.getState();

    expect(navigated.uiRevision).toBe(before.uiRevision + 1);
    expect(navigated.navigationRevision).toBe(before.navigationRevision + 1);
    expect(navigated.rescheduleRevision).toBe(before.rescheduleRevision);
  });

  it('prepares a slot without committing it', () => {
    const state = usePortalStore.getState();
    state.openReschedule('guide');
    expect(state.selectRescheduleSlot('slot_2026_09_14_1500', 'guide')).toBe(true);

    const selected = usePortalStore.getState();
    expect(selected.appointment).toEqual(originalAppointment);
    expect(selected.reschedule.phase).toBe('reviewing');
    expect(selected.pendingAction?.slotId).toBe('slot_2026_09_14_1500');
  });

  it('rejects a stale confirmation rather than overwriting the current selection', () => {
    const state = usePortalStore.getState();
    state.openReschedule('guide');
    state.selectRescheduleSlot('slot_2026_09_12_1130', 'guide');
    state.selectRescheduleSlot('slot_2026_09_14_1500', 'you');

    expect(usePortalStore.getState().confirmReschedule('slot_2026_09_12_1130', 'guide')).toBe(false);
    expect(usePortalStore.getState().appointment.date).toBe('2026-09-10');
  });

  it('keeps a selected appointment valid through an accessibility reflow', () => {
    const state = usePortalStore.getState();
    state.openReschedule('guide');
    state.selectRescheduleSlot('slot_2026_09_14_1500', 'you');
    const selected = usePortalStore.getState();

    selected.setAccessibility({ textScale: 175, density: 'simplified' }, 'you');
    const adapted = usePortalStore.getState();

    expect(adapted.uiRevision).toBe(selected.uiRevision + 1);
    expect(adapted.rescheduleRevision).toBe(selected.rescheduleRevision);
    expect(adapted.reschedule.selectedSlotId).toBe('slot_2026_09_14_1500');
    expect(adapted.confirmReschedule('slot_2026_09_14_1500', 'guide')).toBe(true);
  });

  it('supports Back, explicit confirmation, and human Undo without stale rollback', () => {
    const state = usePortalStore.getState();
    state.openReschedule('you');
    state.selectRescheduleSlot('slot_2026_09_12_1130', 'you');
    state.backToRescheduleChoices('you');

    expect(usePortalStore.getState().reschedule).toMatchObject({ phase: 'choosing', selectedSlotId: null });
    expect(usePortalStore.getState().pendingAction).toBeNull();

    usePortalStore.getState().selectRescheduleSlot('slot_2026_09_14_1500', 'you');
    expect(usePortalStore.getState().confirmReschedule('slot_2026_09_14_1500', 'guide')).toBe(true);
    expect(usePortalStore.getState().appointment.date).toBe('2026-09-14');
    expect(usePortalStore.getState().undoReschedule('you')).toBe(true);
    expect(usePortalStore.getState().appointment).toEqual(originalAppointment);
    expect(usePortalStore.getState().reschedule.phase).toBe('undone');
    expect(usePortalStore.getState().activityLog.at(-1)).toMatchObject({ actor: 'you', type: 'reschedule_undone' });
  });

  it('keeps bounded human component overrides above an approved profile', () => {
    const state = usePortalStore.getState();
    state.applyFunctionalProfile({
      version: 1,
      input: {
        preferredMethod: 'pointer',
        minimumTargetSize: 64,
        minimumControlGap: 24,
        accidentalActivationProtection: 'review',
        focusVisibility: 'enhanced',
      },
      presentation: { density: 'focused' },
    }, 'you', false);
    state.setComponentAdaptation('appointment_actions', { minimumTargetSize: 52 }, 'you');

    expect(usePortalStore.getState().componentOverrides.appointment_actions).toEqual({ minimumTargetSize: 52 });
    expect(usePortalStore.getState().recentHumanOverrides.at(-1)).toMatchObject({
      field: 'componentOverrides.appointment_actions.minimumTargetSize',
      value: 52,
    });
  });

  it('applies a complete task experience immediately without choosing a time', () => {
    const state = usePortalStore.getState();
    const changed = state.applyTaskExperience(
      defaultTaskExperience,
      {
        controlSize: 'large',
        spacing: 'increased',
        colorIndependentStatus: true,
        emphasizeInteractive: true,
      },
      true,
      'guide',
    );
    const personalized = usePortalStore.getState();

    expect(changed).toBe(true);
    expect(personalized.currentSection).toBe('appointments');
    expect(personalized.taskExperience).toMatchObject(defaultTaskExperience);
    expect(personalized.accessibility).toMatchObject({
      controlSize: 'large',
      spacing: 'increased',
      colorIndependentStatus: true,
      emphasizeInteractive: true,
    });
    expect(personalized.reschedule).toMatchObject({
      phase: 'choosing',
      dialogOpen: true,
      selectedSlotId: null,
    });
    expect(personalized.appointment).toEqual(originalAppointment);
    expect(personalized.activityLog.at(-1)).toMatchObject({
      actor: 'guide',
      type: 'interface_personalized',
    });
  });

  it('refines the task layout without invalidating a valid human selection', () => {
    const state = usePortalStore.getState();
    state.applyTaskExperience(defaultTaskExperience, {}, true, 'guide');
    usePortalStore.getState().selectRescheduleSlot('slot_2026_09_14_1500', 'you');
    const selected = usePortalStore.getState();

    selected.applyTaskExperience(
      { ...defaultTaskExperience, workflowLayout: 'one-page' },
      {},
      true,
      'guide',
    );
    const refined = usePortalStore.getState();
    expect(refined.taskExperience?.workflowLayout).toBe('one-page');
    expect(refined.reschedule.selectedSlotId).toBe('slot_2026_09_14_1500');
    expect(refined.rescheduleRevision).toBe(selected.rescheduleRevision);
  });

  it('restores only temporary task accessibility and preserves a later human override', () => {
    const state = usePortalStore.getState();
    state.applyTaskExperience(
      defaultTaskExperience,
      { controlSize: 'large', spacing: 'increased' },
      true,
      'guide',
    );
    usePortalStore.getState().setAccessibility({ controlSize: 'standard' }, 'you');
    usePortalStore.getState().clearTaskExperience('you');

    const restored = usePortalStore.getState();
    expect(restored.taskExperience).toBeNull();
    expect(restored.accessibility.controlSize).toBe('standard');
    expect(restored.accessibility.spacing).toBe('standard');
    expect(restored.recentHumanOverrides.find((override) => override.field === 'controlSize')).toMatchObject({
      field: 'controlSize',
      value: 'standard',
    });
  });

  it('resets every demo subsystem without adding a reset activity item', () => {
    const state = usePortalStore.getState();
    const revisions = {
      ui: state.uiRevision,
      navigation: state.navigationRevision,
      reschedule: state.rescheduleRevision,
    };
    state.openSection('billing', 'you');
    state.setAccessibility({ contrast: 'high', colorIndependentStatus: true, readAloud: true }, 'you');
    state.openInsuranceUpdate('guide');
    state.resetDemo();

    const reset = usePortalStore.getState();
    expect(reset.currentSection).toBe('home');
    expect(reset.appointment).toEqual(originalAppointment);
    expect(reset.accessibility).toMatchObject({
      textScale: 100,
      contrast: 'standard',
      colorIndependentStatus: false,
      readAloud: false,
    });
    expect(reset.reschedule).toMatchObject({ phase: 'idle', dialogOpen: false, selectedSlotId: null });
    expect(reset.insuranceUpdateOpen).toBe(false);
    expect(reset.activityLog).toEqual([]);
    expect(reset.recentHumanOverrides).toEqual([]);
    expect(reset.taskExperience).toBeNull();
    expect(reset.uiRevision).toBeGreaterThan(revisions.ui);
    expect(reset.navigationRevision).toBeGreaterThan(revisions.navigation);
    expect(reset.rescheduleRevision).toBeGreaterThan(revisions.reschedule);
  });
});
