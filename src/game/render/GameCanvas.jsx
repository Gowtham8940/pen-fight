import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { useFrameCallback, runOnJS } from 'react-native-reanimated';
import { PHYSICS, WORLD_STATUS, FALL_FRAMES } from '../engine/constants';
import { integrateBody, isSettled } from '../engine/physics';
import { resolveCollision } from '../engine/collision';
import { isOffTable } from '../engine/boundary';
import { useFlickGesture } from '../input/useFlickGesture';
import { Table } from './Table';
import { Pen } from './Pen';
import { AimIndicator } from './AimIndicator';
import { SparkFX } from './SparkFX';

/**
 * Hosts the Skia canvas, the fixed-timestep physics frame loop (UI thread), and
 * the flick gesture. Bridges to JS only at discrete events (hit/settle/gameover)
 * via runOnJS, never per frame.
 */
export function GameCanvas({
  world,
  table,
  skinA,
  skinB,
  theme,
  deskImg, // preloaded SkImages (loaded + gated by GameScreen to avoid a
  penImgA, // fallback flash on first render)
  penImgB,
  currentKey, // 'a' | 'b' | null — which pen shows the highlight (store-driven)
  aimEnabled = true, // false while the computer is taking its turn
  onLaunch,
  onHit,
  onSettle,
  onGameOver,
}) {
  const tuning = table.tuning;

  useFrameCallback(info => {
    'worklet';
    const w = world.value;
    const sim = w.status === WORLD_STATUS.SIMULATING;
    const falling = w.status === WORLD_STATUS.FALLING;
    if (!sim && !falling) return;

    let dt = (info.timeSincePreviousFrame ?? 16.6) / 1000;
    if (dt > PHYSICS.MAX_FRAME_DT) dt = PHYSICS.MAX_FRAME_DT;

    let remaining = dt;
    let steps = 0;
    let hit = false;
    let hitStrength = 0;
    let fell = null;

    while (remaining > 1e-5 && steps < PHYSICS.MAX_SUBSTEPS) {
      const step = remaining < PHYSICS.SUBSTEP ? remaining : PHYSICS.SUBSTEP;
      integrateBody(w.a, step, tuning);
      integrateBody(w.b, step, tuning);
      if (sim) {
        const hitInfo = resolveCollision(w.a, w.b, tuning);
        if (hitInfo) {
          hit = true;
          if (hitInfo.j > 0) {
            // Normalize against a full-power launch so the pop/spark/shake
            // scale sensibly regardless of device size or pen mass.
            const strength = Math.min(1, hitInfo.j / (tuning.maxLaunchSpeed * 0.9));
            hitStrength = Math.max(hitStrength, strength);
            w.a.hitFlash = Math.max(w.a.hitFlash, strength);
            w.b.hitFlash = Math.max(w.b.hitFlash, strength);
            w.sparkX = hitInfo.cx;
            w.sparkY = hitInfo.cy;
            w.sparkLife = 1;
            w.sparkStrength = strength;
          }
        }
        if (isOffTable(w.a, table)) {
          fell = 'a';
          break;
        }
        if (isOffTable(w.b, table)) {
          fell = 'b';
          break;
        }
      }
      remaining -= step;
      steps += 1;
    }

    // Decay the spark burst once per frame (not per substep).
    if (w.sparkLife > 0) {
      w.sparkLife -= dt * PHYSICS.SPARK_DECAY_PER_SEC;
      if (w.sparkLife < 0) w.sparkLife = 0;
    }

    if (hit) runOnJS(onHit)(hitStrength);

    // A pen just crossed an edge → let it visibly keep sliding off for a beat
    // (FALLING) so the player clearly sees it leave the desk, THEN declare it.
    if (sim && fell) {
      w.status = WORLD_STATUS.FALLING;
      w.faller = fell;
      w.fallFrames = 0;
      world.value = { ...w };
      return;
    }

    if (falling) {
      w.fallFrames = (w.fallFrames || 0) + 1;
      if (w.fallFrames >= FALL_FRAMES) {
        const f = w.faller;
        w[f].alive = false;
        w.winner = f === 'a' ? 'b' : 'a';
        w.status = WORLD_STATUS.GAMEOVER;
        world.value = { ...w };
        runOnJS(onGameOver)(w.winner);
        return;
      }
      world.value = { ...w };
      return;
    }

    const settled = isSettled(w.a, tuning.settleSpeed) && isSettled(w.b, tuning.settleSpeed);
    w.settle = settled ? w.settle + 1 : 0;

    if (w.settle >= PHYSICS.SETTLE_FRAMES) {
      w.status = WORLD_STATUS.SETTLED;
      world.value = { ...w };
      runOnJS(onSettle)();
      return;
    }

    world.value = { ...w };
  }, true);

  const pan = useFlickGesture(world, table, onLaunch, aimEnabled);

  return (
    <GestureDetector gesture={pan}>
      <Canvas style={styles.canvas}>
        <Table table={table} theme={theme} deskImg={deskImg} />
        <Pen
          world={world}
          bodyKey="a"
          skin={skinA}
          penScale={table.penScale}
          isCurrent={currentKey === 'a'}
          image={penImgA}
        />
        <Pen
          world={world}
          bodyKey="b"
          skin={skinB}
          penScale={table.penScale}
          isCurrent={currentKey === 'b'}
          image={penImgB}
        />
        <AimIndicator world={world} table={table} theme={theme} />
        <SparkFX world={world} />
      </Canvas>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1 },
});
