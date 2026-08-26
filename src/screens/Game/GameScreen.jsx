import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useImage } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { PaperCard } from '../../ui/PaperCard';
import { Emoji } from '../../ui/Emoji';
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';

import { GameCanvas } from '../../game/render/GameCanvas';
import { computeTableLayout, createWorld } from '../../game/config/tableLayout';
import { GAME_STATUS, other } from '../../game/state/gameMachine';
import { WORLD_STATUS } from '../../game/engine/constants';
import { useGameStore } from '../../game/state/useGameStore';
import { getSkin } from '../../skins/registry';
import { SoundManager } from '../../audio/SoundManager';
import { haptics } from '../../lib/haptics';
import { useStreakStore, activeStreak } from '../../features/streaks/useStreakStore';
import { CLASSROOM_BG, DESK_SURFACE, PEN_IMAGES } from '../../assets/images';

const REACTIONS = ['😂', '😮', '🔥', '👏', '😎'];

export function GameScreen({ navigation, route }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // 'cpu' = play vs the computer (seat B is the AI); otherwise pass-and-play.
  const mode = route?.params?.mode === 'cpu' ? 'cpu' : 'local';

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

  // Board-less: the desk fills almost the whole screen; the small corner score
  // badges just float on top.
  const hudTop = 10;

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

  // Screen shake on a hard hit — purely visual, scaled by impact strength.
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const onLaunch = useCallback(power => {
    useGameStore.getState().setSimulating();
    SoundManager.play('flick', Math.max(0.4, power));
    haptics.medium();
  }, []);

  const onHit = useCallback(strength => {
    const now = Date.now();
    if (now - lastHit.current < 120) return; // debounce repeated contact frames
    lastHit.current = now;
    SoundManager.play('clack', Math.max(0.35, strength));
    if (strength > 0.7) haptics.heavy();
    else if (strength > 0.32) haptics.medium();
    else haptics.light();

    const mag = 3 + strength * 11; // px
    shakeX.value = withSequence(
      withTiming(-mag, { duration: 28 }),
      withTiming(mag, { duration: 42 }),
      withTiming(-mag * 0.4, { duration: 42 }),
      withTiming(0, { duration: 36 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    haptics.success();
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

  // --- Computer opponent (seat B) ---
  const doAiMove = useCallback(() => {
    const w = world.value;
    if (w.status !== WORLD_STATUS.AIMING || w.current !== 'b') return;
    const a = w.a;
    const b = w.b;
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    // Aim error + variable power for a beatable, human-ish opponent.
    const err = (Math.random() - 0.5) * 0.22;
    const c = Math.cos(err);
    const s = Math.sin(err);
    const ax = dx * c - dy * s;
    const ay = dx * s + dy * c;
    const power = 0.6 + Math.random() * 0.3;
    const speed = power * table.tuning.maxLaunchSpeed;
    w.b.vx = ax * speed;
    w.b.vy = ay * speed;
    w.b.omega = 0;
    w.status = WORLD_STATUS.SIMULATING;
    w.settle = 0;
    world.value = { ...w };
    useGameStore.getState().setSimulating();
    SoundManager.play('flick', power);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  useEffect(() => {
    if (mode !== 'cpu') return undefined;
    if (status !== GAME_STATUS.AIMING || current !== 'b' || winner) return undefined;
    const id = setTimeout(doAiMove, 900); // brief "thinking" pause
    return () => clearTimeout(id);
  }, [mode, status, current, winner, doAiMove]);

  // Block human dragging while it's the computer's turn.
  const aimEnabled = !(mode === 'cpu' && current === 'b');

  const nameA = t('game.playerA');
  const nameB = mode === 'cpu' ? t('game.cpu') : t('game.playerB');

  // Emoji reactions for a bit of table-talk.
  const [reaction, setReaction] = useState(null);
  const onReact = useCallback(emoji => {
    setReaction({ emoji, id: Date.now() });
    haptics.selection();
  }, []);

  const currentKey = status === GAME_STATUS.AIMING ? current : null;
  const turnName = current === 'a' ? nameA : nameB;

  return (
    <ImageBackground
      source={CLASSROOM_BG}
      resizeMode="cover"
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.canvasWrap, shakeStyle]}>
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
            aimEnabled={aimEnabled}
            onLaunch={onLaunch}
            onHit={onHit}
            onSettle={onSettle}
            onGameOver={onGameOver}
          />
        ) : (
          <View style={styles.loading} />
        )}
      </Animated.View>

      {/* Corner score points */}
      <CornerScore
        side="left"
        top={insets.top + 6}
        name={nameA}
        score={scores.a}
        color={skinA.body}
        active={status !== GAME_STATUS.GAMEOVER && current === 'a'}
      />
      <CornerScore
        side="right"
        top={insets.top + 6}
        name={nameB}
        score={scores.b}
        color={skinB.body}
        active={status !== GAME_STATUS.GAMEOVER && current === 'b'}
      />

      {/* Floating emoji reaction */}
      <FloatingReaction data={reaction} />

      {/* Reactions bar */}
      <View style={[styles.reactions, { bottom: insets.bottom + spacing.sm }]}>
        {REACTIONS.map(e => (
          <Pressable key={e} onPress={() => onReact(e)} style={styles.reactBtn} hitSlop={6}>
            <Emoji size={24}>{e}</Emoji>
          </Pressable>
        ))}
      </View>

      {/* Turn / aim hint (sits above the reactions bar) */}
      {status === GAME_STATUS.AIMING && (
        <View style={[styles.hint, { bottom: insets.bottom + scale(56) }]} pointerEvents="none">
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
            {t('game.wins', { name: winner === 'a' ? nameA : nameB })}
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

/** Small floating score badge in a top corner. */
function CornerScore({ side, top, name, score, color, active }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.corner,
        { top },
        side === 'left' ? { left: spacing.md } : { right: spacing.md },
        active && styles.cornerActive,
      ]}>
      <View style={styles.cornerRow}>
        <View style={[styles.cornerDot, { backgroundColor: color }]} />
        <Text family="display" variant="caption" color="#FFFFFF" numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text family="display" variant="heading" color="#FFFFFF" style={styles.cornerScore}>
        {score}
      </Text>
    </View>
  );
}

/** A big emoji that floats up and fades when a reaction is sent. */
function FloatingReaction({ data }) {
  const y = useSharedValue(0);
  const o = useSharedValue(0);
  const s = useSharedValue(0.6);

  useEffect(() => {
    if (!data) return;
    y.value = 0;
    s.value = 0.6;
    o.value = 1;
    y.value = withTiming(-scale(180), { duration: 1200 });
    s.value = withSequence(withTiming(1.5, { duration: 300 }), withTiming(1.1, { duration: 250 }));
    o.value = withDelay(650, withTiming(0, { duration: 550 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && data.id]);

  const st = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }, { scale: s.value }],
  }));

  if (!data) return null;
  return (
    <Animated.View style={[styles.floatReaction, st]} pointerEvents="none">
      <Emoji size={72}>{data.emoji}</Emoji>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvasWrap: { flex: 1 },
  loading: { flex: 1 },
  corner: {
    position: 'absolute',
    backgroundColor: 'rgba(20,24,20,0.5)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: scale(74),
  },
  cornerActive: { borderColor: 'rgba(255,255,255,0.85)' },
  cornerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cornerDot: { width: scale(9), height: scale(9), borderRadius: 999 },
  cornerScore: { lineHeight: scale(30) },
  reactions: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: 'rgba(20,24,20,0.4)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reactBtn: { paddingHorizontal: spacing.xs, paddingVertical: 2 },
  floatReaction: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '32%',
  },
  hint: { position: 'absolute', left: spacing.xl, right: spacing.xl },
  centerText: { textAlign: 'center' },
  noteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rule: { height: 2, marginTop: spacing.xs, marginBottom: spacing.md, opacity: 0.8 },
  noteActions: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md },
});
