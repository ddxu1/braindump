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
  mode: 'dark' | 'light';
  themeColor: string;
}

export const THEME_STORAGE_KEY = 'theme';
export const DEFAULT_THEME: ThemeId = 'dark';

export const THEMES: ThemeOption[] = [
  { id: 'dark', name: 'BrainDump', accent: '#a78bfa', mode: 'dark', themeColor: '#111018' },
  { id: 'light', name: 'Light', accent: '#2563eb', mode: 'light', themeColor: '#f8fafc' },
  { id: 'ocean', name: 'Ocean', accent: '#0891b2', mode: 'light', themeColor: '#eef8fb' },
  { id: 'forest', name: 'Forest', accent: '#16a34a', mode: 'light', themeColor: '#f1f8f2' },
  { id: 'ember', name: 'Ember', accent: '#e11d48', mode: 'dark', themeColor: '#181113' },
  { id: 'graphite', name: 'Graphite', accent: '#d97706', mode: 'light', themeColor: '#f5f5f2' },
  { id: 'solarized', name: 'Solarized', accent: '#268bd2', mode: 'dark', themeColor: '#002b36' },
  { id: 'dracula', name: 'Dracula', accent: '#bd93f9', mode: 'dark', themeColor: '#282a36' },
  { id: 'monokai', name: 'Monokai', accent: '#a6e22e', mode: 'dark', themeColor: '#1f201b' },
  { id: 'catppuccin', name: 'Catppuccin', accent: '#89b4fa', mode: 'dark', themeColor: '#1e1e2e' },
];

export const isThemeId = (value: string | null): value is ThemeId =>
  THEMES.some(theme => theme.id === value);

export const getTheme = (themeId: ThemeId): ThemeOption =>
  THEMES.find(theme => theme.id === themeId) ?? THEMES[0];

const updateThemeColor = (themeId: ThemeId): void => {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = getTheme(themeId).themeColor;
};

export const loadTheme = (): ThemeId => {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeId(savedTheme) ? savedTheme : DEFAULT_THEME;
};

export const applyTheme = (themeId: ThemeId): void => {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', themeId);
  updateThemeColor(themeId);

  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    window.dispatchEvent(new CustomEvent('braindump-theme-change', { detail: themeId }));
  }
};
