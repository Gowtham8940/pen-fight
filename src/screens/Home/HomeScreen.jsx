import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { PaperCard } from '../../ui/PaperCard';
import { Chalkboard, ChalkText } from '../../ui/Chalkboard';
import { StatRow } from '../../ui/StatRow';
import { spacing } from '../../ui/theme/tokens';
import { Routes } from '../../app/navigation/routes';
import { useStreakStore, activeStreak } from '../../features/streaks/useStreakStore';
import { CLASSROOM_BG } from '../../assets/images';

export function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const streak = useStreakStore(activeStreak);
  const bestStreak = useStreakStore(s => s.bestStreak);
  const totalGames = useStreakStore(s => s.totalGames);

  return (
    <ImageBackground source={CLASSROOM_BG} resizeMode="cover" style={styles.bg}>
      <View style={[styles.scrim, { backgroundColor: theme.colors.background }]} pointerEvents="none" />
      <SafeAreaView style={styles.root}>
      {/* Chalkboard header */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <Chalkboard style={styles.board}>
          <ChalkText size="xl" style={styles.center}>
            Pen Fight
          </ChalkText>
          <ChalkText size="sm" color={theme.colors.chalkSoft} style={styles.center}>
            the unofficial sport of the last bench
          </ChalkText>
        </Chalkboard>
      </Animated.View>

      {/* Class diary paper card */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.cardWrap}>
        <PaperCard>
          <View style={styles.diaryHead}>
            <Text family="display" variant="subheading" color={theme.colors.ink}>
              {t('home.classDiary')}
            </Text>
            <Text family="hand" variant="body" color={theme.colors.inkMuted}>
              {t('home.diaryNo')}
            </Text>
          </View>
          <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />

          <View style={styles.nameRow}>
            <Text family="display" variant="caption" color={theme.colors.inkMuted}>
              {t('home.name')}
            </Text>
            <Text family="display" variant="heading" color={theme.colors.ink}>
              {t('home.player')}
            </Text>
          </View>

          <View style={styles.statWrap}>
            <StatRow
              items={[
                { value: streak, label: t('home.statStreak') },
                { value: bestStreak, label: t('home.statBest') },
                { value: totalGames, label: t('home.statGames') },
              ]}
            />
          </View>
        </PaperCard>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeIn.delay(350).duration(500)} style={styles.actions}>
        <Button title={t('home.playLocal')} onPress={() => navigation.navigate(Routes.Game)} />
        <View style={styles.actionRow}>
          <Button
            title={t('home.skins')}
            variant="outline"
            style={styles.flex}
            onPress={() => navigation.navigate(Routes.SkinSelect)}
          />
          <Button
            title="🔥"
            variant="outline"
            style={styles.flexSmall}
            onPress={() => navigation.navigate(Routes.Streak)}
          />
        </View>
        <Button
          title={t('home.settings')}
          variant="link"
          onPress={() => navigation.navigate(Routes.Settings)}
        />
      </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  root: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  board: { marginTop: spacing.sm },
  center: { textAlign: 'center' },
  cardWrap: {},
  diaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rule: { height: 2, marginTop: spacing.xs, marginBottom: spacing.md, opacity: 0.8 },
  nameRow: { marginBottom: spacing.md },
  statWrap: { marginTop: spacing.xs },
  actions: { marginTop: 'auto', gap: spacing.md, paddingBottom: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  flexSmall: { width: 64 },
});
