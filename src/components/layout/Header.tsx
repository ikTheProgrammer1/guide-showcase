import { RotateCcw, Sparkles, WifiOff } from 'lucide-react';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { resetDemoExperience } from '../../state/resetDemo';
import type { WebMCPStatus } from '../../webmcp/useWebMCPTools';
import { PersonalizeInterface } from '../guide/PersonalizeInterface';
import styles from '../../app/App.module.css';

export function Header({ webMcpStatus }: { webMcpStatus: WebMCPStatus }) {
  const guideStatusRef = useSemanticTarget<HTMLDivElement>('guide_status');

  return (
    <header className={styles.header}>
      <div>
        <span className={styles.headerKicker}>Wednesday, September 2, 2026 · Last sign-in 8:42 AM</span>
        <h1>Patient Services</h1>
      </div>
      <div className={styles.headerActions}>
        <PersonalizeInterface />
        <div
          ref={guideStatusRef}
          className={styles.connectionPill}
          data-ready={webMcpStatus === 'ready' ? 'true' : 'false'}
          role="status"
          aria-label={webMcpStatus === 'ready' ? 'WebMCP status: Guide available' : 'WebMCP status: Preview mode'}
        >
          {webMcpStatus === 'ready' ? <Sparkles size={15} aria-hidden="true" /> : <WifiOff size={15} aria-hidden="true" />}
          <span>{webMcpStatus === 'ready' ? 'Guide available' : 'Standard portal'}</span>
        </div>
        <button className={styles.resetButton} onClick={resetDemoExperience}>
          <RotateCcw size={16} aria-hidden="true" />
          Reset demo
        </button>
      </div>
    </header>
  );
}
