import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isHapticsSupported,
  isHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
  HAPTIC_PATTERNS,
} from '../../src/ui/haptics';

describe('Haptics Feedback Utility', () => {
  beforeEach(() => {
    setHapticsEnabled(true);
    vi.restoreAllMocks();
  });

  it('correctly identifies support for navigator.vibrate', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });
    expect(isHapticsSupported()).toBe(true);
  });

  it('triggers haptics for predefined pattern names', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const result = triggerHaptic('light');
    expect(result).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.light);

    triggerHaptic('success');
    expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.success);
  });

  it('triggers haptics with custom number and array patterns', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    expect(triggerHaptic(30)).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith(30);

    expect(triggerHaptic([10, 20, 30])).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([10, 20, 30]);
  });

  it('respects enabled/disabled state toggles', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    setHapticsEnabled(false);
    expect(isHapticsEnabled()).toBe(false);
    const result = triggerHaptic('light');
    expect(result).toBe(false);
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('gracefully handles missing vibrate API or errors', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(isHapticsSupported()).toBe(false);
    expect(triggerHaptic('light')).toBe(false);

    // Test error thrown inside vibrate
    const throwingVibrate = vi.fn().mockImplementation(() => {
      throw new Error('Permission denied');
    });
    Object.defineProperty(navigator, 'vibrate', {
      value: throwingVibrate,
      writable: true,
      configurable: true,
    });

    expect(triggerHaptic('light')).toBe(false);
  });
});
