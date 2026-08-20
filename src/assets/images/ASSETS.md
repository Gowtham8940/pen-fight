# Realistic image assets

Drop your PNGs in this folder with the **exact file names** below, then open
`index.js` and uncomment the matching `require(...)` line(s). No other code
changes — rebuild the app and it switches from the hand-drawn look to your art.
Anything you don't provide keeps the Skia fallback, so you can add them one at a
time.

---

## 1. `classroom_bg.png` — full classroom backdrop  *(wired; replace the placeholder)*

- **Size:** 1200 × 2600 px (portrait), opaque PNG. Scaled with `cover`.
- **Composition:** a warm classroom — green wall, a green **chalkboard at the
  top** (~top 22%), tiled **floor** in the lower ~40%, and side **desks +
  backpacks** near the left/right edges.
- **IMPORTANT — keep the centre clear:** the play desk is drawn on top of the
  middle of the screen (roughly the central 90% width, from ~26% to ~94% of the
  height). Put the interesting detail around the **edges/top**; keep that centre
  band simple so the desk sits on it cleanly.

**Prompt:**
> Top-down-ish isometric illustration of a cozy Indian classroom, muted warm
> lighting, green plastered wall, a dark-green framed chalkboard at the top with
> faint chalk writing, cream tiled floor, a few empty wooden school desks and
> cloth backpacks along the left and right edges, empty clear space in the
> centre, flat vector game-art style, no people, portrait orientation.

---

## 2. `desk_surface.png` — the play desk  *(optional; set `DESK_SURFACE` in index.js)*

- **Size:** 900 × 1600 px, opaque PNG.
- Top-down **worn wooden school desk** surface that fills the play area: warm oak
  with vertical grain, carved initials/graffiti, a couple of ink stains, faint
  chalk tally marks. (This is the surface the pens slide on.)

**Prompt:**
> Top-down photo-style texture of an old wooden school desk surface, warm oak
> grain running vertically, carved initials and doodles, small blue ink stains,
> faint chalk tally marks, even lighting, no objects on it, seamless, high detail.

---

## 3. `pen_<id>.png` — realistic pen sprites  *(set entries in PEN_IMAGES)*

One PNG per skin. File names must match the skin id:
`pen_classic.png`, `pen_ruby.png`, `pen_reynolds.png`, `pen_marker.png`, `pen_gold.png`.

- **Size:** 300 × 900 px each, **transparent** background.
- **Orientation:** pen standing **vertical, tip pointing DOWN**, centred, filling
  most of the height. No drop shadow (the engine adds one).

**Per-skin prompt** (swap the description):
> A single realistic ballpoint pen, top-down flat view, standing vertical with
> the writing tip pointing down, centred on a fully transparent background, soft
> studio lighting, high detail, game asset. Pen: **<DESCRIPTION>**.

| file | `<DESCRIPTION>` |
|------|-----------------|
| `pen_classic.png`  | glossy blue Pilot V5 rollerball, grey cap, silver clip |
| `pen_ruby.png`     | red gel pen, dark-red cap, gold clip |
| `pen_reynolds.png` | cream/ivory Reynolds 045 ballpoint with a blue cap |
| `pen_marker.png`   | fat green sketch marker, dark-green cap |
| `pen_gold.png`     | premium golden metallic pen, engraved barrel |

---

### After adding files
In `index.js`:
```js
export const DESK_SURFACE = require('./desk_surface.png');
export const PEN_IMAGES = {
  classic:  require('./pen_classic.png'),
  ruby:     require('./pen_ruby.png'),
  reynolds: require('./pen_reynolds.png'),
  marker:   require('./pen_marker.png'),
  gold:     require('./pen_gold.png'),
};
```
Then rebuild (`npm run ios` / `npm run android`). Done.
