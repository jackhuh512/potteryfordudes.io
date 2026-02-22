import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

test('index wires canvas and script entry point', () => {
  assert.match(index, /<canvas id="gameMap"/);
  assert.match(index, /<script src="script\.js"><\/script>/);
});

test('script contains key game flow hooks', () => {
  assert.match(script, /function startNewGame\(/);
  assert.match(script, /function gameLoop\(/);
  assert.match(script, /requestAnimationFrame\(gameLoop\)/);
});
