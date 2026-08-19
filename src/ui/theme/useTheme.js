import { useThemeContext } from '../../app/providers/ThemeProvider';

/** Convenience hook returning just the resolved theme object. */
export function useTheme() {
  return useThemeContext().theme;
}
