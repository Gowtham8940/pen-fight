/**
 * Thin wrapper over react-native-sound. Preloads SFX, loops one music track,
 * and respects the global mute flag from the game store. Every load is
 * defensive: if a file is missing the sound is skipped, never crashing.
 *
 * Abstracting this in one file means music can graduate to
 * react-native-track-player later without touching call sites.
 */
import Sound from 'react-native-sound';
import { SFX, MUSIC } from './sounds';
import { useGameStore } from '../game/state/useGameStore';

Sound.setCategory('Ambient', true); // mix with others, respect silent switch

class SoundManagerImpl {
  constructor() {
    this.sfx = {};
    this.music = null;
    this.loaded = false;
  }

  init() {
    if (this.loaded) return;
    this.loaded = true;

    Object.entries(SFX).forEach(([key, file]) => {
      const s = new Sound(file, Sound.MAIN_BUNDLE, error => {
        if (error) {
          // File not bundled yet — stay silent for this key.
          this.sfx[key] = null;
        }
      });
      this.sfx[key] = s;
    });

    this.music = new Sound(MUSIC, Sound.MAIN_BUNDLE, error => {
      if (error) this.music = null;
    });
    if (this.music) this.music.setNumberOfLoops(-1);
  }

  isMuted() {
    return useGameStore.getState().muted;
  }

  play(key, volume = 1) {
    if (this.isMuted()) return;
    const s = this.sfx[key];
    if (!s) return;
    s.stop(() => {
      s.setVolume(volume);
      s.play();
    });
  }

  startMusic(volume = 0.4) {
    if (this.isMuted() || !this.music) return;
    this.music.setVolume(volume);
    this.music.play();
  }

  stopMusic() {
    if (this.music) this.music.stop();
  }

  /** Reflect a mute change immediately (stop or resume music). */
  applyMuted(muted) {
    if (muted) this.stopMusic();
    else this.startMusic();
  }
}

export const SoundManager = new SoundManagerImpl();
