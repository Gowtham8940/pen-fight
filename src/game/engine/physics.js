/**
 * Rigid-body integration for a single pen on a frictioned table.
 * Semi-implicit Euler + linear kinetic friction (constant deceleration to a
 * clean stop) + exponential angular damping. All worklets.
 */
import { len } from './vec2';
import { PHYSICS } from './constants';

export function speedOf(body) {
  'worklet';
  return len(body.vx, body.vy);
}

/**
 * Advance one body by dt seconds. Mutates the body object in place.
 * `tuning` provides px-space values derived from the table (see tableLayout).
 */
export function integrateBody(body, dt, tuning) {
  'worklet';
  if (!body.alive) return;

  const speed = len(body.vx, body.vy);
  if (speed > 0) {
    // Linear kinetic friction: shave a fixed amount of speed per second.
    let newSpeed = speed - tuning.frictionDecel * dt;
    if (newSpeed < 0) newSpeed = 0;
    const scale = newSpeed / speed;
    body.vx *= scale;
    body.vy *= scale;
  }

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  // Spin follows the pen and decays.
  body.angle += body.omega * dt;
  body.omega *= Math.pow(tuning.angularRetainPerSec, dt);
  if (Math.abs(body.omega) < 0.01) body.omega = 0;

  // Visual-only "hit pop" decay — never read by any physics calculation.
  if (body.hitFlash > 0) {
    body.hitFlash *= Math.pow(PHYSICS.HIT_FLASH_DECAY, dt);
    if (body.hitFlash < 0.02) body.hitFlash = 0;
  }
}

/** True when the body has effectively stopped (or is dead). */
export function isSettled(body, settleSpeed) {
  'worklet';
  if (!body.alive) return true;
  return len(body.vx, body.vy) < settleSpeed;
}
