import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Emoji } from '../../ui/Emoji';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';
import { SKINS, isSkinOwned } from '../../skins/registry';
import { levelForSkin } from '../../game/progression/levels';
import { useStreakStore } from '../../features/streaks/useStreakStore';
import { useGameStore } from '../../game/state/useGameStore';
import { PEN_IMAGES } from '../../assets/images';
import { haptics } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pen preview — real sprite if we have one, else a coloured capsule. */
function PenPreview({ skin }) {
  const img = PEN_IMAGES[skin.id];
  return (
    <View style={styles.preview}>
      {img ? (
        <Image source={img} style={styles.penImg} resizeMode="contain" />
      ) : (
        <View style={[styles.penBody, { backgroundColor: skin.body }]}>
          <View style={[styles.penCap, { backgroundColor: skin.cap }]} />
          <View style={[styles.penTip, { backgroundColor: skin.tip }]} />
        </View>
      )}
    </View>
  );
}

function SkinCard({ skin, selected, owned, onPress }) {
  const lvl = levelForSkin(skin.id);
  const theme = useTheme();
  const { t } = useTranslation();
  const sel = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    sel.value = withSpring(selected ? 1 : 0, { damping: 13, stiffness: 190 });
  }, [selected, sel]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.07 * sel.value }],
    borderColor: selected ? skin.body : theme.colors.border,
    borderWidth: 2 + 2 * sel.value,
    shadowOpacity: 0.1 + 0.25 * sel.value,
    shadowRadius: 4 + 6 * sel.value,
    elevation: 2 + 6 * sel.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: sel.value,
    transform: [{ scale: sel.value }],
  }));

  return (
    <AnimatedPressable
      onPress={owned ? onPress : undefined}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, opacity: owned ? 1 : 0.5, shadowColor: skin.body },
        cardStyle,
      ]}>
      <PenPreview skin={skin} />
      <Text variant="caption" weight="medium" numberOfLines={1}>
        {t(`skinNames.${skin.nameKey}`)}
      </Text>
      {!owned && (
        <Text variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
          {lvl ? t('skins.unlocksAtLevel', { level: lvl.level }) : t('skins.locked')}
        </Text>
      )}

      {/* selected check badge */}
      <Animated.View style={[styles.badge, { backgroundColor: skin.body }, badgeStyle]}>
        <Emoji size={12}>✓</Emoji>
      </Animated.View>
    </AnimatedPressable>
  );
}

function PlayerSection({ title, selectedId, onSelect, ownedSkins, totalGames }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="subheading" color={theme.colors.chalk}>
        {title}
      </Text>
      <View style={styles.grid}>
        {SKINS.map(skin => (
          <SkinCard
            key={skin.id}
            skin={skin}
            selected={skin.id === selectedId}
            owned={isSkinOwned(skin, ownedSkins, totalGames)}
            onPress={() => onSelect(skin.id)}
          />
        ))}
      </View>
    </View>
  );
}

/** Horizontal "Class Rank" progression tree: one node per rank, connected by a
 * line, each showing the pen it unlocks. Locked ranks are dimmed with a
 * padlock; the current rank pulses; a progress bar shows games-to-next. */
export function SkinSelectScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const skinA = useGameStore(s => s.skinA);
  const skinB = useGameStore(s => s.skinB);
  const ownedSkins = useGameStore(s => s.ownedSkins);
  const setSkin = useGameStore(s => s.setSkin);
  const totalGames = useStreakStore(st => st.totalGames);

  const select = (player, id) => {
    haptics.selection();
    setSkin(player, id);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <ScreenHeader title={t('skins.title')} />

      <PlayerSection
        title={t('skins.player1')}
        selectedId={skinA}
        ownedSkins={ownedSkins}
        totalGames={totalGames}
        onSelect={id => select('a', id)}
      />
      <PlayerSection
        title={t('skins.player2')}
        selectedId={skinB}
        ownedSkins={ownedSkins}
        totalGames={totalGames}
        onSelect={id => select('b', id)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.lg },
  nodeWrap: { flexDirection: 'row', alignItems: 'center' },
  connector: { width: scale(18), height: 3, borderRadius: 999 },
  node: {
    width: scale(88),
    borderRadius: radii.md,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  section: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: scale(96),
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    shadowOffset: { width: 0, height: 3 },
  },
  preview: { height: scale(84), justifyContent: 'center', alignItems: 'center' },
  penImg: { height: scale(84), width: scale(44) },
  penBody: {
    width: scale(18),
    height: scale(60),
    borderRadius: scale(9),
    overflow: 'hidden',
    alignItems: 'center',
  },
  penCap: { width: '100%', height: '22%' },
  penTip: {
    width: scale(10),
    height: scale(10),
    borderRadius: 999,
    position: 'absolute',
    bottom: scale(4),
  },
  badge: {
    position: 'absolute',
    top: scale(6),
    right: scale(6),
    width: scale(20),
    height: scale(20),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathWrap: { gap: spacing.sm },
  pathHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pathRow: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: 2, gap: 2 },
  pathLine: { width: scale(22), height: 3, borderRadius: 2 },
  pathNode: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 3,
  },
  pathPen: { width: scale(20), height: scale(48) },
  pathLock: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    padding: 3,
  },
  pathLevelNum: { textAlign: 'center', marginTop: 2 },
  progressWrap: { gap: 4 },
  progressTrack: { height: scale(8), borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
});
