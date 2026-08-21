import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { useImage } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { PaperCard } from '../../ui/PaperCard';
import { Chalkboard, ChalkText } from '../../ui/Chalkboard';
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
import { CLASSROOM_BG, DESK_SURFACE, PEN_IMAGES } from '../../assets/images';

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

  // Preload the Skia images here and gate the canvas on them, so the desk/pens
  // never flash their hand-drawn fallback while the real sprites decode.
  const deskImg = useImage(DESK_SURFACE || null);
  const penImgA = useImage(PEN_IMAGES[skinAId] || null);
  const penImgB = useImage(PEN_IMAGES[skinBId] || null);
  const assetsReady =
    (!DESK_SURFACE || deskImg) &&
    (!PEN_IMAGES[skinAId] || penImgA) &&
    (!PEN_IMAGES[skinBId] || penImgB);

  // The chalkboard scoreboard is measured so the desk always starts below it
  // (rather than being covered by it). Seeded with a sensible estimate.
  const [boardH, setBoardH] = useState(150);
  const hudTop = spacing.sm + boardH + spacing.md;

  const table = useMemo(
    () => computeTableLayout(width, height, insets, hudTop),
    [width, height, insets.top, insets.bottom, insets.left, insets.right, hudTop],
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
    <ImageBackground
      source={CLASSROOM_BG}
      resizeMode="cover"
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {assetsReady ? (
        <GameCanvas
          world={world}
          table={table}
          skinA={skinA}
          skinB={skinB}
          theme={theme}
          deskImg={deskImg}
          penImgA={penImgA}
          penImgB={penImgB}
          currentKey={currentKey}
          onLaunch={onLaunch}
          onHit={onHit}
          onSettle={onSettle}
          onGameOver={onGameOver}
        />
      ) : (
        <View style={styles.loading} />
      )}

      {/* Chalkboard scoreboard (the class name-list) */}
      <View
        style={[styles.hud, { top: insets.top + spacing.sm, left: spacing.md, right: spacing.md }]}
        onLayout={e => setBoardH(e.nativeEvent.layout.height)}>
        <Chalkboard>
          <ScoreLine
            name={t('game.playerA')}
            score={scores.a}
            color={skinA.body}
            chalk={theme.colors.chalkBlue}
            active={status !== GAME_STATUS.GAMEOVER && current === 'a'}
          />
          <View style={styles.chalkRule} />
          <ScoreLine
            name={t('game.playerB')}
            score={scores.b}
            color={skinB.body}
            chalk={theme.colors.chalkPink}
            active={status !== GAME_STATUS.GAMEOVER && current === 'b'}
          />
        </Chalkboard>
      </View>

      {/* Turn / aim hint */}
      {status === GAME_STATUS.AIMING && (
        <View style={[styles.hint, { bottom: insets.bottom + spacing.md }]} pointerEvents="none">
          <Text family="hand" variant="body" color={theme.colors.chalkSoft} style={styles.centerText}>
            {scores.a === 0 && scores.b === 0
              ? t('game.aimHint')
              : t('game.turn', { name: turnName })}
          </Text>
        </View>
      )}

      {/* Win note (torn paper) */}
      <Modal visible={status === GAME_STATUS.GAMEOVER} bare>
        <PaperCard>
          <View style={styles.noteHead}>
            <Text family="display" variant="subheading" color={theme.colors.ink}>
              Pen Fight
            </Text>
            <Text family="hand" variant="caption" color={theme.colors.inkMuted}>
              {scores.a} — {scores.b}
            </Text>
          </View>
          <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />
          <Text family="display" variant="heading" color={theme.colors.red} style={styles.centerText}>
            {t('game.wins', { name: t(winner === 'a' ? 'game.playerA' : 'game.playerB') })}
          </Text>
          {streak > 0 && (
            <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.centerText}>
              🔥 {t('streak.celebrate', { count: streak })}
            </Text>
          )}
          <View style={styles.noteActions}>
            <Button title={t('game.rematch')} onPress={onRematch} />
            <Button title={t('game.home')} variant="link" onPress={onHome} />
          </View>
        </PaperCard>
      </Modal>
    </ImageBackground>
  );
}

/** One chalk name-list line: name (in that player's chalk colour), tally, score. */
function ScoreLine({ name, score, color, chalk, active }) {
  const theme = useTheme();
  const boxes = 5;
  return (
    <View style={[styles.scoreLine, !active && styles.dimLine]}>
      <View style={styles.nameCell}>
        <ChalkText size="sm" color={chalk || theme.colors.chalk}>
          {active ? '› ' : '  '}
          {name}
        </ChalkText>
      </View>
      <View style={styles.tally}>
        {Array.from({ length: boxes }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tallyBox,
              { borderColor: theme.colors.chalkSoft },
              i < score && { backgroundColor: color, borderColor: color },
            ]}
          />
        ))}
      </View>
      <ChalkText size="lg" style={styles.scoreNum}>
        {score}
      </ChalkText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1 },
  hud: { position: 'absolute' },
  chalkRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.xs },
  scoreLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dimLine: { opacity: 0.6 },
  nameCell: { flex: 1 },
  tally: { flexDirection: 'row', gap: 4 },
  tallyBox: {
    width: scale(14),
    height: scale(14),
    borderWidth: 1.5,
    borderRadius: 2,
  },
  scoreNum: { minWidth: scale(26), textAlign: 'right' },
  hint: { position: 'absolute', left: spacing.xl, right: spacing.xl },
  centerText: { textAlign: 'center' },
  noteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rule: { height: 2, marginTop: spacing.xs, marginBottom: spacing.md, opacity: 0.8 },
  noteActions: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md },
});
