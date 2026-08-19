/**
 * Responsive scaling helpers so UI reads well from small phones to tablets/iPad.
 * scale() maps a design value (based on a 390pt reference width) to the device,
 * gently damped so tablets don't get comically large text.
 */
import { Dimensions, PixelRatio } from 'react-native';

const GUIDELINE_BASE_WIDTH = 390;

export function scale(size) {
  const { width } = Dimensions.get('window');
  const shortest = Math.min(width, Dimensions.get('window').height);
  const factor = shortest / GUIDELINE_BASE_WIDTH;
  // Damp so tablets scale up ~40% of the raw factor delta.
  const damped = 1 + (factor - 1) * 0.4;
  return Math.round(PixelRatio.roundToNearestPixel(size * damped));
}

export function isTablet() {
  const { width, height } = Dimensions.get('window');
  const shortest = Math.min(width, height);
  return shortest >= 600;
}
