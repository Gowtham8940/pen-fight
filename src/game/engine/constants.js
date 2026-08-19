/**
 * Central physics tuning. Everything the "feel" of the game depends on lives
 * here so it can be tuned in one place (and later exposed via a dev slider).
 *
 * Speed/acceleration coefficients are expressed as multiples of the TABLE
 * HEIGHT per second, so the feel is identical on a small phone and a big
 * tablet. tableLayout.js turns these into concrete px values (`tuning`).
 */
export const PHYSICS = {
  // Fixed simulation substep (seconds). Smaller = more stable collisions.
  SUBSTEP: 1 / 120,
  // Never run more than this many substeps in one rendered frame
  // (prevents the "spiral of death" on a slow frame).
  MAX_SUBSTEPS: 8,
  // Clamp a single frame's dt so a hitch can't teleport a pen.
  MAX_FRAME_DT: 1 / 30,

  // Bounciness of pen-vs-pen collisions (pens aren't very bouncy).
  RESTITUTION: 0.32,
  // Fraction of tangential spin retained per second while sliding.
  ANGULAR_DAMPING: 0.12,
  // A hit imparts some spin proportional to the tangential impulse.
  SPIN_TRANSFER: 0.008,

  // Consecutive settled frames required before a turn is committed.
  SETTLE_FRAMES: 10,

  // --- coefficients relative to table height (converted to px in tuning) ---
  MAX_LAUNCH_SPEED: 2.7, // table-heights / second at full power
  FRICTION_DECEL: 1.7, // table-heights / second^2 (linear kinetic friction)
  SETTLE_SPEED: 0.03, // below this speed a body is considered at rest
  MAX_DRAG: 0.3, // max useful pull distance (table heights)
  MIN_DRAG: 0.03, // shorter pulls are ignored (accidental taps)
  GRAB_RADIUS: 0.12, // how close a touch must start to a pen to grab it
};

// Discrete game statuses used inside the physics `world` shared value.
export const WORLD_STATUS = {
  AIMING: 'AIMING',
  SIMULATING: 'SIMULATING',
  SETTLED: 'SETTLED', // transient: JS swaps the turn back to AIMING
  GAMEOVER: 'GAMEOVER',
};
