/**
 * Circle-vs-circle collision detection and impulse resolution.
 * This is the momentum transfer that makes a flick knock the other pen away.
 * Worklet — runs inside the UI-thread frame loop.
 */

/**
 * Detects and resolves a collision between bodies a and b (both alive).
 * Mutates positions (to de-penetrate) and velocities (impulse). Returns true
 * if they were touching.
 */
export function resolveCollision(a, b, tuning) {
  'worklet';
  if (!a.alive || !b.alive) return false;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const rSum = a.radius + b.radius;
  const distSq = dx * dx + dy * dy;
  if (distSq >= rSum * rSum) return false;

  let d = Math.sqrt(distSq);
  // Degenerate: exactly overlapping — pick an arbitrary axis.
  let nx, ny;
  if (d < 1e-6) {
    nx = 1;
    ny = 0;
    d = 0.0001;
  } else {
    nx = dx / d;
    ny = dy / d;
  }

  const invA = 1 / a.mass;
  const invB = 1 / b.mass;
  const invSum = invA + invB;

  // Positional correction — push the pair apart along the normal.
  const penetration = rSum - d;
  a.x -= nx * penetration * (invA / invSum);
  a.y -= ny * penetration * (invA / invSum);
  b.x += nx * penetration * (invB / invSum);
  b.y += ny * penetration * (invB / invSum);

  // Relative velocity along the collision normal.
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;

  // Already separating — positional fix is enough, no impulse.
  if (velAlongNormal > 0) return true;

  const j = (-(1 + tuning.restitution) * velAlongNormal) / invSum;
  const ix = j * nx;
  const iy = j * ny;
  a.vx -= ix * invA;
  a.vy -= iy * invA;
  b.vx += ix * invB;
  b.vy += iy * invB;

  // A glancing hit imparts a bit of spin (tangential component).
  const tx = -ny;
  const ty = nx;
  const relTangential = rvx * tx + rvy * ty;
  const spin = relTangential * tuning.spinTransfer;
  a.omega -= spin;
  b.omega += spin;

  return true;
}
