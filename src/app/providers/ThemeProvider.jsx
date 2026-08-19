import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme } from '../../ui/theme/tokens';
import { storage, StorageKeys, getString } from '../../lib/storage';

const ThemeContext = createContext(null);

/**
 * Provides the resolved theme object plus controls to change it.
 * `preference` is 'system' | 'light' | 'dark' and is persisted in MMKV.
 */
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState(() =>
    getString(StorageKeys.themeMode, 'system'),
  );

  const mode = preference === 'system' ? systemScheme || 'light' : preference;
  const theme = useMemo(() => getTheme(mode), [mode]);

  const setThemePreference = useCallback(pref => {
    setPreference(pref);
    storage.set(StorageKeys.themeMode, pref);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setThemePreference]);

  const value = useMemo(
    () => ({ theme, mode, preference, setThemePreference, toggleTheme }),
    [theme, mode, preference, setThemePreference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
