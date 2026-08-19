import React from 'react';
import { Group, RoundedRect, Line, vec } from '@shopify/react-native-skia';

/**
 * The play surface: a felt table with a raised edge and a subtle centre line.
 * Purely presentational — positions come from the computed table rect.
 */
export function Table({ table, theme }) {
  const { x, y, w, h, cx, cy } = table;
  const r = 22;

  return (
    <Group>
      {/* raised edge */}
      <RoundedRect x={x - 6} y={y - 6} width={w + 12} height={h + 12} r={r + 6} color={theme.colors.tableEdge} />
      {/* felt */}
      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={theme.colors.table} />
      {/* centre line */}
      <Line
        p1={vec(x + 18, cy)}
        p2={vec(x + w - 18, cy)}
        color={theme.colors.tableFelt}
        style="stroke"
        strokeWidth={2}
      />
    </Group>
  );
}
