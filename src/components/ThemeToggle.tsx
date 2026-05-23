'use client';

import { useState, useEffect, useRef } from 'react';
import { applyTheme, DEFAULT_THEME, getTheme, loadTheme, THEMES, ThemeId } from '@/utils/theme';
import { CheckIcon, MoonIcon, SunIcon } from './Icons';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = loadTheme();
    applyTheme(savedTheme);
    const frame = requestAnimationFrame(() => setTheme(savedTheme));

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

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const updateTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    setOpen(false);
  };

  const themeOption = getTheme(theme);
  const ThemeModeIcon = themeOption.mode === 'light' ? SunIcon : MoonIcon;

  return (
    <div className="theme-picker" ref={wrapperRef}>
      <button
        className="icon-btn theme-toggle"
        onClick={() => setOpen(value => !value)}
        data-tooltip={`Theme: ${themeOption.name}`}
        data-tooltip-position="bottom"
        aria-label={`Choose theme. Current theme: ${themeOption.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ThemeModeIcon />
      </button>

      {open && (
        <div className="theme-menu" role="menu" aria-label="Choose theme">
          {THEMES.map(themeItem => (
            <button
              key={themeItem.id}
              type="button"
              className={`theme-menu-item ${theme === themeItem.id ? 'active' : ''}`}
              onClick={() => updateTheme(themeItem.id)}
              role="menuitemradio"
              aria-checked={theme === themeItem.id}
            >
              <span
                className="theme-swatch"
                style={{ background: themeItem.accent }}
                aria-hidden
              />
              <span>{themeItem.name}</span>
              <span className={`theme-mode-badge ${themeItem.mode}`}>
                {themeItem.mode}
              </span>
              {theme === themeItem.id && <CheckIcon size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
