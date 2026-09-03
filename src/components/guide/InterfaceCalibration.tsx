import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crosshair,
  LockKeyhole,
  Maximize2,
  Minus,
  MoveHorizontal,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
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
  const isTargetSizeStep = calibration.phase === 'target-size';
  const stepHeading = isTargetSizeStep ? 'Try the practice button' : 'Now try the spacing';
  const stepDescription = isTargetSizeStep
    ? 'Select it three times. Nothing here can change your appointment.'
    : 'Select the same safe button three times with another control nearby.';
  const feedbackWasAdjustment = /missed|increased|larger|smaller|farther|closer/i.test(calibration.feedback);

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
                  <span className={styles.eyebrow}>Pointer comfort check</span>
                  <h2 ref={titleRef} id="calibration-title" tabIndex={-1}>Let’s find controls that feel easier to select</h2>
                </div>
              </div>
              <button className={styles.calibrationCloseButton} onClick={stopCalibration} aria-label="Close calibration">
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <ol className={styles.calibrationProgress} aria-label={`Calibration step ${progress} of 3`}>
              {['Target size', 'Spacing', 'Confirm'].map((label, index) => (
                <li key={label} aria-current={progress === index + 1 ? 'step' : undefined} data-complete={progress > index + 1 ? 'true' : undefined}>
                  <i aria-hidden="true">{progress > index + 1 ? <Check size={14} /> : index + 1}</i><span>{label}</span>
                </li>
              ))}
            </ol>

            {calibration.phase === 'comfort' ? (
              <div className={styles.comfortReview}>
                <div className={styles.comfortSummary}>
                  <span className={styles.eyebrow}>Your result</span>
                  <h3 ref={comfortTitleRef} tabIndex={-1}>Does this feel comfortable?</h3>
                  <p>Review the fit, adjust it if you want, then choose whether to apply it.</p>
                  <div className={styles.measurementSummary}>
                    <span><Maximize2 size={18} aria-hidden="true" /><small>Minimum target</small><strong>{calibration.targetSize}px</strong></span>
                    <span><MoveHorizontal size={18} aria-hidden="true" /><small>Control spacing</small><strong>{calibration.controlGap}px</strong></span>
                  </div>
                  <ul className={styles.comfortGuarantees}>
                    <li><Check size={15} aria-hidden="true" />Appointment actions will use clear, separated controls.</li>
                    <li><Check size={15} aria-hidden="true" />You will still choose the appointment time.</li>
                    <li><Check size={15} aria-hidden="true" />Review remains required before confirmation.</li>
                  </ul>
                </div>

                <section className={styles.fitPreview} aria-label="Original and personalized control comparison">
                  <div className={styles.fitPreviewHeading}>
                    <span className={styles.eyebrow}>Preview</span>
                    <strong>How appointment actions will change</strong>
                  </div>
                  <div className={styles.fitComparison}>
                    <div className={styles.fitExample} data-version="original">
                      <span>Original</span>
                      <div
                        className={styles.fitActionStack}
                        style={{ '--preview-size': `${calibration.initialTargetSize}px`, '--preview-gap': '5px' } as React.CSSProperties}
                        aria-hidden="true"
                      >
                        <i>VIEW APPT</i><i>MODIFY APPT</i><i>CANCEL APPT</i>
                      </div>
                      <small>{calibration.initialTargetSize}px targets · close together</small>
                    </div>
                    <ArrowRight className={styles.fitArrow} size={22} aria-hidden="true" />
                    <div className={styles.fitExample} data-version="personalized">
                      <span>Your result</span>
                      <div
                        className={styles.fitActionStack}
                        style={{ '--preview-size': `${calibration.targetSize}px`, '--preview-gap': `${calibration.controlGap}px` } as React.CSSProperties}
                        aria-hidden="true"
                      >
                        <i>View appointment</i><i>Reschedule appointment</i><i>Cancel appointment</i>
                      </div>
                      <small>{calibration.targetSize}px targets · {calibration.controlGap}px apart</small>
                    </div>
                  </div>
                </section>

                <div className={styles.comfortAdjustments} aria-label="Adjust your result">
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
                  <h3>{stepHeading}</h3>
                  <p>{stepDescription}</p>
                  <div className={styles.practiceSafety}><ShieldCheck size={19} aria-hidden="true" /><span><strong>Practice only</strong>No portal action can happen here.</span></div>
                  <div className={styles.attemptTracker} aria-label={`${calibration.consecutiveSuccesses} of ${REQUIRED_SUCCESSFUL_ATTEMPTS} successful attempts`}>
                    <strong>Attempts</strong>
                    <div className={styles.attemptPips} aria-hidden="true">
                      {Array.from({ length: REQUIRED_SUCCESSFUL_ATTEMPTS }, (_, index) => (
                        <span key={index} data-complete={index < calibration.consecutiveSuccesses ? 'true' : undefined} data-current={index === calibration.consecutiveSuccesses ? 'true' : undefined}>
                          {index < calibration.consecutiveSuccesses ? <Check size={20} /> : index + 1}
                        </span>
                      ))}
                    </div>
                    <small aria-live="polite">{calibration.consecutiveSuccesses} of {REQUIRED_SUCCESSFUL_ATTEMPTS} at this setting</small>
                  </div>
                </section>

                <section
                  className={styles.practiceSurface}
                  aria-label="Safe pointer practice area"
                  style={{ '--practice-gap': `${calibration.controlGap}px` } as React.CSSProperties}
                  onPointerDown={recordMiss}
                >
                  <div className={styles.practiceStageHeader}>
                    <span>Safe practice area</span>
                    <small>{isTargetSizeStep ? `${calibration.targetSize}px target` : `${calibration.controlGap}px spacing`}</small>
                  </div>
                  <div className={styles.practiceStageBody}>
                    <div className={styles.practiceGrid} data-step={calibration.phase}>
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
                      {!isTargetSizeStep ? <button type="button" className={styles.practiceDecoy} tabIndex={-1} aria-label="Safe neighboring practice control">Other action</button> : null}
                    </div>

                    <motion.div
                      key={calibration.feedback}
                      className={styles.stageFeedback}
                      data-adjusted={feedbackWasAdjustment ? 'true' : undefined}
                      role="status"
                      aria-live="polite"
                      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    >
                      {calibration.feedback}
                    </motion.div>

                    <div className={styles.practiceAdjustments} aria-label="Adjust this practice step">
                      <span>Need a different fit?</span>
                      {isTargetSizeStep ? (
                        <>
                          <button onClick={() => calibration.adjustTargetSize('smaller')}><Minus size={15} aria-hidden="true" /> Smaller</button>
                          <button onClick={() => calibration.adjustTargetSize('larger')}>Make it larger <Plus size={15} aria-hidden="true" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => calibration.adjustControlGap('closer')}><ArrowLeft size={15} aria-hidden="true" /> Closer</button>
                          <button onClick={() => calibration.adjustControlGap('farther')}>Farther apart <Plus size={15} aria-hidden="true" /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <dl className={styles.measurementDock}>
                    <div><dt><Maximize2 size={16} aria-hidden="true" />Current target</dt><dd>{calibration.targetSize}px</dd></div>
                    <div><dt><MoveHorizontal size={16} aria-hidden="true" />Current spacing</dt><dd>{calibration.controlGap}px</dd></div>
                    <div><dt><ArrowRight size={16} aria-hidden="true" />Next</dt><dd>{isTargetSizeStep ? 'Spacing' : 'Confirm'}</dd></div>
                  </dl>
                </section>
              </div>
            )}

            <footer className={styles.calibrationFooter}>
              <div className={styles.calibrationPrivacy}>
                <LockKeyhole size={17} aria-hidden="true" />
                <span>Only approved preferences are kept.</span>
                <button className={styles.resetCalibrationButton} onClick={resetExperience}><RotateCcw size={15} aria-hidden="true" /> Reset demo</button>
              </div>
              <p className={styles.calibrationDisclaimer}>This adjusts interface controls, not a medical condition, and does not establish accessibility compliance.</p>
              <button className={styles.stopCalibrationButton} onClick={stopCalibration}><X size={17} aria-hidden="true" /> Stop calibration</button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
