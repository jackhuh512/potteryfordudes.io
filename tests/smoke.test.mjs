import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

test('index wires canvas and script entry point', () => {
  assert.match(index, /<canvas id="gameMap"/);
  assert.match(index, /<script src="script\.js"><\/script>/);
});

test('index includes essential control and menu elements used by script.js', () => {
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
    'difficultySelect'
  ]) {
    assert.match(index, new RegExp(`id="${id}"`));
  }
});

test('script contains key game flow hooks', () => {
  assert.match(script, /function startNewGame\(/);
  assert.match(script, /function gameLoop\(/);
  assert.match(script, /requestAnimationFrame\(gameLoop\)/);
});

test('script includes keyboard and button controls for core actions', () => {
  assert.match(script, /window\.addEventListener\("keydown"/);
  assert.match(script, /toggleMusicBtn\.addEventListener\("click"/);
  assert.match(script, /newGameBtn\.addEventListener\("click"/);
});
