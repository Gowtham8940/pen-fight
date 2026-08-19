/**
 * Discrete game state (Zustand). Holds only facts that React screens/HUD care
 * about — never per-frame physics (that lives in the Reanimated `world`).
 * Updated from the physics worklet via runOnJS at discrete events.
 */
import { create } from 'zustand';
import { GAME_STATUS, other } from './gameMachine';
import { storage, StorageKeys, getBool, getString, getJSON } from '../../lib/storage';
import { DEFAULT_SKIN_A, DEFAULT_SKIN_B } from '../../skins/registry';

export const useGameStore = create((set, get) => ({
  status: GAME_STATUS.IDLE,
  current: 'a',
  winner: null,
  scores: { a: 0, b: 0 },

  // Player skins (persisted).
  skinA: getString(StorageKeys.skinA, DEFAULT_SKIN_A),
  skinB: getString(StorageKeys.skinB, DEFAULT_SKIN_B),
  ownedSkins: getJSON(StorageKeys.ownedSkins, []),

  // Audio (persisted).
  muted: getBool(StorageKeys.muted, false),

  // --- turn lifecycle ---
  startMatch: () => set({ status: GAME_STATUS.AIMING, current: 'a', winner: null }),

  setSimulating: () => set({ status: GAME_STATUS.SIMULATING }),

  // Called on settle: swap the turn and go back to aiming.
  commitTurn: () =>
    set(state => ({ status: GAME_STATUS.AIMING, current: other(state.current) })),

  endGame: winner =>
    set(state => ({
      status: GAME_STATUS.GAMEOVER,
      winner,
      scores: { ...state.scores, [winner]: state.scores[winner] + 1 },
    })),

  rematch: () => set({ status: GAME_STATUS.AIMING, current: 'a', winner: null }),

  resetScores: () => set({ scores: { a: 0, b: 0 } }),

  goHome: () => set({ status: GAME_STATUS.IDLE, winner: null }),

  // --- settings ---
  setSkin: (player, skinId) => {
    if (player === 'a') {
      storage.set(StorageKeys.skinA, skinId);
      set({ skinA: skinId });
    } else {
      storage.set(StorageKeys.skinB, skinId);
      set({ skinB: skinId });
    }
  },

  toggleMuted: () => {
    const next = !get().muted;
    storage.set(StorageKeys.muted, next);
    set({ muted: next });
  },
}));
