import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { PaperCard } from '../../ui/PaperCard';
import { spacing, radii, fontSizes, FONTS } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';
import { useGameStore } from '../../game/state/useGameStore';
import { useStreakStore } from '../../features/streaks/useStreakStore';
import { haptics } from '../../lib/haptics';
import { APP_ICON } from '../../assets/images';

export function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const playerName = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const records = useGameStore(s => s.records);
  const bestStreak = useStreakStore(s => s.bestStreak);
  const totalGames = useStreakStore(s => s.totalGames);

  const [name, setName] = useState(playerName);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== playerName;

  const onSave = () => {
    setPlayerName(name.trim() || t('profile.namePlaceholder'));
    haptics.selection();
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={APP_ICON} style={styles.avatar} resizeMode="contain" />
        <Text family="display" variant="heading" color={theme.colors.chalk}>
          {playerName}
        </Text>
      </View>

      <PaperCard>
        <Text family="display" variant="caption" color={theme.colors.inkMuted}>
          {t('profile.nameLabel')}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('profile.namePlaceholder')}
          placeholderTextColor={theme.colors.inkMuted}
          maxLength={20}
          style={[styles.input, { color: theme.colors.ink, borderColor: theme.colors.ink }]}
        />
        <Button
          title={saved ? t('profile.saved') : t('profile.save')}
          onPress={onSave}
          disabled={!dirty && !saved}
          style={styles.save}
        />
      </PaperCard>

      <View style={styles.statsRow}>
        <Stat label={t('profile.statWins')} value={records.a} />
        <Stat label={t('profile.statBest')} value={bestStreak} />
        <Stat label={t('profile.statGames')} value={totalGames} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.colors.surface }]}>
      <Text family="display" variant="heading" color={theme.colors.ink}>
        {value}
      </Text>
      <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  avatar: { width: scale(96), height: scale(96), borderRadius: radii.lg },
  input: {
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    fontFamily: FONTS.hand,
    fontSize: scale(fontSizes.lg),
  },
  save: { marginTop: spacing.md, alignSelf: 'stretch' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
});
