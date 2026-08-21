import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Emoji } from '../../ui/Emoji';
import { PaperCard } from '../../ui/PaperCard';
import { Chalkboard, ChalkText } from '../../ui/Chalkboard';
import { spacing } from '../../ui/theme/tokens';
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
      {/* Chalkboard hero */}
      <Chalkboard>
        <View style={styles.hero}>
          <Emoji size={64}>🔥</Emoji>
          <ChalkText size="xl">{streak}</ChalkText>
          <ChalkText size="sm" color={theme.colors.chalkSoft}>
            {streak === 1 ? t('streak.day') : t('streak.days')}
          </ChalkText>
          {streak === 0 && (
            <ChalkText size="sm" color={theme.colors.chalkSoft} style={styles.center}>
              {t('streak.none')}
            </ChalkText>
          )}
        </View>
      </Chalkboard>

      {/* This week */}
      <PaperCard>
        <Text family="display" variant="caption" color={theme.colors.inkMuted}>
          {t('streak.thisWeek')}
        </Text>
        <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />
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
                      backgroundColor: played ? theme.colors.red : theme.colors.paperEdge,
                      borderColor: isToday ? theme.colors.ink : 'transparent',
                    },
                  ]}>
                  {played && <Emoji size={16}>🔥</Emoji>}
                </View>
                <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
                  {weekdayShort(key).slice(0, 2)}
                </Text>
              </View>
            );
          })}
        </View>
      </PaperCard>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label={t('streak.current')} value={streak} />
        <Stat label={t('streak.best')} value={bestStreak} />
      </View>

      <ChalkText size="sm" color={theme.colors.chalkSoft} style={styles.center}>
        {t('streak.totalGames', { count: totalGames })}
      </ChalkText>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  const theme = useTheme();
  return (
    <View style={styles.statWrap}>
      <PaperCard>
        <View style={styles.statInner}>
          <Text family="display" variant="title" color={theme.colors.ink}>
            {value}
          </Text>
          <Text family="display" variant="caption" color={theme.colors.inkMuted}>
            {label}
          </Text>
        </View>
      </PaperCard>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  center: { textAlign: 'center', marginTop: spacing.xs },
  rule: { height: 2, marginVertical: spacing.sm, opacity: 0.7 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: spacing.xs },
  dot: {
    width: scale(36),
    height: scale(36),
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statWrap: { flex: 1 },
  statInner: { alignItems: 'center', gap: spacing.xs },
});
