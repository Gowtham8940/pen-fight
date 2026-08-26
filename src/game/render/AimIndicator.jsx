import React from 'react';
import { Group, Line, Circle, DashPathEffect } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { normalize, len, clamp } from '../engine/vec2';

/**
 * Slingshot aim overlay: a plain dashed line from the grabbed handle to your
 * finger — the pulling side only. No arrowhead, nothing drawn on the
 * launch/target side.
 */
export function AimIndicator({ world, table, theme }) {
  const tuning = table.tuning;

  const opacity = useDerivedValue(() => (world.value.aiming ? 1 : 0));
  const grabPt = useDerivedValue(() => ({ x: world.value.grabX, y: world.value.grabY }));

  // Line end sits at the finger, clamped to the same max-drag distance used
  // for power, so it never overshoots what actually affects the shot.
  const tipPt = useDerivedValue(() => {
    const gx = world.value.grabX;
    const gy = world.value.grabY;
    const pull = len(world.value.aimX - gx, world.value.aimY - gy);
    const [dx, dy] = normalize(world.value.aimX - gx, world.value.aimY - gy);
    const d = Math.min(pull, tuning.maxDrag);
    return { x: gx + dx * d, y: gy + dy * d };
  });

  const powerColor = useDerivedValue(() => {
    const gx = world.value.grabX;
    const gy = world.value.grabY;
    const power = clamp(len(world.value.aimX - gx, world.value.aimY - gy) / tuning.maxDrag, 0, 1);
    return power > 0.7 ? theme.colors.red : theme.colors.chalk;
  });

  return (
    <Group opacity={opacity}>
      {/* dashed pull line: grab handle -> finger, nothing beyond it */}
      <Line p1={grabPt} p2={tipPt} color={powerColor} style="stroke" strokeWidth={5} strokeCap="round">
        <DashPathEffect intervals={[16, 12]} />
      </Line>
      {/* grab handle dot */}
      <Circle c={grabPt} r={7} color={theme.colors.accent} />
    </Group>
  );
}
