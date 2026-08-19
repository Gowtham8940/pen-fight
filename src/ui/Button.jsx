import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from './theme/useTheme';
import { radii, spacing } from './theme/tokens';
import { scale } from '../lib/responsive';
import { Text } from './Text';

/**
 * Themed button.
 * Props: title, onPress, variant ('primary'|'secondary'|'ghost'), disabled, style, leading.
 */
export function Button({ title, onPress, variant = 'primary', disabled, style, leading }) {
  const theme = useTheme();

  const bg = {
    primary: theme.colors.brand,
    secondary: theme.colors.surfaceAlt,
    ghost: 'transparent',
  }[variant];

  const fg = {
    primary: '#FFFFFF',
    secondary: theme.colors.text,
    ghost: theme.colors.brand,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? theme.colors.brand : 'transparent',
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          paddingVertical: scale(14),
          paddingHorizontal: scale(22),
        },
        style,
      ]}>
      <View style={styles.row}>
        {leading}
        <Text weight="bold" color={fg} variant="subheading">
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
