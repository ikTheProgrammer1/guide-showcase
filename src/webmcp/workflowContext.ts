import { componentCapabilities } from '../adaptation/manifest';
import { assistanceLevels, semanticComponentIds } from '../adaptation/types';
import { rescheduleSlots } from '../data/demoData';
import type { PortalStore } from '../state/portalStore';

const assistanceDescriptions = {
  show: 'Identify the relevant place without activating it.',
  explain: 'Explain what a control does and what would happen.',
  guide: 'Focus the interface around the goal and present the next safe step.',
  collaborate: 'Prepare the workflow, share turns, and pause for meaningful human decisions.',
  act: 'Perform an explicitly authorized action after current-state validation and required review.',
} as const;

export function buildNorthstarContext(state: PortalStore) {
  const phase = state.reschedule.phase;
  const chooserOpen = state.reschedule.dialogOpen;
  const selectionMade = Boolean(state.reschedule.selectedSlotId);
  const committed = phase === 'complete';
  const choiceCompleted = selectionMade || committed;
  const selectionReservedForPerson = state.taskExperience?.timeSelection === 'person';

  return {
    site: {
      name: 'Northstar Health Patient Services',
      fictionalDemonstration: true,
      purpose: 'Demonstrate safe website-owned personalization and shared human-agent workflows.',
    },
    supportedGoals: [
      {
        id: 'reschedule_appointment',
        outcome: 'Replace the current fictional appointment time with one available time after review and confirmation.',
        currentInformation: {
          appointment: state.appointment,
          availableTimes: rescheduleSlots,
        },
      },
      { id: 'review_bill', outcome: 'Read the controlled fictional bill breakdown without financial advice.' },
      { id: 'review_insurance', outcome: 'Read the controlled fictional insurance status.' },
      { id: 'navigate_portal', outcome: 'Open one of the 7 portal sections.' },
      { id: 'personalize_interface', outcome: 'Compose bounded Northstar regions around a goal and presentation request.' },
    ],
    assistanceLevels: assistanceLevels.map((level) => ({
      level,
      description: assistanceDescriptions[level],
    })),
    rescheduleWorkflow: {
      goal: 'reschedule_appointment',
      currentPhase: phase,
      decisionOwner: selectionReservedForPerson ? 'person' : 'shared',
      steps: [
        {
          id: 'view_current_appointment',
          outcome: 'Understand the current appointment.',
          status: 'available',
          consequential: false,
        },
        {
          id: 'open_available_times',
          outcome: 'Open the non-committing chooser.',
          status: chooserOpen ? 'complete' : 'available',
          consequential: false,
        },
        {
          id: 'choose_replacement_time',
          outcome: 'Prepare one available time for review without changing the appointment.',
          status: choiceCompleted ? 'complete' : chooserOpen ? 'available' : 'blocked',
          blockedReason: chooserOpen ? null : 'Open the reschedule workflow first.',
          humanDecision: selectionReservedForPerson,
          consequential: false,
        },
        {
          id: 'review_change',
          outcome: 'Compare the current and proposed times.',
          status: committed ? 'complete' : selectionMade ? 'available' : 'blocked',
          blockedReason: choiceCompleted ? null : 'A replacement time must be selected first.',
          consequential: false,
        },
        {
          id: 'confirm_replacement',
          outcome: 'Commit the reviewed appointment change.',
          status: committed ? 'complete' : selectionMade ? 'available' : 'blocked',
          blockedReason: selectionMade ? null : 'A current valid selection and explicit delegation are required.',
          consequential: true,
          requiresExplicitDelegation: true,
          requiresFreshStateValidation: true,
          toolLifecycle: 'confirm_reschedule is registered only while a valid selection is under review.',
        },
        {
          id: 'undo_change',
          outcome: 'Restore the previous appointment after a completed change.',
          status: committed && state.appointmentUndo ? 'available' : phase === 'undone' ? 'complete' : 'blocked',
          blockedReason: committed && state.appointmentUndo ? null : 'No completed change is currently available to undo.',
          consequential: false,
        },
      ],
    },
    supportedAdaptations: {
      global: [
        'text scale',
        'contrast',
        'control size',
        'control spacing',
        'interactive emphasis',
        'color-independent status',
        'optional Guide read-aloud',
      ],
      regions: semanticComponentIds.map((id) => ({
        id,
        label: componentCapabilities[id].label,
        supports: componentCapabilities[id].supports,
      })),
      taskPresentation: [
        'focused or full navigation',
        'plain or standard language',
        'focused, balanced, or detailed information',
        'step-by-step or one-page workflow',
        'visible or minimal Guide presence',
      ],
      arbitraryDomOrCodeAllowed: false,
    },
    safetyRules: [
      'A request to make the interface easier is not permission for a consequential action.',
      'The interface may reorganize presentation but cannot change data, permissions, workflows, warnings, or confirmation rules.',
      'Human changes override earlier agent preferences.',
      'A stale agent action cannot overwrite a newer human selection.',
      'Appointment selection and confirmation remain separate.',
      'Simulator state and calibration attempts are excluded from WebMCP portal context.',
    ],
  };
}
