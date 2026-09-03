import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Crosshair, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { componentCapabilities } from '../../adaptation/manifest';
import {
  semanticComponentIds,
  type ComponentAdaptation,
  type ComponentAdaptationKey,
  type SemanticComponentId,
} from '../../adaptation/types';
import { useAdaptationManifest } from '../../adaptation/useAdaptation';
import { startPointerPrecisionCalibration } from '../../calibration/startCalibration';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

const optionSets: Partial<Record<ComponentAdaptationKey, Array<{ value: string | number; label: string }>>> = {
  minimumTargetSize: [
    { value: 44, label: '44 px' },
    { value: 52, label: '52 px' },
    { value: 64, label: '64 px' },
    { value: 72, label: '72 px' },
  ],
  minimumControlGap: [
    { value: 8, label: '8 px' },
    { value: 16, label: '16 px' },
    { value: 24, label: '24 px' },
    { value: 32, label: '32 px' },
  ],
  layout: [
    { value: 'row', label: 'Row' },
    { value: 'column', label: 'Column' },
    { value: 'step-by-step', label: 'Step by step' },
  ],
  informationPriority: [
    { value: 'all', label: 'Show all' },
    { value: 'primary', label: 'Prioritize tasks' },
  ],
  secondaryContent: [
    { value: 'visible', label: 'Visible' },
    { value: 'collapsed', label: 'Collapsed' },
  ],
  labelStyle: [
    { value: 'concise', label: 'Concise' },
    { value: 'descriptive', label: 'Descriptive' },
    { value: 'plain-language', label: 'Plain language' },
  ],
  statusPresentation: [
    { value: 'color-and-text', label: 'Color and text' },
    { value: 'icon-shape-text', label: 'Icon, shape, and text' },
  ],
  activationProtection: [
    { value: 'standard', label: 'Standard' },
    { value: 'review', label: 'Review before action' },
  ],
  focusVisibility: [
    { value: 'standard', label: 'Standard focus' },
    { value: 'enhanced', label: 'Enhanced focus' },
  ],
  destructiveActionPlacement: [
    { value: 'inline', label: 'With other actions' },
    { value: 'separate', label: 'Separate area' },
  ],
};

const optionLabels: Record<ComponentAdaptationKey, string> = {
  minimumTargetSize: 'Minimum control size',
  minimumControlGap: 'Space between controls',
  layout: 'Layout',
  informationPriority: 'Information priority',
  secondaryContent: 'Secondary content',
  labelStyle: 'Labels',
  statusPresentation: 'Status presentation',
  activationProtection: 'Action protection',
  focusVisibility: 'Keyboard focus',
  destructiveActionPlacement: 'Destructive actions',
};

export function PersonalizeInterface() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<SemanticComponentId>('appointment_actions');
  const triggerRef = useSemanticTarget<HTMLButtonElement>('personalize_interface');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const manifest = useAdaptationManifest();
  const setComponentAdaptation = usePortalStore((state) => state.setComponentAdaptation);
  const resetComponentAdaptation = usePortalStore((state) => state.resetComponentAdaptation);
  const capability = componentCapabilities[selectedRegion];

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>('[data-semantic-target="personalize_interface"]');
      element?.focus();
    });
  };

  const startCalibration = () => {
    setOpen(false);
    window.requestAnimationFrame(() => startPointerPrecisionCalibration('you'));
  };

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleDialogKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
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

  return (
    <>
      <button ref={triggerRef} className={styles.personalizeButton} onClick={() => setOpen(true)}>
        <SlidersHorizontal size={16} aria-hidden="true" />
        Personalize interface
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={styles.personalizeBackdrop}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <motion.div
              ref={dialogRef}
              className={styles.personalizeDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="personalize-title"
              onKeyDown={handleDialogKey}
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.24 }}
            >
              <header className={styles.personalizeHeader}>
                <div>
                  <span className={styles.eyebrow}>Bounded controls</span>
                  <h2 ref={titleRef} id="personalize-title" tabIndex={-1}>Personalize the interface</h2>
                  <p>Choose an area, then adjust only the options Northstar safely supports.</p>
                </div>
                <button className={styles.iconButton} onClick={close} aria-label="Close interface personalization">
                  <X size={20} aria-hidden="true" />
                </button>
              </header>

              <button className={styles.calibrationCallout} onClick={startCalibration}>
                <span><Crosshair size={20} aria-hidden="true" /></span>
                <span><strong>Calibrate pointer precision</strong><small>Try a safe practice control and approve what feels comfortable.</small></span>
              </button>

              <div className={styles.personalizeBody}>
                <nav aria-label="Interface regions" className={styles.regionList}>
                  {semanticComponentIds.map((component) => (
                    <button
                      key={component}
                      aria-pressed={selectedRegion === component}
                      onClick={() => setSelectedRegion(component)}
                    >
                      <strong>{componentCapabilities[component].label}</strong>
                      <small>{componentCapabilities[component].description}</small>
                    </button>
                  ))}
                </nav>

                <section className={styles.regionEditor} aria-labelledby="region-editor-title">
                  <div className={styles.regionEditorHeading}>
                    <div><span className={styles.eyebrow}>Selected area</span><h3 id="region-editor-title">{capability.label}</h3></div>
                    <button className={styles.textButton} onClick={() => resetComponentAdaptation(selectedRegion, 'you')}>Use composed defaults</button>
                  </div>
                  <p>{capability.description}</p>
                  <div className={styles.regionFields}>
                    {capability.supports.map((key) => (
                      <fieldset key={key}>
                        <legend>{optionLabels[key]}</legend>
                        <div className={styles.optionButtons}>
                          {optionSets[key]!.map((option) => (
                            <button
                              key={String(option.value)}
                              aria-pressed={manifest[selectedRegion][key] === option.value}
                              onClick={() => setComponentAdaptation(
                                selectedRegion,
                                { [key]: option.value } as ComponentAdaptation,
                                'you',
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
