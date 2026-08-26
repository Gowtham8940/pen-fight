/**
 * Pan gesture that grabs the current player's pen at one of THREE handles — its
 * centre or either end — and flicks it slingshot style: pull the grabbed handle
 * back, release to launch. The pull direction/angle sets the travel direction;
 * grabbing an END (off-centre) also imparts spin, so you can curve/tumble shots.
 *
 * Runs on the UI thread (worklets); reads/writes the shared `world`.
 */
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { WORLD_STATUS } from '../engine/constants';
import { len, normalize, clamp } from '../engine/vec2';

export function useFlickGesture(world, table, onLaunch, enabled = true) {
  const tuning = table.tuning;

  return Gesture.Pan()
    .enabled(enabled)
    .onBegin(e => {
      'worklet';
      const w = world.value;
      if (w.status !== WORLD_STATUS.AIMING) return;
      const b = w[w.current];
      if (!b.alive) return;

      // The pen's long axis (unit) and its three grab handles.
      const axX = -Math.sin(b.angle);
      const axY = Math.cos(b.angle);
      const half = b.half || 0;
      // handles: center, end +, end -
      const hx0 = b.x;
      const hy0 = b.y;
      const hx1 = b.x + axX * half;
      const hy1 = b.y + axY * half;
      const hx2 = b.x - axX * half;
      const hy2 = b.y - axY * half;

      const d0 = len(e.x - hx0, e.y - hy0);
      const d1 = len(e.x - hx1, e.y - hy1);
      const d2 = len(e.x - hx2, e.y - hy2);

      let gx = hx0;
      let gy = hy0;
      let best = d0;
      if (d1 < best) {
        best = d1;
        gx = hx1;
        gy = hy1;
      }
      if (d2 < best) {
        best = d2;
        gx = hx2;
        gy = hy2;
      }
      if (best > tuning.grabRadius) return; // didn't grab any handle

      w.aiming = true;
      w.grabX = gx;
      w.grabY = gy;
      w.grabOffX = gx - b.x;
      w.grabOffY = gy - b.y;
      w.aimX = e.x;
      w.aimY = e.y;
      world.value = { ...w };
    })
    .onUpdate(e => {
      'worklet';
      const w = world.value;
      if (!w.aiming) return;
      w.aimX = e.x;
      w.aimY = e.y;
      world.value = { ...w };
    })
    .onEnd(() => {
      'worklet';
      const w = world.value;
      if (!w.aiming) return;
      const b = w[w.current];
      // Pull vector = from finger back to the grabbed handle -> launch heads
      // that way (slingshot).
      const pullX = w.grabX - w.aimX;
      const pullY = w.grabY - w.aimY;
      const pull = len(pullX, pullY);

      w.aiming = false;

      if (pull >= tuning.minDrag) {
        const power = clamp(pull / tuning.maxDrag, 0, 1);
        const [dx, dy] = normalize(pullX, pullY);
        const speed = power * tuning.maxLaunchSpeed;
        b.vx = dx * speed;
        b.vy = dy * speed;

        // Spin from an off-centre grab: cross(grabOffset, launchDir), scaled by
        // how far out the grab was (0 at centre, 1 at a tip).
        const half = b.half || 1;
        const offFrac = clamp(len(w.grabOffX, w.grabOffY) / half, 0, 1);
        const cross = (w.grabOffX * dy - w.grabOffY * dx) / half;
        b.omega = cross * offFrac * power * tuning.launchSpin;

        w.status = WORLD_STATUS.SIMULATING;
        w.settle = 0;
        world.value = { ...w };
        runOnJS(onLaunch)(power);
      } else {
        world.value = { ...w };
      }
    })
    .onFinalize(() => {
      'worklet';
      const w = world.value;
      if (w.aiming) {
        w.aiming = false;
        world.value = { ...w };
      }
    });
}
