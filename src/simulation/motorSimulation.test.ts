import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  actionableAtPoint,
  computeTremorOffset,
  shouldAllowDisplacedActivation,
  simulatedPoint,
} from './motorSimulation';

describe('motor simulation geometry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('is deterministic and bounded without target-specific behavior', () => {
    expect(computeTremorOffset(500)).toEqual(computeTremorOffset(500));
    for (let elapsed = 0; elapsed < 10_000; elapsed += 37) {
      const offset = computeTremorOffset(elapsed);
      expect(Math.hypot(offset.x, offset.y)).toBeLessThanOrEqual(18.000_001);
    }
    expect(computeTremorOffset(500, true)).toEqual({ x: 6.5, y: -4.5 });
    expect(simulatedPoint(100, 80, 500, true)).toEqual({ x: 106.5, y: 75.5 });
  });

  it('uses the element actually under each coordinate and never searches nearby', () => {
    const first = document.createElement('button');
    const firstChild = document.createElement('span');
    first.append(firstChild);
    const second = document.createElement('button');
    document.body.append(first, second);

    const elementFromPoint = vi.fn((x: number) => {
      if (x === 10) return firstChild;
      if (x === 20) return first;
      if (x === 30) return second;
      return null;
    });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: elementFromPoint,
    });

    expect(actionableAtPoint(10, 5)).toBe(first);
    expect(shouldAllowDisplacedActivation(10, 5, 20, 5)).toBe(true);
    expect(shouldAllowDisplacedActivation(10, 5, 30, 5)).toBe(false);
    expect(shouldAllowDisplacedActivation(10, 5, 40, 5)).toBe(false);
    expect(shouldAllowDisplacedActivation(40, 5, 10, 5)).toBe(true);
  });
});
