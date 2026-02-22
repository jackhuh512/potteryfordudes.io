// @ts-check

/** @typedef {import('./types.d.ts').Difficulty} Difficulty */
/** @typedef {import('./types.d.ts').GameState} GameState */

export const tileSize = 32;

/** @type {Record<Difficulty, number>} */
export const difficultyMultipliers = {
  easy: 0.25,
  medium: 0.5,
  hard: 1,
};

/**
 * @param {{ mapWidth: number; mapHeight: number }} dimensions
 * @returns {GameState}
 */
export function createInitialState({ mapWidth, mapHeight }) {
  return {
    mapWidth,
    mapHeight,
    pottery: 10,
    sales: 0,
    hasBoat: true,
    boatEquipped: false,
    goal: 4,
    currentLevel: 1,
    gameRunning: false,
    animationFrameId: null,
    awaitingReplay: false,
    musicEnabled: true,
    gameOverTimer: 0,
    difficulty: 'easy',
    hasStartedGame: false,
    lastFrameTimeMs: null,
    map: [],
    dudes: [],
    irsAgents: [],
    keys: new Set(),
    player: {
      x: 3,
      y: 3,
      moveCooldownMs: 0,
      facing: { x: 0, y: 1 },
      isDying: false,
      deathFrame: 0,
    },
  };
}
