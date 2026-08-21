import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from './theme/useTheme';
import { radii, spacing, fontSizes } from './theme/tokens';
import { scale } from '../lib/responsive';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * School-theme button, modelled on penfight.xyz:
 * - primary : solid red block, white stamped label
 * - outline : blue-ink outlined block, ink label
 * - link    : underlined ink text link
 * Springs down slightly when pressed.
 */
export function Button({ title, onPress, variant = 'primary', disabled, style, leading }) {
  const theme = useTheme();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.96 : 1, { damping: 16, stiffness: 260 }) }],
  }));

  const isLink = variant === 'link';
  const bg = variant === 'primary' ? theme.colors.red : 'transparent';
  const fg = variant === 'primary' ? '#FFF7EC' : theme.colors.ink;
  const borderColor = variant === 'outline' ? theme.colors.ink : 'transparent';

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      style={[
        isLink ? styles.link : styles.block,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: disabled ? 0.45 : 1,
        },
        variant === 'primary' && styles.primaryShadow,
        animatedStyle,
        style,
      ]}>
      <View style={styles.row}>
        {leading}
        {title ? (
          isLink ? (
            <Text family="hand" variant="body" color={theme.colors.ink} style={styles.underline}>
              {title}
            </Text>
          ) : (
            <Text family="display" variant="subheading" color={fg} style={styles.label}>
              {title}
            </Text>
          )
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radii.sm,
    paddingVertical: scale(14),
    paddingHorizontal: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  link: { paddingVertical: spacing.sm, alignItems: 'center' },
  // Generous line height so emoji labels (e.g. 🔥) aren't vertically clipped.
  label: { lineHeight: scale(fontSizes.lg * 1.15) },
  underline: { textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
