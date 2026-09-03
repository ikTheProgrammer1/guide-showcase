import { Bell, FileText, Mail, Settings2 } from 'lucide-react';
import type { PortalSection } from '../../types';
import styles from '../../app/App.module.css';

const icons = { messages: Mail, documents: FileText, settings: Settings2 } as const;

export function PlaceholderSection({
  section,
  eyebrow,
  title,
  description,
}: {
  section: Exclude<PortalSection, 'home' | 'appointments' | 'billing' | 'insurance'>;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const Icon = icons[section];
  return (
    <div className={styles.page}>
      <div className={styles.pageIntro}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <section className={styles.placeholderCard}>
        <span className={styles.placeholderIcon}><Icon size={28} aria-hidden="true" /></span>
        <h3>{section === 'messages' ? 'Two administrative messages' : section === 'documents' ? 'Documents are up to date' : 'Preferences are ready'}</h3>
        <p>
          {section === 'messages'
            ? 'Appointment reminder · Portal welcome message'
            : section === 'documents'
              ? 'There are no forms requiring your attention.'
              : 'Email notifications are currently enabled.'}
        </p>
        {section === 'settings' ? <button className={styles.secondaryButton}><Bell size={16} aria-hidden="true" /> Notification preferences</button> : null}
      </section>
    </div>
  );
}
