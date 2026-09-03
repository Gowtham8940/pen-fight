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
export const CLASSROOM_BG = require('./classroom_bg.jpg');

// App icon artwork (mascot pens + spark) — used on the splash screen.
export const APP_ICON = require('./app_icon.jpg');

// Top-down play-desk surface.
export const DESK_SURFACE = require('./desk_surface.jpg');

// Realistic pen sprites, keyed by skin id (magenta keyed out + auto-cropped).
export const PEN_IMAGES = {
  classic: require('./pen_classic.png'),
  ruby: require('./pen_ruby.png'),
  reynolds: require('./pen_reynolds.png'),
  marker: require('./pen_marker.png'),
  gold: require('./pen_gold.png'),
};
