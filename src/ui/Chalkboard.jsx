import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from './theme/useTheme';
import { radii, spacing, FONTS } from './theme/tokens';
import { Text } from './Text';
import { scale } from '../lib/responsive';

/**
 * A framed green chalkboard. Children render as chalk. Used for the scoreboard
 * and headings, echoing the classroom board on penfight.xyz.
 */
export function Chalkboard({ children, style }) {
  const theme = useTheme();
  return (
    <View style={[styles.frame, { backgroundColor: theme.colors.chalkFrame }, style]}>
      <View style={[styles.board, { backgroundColor: theme.colors.chalkboard }]}>{children}</View>
    </View>
  );
}

/** Chalk-styled text (handwriting, chalk white, soft glow). */
export function ChalkText({ children, size = 'md', color, style, ...rest }) {
  const theme = useTheme();
  const px = { sm: 15, md: 20, lg: 30, xl: 42 }[size];
  return (
    <Text
      family="hand"
      color={color || theme.colors.chalk}
      style={[
        {
          fontFamily: FONTS.hand,
          fontSize: scale(px),
          textShadowColor: 'rgba(255,255,255,0.25)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 6,
        },
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radii.md,
    padding: scale(8),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  board: {
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
});
