import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme/useTheme';
import { Text } from './Text';
import { spacing } from './theme/tokens';
import { scale } from '../lib/responsive';

/**
 * Compact in-content screen header: a chalk BACK pill beside the title.
 *
 * It scrolls with the page rather than floating above it, so long content can
 * never slide underneath the back control.
 */
export function ScreenHeader({ title }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={14}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
        <Text family="display" variant="caption" color={theme.colors.chalk}>
          ‹ BACK
        </Text>
      </Pressable>

      <Text
        variant="heading"
        color={theme.colors.chalk}
        numberOfLines={1}
        style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  pill: {
    backgroundColor: 'rgba(20,24,20,0.45)',
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: 999,
  },
  pillPressed: { opacity: 0.6 },
  title: { flexShrink: 1 },
});
