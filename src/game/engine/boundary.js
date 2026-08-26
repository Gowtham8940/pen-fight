/**
 * Off-table detection. A pen is "off" once its CENTRE crosses ANY edge by a
 * small margin (all four sides are open — nothing bounces). Worklet.
 */
import { PHYSICS } from './constants';

export function isOffTable(body, table) {
  'worklet';
  const m = body.radius * PHYSICS.OFF_MARGIN;
  return (
    body.x < table.x - m ||
    body.x > table.x + table.w + m ||
    body.y < table.y - m ||
    body.y > table.y + table.h + m
  );
}
