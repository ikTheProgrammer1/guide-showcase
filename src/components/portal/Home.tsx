import { ArrowRight, CalendarDays, Check, Clock3, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

export function Home() {
  const appointment = usePortalStore((state) => state.appointment);
  const openSection = usePortalStore((state) => state.openSection);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Your care, one clear step at a time</span>
          <h2>Everything important.<br /><em>Nothing in the way.</em></h2>
          <p>Review appointments, understand costs, and keep your information current—with Guide beside you when you want it.</p>
        </div>
        <div className={styles.heroMotif} aria-hidden="true">
          <span className={styles.motifRing} />
          <span className={styles.motifPath} />
          <Sparkles size={24} />
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Next up</span>
            <h2>Your upcoming appointment</h2>
          </div>
          <button className={styles.textButton} onClick={() => openSection('appointments', 'you')}>
            All appointments <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div ref={appointmentRef} className={styles.appointmentFeature}>
          <div className={styles.dateTile} aria-label={`${appointment.dateLabel} at ${appointment.time}`}>
            <span>SEP</span>
            <strong>{appointment.date.slice(-2)}</strong>
            <small>{appointment.time}</small>
          </div>
          <div className={styles.appointmentInfo}>
            <span className={styles.statusPill}><Check size={13} aria-hidden="true" /> {appointment.status}</span>
            <h3>{appointment.provider}</h3>
            <p>{appointment.specialty}</p>
            <div className={styles.metaRow}>
              <span><CalendarDays size={16} aria-hidden="true" /> {appointment.dateLabel}</span>
              <span><Clock3 size={16} aria-hidden="true" /> {appointment.time}</span>
            </div>
          </div>
          <button className={styles.secondaryButton} onClick={() => openSection('appointments', 'you')}>
            View details
          </button>
        </div>
      </section>

      <section className={styles.quickGrid} aria-label="Portal overview">
        <button className={styles.quickCard} onClick={() => openSection('messages', 'you')}>
          <span className={styles.quickIcon}><MessageCircle size={19} aria-hidden="true" /></span>
          <span><strong>2 new messages</strong><small>From your care team</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
        <button className={styles.quickCard} onClick={() => openSection('insurance', 'you')}>
          <span className={styles.quickIcon}><ShieldCheck size={19} aria-hidden="true" /></span>
          <span><strong>Insurance active</strong><small>Card verified</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>

      <section className={styles.sharedInterfaceNote}>
        <span className={styles.noteStar}><Sparkles size={18} aria-hidden="true" /></span>
        <div>
          <strong>A shared interface</strong>
          <p>Guide can adapt, point, or act—but you can always take the controls yourself.</p>
        </div>
      </section>
    </div>
  );
}
