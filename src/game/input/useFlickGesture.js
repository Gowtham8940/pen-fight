/**
 * Pan gesture that grabs the current player's pen and flicks it, slingshot
 * style: drag away from the pen to pull back, release to launch it in the
 * opposite direction with power proportional to the pull distance.
 *
 * Runs entirely on the UI thread (gesture callbacks are worklets); it reads and
 * writes the shared `world`. `onLaunch(powerFraction)` bridges to JS for sound
 * and the SIMULATING status flip.
 */
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { WORLD_STATUS } from '../engine/constants';
import { dist, len, normalize, clamp } from '../engine/vec2';

export function useFlickGesture(world, table, onLaunch) {
  const tuning = table.tuning;

  return Gesture.Pan()
    .onBegin(e => {
      'worklet';
      const w = world.value;
      if (w.status !== WORLD_STATUS.AIMING) return;
      const b = w[w.current];
      if (!b.alive) return;
      // Must start the drag near the current pen to grab it.
      if (dist(e.x, e.y, b.x, b.y) > tuning.grabRadius) return;
      w.aiming = true;
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
      const pullX = b.x - w.aimX;
      const pullY = b.y - w.aimY;
      const pull = len(pullX, pullY);

      w.aiming = false;

      if (pull >= tuning.minDrag) {
        const power = clamp(pull / tuning.maxDrag, 0, 1);
        const [dx, dy] = normalize(pullX, pullY);
        const speed = power * tuning.maxLaunchSpeed;
        b.vx = dx * speed;
        b.vy = dy * speed;
        b.omega = 0;
        w.status = WORLD_STATUS.SIMULATING;
        w.settle = 0;
        world.value = { ...w };
        runOnJS(onLaunch)(power);
      } else {
        // Too short — treat as a cancelled aim.
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
