import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from './theme/useTheme';
import { Text } from './Text';
import { spacing } from './theme/tokens';

/**
 * Report-card style stat row: big ink numbers over small uppercase labels,
 * separated by thin rules — like the "WON / STREAK / TAKEN / SEAT" strip on
 * penfight.xyz.
 * Props: items = [{ value, label }]
 */
export function StatRow({ items }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: theme.colors.rule }]} />}
          <View style={styles.cell}>
            <Text family="display" variant="heading" color={theme.colors.ink}>
              {item.value}
            </Text>
            <Text family="display" variant="caption" color={theme.colors.inkMuted}>
              {item.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.xs, opacity: 0.7 },
});
