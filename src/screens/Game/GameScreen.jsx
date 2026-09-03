import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../ui/theme/useTheme';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { PaperCard } from '../../ui/PaperCard';
import { Emoji } from '../../ui/Emoji';
import { LevelUpToast } from '../../ui/LevelUpToast';
import { PIConfetti } from 'react-native-fast-confetti';

// School-theme confetti: blue ink, red pen, chalk, gold star.
const CONFETTI_COLORS = ['#2B3F80', '#C6382C', '#F4ECD8', '#E8B23A', '#4E8C6A'];
import { spacing, radii } from '../../ui/theme/tokens';
import { scale } from '../../lib/responsive';

import { GameCanvas } from '../../game/render/GameCanvas';
import { computeTableLayout, createWorld } from '../../game/config/tableLayout';
import { GAME_STATUS, other } from '../../game/state/gameMachine';
import { WORLD_STATUS } from '../../game/engine/constants';
import { useGameStore } from '../../game/state/useGameStore';
import { getSkin, isSkinOwned, DEFAULT_SKIN_A } from '../../skins/registry';
import { Routes } from '../../app/navigation/routes';
import { getDifficulty } from '../../game/ai/difficulty';
import { getLevelInfo } from '../../game/progression/levels';
import { SoundManager } from '../../audio/SoundManager';
import { haptics } from '../../lib/haptics';
import { useStreakStore, activeStreak } from '../../features/streaks/useStreakStore';
import { CLASSROOM_BG, DESK_SURFACE, PEN_IMAGES } from '../../assets/images';
import { useSkImage } from '../../assets/skiaImages';

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
  const difficulty = useGameStore(s => s.difficulty);
  const setDifficulty = useGameStore(s => s.setDifficulty);
  const difficultyPrompted = useGameStore(s => s.difficultyPrompted);
  const markDifficultyPrompted = useGameStore(s => s.markDifficultyPrompted);
  const streak = useStreakStore(activeStreak);
  const totalGames = useStreakStore(s => s.totalGames);

  // Guard against a previously-selected skin that's since become locked
  // (e.g. the level-unlock system shipped after the player already picked
  // one) — fall back to the always-owned default rather than soft-locking them.
  const skinA = useMemo(() => {
    const s = getSkin(skinAId);
    return isSkinOwned(s, [], totalGames) ? s : getSkin(DEFAULT_SKIN_A);
  }, [skinAId, totalGames]);
  const skinB = useMemo(() => {
    const s = getSkin(skinBId);
    return isSkinOwned(s, [], totalGames) ? s : getSkin(DEFAULT_SKIN_A);
  }, [skinBId, totalGames]);

  // Read the decoded sprites from the process-wide cache (warmed at app start
  // in App.jsx). Cached ones are there on the first render, so the desk no
  // longer appears a second after the screen does.
  const deskImg = useSkImage(DESK_SURFACE || null);
  const penImgA = useSkImage(PEN_IMAGES[skinAId] || null);
  const penImgB = useSkImage(PEN_IMAGES[skinBId] || null);
  const assetsReady =
    (!DESK_SURFACE || deskImg) &&
    (!PEN_IMAGES[skinAId] || penImgA) &&
    (!PEN_IMAGES[skinBId] || penImgB);

  // The desk sprite takes a beat to decode. Rather than popping in, it eases
  // up to full size and opacity the moment it's ready.
  const boardIn = useSharedValue(0);
  useEffect(() => {
    if (assetsReady) {
      boardIn.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsReady]);
  const boardStyle = useAnimatedStyle(() => ({
    opacity: boardIn.value,
    transform: [{ scale: 0.94 + boardIn.value * 0.06 }],
  }));

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

  // A fresh sitting starts 0-0; REMATCH keeps the running tally.
  useEffect(() => {
    useGameStore.getState().resetScores();
  }, []);

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

  const onGameOver = useCallback(
    win => {
      // Rank is derived from games played, so compare the level either side of
      // recording this match to catch the moment it ticks over.
      const before = getLevelInfo(useStreakStore.getState().totalGames).current.level;
      useGameStore.getState().endGame(win);
      useStreakStore.getState().recordPlay(); // counts toward the daily streak
      const after = getLevelInfo(useStreakStore.getState().totalGames).current;

      SoundManager.play('penoff');
      setTimeout(() => SoundManager.play('win'), 350);
      haptics.success();

      if (after.level > before) {
        setLevelUp({
          level: after.level,
          nameKey: after.nameKey,
          emoji: after.emoji,
          skinName: t(`skinNames.${after.unlockSkin}`),
        });
      }

      // In CPU mode seat A is the human, so only their loss gets a pep talk.
      const humanLost = mode === 'cpu' && win === 'b';
      if (humanLost) {
        const pool = t('game.loseMessages', { returnObjects: true });
        const list = Array.isArray(pool) ? pool : [];
        setLoseMsg(list.length ? list[Math.floor(Math.random() * list.length)] : '');
      } else {
        setLoseMsg('');
      }
    },
    [t, mode],
  );

  const onRematch = useCallback(() => {
    world.value = createWorld(table, skinA, skinB);
    useGameStore.getState().rematch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, skinA, skinB]);

  // Android's edge-swipe back fires easily during a flick, which used to drop
  // the player straight onto Home mid-match. Intercept the pop and confirm.
  const allowExit = useRef(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const leaveNow = useCallback(() => {
    allowExit.current = true;
    setConfirmExit(false);
    useGameStore.getState().goHome();
    navigation.goBack();
  }, [navigation]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        // A finished match (or an intentional Home tap) may leave freely.
        if (allowExit.current || useGameStore.getState().status === GAME_STATUS.GAMEOVER) {
          return;
        }
        e.preventDefault();
        setConfirmExit(true);
      }),
    [navigation],
  );

  const onHome = useCallback(() => {
    leaveNow();
  }, [leaveNow]);

  // --- Computer opponent (seat B) ---
  const doAiMove = useCallback(() => {
    const w = world.value;
    if (w.status !== WORLD_STATUS.AIMING || w.current !== 'b') return;
    const cfg = getDifficulty(difficulty);
    const a = w.a;
    const b = w.b;

    // Base aim: straight at the opponent's pen.
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;

    // HARD only: instead of hitting the opponent dead-on, aim through them
    // toward whichever table edge they're closest to, so the hit shoves them
    // out rather than just knocking them around the middle.
    if (cfg.edgeAware) {
      const distLeft = a.x - table.x;
      const distRight = table.x + table.w - a.x;
      const distTop = a.y - table.y;
      const distBottom = table.y + table.h - a.y;
      const min = Math.min(distLeft, distRight, distTop, distBottom);
      let ex = 0;
      let ey = 0;
      if (min === distLeft) ex = -1;
      else if (min === distRight) ex = 1;
      else if (min === distTop) ey = -1;
      else ey = 1;
      // Blend the "push toward that edge" direction into the aim.
      const BLEND = 0.45;
      dx += ex * BLEND;
      dy += ey * BLEND;
      const bl = Math.hypot(dx, dy) || 1;
      dx /= bl;
      dy /= bl;
    }

    // Difficulty-scaled aim error: rotate the aim by a random angle.
    const err = (Math.random() - 0.5) * cfg.aimError;
    const c = Math.cos(err);
    const sn = Math.sin(err);
    const ax = dx * c - dy * sn;
    const ay = dx * sn + dy * c;

    // Difficulty-scaled power.
    const power = cfg.minPower + Math.random() * (cfg.maxPower - cfg.minPower);
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
  }, [table, difficulty]);

  useEffect(() => {
    if (mode !== 'cpu' || showLevelPick) return undefined;
    if (status !== GAME_STATUS.AIMING || current !== 'b' || winner) return undefined;
    const id = setTimeout(doAiMove, getDifficulty(difficulty).thinkMs);
    return () => clearTimeout(id);
  }, [mode, status, current, winner, doAiMove, difficulty, showLevelPick]);

  // Block human dragging while it's the computer's turn.
  const aimEnabled = !(mode === 'cpu' && current === 'b');

  const nameA = t('game.playerA');
  const nameB = mode === 'cpu' ? t('game.cpu') : t('game.playerB');

  // Emoji reactions for a bit of table-talk.
  const [reaction, setReaction] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  // Picked once per finished match so it doesn't reshuffle on every re-render.
  const [loseMsg, setLoseMsg] = useState('');
  const onReact = useCallback(emoji => {
    setReaction({ emoji, id: Date.now() });
    haptics.selection();
  }, []);

  // First time the player opens a CPU match, ask them to pick a level. The
  // AI is paused behind this so it can't shoot before they've chosen.
  const [showLevelPick, setShowLevelPick] = useState(mode === 'cpu' && !difficultyPrompted);
  const onPickLevel = useCallback(
    id => {
      setDifficulty(id);
      markDifficultyPrompted();
      setShowLevelPick(false);
      haptics.selection();
    },
    [setDifficulty, markDifficultyPrompted],
  );

  const currentKey = status === GAME_STATUS.AIMING ? current : null;
  const turnName = current === 'a' ? nameA : nameB;

  return (
    <ImageBackground
      source={CLASSROOM_BG}
      resizeMode="cover"
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.canvasWrap, shakeStyle]}>
        {assetsReady ? (
          <Animated.View style={[styles.canvasWrap, boardStyle]}>
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
          </Animated.View>
        ) : null}
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

      {/* Settings shortcut — change the computer level mid-match */}
      <Pressable
        onPress={() => navigation.navigate(Routes.Settings)}
        hitSlop={10}
        style={[styles.gearBtn, { top: insets.top + 6 }]}>
        <Emoji size={18}>⚙️</Emoji>
      </Pressable>

      {/* Rank-up notifier */}

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

      {/* First-run: pick the computer level */}
      <Modal visible={showLevelPick} bare>
        <PaperCard>
          <View style={styles.noteHead}>
            <Text family="display" variant="subheading" color={theme.colors.ink}>
              {t('game.pickLevelTitle')}
            </Text>
          </View>
          <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />
          <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.centerText}>
            {t('game.pickLevelHint')}
          </Text>
          <View style={styles.noteActions}>
            {['easy', 'medium', 'hard'].map(id => (
              <Button
                key={id}
                title={t(`settings.${id}`)}
                variant={id === 'medium' ? 'primary' : 'outline'}
                onPress={() => onPickLevel(id)}
              />
            ))}
          </View>
        </PaperCard>
      </Modal>

      {/* Win note (torn paper); confetti bursts behind it on a win */}
      <Modal
        visible={status === GAME_STATUS.GAMEOVER}
        bare
        overlay={
          status === GAME_STATUS.GAMEOVER && !loseMsg ? (
            <PIConfetti
              autoplay
              fadeOutOnEnd
              sprayDuration={500}
              gravity={1.5}
              drag={1.6}
              colors={CONFETTI_COLORS}>
              <PIConfetti.Origin
                blastPosition="bottom-left"
                count={80}
                initialSpeed={2.6}
                speedVariation={{ min: 0.5, max: 1 }}
              />
              <PIConfetti.Origin
                blastPosition="bottom-right"
                count={80}
                initialSpeed={2.6}
                speedVariation={{ min: 0.5, max: 1 }}
                delay={120}
              />
            </PIConfetti>
          ) : null
        }>
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
          {loseMsg ? (
            <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.centerText}>
              {loseMsg}
            </Text>
          ) : (
            streak > 0 && (
              <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.centerText}>
                🔥 {t('streak.celebrate', { count: streak })}
              </Text>
            )
          )}
          <View style={styles.noteActions}>
            <Button title={t('game.rematch')} onPress={onRematch} />
            <Button title={t('game.home')} variant="link" onPress={onHome} />
          </View>
        </PaperCard>
      </Modal>

      {/* Guard against an accidental edge-swipe leaving the match */}
      <Modal visible={confirmExit} bare onRequestClose={() => setConfirmExit(false)}>
        <PaperCard>
          <Text family="display" variant="subheading" color={theme.colors.ink}>
            {t('game.leaveTitle')}
          </Text>
          <View style={[styles.rule, { backgroundColor: theme.colors.ink }]} />
          <Text family="hand" variant="body" color={theme.colors.inkSoft} style={styles.centerText}>
            {t('game.leaveHint')}
          </Text>
          <View style={styles.noteActions}>
            <Button title={t('game.keepPlaying')} onPress={() => setConfirmExit(false)} />
            <Button title={t('game.leave')} variant="link" onPress={leaveNow} />
          </View>
        </PaperCard>
      </Modal>

      {/* Rank-up notifier — own window so it sits above the note */}
      <LevelUpToast data={levelUp} onDone={() => setLevelUp(null)} />
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
  gearBtn: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(20,24,20,0.5)',
    width: scale(36),
    height: scale(36),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
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
