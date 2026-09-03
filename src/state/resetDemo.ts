import { cancelGuidePresence } from '../presence/presenceController';
import { useCalibrationStore } from '../calibration/calibrationStore';
import { useSimulationStore } from '../simulation/simulationStore';
import { usePortalStore } from './portalStore';

export function resetDemoExperience() {
  cancelGuidePresence();
  useCalibrationStore.getState().resetCalibration();
  useSimulationStore.getState().resetSimulation();
  usePortalStore.getState().resetDemo();
}
