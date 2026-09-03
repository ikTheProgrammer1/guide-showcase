import { beforeEach, describe, expect, it } from 'vitest';
import { originalAppointment } from '../data/demoData';
import { usePortalStore } from './portalStore';

describe('portalStore', () => {
  beforeEach(() => {
    usePortalStore.getState().resetDemo();
  });

  it('attributes human accessibility changes and exposes them as overrides', () => {
    usePortalStore.getState().setAccessibility({ textScale: 175, density: 'simplified' }, 'guide');
    usePortalStore.getState().setAccessibility({ textScale: 150 }, 'you');

    const state = usePortalStore.getState();
    expect(state.accessibility.textScale).toBe(150);
    expect(state.recentHumanOverrides.at(-1)).toMatchObject({ field: 'textScale', value: 150 });
    expect(state.activityLog.at(-1)).toMatchObject({ actor: 'you', type: 'accessibility' });
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

  it('resets every demo subsystem without adding a reset activity item', () => {
    const state = usePortalStore.getState();
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
  });
});
