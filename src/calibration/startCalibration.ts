import { getTargetRect } from '../presence/targetRegistry';
import type { Actor } from '../types';
import { useCalibrationStore } from './calibrationStore';

export function startPointerPrecisionCalibration(actor: Actor) {
  const currentControl = getTargetRect('reschedule_button');
  return useCalibrationStore.getState().start(
    'pointer_precision',
    'reschedule_appointment',
    actor,
    currentControl?.height,
    currentControl?.width,
  );
}
