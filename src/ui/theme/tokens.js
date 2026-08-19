/**
 * Design tokens for light and dark themes.
 * Consumed via useTheme(). Keep every color defined in BOTH palettes.
 */

const palette = {
  brand: '#3B82F6',
  brandDark: '#2563EB',
  accent: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  penA: '#3B82F6',
  penB: '#EF4444',
};

export const lightTheme = {
  mode: 'light',
  colors: {
    ...palette,
    background: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF1F7',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    // Game table
    table: '#0E7C5A',
    tableEdge: '#0A5C43',
    tableFelt: '#12A374',
    onTable: '#FFFFFF',
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    ...palette,
    background: '#0B1120',
    surface: '#131C31',
    surfaceAlt: '#1B2740',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    border: '#26324B',
    // Game table
    table: '#0B5C43',
    tableEdge: '#073B2C',
    tableFelt: '#0E7C5A',
    onTable: '#FFFFFF',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { sm: 8, md: 12, lg: 20, pill: 999 };
export const fontSizes = { sm: 13, md: 16, lg: 20, xl: 28, xxl: 40 };

export function getTheme(mode) {
  return mode === 'dark' ? darkTheme : lightTheme;
}
