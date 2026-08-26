/**
 * Capsule-vs-capsule collision detection + impulse resolution.
 *
 * Each pen is a CAPSULE: a line segment down its length ("spine") with a
 * radius equal to the pen's half-width. A circle cannot represent a long thin
 * pen — sized to the pen's width its tips overlap undetected, sized to the
 * pen's length it collides across ~50px of empty air. The capsule matches the
 * drawn pen exactly, so pens collide when (and only when) they visually touch.
 *
 * Only the GEOMETRY is capsule-based; the impulse/friction/spin resolution
 * below is unchanged.
 *
 * Worklet — runs inside the UI-thread frame loop.
 */

function clamp01(x) {
  'worklet';
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Closest points between segments [p1,q1] and [p2,q2] (Ericson, Real-Time
 * Collision Detection). Returns [c1x, c1y, c2x, c2y].
 */
function closestPtSegSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
  'worklet';
  const d1x = q1x - p1x;
  const d1y = q1y - p1y;
  const d2x = q2x - p2x;
  const d2y = q2y - p2y;
  const rx = p1x - p2x;
  const ry = p1y - p2y;
  const a = d1x * d1x + d1y * d1y; // squared length of segment 1
  const e = d2x * d2x + d2y * d2y; // squared length of segment 2
  const f = d2x * rx + d2y * ry;
  const EPS = 1e-9;
  let s = 0;
  let t = 0;

  if (a <= EPS && e <= EPS) {
    // Both segments degenerate to points.
    s = 0;
    t = 0;
  } else if (a <= EPS) {
    s = 0;
    t = clamp01(f / e);
  } else {
    const c = d1x * rx + d1y * ry;
    if (e <= EPS) {
      t = 0;
      s = clamp01(-c / a);
    } else {
      const b = d1x * d2x + d1y * d2y;
      const denom = a * e - b * b;
      s = denom > EPS ? clamp01((b * f - c * e) / denom) : 0;
      t = (b * s + f) / e;
      // t out of range: clamp it and recompute s for that fixed t.
      if (t < 0) {
        t = 0;
        s = clamp01(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp01((b - c) / a);
      }
    }
  }
  return [p1x + d1x * s, p1y + d1y * s, p2x + d2x * t, p2y + d2y * t];
}

/**
 * Detects and resolves a collision between bodies a and b (both alive).
 * Mutates positions (to de-penetrate) and velocities (impulse). Returns null
 * if they weren't touching, otherwise { j, cx, cy } — the impulse magnitude
 * (0 if they were touching but already separating) and the contact point, for
 * driving purely-visual feedback (hit pop, spark) upstream.
 */
export function resolveCollision(a, b, tuning) {
  'worklet';
  if (!a.alive || !b.alive) return null;

  // Pen spines. The drawn pen runs along its local +y, rotated by `angle`.
  const aax = -Math.sin(a.angle);
  const aay = Math.cos(a.angle);
  const bax = -Math.sin(b.angle);
  const bay = Math.cos(b.angle);
  const a0x = a.x - aax * a.spineHalf;
  const a0y = a.y - aay * a.spineHalf;
  const a1x = a.x + aax * a.spineHalf;
  const a1y = a.y + aay * a.spineHalf;
  const b0x = b.x - bax * b.spineHalf;
  const b0y = b.y - bay * b.spineHalf;
  const b1x = b.x + bax * b.spineHalf;
  const b1y = b.y + bay * b.spineHalf;

  // Closest approach between the two spines gives both the true separation and
  // the correct contact normal — including tip-to-tip and broadside hits.
  const cp = closestPtSegSeg(a0x, a0y, a1x, a1y, b0x, b0y, b1x, b1y);
  let nx = cp[2] - cp[0];
  let ny = cp[3] - cp[1];
  let d = Math.sqrt(nx * nx + ny * ny);
  const rSum = a.radius + b.radius;
  if (d >= rSum) return null;

  // Degenerate: spines exactly coincident — pick an arbitrary axis.
  if (d < 1e-6) {
    nx = 0;
    ny = 1;
    d = 1e-6;
  } else {
    nx /= d;
    ny /= d;
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

  // Contact point on a's surface facing b — used for the spark.
  const cx = cp[0] + nx * a.radius;
  const cy = cp[1] + ny * a.radius;

  // Relative velocity along the collision normal.
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;

  // Already separating — positional fix is enough, no impulse.
  if (velAlongNormal > 0) return { j: 0, cx, cy };

  const j = (-(1 + tuning.restitution) * velAlongNormal) / invSum;
  const ix = j * nx;
  const iy = j * ny;
  a.vx -= ix * invA;
  a.vy -= iy * invA;
  b.vx += ix * invB;
  b.vy += iy * invB;

  const tx = -ny;
  const ty = nx;
  const relTangential = rvx * tx + rvy * ty;

  // Coulomb friction along the tangent. This was MISSING: the tangential
  // component was only ever used for spin, never applied to velocity, so a
  // glancing hit was completely frictionless — the striker kept 100% of its
  // sideways speed and sailed straight on past, off the far edge. Clamped by
  // the normal impulse so friction can only bleed the slide off, never
  // reverse it.
  let jt = -relTangential / invSum;
  const maxFriction = j * tuning.friction;
  if (jt > maxFriction) jt = maxFriction;
  else if (jt < -maxFriction) jt = -maxFriction;
  a.vx -= jt * tx * invA;
  a.vy -= jt * ty * invA;
  b.vx += jt * tx * invB;
  b.vy += jt * ty * invB;

  // A glancing hit also imparts spin.
  const spin = relTangential * tuning.spinTransfer;
  a.omega -= spin;
  b.omega += spin;

  // Impact energy loss. Real pens are hollow plastic — a hit clatters and
  // sheds energy (sound, vibration, tumble) instead of conserving it like a
  // billiard ball. This is a game-feel lever, not textbook physics: set
  // IMPACT_RETAIN to 1 to disable it entirely. Safe to apply here because the
  // `velAlongNormal > 0` early-return above means this only runs on the
  // approaching-contact step, so it can't compound while pens rest together.
  a.vx *= tuning.impactRetain;
  a.vy *= tuning.impactRetain;
  b.vx *= tuning.impactRetain;
  b.vy *= tuning.impactRetain;

  return { j, cx, cy };
}
