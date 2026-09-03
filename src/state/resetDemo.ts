import { cancelGuidePresence } from '../presence/presenceController';
import { useSimulationStore } from '../simulation/simulationStore';
import { usePortalStore } from './portalStore';

export function resetDemoExperience() {
  cancelGuidePresence();
  useSimulationStore.getState().resetSimulation();
  usePortalStore.getState().resetDemo();
}
