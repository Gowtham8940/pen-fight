import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { useFrameCallback, runOnJS } from 'react-native-reanimated';
import { PHYSICS, WORLD_STATUS } from '../engine/constants';
import { integrateBody, isSettled } from '../engine/physics';
import { resolveCollision } from '../engine/collision';
import { isOffTable } from '../engine/boundary';
import { useFlickGesture } from '../input/useFlickGesture';
import { Table } from './Table';
import { Pen } from './Pen';
import { AimIndicator } from './AimIndicator';

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
  onLaunch,
  onHit,
  onSettle,
  onGameOver,
}) {
  const tuning = table.tuning;

  useFrameCallback(info => {
    'worklet';
    const w = world.value;
    if (w.status !== WORLD_STATUS.SIMULATING) return;

    let dt = (info.timeSincePreviousFrame ?? 16.6) / 1000;
    if (dt > PHYSICS.MAX_FRAME_DT) dt = PHYSICS.MAX_FRAME_DT;

    let remaining = dt;
    let steps = 0;
    let hit = false;
    let fell = null;

    while (remaining > 1e-5 && steps < PHYSICS.MAX_SUBSTEPS) {
      const step = remaining < PHYSICS.SUBSTEP ? remaining : PHYSICS.SUBSTEP;
      integrateBody(w.a, step, tuning);
      integrateBody(w.b, step, tuning);
      if (resolveCollision(w.a, w.b, tuning)) hit = true;
      if (isOffTable(w.a, table)) {
        fell = 'a';
        break;
      }
      if (isOffTable(w.b, table)) {
        fell = 'b';
        break;
      }
      remaining -= step;
      steps += 1;
    }

    if (hit) runOnJS(onHit)();

    if (fell) {
      w[fell].alive = false;
      w.winner = fell === 'a' ? 'b' : 'a';
      w.status = WORLD_STATUS.GAMEOVER;
      world.value = { ...w };
      runOnJS(onGameOver)(w.winner);
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

  const pan = useFlickGesture(world, table, onLaunch);

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
      </Canvas>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1 },
});
