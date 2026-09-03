import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { refreshGuidePosition } from '../../presence/presenceController';
import { getTargetRect } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function AgentPresence() {
  const presence = usePortalStore((state) => state.agentPresence);
  const largeControls = usePortalStore((state) => state.accessibility.controlSize === 'large');
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

  useEffect(() => {
    const update = () => {
      refreshGuidePosition();
      const rect = presence.target ? getTargetRect(presence.target) : null;
      setHighlight(
        rect
          ? { left: rect.left - 7, top: rect.top - 7, width: rect.width + 14, height: rect.height + 14 }
          : null,
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [presence.target, presence.operationId, presence.visible]);

  return (
    <div className={styles.agentLayer} aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {presence.visible && highlight && presence.status !== 'moving' ? (
          <motion.div
            className={styles.targetHighlight}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, ...highlight }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.24 }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {presence.visible && presence.position ? (
          <motion.div
            className={styles.agentPointer}
            data-large={largeControls ? 'true' : 'false'}
            initial={{ opacity: 0, scale: 0.72, x: presence.position.x, y: presence.position.y + 12 }}
            animate={{ opacity: 1, scale: 1, x: presence.position.x, y: presence.position.y }}
            exit={{ opacity: 0, scale: 0.82 }}
            transition={{ type: 'spring', stiffness: 210, damping: 23, mass: 0.8 }}
          >
            <div className={styles.agentOrb} aria-hidden="true"><Sparkles size={18} /></div>
            {presence.message ? (
              <motion.div
                className={styles.agentBubble}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: presence.status === 'moving' ? 0 : 1, y: 0 }}
              >
                <span>Guide</span>
                <p>{presence.message}</p>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
