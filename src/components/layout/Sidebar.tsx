import {
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  Mail,
  Compass,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import type { PortalSection, SemanticTarget } from '../../types';
import styles from '../../app/App.module.css';

const navigation: Array<{
  section: PortalSection;
  label: string;
  icon: typeof Home;
  target: SemanticTarget;
}> = [
  { section: 'home', label: 'Home', icon: Home, target: 'home_navigation' },
  { section: 'appointments', label: 'Appointments', icon: CalendarDays, target: 'appointments_navigation' },
  { section: 'messages', label: 'Messages', icon: Mail, target: 'messages_navigation' },
  { section: 'billing', label: 'Billing', icon: CreditCard, target: 'billing_navigation' },
  { section: 'insurance', label: 'Insurance', icon: ShieldCheck, target: 'insurance_navigation' },
  { section: 'documents', label: 'Documents', icon: FileText, target: 'documents_navigation' },
  { section: 'settings', label: 'Settings', icon: Settings, target: 'settings_navigation' },
];

function NavigationItem({
  item,
  active,
  onOpen,
}: {
  item: (typeof navigation)[number];
  active: boolean;
  onOpen: (section: PortalSection) => void;
}) {
  const targetRef = useSemanticTarget<HTMLButtonElement>(item.target);
  const Icon = item.icon;
  return (
    <li>
      <button
        ref={targetRef}
        className={styles.navButton}
        data-active={active ? 'true' : 'false'}
        aria-current={active ? 'page' : undefined}
        onClick={() => onOpen(item.section)}
      >
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
        {item.section === 'messages' ? <span className={styles.navCount}>2</span> : null}
      </button>
    </li>
  );
}

export function Sidebar() {
  const currentSection = usePortalStore((state) => state.currentSection);
  const openSection = usePortalStore((state) => state.openSection);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandLockup}>
        <div className={styles.brandMark} aria-hidden="true">
          <Compass size={21} />
        </div>
        <div>
          <strong>Northstar Health</strong>
          <span>Patient Services Portal</span>
        </div>
      </div>

      <nav aria-label="Portal sections">
        <ul className={styles.navList}>
          {navigation.map((item) => (
            <NavigationItem
              key={item.section}
              item={item}
              active={currentSection === item.section}
              onOpen={(section) => openSection(section, 'you')}
            />
          ))}
        </ul>
      </nav>

      <nav className={styles.legacyExtraNav} aria-label="Additional patient services">
        <button onClick={() => openSection('home', 'you')}>My Chart</button>
        <button onClick={() => openSection('documents', 'you')}>Results</button>
        <button onClick={() => openSection('messages', 'you')}>Rx Refills</button>
        <button onClick={() => openSection('messages', 'you')}>Help</button>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.avatar} aria-hidden="true">R</div>
        <div>
          <strong>Robert</strong>
          <span>Demo patient</span>
        </div>
      </div>
    </aside>
  );
}
