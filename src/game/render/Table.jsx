import React from 'react';
import { Group, RoundedRect, Line, vec } from '@shopify/react-native-skia';

/**
 * The play surface: a worn wooden school desk (top-down), echoing penfight.xyz.
 * Warm oak with vertical grain, a raised edge, a chalk centre line and a couple
 * of faint carved scratches.
 */
export function Table({ table, theme }) {
  const { x, y, w, h, cx, cy } = table;
  const r = 18;

  // Evenly spaced vertical grain lines.
  const grain = [];
  const cols = 7;
  for (let i = 1; i < cols; i++) {
    const gx = x + (w * i) / cols + ((i % 2) - 0.5) * 6;
    grain.push(gx);
  }

  return (
    <Group>
      {/* desk edge */}
      <RoundedRect x={x - 7} y={y - 7} width={w + 14} height={h + 14} r={r + 6} color={theme.colors.woodEdge} />
      {/* desk top */}
      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={theme.colors.wood} />

      {/* wood grain */}
      {grain.map((gx, i) => (
        <Line
          key={i}
          p1={vec(gx, y + 10)}
          p2={vec(gx, y + h - 10)}
          color={theme.colors.woodGrain}
          style="stroke"
          strokeWidth={2}
          opacity={0.5}
        />
      ))}

      {/* faint carved scratches */}
      <Line p1={vec(x + w * 0.2, y + h * 0.32)} p2={vec(x + w * 0.34, y + h * 0.28)} color={theme.colors.woodMark} style="stroke" strokeWidth={2} opacity={0.4} />
      <Line p1={vec(x + w * 0.7, y + h * 0.66)} p2={vec(x + w * 0.82, y + h * 0.7)} color={theme.colors.woodMark} style="stroke" strokeWidth={2} opacity={0.35} />

      {/* chalk centre line */}
      <Line
        p1={vec(x + 20, cy)}
        p2={vec(x + w - 20, cy)}
        color={theme.colors.chalk}
        style="stroke"
        strokeWidth={2}
        opacity={0.5}
      />
    </Group>
  );
}
