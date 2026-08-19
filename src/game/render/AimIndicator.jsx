import React from 'react';
import { Group, Line, Circle } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { normalize, len, clamp } from '../engine/vec2';

/**
 * Slingshot aim overlay shown while the current player drags their pen.
 * - a muted line follows the finger (the "pull")
 * - a bright line + dot projects the launch direction, its length scaling
 *   with power (0..1 of max drag)
 */
export function AimIndicator({ world, table, theme }) {
  const tuning = table.tuning;
  const previewMax = table.h * 0.34;

  const opacity = useDerivedValue(() => (world.value.aiming ? 1 : 0));

  const penPt = useDerivedValue(() => {
    const b = world.value[world.value.current];
    return { x: b.x, y: b.y };
  });

  const fingerPt = useDerivedValue(() => ({ x: world.value.aimX, y: world.value.aimY }));

  const launchPt = useDerivedValue(() => {
    const b = world.value[world.value.current];
    const pullX = b.x - world.value.aimX;
    const pullY = b.y - world.value.aimY;
    const [dx, dy] = normalize(pullX, pullY);
    const power = clamp(len(pullX, pullY) / tuning.maxDrag, 0, 1);
    const l = power * previewMax;
    return { x: b.x + dx * l, y: b.y + dy * l };
  });

  return (
    <Group opacity={opacity}>
      <Line p1={penPt} p2={fingerPt} color={theme.colors.textMuted} style="stroke" strokeWidth={3} />
      <Line p1={penPt} p2={launchPt} color={theme.colors.accent} style="stroke" strokeWidth={6} strokeCap="round" />
      <Circle c={launchPt} r={9} color={theme.colors.accent} />
    </Group>
  );
}
