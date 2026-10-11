export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 45,
  selection: 8,
  success: [15, 40, 20],
  warning: [30, 50, 30],
  error: [40, 40, 40, 40, 40],
};

let hapticsEnabledState = true;

export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabledState;
}

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabledState = Boolean(enabled);
}

export function triggerHaptic(typeOrPattern: HapticType | number | number[] = 'light'): boolean {
  if (!hapticsEnabledState || !isHapticsSupported()) {
    return false;
  }

  try {
    const pattern =
      typeof typeOrPattern === 'string'
        ? (HAPTIC_PATTERNS[typeOrPattern] ?? 10)
        : typeOrPattern;

    return navigator.vibrate(pattern);
  } catch {
    // Gracefully handle denied permissions or vibration failures
    return false;
  }
}
