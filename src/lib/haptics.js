/**
 * Real haptic feedback via the Taptic Engine / Android vibrator, using
 * react-native-haptic-feedback. Every call respects the user's `haptics`
 * setting in the game store.
 *
 * Requires a native install:
 *   npm install react-native-haptic-feedback
 *   cd ios && LANG=en_US.UTF-8 pod install && cd ..
 *   then rebuild the app.
 */
import { trigger } from 'react-native-haptic-feedback';
import { useGameStore } from '../game/state/useGameStore';

const OPTS = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

function on() {
  return useGameStore.getState().haptics;
}

export const haptics = {
  selection() {
    if (on()) trigger('selection', OPTS);
  },
  light() {
    if (on()) trigger('impactLight', OPTS);
  },
  medium() {
    if (on()) trigger('impactMedium', OPTS);
  },
  heavy() {
    if (on()) trigger('impactHeavy', OPTS);
  },
  success() {
    if (on()) trigger('notificationSuccess', OPTS);
  },
};
