import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Emoji } from '../../ui/Emoji';
import { Chalkboard, ChalkText } from '../../ui/Chalkboard';
import { spacing } from '../../ui/theme/tokens';

/**
 * Full-screen maintenance notice, shown (in App.jsx) when APP_STATUS.maintenance
 * is true. `onRetry` re-reads the flag (later: re-fetches remote config).
 */
export function MaintenanceScreen({ onRetry }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.root}>
      <Chalkboard style={styles.board}>
        <View style={styles.emoji}>
          <Emoji size={56}>🛠️</Emoji>
        </View>
        <ChalkText size="lg" style={styles.center}>
          {t('maintenance.title')}
        </ChalkText>
        <ChalkText size="sm" color={theme.colors.chalkSoft} style={styles.center}>
          {t('maintenance.message')}
        </ChalkText>
      </Chalkboard>

      {onRetry && (
        <Text
          family="hand"
          variant="body"
          color={theme.colors.chalkSoft}
          onPress={onRetry}
          style={styles.retry}>
          {t('maintenance.retry')}
        </Text>
      )}
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, zIndex: 9999 },
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  board: { alignSelf: 'stretch', gap: spacing.sm, paddingVertical: spacing.lg },
  emoji: { alignItems: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  retry: { textDecorationLine: 'underline', padding: spacing.sm },
});
