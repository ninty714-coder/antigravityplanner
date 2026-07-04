// Shared icon & color palettes used by Category, Habit, and Settings pickers.
// Centralized here so every picker in the app offers the same rich choice.

export const AVAILABLE_ICONS = [
  'Briefcase', 'User', 'Dumbbell', 'HeartPulse', 'DollarSign',
  'BookOpen', 'GraduationCap', 'Home', 'Coffee', 'ShoppingBag',
  'Smile', 'Flame', 'Music', 'Plane', 'Car', 'Bike',
  'Utensils', 'Moon', 'Sun', 'Droplet', 'Leaf', 'PawPrint',
  'Gamepad2', 'Palette', 'Camera', 'Code2', 'PenTool', 'Brain',
  'Baby', 'Gift', 'Wallet', 'PiggyBank', 'Phone', 'Mail',
  'Users', 'Sparkles'
];

export const AVAILABLE_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#eab308', // Yellow
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f97316'  // Orange
];

// Named accent-color presets shown in Settings, applied app-wide via CSS variables.
export interface AccentTheme {
  name: string;
  color: string;
  dark: string;
}

export const ACCENT_THEMES: AccentTheme[] = [
  { name: 'Indigo',  color: '#6366f1', dark: '#4f46e5' },
  { name: 'Émeraude', color: '#10b981', dark: '#059669' },
  { name: 'Rose',    color: '#f43f5e', dark: '#e11d48' },
  { name: 'Ambre',   color: '#f59e0b', dark: '#d97706' },
  { name: 'Ciel',    color: '#0ea5e9', dark: '#0284c7' },
  { name: 'Violet',  color: '#8b5cf6', dark: '#7c3aed' },
  { name: 'Orange',  color: '#f97316', dark: '#ea580c' },
  { name: 'Pink',    color: '#ec4899', dark: '#db2777' }
];
