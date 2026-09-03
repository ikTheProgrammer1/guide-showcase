import { beforeEach, describe, expect, it } from 'vitest';
import { useCalibrationStore } from '../calibration/calibrationStore';
import { useSimulationStore } from '../simulation/simulationStore';
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
    useCalibrationStore.getState().resetCalibration();
    useSimulationStore.getState().resetSimulation();
  });

  it('publishes the complete static semantic surface with truthful read-only hints', () => {
    const tools = createStaticTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      'get_portal_state',
      'get_northstar_context',
      'personalize_for_task',
      'configure_accessibility',
      'start_interface_calibration',
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
    const calibrationTool = tools.find((tool) => tool.name === 'start_interface_calibration');
    expect(stateTool?.annotations?.readOnlyHint).toBe(true);
    expect(guideTool?.annotations?.readOnlyHint).toBe(false);
    expect(calibrationTool?.annotations?.readOnlyHint).toBe(false);
    expect(tools.find((tool) => tool.name === 'get_northstar_context')?.annotations?.readOnlyHint).toBe(true);
    expect(tools.find((tool) => tool.name === 'personalize_for_task')?.annotations?.readOnlyHint).toBe(false);
  });

  it('exposes complete workflow context including blocked future actions and human decisions', async () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'get_northstar_context')!;
    const result = await tool.execute({}, { signal }) as {
      context: {
        rescheduleWorkflow: {
          decisionOwner: string;
          steps: Array<{
            id: string;
            status: string;
            consequential: boolean;
            requiresExplicitDelegation?: boolean;
          }>;
        };
        supportedAdaptations: { arbitraryDomOrCodeAllowed: boolean };
      };
    };
    const confirm = result.context.rescheduleWorkflow.steps.find(
      (step) => step.id === 'confirm_replacement',
    );

    expect(confirm).toMatchObject({
      status: 'blocked',
      consequential: true,
      requiresExplicitDelegation: true,
    });
    expect(result.context.supportedAdaptations.arbitraryDomOrCodeAllowed).toBe(false);
  });

  it('reports completed choice, review, and confirmation steps after a commit', async () => {
    const store = usePortalStore.getState();
    store.openReschedule('you');
    usePortalStore.getState().selectRescheduleSlot('slot_2026_09_14_1500', 'you');
    usePortalStore.getState().confirmReschedule('slot_2026_09_14_1500', 'guide');
    const tool = createStaticTools().find((candidate) => candidate.name === 'get_northstar_context')!;
    const result = await tool.execute({}, { signal }) as {
      context: { rescheduleWorkflow: { steps: Array<{ id: string; status: string }> } };
    };
    const statuses = Object.fromEntries(
      result.context.rescheduleWorkflow.steps.map((step) => [step.id, step.status]),
    );

    expect(statuses).toMatchObject({
      choose_replacement_time: 'complete',
      review_change: 'complete',
      confirm_replacement: 'complete',
      undo_change: 'available',
    });
  });

  it('uses one bounded call to personalize and open the chooser without selecting or committing', async () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'personalize_for_task')!;
    const executeWithoutOptions = tool.execute as (
      input: Record<string, unknown>,
    ) => Promise<unknown>;
    const result = await executeWithoutOptions({
      goal: 'reschedule_appointment',
      assistanceLevel: 'collaborate',
      informationDensity: 'focused',
      languageStyle: 'plain',
      workflowLayout: 'step-by-step',
      navigationPresentation: 'focused',
      timeSelection: 'person',
      openWorkflow: true,
    });
    const state = usePortalStore.getState();

    expect(result).toMatchObject({
      ok: true,
      interfaceMode: 'adapted',
      chooserOpen: true,
      selectedSlot: null,
      committed: false,
      presentedVisually: true,
    });
    expect(state.taskExperience).toMatchObject({
      goal: 'reschedule_appointment',
      languageStyle: 'plain',
      informationDensity: 'focused',
      timeSelection: 'person',
    });
    expect(state.reschedule).toMatchObject({ phase: 'choosing', selectedSlotId: null });
    expect(state.appointment.date).toBe('2026-09-10');
  });

  it('keeps task personalization bounded to semantic enums without DOM or code parameters', () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'personalize_for_task')!;
    const schema = tool.inputSchema as {
      properties: {
        regionAdjustments: {
          maxItems: number;
          items: { properties: Record<string, unknown>; additionalProperties: boolean };
        };
      };
      additionalProperties: boolean;
    };
    const serialized = JSON.stringify(schema);

    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.regionAdjustments.maxItems).toBe(6);
    expect(schema.properties.regionAdjustments.items.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties.regionAdjustments.items.properties)).toContain('region');
    expect(serialized).not.toMatch(/selector|css|html|coordinate|javascript|domMutation/i);
  });

  it('ignores invalid direct-call region values even if a client skips schema validation', async () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'personalize_for_task')!;
    const result = await tool.execute({
      goal: 'reschedule_appointment',
      guideVisibility: 'minimal',
      workflowLayout: 'freeform',
      regionAdjustments: [
        { region: 'unknown_region', placement: 'top-left', css: 'display:none' },
        { region: 'appointment_actions', placement: 'top-left', layout: 'freeform' },
      ],
    } as never, { signal });

    expect(result).toMatchObject({ ok: true });
    expect(usePortalStore.getState().taskExperience).toMatchObject({
      workflowLayout: 'step-by-step',
      regionAdjustments: { appointment_actions: {} },
    });
  });

  it('keeps show-level personalization non-activating unless workflow opening is explicit', async () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'personalize_for_task')!;
    const result = await tool.execute({
      goal: 'reschedule_appointment',
      assistanceLevel: 'show',
      guideVisibility: 'minimal',
    }, { signal });

    expect(result).toMatchObject({ ok: true, chooserOpen: false, committed: false });
    expect(usePortalStore.getState()).toMatchObject({
      currentSection: 'appointments',
      reschedule: { dialogOpen: false, selectedSlotId: null },
    });
  });

  it('preserves newer manual presentation choices over inferred task defaults', async () => {
    const state = usePortalStore.getState();
    state.setAccessibility({ controlSize: 'large', density: 'simplified' }, 'you');
    usePortalStore.getState().setAccessibility({ controlSize: 'standard', density: 'standard' }, 'you');
    const tool = createStaticTools().find((candidate) => candidate.name === 'personalize_for_task')!;

    await tool.execute({
      goal: 'reschedule_appointment',
      guideVisibility: 'minimal',
    }, { signal });

    expect(usePortalStore.getState().accessibility.controlSize).toBe('standard');
    expect(usePortalStore.getState().taskExperience?.informationDensity).toBe('balanced');
  });

  it('keeps agent slot selection blocked when the task reserves the decision for the person', async () => {
    usePortalStore.getState().applyTaskExperience(
      {
        goal: 'reschedule_appointment',
        assistanceLevel: 'collaborate',
        informationDensity: 'focused',
        languageStyle: 'plain',
        workflowLayout: 'step-by-step',
        navigationPresentation: 'focused',
        guideVisibility: 'visible',
        timeSelection: 'person',
        regionAdjustments: {},
      },
      {},
      true,
      'guide',
    );
    const result = await createSelectSlotTool().execute(
      {
        appointmentId: 'appointment_robert_2026_09_10',
        slotId: 'slot_2026_09_14_1500',
      },
      { signal },
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'human_decision_required' },
    });
    expect(usePortalStore.getState().reschedule.selectedSlotId).toBeNull();
  });

  it('exposes one bounded calibration tool with no diagnosis or DOM parameters', () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'start_interface_calibration');
    const schema = tool?.inputSchema as {
      properties: Record<string, { enum: string[] }>;
      required: string[];
      additionalProperties: boolean;
    };

    expect(Object.keys(schema.properties)).toEqual(['domain', 'goal']);
    expect(schema.properties.domain.enum).toEqual(['pointer_precision']);
    expect(schema.properties.goal.enum).toEqual(['reschedule_appointment']);
    expect(schema.required).toEqual(['domain', 'goal']);
    expect(schema.additionalProperties).toBe(false);
    expect(JSON.stringify(schema)).not.toMatch(/diagnosis|parkinson|selector|css|html|coordinate|"x"|"y"/i);
  });

  it('opens calibration immediately and leaves repeated attempts to the webpage', async () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'start_interface_calibration')!;
    const result = await tool.execute(
      { domain: 'pointer_precision', goal: 'reschedule_appointment' },
      { signal },
    );

    expect(result).toMatchObject({
      ok: true,
      domain: 'pointer_precision',
      goal: 'reschedule_appointment',
      phase: 'target-size',
      localPractice: true,
      profileApplied: false,
      presentedVisually: true,
    });
    expect(useCalibrationStore.getState()).toMatchObject({ isOpen: true, startedBy: 'guide' });
    expect(usePortalStore.getState().functionalProfile).toBeNull();
  });

  it('opens calibration when the WebMCP client omits execution options', async () => {
    const tool = createStaticTools().find((candidate) => candidate.name === 'start_interface_calibration')!;
    const executeWithoutOptions = tool.execute as (
      input: Record<string, unknown>,
    ) => Promise<unknown>;

    const result = await executeWithoutOptions({
      domain: 'pointer_precision',
      goal: 'reschedule_appointment',
    });

    expect(result).toMatchObject({
      ok: true,
      phase: 'target-size',
      presentedVisually: true,
    });
    expect(useCalibrationStore.getState()).toMatchObject({
      isOpen: true,
      phase: 'target-size',
      startedBy: 'guide',
    });
  });

  it('does not open calibration when execution was already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const tool = createStaticTools().find((candidate) => candidate.name === 'start_interface_calibration')!;
    const result = await tool.execute(
      { domain: 'pointer_precision', goal: 'reschedule_appointment' },
      { signal: controller.signal },
    );

    expect(result).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(useCalibrationStore.getState().isOpen).toBe(false);
  });

  it('reports approved component personalization without leaking calibration or simulator state', async () => {
    useSimulationStore.getState().activateSimulation('parkinsons');
    usePortalStore.getState().setComponentAdaptation('appointment_actions', { minimumTargetSize: 64 }, 'you');
    const tool = createStaticTools().find((candidate) => candidate.name === 'get_portal_state')!;
    const result = await tool.execute({}, { signal });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      ok: true,
      state: {
        interfaceMode: 'adapted',
        personalization: {
          componentOverrides: { appointment_actions: { minimumTargetSize: 64 } },
        },
      },
    });
    expect(serialized).not.toMatch(/parkinson|activeSimulation|aggregates|missDistance|calibrationId/);
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
