/**
 * Turn state machine definitions for the React/discrete layer.
 *
 *   IDLE ─start→ AIMING(player)
 *   AIMING ─release→ SIMULATING
 *   SIMULATING ─settle, no pen off→ AIMING(other player)
 *   SIMULATING ─pen off table→ GAMEOVER(winner = owner of surviving pen)
 *   GAMEOVER ─rematch→ AIMING(player1)
 *
 * The live physics `world` (Reanimated shared value) mirrors these statuses on
 * the UI thread; this module keeps the discrete rules readable and testable.
 */
export const GAME_STATUS = {
  IDLE: 'IDLE',
  AIMING: 'AIMING',
  SIMULATING: 'SIMULATING',
  GAMEOVER: 'GAMEOVER',
};

export const other = player => (player === 'a' ? 'b' : 'a');
