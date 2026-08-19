/**
 * Daily-streak system (device-level for now; migrates to per-user when Firebase
 * auth lands). A "streak" is the number of consecutive calendar days on which at
 * least one game was completed.
 *
 * Rules (see recordPlay):
 *   - already played today            -> streak unchanged
 *   - last played yesterday           -> streak + 1
 *   - first ever, or missed a day     -> streak resets to 1
 *
 * The *stored* currentStreak is only meaningful while it's still "alive" (last
 * played today or yesterday). Use activeStreak() for display so a broken streak
 * reads as 0 without us having to mutate storage on launch.
 */
import { create } from 'zustand';
import { storage, StorageKeys, getJSON, setJSON } from '../../lib/storage';
import { dateKey, diffDays } from './dates';

const DEFAULT = {
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null, // 'YYYY-MM-DD'
  playedDates: [], // recent day keys (capped)
  totalGames: 0,
};

const persisted = getJSON(StorageKeys.streak, DEFAULT);

export const useStreakStore = create((set, get) => ({
  ...DEFAULT,
  ...persisted,
  justCelebrated: false, // set true when a play advanced the streak to a new day

  /** Record that a game was completed. Call once per finished match. */
  recordPlay: () => {
    const today = dateKey();
    const state = get();

    let currentStreak = state.currentStreak;
    let advanced = false;

    if (state.lastPlayedDate === today) {
      // Already counted today — nothing changes except the game tally.
    } else if (state.lastPlayedDate && diffDays(state.lastPlayedDate, today) === 1) {
      currentStreak = state.currentStreak + 1;
      advanced = true;
    } else {
      currentStreak = 1; // first ever, or a day (or more) was missed
      advanced = true;
    }

    const bestStreak = Math.max(state.bestStreak, currentStreak);
    const playedDates = state.playedDates.includes(today)
      ? state.playedDates
      : [...state.playedDates, today].slice(-90);

    const next = {
      currentStreak,
      bestStreak,
      lastPlayedDate: today,
      playedDates,
      totalGames: state.totalGames + 1,
    };
    setJSON(StorageKeys.streak, next);
    set({ ...next, justCelebrated: advanced });
  },

  clearCelebration: () => set({ justCelebrated: false }),

  /** DEV/testing helper — wipe all streak data. */
  resetStreak: () => {
    storage.delete(StorageKeys.streak);
    set({ ...DEFAULT, justCelebrated: false });
  },
}));

/** Display streak: 0 unless the stored streak is still alive (today/yesterday). */
export function activeStreak(state) {
  const { lastPlayedDate, currentStreak } = state;
  if (!lastPlayedDate) return 0;
  const gap = diffDays(lastPlayedDate, dateKey());
  return gap <= 1 ? currentStreak : 0;
}
