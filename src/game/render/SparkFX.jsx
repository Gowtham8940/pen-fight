import React from 'react';
import { Group, Circle, Path } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

const RAYS = 6;
const ANGLES = Array.from({ length: RAYS }, (_, i) => (i / RAYS) * Math.PI * 2);

/**
 * A short-lived spark burst at the pen-vs-pen contact point: a bright core
 * that fades fast plus a few radiating dashes (rendered as one path — no
 * hooks-in-a-loop). Purely visual — driven by `world.sparkX/sparkY/sparkLife/
 * sparkStrength`, which the physics loop sets on a real hit and decays every
 * frame. Fades to nothing once life hits 0.
 */
export function SparkFX({ world }) {
  const center = useDerivedValue(() => ({ x: world.value.sparkX, y: world.value.sparkY }));
  const opacity = useDerivedValue(() => world.value.sparkLife);
  const coreR = useDerivedValue(() => 4 + (1 - world.value.sparkLife) * 10 * world.value.sparkStrength);

  // All rays as one path string: "M x0 y0 L x1 y1 M ... " — one moveto+lineto
  // per ray, concatenated, so a single <Path> draws the whole starburst.
  const rayPath = useDerivedValue(() => {
    const { sparkX, sparkY, sparkLife, sparkStrength } = world.value;
    const r0 = 6 + sparkStrength * 4;
    const r1 = r0 + (1 - sparkLife) * (14 + sparkStrength * 16);
    let d = '';
    for (let i = 0; i < RAYS; i++) {
      const a = ANGLES[i];
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      d += `M ${sparkX + ca * r0} ${sparkY + sa * r0} L ${sparkX + ca * r1} ${sparkY + sa * r1} `;
    }
    return d;
  });

  return (
    <Group opacity={opacity}>
      <Circle c={center} r={coreR} color="#FFF3B0" />
      <Path path={rayPath} style="stroke" strokeWidth={3} strokeCap="round" color="#FFE066" />
    </Group>
  );
}
