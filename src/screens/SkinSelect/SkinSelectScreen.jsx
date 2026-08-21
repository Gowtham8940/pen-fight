import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';
import { SKINS, isSkinOwned } from '../../skins/registry';
import { useGameStore } from '../../game/state/useGameStore';
import { PEN_IMAGES } from '../../assets/images';

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
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={owned ? onPress : undefined}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: selected ? skin.body : 'transparent',
          opacity: owned ? 1 : 0.5,
        },
      ]}>
      <PenPreview skin={skin} />
      <Text variant="caption" weight="medium" numberOfLines={1}>
        {t(`skinNames.${skin.nameKey}`)}
      </Text>
      {!owned && (
        <Text variant="caption" color={theme.colors.textMuted}>
          🔒 {t('skins.locked')}
        </Text>
      )}
    </Pressable>
  );
}

function PlayerSection({ title, selectedId, onSelect, ownedSkins }) {
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
            owned={isSkinOwned(skin, ownedSkins)}
            onPress={() => onSelect(skin.id)}
          />
        ))}
      </View>
    </View>
  );
}

export function SkinSelectScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const skinA = useGameStore(s => s.skinA);
  const skinB = useGameStore(s => s.skinB);
  const ownedSkins = useGameStore(s => s.ownedSkins);
  const setSkin = useGameStore(s => s.setSkin);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Text variant="heading" color={theme.colors.chalk}>
        {t('skins.title')}
      </Text>
      <PlayerSection
        title={t('skins.player1')}
        selectedId={skinA}
        ownedSkins={ownedSkins}
        onSelect={id => setSkin('a', id)}
      />
      <PlayerSection
        title={t('skins.player2')}
        selectedId={skinB}
        ownedSkins={ownedSkins}
        onSelect={id => setSkin('b', id)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: scale(96),
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
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
});
