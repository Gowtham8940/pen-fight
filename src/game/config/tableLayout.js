/**
 * Computes the playable table rectangle from the screen + safe-area insets,
 * derives px-space physics tuning from the dimensionless coefficients, and
 * builds the initial physics `world`. Everything downstream positions itself
 * relative to this rect, so the game scales from small phones to iPad.
 */
import { PHYSICS, WORLD_STATUS } from '../engine/constants';

const HUD_TOP = 64; // room for the turn/score HUD
const PAD_X = 16;
const PAD_BOTTOM = 20;
const REFERENCE_TABLE_H = 640; // skin geometry is authored at this table height

export function computeTableLayout(width, height, insets, hudTop = HUD_TOP) {
  const x = PAD_X;
  const y = insets.top + hudTop; // hudTop = measured scoreboard height + gaps
  const w = width - PAD_X * 2;
  const h = height - y - (insets.bottom + PAD_BOTTOM);

  const penScale = Math.max(0.6, h / REFERENCE_TABLE_H);

  // Convert table-relative coefficients into concrete px values.
  const tuning = {
    frictionDecel: PHYSICS.FRICTION_DECEL * h,
    maxLaunchSpeed: PHYSICS.MAX_LAUNCH_SPEED * h,
    settleSpeed: PHYSICS.SETTLE_SPEED * h,
    maxDrag: PHYSICS.MAX_DRAG * h,
    minDrag: PHYSICS.MIN_DRAG * h,
    grabRadius: PHYSICS.GRAB_RADIUS * h,
    restitution: PHYSICS.RESTITUTION,
    friction: PHYSICS.COLLISION_FRICTION,
    impactRetain: PHYSICS.IMPACT_RETAIN,
    spinTransfer: PHYSICS.SPIN_TRANSFER,
    angularRetainPerSec: PHYSICS.ANGULAR_DAMPING,
    wallRestitution: PHYSICS.WALL_RESTITUTION,
    launchSpin: PHYSICS.LAUNCH_SPIN,
  };

  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, penScale, tuning };
}

function makeBody(cx, cy, skin, penScale) {
  // Simple circle collider (proven stable). `half` is kept only so the input
  // layer can place the 3 grab handles (centre + both ends) along the pen's
  // drawn length — it does not affect collision.
  //
  // CAPSULE collider, matching the drawn pen exactly: a spine down the pen's
  // length with `radius` = the pen's half-width. A circle can't represent a
  // long thin pen — width-sized it misses tip overlaps, length-sized it
  // collides across ~50px of empty air.
  const length = skin.length * penScale;
  // Same half-width the renderer uses (Pen.jsx: skin.radius * penScale * 0.82,
  // halved), so the collider lines up with the pixels on screen.
  const capRadius = skin.radius * penScale * 0.41;
  return {
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    angle: Math.PI / 2, // pens start lying horizontal (across the desk)
    omega: 0,
    radius: capRadius,
    // Spine is shortened by the cap radius at each end so the capsule's rounded
    // ends land exactly on the pen's tips (total = spine + 2 caps = length).
    spineHalf: Math.max(0, length / 2 - capRadius),
    half: length / 2, // full half-length — used by the input layer's grab handles
    mass: skin.mass,
    alive: true,
    hitFlash: 0, // visual-only "just got hit" pop, decayed in integrateBody
  };
}

/** Fresh world with both pens placed at their starting spots. */
export function createWorld(table, skinA, skinB) {
  return {
    status: WORLD_STATUS.AIMING,
    current: 'a',
    winner: null,
    settle: 0,
    aiming: false,
    aimX: 0,
    aimY: 0,
    // Grab point (one of the pen's 3 handles) the drag started from, and its
    // offset from the pen centre (drives launch spin).
    grabX: 0,
    grabY: 0,
    grabOffX: 0,
    grabOffY: 0,
    // Contact-spark burst (visual only): position, remaining life (1->0),
    // and a 0..1 strength that scales its size/brightness.
    sparkX: 0,
    sparkY: 0,
    sparkLife: 0,
    sparkStrength: 0,
    a: makeBody(table.cx, table.y + table.h * 0.8, skinA, table.penScale),
    b: makeBody(table.cx, table.y + table.h * 0.2, skinB, table.penScale),
  };
}
