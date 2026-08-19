/**
 * Sound asset registry: logical key -> bundled file name.
 *
 * Drop the actual audio files here to enable sound:
 *   iOS      -> add the files to the Xcode project (bundle resources)
 *   Android  -> android/app/src/main/res/raw/<lowercase_no_ext>
 *
 * Until the files exist, SoundManager loads them defensively and simply
 * stays silent — the game runs fine without them.
 */
export const SFX = {
  flick: 'sfx_flick.mp3',
  clack: 'sfx_clack.mp3', // pen-vs-pen hit
  penoff: 'sfx_penoff.mp3', // a pen falls off the table
  win: 'sfx_win.mp3',
  tap: 'sfx_tap.mp3', // UI tap
};

export const MUSIC = 'music_loop.mp3';
