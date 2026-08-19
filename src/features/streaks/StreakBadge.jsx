import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { spacing, radii } from '../../ui/theme/tokens';
import { useStreakStore, activeStreak } from './useStreakStore';

/**
 * Compact 🔥 streak chip for the Home screen. Dims when the streak is broken
 * (0). Tapping opens the streak detail screen.
 */
export function StreakBadge({ onPress }) {
  const theme = useTheme();
  const streak = useStreakStore(activeStreak);
  const alive = streak > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: theme.colors.surface,
          borderColor: alive ? theme.colors.accent : theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.flame, { opacity: alive ? 1 : 0.4 }]}>
        <Text variant="subheading">🔥</Text>
      </View>
      <Text variant="subheading" weight="bold" color={alive ? theme.colors.text : theme.colors.textMuted}>
        {streak}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  flame: {},
});
