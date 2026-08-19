import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from './theme/useTheme';
import { radii, spacing } from './theme/tokens';

/**
 * A torn sheet of ruled notebook paper — the core surface of the school theme
 * (the "Class Diary" on penfight.xyz). Cream paper, faint rule lines, a red
 * left margin, a jagged torn top edge, and a soft drop shadow.
 *
 * Lines and teeth are rendered as fixed, over-provisioned sets inside
 * overflow-hidden layers, so they clip to the card and never influence its
 * measured size (the card always hugs its content).
 */
const LINE_COUNT = 40;
const LINE_H = 30;
const TOOTH = 16;
const TEETH = 40;

export function PaperCard({ children, ruled = true, margin = true, torn = true, style, contentStyle }) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, style]}>
      {torn && (
        <View style={styles.teethRow} pointerEvents="none">
          {Array.from({ length: TEETH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.tooth,
                { borderTopColor: theme.colors.background, borderLeftWidth: TOOTH / 2, borderRightWidth: TOOTH / 2, borderTopWidth: 9 },
              ]}
            />
          ))}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.colors.paper }, contentStyle]}>
        {ruled && (
          <View style={styles.linesLayer} pointerEvents="none">
            {Array.from({ length: LINE_COUNT }).map((_, i) => (
              <View key={i} style={{ height: LINE_H, borderBottomWidth: 1, borderBottomColor: theme.colors.rule }} />
            ))}
          </View>
        )}
        {margin && <View pointerEvents="none" style={[styles.margin, { backgroundColor: theme.colors.margin }]} />}

        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  teethRow: { flexDirection: 'row', marginBottom: -1, overflow: 'hidden', zIndex: 2 },
  tooth: { width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  card: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
    overflow: 'hidden',
  },
  // Absolute, clipped by the card's overflow:hidden — never affects layout height.
  linesLayer: { position: 'absolute', top: 18, left: 0, right: 0, height: LINE_COUNT * LINE_H },
  margin: { position: 'absolute', top: 0, bottom: 0, left: 34, width: 2, opacity: 0.6 },
  content: { padding: spacing.lg, paddingLeft: spacing.xl + spacing.md },
});
