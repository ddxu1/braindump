'use client';

import { useEffect, useState } from 'react';
import { AppSettings, BulletStyle, loadSettings, saveSettings } from '@/utils/settings';
import { CloseIcon, SettingsIcon } from './Icons';

interface SettingsProps {
  onChange?: (settings: AppSettings) => void;
}

export default function Settings({ onChange }: SettingsProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showKey, setShowKey] = useState(false);

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
                How items are formatted when copying the Stack as markdown.
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
              <label className="settings-label" htmlFor="grok-api-key">Grok API key</label>
              <p className="settings-description">
                Stored locally in your browser. Used by AI Edit to clean up notes
                and find duplicates. Get one at console.x.ai.
              </p>
              <div className="settings-input-row">
                <input
                  id="grok-api-key"
                  type={showKey ? 'text' : 'password'}
                  className="settings-input"
                  placeholder="xai-..."
                  value={settings.grokApiKey}
                  onChange={(e) => update({ grokApiKey: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={() => setShowKey(v => !v)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <label className="settings-label settings-label-sub" htmlFor="grok-model">Model</label>
              <input
                id="grok-model"
                type="text"
                className="settings-input"
                value={settings.grokModel}
                onChange={(e) => update({ grokModel: e.target.value })}
                placeholder="grok-4-1-fast-thinking"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
