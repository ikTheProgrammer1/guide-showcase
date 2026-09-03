import { beforeEach, describe, expect, it } from 'vitest';
import { usePortalStore } from '../state/portalStore';
import {
  accessibilityKeys,
  createConfirmTool,
  createSelectSlotTool,
  createStaticTools,
  semanticTargets,
} from './toolDefinitions';

const signal = new AbortController().signal;

describe('WebMCP tool contracts', () => {
  beforeEach(() => {
    usePortalStore.getState().resetDemo();
  });

  it('publishes the complete static semantic surface with truthful read-only hints', () => {
    const tools = createStaticTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      'get_portal_state',
      'configure_accessibility',
      'guide_to',
      'open_section',
      'get_upcoming_appointments',
      'get_reschedule_options',
      'open_reschedule',
      'select_reschedule_slot',
      'get_bill_details',
      'get_insurance_status',
    ]);

    const stateTool = tools.find((tool) => tool.name === 'get_portal_state');
    const guideTool = tools.find((tool) => tool.name === 'guide_to');
    expect(stateTool?.annotations?.readOnlyHint).toBe(true);
    expect(guideTool?.annotations?.readOnlyHint).toBe(false);
  });

  it('uses bounded enum-only semantic targets', () => {
    const guideTool = createStaticTools().find((tool) => tool.name === 'guide_to');
    const schema = guideTool?.inputSchema as {
      properties: {
        target: { enum: string[]; oneOf: Array<{ const: string; title: string; description: string }> };
        message: { maxLength: number };
      };
      additionalProperties: boolean;
    };
    expect(schema.properties.target.enum).toEqual(semanticTargets);
    expect(schema.properties.target.oneOf).toHaveLength(semanticTargets.length);
    expect(schema.properties.target.oneOf.every((target) => target.title && target.description)).toBe(true);
    expect(schema.properties.message.maxLength).toBe(180);
    expect(schema.additionalProperties).toBe(false);
  });

  it('accepts color-independent status as a composable accessibility setting', () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'configure_accessibility');
    const schema = tool?.inputSchema as {
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
      minProperties: number;
    };
    expect(schema.required).toBeUndefined();
    expect(schema.minProperties).toBe(1);
    expect(Object.keys(schema.properties)).toEqual(accessibilityKeys);
    expect(Object.values(schema.properties).every((property) => property.description.length > 0)).toBe(true);
    expect(schema.properties.colorIndependentStatus.type).toBe('boolean');
  });

  it('marks only controlled fictional tool results as trusted', () => {
    for (const tool of [...createStaticTools(), createConfirmTool()]) {
      expect(tool.annotations?.untrustedContentHint, tool.name).toBe(false);
    }
  });

  it('returns selection_changed when the requested confirmation is stale', async () => {
    const state = usePortalStore.getState();
    state.openReschedule('guide');
    state.selectRescheduleSlot('slot_2026_09_14_1500', 'you');

    const result = await createConfirmTool().execute(
      { appointmentId: state.appointment.id, slotId: 'slot_2026_09_12_1130' },
      { signal },
    );
    expect(result).toMatchObject({ ok: false, error: { code: 'selection_changed' } });
    expect(usePortalStore.getState().appointment.date).toBe('2026-09-10');
  });

  it('keeps slot selection and confirmation as separate mutating contracts', () => {
    expect(createSelectSlotTool().name).toBe('select_reschedule_slot');
    expect(createConfirmTool().name).toBe('confirm_reschedule');
    expect(createSelectSlotTool().annotations?.readOnlyHint).toBe(false);
    expect(createConfirmTool().annotations?.readOnlyHint).toBe(false);
  });

  it('returns a recoverable chooser_closed error before slot selection is available', async () => {
    const result = await createSelectSlotTool().execute(
      {
        appointmentId: 'appointment_robert_2026_09_10',
        slotId: 'slot_2026_09_14_1500',
      },
      { signal },
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'chooser_closed',
        message: 'Open the reschedule workflow before selecting a time.',
      },
    });
  });
});
