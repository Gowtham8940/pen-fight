/**
 * Off-table detection. A pen is "off" once its CENTER travels past the desk
 * edge by a margin (a fraction of its own radius), which stops pens that merely
 * graze the rim from instantly losing. Worklet.
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
