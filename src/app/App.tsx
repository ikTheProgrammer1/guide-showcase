import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { AccessibilityControls } from '../components/guide/AccessibilityControls';
import { ActivityLog } from '../components/guide/ActivityLog';
import { AgentPresence } from '../components/guide/AgentPresence';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Appointments } from '../components/portal/Appointments';
import { Billing } from '../components/portal/Billing';
import { Home } from '../components/portal/Home';
import { Insurance } from '../components/portal/Insurance';
import { PlaceholderSection } from '../components/portal/PlaceholderSection';
import { RescheduleDialog } from '../components/portal/RescheduleDialog';
import { cancelGuidePresence } from '../presence/presenceController';
import { usePortalStore } from '../state/portalStore';
import { useWebMCPTools } from '../webmcp/useWebMCPTools';
import styles from './App.module.css';

const sectionDescriptions = {
  messages: {
    eyebrow: 'Messages',
    title: 'A quieter inbox',
    description: 'Administrative messages from your care team would appear here.',
  },
  documents: {
    eyebrow: 'Documents',
    title: 'Your records, organized',
    description: 'Visit summaries and administrative forms would appear here.',
  },
  settings: {
    eyebrow: 'Settings',
    title: 'Portal preferences',
    description: 'Manage communication and account preferences in one place.',
  },
} as const;

function CurrentSection() {
  const section = usePortalStore((state) => state.currentSection);

  if (section === 'home') return <Home />;
  if (section === 'appointments') return <Appointments />;
  if (section === 'billing') return <Billing />;
  if (section === 'insurance') return <Insurance />;

  return <PlaceholderSection {...sectionDescriptions[section]} section={section} />;
}

export function App() {
  const accessibility = usePortalStore((state) => state.accessibility);
  const currentSection = usePortalStore((state) => state.currentSection);
  const status = useWebMCPTools();

  useEffect(() => () => cancelGuidePresence(), []);

  return (
    <div
      className={styles.app}
      data-contrast={accessibility.contrast}
      data-density={accessibility.density}
      data-controls={accessibility.controlSize}
      data-spacing={accessibility.spacing}
      data-emphasize={accessibility.emphasizeInteractive ? 'true' : 'false'}
      data-text-scale={accessibility.textScale}
      style={{ '--text-scale': accessibility.textScale / 100 } as React.CSSProperties}
    >
      <a className={styles.skipLink} href="#portal-content">
        Skip to portal content
      </a>
      <div className={styles.demoRibbon}>
        <span aria-hidden="true" className={styles.ribbonDot} />
        Fictional demonstration environment
      </div>

      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.workspace}>
          <Header webMcpStatus={status} />
          {status !== 'ready' ? (
            <div className={styles.webMcpNotice} role="status">
              <strong>{status === 'error' ? 'WebMCP registration needs attention.' : 'Portal preview mode.'}</strong>{' '}
              {status === 'unavailable'
                ? 'The portal works normally here; agent tools require ChatGPT’s in-app browser or WebMCP-enabled Chrome.'
                : status === 'registering'
                  ? 'Guide is registering semantic tools with this browser.'
                  : 'The manual portal remains available while tool registration is unavailable.'}
            </div>
          ) : null}

          <div className={styles.portalGrid}>
            <main id="portal-content" className={styles.mainContent} tabIndex={-1}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CurrentSection />
                </motion.div>
              </AnimatePresence>
            </main>

            <aside className={styles.guideRail} aria-label="Guide controls and activity">
              <AccessibilityControls />
              <ActivityLog />
            </aside>
          </div>
        </div>
      </div>

      <RescheduleDialog />
      <AgentPresence />
    </div>
  );
}
