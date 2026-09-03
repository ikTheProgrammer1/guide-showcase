import { CalendarDays, Check, Clock3, MapPin, RefreshCw } from 'lucide-react';
import { isPortalAdapted } from '../../data/demoData';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { JargonTerm } from '../../simulation/JargonTerm';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

export function Appointments() {
  const appointment = usePortalStore((state) => state.appointment);
  const adapted = usePortalStore((state) => isPortalAdapted(state.accessibility));
  const openReschedule = usePortalStore((state) => state.openReschedule);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');
  const rescheduleRef = useSemanticTarget<HTMLButtonElement>('reschedule_button');

  if (!adapted) {
    return (
      <div className={`${styles.page} ${styles.legacyAppointments}`}>
        <div className={styles.legacyBreadcrumb}>HOME &gt; APPTS &gt; APPOINTMENT LIST <span>PRINT PAGE</span></div>
        <section className={styles.legacyPanel}>
          <header><h2>APPOINTMENTS / VISITS</h2><span>SHOWING: UPCOMING + PAST 12 MONTHS</span></header>
          <div ref={appointmentRef} className={styles.legacyPanelBody}>
            <table className={styles.legacyDataTable}>
              <caption className={styles.visuallyHidden}>Appointments and visits</caption>
              <thead><tr><th>STATUS</th><th>DATE</th><th>TIME</th><th>PROVIDER / DEPT</th><th>LOCATION</th><th>ACTIONS</th></tr></thead>
              <tbody>
                <tr>
                  <td><span className={styles.legacyStatus} data-tone="good"><span className={styles.legacyStatusDot} aria-hidden="true" />CONFIRMED</span></td>
                  <td>09/10/26</td><td>14:30</td><td>MAYA CHEN MD<br /><small><JargonTerm>PCP</JargonTerm> / PRIMARY CARE</small></td><td>BLDG B · RM 304</td>
                  <td><button ref={rescheduleRef} className={styles.legacyActionButton} aria-label="Reschedule appointment" onClick={() => openReschedule('you')}>MODIFY</button> <button className={styles.legacyActionButton}>VIEW</button></td>
                </tr>
                <tr><td>COMPLETED</td><td>04/18/26</td><td>09:00</td><td>MAYA CHEN MD<br /><small>ANNUAL WELLNESS</small></td><td>BLDG B · RM 208</td><td><button className={styles.legacyActionButton}>SUMMARY</button></td></tr>
                <tr><td>COMPLETED</td><td>01/07/26</td><td>11:15</td><td>NORTHSTAR LAB<br /><small>LAB SERVICES</small></td><td>BLDG A · L1</td><td><button className={styles.legacyActionButton}>RESULT</button></td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className={styles.legacyPanel}>
          <header><h2>APPOINTMENT OPTIONS</h2></header>
          <div className={`${styles.legacyPanelBody} ${styles.legacyInlineForm}`}>
            <label>Filter visits: <select defaultValue="all"><option value="all">All visits</option><option>Upcoming</option><option>Past</option></select></label>
            <button>REQUEST NEW APPOINTMENT</button><button>PRINT SCHEDULE</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Appointments</span>
        <h2>Upcoming appointments</h2>
        <p>Review your next visit or choose a different available time.</p>
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
            <div className={styles.secondaryMetadata}><MapPin aria-hidden="true" /><span>Location<strong>Northstar Medical Center · Building B</strong></span></div>
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
