import { CalendarDays, Check, Clock3, MapPin, RefreshCw } from 'lucide-react';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

export function Appointments() {
  const appointment = usePortalStore((state) => state.appointment);
  const openReschedule = usePortalStore((state) => state.openReschedule);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');
  const rescheduleRef = useSemanticTarget<HTMLButtonElement>('reschedule_button');

  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Appointments</span>
        <h2>Your time, clearly organized.</h2>
        <p>Review what’s coming up or choose a different time without losing your place.</p>
      </div>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Upcoming</span>
            <h2>Next appointment</h2>
          </div>
          <span className={styles.statusPill}><Check size={13} aria-hidden="true" /> {appointment.status}</span>
        </div>

        <div ref={appointmentRef} className={styles.appointmentDetailCard}>
          <div className={styles.appointmentTopline}>
            <div className={styles.providerAvatar} aria-hidden="true">MC</div>
            <div>
              <h3>{appointment.provider}</h3>
              <p>{appointment.specialty}</p>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div><CalendarDays aria-hidden="true" /><span>Date<strong>{appointment.dateLabel}</strong></span></div>
            <div><Clock3 aria-hidden="true" /><span>Time<strong>{appointment.time}</strong></span></div>
            <div className={styles.secondaryMetadata}><MapPin aria-hidden="true" /><span>Location<strong>Guide Health Center</strong></span></div>
          </div>

          <div className={styles.cardActions}>
            <button ref={rescheduleRef} className={styles.primaryButton} onClick={() => openReschedule('you')}>
              <RefreshCw size={17} aria-hidden="true" />
              Reschedule appointment
            </button>
            <button className={styles.secondaryButton}>View visit details</button>
          </div>
        </div>
      </section>

      <section className={`${styles.sectionBlock} ${styles.secondarySection}`}>
        <span className={styles.eyebrow}>Earlier this year</span>
        <div className={styles.pastVisit}>
          <span>APR 18</span>
          <div><strong>Annual wellness visit</strong><small>Dr. Maya Chen · Completed</small></div>
          <button className={styles.textButton}>Summary</button>
        </div>
      </section>
    </div>
  );
}
