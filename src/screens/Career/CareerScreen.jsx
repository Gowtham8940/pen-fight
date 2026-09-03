import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Button } from '../../ui/Button';
import { Emoji } from '../../ui/Emoji';
import { PaperCard } from '../../ui/PaperCard';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';
import { useGameStore } from '../../game/state/useGameStore';
import { useStreakStore, activeStreak } from '../../features/streaks/useStreakStore';
import { LEVELS, getLevelInfo } from '../../game/progression/levels';
import { lastNDays, weekdayShort, dateKey } from '../../features/streaks/dates';
import { SKINS } from '../../skins/registry';
import { getSkin } from '../../skins/registry';
import { PEN_IMAGES, APP_ICON } from '../../assets/images';
import { haptics } from '../../lib/haptics';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Counts a number up on mount — small games-y flourish for the stat values. */
function useCountUp(target, ms = 700) {
  const [n, setN] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / ms);
      // ease-out so it decelerates into the final value
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return n;
}

/** Big animated stat tile. */
function Stat({ value, label, emoji, color }) {
  const theme = useTheme();
  const shown = useCountUp(value);
  return (
    <View style={[styles.stat, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statTop}>
        {emoji ? <Emoji size={16}>{emoji}</Emoji> : null}
        <Text family="display" variant="heading" color={color || theme.colors.ink}>
          {shown}
        </Text>
      </View>
      <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
        {label}
      </Text>
    </View>
  );
}

/** Hero: avatar, editable name, rank badge and XP bar to the next rank. */
function RankHero({ info, playerName, onRename }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState(playerName);
  const [editing, setEditing] = useState(false);

  const pulse = useSharedValue(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
    fill.value = withTiming(info.progress, { duration: 900 });
  }, [pulse, fill, info.progress]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  const save = () => {
    onRename(name.trim() || playerName);
    setEditing(false);
    haptics.selection();
  };

  return (
    <PaperCard>
      <View style={styles.heroRow}>
        <Image source={APP_ICON} style={styles.avatar} resizeMode="contain" />
        <View style={styles.heroInfo}>
          {editing ? (
            <View style={styles.renameRow}>
              <TextInput
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={20}
                onSubmitEditing={save}
                style={[styles.input, { color: theme.colors.ink, borderColor: theme.colors.ink }]}
              />
              <Button title={t('career.save')} variant="link" onPress={save} />
            </View>
          ) : (
            <Text
              family="display"
              variant="heading"
              color={theme.colors.ink}
              numberOfLines={1}
              onPress={() => setEditing(true)}>
              {playerName}
            </Text>
          )}

          <Animated.View style={[styles.rankBadge, { backgroundColor: theme.colors.red }, badgeStyle]}>
            <Emoji size={14}>{info.current.emoji}</Emoji>
            <Text family="display" variant="caption" color="#FFF7EC">
              {t('career.levelShort', { level: info.current.level })} ·{' '}
              {t(`skins.levelNames.${info.current.nameKey}`)}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* XP bar toward the next rank */}
      <View style={[styles.xpTrack, { backgroundColor: theme.colors.paperEdge }]}>
        <Animated.View style={[styles.xpFill, { backgroundColor: theme.colors.red }, fillStyle]} />
      </View>
      <Text family="hand" variant="caption" color={theme.colors.inkSoft}>
        {info.next
          ? t('career.toNext', {
              count: info.gamesToNext,
              name: t(`skins.levelNames.${info.next.nameKey}`),
            })
          : t('career.maxed')}
      </Text>
    </PaperCard>
  );
}

/** The rank path — one node per rank, showing the pen it unlocks. */
function RankPath({ totalGames, info }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <PaperCard>
      <Text family="display" variant="subheading" color={theme.colors.ink}>
        {t('career.pathTitle')}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathRow}>
        {LEVELS.map((lvl, i) => {
          const reached = totalGames >= lvl.games;
          const isCurrent = lvl.level === info.current.level;
          const skin = SKINS.find(s => s.id === lvl.unlockSkin);
          const img = skin && PEN_IMAGES[skin.id];
          return (
            <React.Fragment key={lvl.level}>
              {i > 0 && (
                <View
                  style={[
                    styles.pathLine,
                    { backgroundColor: reached ? theme.colors.red : theme.colors.paperEdge },
                  ]}
                />
              )}
              <View style={styles.nodeCol}>
                <View
                  style={[
                    styles.node,
                    {
                      borderColor: isCurrent
                        ? theme.colors.red
                        : reached
                        ? theme.colors.inkSoft
                        : theme.colors.paperEdge,
                      opacity: reached ? 1 : 0.5,
                    },
                  ]}>
                  {img ? (
                    <Image source={img} style={styles.nodePen} resizeMode="contain" />
                  ) : (
                    <Emoji size={22}>{lvl.emoji}</Emoji>
                  )}
                  {!reached && (
                    <View style={styles.nodeLock}>
                      <Emoji size={11}>🔒</Emoji>
                    </View>
                  )}
                </View>
                <Text family="display" variant="caption" color={theme.colors.inkMuted}>
                  {t('career.levelShort', { level: lvl.level })}
                </Text>
                <Text family="hand" variant="caption" color={theme.colors.inkSoft} numberOfLines={1}>
                  {t(`skinNames.${lvl.unlockSkin}`)}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </PaperCard>
  );
}

/** Streak: flame, current vs best, and the last 7 days. */
function StreakCard({ streak, bestStreak, playedDates }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const week = lastNDays(7);
  const today = dateKey();

  const flame = useSharedValue(0);
  useEffect(() => {
    flame.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
  }, [flame]);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + flame.value * 0.14 }, { rotate: `${(flame.value - 0.5) * 6}deg` }],
  }));

  return (
    <PaperCard>
      <Text family="display" variant="subheading" color={theme.colors.ink}>
        {t('career.streakTitle')}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />

      <View style={styles.streakTop}>
        <Animated.View style={flameStyle}>
          <Emoji size={44}>🔥</Emoji>
        </Animated.View>
        <View>
          <Text family="display" variant="title" color={theme.colors.red}>
            {streak}
          </Text>
          <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
            {streak === 1 ? t('streak.day') : t('streak.days')} · {t('career.best')} {bestStreak}
          </Text>
        </View>
      </View>

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
                {played && <Emoji size={13}>🔥</Emoji>}
              </View>
              <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
                {weekdayShort(key).slice(0, 2)}
              </Text>
            </View>
          );
        })}
      </View>
    </PaperCard>
  );
}

/** Head-to-head record between the two seats. */
function RecordsCard({ records, skinAId, skinBId, onReset }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const entries = [
    { id: 'a', name: t('game.playerA'), wins: records.a, color: getSkin(skinAId).body },
    { id: 'b', name: t('game.playerB'), wins: records.b, color: getSkin(skinBId).body },
  ].sort((x, y) => y.wins - x.wins);
  const hasAny = records.a + records.b > 0;

  return (
    <PaperCard>
      <Text family="display" variant="subheading" color={theme.colors.ink}>
        {t('career.recordsTitle')}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />

      {hasAny ? (
        entries.map((e, i) => (
          <View key={e.id} style={styles.recRow}>
            <View style={styles.recRank}>
              <Emoji size={18}>{MEDALS[i] || '•'}</Emoji>
            </View>
            <View style={[styles.recDot, { backgroundColor: e.color }]} />
            <Text family="display" variant="subheading" color={theme.colors.ink} style={styles.recName}>
              {e.name}
            </Text>
            <Text family="display" variant="heading" color={theme.colors.red}>
              {e.wins}
            </Text>
          </View>
        ))
      ) : (
        <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.center}>
          {t('career.noRecords')}
        </Text>
      )}

      {hasAny && <Button title={t('career.reset')} variant="link" onPress={onReset} />}
    </PaperCard>
  );
}

export function CareerScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const playerName = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const records = useGameStore(s => s.records);
  const skinAId = useGameStore(s => s.skinA);
  const skinBId = useGameStore(s => s.skinB);
  const resetRecords = useGameStore(s => s.resetRecords);

  const streak = useStreakStore(activeStreak);
  const bestStreak = useStreakStore(s => s.bestStreak);
  const totalGames = useStreakStore(s => s.totalGames);
  const playedDates = useStreakStore(s => s.playedDates);

  const info = getLevelInfo(totalGames);
  const totalWins = records.a + records.b;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <ScreenHeader title={t('career.title')} />

      <Animated.View entering={FadeInDown.duration(420)}>
        <RankHero info={info} playerName={playerName} onRename={setPlayerName} />
      </Animated.View>

      {/* quick stats */}
      <Animated.View entering={FadeInDown.delay(90).duration(420)} style={styles.statsRow}>
        <Stat value={totalGames} label={t('career.games')} emoji="🎮" />
        <Stat value={totalWins} label={t('career.wins')} emoji="🏆" />
        <Stat value={bestStreak} label={t('career.best')} emoji="🔥" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(420)}>
        <RankPath totalGames={totalGames} info={info} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(270).duration(420)}>
        <StreakCard streak={streak} bestStreak={bestStreak} playedDates={playedDates} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(360).duration(420)}>
        <RecordsCard
          records={records}
          skinAId={skinAId}
          skinBId={skinBId}
          onReset={resetRecords}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  center: { textAlign: 'center', paddingVertical: spacing.sm },
  rule: { height: 2, marginTop: spacing.xs, marginBottom: spacing.sm, opacity: 0.8 },

  // hero
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: scale(54), height: scale(54), borderRadius: radii.md },
  heroInfo: { flex: 1, gap: spacing.xs },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    borderBottomWidth: 2,
    paddingVertical: 2,
    fontSize: scale(18),
  },
  rankBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  xpTrack: { height: 10, borderRadius: 999, overflow: 'hidden', marginTop: spacing.md },
  xpFill: { height: '100%', borderRadius: 999 },

  // stats
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  // rank path
  pathRow: { alignItems: 'flex-start', paddingVertical: spacing.xs },
  pathLine: { width: scale(16), height: 3, borderRadius: 999, marginTop: scale(30) },
  nodeCol: { width: scale(74), alignItems: 'center', gap: 2 },
  node: {
    width: scale(60),
    height: scale(60),
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  nodePen: { width: scale(26), height: scale(46) },
  nodeLock: { position: 'absolute', bottom: -2, right: -2 },

  // streak
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dayCol: { alignItems: 'center', gap: 3 },
  dot: {
    width: scale(30),
    height: scale(30),
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // records
  recRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  recRank: { width: scale(26), alignItems: 'center' },
  recDot: { width: scale(11), height: scale(11), borderRadius: 999 },
  recName: { flex: 1 },
});
