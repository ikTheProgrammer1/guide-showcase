import { ArrowDown, CheckCircle2, CircleDollarSign, FileDown, HelpCircle } from 'lucide-react';
import { demoBill } from '../../data/demoData';
import { useSemanticTarget } from '../../presence/targetRegistry';
import styles from '../../app/App.module.css';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function Billing() {
  const balanceRef = useSemanticTarget<HTMLElement>('billing_balance');
  const responsibilityRef = useSemanticTarget<HTMLDivElement>('patient_responsibility');

  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Billing</span>
        <h2>Billing and statements</h2>
        <p>Review the charges, insurance payment, and remaining balance for this fictional visit.</p>
      </div>

      <section ref={balanceRef} className={styles.billCard}>
        <header className={styles.billHeader}>
          <div className={styles.billIcon}><CircleDollarSign size={22} aria-hidden="true" /></div>
          <div><span className={styles.eyebrow}>Statement · August 20</span><h3>{demoBill.label}</h3></div>
          <span className={styles.duePill}>{demoBill.status}</span>
        </header>

        <div className={styles.billFlow}>
          <div><span>Provider charged</span><strong>{currency.format(demoBill.providerCharge)}</strong><small>The original visit charge</small></div>
          <ArrowDown aria-hidden="true" />
          <div><span>Insurance paid</span><strong>−{currency.format(demoBill.insurancePaid)}</strong><small><CheckCircle2 size={14} aria-hidden="true" /> Applied to this bill</small></div>
          <ArrowDown aria-hidden="true" />
          <div ref={responsibilityRef} className={styles.responsibility}>
            <span>Your responsibility</span><strong>{currency.format(demoBill.patientResponsibility)}</strong><small>The remaining administrative balance</small>
          </div>
        </div>

        <footer className={styles.billFooter}>
          <span><HelpCircle size={16} aria-hidden="true" /> Need help understanding this statement?</span>
          <button className={styles.secondaryButton}><FileDown size={16} aria-hidden="true" /> Download statement</button>
        </footer>
      </section>

      <p className={styles.disclaimer}>This fictional breakdown is for interface demonstration only, not financial advice.</p>
    </div>
  );
}
