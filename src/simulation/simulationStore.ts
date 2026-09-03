import { create } from 'zustand';

export type SimulationCategory = 'sight' | 'mobility' | 'read-write' | 'concentration';

export type SimulationId =
  | 'total-color-blindness'
  | 'yellow-blue-color-blindness'
  | 'red-green-color-blindness'
  | 'far-sightedness'
  | 'tunnel-vision'
  | 'sunshine'
  | 'parkinsons'
  | 'dyslexia'
  | 'small-vocabulary'
  | 'concentration-difficulty';

export interface SimulationDefinition {
  id: SimulationId;
  label: string;
  explanation: string;
  illustrative?: boolean;
}

export interface SimulationGroup {
  id: SimulationCategory;
  label: string;
  options: SimulationDefinition[];
}

export const simulationGroups: SimulationGroup[] = [
  {
    id: 'sight',
    label: 'Sight',
    options: [
      {
        id: 'total-color-blindness',
        label: 'Total color blindness',
        explanation: 'Removes color differences so information carried only by color is harder to distinguish.',
      },
      {
        id: 'yellow-blue-color-blindness',
        label: 'Yellow–Blue color blindness',
        explanation: 'Applies one color-matrix approximation that reduces differentiation along a blue–yellow color axis.',
      },
      {
        id: 'red-green-color-blindness',
        label: 'Red–Green color blindness',
        explanation: 'Applies one representative color-matrix approximation for reduced red–green differentiation.',
      },
      {
        id: 'far-sightedness',
        label: 'Far-sightedness',
        explanation: 'Adds bounded blur to illustrate how small, dense interface details can become difficult to resolve.',
      },
      {
        id: 'tunnel-vision',
        label: 'Tunnel vision',
        explanation: 'Restricts the visible field around the pointer while retaining a usable central area.',
      },
      {
        id: 'sunshine',
        label: 'Sunshine',
        explanation: 'Adds strong glare and reduced contrast to demonstrate why subtle interface boundaries can disappear outdoors.',
      },
    ],
  },
  {
    id: 'mobility',
    label: 'Mobility',
    options: [
      {
        id: 'parkinsons',
        label: 'Parkinson’s',
        explanation: 'Illustrates reduced pointer precision with a bounded displaced cursor while leaving keyboard control unchanged.',
      },
    ],
  },
  {
    id: 'read-write',
    label: 'Read and write',
    options: [
      {
        id: 'dyslexia',
        label: 'Dyslexia',
        explanation: 'Illustratively increases visual crowding without changing, scrambling, or animating any letters.',
        illustrative: true,
      },
      {
        id: 'small-vocabulary',
        label: 'Small vocabulary',
        explanation: 'Masks selected administrative terms to demonstrate how unfamiliar language can obstruct a task.',
      },
    ],
  },
  {
    id: 'concentration',
    label: 'Concentration',
    options: [
      {
        id: 'concentration-difficulty',
        label: 'Concentration difficulty',
        explanation: 'Illustratively emphasizes competing interface regions to show the cost of a crowded page.',
        illustrative: true,
      },
    ],
  },
];

export const simulationDefinitions = Object.fromEntries(
  simulationGroups.flatMap((group) => group.options.map((option) => [option.id, option])),
) as Record<SimulationId, SimulationDefinition>;

interface SimulationStore {
  activeSimulation: SimulationId | null;
  menuOpen: boolean;
  expandedCategory: SimulationCategory | null;
  announcement: string;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  expandCategory: (category: SimulationCategory) => void;
  activateSimulation: (simulation: SimulationId) => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
}

const initialSimulationState = {
  activeSimulation: null,
  menuOpen: false,
  expandedCategory: null,
  announcement: '',
} satisfies Pick<
  SimulationStore,
  'activeSimulation' | 'menuOpen' | 'expandedCategory' | 'announcement'
>;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initialSimulationState,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false, expandedCategory: null }),
  toggleMenu: () => set((state) => ({
    menuOpen: !state.menuOpen,
    expandedCategory: state.menuOpen ? null : state.expandedCategory,
  })),
  expandCategory: (category) => set((state) => ({
    expandedCategory: state.expandedCategory === category ? null : category,
  })),
  activateSimulation: (simulation) => {
    const definition = simulationDefinitions[simulation];
    set({
      activeSimulation: simulation,
      menuOpen: false,
      expandedCategory: null,
      announcement: `${definition.label} illustrative simulation started.`,
    });
  },
  stopSimulation: () => {
    const active = get().activeSimulation;
    set({
      activeSimulation: null,
      menuOpen: false,
      expandedCategory: null,
      announcement: active
        ? `${simulationDefinitions[active].label} illustrative simulation stopped.`
        : '',
    });
  },
  resetSimulation: () => set({ ...initialSimulationState }),
}));
