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

export function computeTableLayout(width, height, insets) {
  const x = PAD_X;
  const y = insets.top + HUD_TOP;
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
    spinTransfer: PHYSICS.SPIN_TRANSFER,
    angularRetainPerSec: PHYSICS.ANGULAR_DAMPING,
  };

  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, penScale, tuning };
}

function makeBody(cx, cy, skin, penScale) {
  return {
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    angle: 0, // pens start upright (aligned with the y axis)
    omega: 0,
    radius: skin.radius * penScale,
    mass: skin.mass,
    alive: true,
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
    a: makeBody(table.cx, table.y + table.h * 0.8, skinA, table.penScale),
    b: makeBody(table.cx, table.y + table.h * 0.2, skinB, table.penScale),
  };
}
