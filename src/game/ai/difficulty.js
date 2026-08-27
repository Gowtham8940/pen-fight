/**
 * Computer-opponent difficulty presets.
 *
 * The AI plays by the SAME rules and physics as a human — it just injects a
 * velocity into its pen like a flick would. Difficulty only changes how well
 * it aims and how hard it hits:
 *
 *   aimError   max aim wobble in RADIANS (± half this). Bigger = sloppier.
 *   minPower   \ launch speed as a fraction of a full-power flick; a random
 *   maxPower   / value in this range is picked per shot.
 *   edgeAware  if true, the AI biases its aim toward pushing the opponent
 *              toward the NEAREST table edge instead of just straight at it.
 *   thinkMs    "thinking" pause before it shoots (pure feel, not skill).
 */
export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    aimError: 0.34,
    minPower: 0.45,
    maxPower: 0.7,
    edgeAware: false,
    thinkMs: 1100,
  },
  medium: {
    id: 'medium',
    aimError: 0.18,
    minPower: 0.6,
    maxPower: 0.85,
    edgeAware: false,
    thinkMs: 900,
  },
  hard: {
    id: 'hard',
    aimError: 0.07,
    minPower: 0.75,
    maxPower: 1.0,
    edgeAware: true,
    thinkMs: 650,
  },
};

export const DEFAULT_DIFFICULTY = 'medium';

export function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES[DEFAULT_DIFFICULTY];
}
