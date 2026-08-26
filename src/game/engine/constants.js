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

  // Bounciness of pen-vs-pen collisions. NOTE: this is the NORMAL-direction
  // (head-on) restitution, which for real billiard/carrom-style pieces is
  // near-elastic (~0.9+) — NOT the same number as tangential/spin restitution
  // (~0.2-0.3), which is what COLLISION_FRICTION/SPIN_TRANSFER below model.
  // 0.28 here was wrongly copying the tangential figure, which made hits feel
  // mushy (both pieces mush together and share speed) instead of a crisp
  // "striker stops, target flies" transfer. For similar masses, restitution
  // near 0.88 makes the striking pen nearly stop dead at the point of impact
  // while the struck pen takes almost all the velocity — the "car crash"
  // sudden-stop feel.
  RESTITUTION: 0.88,
  // Coulomb friction coefficient at a pen-vs-pen contact. This is what stops a
  // glancing hit from letting the striker slide past at full speed and off the
  // far edge. 0.35 is a reasonable plastic-on-plastic grip; raise it if your
  // pen still carries too much sideways speed through a clipping hit.
  COLLISION_FRICTION: 0.35,
  // Fraction of speed BOTH pens keep through an impact (1 = perfectly
  // conserving, like billiard balls). Hollow plastic pens clatter and lose
  // energy on contact, so a little loss here makes a hit read as a solid
  // "thunk" that kills momentum rather than a clean transfer.
  IMPACT_RETAIN: 0.9,
  // Fraction of tangential spin retained per second while sliding.
  ANGULAR_DAMPING: 0.12,
  // A hit imparts some spin proportional to the tangential impulse.
  SPIN_TRANSFER: 0.008,

  // Consecutive settled frames required before a turn is committed.
  SETTLE_FRAMES: 10,

  // --- coefficients relative to table height (converted to px in tuning) ---
  // Tuned so a full-power flick travels ~1 table-height and stops (distance =
  // V^2 / 2A). 1.3/1.9 gives ~0.44 heights — a real, controllable pen-flick
  // distance instead of a cross-the-whole-desk rocket. Launch speed is already
  // directly proportional to how far you pull (see useFlickGesture) — this
  // just lowers the top end of that range.
  MAX_LAUNCH_SPEED: 1.3, // table-heights / second at full power
  FRICTION_DECEL: 1.9, // table-heights / second^2 (linear kinetic friction)
  SETTLE_SPEED: 0.035, // below this speed a body is considered at rest
  MAX_DRAG: 0.34, // longer pull needed for full power -> finer aim control
  MIN_DRAG: 0.03, // shorter pulls are ignored (accidental taps)
  GRAB_RADIUS: 0.16, // how close a touch must start to a grab point to grab it
  // How far a pen's CENTRE must travel past ANY edge before it counts as "off"
  // (fraction of its own radius). Adds a little forgiveness near the rim.
  OFF_MARGIN: 0.55,

  // (Unused: side walls were removed — all four edges are open.)
  WALL_RESTITUTION: 0.5,
  // Max spin (rad/s) imparted at a full-power flick grabbed at a pen's very
  // end (grabbing the centre gives none). 13 made pens spin >2x/sec — a
  // visible "wheel" that read as broken physics. 2.4 rad/s (~0.4 rot/s at
  // full power off-centre) gives a real curve without looking chaotic.
  LAUNCH_SPIN: 2.4,

  // --- juice / feel (purely visual, never affects the simulation) ---
  // Fraction of a pen's "hit pop" retained per second (decays fast: a quick
  // punch-in that eases back to normal size, like an impact frame).
  HIT_FLASH_DECAY: 0.02,
  // Spark burst lifetime decay per second (1 -> 0 in ~0.3s).
  SPARK_DECAY_PER_SEC: 3.3,
};

// Discrete game statuses used inside the physics `world` shared value.
export const WORLD_STATUS = {
  AIMING: 'AIMING',
  SIMULATING: 'SIMULATING',
  SETTLED: 'SETTLED', // transient: JS swaps the turn back to AIMING
  FALLING: 'FALLING', // a pen is visibly sliding off the edge before game over
  GAMEOVER: 'GAMEOVER',
};

// How many frames the losing pen keeps sliding off the edge (so it's clearly
// "out") before the win is declared.
export const FALL_FRAMES = 26;
