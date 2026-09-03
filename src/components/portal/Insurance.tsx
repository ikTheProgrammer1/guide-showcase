import { Check, FileCheck2, ShieldCheck, Upload, X } from 'lucide-react';
import { demoInsurance } from '../../data/demoData';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { JargonTerm } from '../../simulation/JargonTerm';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

export function Insurance() {
  const updateOpen = usePortalStore((state) => state.insuranceUpdateOpen);
  const saved = usePortalStore((state) => state.insuranceUpdateSaved);
  const openUpdate = usePortalStore((state) => state.openInsuranceUpdate);
  const closeUpdate = usePortalStore((state) => state.closeInsuranceUpdate);
  const saveUpdate = usePortalStore((state) => state.saveInsuranceUpdate);
  const updateRef = useSemanticTarget<HTMLButtonElement>('update_insurance_button');
  const statusRef = useSemanticTarget<HTMLElement>('insurance_status');

  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Insurance</span>
        <h2>Insurance coverage</h2>
        <p>Review the plan currently listed on this fictional account.</p>
      </div>

      <div className={styles.insuranceGrid}>
        <section ref={statusRef} className={styles.insuranceCard}>
          <div className={styles.insuranceGlow} aria-hidden="true" />
          <header><ShieldCheck size={25} aria-hidden="true" /><span>{demoInsurance.carrier}</span></header>
          <div className={styles.insurancePlan}>
            <span>Plan</span>
            <strong>{demoInsurance.plan}</strong>
          </div>
          <footer><span><JargonTerm>Member ID</JargonTerm> {demoInsurance.memberId}</span><span className={styles.activeBadge}><Check size={13} aria-hidden="true" /> {demoInsurance.status}</span></footer>
        </section>

        <section className={styles.insuranceActions}>
          <span className={styles.eyebrow}>Current card</span>
          <h3>Your insurance is active.</h3>
          <p>Update this demo if your plan or member card has changed.</p>
          <button ref={updateRef} className={styles.primaryButton} onClick={() => openUpdate('you')}>
            <Upload size={17} aria-hidden="true" /> Update insurance
          </button>
        </section>
      </div>

      {updateOpen ? (
        <section className={styles.updatePanel} aria-labelledby="insurance-update-title">
          <header>
            <div><span className={styles.eyebrow}>Simulated workflow</span><h3 id="insurance-update-title">Update insurance</h3></div>
            <button className={styles.iconButton} onClick={() => closeUpdate('you')} aria-label="Close insurance update"><X size={19} aria-hidden="true" /></button>
          </header>
          {saved ? (
            <div className={styles.savedState}>
              <FileCheck2 size={28} aria-hidden="true" />
              <div><strong>Demo update saved</strong><p>No information was uploaded or stored.</p></div>
            </div>
          ) : (
            <>
              <div className={styles.fakeUpload}>
                <Upload size={24} aria-hidden="true" />
                <strong>Insurance card preview</strong>
                <p>A real product could accept a card here. This demonstration never uploads files.</p>
                <button className={styles.secondaryButton}>Choose demo card</button>
              </div>
              <button className={styles.primaryButton} onClick={() => saveUpdate('you')}>Save demo update</button>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
