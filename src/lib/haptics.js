/**
 * Haptic feedback, tuned to feel consistent across devices.
 *
 * Two things make naive haptics feel rough, especially on Android:
 *   1. Rapid repeat firing — a burst of collisions can request a dozen taps in
 *      a few frames, which stacks into a continuous buzz instead of distinct
 *      taps. We throttle per-intensity so each pulse stays crisp.
 *   2. Patchy device support — many Android devices don't implement the
 *      iOS-style impact constants and throw or no-op. Every call is wrapped so
 *      a device that can't do a given effect silently degrades instead of
 *      breaking the game, and Android falls back to a plain vibration.
 *
 * Respects the user's `haptics` setting in the game store.
 */
import { Platform } from 'react-native';
import { trigger } from 'react-native-haptic-feedback';
import { useGameStore } from '../game/state/useGameStore';

const OPTS = {
  enableVibrateFallback: true, // devices without a Taptic-style engine still buzz
  ignoreAndroidSystemSettings: false, // honour the user's system haptics toggle
};

// Minimum gap between pulses of the same kind (ms). Anything faster reads as a
// blur rather than a tap, so we drop the extras.
const THROTTLE = {
  selection: 60,
  light: 70,
  medium: 110,
  heavy: 160,
  success: 400,
};

// Android's support for the iOS impact names is inconsistent; these map to the
// effects that are most widely implemented there.
const ANDROID_FALLBACK = {
  selection: 'clockTick',
  light: 'keyboardTap',
  medium: 'keyboardTap',
  heavy: 'longPress',
  success: 'notificationSuccess',
};

const IOS_TYPE = {
  selection: 'selection',
  light: 'impactLight',
  medium: 'impactMedium',
  heavy: 'impactHeavy',
  success: 'notificationSuccess',
};

const lastFired = {};

function fire(kind) {
  if (!useGameStore.getState().haptics) return;

  const now = Date.now();
  if (now - (lastFired[kind] || 0) < THROTTLE[kind]) return; // too soon — skip
  lastFired[kind] = now;

  const primary = Platform.OS === 'android' ? ANDROID_FALLBACK[kind] : IOS_TYPE[kind];
  try {
    trigger(primary, OPTS);
  } catch (e) {
    // Unsupported effect on this device — try the generic impact once, then
    // give up quietly rather than letting a cosmetic feature crash gameplay.
    try {
      trigger('impactMedium', OPTS);
    } catch (_) {}
  }
}

export const haptics = {
  selection: () => fire('selection'),
  light: () => fire('light'),
  medium: () => fire('medium'),
  heavy: () => fire('heavy'),
  success: () => fire('success'),
};
