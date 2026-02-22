import { levelConfigs, maxLevel } from '../content/levels.js';
import { createInitialState, difficultyMultipliers, tileSize } from './state.js';
import { resetStateForLevel, setDifficulty as setStateDifficulty } from './transitions.js';
import { createRenderer } from '../systems/render.js';
import { createAudioSystem } from '../systems/audio.js';
import { bindInput } from '../systems/input.js';

export function createGame() {
  const elements = {
    canvas: document.getElementById('gameMap'),
    inventoryEl: document.getElementById('inventory'),
    salesEl: document.getElementById('sales'),
    levelEl: document.getElementById('level'),
    boatStatusEl: document.getElementById('boatStatus'),
    messageEl: document.getElementById('message'),
    startMenuEl: document.getElementById('startMenu'),
    menuTitleEl: document.getElementById('menuTitle'),
    menuCopyEl: document.getElementById('menuCopy'),
    newGameBtn: document.getElementById('newGameBtn'),
    fireworksEl: document.getElementById('fireworks'),
    toggleMusicBtn: document.getElementById('toggleMusicBtn'),
    nextBgmBtn: document.getElementById('nextBgmBtn'),
    difficultySelectEl: document.getElementById('difficultySelect'),
    difficultyPanelEl: document.getElementById('difficultyPanel'),
  };

  const ctx = elements.canvas.getContext('2d');
  const mapWidth = elements.canvas.width / tileSize;
  const mapHeight = elements.canvas.height / tileSize;
  const state = createInitialState({ mapWidth, mapHeight });

  function updateHud(text) {
    elements.inventoryEl.textContent = `Pottery left: ${state.pottery}`;
    elements.salesEl.textContent = `Sales made: ${state.sales} / ${state.goal}`;
    elements.levelEl.textContent = `Level: ${state.currentLevel} / ${maxLevel}`;
    elements.boatStatusEl.textContent = `Boat: ${
      state.hasBoat ? (state.boatEquipped ? 'Equipped' : 'Unequipped') : 'Not Owned'
    }`;
    if (text) {
      elements.messageEl.textContent = text;
    }
  }

  const renderer = createRenderer({ canvas: elements.canvas, ctx, tileSize, state });
  const audio = createAudioSystem({ state, updateHud });

  function getDifficultyMultiplier() {
    return difficultyMultipliers[state.difficulty] || difficultyMultipliers.hard;
  }

  function setDifficulty(nextDifficulty) {
    if (!setStateDifficulty(state, nextDifficulty)) {
      return;
    }

    if (elements.difficultySelectEl && elements.difficultySelectEl.value !== nextDifficulty) {
      elements.difficultySelectEl.value = nextDifficulty;
    }

    updateHud(`Difficulty set to ${state.difficulty}. IRS speed adjusted.`);
  }

  function getIrsSpeedRatio(level) {
    if (level < 2) {
      return 0;
    }

    const minRatio = 0.5;
    const maxRatio = 0.9;
    const t = (level - 2) / 3;
    return minRatio + (maxRatio - minRatio) * t;
  }


  function loadLevel(level) {
    const config = levelConfigs[level];
    resetStateForLevel(state, config);
    audio.resetTrackState();
    updateHud(`Level ${level}: Walk up to a dude and press E to sell pottery.`);
    renderer.render();
  }

  function openMenu({ title, copy, buttonText, celebration = false, showDifficulty = false }) {
    elements.menuTitleEl.textContent = title;
    elements.menuCopyEl.textContent = copy;
    elements.newGameBtn.textContent = buttonText;
    elements.fireworksEl.classList.toggle('hidden', !celebration);
    elements.startMenuEl.classList.toggle('celebration', celebration);
    if (elements.difficultyPanelEl) {
      elements.difficultyPanelEl.classList.toggle('hidden', !showDifficulty);
    }
    elements.startMenuEl.classList.remove('hidden');
  }

  function walkable(x, y) {
    if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
      return false;
    }

    const tile = state.map[y][x];
    if (tile === 'wall') {
      return false;
    }

    if (state.boatEquipped) {
      if (state.map[state.player.y][state.player.x] !== 'water') {
        return false;
      }
      return tile === 'water';
    }

    return tile !== 'water';
  }

  function toggleBoat() {
    if (!state.hasBoat) {
      updateHud('Isaac does not have a boat yet.');
      return;
    }

    const currentTile = state.map[state.player.y][state.player.x];
    const targetX = state.player.x + state.player.facing.x;
    const targetY = state.player.y + state.player.facing.y;

    if (targetX < 0 || targetY < 0 || targetX >= mapWidth || targetY >= mapHeight) {
      updateHud('No tile in front of Isaac for boat transition.');
      return;
    }

    const targetTile = state.map[targetY][targetX];
    if (targetTile === 'wall') {
      updateHud('A wall blocks boat transition.');
      return;
    }

    if (state.boatEquipped && currentTile !== 'water') {
      state.boatEquipped = false;
      updateHud('Boat unequipped because Isaac is on land.');
      if (state.gameRunning) {
        audio.startMusicLoop();
      }
      return;
    }

    if (!state.boatEquipped) {
      if (currentTile === 'water') {
        state.boatEquipped = true;
        updateHud('Boat equipped while Isaac is on water.');
        if (state.gameRunning) {
          audio.startMusicLoop();
        }
        return;
      }

      if (targetTile !== 'water') {
        updateHud('Face water and press B to board the boat.');
        return;
      }
      state.boatEquipped = true;
      state.player.x = targetX;
      state.player.y = targetY;
      updateHud('Isaac boarded the boat and moved onto water.');
      if (state.gameRunning) {
        audio.startMusicLoop();
      }
      return;
    }

    if (targetTile === 'water') {
      updateHud('Face land and press B to dock and unequip the boat.');
      return;
    }

    state.boatEquipped = false;
    state.player.x = targetX;
    state.player.y = targetY;
    updateHud('Isaac docked on land and unequipped the boat.');
    if (state.gameRunning) {
      audio.startMusicLoop();
    }
  }

  function move(dx, dy) {
    state.player.facing = { x: dx, y: dy };
    const nx = state.player.x + dx;
    const ny = state.player.y + dy;

    if (state.boatEquipped && state.map[state.player.y][state.player.x] !== 'water') {
      state.boatEquipped = false;
      updateHud('Boat unequipped because Isaac stepped onto land.');
      if (state.gameRunning) {
        audio.startMusicLoop();
      }
    }

    if (walkable(nx, ny)) {
      state.player.x = nx;
      state.player.y = ny;
    } else if (nx >= 0 && ny >= 0 && nx < mapWidth && ny < mapHeight) {
      const destinationTile = state.map[ny][nx];
      if (!state.boatEquipped && destinationTile === 'water') {
        updateHud('Uh-oh! The water is too deep. Equip you boat or you will be fish food!');
      } else if (state.boatEquipped && destinationTile !== 'water' && destinationTile !== 'wall') {
        updateHud("Uh-oh! The boat can't move onto land. Press B to dock before stepping ashore.");
      }
    }
  }

  function handleMovement(deltaMs) {
    if (state.player.isDying) {
      return;
    }

    if (state.player.moveCooldownMs > 0) {
      state.player.moveCooldownMs = Math.max(0, state.player.moveCooldownMs - deltaMs);
      return;
    }

    if (state.keys.has('ArrowUp') || state.keys.has('w')) {
      move(0, -1);
    } else if (state.keys.has('ArrowDown') || state.keys.has('s')) {
      move(0, 1);
    } else if (state.keys.has('ArrowLeft') || state.keys.has('a')) {
      move(-1, 0);
    } else if (state.keys.has('ArrowRight') || state.keys.has('d')) {
      move(1, 0);
    } else {
      return;
    }

    state.player.moveCooldownMs = 100;
  }

  function canIrsWalkTo(x, y) {
    if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
      return false;
    }

    return state.map[y][x] !== 'wall';
  }

  function moveIrsAgent(agent) {
    const dx = state.player.x - agent.x;
    const dy = state.player.y - agent.y;
    const horizontalFirst = Math.abs(dx) >= Math.abs(dy);

    const options = horizontalFirst
      ? [
          { x: Math.sign(dx), y: 0 },
          { x: 0, y: Math.sign(dy) },
        ]
      : [
          { x: 0, y: Math.sign(dy) },
          { x: Math.sign(dx), y: 0 },
        ];

    options.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });

    for (const option of options) {
      if (option.x === 0 && option.y === 0) {
        continue;
      }

      const nx = agent.x + option.x;
      const ny = agent.y + option.y;
      if (canIrsWalkTo(nx, ny)) {
        agent.x = nx;
        agent.y = ny;
        return;
      }
    }
  }

  function triggerIsaacDeath() {
    if (state.player.isDying) {
      return;
    }

    state.player.isDying = true;
    state.player.deathFrame = 0;
    state.gameOverTimer = 60;
    state.keys.clear();
    updateHud('The IRS caught Isaac! He dropped every pot.');
  }

  function resolveGameOver() {
    state.gameRunning = false;
    audio.stopMusicLoop();
    audio.stopBgmSetRotation();
    audio.stopGameOverMusic();
    audio.stopCelebrationMusic();
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }

    state.currentLevel = 1;
    state.awaitingReplay = false;
    audio.updateMusicButtons(elements.toggleMusicBtn);
    loadLevel(state.currentLevel);
    openMenu({
      title: 'Game Over',
      copy: 'The IRS shut Isaac down. Start over from Level 1.',
      buttonText: 'Restart Run',
      showDifficulty: false,
    });
    audio.playGameOverViolin();
  }

  function updateIrsAgents() {
    if (state.currentLevel < 2 || state.player.isDying || state.sales < 1) {
      return;
    }

    const baseRatio = getIrsSpeedRatio(state.currentLevel);

    state.irsAgents.forEach((agent) => {
      const tilePenalty = state.map[agent.y][agent.x] === 'water' ? 0.75 : 1;
      agent.progress += (baseRatio * getDifficultyMultiplier() * tilePenalty) / 6;

      while (agent.progress >= 1) {
        moveIrsAgent(agent);
        agent.progress -= 1;
      }

      if (agent.x === state.player.x && agent.y === state.player.y) {
        triggerIsaacDeath();
      }
    });
  }

  function completeLevel() {
    state.gameRunning = false;
    audio.stopMusicLoop();
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }

    if (state.currentLevel >= maxLevel) {
      state.awaitingReplay = true;
      audio.playCelebrationAnthem();
      openMenu({
        title: 'Legend Complete!',
        copy: 'You cleared all 5 levels! Trumpets blast, drums thunder, and fireworks paint all of ClayTown.',
        buttonText: 'Play Again',
        celebration: true,
        showDifficulty: false,
      });
      return;
    }

    state.currentLevel += 1;
    state.awaitingReplay = false;
    audio.updateMusicButtons(elements.toggleMusicBtn);

    loadLevel(state.currentLevel);
    openMenu({
      title: `Level ${state.currentLevel} Unlocked`,
      copy: `More water and more dudes await. Reach ${state.goal} sales to clear this level.`,
      buttonText: `Start Level ${state.currentLevel}`,
      showDifficulty: false,
    });
  }

  function trySell() {
    const targetX = state.player.x + state.player.facing.x;
    const targetY = state.player.y + state.player.facing.y;
    const target = state.dudes.find((dude) => dude.x === targetX && dude.y === targetY);

    if (!target) {
      updateHud('No dude in front of Isaac. Face a dude and press E.');
      return;
    }

    if (target.bought) {
      updateHud(`${target.name} already bought pottery today.`);
      return;
    }

    if (state.pottery <= 0) {
      updateHud('No pottery left. Isaac needs a restock.');
      return;
    }

    target.bought = true;
    state.pottery -= 1;
    state.sales += 1;
    audio.playSaleChaching();

    if (state.sales >= state.goal) {
      updateHud(`${target.name} bought a pot. Goal complete for this map!`);
      state.gameRunning = false;
      audio.stopMusicLoop();
      audio.stopBgmSetRotation();
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
      updateHud(`${target.name} bought a pot. Level ${state.currentLevel} complete!`);
      completeLevel();
      return;
    }

    updateHud(`${target.name} bought a pot. Keep selling, Isaac.`);
  }

  function gameLoop(timestamp = performance.now()) {
    if (!state.gameRunning) {
      return;
    }

    if (state.lastFrameTimeMs === null) {
      state.lastFrameTimeMs = timestamp;
    }
    const deltaMs = Math.min(100, timestamp - state.lastFrameTimeMs);
    state.lastFrameTimeMs = timestamp;

    handleMovement(deltaMs);
    updateIrsAgents();

    if (state.player.isDying) {
      state.player.deathFrame += 1;
      if (state.player.deathFrame > 30) {
        if (state.gameOverTimer > 0) {
          state.gameOverTimer -= 1;
        } else {
          resolveGameOver();
          return;
        }
      }
    }

    renderer.render();
    state.animationFrameId = requestAnimationFrame(gameLoop);
  }

  function startNewGame() {
    if (state.awaitingReplay || state.currentLevel > maxLevel) {
      state.currentLevel = 1;
      state.awaitingReplay = false;
    }

    audio.updateMusicButtons(elements.toggleMusicBtn);

    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    audio.stopMusicLoop();
    audio.stopBgmSetRotation();
    audio.stopGameOverMusic();
    audio.stopCelebrationMusic();

    loadLevel(state.currentLevel);
    state.hasStartedGame = true;
    elements.startMenuEl.classList.add('hidden');
    if (!state.gameRunning) {
      state.gameRunning = true;
      state.lastFrameTimeMs = null;
      audio.startBgmSetRotation();
      audio.startMusicLoop();
      gameLoop();
    }
  }

  function init() {
    bindInput({
      state,
      elements,
      actions: {
        toggleMusicEnabled: () => audio.toggleMusicEnabled(elements.toggleMusicBtn),
        advanceBgmSet: audio.advanceBgmSet,
        startNewGame,
        trySell,
        toggleBoat,
        setDifficulty,
      },
    });

    audio.updateMusicButtons(elements.toggleMusicBtn);
    if (elements.difficultySelectEl) {
      elements.difficultySelectEl.value = state.difficulty;
    }

    loadLevel(state.currentLevel);
    openMenu({
      title: 'ClayTown Start Menu',
      copy: 'Isaac is ready to sell pots to dudes. Conquer 5 levels of rising difficulty.',
      buttonText: 'Start Level 1',
      showDifficulty: !state.hasStartedGame,
    });
  }

  return { init };
}
