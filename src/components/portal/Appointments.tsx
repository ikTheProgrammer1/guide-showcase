import { CalendarDays, Check, Clock3, MapPin, RefreshCw } from 'lucide-react';
import { useAdaptationManifest, useAdaptationRegion } from '../../adaptation/useAdaptation';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

export function Appointments() {
  const appointment = usePortalStore((state) => state.appointment);
  const openReschedule = usePortalStore((state) => state.openReschedule);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');
  const rescheduleRef = useSemanticTarget<HTMLButtonElement>('reschedule_button');
  const manifest = useAdaptationManifest();
  const summaryRegion = useAdaptationRegion('appointment_summary');
  const actionRegion = useAdaptationRegion('appointment_actions');
  const secondaryRegion = useAdaptationRegion('secondary_content');
  const descriptive = manifest.appointment_actions.labelStyle !== 'concise';
  const secondaryCollapsed = manifest.secondary_content.secondaryContent === 'collapsed';

  const earlierVisits = (
    <div className={styles.unifiedVisitList}>
      <span><time>APR 18</time><strong>Annual wellness visit</strong><small>Dr. Maya Chen · Completed</small><button>Summary</button></span>
      <span><time>JAN 07</time><strong>Laboratory services</strong><small>Northstar Lab · Completed</small><button>Result</button></span>
    </div>
  );

  return (
    <div className={`${styles.page} ${styles.unifiedAppointments}`}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Appointments</span>
        <h2>Upcoming appointments</h2>
        <p>Review your next visit or choose a different available time.</p>
      </div>

      <section {...summaryRegion} className={`${styles.unifiedPanel} ${styles.unifiedAppointmentDetail}`}>
        <header className={styles.unifiedPanelHeader}>
          <div><span className={styles.eyebrow}>Upcoming</span><h2>Next appointment</h2></div>
          <span className={styles.unifiedStatus}><Check size={13} aria-hidden="true" />{appointment.status}</span>
        </header>

        <div ref={appointmentRef} className={styles.unifiedAppointmentBody}>
          <div className={styles.unifiedProvider}>
            <span aria-hidden="true">MC</span>
            <div><h3>{appointment.provider}</h3><p>{appointment.specialty}</p></div>
          </div>
          <div className={styles.unifiedDetailGrid}>
            <span><CalendarDays aria-hidden="true" /><small>Date</small><strong>{appointment.dateLabel}</strong></span>
            <span><Clock3 aria-hidden="true" /><small>Time</small><strong>{appointment.time}</strong></span>
            <span data-secondary-detail="true"><MapPin aria-hidden="true" /><small>Location</small><strong>Northstar Medical Center · Building B</strong></span>
          </div>
          <div {...actionRegion} className={styles.unifiedAppointmentActions}>
            <div className={styles.primaryActionGroup}>
              <button ref={rescheduleRef} className={styles.unifiedPrimaryAction} aria-label="Reschedule appointment" onClick={() => openReschedule('you')}>
                <RefreshCw size={17} aria-hidden="true" />{descriptive ? 'Reschedule appointment' : 'MODIFY'}
              </button>
              <button>{descriptive ? 'View visit details' : 'VIEW'}</button>
            </div>
            <div className={styles.destructiveActionGroup}>
              <span>Other action</span><button>Cancel appointment</button>
            </div>
          </div>
        </div>
      </section>

      <section {...secondaryRegion} className={styles.unifiedEarlierVisits}>
        {secondaryCollapsed ? <details><summary>Show earlier visits</summary>{earlierVisits}</details> : <><h2>Earlier this year</h2>{earlierVisits}</>}
      </section>
    </div>
  );
}
