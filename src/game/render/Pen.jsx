import React from 'react';
import { Group, RoundedRect, Circle, Shadow } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

/**
 * Renders a pen as a capsule driven by its physics body in the shared `world`.
 * Geometry is centered on the origin so rotation pivots about the pen's middle,
 * then the group is translated/rotated from the body's transform each frame.
 */
export function Pen({ world, bodyKey, skin, penScale, isCurrent }) {
  const length = skin.length * penScale;
  const width = skin.radius * penScale * 0.9; // slimmer than the collider
  const halfL = length / 2;
  const halfW = width / 2;

  const transform = useDerivedValue(() => {
    const b = world.value[bodyKey];
    return [{ translateX: b.x }, { translateY: b.y }, { rotate: b.angle }];
  });

  const opacity = useDerivedValue(() => (world.value[bodyKey].alive ? 1 : 0.25));

  return (
    <Group transform={transform} opacity={opacity}>
      {/* current-player highlight ring */}
      {isCurrent && (
        <Circle cx={0} cy={0} r={halfL + halfW * 1.4} color={skin.cap} opacity={0.28} />
      )}

      {/* barrel */}
      <RoundedRect x={-halfW} y={-halfL} width={width} height={length} r={halfW} color={skin.body}>
        <Shadow dx={0} dy={2} blur={5} color="rgba(0,0,0,0.35)" />
      </RoundedRect>

      {/* cap band (top) */}
      <RoundedRect
        x={-halfW}
        y={-halfL}
        width={width}
        height={length * 0.22}
        r={halfW}
        color={skin.cap}
      />

      {/* nib / tip (bottom) */}
      <Circle cx={0} cy={halfL - halfW * 0.4} r={halfW * 0.7} color={skin.tip} />
    </Group>
  );
}
