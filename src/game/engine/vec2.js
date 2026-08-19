/**
 * Minimal 2D vector helpers. Every function is a worklet so it can run inside
 * the Reanimated UI-thread frame loop and gesture callbacks.
 */

export function len(x, y) {
  'worklet';
  return Math.sqrt(x * x + y * y);
}

export function dist(ax, ay, bx, by) {
  'worklet';
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Returns [nx, ny] unit vector, or [0,0] if the input is ~zero length. */
export function normalize(x, y) {
  'worklet';
  const l = Math.sqrt(x * x + y * y);
  if (l < 1e-6) return [0, 0];
  return [x / l, y / l];
}

export function clamp(v, min, max) {
  'worklet';
  return v < min ? min : v > max ? max : v;
}
