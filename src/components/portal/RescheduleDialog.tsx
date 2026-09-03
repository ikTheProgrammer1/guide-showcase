import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, CalendarCheck, Check, CheckCircle2, Clock3, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useAdaptationRegion } from '../../adaptation/useAdaptation';
import { originalAppointment, rescheduleSlots } from '../../data/demoData';
import { cancelGuidePresence } from '../../presence/presenceController';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import type { RescheduleSlot } from '../../types';
import styles from '../../app/App.module.css';

function SlotButton({ slot, selected, tabStop }: { slot: RescheduleSlot; selected: boolean; tabStop: boolean }) {
  const select = usePortalStore((state) => state.selectRescheduleSlot);
  const targetMap = {
    slot_2026_09_11_0900: 'appointment_slot_sep_11',
    slot_2026_09_12_1130: 'appointment_slot_sep_12',
    slot_2026_09_14_1500: 'appointment_slot_sep_14',
  } as const;
  const ref = useSemanticTarget<HTMLButtonElement>(targetMap[slot.id as keyof typeof targetMap]);

  const handleRadioKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const group = event.currentTarget.closest('[role="radiogroup"]');
    const radios = group ? [...group.querySelectorAll<HTMLButtonElement>('[role="radio"]')] : [];
    const currentIndex = radios.indexOf(event.currentTarget);
    if (currentIndex < 0 || radios.length === 0) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? radios.length - 1
        : event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? (currentIndex + 1) % radios.length
          : (currentIndex - 1 + radios.length) % radios.length;
    radios[nextIndex].focus();
    radios[nextIndex].click();
  };

  return (
    <button
      ref={ref}
      className={styles.slotButton}
      data-selected={selected ? 'true' : 'false'}
      role="radio"
      aria-checked={selected}
      tabIndex={tabStop ? 0 : -1}
      onClick={() => select(slot.id, 'you')}
      onKeyDown={handleRadioKeys}
    >
      <span className={styles.slotDate}>{slot.dayLabel}</span>
      <span className={styles.slotTime}><Clock3 size={16} aria-hidden="true" /> {slot.time}</span>
      <span className={styles.radioMark} aria-hidden="true">{selected ? <Check size={14} /> : null}</span>
    </button>
  );
}

export function RescheduleDialog() {
  const appointment = usePortalStore((state) => state.appointment);
  const reschedule = usePortalStore((state) => state.reschedule);
  const close = usePortalStore((state) => state.closeReschedule);
  const back = usePortalStore((state) => state.backToRescheduleChoices);
  const confirm = usePortalStore((state) => state.confirmReschedule);
  const undo = usePortalStore((state) => state.undoReschedule);
  const selectedSlot = rescheduleSlots.find((slot) => slot.id === reschedule.selectedSlotId) ?? null;
  const confirmRef = useSemanticTarget<HTMLButtonElement>('confirm_reschedule_button');
  const formsRegion = useAdaptationRegion('forms');
  const dialogRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const dismiss = () => {
    cancelGuidePresence();
    close('you');
  };

  useEffect(() => {
    if (!reschedule.dialogOpen) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previousFocus.current?.focus();
  }, [reschedule.dialogOpen]);

  useEffect(() => {
    if (!reschedule.dialogOpen) return;
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [reschedule.dialogOpen, reschedule.phase]);

  const handleDialogKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')];
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

  const standardHeader = (
    <header className={styles.dialogHeader}>
      <div>
        <span className={styles.eyebrow}>{reschedule.phase === 'reviewing' ? 'Review change' : 'Choose a new time'}</span>
        <h2 ref={titleRef} id="reschedule-title" tabIndex={-1}>
          {reschedule.phase === 'reviewing' ? 'Review your appointment change' : 'Reschedule your appointment'}
        </h2>
        <p>{reschedule.phase === 'reviewing' ? 'Check both times before confirming.' : 'Nothing changes until you confirm.'}</p>
      </div>
    </header>
  );

  return (
    <AnimatePresence>
      {reschedule.dialogOpen ? (
        <motion.div className={styles.dialogBackdrop} data-simulation-surface="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
            onKeyDown={handleDialogKeys}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {reschedule.phase === 'complete' ? (
              <div className={styles.successPanel} role="status" aria-live="polite">
                <div className={styles.successIcon}><CheckCircle2 size={34} aria-hidden="true" /></div>
                <span className={styles.eyebrow}>Appointment updated</span>
                <h2 ref={titleRef} id="reschedule-title" tabIndex={-1}>Your new time is confirmed.</h2>
                <p>{appointment.provider} · {appointment.specialty}</p>
                <div className={styles.confirmedTime}><CalendarCheck size={20} aria-hidden="true" /><span><strong>{appointment.dateLabel}</strong>{appointment.time}</span></div>
                <div className={styles.successActions}>
                  <button className={styles.secondaryButton} onClick={() => undo('you')}><RotateCcw size={17} aria-hidden="true" />Undo change</button>
                  <button className={styles.primaryButton} onClick={dismiss}>Done</button>
                </div>
                <small>This is a fictional demonstration. No real appointment was changed.</small>
              </div>
            ) : reschedule.phase === 'undone' ? (
              <div className={styles.successPanel} role="status" aria-live="polite">
                <div className={styles.successIcon} data-undone="true"><RotateCcw size={32} aria-hidden="true" /></div>
                <span className={styles.eyebrow}>Change undone</span>
                <h2 ref={titleRef} id="reschedule-title" tabIndex={-1}>Your previous time was restored.</h2>
                <div className={styles.confirmedTime}><CalendarCheck size={20} aria-hidden="true" /><span><strong>{appointment.dateLabel}</strong>{appointment.time}</span></div>
                <button className={styles.primaryButton} onClick={dismiss}>Done</button>
              </div>
            ) : (
              <>
                {standardHeader}
                <div className={styles.currentAppointmentStrip}><span>Current appointment</span><strong>{originalAppointment.dateLabel} · {originalAppointment.time}</strong></div>

                <div {...formsRegion} className={styles.rescheduleStep}>
                  {reschedule.phase === 'choosing' ? (
                    <div className={styles.slotColumn}>
                      <h3>Available times</h3>
                      <div role="radiogroup" aria-label="Available reschedule times" className={styles.slotList}>
                        {rescheduleSlots.map((slot) => (
                          <SlotButton
                            key={slot.id}
                            slot={slot}
                            selected={slot.id === reschedule.selectedSlotId}
                            tabStop={slot.id === reschedule.selectedSlotId || (!reschedule.selectedSlotId && slot.id === rescheduleSlots[0].id)}
                          />
                        ))}
                      </div>
                      <p className={styles.stepHint}>Selecting a time opens a separate review. It does not change the appointment.</p>
                    </div>
                  ) : (
                    <aside className={styles.reviewPanel} aria-live="polite">
                      <span className={styles.reviewLabel}>Review change</span>
                      <div className={styles.timeComparison}>
                        <div><span>Current</span><strong>{originalAppointment.dateLabel}</strong><small>{originalAppointment.time}</small></div>
                        <span className={styles.changeArrow} aria-hidden="true">→</span>
                        <div data-new="true"><span>New</span><strong>{selectedSlot?.dateLabel}</strong><small>{selectedSlot?.time}</small></div>
                      </div>
                      <p>You stay in control. Review both times before completing this change.</p>
                      <div className={styles.reviewActions}>
                        <button className={styles.secondaryButton} onClick={() => back('you')}><ArrowLeft size={17} aria-hidden="true" />Back to times</button>
                        <button ref={confirmRef} className={styles.primaryButton} disabled={!selectedSlot} onClick={() => selectedSlot && confirm(selectedSlot.id, 'you')}>
                          <CalendarCheck size={17} aria-hidden="true" />Confirm new time
                        </button>
                      </div>
                    </aside>
                  )}
                </div>

                <button className={`${styles.iconButton} ${styles.dialogDismiss}`} onClick={dismiss} aria-label="Close reschedule dialog"><X size={20} aria-hidden="true" /></button>
              </>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
