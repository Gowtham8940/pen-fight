/**
 * Synchronous key-value storage backed by MMKV.
 * Used for settings that must be read instantly at startup
 * (selected skins, theme override, mute, language).
 */
import { createMMKV } from 'react-native-mmkv';

// react-native-mmkv v4: instances are created via createMMKV() (the `MMKV`
// export is a type only), not `new MMKV()`.
export const storage = createMMKV({ id: 'penfight' });

export const StorageKeys = {
  themeMode: 'theme.mode', // 'light' | 'dark' | 'system'
  language: 'app.language', // 'en' | 'ar' | ...
  muted: 'audio.muted',
  skinA: 'skins.playerA',
  skinB: 'skins.playerB',
  ownedSkins: 'skins.owned', // JSON array — hook for later donations/shop unlocks
  streak: 'streak.data', // JSON blob for the daily-streak feature
};

export function getString(key, fallback) {
  const v = storage.getString(key);
  return v === undefined ? fallback : v;
}

export function getBool(key, fallback = false) {
  const v = storage.getBoolean(key);
  return v === undefined ? fallback : v;
}

export function getJSON(key, fallback) {
  const raw = storage.getString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  storage.set(key, JSON.stringify(value));
}
