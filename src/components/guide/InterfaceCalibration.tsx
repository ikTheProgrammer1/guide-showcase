import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Check, Crosshair, Minus, Plus, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { useCalibrationStore } from '../../calibration/calibrationStore';
import { REQUIRED_SUCCESSFUL_ATTEMPTS } from '../../calibration/calibrationEngine';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { resetDemoExperience } from '../../state/resetDemo';
import styles from '../../app/App.module.css';

interface SimulatedMissDetail {
  physicalControl: Element | null;
  simulatedControl: Element | null;
  displacement: number;
}

declare global {
  interface WindowEventMap {
    'guide:simulated-pointer-miss': CustomEvent<SimulatedMissDetail>;
  }
}

function distanceToRect(x: number, y: number, rect: DOMRect) {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

function restorePersonalizeFocus() {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[data-semantic-target="personalize_interface"]')?.focus();
  });
}

export function InterfaceCalibration() {
  const calibration = useCalibrationStore();
  const reduceMotion = useReducedMotion();
  const practiceRef = useSemanticTarget<HTMLButtonElement>('calibration_practice_target');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const comfortTitleRef = useRef<HTMLHeadingElement>(null);
  const correctionCount = useRef(0);
  const hasEnteredTarget = useRef(false);
  const recordAttempt = calibration.recordAttempt;

  const stopCalibration = () => {
    calibration.stop('you');
    restorePersonalizeFocus();
  };

  const resetExperience = () => {
    resetDemoExperience();
    restorePersonalizeFocus();
  };

  useEffect(() => {
    if (!calibration.isOpen) return;
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [calibration.isOpen]);

  useEffect(() => {
    if (calibration.phase !== 'comfort') return;
    const frame = window.requestAnimationFrame(() => comfortTitleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [calibration.phase]);

  useEffect(() => {
    if (!calibration.isOpen) return;
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      useCalibrationStore.getState().stop('you');
      restorePersonalizeFocus();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [calibration.isOpen]);

  useEffect(() => {
    if (!calibration.isOpen) return;
    const recordSimulatedMiss = (event: WindowEventMap['guide:simulated-pointer-miss']) => {
      const physical = event.detail.physicalControl;
      if (!(physical instanceof HTMLElement) || physical.dataset.calibrationTarget !== 'true') return;
      recordAttempt({
        success: false,
        method: 'pointer',
        missDistance: event.detail.displacement,
        corrections: correctionCount.current,
      });
      correctionCount.current = 0;
      hasEnteredTarget.current = false;
    };
    window.addEventListener('guide:simulated-pointer-miss', recordSimulatedMiss);
    return () => window.removeEventListener('guide:simulated-pointer-miss', recordSimulatedMiss);
  }, [calibration.isOpen, recordAttempt]);

  const recordMiss = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const target = event.target;
    if (target instanceof Element && target.closest('[data-calibration-target="true"]')) return;
    const practiceTarget = dialogRef.current?.querySelector<HTMLElement>('[data-calibration-target="true"]');
    const missDistance = practiceTarget
      ? distanceToRect(event.clientX, event.clientY, practiceTarget.getBoundingClientRect())
      : 0;
    recordAttempt({
      success: false,
      method: 'pointer',
      missDistance,
      corrections: correctionCount.current,
    });
    correctionCount.current = 0;
    hasEnteredTarget.current = false;
  };

  const recordSuccess = (event: MouseEvent<HTMLButtonElement>) => {
    recordAttempt({
      success: true,
      method: event.detail === 0 ? 'keyboard' : 'pointer',
      missDistance: 0,
      corrections: correctionCount.current,
    });
    correctionCount.current = 0;
    hasEnteredTarget.current = false;
  };

  const onTargetEnter = () => {
    if (hasEnteredTarget.current) correctionCount.current += 1;
    hasEnteredTarget.current = true;
  };

  const onTargetLeave = () => {
    if (hasEnteredTarget.current) correctionCount.current += 1;
  };

  const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      stopCalibration();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
      .filter((control) => control.tabIndex >= 0);
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls.at(-1)!;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const progress = calibration.phase === 'target-size'
    ? 1
    : calibration.phase === 'spacing'
      ? 2
      : 3;

  return (
    <AnimatePresence>
      {calibration.isOpen ? (
        <motion.div
          className={styles.calibrationBackdrop}
          data-simulation-surface="true"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <motion.div
            ref={dialogRef}
            className={styles.calibrationDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calibration-title"
            onKeyDown={handleKeys}
            initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
          >
            <header className={styles.calibrationHeader}>
              <div className={styles.calibrationIdentity}>
                <span><Crosshair size={22} aria-hidden="true" /></span>
                <div>
                  <span className={styles.eyebrow}>Safe interface calibration</span>
                  <h2 ref={titleRef} id="calibration-title" tabIndex={-1}>Find a comfortable control size</h2>
                </div>
              </div>
              <div className={styles.calibrationHeaderActions}>
                <button className={styles.resetCalibrationButton} onClick={resetExperience}>
                  <RotateCcw size={16} aria-hidden="true" /> Reset demo
                </button>
                <button className={styles.stopCalibrationButton} onClick={stopCalibration}>
                  <X size={17} aria-hidden="true" /> Stop calibration
                </button>
              </div>
            </header>

            <div className={styles.calibrationProgress} aria-label={`Calibration step ${progress} of 3`}>
              {['Target size', 'Spacing', 'Comfort'].map((label, index) => (
                <span key={label} data-current={progress === index + 1 ? 'true' : undefined} data-complete={progress > index + 1 ? 'true' : undefined}>
                  <i aria-hidden="true">{progress > index + 1 ? <Check size={13} /> : index + 1}</i>{label}
                </span>
              ))}
            </div>

            {calibration.phase === 'comfort' ? (
              <div className={styles.comfortReview}>
                <div className={styles.comfortSummary}>
                  <span className={styles.eyebrow}>Your current result</span>
                  <h3 ref={comfortTitleRef} tabIndex={-1}>Does this feel comfortable?</h3>
                  <p>Only the approved control size and spacing will be applied. Practice measurements will be discarded.</p>
                  <div className={styles.measurementSummary}>
                    <span><strong>{calibration.targetSize}px</strong> minimum control size</span>
                    <span><strong>{calibration.controlGap}px</strong> minimum spacing</span>
                  </div>
                </div>

                <div className={styles.comfortAdjustments}>
                  <fieldset>
                    <legend>Control size</legend>
                    <button onClick={() => calibration.adjustTargetSize('smaller')}><Minus size={16} aria-hidden="true" /> Smaller</button>
                    <button onClick={() => calibration.adjustTargetSize('larger')}><Plus size={16} aria-hidden="true" /> Larger</button>
                  </fieldset>
                  <fieldset>
                    <legend>Control spacing</legend>
                    <button onClick={() => calibration.adjustControlGap('closer')}><ArrowLeft size={16} aria-hidden="true" /> Closer</button>
                    <button onClick={() => calibration.adjustControlGap('farther')}>Farther apart <Plus size={16} aria-hidden="true" /></button>
                  </fieldset>
                </div>

                <label className={styles.rememberPreference}>
                  <input
                    type="checkbox"
                    checked={calibration.remember}
                    onChange={(event) => calibration.setRemember(event.currentTarget.checked)}
                  />
                  <span><strong>Remember these preferences on Northstar</strong><small>Stores only the approved functional preferences in this browser.</small></span>
                </label>

                <button className={styles.approveCalibrationButton} onClick={() => calibration.approve()}>
                  <ShieldCheck size={18} aria-hidden="true" /> This feels comfortable — apply it
                </button>
              </div>
            ) : (
              <div className={styles.practiceLayout}>
                <section className={styles.practiceInstructions}>
                  <span className={styles.eyebrow}>Step {progress} of 3</span>
                  <h3>{calibration.phase === 'target-size' ? 'Try the appointment control' : 'Now test the spacing'}</h3>
                  <p>Try selecting the practice appointment button. It will not perform a real action.</p>
                  <div className={styles.practiceSafety}><ShieldCheck size={18} aria-hidden="true" /><span><strong>Practice only</strong>No appointment, navigation, or account data can change here.</span></div>
                  <p className={styles.practiceCount} aria-live="polite">
                    {calibration.consecutiveSuccesses} of {REQUIRED_SUCCESSFUL_ATTEMPTS} consistent attempts in this step
                  </p>
                </section>

                <section
                  className={styles.practiceSurface}
                  aria-label="Safe pointer practice area"
                  style={{ '--practice-gap': `${calibration.controlGap}px` } as React.CSSProperties}
                  onPointerDown={recordMiss}
                >
                  <div className={styles.practiceGrid}>
                    <button
                      ref={practiceRef}
                      type="button"
                      data-calibration-target="true"
                      className={styles.practiceTarget}
                      style={{
                        minHeight: `${calibration.targetSize}px`,
                        minWidth: `${Math.max(calibration.initialTargetWidth, calibration.targetSize * 2.55)}px`,
                      }}
                      onPointerEnter={onTargetEnter}
                      onPointerLeave={onTargetLeave}
                      onClick={recordSuccess}
                    >
                      Practice appointment
                    </button>
                    <button type="button" className={styles.practiceDecoy} tabIndex={-1} aria-label="Safe neighboring practice control">Other action</button>
                  </div>
                  <span className={styles.practiceCaption}>Nothing here performs a portal action.</span>
                </section>
              </div>
            )}

            <div className={styles.calibrationFeedback} role="status" aria-live="polite">
              {calibration.feedback}
            </div>
            <p className={styles.calibrationDisclaimer}>This calibrates interface controls, not a medical condition. It does not establish accessibility compliance.</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
