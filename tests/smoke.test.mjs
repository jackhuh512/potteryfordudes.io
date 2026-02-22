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
