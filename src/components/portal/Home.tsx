import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAdaptationManifest, useAdaptationRegion } from '../../adaptation/useAdaptation';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { JargonTerm } from '../../simulation/JargonTerm';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

function StatusMark({ tone, icon: Icon }: { tone: 'good' | 'alert' | 'neutral'; icon: typeof Check }) {
  return (
    <span className={styles.unifiedStatusMark} data-tone={tone} aria-hidden="true">
      <Icon size={14} />
    </span>
  );
}

export function Home() {
  const appointment = usePortalStore((state) => state.appointment);
  const openSection = usePortalStore((state) => state.openSection);
  const openReschedule = usePortalStore((state) => state.openReschedule);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');
  const rescheduleRef = useSemanticTarget<HTMLButtonElement>('reschedule_button');
  const billingRef = useSemanticTarget<HTMLButtonElement>('billing_balance');
  const insuranceRef = useSemanticTarget<HTMLButtonElement>('insurance_status');
  const manifest = useAdaptationManifest();
  const summaryRegion = useAdaptationRegion('appointment_summary');
  const actionRegion = useAdaptationRegion('appointment_actions');
  const statusRegion = useAdaptationRegion('status_indicators');
  const secondaryRegion = useAdaptationRegion('secondary_content');
  const descriptiveActions = manifest.appointment_actions.labelStyle !== 'concise';
  const independentStatus = manifest.status_indicators.statusPresentation === 'icon-shape-text';
  const secondaryCollapsed = manifest.secondary_content.secondaryContent === 'collapsed';

  const secondaryContent = (
    <div className={styles.unifiedSecondaryGrid}>
      <section className={styles.unifiedPanel}>
        <header className={styles.unifiedPanelHeader}><h2>Recent results and records</h2><button onClick={() => openSection('documents', 'you')}>View all</button></header>
        <div className={styles.unifiedRecordList}>
          <span><time>08/20/26</time><strong>Office visit summary</strong><small>Primary care · Available</small></span>
          <span><time>04/18/26</time><strong>Annual wellness summary</strong><small>Primary care · Available</small></span>
          <span><time>02/07/26</time><strong>Insurance <JargonTerm>eligibility</JargonTerm></strong><small>Registration · Verified</small></span>
        </div>
      </section>
      <section className={styles.unifiedPanel}>
        <header className={styles.unifiedPanelHeader}><h2>Quick services</h2></header>
        <div className={styles.unifiedQuickLinks}>
          <button onClick={() => openSection('appointments', 'you')}>Request or change an appointment</button>
          <button onClick={() => openSection('messages', 'you')}>Send a message to the care team</button>
          <button onClick={() => openSection('billing', 'you')}>View statements and payments</button>
          <button onClick={() => openSection('insurance', 'you')}>Update insurance information</button>
        </div>
      </section>
    </div>
  );

  return (
    <div className={`${styles.page} ${styles.unifiedDashboard}`}>
      <div className={styles.portalBreadcrumb}>Home / Patient dashboard <span><JargonTerm>MRN</JargonTerm>: NS-0091847</span></div>
      <div className={styles.unifiedNoticeStrip} role="status">
        <strong>Account notices</strong><span>2 new messages</span><span>Balance due: $40</span><span>1 upcoming appointment</span>
      </div>

      <section {...summaryRegion} className={`${styles.unifiedPanel} ${styles.unifiedAppointmentPanel}`}>
        <header className={styles.unifiedPanelHeader}>
          <div><span className={styles.eyebrow}>Next appointment</span><h2>Primary care visit</h2></div>
          <span className={styles.patientIdentity}>Robert Martin · DOB 03/14/1962</span>
        </header>
        <div ref={appointmentRef} className={styles.unifiedAppointmentSummary}>
          <div className={styles.unifiedDateTile} aria-label={`${appointment.dateLabel} at ${appointment.time}`}>
            <span>SEP</span><strong>{appointment.date.slice(-2)}</strong><small>{appointment.time}</small>
          </div>
          <div className={styles.unifiedAppointmentData}>
            <span className={styles.unifiedStatus}><StatusMark tone="good" icon={Check} />{appointment.status}</span>
            <h3>{appointment.provider}</h3>
            <p>{appointment.specialty}</p>
            <div className={styles.unifiedMetadata} data-secondary-detail="true">
              <span><CalendarDays size={16} aria-hidden="true" />{appointment.dateLabel}</span>
              <span><Clock3 size={16} aria-hidden="true" />{appointment.time}</span>
              <span>Northstar Medical Center · Building B</span>
            </div>
          </div>
          <div {...actionRegion} className={styles.unifiedAppointmentActions}>
            <div className={styles.primaryActionGroup}>
              <button onClick={() => openSection('appointments', 'you')}>{descriptiveActions ? 'View appointment details' : 'VIEW APPT'}</button>
              <button ref={rescheduleRef} aria-label="Reschedule appointment" onClick={() => openReschedule('you')}>
                {descriptiveActions ? 'Reschedule appointment' : 'MODIFY APPT'}
              </button>
              <button type="button">{descriptiveActions ? 'Print appointment' : 'PRINT'}</button>
            </div>
            <div className={styles.destructiveActionGroup}>
              <span>Other action</span>
              <button type="button">{descriptiveActions ? 'Cancel appointment' : 'CANCEL APPT'}</button>
            </div>
          </div>
        </div>
      </section>

      <section {...statusRegion} className={styles.unifiedStatusGrid} aria-label="Account statuses">
        <button ref={billingRef} className={styles.unifiedStatusCard} onClick={() => openSection('billing', 'you')}>
          {independentStatus ? <StatusMark tone="alert" icon={AlertTriangle} /> : <CreditCard size={18} aria-hidden="true" />}
          <span><small>Account balance</small><strong>$40.00</strong><em>Payment due</em></span>
        </button>
        <button ref={insuranceRef} className={styles.unifiedStatusCard} onClick={() => openSection('insurance', 'you')}>
          {independentStatus ? <StatusMark tone="good" icon={CheckCircle2} /> : <ShieldCheck size={18} aria-hidden="true" />}
          <span><small>Primary insurance</small><strong>Harbor Health</strong><em>Active</em></span>
        </button>
        <button className={styles.unifiedStatusCard} onClick={() => openSection('messages', 'you')}>
          {independentStatus ? <StatusMark tone="alert" icon={AlertTriangle} /> : <MessageCircle size={18} aria-hidden="true" />}
          <span><small>Messages</small><strong>2 new</strong><em>Action needed</em></span>
        </button>
        <button className={styles.unifiedStatusCard} onClick={() => openSection('documents', 'you')}>
          {independentStatus ? <StatusMark tone="neutral" icon={Check} /> : <FileText size={18} aria-hidden="true" />}
          <span><small>Forms and documents</small><strong>3 on file</strong><em>Up to date</em></span>
        </button>
      </section>

      <section {...secondaryRegion} className={styles.unifiedSecondaryContent}>
        {secondaryCollapsed ? (
          <details>
            <summary>Show secondary portal information</summary>
            {secondaryContent}
          </details>
        ) : secondaryContent}
      </section>

      <section className={styles.requiredPortalInformation} aria-label="Required portal information">
        <strong>Portal information</strong>
        <p>For emergencies call 911. Messages may require up to two business days for a response. This demonstration contains fictional information only.</p>
      </section>
    </div>
  );
}
