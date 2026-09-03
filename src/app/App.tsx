import { AnimatePresence, motion } from 'motion/react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { AgentPresence } from '../components/guide/AgentPresence';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Appointments } from '../components/portal/Appointments';
import { Billing } from '../components/portal/Billing';
import { Home } from '../components/portal/Home';
import { Insurance } from '../components/portal/Insurance';
import { PlaceholderSection } from '../components/portal/PlaceholderSection';
import { RescheduleDialog } from '../components/portal/RescheduleDialog';
import { SettingsPage } from '../components/portal/SettingsPage';
import { isPortalAdapted } from '../data/demoData';
import { cancelGuidePresence } from '../presence/presenceController';
import { useSemanticTarget } from '../presence/targetRegistry';
import { usePortalStore } from '../state/portalStore';
import { useWebMCPTools } from '../webmcp/useWebMCPTools';
import styles from './App.module.css';

const sectionDescriptions = {
  messages: {
    eyebrow: 'Messages',
    title: 'Message center',
    description: 'Review administrative messages from your fictional care team.',
  },
  documents: {
    eyebrow: 'Documents',
    title: 'Documents and results',
    description: 'Review fictional visit summaries and administrative forms.',
  },
} as const;

function CurrentSection() {
  const section = usePortalStore((state) => state.currentSection);

  if (section === 'home') return <Home />;
  if (section === 'appointments') return <Appointments />;
  if (section === 'billing') return <Billing />;
  if (section === 'insurance') return <Insurance />;
  if (section === 'settings') return <SettingsPage />;

  return <PlaceholderSection {...sectionDescriptions[section]} section={section} />;
}

export function App() {
  const accessibility = usePortalStore((state) => state.accessibility);
  const currentSection = usePortalStore((state) => state.currentSection);
  const openSection = usePortalStore((state) => state.openSection);
  const status = useWebMCPTools();
  const portalSurfaceRef = useSemanticTarget<HTMLElement>('portal_surface');
  const interfaceMode = isPortalAdapted(accessibility) ? 'adapted' : 'legacy';

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
      data-status-mode={accessibility.colorIndependentStatus ? 'independent' : 'color-led'}
      data-interface={interfaceMode}
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
                ? 'The portal works normally here; Guide tools require a supported ChatGPT desktop account and model using the built-in browser, or a WebMCP-enabled Chrome environment.'
                : status === 'registering'
                  ? 'Guide is registering semantic tools with this browser.'
                  : 'The manual portal remains available while tool registration is unavailable.'}
            </div>
          ) : null}

          {interfaceMode === 'adapted' ? (
            <motion.div
              className={styles.adaptationBanner}
              role="status"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <span className={styles.adaptationMark}><Sparkles size={16} aria-hidden="true" /></span>
              <span><strong>Interface adapted</strong> around your current readability preferences.</span>
              <button onClick={() => openSection('settings', 'you')}>
                <SlidersHorizontal size={15} aria-hidden="true" /> Review settings
              </button>
            </motion.div>
          ) : null}

          <div className={styles.portalGrid}>
            <main ref={portalSurfaceRef} id="portal-content" className={styles.mainContent} tabIndex={-1}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentSection}-${interfaceMode}`}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: interfaceMode === 'adapted' ? 0.52 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CurrentSection />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      <RescheduleDialog />
      <AgentPresence />
    </div>
  );
}
