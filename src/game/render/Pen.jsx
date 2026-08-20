import React from 'react';
import { Group, RoundedRect, Circle, Shadow } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

/**
 * Renders a realistic pen driven by its physics body in the shared `world`.
 * Built from stacked Skia shapes (barrel, cap, metal clip + trim ring, grip
 * cone, nib, gloss highlight). Geometry is centred on the origin so rotation
 * pivots about the pen's middle, then the group is translated/rotated each frame.
 *
 * Skin colours: body, cap, tip (nib) required; grip + trim optional (sensible
 * fallbacks) so older skins still render.
 */
export function Pen({ world, bodyKey, skin, penScale, isCurrent }) {
  const length = skin.length * penScale;
  const width = skin.radius * penScale * 0.82; // slim barrel
  const halfL = length / 2;
  const halfW = width / 2;

  const capLen = length * 0.22;
  const gripLen = length * 0.2;
  const grip = skin.grip || skin.tip;
  const trim = skin.trim || '#D7DAE1'; // metal clip / ring
  const gloss = 'rgba(255,255,255,0.28)';

  const transform = useDerivedValue(() => {
    const b = world.value[bodyKey];
    return [{ translateX: b.x }, { translateY: b.y }, { rotate: b.angle }];
  });

  const opacity = useDerivedValue(() => (world.value[bodyKey].alive ? 1 : 0.25));

  return (
    <Group transform={transform} opacity={opacity}>
      {/* current-player highlight ring */}
      {isCurrent && (
        <Circle cx={0} cy={0} r={halfL + halfW * 1.5} color={skin.cap} opacity={0.22} />
      )}

      {/* barrel + soft cast shadow on the desk */}
      <RoundedRect x={-halfW} y={-halfL} width={width} height={length} r={halfW} color={skin.body}>
        <Shadow dx={0} dy={3} blur={6} color="rgba(0,0,0,0.35)" />
      </RoundedRect>

      {/* grip cone near the writing tip */}
      <RoundedRect
        x={-halfW * 0.9}
        y={halfL - gripLen}
        width={width * 0.9}
        height={gripLen}
        r={halfW * 0.55}
        color={grip}
      />

      {/* metal nib + ink point */}
      <Circle cx={0} cy={halfL - halfW * 0.25} r={halfW * 0.55} color={trim} />
      <Circle cx={0} cy={halfL - halfW * 0.05} r={halfW * 0.22} color={skin.tip} />

      {/* cap */}
      <RoundedRect x={-halfW} y={-halfL} width={width} height={capLen} r={halfW} color={skin.cap} />
      {/* trim ring between cap and barrel */}
      <RoundedRect
        x={-halfW}
        y={-halfL + capLen - halfW * 0.16}
        width={width}
        height={Math.max(2, halfW * 0.32)}
        r={1}
        color={trim}
      />
      {/* clip down the side of the cap */}
      <RoundedRect
        x={halfW * 0.12}
        y={-halfL + capLen * 0.12}
        width={halfW * 0.55}
        height={capLen * 1.1}
        r={halfW * 0.28}
        color={trim}
      />

      {/* glossy highlight stripe */}
      <RoundedRect
        x={-halfW * 0.58}
        y={-halfL + capLen + 2}
        width={width * 0.22}
        height={length * 0.46}
        r={halfW * 0.2}
        color={gloss}
      />
    </Group>
  );
}
