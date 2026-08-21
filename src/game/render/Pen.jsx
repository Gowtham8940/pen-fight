import React from 'react';
import { Group, RoundedRect, Circle, Shadow, Image } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

/**
 * Renders a pen driven by its physics body in the shared `world`.
 *
 * `image` (a preloaded SkImage, or null) is passed in by the parent so all
 * sprites are loaded + gated before the canvas mounts (no fallback flash).
 * If present it's drawn as a Skia <Image>; otherwise a hand-drawn vector pen
 * (barrel, cap, metal clip + trim ring, grip, nib, gloss). Geometry is centred
 * on the origin so rotation pivots about the pen's middle.
 *
 * Sprite convention: a top-down pen standing VERTICAL, tip pointing DOWN,
 * transparent background, centred in its canvas.
 */
export function Pen({ world, bodyKey, skin, penScale, isCurrent, image }) {
  const length = skin.length * penScale;
  const width = skin.radius * penScale * 0.82;
  const halfL = length / 2;
  const halfW = width / 2;

  const penImg = image;

  const transform = useDerivedValue(() => {
    const b = world.value[bodyKey];
    return [{ translateX: b.x }, { translateY: b.y }, { rotate: b.angle }];
  });
  const opacity = useDerivedValue(() => (world.value[bodyKey].alive ? 1 : 0.25));

  // Realistic sprite path.
  if (penImg) {
    const aspect = penImg.width() / penImg.height();
    const imgW = length * aspect;
    return (
      <Group transform={transform} opacity={opacity}>
        {isCurrent && (
          <Circle cx={0} cy={0} r={halfL + halfW * 1.6} color={skin.cap} opacity={0.22} />
        )}
        <Image image={penImg} x={-imgW / 2} y={-halfL} width={imgW} height={length} fit="contain">
          <Shadow dx={0} dy={3} blur={6} color="rgba(0,0,0,0.35)" />
        </Image>
      </Group>
    );
  }

  // Vector fallback.
  const capLen = length * 0.22;
  const gripLen = length * 0.2;
  const grip = skin.grip || skin.tip;
  const trim = skin.trim || '#D7DAE1';
  const gloss = 'rgba(255,255,255,0.28)';

  return (
    <Group transform={transform} opacity={opacity}>
      {isCurrent && (
        <Circle cx={0} cy={0} r={halfL + halfW * 1.5} color={skin.cap} opacity={0.22} />
      )}
      <RoundedRect x={-halfW} y={-halfL} width={width} height={length} r={halfW} color={skin.body}>
        <Shadow dx={0} dy={3} blur={6} color="rgba(0,0,0,0.35)" />
      </RoundedRect>
      <RoundedRect
        x={-halfW * 0.9}
        y={halfL - gripLen}
        width={width * 0.9}
        height={gripLen}
        r={halfW * 0.55}
        color={grip}
      />
      <Circle cx={0} cy={halfL - halfW * 0.25} r={halfW * 0.55} color={trim} />
      <Circle cx={0} cy={halfL - halfW * 0.05} r={halfW * 0.22} color={skin.tip} />
      <RoundedRect x={-halfW} y={-halfL} width={width} height={capLen} r={halfW} color={skin.cap} />
      <RoundedRect
        x={-halfW}
        y={-halfL + capLen - halfW * 0.16}
        width={width}
        height={Math.max(2, halfW * 0.32)}
        r={1}
        color={trim}
      />
      <RoundedRect
        x={halfW * 0.12}
        y={-halfL + capLen * 0.12}
        width={halfW * 0.55}
        height={capLen * 1.1}
        r={halfW * 0.28}
        color={trim}
      />
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
