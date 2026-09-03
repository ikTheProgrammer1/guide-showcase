import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { isPortalAdapted } from '../../data/demoData';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

function LegacyStatus({ tone, children }: { tone: 'good' | 'alert' | 'neutral'; children: React.ReactNode }) {
  return (
    <span className={styles.legacyStatus} data-tone={tone}>
      <span className={styles.legacyStatusDot} aria-hidden="true" />
      {children}
    </span>
  );
}

function LegacyHome() {
  const appointment = usePortalStore((state) => state.appointment);
  const openSection = usePortalStore((state) => state.openSection);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');
  const rescheduleRef = useSemanticTarget<HTMLButtonElement>('reschedule_button');
  const billingRef = useSemanticTarget<HTMLDivElement>('billing_balance');
  const insuranceRef = useSemanticTarget<HTMLDivElement>('insurance_status');

  return (
    <div className={`${styles.page} ${styles.legacyDashboard}`}>
      <div className={styles.legacyBreadcrumb}>HOME &gt; PATIENT DASHBOARD <span>MRN: NS-0091847</span></div>
      <div className={styles.legacyAlertStrip} role="status">
        <strong>ACCOUNT NOTICES:</strong> 2 NEW MESSAGE(S) &nbsp;|&nbsp; BALANCE DUE: $40.00 &nbsp;|&nbsp; 1 UPCOMING APPOINTMENT
      </div>

      <section ref={appointmentRef} className={`${styles.legacyPanel} ${styles.legacyPrimaryPanel}`}>
        <header><h2>PATIENT SUMMARY</h2><span>ROBERT MARTIN · DOB 03/14/1962</span></header>
        <div className={styles.legacyPanelBody}>
          <table className={styles.legacyAppointmentTable}>
            <caption className={styles.visuallyHidden}>Upcoming appointment summary</caption>
            <tbody>
              <tr><th>APPT STATUS:</th><td><LegacyStatus tone="good">CONFIRMED</LegacyStatus></td><th>PROVIDER:</th><td>MAYA CHEN MD</td></tr>
              <tr><th>TYPE:</th><td>PCP / OFFICE VISIT</td><th>DATE/TIME:</th><td>{appointment.date.slice(5).replace('-', '/')} / 26 &nbsp; 14:30</td></tr>
              <tr><th>LOCATION:</th><td colSpan={3}>NSMC BLDG B · RM 304 · 1550 NORTH AVE</td></tr>
              <tr><th>FACILITY PHONE:</th><td>(555) 014-0281</td><th>VISIT ID:</th><td>VST-260910-304</td></tr>
            </tbody>
          </table>
          <div className={styles.legacyActions}>
            <button onClick={() => openSection('appointments', 'you')}>VIEW APPT</button>
            <button ref={rescheduleRef} aria-label="Reschedule appointment" onClick={() => openSection('appointments', 'you')}>MODIFY APPT</button>
            <button type="button">CANCEL APPT</button>
            <button type="button">PRINT</button>
          </div>
        </div>
      </section>

      <div className={styles.legacyStatusGrid}>
        <div ref={billingRef} className={styles.legacyStatusBox}>
          <span>ACCOUNT BALANCE</span><strong>$40.00</strong><LegacyStatus tone="alert">PAYMENT DUE</LegacyStatus>
          <button onClick={() => openSection('billing', 'you')}>PAY / VIEW DETAIL</button>
        </div>
        <div ref={insuranceRef} className={styles.legacyStatusBox}>
          <span>PRIMARY INSURANCE</span><strong>HARBOR HEALTH</strong><LegacyStatus tone="good">ACTIVE</LegacyStatus>
          <button onClick={() => openSection('insurance', 'you')}>VIEW COVERAGE</button>
        </div>
        <div className={styles.legacyStatusBox}>
          <span>MESSAGES</span><strong>2 NEW</strong><LegacyStatus tone="alert">ACTION NEEDED</LegacyStatus>
          <button onClick={() => openSection('messages', 'you')}>OPEN INBOX</button>
        </div>
        <div className={styles.legacyStatusBox}>
          <span>FORMS / DOCUMENTS</span><strong>3 ON FILE</strong><LegacyStatus tone="neutral">UP TO DATE</LegacyStatus>
          <button onClick={() => openSection('documents', 'you')}>DOCUMENT CENTER</button>
        </div>
      </div>

      <div className={styles.legacyColumns}>
        <section className={styles.legacyPanel}>
          <header><h2>RECENT RESULTS &amp; RECORDS</h2><button onClick={() => openSection('documents', 'you')}>VIEW ALL</button></header>
          <table className={styles.legacyDataTable}>
            <thead><tr><th>DATE</th><th>ITEM</th><th>DEPT</th><th>STATUS</th></tr></thead>
            <tbody>
              <tr><td>08/20/26</td><td>Office visit summary</td><td>PRIMARY CARE</td><td><LegacyStatus tone="good">AVAILABLE</LegacyStatus></td></tr>
              <tr><td>04/18/26</td><td>Annual wellness summary</td><td>PRIMARY CARE</td><td><LegacyStatus tone="good">AVAILABLE</LegacyStatus></td></tr>
              <tr><td>02/07/26</td><td>Insurance eligibility</td><td>REGISTRATION</td><td><LegacyStatus tone="neutral">VERIFIED</LegacyStatus></td></tr>
            </tbody>
          </table>
        </section>

        <section className={styles.legacyPanel}>
          <header><h2>QUICK LINKS / SERVICES</h2></header>
          <div className={styles.legacyLinkList}>
            <button onClick={() => openSection('appointments', 'you')}>» REQUEST / CHANGE APPOINTMENT</button>
            <button onClick={() => openSection('messages', 'you')}>» SEND MESSAGE TO CARE TEAM</button>
            <button onClick={() => openSection('billing', 'you')}>» VIEW STATEMENTS &amp; PAYMENTS</button>
            <button onClick={() => openSection('insurance', 'you')}>» UPDATE INSURANCE INFORMATION</button>
            <button onClick={() => openSection('settings', 'you')}>» ACCESSIBILITY / DISPLAY SETTINGS</button>
          </div>
        </section>
      </div>

      <section className={`${styles.legacyPanel} ${styles.legacyFooterPanel}`}>
        <header><h2>PORTAL INFORMATION</h2></header>
        <p>For emergencies call 911. Messages may require up to two business days for a response. This demonstration contains fictional information only.</p>
      </section>
    </div>
  );
}

function AdaptedHome() {
  const appointment = usePortalStore((state) => state.appointment);
  const colorIndependent = usePortalStore((state) => state.accessibility.colorIndependentStatus);
  const openSection = usePortalStore((state) => state.openSection);
  const appointmentRef = useSemanticTarget<HTMLDivElement>('upcoming_appointment');
  const rescheduleRef = useSemanticTarget<HTMLButtonElement>('reschedule_button');
  const billingRef = useSemanticTarget<HTMLButtonElement>('billing_balance');
  const insuranceRef = useSemanticTarget<HTMLButtonElement>('insurance_status');

  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Patient overview</span>
        <h2>Good afternoon, Robert.</h2>
        <p>Here are the items that need your attention.</p>
      </div>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>Next appointment</span><h2>Primary care visit</h2></div>
          <button className={styles.textButton} onClick={() => openSection('appointments', 'you')}>
            All appointments <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div ref={appointmentRef} className={styles.appointmentFeature}>
          <div className={styles.dateTile} aria-label={`${appointment.dateLabel} at ${appointment.time}`}>
            <span>SEP</span><strong>{appointment.date.slice(-2)}</strong><small>{appointment.time}</small>
          </div>
          <div className={styles.appointmentInfo}>
            <span className={styles.statusPill}>
              {colorIndependent ? <Check size={13} aria-hidden="true" /> : null}{appointment.status}
            </span>
            <h3>{appointment.provider}</h3>
            <p>{appointment.specialty}</p>
            <div className={styles.metaRow}>
              <span><CalendarDays size={16} aria-hidden="true" /> {appointment.dateLabel}</span>
              <span><Clock3 size={16} aria-hidden="true" /> {appointment.time}</span>
            </div>
          </div>
          <button ref={rescheduleRef} className={styles.secondaryButton} onClick={() => openSection('appointments', 'you')}>Change appointment</button>
        </div>
      </section>

      <section className={styles.quickGrid} aria-label="Items requiring attention">
        <button className={styles.quickCard} onClick={() => openSection('messages', 'you')}>
          <span className={styles.quickIcon}><MessageCircle size={19} aria-hidden="true" /></span>
          <span><strong>2 new messages</strong><small>From your care team</small></span><ArrowRight size={17} aria-hidden="true" />
        </button>
        <button ref={insuranceRef} className={styles.quickCard} onClick={() => openSection('insurance', 'you')}>
          <span className={styles.quickIcon}>{colorIndependent ? <CheckCircle2 size={19} aria-hidden="true" /> : <ShieldCheck size={19} aria-hidden="true" />}</span>
          <span><strong>Insurance: Active</strong><small>Coverage verified</small></span><ArrowRight size={17} aria-hidden="true" />
        </button>
        <button ref={billingRef} className={`${styles.quickCard} ${styles.paymentCard}`} onClick={() => openSection('billing', 'you')}>
          <span className={styles.quickIcon}>{colorIndependent ? <AlertTriangle size={19} aria-hidden="true" /> : <CreditCard size={19} aria-hidden="true" />}</span>
          <span><strong>Payment due: $40</strong><small>Office visit statement</small></span><ArrowRight size={17} aria-hidden="true" />
        </button>
        <button className={`${styles.quickCard} ${styles.secondaryMetadata}`} onClick={() => openSection('documents', 'you')}>
          <span className={styles.quickIcon}><FileText size={19} aria-hidden="true" /></span>
          <span><strong>Documents up to date</strong><small>No forms are waiting</small></span><ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

export function Home() {
  const adapted = usePortalStore((state) => isPortalAdapted(state.accessibility));
  return adapted ? <AdaptedHome /> : <LegacyHome />;
}
