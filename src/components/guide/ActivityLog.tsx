import { History, Sparkles, UserRound } from 'lucide-react';
import { usePortalStore } from '../../state/portalStore';
import styles from '../../app/App.module.css';

export function ActivityLog() {
  const events = usePortalStore((state) => state.activityLog);
  const visibleEvents = events.slice(-5).reverse();

  return (
    <section className={`${styles.railCard} ${styles.activityCard}`}>
      <div className={styles.activityTitle}>
        <History size={16} aria-hidden="true" />
        <h2>Shared activity</h2>
      </div>
      <div className={styles.activityFeed} aria-live="polite" aria-relevant="additions">
        {visibleEvents.length === 0 ? (
          <div className={styles.emptyActivity}>
            <span className={styles.emptySpark}><Sparkles size={15} aria-hidden="true" /></span>
            <p>Actions from you and Guide will appear here.</p>
          </div>
        ) : (
          visibleEvents.map((event) => (
            <div className={styles.activityEvent} key={event.id}>
              <span className={styles.eventIcon} data-actor={event.actor}>
                {event.actor === 'guide' ? <Sparkles size={13} aria-hidden="true" /> : <UserRound size={13} aria-hidden="true" />}
              </span>
              <div>
                <strong>{event.actor === 'guide' ? 'Guide' : 'You'}</strong>
                <p>{event.message.replace(/^(Guide|You)\s/, '')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
