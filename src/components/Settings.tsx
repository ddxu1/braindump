'use client';

import { useEffect, useState } from 'react';
import { AppSettings, BulletStyle, loadSettings, saveSettings } from '@/utils/settings';
import { applyTheme, DEFAULT_THEME, loadTheme, THEMES, ThemeId } from '@/utils/theme';
import { CloseIcon, SettingsIcon } from './Icons';

interface SettingsProps {
  onChange?: (settings: AppSettings) => void;
}

export default function Settings({ onChange }: SettingsProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [showTodoistKey, setShowTodoistKey] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setTheme(loadTheme()));

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeId>).detail;
      if (nextTheme) setTheme(nextTheme);
    };

    window.addEventListener('braindump-theme-change', handleThemeChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('braindump-theme-change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    onChange?.(next);
  };

  const updateBulletStyle = (bulletStyle: BulletStyle) => update({ bulletStyle });
  const updateTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="icon-btn"
        data-tooltip="Settings"
        data-tooltip-position="bottom"
        aria-label="Settings"
      >
        <SettingsIcon />
      </button>

      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h3>Settings</h3>
              <button
                onClick={() => setOpen(false)}
                className="icon-btn"
                data-tooltip="Close (Esc)"
                data-tooltip-position="left"
                aria-label="Close settings"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="settings-section">
              <label className="settings-label">Markdown bullet style</label>
              <p className="settings-description">
                How items are formatted when copying the Output as markdown.
              </p>
              <div className="settings-options">
                <label className={`settings-option ${settings.bulletStyle === 'checkbox' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="bulletStyle"
                    value="checkbox"
                    checked={settings.bulletStyle === 'checkbox'}
                    onChange={() => updateBulletStyle('checkbox')}
                  />
                  <div className="settings-option-body">
                    <div className="settings-option-title">Checkbox</div>
                    <code className="settings-option-preview">- [ ] item</code>
                  </div>
                </label>

                <label className={`settings-option ${settings.bulletStyle === 'dash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="bulletStyle"
                    value="dash"
                    checked={settings.bulletStyle === 'dash'}
                    onChange={() => updateBulletStyle('dash')}
                  />
                  <div className="settings-option-body">
                    <div className="settings-option-title">Dash</div>
                    <code className="settings-option-preview">- item</code>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <label className="settings-label">Theme</label>
              <p className="settings-description">
                Choose the app color palette.
              </p>
              <div className="settings-options theme-options">
                {THEMES.map(themeOption => (
                  <label
                    key={themeOption.id}
                    className={`settings-option theme-option ${theme === themeOption.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={themeOption.id}
                      checked={theme === themeOption.id}
                      onChange={() => updateTheme(themeOption.id)}
                    />
                    <span
                      className="theme-swatch"
                      style={{ background: themeOption.accent }}
                      aria-hidden
                    />
                    <div className="settings-option-body">
                      <div className="settings-option-title-row">
                        <div className="settings-option-title">{themeOption.name}</div>
                        <span className={`theme-mode-badge ${themeOption.mode}`}>
                          {themeOption.mode}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <label className="settings-label" htmlFor="todoist-api-key">Todoist API key</label>
              <p className="settings-description">
                Stored locally in this browser. When present, Output items can be sent to Todoist.
              </p>
              <div className="settings-input-row">
                <input
                  id="todoist-api-key"
                  type={showTodoistKey ? 'text' : 'password'}
                  className="settings-input"
                  placeholder="Todoist API token"
                  value={settings.todoistApiKey}
                  onChange={(e) => update({ todoistApiKey: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={() => setShowTodoistKey(value => !value)}
                >
                  {showTodoistKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
