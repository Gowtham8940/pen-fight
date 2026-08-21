import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Emoji } from '../../ui/Emoji';
import { Button } from '../../ui/Button';
import { PaperCard } from '../../ui/PaperCard';
import { Chalkboard, ChalkText } from '../../ui/Chalkboard';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';
import { useGameStore } from '../../game/state/useGameStore';
import { useStreakStore } from '../../features/streaks/useStreakStore';
import { getSkin } from '../../skins/registry';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const records = useGameStore(s => s.records);
  const skinAId = useGameStore(s => s.skinA);
  const skinBId = useGameStore(s => s.skinB);
  const resetRecords = useGameStore(s => s.resetRecords);
  const bestStreak = useStreakStore(s => s.bestStreak);
  const totalGames = useStreakStore(s => s.totalGames);

  const entries = [
    { id: 'a', name: t('game.playerA'), wins: records.a, color: getSkin(skinAId).body },
    { id: 'b', name: t('game.playerB'), wins: records.b, color: getSkin(skinBId).body },
  ].sort((x, y) => y.wins - x.wins);

  const hasAny = records.a + records.b > 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Chalkboard>
        <ChalkText size="lg" style={styles.center}>
          {t('leaderboard.title')}
        </ChalkText>
      </Chalkboard>

      <PaperCard>
        <View style={styles.head}>
          <Text family="display" variant="subheading" color={theme.colors.ink}>
            {t('leaderboard.rankHead')}
          </Text>
          <Text family="hand" variant="body" color={theme.colors.inkMuted}>
            {t('leaderboard.diaryNo')}
          </Text>
        </View>
        <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />

        {hasAny ? (
          entries.map((e, i) => (
            <View key={e.id} style={styles.row}>
              <View style={styles.rankCell}>
                {i < MEDALS.length ? (
                  <Emoji size={20}>{MEDALS[i]}</Emoji>
                ) : (
                  <Text family="display" variant="body" color={theme.colors.inkMuted}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <View style={[styles.dot, { backgroundColor: e.color }]} />
              <Text family="display" variant="subheading" color={theme.colors.ink} style={styles.name}>
                {e.name}
              </Text>
              <Text family="display" variant="heading" color={theme.colors.red}>
                {e.wins}
              </Text>
              <Text family="hand" variant="caption" color={theme.colors.inkMuted} style={styles.winsLabel}>
                {t('leaderboard.wins')}
              </Text>
            </View>
          ))
        ) : (
          <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.empty}>
            {t('leaderboard.empty')}
          </Text>
        )}
      </PaperCard>

      {/* Records */}
      <View style={styles.statsRow}>
        <Stat label={t('leaderboard.bestStreak')} value={bestStreak} flame />
        <Stat label={t('leaderboard.totalGames')} value={totalGames} />
      </View>

      {hasAny && (
        <Button title={t('leaderboard.reset')} variant="link" onPress={resetRecords} />
      )}
    </ScrollView>
  );
}

function Stat({ label, value, flame }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statValue}>
        {flame && <Emoji size={18}>🔥</Emoji>}
        <Text family="display" variant="heading" color={theme.colors.ink}>
          {value}
        </Text>
      </View>
      <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  center: { textAlign: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rule: { height: 2, marginTop: spacing.xs, marginBottom: spacing.sm, opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rankCell: { width: scale(28), alignItems: 'center' },
  dot: { width: scale(12), height: scale(12), borderRadius: 999 },
  name: { flex: 1 },
  winsLabel: { marginLeft: 2 },
  empty: { textAlign: 'center', paddingVertical: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
