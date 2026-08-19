import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ui/theme/useTheme';
import { useThemeContext } from '../../app/providers/ThemeProvider';
import { Text } from '../../ui/Text';
import { spacing, radii } from '../../ui/theme/tokens';
import { useGameStore } from '../../game/state/useGameStore';
import { SoundManager } from '../../audio/SoundManager';
import i18n, { setLanguage } from '../../i18n';

function Segmented({ options, value, onChange }) {
  const theme = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.colors.surfaceAlt }]}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentItem,
              active && { backgroundColor: theme.colors.brand, borderRadius: radii.sm },
            ]}>
            <Text variant="caption" weight={active ? 'bold' : 'regular'} color={active ? '#FFFFFF' : theme.colors.text}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({ title, children }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surface }]}>
      <Text variant="body" weight="medium">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { preference, setThemePreference } = useThemeContext();
  const muted = useGameStore(s => s.muted);
  const toggleMuted = useGameStore(s => s.toggleMuted);
  const [lang, setLang] = useState(i18n.language);

  const onToggleSound = () => {
    toggleMuted();
    SoundManager.applyMuted(!muted);
  };

  const onChangeLang = value => {
    setLang(value);
    const { needsRestart } = setLanguage(value);
    if (needsRestart) {
      Alert.alert(t('settings.language'), 'Please restart the app to apply the new text direction.');
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Text variant="heading" weight="bold">
        {t('settings.title')}
      </Text>

      <Row title={t('settings.theme')}>
        <Segmented
          value={preference}
          onChange={setThemePreference}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </Row>

      <Row title={t('settings.sound')}>
        <Segmented
          value={muted ? 'muted' : 'on'}
          onChange={onToggleSound}
          options={[
            { value: 'on', label: '🔊' },
            { value: 'muted', label: '🔇' },
          ]}
        />
      </Row>

      <Row title={t('settings.language')}>
        <Segmented
          value={lang}
          onChange={onChangeLang}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'ar', label: 'العربية' },
          ]}
        />
      </Row>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radii.md, gap: 4 },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
