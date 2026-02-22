import { levelConfigs, maxLevel } from '../content/levels.js';
import { createInitialState, difficultyMultipliers, tileSize } from './state.js';
import { resetStateForLevel, setDifficulty as setStateDifficulty } from './transitions.js';
import { createRenderer } from '../systems/render.js';
import { createAudioSystem } from '../systems/audio.js';
import { bindInput } from '../systems/input.js';

export function createGame() {
  const elements = {
    canvas: document.getElementById('gameMap'),
    salesEl: document.getElementById('sales'),
    levelEl: document.getElementById('level'),
    boatStatusEl: document.getElementById('boatStatus'),
    flowersSmashedEl: document.getElementById('flowersSmashed'),
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
    leaderboardFastestEl: document.getElementById('leaderboardFastest'),
  };

  const ctx = elements.canvas.getContext('2d');
  const mapWidth = elements.canvas.width / tileSize;
  const mapHeight = elements.canvas.height / tileSize;
  const state = createInitialState({ mapWidth, mapHeight });
  const leaderboardStorageKey = 'potteryfordudes.fastestClearMs';
  let runStartTimeMs = null;


  function readFastestClearMs() {
    const saved = Number.parseInt(window.localStorage.getItem(leaderboardStorageKey) || '', 10);
    return Number.isFinite(saved) && saved > 0 ? saved : null;
  }

  function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  function parseDebugConfig() {
    const params = new URLSearchParams(window.location.search);
    const debugEnabled = params.get('debug') === '1';
    const parsedSeed = Number.parseInt(params.get('seed') || '', 10);

    state.debug.enabled = debugEnabled;
    state.debug.showOverlay = debugEnabled;
    state.debug.showHitboxes = debugEnabled && params.get('hitboxes') === '1';
    state.debug.deterministic = debugEnabled;
    state.debug.seed = Number.isNaN(parsedSeed) ? state.debug.seed : parsedSeed;
  }

  function seededRandom() {
    if (!state.debug.deterministic) {
      return Math.random();
    }

    const nextSeed = (1664525 * state.debug.seed + 1013904223) % 4294967296;
    state.debug.seed = nextSeed;
    return nextSeed / 4294967296;
  }

  function pushTelemetryEvent(eventText) {
    state.telemetry.events.push(eventText);
    if (state.telemetry.events.length > 6) {
      state.telemetry.events.shift();
    }
  }

  function updateHud(text) {
    elements.salesEl.textContent = `Sales made: ${state.sales} / ${state.goal}`;
    elements.levelEl.textContent = `Level: ${state.currentLevel} / ${maxLevel}`;
    elements.boatStatusEl.textContent = `Boat: ${
      state.hasBoat ? (state.boatEquipped ? 'Equipped' : 'Unequipped') : 'Not Owned'
    }`;
    if (elements.flowersSmashedEl) {
      elements.flowersSmashedEl.textContent = `Flowers Smashed: ${state.flowersSmashed}`;
    }

    if (elements.leaderboardFastestEl) {
      const fastestClearMs = readFastestClearMs();
      elements.leaderboardFastestEl.textContent = fastestClearMs === null
        ? 'Fastest Clear: --'
        : `Fastest Clear: ${formatDuration(fastestClearMs)}`;
    }

    if (text) {
      elements.messageEl.textContent = text;
    }
  }

  const renderer = createRenderer({ canvas: elements.canvas, ctx, tileSize, state, seededRandom });
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

    updateHud(`Difficulty set to ${state.difficulty}. Enemy speed adjusted.`);
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



  function getPoliceSpeedRatio(level) {
    return getIrsSpeedRatio(level) * 1.2;
  }

  function getBulletSpeedRatio(level) {
    return getPoliceSpeedRatio(level) * 1.2;
  }

  function isLandTile(x, y) {
    const tile = state.map[y][x];
    return tile === 'grass' || tile === 'path';
  }

  function placeFlowers() {
    const flowerCount = 3 + Math.floor(seededRandom() * 6);
    const candidates = [];

    for (let y = 1; y < mapHeight - 1; y += 1) {
      for (let x = 1; x < mapWidth - 1; x += 1) {
        if (!isLandTile(x, y)) {
          continue;
        }
        if (x === state.player.x && y === state.player.y) {
          continue;
        }
        candidates.push({ x, y });
      }
    }

    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(seededRandom() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    state.flowers = candidates.slice(0, flowerCount).map(({ x, y }) => ({ x, y, smashed: false }));
  }

  function loadLevel(level) {
    const config = levelConfigs[level];
    resetStateForLevel(state, config);
    placeFlowers();
    state.telemetry.levelStartTimeMs = performance.now();
    state.telemetry.levelDurationMs = 0;
    state.telemetry.reportCooldownMs = 10000;
    pushTelemetryEvent(`Level ${level} start (difficulty: ${state.difficulty}).`);
    audio.resetTrackState();
    updateHud(`Level ${level}: Walk up to a dude and press J to sell pottery.`);
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
    state.telemetry.boatToggles += 1;

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
        updateHud('Face water and press K to board the boat.');
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
      updateHud('Face land and press K to dock and unequip the boat.');
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

  function smashFlowerAtPlayerPosition() {
    const flower = state.flowers.find((candidate) =>
      !candidate.smashed && candidate.x === state.player.x && candidate.y === state.player.y);

    if (!flower) {
      return;
    }

    flower.smashed = true;
    state.flowersSmashed += 1;
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
      state.telemetry.steps += 1;
      smashFlowerAtPlayerPosition();
    } else if (nx >= 0 && ny >= 0 && nx < mapWidth && ny < mapHeight) {
      const destinationTile = state.map[ny][nx];
      if (!state.boatEquipped && destinationTile === 'water') {
        updateHud('Uh-oh! The water is too deep. Equip you boat or you will be fish food!');
      } else if (state.boatEquipped && destinationTile !== 'water' && destinationTile !== 'wall') {
        updateHud("Uh-oh! The boat can't move onto land. Press K to dock before stepping ashore.");
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

    if (state.keys.has('w')) {
      move(0, -1);
    } else if (state.keys.has('s')) {
      move(0, 1);
    } else if (state.keys.has('a')) {
      move(-1, 0);
    } else if (state.keys.has('d')) {
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
    const prioritizeHorizontal = Math.abs(dx) === Math.abs(dy)
      ? seededRandom() >= 0.5
      : Math.abs(dx) >= Math.abs(dy);

    const options = prioritizeHorizontal
      ? [
          { x: Math.sign(dx), y: 0 },
          { x: 0, y: Math.sign(dy) },
        ]
      : [
          { x: 0, y: Math.sign(dy) },
          { x: Math.sign(dx), y: 0 },
        ];

    const fallback = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    fallback.sort(() => seededRandom() - 0.5);
    options.push(...fallback);

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


  function movePoliceAgent(agent) {
    moveIrsAgent(agent);
  }

  function firePoliceBullet(agent) {
    const sameColumn = state.player.x === agent.x;
    const sameRow = state.player.y === agent.y;

    if (!sameColumn && !sameRow) {
      return;
    }

    const direction = sameColumn
      ? { x: 0, y: Math.sign(state.player.y - agent.y) }
      : { x: Math.sign(state.player.x - agent.x), y: 0 };

    if (direction.x === 0 && direction.y === 0) {
      return;
    }

    state.bullets.push({
      x: agent.x,
      y: agent.y,
      direction,
      progress: 0,
    });
  }

  function isPerimeterTile(x, y) {
    return x <= 0 || y <= 0 || x >= mapWidth - 1 || y >= mapHeight - 1;
  }

  function triggerIsaacDeath() {
    if (state.player.isDying) {
      return;
    }

    state.player.isDying = true;
    state.player.deathFrame = 0;
    state.gameOverTimer = 60;
    state.keys.clear();
    pushTelemetryEvent(`Isaac was caught on level ${state.currentLevel}.`);
    updateHud('Isaac was caught! He dropped every pot.');
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
      copy: 'Law enforcement shut Isaac down. Start over from Level 1.',
      buttonText: 'Restart Run',
      showDifficulty: false,
    });
    audio.playGameOverViolin();
  }

  function updateEnemies(deltaMs) {
    if (state.currentLevel < 2 || state.player.isDying || state.sales < 1) {
      return;
    }

    const difficultyMultiplier = getDifficultyMultiplier();
    const irsBaseRatio = getIrsSpeedRatio(state.currentLevel);

    state.irsAgents.forEach((agent) => {
      const tilePenalty = state.map[agent.y][agent.x] === 'water' ? 0.75 : 1;
      agent.progress += (irsBaseRatio * difficultyMultiplier * tilePenalty) / 6;

      while (agent.progress >= 1) {
        moveIrsAgent(agent);
        agent.progress -= 1;
      }

      if (agent.x === state.player.x && agent.y === state.player.y) {
        triggerIsaacDeath();
      }
    });

    const policeBaseRatio = getPoliceSpeedRatio(state.currentLevel);
    state.policeAgents.forEach((agent) => {
      const tilePenalty = state.map[agent.y][agent.x] === 'water' ? 0.75 : 1;
      agent.progress += (policeBaseRatio * difficultyMultiplier * tilePenalty) / 6;
      agent.cooldownMs = Math.max(0, agent.cooldownMs - deltaMs);

      while (agent.progress >= 1) {
        movePoliceAgent(agent);
        agent.progress -= 1;
      }

      if (agent.cooldownMs <= 0) {
        firePoliceBullet(agent);
        agent.cooldownMs = 700;
      }

      if (agent.x === state.player.x && agent.y === state.player.y) {
        triggerIsaacDeath();
      }
    });

    const bulletBaseRatio = getBulletSpeedRatio(state.currentLevel);
    const liveBullets = [];

    state.bullets.forEach((bullet) => {
      bullet.progress += (bulletBaseRatio * difficultyMultiplier) / 6;

      while (bullet.progress >= 1) {
        bullet.x += bullet.direction.x;
        bullet.y += bullet.direction.y;
        bullet.progress -= 1;

        if (bullet.x === state.player.x && bullet.y === state.player.y) {
          triggerIsaacDeath();
        }

        if (isPerimeterTile(bullet.x, bullet.y)) {
          return;
        }
      }

      liveBullets.push(bullet);
    });

    state.bullets = liveBullets;
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
      const runDurationMs = runStartTimeMs === null ? null : Math.round(performance.now() - runStartTimeMs);
      const previousFastestMs = readFastestClearMs();
      const isNewRecord = runDurationMs !== null && (previousFastestMs === null || runDurationMs < previousFastestMs);
      if (isNewRecord) {
        window.localStorage.setItem(leaderboardStorageKey, String(runDurationMs));
      }
      if (runDurationMs !== null) {
        const recordLabel = isNewRecord ? 'New record!' : 'Best clear remains.';
        pushTelemetryEvent(`Run complete in ${formatDuration(runDurationMs)}. ${recordLabel}`);
      } else {
        pushTelemetryEvent('Run complete. All levels cleared.');
      }
      audio.playCelebrationAnthem();
      const completionMessage = runDurationMs === null
        ? 'You cleared all 5 levels! Trumpets blast, drums thunder, and fireworks paint all of ClayTown.'
        : `You cleared all 5 levels in ${formatDuration(runDurationMs)}. ${isNewRecord ? 'New fastest clear!' : 'Can you beat your best time?'}`;
      openMenu({
        title: 'Legend Complete!',
        copy: completionMessage,
        buttonText: 'Play Again',
        celebration: true,
        showDifficulty: false,
      });
      return;
    }

    pushTelemetryEvent(`Level ${state.currentLevel} complete in ${Math.round(state.telemetry.levelDurationMs / 1000)}s.`);
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
      updateHud('No dude in front of Isaac. Face a dude and press J.');
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
    state.telemetry.sales += 1;
    pushTelemetryEvent(`Sale to ${target.name} on level ${state.currentLevel}.`);
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
    updateEnemies(deltaMs);

    state.debug.frameCount += 1;
    state.debug.fpsAccumulatorMs += deltaMs;
    state.debug.fpsSampleFrames += 1;
    if (state.debug.fpsAccumulatorMs >= 500) {
      state.debug.fps = Math.round((state.debug.fpsSampleFrames * 1000) / state.debug.fpsAccumulatorMs);
      state.debug.fpsAccumulatorMs = 0;
      state.debug.fpsSampleFrames = 0;
    }

    state.telemetry.levelDurationMs = performance.now() - state.telemetry.levelStartTimeMs;
    state.telemetry.reportCooldownMs -= deltaMs;
    if (state.telemetry.reportCooldownMs <= 0) {
      state.telemetry.reportCooldownMs = 10000;
      if (state.debug.enabled) {
        console.info('[telemetry]', {
          level: state.currentLevel,
          sales: state.telemetry.sales,
          steps: state.telemetry.steps,
          boatToggles: state.telemetry.boatToggles,
          levelDurationMs: Math.round(state.telemetry.levelDurationMs),
        });
      }
      updateHud();
    }

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

    if (state.currentLevel === 1) {
      state.flowersSmashed = 0;
    }

    loadLevel(state.currentLevel);
    runStartTimeMs = performance.now();
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
        toggleDebugTools: () => {
          state.debug.enabled = !state.debug.enabled;
          state.debug.showOverlay = state.debug.enabled;
          state.debug.showHitboxes = state.debug.enabled;
          updateHud(`Developer debug tools ${state.debug.enabled ? 'enabled' : 'disabled'}.`);
          renderer.render();
        },
      },
    });

    parseDebugConfig();

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
