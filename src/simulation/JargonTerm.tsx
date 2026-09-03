import type { ReactNode } from 'react';
import styles from '../app/App.module.css';

export function JargonTerm({ children }: { children: ReactNode }) {
  return (
    <span className={styles.jargonTerm}>
      <span className={styles.jargonOriginal}>{children}</span>
      <span className={styles.jargonMask} aria-hidden="true">unfamiliar term</span>
    </span>
  );
}
