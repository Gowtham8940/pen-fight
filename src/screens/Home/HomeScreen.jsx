import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { spacing } from '../../ui/theme/tokens';
import { Routes } from '../../app/navigation/routes';

export function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.hero}>
        <Text variant="title" weight="bold" color={theme.colors.brand} style={styles.center}>
          {t('app.name')}
        </Text>
        <Text variant="body" color={theme.colors.textMuted} style={styles.center}>
          {t('app.tagline')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title={t('home.playLocal')} onPress={() => navigation.navigate(Routes.Game)} />
        <Button
          title={t('home.skins')}
          variant="secondary"
          onPress={() => navigation.navigate(Routes.SkinSelect)}
        />
        <Button
          title={t('home.settings')}
          variant="ghost"
          onPress={() => navigation.navigate(Routes.Settings)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  actions: { gap: spacing.md, paddingBottom: spacing.xl },
});
