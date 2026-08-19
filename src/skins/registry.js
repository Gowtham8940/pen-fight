/**
 * Data-driven pen skin catalog.
 * Adding a skin = add one object here (no code changes elsewhere).
 * Each skin carries BOTH visuals and physics params so the engine and
 * renderer read from the same source.
 *
 * `unlock`:
 *   'default'        -> always owned
 *   { price: <INR> } -> hook for the LATER donations/shop phase (unused now)
 *
 * Geometry is expressed in "table units" (a fraction is applied at runtime
 * against the computed table size) so pens scale across phones and tablets.
 */

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

/** @type {PenSkin[]} */
export const SKINS = [
  {
    id: 'classic',
    nameKey: 'classic',
    length: 96,
    radius: 30,
    mass: 1.0,
    body: '#2563EB',
    tip: '#1E293B',
    cap: '#93C5FD',
    unlock: 'default',
  },
  {
    id: 'ruby',
    nameKey: 'ruby',
    length: 96,
    radius: 30,
    mass: 1.0,
    body: '#DC2626',
    tip: '#1E293B',
    cap: '#FCA5A5',
    unlock: 'default',
  },
  {
    id: 'graphite',
    nameKey: 'graphite',
    length: 104,
    radius: 28,
    mass: 1.15, // heavier + slimmer: hits harder, slides less
    body: '#334155',
    tip: '#0F172A',
    cap: '#94A3B8',
    unlock: 'default',
  },
  {
    id: 'gold',
    nameKey: 'gold',
    length: 92,
    radius: 32,
    mass: 0.9, // lighter + fatter: skids further
    body: '#D4A017',
    tip: '#7C5E10',
    cap: '#FDE68A',
    unlock: { price: 0 }, // reserved for donations/shop unlock later
  },
];

const byId = SKINS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

export function getSkin(id) {
  return byId[id] || SKINS[0];
}

export const DEFAULT_SKIN_A = 'classic';
export const DEFAULT_SKIN_B = 'ruby';

export function isSkinOwned(skin, ownedIds) {
  if (skin.unlock === 'default') return true;
  return ownedIds.includes(skin.id);
}
