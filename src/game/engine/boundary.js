/**
 * Off-table detection. For Milestone 1 the table edge is the playable rect;
 * a pen is "off" once its CENTER crosses the edge. Worklet.
 */

export function isOffTable(body, table) {
  'worklet';
  return (
    body.x < table.x ||
    body.x > table.x + table.w ||
    body.y < table.y ||
    body.y > table.y + table.h
  );
}
