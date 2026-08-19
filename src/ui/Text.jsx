import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from './theme/useTheme';
import { fontSizes, FONTS } from './theme/tokens';
import { scale } from '../lib/responsive';

/**
 * Themed text.
 * - Display variants (title/heading/subheading) use the condensed Anton face,
 *   uppercased and tracked, like the printed labels on penfight.xyz.
 * - Body/caption use the Patrick Hand handwriting face (blue ink).
 * Pass `family="display" | "hand"` to override the automatic choice.
 */
const DISPLAY_VARIANTS = ['title', 'heading', 'subheading'];

export function Text({ variant = 'body', family, color, style, children, ...rest }) {
  const theme = useTheme();
  const isDisplay = family ? family === 'display' : DISPLAY_VARIANTS.includes(variant);

  const size = {
    title: fontSizes.xxl,
    heading: fontSizes.xl,
    subheading: fontSizes.lg,
    body: fontSizes.md,
    caption: fontSizes.sm,
  }[variant];

  return (
    <RNText
      style={[
        styles.base,
        {
          fontFamily: isDisplay ? FONTS.display : FONTS.hand,
          fontSize: scale(size),
          color: color || theme.colors.text,
          letterSpacing: isDisplay ? 0.8 : 0.2,
        },
        isDisplay && styles.display,
        style,
      ]}
      {...rest}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  display: { textTransform: 'uppercase' },
});
