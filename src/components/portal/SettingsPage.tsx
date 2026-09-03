import { Bell, LockKeyhole, UserRound } from 'lucide-react';
import { AccessibilityControls } from '../guide/AccessibilityControls';
import { ActivityLog } from '../guide/ActivityLog';
import styles from '../../app/App.module.css';

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>Settings</span>
        <h2>Portal preferences</h2>
        <p>Adjust how information is displayed. These controls work with or without Guide.</p>
      </div>

      <div className={styles.settingsGrid}>
        <AccessibilityControls />
        <ActivityLog />
      </div>

      <section className={`${styles.sectionBlock} ${styles.secondarySection}`}>
        <div className={styles.settingsRows}>
          <button><UserRound size={17} aria-hidden="true" /><span><strong>Profile information</strong><small>Name, address, and contact information</small></span></button>
          <button><Bell size={17} aria-hidden="true" /><span><strong>Notification preferences</strong><small>Email and portal reminders</small></span></button>
          <button><LockKeyhole size={17} aria-hidden="true" /><span><strong>Security settings</strong><small>Password and sign-in activity</small></span></button>
        </div>
      </section>
    </div>
  );
}
