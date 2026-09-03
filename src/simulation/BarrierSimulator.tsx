import { ChevronDown, Eye, Square } from 'lucide-react';
import { useEffect, useRef, type FocusEvent, type PointerEvent as ReactPointerEvent } from 'react';
import styles from '../app/App.module.css';
import {
  simulationDefinitions,
  simulationGroups,
  useSimulationStore,
  type SimulationCategory,
  type SimulationId,
} from './simulationStore';

export const SIMULATION_DISCLAIMER =
  'This approximates one interaction barrier for demonstration. Disability experiences vary, and simulation does not replace testing with disabled people.';

export function BarrierSimulator() {
  const activeSimulation = useSimulationStore((state) => state.activeSimulation);
  const menuOpen = useSimulationStore((state) => state.menuOpen);
  const expandedCategory = useSimulationStore((state) => state.expandedCategory);
  const announcement = useSimulationStore((state) => state.announcement);
  const openMenu = useSimulationStore((state) => state.openMenu);
  const closeMenu = useSimulationStore((state) => state.closeMenu);
  const toggleMenu = useSimulationStore((state) => state.toggleMenu);
  const expandCategory = useSimulationStore((state) => state.expandCategory);
  const activateSimulation = useSimulationStore((state) => state.activateSimulation);
  const stopSimulation = useSimulationStore((state) => state.stopSimulation);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openedByHover = useRef(false);
  const activeDefinition = activeSimulation ? simulationDefinitions[activeSimulation] : null;

  const cancelScheduledClose = () => {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimer.current = window.setTimeout(() => {
      if (!wrapperRef.current?.contains(document.activeElement)) closeMenu();
      closeTimer.current = null;
    }, 180);
  };

  const focusTrigger = () => {
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const selectSimulation = (simulation: SimulationId) => {
    activateSimulation(simulation);
    focusTrigger();
  };

  const stop = () => {
    stopSimulation();
    focusTrigger();
  };

  const handleWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    closeMenu();
  };

  const handleTriggerEnter = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || menuOpen) return;
    openedByHover.current = true;
    openMenu();
  };

  const handleTriggerClick = () => {
    if (openedByHover.current) {
      openedByHover.current = false;
      openMenu();
      return;
    }
    toggleMenu();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu();
      focusTrigger();
    };
    const handleOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && wrapperRef.current?.contains(event.target)) return;
      closeMenu();
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('pointerdown', handleOutsidePointer, true);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('pointerdown', handleOutsidePointer, true);
    };
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('guide:layoutchange'));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSimulation]);

  useEffect(() => () => cancelScheduledClose(), []);

  return (
    <div className={styles.simulatorChrome} data-simulation-exempt="true">
      <div className={styles.demoRibbon}>
        <div className={styles.demoLabel}>
          <span aria-hidden="true" className={styles.ribbonDot} />
          <span>Fictional demonstration environment</span>
        </div>

        <div
          ref={wrapperRef}
          className={styles.simulatorControl}
          onBlur={handleWrapperBlur}
          onPointerEnter={cancelScheduledClose}
          onPointerLeave={scheduleClose}
        >
          <button
            ref={triggerRef}
            type="button"
            className={styles.simulatorTrigger}
            aria-expanded={menuOpen}
            aria-controls="barrier-simulator-panel"
            onClick={handleTriggerClick}
            onPointerEnter={handleTriggerEnter}
          >
            <Eye size={15} aria-hidden="true" />
            <span>Simulate a barrier</span>
            <ChevronDown size={14} aria-hidden="true" data-open={menuOpen ? 'true' : 'false'} />
          </button>

          {menuOpen ? (
            <div
              id="barrier-simulator-panel"
              className={styles.simulatorPanel}
              aria-label="Barrier simulator"
            >
              <p className={styles.simulatorPanelTitle}>Select simulation:</p>
              <div className={styles.simulatorAccordion}>
                {simulationGroups.map((group) => (
                  <SimulationCategoryPanel
                    key={group.id}
                    groupId={group.id}
                    label={group.label}
                    expanded={expandedCategory === group.id}
                    activeSimulation={activeSimulation}
                    onExpand={expandCategory}
                    onSelect={selectSimulation}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {activeDefinition ? (
        <aside className={styles.simulationStatus} aria-label="Active illustrative simulation">
          <div className={styles.simulationStatusHeading}>
            <span>Illustrative simulation: <strong>{activeDefinition.label}</strong></span>
            <button type="button" onClick={stop}>
              <Square size={13} aria-hidden="true" />
              Stop simulation
            </button>
          </div>
          <p>{activeDefinition.explanation}</p>
          <p className={styles.simulationDisclaimer}>{SIMULATION_DISCLAIMER}</p>
        </aside>
      ) : null}

      <span className={styles.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}

function SimulationCategoryPanel({
  groupId,
  label,
  expanded,
  activeSimulation,
  onExpand,
  onSelect,
}: {
  groupId: SimulationCategory;
  label: string;
  expanded: boolean;
  activeSimulation: SimulationId | null;
  onExpand: (category: SimulationCategory) => void;
  onSelect: (simulation: SimulationId) => void;
}) {
  const group = simulationGroups.find((candidate) => candidate.id === groupId)!;
  const panelId = `simulation-category-${groupId}`;

  return (
    <div className={styles.simulatorCategory}>
      <button
        type="button"
        className={styles.simulatorCategoryButton}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => onExpand(groupId)}
      >
        <span>{label}</span>
        <ChevronDown size={15} aria-hidden="true" data-open={expanded ? 'true' : 'false'} />
      </button>
      <div id={panelId} hidden={!expanded} className={styles.simulatorOptions}>
        {group.options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={`${option.label}${option.illustrative ? ', illustrative simulation' : ''}`}
            aria-pressed={activeSimulation === option.id}
            onClick={() => onSelect(option.id)}
          >
            <span>{option.label}</span>
            {option.illustrative ? <small>Illustrative</small> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
