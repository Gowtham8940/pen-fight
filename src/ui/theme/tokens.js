/**
 * Design tokens — "last bench" school theme, modelled on penfight.xyz:
 * cream notebook paper + blue ballpoint ink + red accents, a green chalkboard
 * scoreboard, and a warm wooden desk play surface, all set in a classroom.
 *
 * Most content sits on paper (ink text) or the chalkboard (chalk text), so
 * light/dark mainly swaps the classroom backdrop; paper stays paper.
 */

// Bundled fonts (see src/assets/fonts + react-native.config.js).
export const FONTS = {
  display: 'Anton-Regular', // bold condensed uppercase — headers / stamps
  hand: 'PatrickHand-Regular', // handwriting — body / ink copy
};

const ink = {
  paper: '#F4ECD8',
  paperEdge: '#E7DBBB',
  rule: '#D9CBA6', // faint ruled lines
  margin: '#CD5A4D', // red left-margin line
  ink: '#2B3F80', // ballpoint blue
  inkSoft: '#5566A0',
  inkMuted: '#8B93AE',
  red: '#C6382C',
  redDark: '#A62B22',
  chalkboard: '#39473C',
  chalkboardDark: '#2C382F',
  chalkFrame: '#6E4A2B',
  chalk: '#F3F0E4',
  chalkSoft: '#C9D1C0',
  wood: '#C88E52',
  woodDark: '#9A6631',
  woodEdge: '#7C4F22',
  woodGrain: '#B77E42',
  woodMark: '#8A5A2C',
  penA: '#2B5FB0',
  penB: '#C6382C',
};

export const lightTheme = {
  mode: 'light',
  colors: {
    ...ink,
    background: '#6E7A5E', // olive classroom wall
    surface: ink.paper,
    surfaceAlt: ink.paperEdge,
    text: ink.ink,
    textMuted: ink.inkMuted,
    border: ink.paperEdge,
    brand: ink.ink, // links / outlines are blue ink
    accent: ink.red,
    danger: ink.red,
    success: '#3E7D4F',
    // Game desk
    table: ink.wood,
    tableEdge: ink.woodEdge,
    tableFelt: ink.woodGrain,
    onTable: ink.ink,
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    ...ink,
    background: '#2E3529', // dim evening classroom
    surface: ink.paper, // notes are still paper
    surfaceAlt: ink.paperEdge,
    text: ink.ink,
    textMuted: ink.inkMuted,
    border: ink.paperEdge,
    brand: ink.ink,
    accent: ink.red,
    danger: ink.red,
    success: '#3E7D4F',
    table: '#B07C44',
    tableEdge: '#6A4420',
    tableFelt: '#9C6A36',
    onTable: ink.ink,
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { sm: 6, md: 10, lg: 16, pill: 999 };
export const fontSizes = { sm: 14, md: 17, lg: 22, xl: 30, xxl: 44 };

export function getTheme(mode) {
  return mode === 'dark' ? darkTheme : lightTheme;
}
