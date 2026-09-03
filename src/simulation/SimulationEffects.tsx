import { MousePointer2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from '../app/App.module.css';
import {
  actionableAtPoint,
  simulationSurfaceAtPoint,
  simulatedPoint,
  type Point,
} from './motorSimulation';
import { useSimulationStore } from './simulationStore';

interface MissState extends Point {
  id: number;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function SimulationEffects() {
  const activeSimulation = useSimulationStore((state) => state.activeSimulation);
  const [pointer, setPointer] = useState<Point | null>(null);
  const [tunnelCenter, setTunnelCenter] = useState<Point>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));
  const [miss, setMiss] = useState<MissState | null>(null);
  const realPointer = useRef<Point | null>(null);
  const pointerInside = useRef(false);
  const missTimer = useRef<number | null>(null);

  useEffect(() => {
    if (activeSimulation !== 'tunnel-vision') return;
    const update = (event: PointerEvent) => {
      if (!simulationSurfaceAtPoint(event.clientX, event.clientY)) return;
      setTunnelCenter({ x: event.clientX, y: event.clientY });
    };
    document.addEventListener('pointermove', update, { passive: true });
    return () => document.removeEventListener('pointermove', update);
  }, [activeSimulation]);

  useEffect(() => {
    if (activeSimulation !== 'parkinsons') return;

    const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? true;
    if (!finePointer) return;
    const startedAt = performance.now();
    let frame = 0;
    let lastPointerType = '';
    let lastMissAt = 0;

    const elapsed = () => window.__guideSimulationTestElapsedMs ?? performance.now() - startedAt;
    const displaced = (x: number, y: number) =>
      simulatedPoint(x, y, elapsed(), prefersReducedMotion());

    const showMiss = (point: Point) => {
      const now = performance.now();
      if (now - lastMissAt < 90) return false;
      lastMissAt = now;
      if (missTimer.current !== null) window.clearTimeout(missTimer.current);
      setMiss({ ...point, id: now });
      missTimer.current = window.setTimeout(() => {
        setMiss(null);
        missTimer.current = null;
      }, 700);
      return true;
    };

    const updateCursor = () => {
      if (realPointer.current && pointerInside.current) {
        const point = displaced(realPointer.current.x, realPointer.current.y);
        setPointer(point);
      }
      frame = window.requestAnimationFrame(updateCursor);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        pointerInside.current = false;
        setPointer(null);
        return;
      }
      realPointer.current = { x: event.clientX, y: event.clientY };
      pointerInside.current = Boolean(simulationSurfaceAtPoint(event.clientX, event.clientY));
      if (!pointerInside.current) setPointer(null);
    };

    const shouldBlock = (x: number, y: number) => {
      if (!simulationSurfaceAtPoint(x, y)) {
        return { blocked: false, point: { x, y }, physicalControl: null, simulatedControl: null };
      }
      const point = displaced(x, y);
      const physicalControl = actionableAtPoint(x, y);
      if (!physicalControl) return { blocked: false, point, physicalControl, simulatedControl: null };
      const simulatedControl = actionableAtPoint(point.x, point.y);
      return { blocked: physicalControl !== simulatedControl, point, physicalControl, simulatedControl };
    };

    const notifyCalibrationMiss = (decision: ReturnType<typeof shouldBlock>, x: number, y: number) => {
      window.dispatchEvent(new CustomEvent('guide:simulated-pointer-miss', {
        detail: {
          physicalControl: decision.physicalControl,
          simulatedControl: decision.simulatedControl,
          displacement: Math.hypot(decision.point.x - x, decision.point.y - y),
        },
      }));
    };

    const blockPointerDown = (event: PointerEvent) => {
      lastPointerType = event.pointerType;
      if (event.pointerType !== 'mouse') return;
      const decision = shouldBlock(event.clientX, event.clientY);
      if (!decision.blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (showMiss(decision.point)) notifyCalibrationMiss(decision, event.clientX, event.clientY);
    };

    const blockClick = (event: MouseEvent) => {
      if (event.detail === 0 || lastPointerType !== 'mouse') return;
      const decision = shouldBlock(event.clientX, event.clientY);
      lastPointerType = '';
      if (!decision.blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (showMiss(decision.point)) notifyCalibrationMiss(decision, event.clientX, event.clientY);
    };

    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', blockPointerDown, true);
    document.addEventListener('click', blockClick, true);
    frame = window.requestAnimationFrame(() => {
      setPointer(null);
      setMiss(null);
      updateCursor();
    });

    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', blockPointerDown, true);
      document.removeEventListener('click', blockClick, true);
      window.cancelAnimationFrame(frame);
      if (missTimer.current !== null) window.clearTimeout(missTimer.current);
      missTimer.current = null;
      realPointer.current = null;
      pointerInside.current = false;
    };
  }, [activeSimulation]);

  return (
    <>
      <svg className={styles.simulationSvgFilters} aria-hidden="true">
        <defs>
          {/* Fixed severity-1 matrices from the published Machado color-vision model. */}
          <filter id="guide-total-color-blindness" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
          </filter>
          <filter id="guide-yellow-blue-color-blindness" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0" />
          </filter>
          <filter id="guide-red-green-color-blindness" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {activeSimulation === 'tunnel-vision' ? (
        <div
          className={styles.tunnelOverlay}
          style={{ '--tunnel-x': `${tunnelCenter.x}px`, '--tunnel-y': `${tunnelCenter.y}px` } as React.CSSProperties}
          aria-hidden="true"
        />
      ) : null}

      {activeSimulation === 'sunshine' ? <div className={styles.sunshineOverlay} aria-hidden="true" /> : null}

      {activeSimulation === 'parkinsons' && pointer ? (
        <div
          className={styles.simulatedCursor}
          style={{ transform: `translate3d(${pointer.x}px, ${pointer.y}px, 0)` }}
          aria-hidden="true"
        >
          <MousePointer2 size={30} strokeWidth={2.7} />
        </div>
      ) : null}

      {activeSimulation === 'parkinsons' && miss ? (
        <div
          key={miss.id}
          className={styles.missedTarget}
          style={{ transform: `translate3d(${miss.x}px, ${miss.y}px, 0)` }}
          aria-hidden="true"
        >
          <span />
          <strong>Missed target</strong>
        </div>
      ) : null}
    </>
  );
}
