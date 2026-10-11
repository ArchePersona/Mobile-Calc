export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'calc_theme_preference';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  }
  return 'light';
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: ThemeMode): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Gracefully handle storage errors (e.g. storage disabled/private browsing quotas)
  }
}

export function resolveEffectiveTheme(mode: ThemeMode = 'system'): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

export function applyTheme(mode: ThemeMode, targetElement?: HTMLElement | null): ResolvedTheme {
  const resolved = resolveEffectiveTheme(mode);
  const root = targetElement ?? (typeof document !== 'undefined' ? document.documentElement : null);

  if (root) {
    root.setAttribute('data-theme', resolved);
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${resolved}`);
  }

  setStoredTheme(mode);
  return resolved;
}

export function toggleTheme(currentTheme?: ThemeMode): ThemeMode {
  const activeMode = currentTheme ?? getStoredTheme() ?? 'system';
  const resolved = resolveEffectiveTheme(activeMode);
  const nextMode: ThemeMode = resolved === 'dark' ? 'light' : 'dark';
  applyTheme(nextMode);
  return nextMode;
}

export function initTheme(): ResolvedTheme {
  const initialPreference = getStoredTheme() ?? 'system';
  return applyTheme(initialPreference);
}
