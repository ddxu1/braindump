export type BulletStyle = 'checkbox' | 'dash';

export interface AppSettings {
  bulletStyle: BulletStyle;
  todoistApiKey: string;
}

const SETTINGS_KEY = 'braindump-settings';

export const DEFAULT_SETTINGS: AppSettings = {
  bulletStyle: 'checkbox',
  todoistApiKey: '',
};

export const loadSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const serialized = localStorage.getItem(SETTINGS_KEY);
    if (!serialized) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(serialized);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};

export const formatBullet = (text: string, style: BulletStyle): string => {
  return style === 'checkbox' ? `- [ ] ${text}` : `- ${text}`;
};
