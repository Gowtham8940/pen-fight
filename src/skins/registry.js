/**
 * Data-driven pen skin catalog.
 * Adding a skin = add one object here (no code changes elsewhere).
 * Each skin carries BOTH visuals and physics params so the engine and
 * renderer read from the same source.
 *
 * `unlock`:
 *   'default'        -> always owned
 *   'level'           -> gated by the Class Rank tree in game/progression/levels.js
 *                        (that file is the single source of truth for the
 *                        games-played threshold — look up levelForSkin(id) there)
 *   { price: <INR> } -> hook for the LATER donations/shop phase (unused now)
 *
 * Geometry is expressed in "table units" (a fraction is applied at runtime
 * against the computed table size) so pens scale across phones and tablets.
 */
import { isSkinUnlockedForGames } from '../game/progression/levels';

/**
 * @typedef {Object} PenSkin
 * @property {string} id
 * @property {string} nameKey   i18n key under skinNames.*
 * @property {number} length    visual capsule length in px @ reference scale
 * @property {number} radius    collider radius in px @ reference scale
 * @property {number} mass      relative mass (affects momentum transfer)
 * @property {string} body      main barrel color
 * @property {string} tip       nib color
 * @property {string} cap       cap/clip color
 * @property {'default'|{price:number}} unlock
 */

/**
 * @typedef-extra
 * @property {string} [grip]  grip-cone colour near the tip (fallback: tip)
 * @property {string} [trim]  metal clip/ring colour (fallback: silver)
 */

/** @type {PenSkin[]} */
export const SKINS = [
  {
    // Pilot V5 — blue rollerball
    id: 'classic',
    nameKey: 'classic',
    length: 116,
    radius: 28,
    mass: 1.0,
    body: '#2B5FC8',
    cap: '#1E3A8A',
    grip: '#24408F',
    trim: '#C9CDD6',
    tip: '#3A3F4A',
    unlock: 'default',
  },
  {
    // Ruby gel pen — red barrel, gold clip
    id: 'ruby',
    nameKey: 'ruby',
    length: 114,
    radius: 28,
    mass: 1.0,
    body: '#D22F2A',
    cap: '#8E1E1A',
    grip: '#A9241F',
    trim: '#E6C24A',
    tip: '#2A2A2A',
    unlock: 'level',
  },
  {
    // Reynolds 045 — cream ballpoint with blue cap (schoolbag classic)
    id: 'reynolds',
    nameKey: 'reynolds',
    length: 120,
    radius: 26,
    mass: 1.1, // heavier + slim: hits harder, slides less
    body: '#F0E9D6',
    cap: '#1B49B4',
    grip: '#E3D9BF',
    trim: '#B9BEC8',
    tip: '#2A2A2A',
    unlock: 'level',
  },
  {
    // Green sketch/marker — fat + light, skids further
    id: 'marker',
    nameKey: 'marker',
    length: 104,
    radius: 32,
    mass: 0.88,
    body: '#1F9D6B',
    cap: '#12613F',
    grip: '#178A5E',
    trim: '#0E4A32',
    tip: '#0B3A28',
    unlock: 'level',
  },
  {
    // Golden Ink — premium metallic, heavy hitter
    id: 'gold',
    nameKey: 'gold',
    length: 112,
    radius: 28,
    mass: 1.15,
    body: '#D4A017',
    cap: '#9A6E10',
    grip: '#B98C13',
    trim: '#F2E3A0',
    tip: '#5A430B',
    unlock: 'level',
  },
];

const byId = SKINS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

export function getSkin(id) {
  return byId[id] || SKINS[0];
}

// Only 'classic' is unlocked on a fresh install — both seats must start on an
// owned skin, so both default to it (players still tell them apart by the
// blue/pink name chalk + the active-pen cap glow).
export const DEFAULT_SKIN_A = 'classic';
export const DEFAULT_SKIN_B = 'classic';

/**
 * `totalGames` (from useStreakStore) drives 'level' unlocks; `ownedIds` is
 * kept for the later donations/shop path ({price} unlocks).
 */
export function isSkinOwned(skin, ownedIds, totalGames = 0) {
  if (skin.unlock === 'default') return true;
  if (skin.unlock === 'level') return isSkinUnlockedForGames(skin.id, totalGames);
  if (skin.unlock && typeof skin.unlock === 'object' && 'price' in skin.unlock) {
    return ownedIds.includes(skin.id);
  }
  return false;
}
