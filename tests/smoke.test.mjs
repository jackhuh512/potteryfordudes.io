import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');
const gameLoopModule = fs.readFileSync('src/core/gameLoop.js', 'utf8');

test('index wires canvas and module entry point', () => {
  assert.match(index, /<canvas id="gameMap"/);
  assert.match(index, /<script type="module" src="script\.js"><\/script>/);
});

test('index includes essential control and menu elements', () => {
  for (const id of [
    'inventory',
    'sales',
    'level',
    'boatStatus',
    'message',
    'startMenu',
    'menuTitle',
    'menuCopy',
    'newGameBtn',
    'toggleMusicBtn',
    'nextBgmBtn',
    'difficultySelect',
    'debugStatus',
    'telemetryStatus',
  ]) {
    assert.match(index, new RegExp(`id="${id}"`));
  }
});

test('entry script bootstraps modular game loop', () => {
  assert.match(script, /createGame/);
  assert.match(script, /game\.init\(\)/);
  assert.match(gameLoopModule, /function gameLoop\(/);
  assert.match(gameLoopModule, /requestAnimationFrame\(gameLoop\)/);
});

import { createInitialState } from '../src/core/state.js';
import { resetStateForLevel, setDifficulty } from '../src/core/transitions.js';
import { levelConfigs } from '../src/content/levels.js';

test('state transitions module owns level reset and difficulty transitions', () => {
  const state = createInitialState({ mapWidth: 20, mapHeight: 14 });

  assert.equal(setDifficulty(state, 'medium'), true);
  assert.equal(state.difficulty, 'medium');

  resetStateForLevel(state, levelConfigs[2]);

  assert.equal(state.goal, levelConfigs[2].goal);
  assert.equal(state.dudes.length, levelConfigs[2].dudes.length);
  assert.equal(state.irsAgents.length, levelConfigs[2].irsSpawns.length);
  assert.equal(state.policeAgents.length, 0);
  assert.equal(state.bullets.length, 0);
  assert.equal(state.map[2][10], 'water');
});


test('each level goal matches number of dudes to sell to', () => {
  for (const config of Object.values(levelConfigs)) {
    assert.equal(config.goal, config.dudes.length);
  }
});


test('levels 4 and 5 include police spawns', () => {
  assert.equal(levelConfigs[4].policeSpawns.length, 1);
  assert.equal(levelConfigs[5].policeSpawns.length, 2);
});


test('index documents phase 4 debug controls', () => {
  assert.match(index, /Debug Overlay: F3/);
  assert.match(index, /Debug Hitboxes: H/);
});
