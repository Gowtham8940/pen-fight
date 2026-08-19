import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from './theme/useTheme';
import { radii, spacing } from './theme/tokens';
import { scale } from '../lib/responsive';

/**
 * Centered themed modal card.
 * Props: visible, onRequestClose, dismissable (tap backdrop to close), children.
 */
export function Modal({ visible, onRequestClose, dismissable = false, children }) {
  const theme = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={dismissable ? onRequestClose : undefined}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, maxWidth: scale(360) },
          ]}>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
});
