import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';
import { useStreakStore, activeStreak } from './useStreakStore';
import { lastNDays, weekdayShort, dateKey } from './dates';

export function StreakScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const streak = useStreakStore(activeStreak);
  const bestStreak = useStreakStore(s => s.bestStreak);
  const totalGames = useStreakStore(s => s.totalGames);
  const playedDates = useStreakStore(s => s.playedDates);

  const week = lastNDays(7);
  const today = dateKey();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      {/* Big flame count */}
      <View style={styles.hero}>
        <Text style={styles.bigFlame}>🔥</Text>
        <Text variant="title" weight="bold">
          {streak}
        </Text>
        <Text variant="body" color={theme.colors.textMuted}>
          {streak === 1 ? t('streak.day') : t('streak.days')}
        </Text>
        {streak === 0 && (
          <Text variant="caption" color={theme.colors.textMuted} style={styles.center}>
            {t('streak.none')}
          </Text>
        )}
      </View>

      {/* Week dots */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
          {t('streak.thisWeek')}
        </Text>
        <View style={styles.week}>
          {week.map(key => {
            const played = playedDates.includes(key);
            const isToday = key === today;
            return (
              <View key={key} style={styles.dayCol}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: played ? theme.colors.accent : theme.colors.surfaceAlt,
                      borderColor: isToday ? theme.colors.brand : 'transparent',
                    },
                  ]}>
                  {played && <Text style={styles.dotFlame}>🔥</Text>}
                </View>
                <Text variant="caption" color={theme.colors.textMuted}>
                  {weekdayShort(key).slice(0, 2)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label={t('streak.current')} value={streak} />
        <Stat label={t('streak.best')} value={bestStreak} />
      </View>
      <Text variant="caption" color={theme.colors.textMuted} style={styles.center}>
        {t('streak.totalGames', { count: totalGames })}
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.colors.surface }]}>
      <Text variant="heading" weight="bold">
        {value}
      </Text>
      <Text variant="caption" color={theme.colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  bigFlame: { fontSize: scale(56) },
  center: { textAlign: 'center', marginTop: spacing.sm },
  card: { borderRadius: radii.md, padding: spacing.md, gap: spacing.md },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: spacing.xs },
  dot: {
    width: scale(34),
    height: scale(34),
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFlame: { fontSize: scale(16) },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
});
