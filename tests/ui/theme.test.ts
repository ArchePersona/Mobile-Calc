import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSystemTheme,
  getStoredTheme,
  setStoredTheme,
  resolveEffectiveTheme,
  applyTheme,
  toggleTheme,
  initTheme,
  THEME_STORAGE_KEY,
} from '../../src/ui/theme';

describe('Theme Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('detects system theme accurately via matchMedia', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getSystemTheme()).toBe('dark');

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getSystemTheme()).toBe('light');
  });

  it('handles stored preferences and localStorage sync', () => {
    expect(getStoredTheme()).toBeNull();
    setStoredTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(getStoredTheme()).toBe('dark');

    setStoredTheme('system');
    expect(getStoredTheme()).toBe('system');
  });

  it('resolves effective theme based on mode', () => {
    expect(resolveEffectiveTheme('light')).toBe('light');
    expect(resolveEffectiveTheme('dark')).toBe('dark');
  });

  it('applies theme attributes and classes to DOM', () => {
    const resolved = applyTheme('dark');
    expect(resolved).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('toggles themes properly and persists the result', () => {
    applyTheme('light');
    const toggled = toggleTheme('light');
    expect(toggled).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('initializes theme from saved storage state', () => {
    setStoredTheme('dark');
    const result = initTheme();
    expect(result).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
