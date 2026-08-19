import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';

import { GameCanvas } from '../../game/render/GameCanvas';
import { computeTableLayout, createWorld } from '../../game/config/tableLayout';
import { GAME_STATUS, other } from '../../game/state/gameMachine';
import { WORLD_STATUS } from '../../game/engine/constants';
import { useGameStore } from '../../game/state/useGameStore';
import { getSkin } from '../../skins/registry';
import { SoundManager } from '../../audio/SoundManager';
import { useStreakStore, activeStreak } from '../../features/streaks/useStreakStore';

export function GameScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const skinAId = useGameStore(s => s.skinA);
  const skinBId = useGameStore(s => s.skinB);
  const status = useGameStore(s => s.status);
  const current = useGameStore(s => s.current);
  const winner = useGameStore(s => s.winner);
  const scores = useGameStore(s => s.scores);
  const streak = useStreakStore(activeStreak);

  const skinA = useMemo(() => getSkin(skinAId), [skinAId]);
  const skinB = useMemo(() => getSkin(skinBId), [skinBId]);

  const table = useMemo(
    () => computeTableLayout(width, height, insets),
    [width, height, insets.top, insets.bottom, insets.left, insets.right],
  );

  const world = useSharedValue(createWorld(table, skinA, skinB));

  // (Re)seed the round on mount and whenever the table or skins change.
  useEffect(() => {
    world.value = createWorld(table, skinA, skinB);
    useGameStore.getState().startMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.w, table.h, skinAId, skinBId]);

  // Audio lifecycle.
  useEffect(() => {
    SoundManager.init();
    SoundManager.startMusic();
    return () => SoundManager.stopMusic();
  }, []);

  const lastHit = useRef(0);

  const onLaunch = useCallback(power => {
    useGameStore.getState().setSimulating();
    SoundManager.play('flick', Math.max(0.4, power));
  }, []);

  const onHit = useCallback(() => {
    const now = Date.now();
    if (now - lastHit.current < 120) return; // debounce repeated contact frames
    lastHit.current = now;
    SoundManager.play('clack');
  }, []);

  const onSettle = useCallback(() => {
    // Swap the turn on both the physics world and the discrete store.
    world.value = {
      ...world.value,
      status: WORLD_STATUS.AIMING,
      current: other(world.value.current),
      aiming: false,
      settle: 0,
    };
    useGameStore.getState().commitTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGameOver = useCallback(win => {
    useGameStore.getState().endGame(win);
    useStreakStore.getState().recordPlay(); // count this completed match toward the daily streak
    SoundManager.play('penoff');
    setTimeout(() => SoundManager.play('win'), 350);
  }, []);

  const onRematch = useCallback(() => {
    world.value = createWorld(table, skinA, skinB);
    useGameStore.getState().rematch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, skinA, skinB]);

  const onHome = useCallback(() => {
    useGameStore.getState().goHome();
    navigation.goBack();
  }, [navigation]);

  const currentKey = status === GAME_STATUS.AIMING ? current : null;
  const currentSkin = current === 'a' ? skinA : skinB;
  const turnName = t(current === 'a' ? 'game.playerA' : 'game.playerB');

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <GameCanvas
        world={world}
        table={table}
        skinA={skinA}
        skinB={skinB}
        theme={theme}
        currentKey={currentKey}
        onLaunch={onLaunch}
        onHit={onHit}
        onSettle={onSettle}
        onGameOver={onGameOver}
      />

      {/* HUD */}
      <View style={[styles.hud, { top: insets.top + spacing.sm, left: spacing.md, right: spacing.md }]}>
        <ScorePill color={skinB.body} label={t('game.playerB')} value={scores.b} />
        <View style={styles.turnWrap} pointerEvents="none">
          {status !== GAME_STATUS.GAMEOVER && (
            <View style={[styles.turnChip, { backgroundColor: currentSkin.body }]}>
              <Text variant="caption" weight="bold" color="#FFFFFF">
                {t('game.turn', { name: turnName })}
              </Text>
            </View>
          )}
        </View>
        <ScorePill color={skinA.body} label={t('game.playerA')} value={scores.a} />
      </View>

      {/* Aim hint on the very first turn */}
      {status === GAME_STATUS.AIMING && scores.a === 0 && scores.b === 0 && (
        <View style={[styles.hint, { bottom: insets.bottom + spacing.md }]} pointerEvents="none">
          <Text variant="caption" color={theme.colors.textMuted} style={{ textAlign: 'center' }}>
            {t('game.aimHint')}
          </Text>
        </View>
      )}

      {/* Win modal */}
      <Modal visible={status === GAME_STATUS.GAMEOVER}>
        <Text variant="heading" weight="bold" style={{ textAlign: 'center' }}>
          {t('game.wins', {
            name: t(winner === 'a' ? 'game.playerA' : 'game.playerB'),
          })}
        </Text>
        <Text variant="body" color={theme.colors.textMuted}>
          {scores.a} — {scores.b}
        </Text>
        {streak > 0 && (
          <Text variant="body" weight="bold" color={theme.colors.accent} style={{ textAlign: 'center' }}>
            🔥 {t('streak.celebrate', { count: streak })}
          </Text>
        )}
        <View style={styles.modalActions}>
          <Button title={t('game.rematch')} onPress={onRematch} />
          <Button title={t('game.home')} variant="secondary" onPress={onHome} />
        </View>
      </Modal>
    </View>
  );
}

function ScorePill({ color, label, value }) {
  const theme = useTheme();
  return (
    <View style={[styles.scorePill, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" color={theme.colors.textMuted}>
        {label}
      </Text>
      <Text variant="subheading" weight="bold">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hud: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  turnWrap: { flex: 1, alignItems: 'center' },
  turnChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    minWidth: scale(70),
  },
  dot: { width: scale(10), height: scale(10), borderRadius: 999 },
  hint: { position: 'absolute', left: spacing.xl, right: spacing.xl },
  modalActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
});
