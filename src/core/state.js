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
  const defaultSeed = 1337;

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
    debug: {
      enabled: false,
      showOverlay: false,
      showHitboxes: false,
      deterministic: false,
      seed: defaultSeed,
      frameCount: 0,
      fps: 0,
      fpsAccumulatorMs: 0,
      fpsSampleFrames: 0,
    },
    telemetry: {
      sales: 0,
      steps: 0,
      boatToggles: 0,
      levelStartTimeMs: 0,
      levelDurationMs: 0,
      reportCooldownMs: 10000,
      events: [],
    },
  };
}
