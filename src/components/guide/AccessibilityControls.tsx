import { Accessibility, BadgeCheck, Eye, MousePointer2, SlidersHorizontal, Sparkles, Volume2 } from 'lucide-react';
import { useSemanticTarget } from '../../presence/targetRegistry';
import { usePortalStore } from '../../state/portalStore';
import type { AccessibilitySettings, TextScale } from '../../types';
import styles from '../../app/App.module.css';

const textScales: TextScale[] = [100, 125, 150, 175, 200];

export function AccessibilityControls() {
  const settings = usePortalStore((state) => state.accessibility);
  const setAccessibility = usePortalStore((state) => state.setAccessibility);
  const targetRef = useSemanticTarget<HTMLDivElement>('accessibility_controls');

  const set = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setAccessibility({ [key]: value }, 'you');
  };

  return (
    <section ref={targetRef} className={`${styles.railCard} ${styles.accessibilityCard}`}>
      <div className={styles.railHeading}>
        <div className={styles.guideMiniMark}><SlidersHorizontal size={14} aria-hidden="true" /></div>
        <div>
          <span>Personalize this portal</span>
          <h2>Accessibility preferences</h2>
        </div>
      </div>

      <label className={styles.fieldLabel} htmlFor="text-scale">Text size</label>
      <div className={styles.segmented} id="text-scale" aria-label="Text size">
        {textScales.map((scale) => (
          <button
            key={scale}
            aria-pressed={settings.textScale === scale}
            onClick={() => set('textScale', scale)}
          >
            {scale}%
          </button>
        ))}
      </div>

      <div className={styles.toggleList}>
        <Toggle
          icon={Eye}
          label="High contrast"
          pressed={settings.contrast === 'high'}
          onClick={() => set('contrast', settings.contrast === 'high' ? 'standard' : 'high')}
        />
        <Toggle
          icon={Accessibility}
          label="Simplify page"
          pressed={settings.density === 'simplified'}
          onClick={() => set('density', settings.density === 'simplified' ? 'standard' : 'simplified')}
        />
        <Toggle
          icon={MousePointer2}
          label="Larger controls"
          pressed={settings.controlSize === 'large'}
          onClick={() => set('controlSize', settings.controlSize === 'large' ? 'standard' : 'large')}
        />
        <Toggle
          icon={Sparkles}
          label="More spacing"
          pressed={settings.spacing === 'increased'}
          onClick={() => set('spacing', settings.spacing === 'increased' ? 'standard' : 'increased')}
        />
        <Toggle
          icon={BadgeCheck}
          label="Use icons with status colors"
          pressed={settings.colorIndependentStatus}
          onClick={() => set('colorIndependentStatus', !settings.colorIndependentStatus)}
        />
        <Toggle
          icon={Volume2}
          label="Read Guide aloud"
          pressed={settings.readAloud}
          onClick={() => set('readAloud', !settings.readAloud)}
        />
      </div>
      <button
        className={styles.emphasisButton}
        aria-pressed={settings.emphasizeInteractive}
        onClick={() => set('emphasizeInteractive', !settings.emphasizeInteractive)}
      >
        {settings.emphasizeInteractive ? 'Interactive controls emphasized' : 'Emphasize buttons and links'}
      </button>
    </section>
  );
}

function Toggle({
  icon: Icon,
  label,
  pressed,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button className={styles.toggleRow} aria-pressed={pressed} onClick={onClick}>
      <span className={styles.toggleLabel}>
        <Icon size={16} aria-hidden="true" />
        {label}
      </span>
      <span className={styles.switch} aria-hidden="true"><span /></span>
    </button>
  );
}
