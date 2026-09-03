import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme/useTheme';
import { Text } from './Text';
import { Emoji } from './Emoji';
import { spacing, radii } from './theme/tokens';
import { scale } from '../lib/responsive';

/**
 * Slide-down "you unlocked a new rank" notifier, shown over the board when a
 * finished match pushes the player into a new rank. Auto-dismisses.
 *
 * `data` = { level, nameKey, emoji, skinName } | null — pass a NEW object to
 * re-trigger (the effect keys off data.level).
 */
export function LevelUpToast({ data, onDone }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hidden = -(scale(140) + insets.top);

  const y = useSharedValue(hidden);
  const o = useSharedValue(0);

  useEffect(() => {
    if (!data) return;
    o.value = withTiming(1, { duration: 200 });
    y.value = withSequence(
      withSpring(0, { damping: 14, stiffness: 170 }),
      withDelay(2200, withTiming(hidden, { duration: 320 })),
    );
    o.value = withDelay(
      2400,
      withTiming(0, { duration: 320 }, finished => {
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && data.level]);

  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }],
  }));

  if (!data) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={() => {}}>
      <Animated.View
        style={[styles.wrap, style, { paddingTop: insets.top + spacing.xs }]}
        pointerEvents="none">
        <View style={[styles.toast, { backgroundColor: theme.colors.red }]}>
          <Emoji size={26}>{data.emoji}</Emoji>
          <View style={styles.textCol}>
            <Text family="display" variant="caption" color="rgba(255,255,255,0.85)">
              {t('career.levelShort', { level: data.level })} · {t('levelUp.title')}
            </Text>
            <Text family="display" variant="subheading" color="#FFF7EC" numberOfLines={1}>
              {t(`skins.levelNames.${data.nameKey}`)}
            </Text>
            <Text family="hand" variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={1}>
              {t('levelUp.unlocked', { name: data.skinName })}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    maxWidth: scale(330),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  textCol: { flex: 1 },
});
