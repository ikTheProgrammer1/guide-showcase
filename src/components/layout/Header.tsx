import { RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { cancelGuidePresence } from '../../presence/presenceController';
import { usePortalStore } from '../../state/portalStore';
import type { WebMCPStatus } from '../../webmcp/useWebMCPTools';
import styles from '../../app/App.module.css';

export function Header({ webMcpStatus }: { webMcpStatus: WebMCPStatus }) {
  const resetDemo = usePortalStore((state) => state.resetDemo);

  const reset = () => {
    cancelGuidePresence();
    resetDemo();
  };

  return (
    <header className={styles.header}>
      <div>
        <span className={styles.headerKicker}>Wednesday · September 2</span>
        <h1>Good afternoon, Robert.</h1>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.connectionPill} data-ready={webMcpStatus === 'ready' ? 'true' : 'false'}>
          {webMcpStatus === 'ready' ? <Wifi size={15} aria-hidden="true" /> : <WifiOff size={15} aria-hidden="true" />}
          <span>{webMcpStatus === 'ready' ? 'Guide connected' : 'Preview mode'}</span>
        </div>
        <button className={styles.resetButton} onClick={reset}>
          <RotateCcw size={16} aria-hidden="true" />
          Reset demo
        </button>
      </div>
    </header>
  );
}
