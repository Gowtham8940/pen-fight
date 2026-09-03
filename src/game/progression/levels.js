/**
 * "Class Rank" progression tree — the player's level is derived from total
 * games played (src/features/streaks -> totalGames), which already persists
 * across restarts. Each rank unlocks exactly one pen skin. This is the single
 * source of truth for thresholds; skins/registry.js and any UI read from here
 * rather than duplicating numbers.
 */

// `nameKey` resolves under i18n key skins.levelNames.<nameKey> — keep the two
// in sync when adding a rank.
export const LEVELS = [
  { level: 1, games: 0, nameKey: 'newKid', emoji: '🎒', unlockSkin: 'classic' },
  { level: 2, games: 3, nameKey: 'benchwarmer', emoji: '✏️', unlockSkin: 'ruby' },
  { level: 3, games: 8, nameKey: 'regular', emoji: '📘', unlockSkin: 'reynolds' },
  { level: 4, games: 15, nameKey: 'veteran', emoji: '🖍️', unlockSkin: 'marker' },
  { level: 5, games: 25, nameKey: 'legend', emoji: '👑', unlockSkin: 'gold' },
];

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Resolves the player's current rank from total games played.
 * Returns { current, next, progress, gamesToNext } where `next` is null once
 * every rank is reached, and `progress` is 0..1 toward the next threshold.
 */
export function getLevelInfo(totalGames) {
  let current = LEVELS[0];
  let next = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalGames >= LEVELS[i].games) current = LEVELS[i];
    else {
      next = LEVELS[i];
      break;
    }
  }
  const progress = next
    ? clamp01((totalGames - current.games) / (next.games - current.games))
    : 1;
  const gamesToNext = next ? Math.max(0, next.games - totalGames) : 0;
  return { current, next, progress, gamesToNext, totalGames };
}

/** Is the given skin id unlocked at this many total games played? */
export function isSkinUnlockedForGames(skinId, totalGames) {
  const entry = LEVELS.find(l => l.unlockSkin === skinId);
  if (!entry) return true; // not level-gated
  return totalGames >= entry.games;
}

/** The rank (LEVELS entry) that unlocks a given skin id, if any. */
export function levelForSkin(skinId) {
  return LEVELS.find(l => l.unlockSkin === skinId) || null;
}
