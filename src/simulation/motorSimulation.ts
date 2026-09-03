export const ACTIONABLE_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[role="button"]:not([aria-disabled="true"])',
  '[role="radio"]:not([aria-disabled="true"])',
  '[role="link"]:not([aria-disabled="true"])',
].join(',');

export const SIMULATION_SURFACE_SELECTOR = '[data-simulation-surface="true"]';

export interface Point {
  x: number;
  y: number;
}

export function computeTremorOffset(elapsedMs: number, reducedMotion = false): Point {
  if (reducedMotion) return { x: 6.5, y: -4.5 };

  const x =
    10 * Math.sin(0.01 * elapsedMs + 0.6) +
    6 * Math.sin(0.023 * elapsedMs + 2.1) +
    3 * Math.sin(0.041 * elapsedMs + 1.3);
  const y =
    9 * Math.sin(0.012 * elapsedMs + 1.7) +
    6 * Math.sin(0.027 * elapsedMs + 0.2) +
    3 * Math.sin(0.047 * elapsedMs + 2.8);
  const magnitude = Math.hypot(x, y);
  if (magnitude <= 18) return { x, y };
  const scale = 18 / magnitude;
  return { x: x * scale, y: y * scale };
}

export function simulatedPoint(
  x: number,
  y: number,
  elapsedMs: number,
  reducedMotion = false,
): Point {
  const offset = computeTremorOffset(elapsedMs, reducedMotion);
  return { x: x + offset.x, y: y + offset.y };
}

export function actionableAtPoint(x: number, y: number): Element | null {
  return document.elementFromPoint(x, y)?.closest(ACTIONABLE_SELECTOR) ?? null;
}

export function simulationSurfaceAtPoint(x: number, y: number): Element | null {
  return document.elementFromPoint(x, y)?.closest(SIMULATION_SURFACE_SELECTOR) ?? null;
}

export function shouldAllowDisplacedActivation(
  physicalX: number,
  physicalY: number,
  displacedX: number,
  displacedY: number,
): boolean {
  const physicalControl = actionableAtPoint(physicalX, physicalY);
  if (!physicalControl) return true;
  return physicalControl === actionableAtPoint(displacedX, displacedY);
}

declare global {
  interface Window {
    __guideSimulationTestElapsedMs?: number;
  }
}
