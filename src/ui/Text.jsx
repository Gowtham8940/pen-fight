import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from './theme/useTheme';
import { fontSizes } from './theme/tokens';
import { scale } from '../lib/responsive';

const WEIGHTS = { regular: '400', medium: '600', bold: '800' };

/**
 * Themed text primitive.
 * Props: variant ('title'|'heading'|'body'|'caption'), weight, color, style.
 */
export function Text({ variant = 'body', weight = 'regular', color, style, children, ...rest }) {
  const theme = useTheme();
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
        { fontSize: scale(size), fontWeight: WEIGHTS[weight], color: color || theme.colors.text },
        style,
      ]}
      {...rest}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
