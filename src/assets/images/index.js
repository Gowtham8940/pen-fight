/**
 * Image assets for the realistic classroom look.
 *
 * HOW TO MAKE IT REALISTIC (see ASSETS.md for full specs + prompts):
 *  1. Drop your PNGs into this folder with the exact names below.
 *  2. Uncomment / add the matching `require(...)` lines.
 *  3. For pens, set `imageSrc` on the skin in src/skins/registry.js to the
 *     matching PEN_IMAGES entry.
 *
 * Until a real asset is added the app falls back to the hand-drawn Skia
 * classroom/desk/pens, so everything keeps working.
 */

// Full-screen classroom backdrop (currently a placeholder — replace the PNG).
export const CLASSROOM_BG = require('./classroom_bg.png');

// Top-down play-desk surface. Set to require('./desk_surface.png') once added.
export const DESK_SURFACE = null;

// Realistic pen sprites, keyed by skin id. Add entries as you create them, e.g.
//   classic: require('./pen_classic.png'),
export const PEN_IMAGES = {
  // classic:  require('./pen_classic.png'),
  // ruby:     require('./pen_ruby.png'),
  // reynolds: require('./pen_reynolds.png'),
  // marker:   require('./pen_marker.png'),
  // gold:     require('./pen_gold.png'),
};
