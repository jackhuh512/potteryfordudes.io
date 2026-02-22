// @ts-check

import { difficultyMultipliers } from './state.js';

/** @typedef {import('./types.d.ts').Difficulty} Difficulty */
/** @typedef {import('./types.d.ts').GameState} GameState */
/** @typedef {import('./types.d.ts').LevelConfig} LevelConfig */
/** @typedef {import('./types.d.ts').TileType} TileType */

/**
 * @param {GameState} state
 * @param {Difficulty} nextDifficulty
 * @returns {boolean}
 */
export function setDifficulty(state, nextDifficulty) {
  if (!difficultyMultipliers[nextDifficulty]) {
    return false;
  }

  state.difficulty = nextDifficulty;
  return true;
}

/**
 * @param {GameState} state
 * @param {LevelConfig} config
 */
export function resetStateForLevel(state, config) {
  state.goal = config.goal;
  state.pottery = state.goal + 5;
  state.sales = 0;
  state.boatEquipped = false;
  state.player.x = 3;
  state.player.y = 3;
  state.player.moveCooldownMs = 0;
  state.lastFrameTimeMs = null;
  state.player.facing = { x: 0, y: 1 };
  state.player.isDying = false;
  state.player.deathFrame = 0;
  state.gameOverTimer = 0;

  state.map = createBaseMap(state.mapWidth, state.mapHeight);
  applyWaterRects(state.map, config.waterRects, state.mapWidth, state.mapHeight);

  state.dudes = config.dudes.map((/** @type {LevelConfig['dudes'][number]} */ dude) => ({ ...dude, bought: false }));
  state.irsAgents = (config.irsSpawns || []).map((/** @type {NonNullable<LevelConfig['irsSpawns']>[number]} */ spawn) => ({
    ...spawn,
    progress: 0,
  }));

  state.keys.clear();
}

/**
 * @param {number} mapWidth
 * @param {number} mapHeight
 * @returns {TileType[][]}
 */
export function createBaseMap(mapWidth, mapHeight) {
  return Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) => {
      if (x < 1 || y < 1 || x > mapWidth - 2 || y > mapHeight - 2) {
        return 'wall';
      }

      if ((x > 2 && x < 8 && y > 7 && y < 11) || (x > 15 && y > 2 && y < 5)) {
        return 'path';
      }

      return 'grass';
    }),
  );
}

/**
 * @param {TileType[][]} map
 * @param {LevelConfig['waterRects']} waterRects
 * @param {number} mapWidth
 * @param {number} mapHeight
 */
export function applyWaterRects(map, waterRects, mapWidth, mapHeight) {
  waterRects.forEach((/** @type {LevelConfig['waterRects'][number]} */ rect) => {
    for (let y = rect.y1; y <= rect.y2; y += 1) {
      for (let x = rect.x1; x <= rect.x2; x += 1) {
        if (x > 0 && y > 0 && x < mapWidth - 1 && y < mapHeight - 1) {
          map[y][x] = 'water';
        }
      }
    }
  });
}
