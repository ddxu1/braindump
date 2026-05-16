export type ThemeId =
  | 'dark'
  | 'light'
  | 'ocean'
  | 'forest'
  | 'ember'
  | 'graphite'
  | 'solarized'
  | 'dracula'
  | 'monokai'
  | 'catppuccin';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  accent: string;
}

export const THEME_STORAGE_KEY = 'theme';
export const DEFAULT_THEME: ThemeId = 'dark';

export const THEMES: ThemeOption[] = [
  { id: 'dark', name: 'BrainDump', accent: '#a78bfa' },
  { id: 'light', name: 'Paper', accent: '#2563eb' },
  { id: 'ocean', name: 'Ocean', accent: '#0891b2' },
  { id: 'forest', name: 'Forest', accent: '#16a34a' },
  { id: 'ember', name: 'Ember', accent: '#e11d48' },
  { id: 'graphite', name: 'Graphite', accent: '#d97706' },
  { id: 'solarized', name: 'Solarized', accent: '#268bd2' },
  { id: 'dracula', name: 'Dracula', accent: '#bd93f9' },
  { id: 'monokai', name: 'Monokai', accent: '#a6e22e' },
  { id: 'catppuccin', name: 'Catppuccin', accent: '#89b4fa' },
];

export const isThemeId = (value: string | null): value is ThemeId =>
  THEMES.some(theme => theme.id === value);

export const getTheme = (themeId: ThemeId): ThemeOption =>
  THEMES.find(theme => theme.id === themeId) ?? THEMES[0];

export const loadTheme = (): ThemeId => {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeId(savedTheme) ? savedTheme : DEFAULT_THEME;
};

export const applyTheme = (themeId: ThemeId): void => {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', themeId);

  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    window.dispatchEvent(new CustomEvent('braindump-theme-change', { detail: themeId }));
  }
};
