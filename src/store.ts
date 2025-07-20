import { create } from 'zustand';

// Types
export type Source = {
  id: string;
  name: string;
  caffeinePerServing: number;
  emoji?: string;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  sourceId: string;
  servings: number;
  mg: number;
};

export type Settings = {
  dailyLimit: number;
  theme: 'light' | 'dark';
};

// State
interface CaffeineState {
  sources: Source[];
  logs: LogEntry[];
  settings: Settings;
  addSource: (source: Omit<Source, 'id'>) => void;
  editSource: (id: string, updates: Partial<Omit<Source, 'id'>>) => void;
  removeSource: (id: string) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'mg'>) => void;
  removeLog: (id: string) => void;
  editLog: (id: string, updates: Partial<Omit<LogEntry, 'id'>>) => void;
  setDailyLimit: (limit: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetToday: () => void;
  resetAll: () => void;
  hydrate: () => void;
}

const defaultSettings: Settings = {
  dailyLimit: 400,
  theme: 'light',
};

const LOCAL_KEY = 'caffeine-tracker-state';

type Set = (fn: (state: CaffeineState) => Partial<CaffeineState> | void) => void;
type Get = () => CaffeineState;

export const useCaffeineStore = create<CaffeineState>((set: Set, get: Get) => ({
  sources: [],
  logs: [],
  settings: defaultSettings,
  addSource: (source: Omit<Source, 'id'>) => set((state) => {
    const id = crypto.randomUUID();
    const newSource: Source = { ...source, id };
    const sources = [...state.sources, newSource];
    persist({ ...state, sources });
    return { sources };
  }),
  editSource: (id: string, updates: Partial<Omit<Source, 'id'>>) => set((state) => {
    const sources = state.sources.map((s: Source) => s.id === id ? { ...s, ...updates } : s);
    persist({ ...state, sources });
    return { sources };
  }),
  removeSource: (id: string) => set((state) => {
    const sources = state.sources.filter((s: Source) => s.id !== id);
    persist({ ...state, sources });
    return { sources };
  }),
  addLog: (entry: Omit<LogEntry, 'id' | 'mg'>) => set((state) => {
    const source = state.sources.find((s: Source) => s.id === entry.sourceId);
    if (!source) return;
    const id = crypto.randomUUID();
    const mg = source.caffeinePerServing * (entry.servings || 1);
    const newLog: LogEntry = { ...entry, id, mg } as LogEntry;
    const logs = [...state.logs, newLog];
    persist({ ...state, logs });
    return { logs };
  }),
  removeLog: (id: string) => set((state) => {
    const logs = state.logs.filter((l: LogEntry) => l.id !== id);
    persist({ ...state, logs });
    return { logs };
  }),
  editLog: (id: string, updates: Partial<Omit<LogEntry, 'id'>>) => set((state) => {
    const logs = state.logs.map((l: LogEntry) => l.id === id ? { ...l, ...updates } : l);
    persist({ ...state, logs });
    return { logs };
  }),
  setDailyLimit: (limit: number) => set((state) => {
    const settings = { ...state.settings, dailyLimit: limit };
    persist({ ...state, settings });
    return { settings };
  }),
  setTheme: (theme: 'light' | 'dark') => set((state) => {
    const settings = { ...state.settings, theme };
    persist({ ...state, settings });
    return { settings };
  }),
  resetToday: () => set((state) => {
    persist({ ...state, logs: [] });
    return { logs: [] };
  }),
  resetAll: () => set((state) => {
    persist({ ...state, sources: [], logs: [], settings: defaultSettings });
    return { sources: [], logs: [], settings: defaultSettings };
  }),
  hydrate: () => {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      set(() => ({ ...data }));
    }
  },
}));

function persist(state: CaffeineState) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({
    sources: state.sources,
    logs: state.logs,
    settings: state.settings,
  }));
} 