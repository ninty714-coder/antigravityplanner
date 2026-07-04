import { create } from 'zustand';
import { hexToRgba } from '../lib/utils';
import { ACCENT_THEMES } from '../lib/icons';

export type ViewMode = 'day' | 'week' | 'month';
export type ModalType = 'event' | 'task' | 'category' | 'search' | 'settings' | 'habit' | 'profile';
export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  theme: ThemeMode;
  accentColor: string;
  viewMode: ViewMode;
  activeModal: ModalType | null;
  selectedEventId: string | null;
  selectedEventDate: string | null; // For recurring instances
  selectedTaskId: string | null;
  selectedTaskDate: string | null; // For recurring instances
  selectedHabitId: string | null;
  
  // Theme actions
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  
  // Navigation / Mode actions
  setViewMode: (mode: ViewMode) => void;
  
  // Modal Actions
  openEventModal: (eventId?: string | null, dateStr?: string | null) => void;
  openTaskModal: (taskId?: string | null, dateStr?: string | null) => void;
  openCategoryModal: () => void;
  openSearchModal: () => void;
  openSettingsModal: () => void;
  openHabitModal: (habitId?: string | null) => void;
  openProfileModal: () => void;
  closeModal: () => void;
}

// Read any previously saved theme preference so it survives page reloads.
const getStoredTheme = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem('planner-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage may be unavailable (private browsing, etc.) - fall back silently
  }
  return 'system';
};

const getStoredAccent = (): string => {
  try {
    const stored = window.localStorage.getItem('planner-accent');
    if (stored) return stored;
  } catch {
    // ignore
  }
  return ACCENT_THEMES[0].color;
};

// Applies the accent color as CSS variables consumed across the app
// (Button.tsx, active nav states, calendar highlights, etc.)
const applyAccentColor = (color: string) => {
  const theme = ACCENT_THEMES.find(t => t.color === color);
  const root = window.document.documentElement;
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-dark', theme?.dark || color);
  root.style.setProperty('--accent-soft', hexToRgba(color, 0.10));
  root.style.setProperty('--accent-soft-dark', hexToRgba(color, 0.18));
};

export const useUIStore = create<UIState>((set) => ({
  theme: getStoredTheme(),
  accentColor: getStoredAccent(),
  viewMode: 'day',
  activeModal: null,
  selectedEventId: null,
  selectedEventDate: null,
  selectedTaskId: null,
  selectedTaskDate: null,
  selectedHabitId: null,

  setAccentColor: (color) => {
    set({ accentColor: color });
    try {
      window.localStorage.setItem('planner-accent', color);
    } catch {
      // ignore storage errors
    }
    applyAccentColor(color);
  },

  setTheme: (theme) => {
    set({ theme });
    try {
      window.localStorage.setItem('planner-theme', theme);
    } catch {
      // ignore storage errors
    }

    // Handle HTML tag class list modification for dark mode
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System choice: prefer the OS setting when available, otherwise fall
      // back to a simple time-based heuristic (dark between 19h and 7h).
      const hasSystemPreference = window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
      const isDark = hasSystemPreference
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : (new Date().getHours() >= 19 || new Date().getHours() < 7);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),

  openEventModal: (eventId = null, dateStr = null) => set({
    activeModal: 'event',
    selectedEventId: eventId,
    selectedEventDate: dateStr,
    selectedTaskId: null,
    selectedTaskDate: null
  }),

  openTaskModal: (taskId = null, dateStr = null) => set({
    activeModal: 'task',
    selectedTaskId: taskId,
    selectedTaskDate: dateStr,
    selectedEventId: null,
    selectedEventDate: null
  }),

  openCategoryModal: () => set({
    activeModal: 'category',
    selectedEventId: null,
    selectedTaskId: null
  }),

  openSearchModal: () => set({
    activeModal: 'search',
    selectedEventId: null,
    selectedTaskId: null
  }),

  openSettingsModal: () => set({
    activeModal: 'settings',
    selectedEventId: null,
    selectedTaskId: null
  }),

  openHabitModal: (habitId = null) => set({
    activeModal: 'habit',
    selectedHabitId: habitId,
    selectedEventId: null,
    selectedTaskId: null
  }),

  openProfileModal: () => set({
    activeModal: 'profile',
    selectedEventId: null,
    selectedTaskId: null
  }),

  closeModal: () => set({
    activeModal: null,
    selectedEventId: null,
    selectedEventDate: null,
    selectedTaskId: null,
    selectedTaskDate: null,
    selectedHabitId: null
  })
}));

// Apply the persisted accent color to the document as soon as this module loads,
// so the correct colors are present before the first paint.
applyAccentColor(getStoredAccent());
