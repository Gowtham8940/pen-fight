import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './theme/useTheme';
import { Text } from './Text';
import { Emoji } from './Emoji';
import { Button } from './Button';
import { Modal } from './Modal';
import { PaperCard } from './PaperCard';
import { spacing } from './theme/tokens';

/**
 * "Update available" popup. Shows Update (opens the store) and, unless the
 * update is required, a Skip button.
 */
export function UpdatePrompt({ visible, required, onUpdate, onSkip }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} bare blocking>
      <PaperCard>
        <View style={styles.head}>
          <Emoji size={28}>🚀</Emoji>
          <Text family="display" variant="subheading" color={theme.colors.ink}>
            {t('update.title')}
          </Text>
        </View>
        <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />
        <Text family="hand" variant="body" color={theme.colors.inkSoft}>
          {t('update.message')}
        </Text>
        <View style={styles.actions}>
          <Button title={t('update.update')} onPress={onUpdate} />
          {!required && <Button title={t('update.skip')} variant="link" onPress={onSkip} />}
        </View>
      </PaperCard>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rule: { height: 2, marginTop: spacing.xs, marginBottom: spacing.sm, opacity: 0.8 },
  actions: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md },
});
