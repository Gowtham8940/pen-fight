import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from './theme/useTheme';
import { radii, spacing } from './theme/tokens';
import { scale } from '../lib/responsive';

/**
 * Centered themed modal card.
 * Props: visible, onRequestClose, dismissable (tap backdrop to close), children.
 */
export function Modal({
  visible,
  onRequestClose,
  dismissable = false,
  bare = false,
  blocking = false, // true = Android BACK cannot dismiss (update/maintenance gates)
  overlay = null, // full-bleed layer drawn behind the card (confetti, etc.)
  children,
}) {
  const theme = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={blocking ? () => {} : onRequestClose}
      statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={dismissable ? onRequestClose : undefined}>
        {overlay ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {overlay}
          </View>
        ) : null}
        {bare ? (
          <View style={{ width: '100%', maxWidth: scale(360) }}>{children}</View>
        ) : (
          <Pressable
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, maxWidth: scale(360) },
            ]}>
            {children}
          </Pressable>
        )}
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
