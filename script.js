const canvas = document.getElementById("gameMap");
const ctx = canvas.getContext("2d");

const inventoryEl = document.getElementById("inventory");
const salesEl = document.getElementById("sales");
const boatStatusEl = document.getElementById("boatStatus");
const messageEl = document.getElementById("message");
const startMenuEl = document.getElementById("startMenu");
const newGameBtn = document.getElementById("newGameBtn");

const tileSize = 32;
const mapWidth = canvas.width / tileSize;
const mapHeight = canvas.height / tileSize;

let pottery = 10;
let sales = 0;
const hasBoat = true;
let boatEquipped = false;
const goal = 4;
let gameRunning = false;
let animationFrameId = null;
let audioContext = null;
let musicTimerId = null;
let musicStepIndex = 0;

const keys = new Set();
const musicProfile = {
  normal: {
    bpm: 92,
    steps: [220, 277.18, 329.63, 277.18, 246.94, 293.66, 349.23, 293.66],
  },
  boat: {
    bpm: 132,
    steps: [329.63, 392, 440, 392, 349.23, 415.3, 493.88, 415.3],
  },
  sfx: {
    sale: [880, 1174.66, 1567.98],
  },
};

const map = Array.from({ length: mapHeight }, (_, y) =>
  Array.from({ length: mapWidth }, (_, x) => {
    if (x < 1 || y < 1 || x > mapWidth - 2 || y > mapHeight - 2) {
      return "wall";
    }

    if ((x > 10 && x < 14 && y > 2 && y < 7) || (x > 14 && y > 8 && y < 12)) {
      return "water";
    }

    if ((x > 2 && x < 8 && y > 7 && y < 11) || (x > 15 && y > 2 && y < 5)) {
      return "path";
    }

    return "grass";
  })
);

const player = {
  x: 3,
  y: 3,
  moveDelay: 0,
  facing: { x: 0, y: 1 },
};

const dudeBlueprints = [
  { x: 5, y: 9, name: "Dude Dan", bought: false },
  { x: 7, y: 4, name: "Dude Rex", bought: false },
  { x: 16, y: 10, name: "Dude Bo", bought: false },
  { x: 18, y: 6, name: "Dude Max", bought: false },
];
let dudes = [];

function updateHud(text) {
  inventoryEl.textContent = `Pottery left: ${pottery}`;
  salesEl.textContent = `Sales made: ${sales} / ${goal}`;
  boatStatusEl.textContent = `Boat: ${
    hasBoat ? (boatEquipped ? "Equipped" : "Unequipped") : "Not Owned"
  }`;
  if (text) {
    messageEl.textContent = text;
  }
}

function resetGameState() {
  pottery = 10;
  sales = 0;
  boatEquipped = false;
  player.x = 3;
  player.y = 3;
  player.moveDelay = 0;
  player.facing = { x: 0, y: 1 };
  dudes = dudeBlueprints.map((dude) => ({ ...dude }));
  musicStepIndex = 0;
  keys.clear();
  updateHud("Walk up to a dude and press E to sell pottery.");
  render();
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playSynthNote({
  frequency,
  duration,
  when = 0,
  type = "triangle",
  volume = 0.06,
}) {
  if (!audioContext) {
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startTime = audioContext.currentTime + when;
  const endTime = startTime + duration;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

function currentTrack() {
  return boatEquipped ? musicProfile.boat : musicProfile.normal;
}

function stopMusicLoop() {
  if (musicTimerId) {
    clearTimeout(musicTimerId);
    musicTimerId = null;
  }
}

function scheduleMusicStep() {
  if (!gameRunning || !audioContext) {
    return;
  }

  const track = currentTrack();
  const beatSeconds = 60 / track.bpm;
  const stepFrequency = track.steps[musicStepIndex % track.steps.length];

  playSynthNote({
    frequency: stepFrequency,
    duration: beatSeconds * 0.72,
    type: boatEquipped ? "square" : "triangle",
    volume: boatEquipped ? 0.05 : 0.04,
  });

  playSynthNote({
    frequency: stepFrequency / 2,
    duration: beatSeconds * 0.5,
    when: 0.02,
    type: "sine",
    volume: 0.03,
  });

  musicStepIndex += 1;
  musicTimerId = setTimeout(scheduleMusicStep, beatSeconds * 1000);
}

function startMusicLoop() {
  if (!gameRunning) {
    return;
  }

  ensureAudioContext();
  stopMusicLoop();
  scheduleMusicStep();
}

function playSaleChaching() {
  ensureAudioContext();
  const [n1, n2, n3] = musicProfile.sfx.sale;
  playSynthNote({ frequency: n1, duration: 0.08, type: "square", volume: 0.09 });
  playSynthNote({
    frequency: n2,
    duration: 0.1,
    when: 0.06,
    type: "square",
    volume: 0.08,
  });
  playSynthNote({
    frequency: n3,
    duration: 0.16,
    when: 0.12,
    type: "triangle",
    volume: 0.07,
  });
}

function walkable(x, y) {
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
    return false;
  }

  const tile = map[y][x];
  if (tile === "wall") {
    return false;
  }

  if (tile === "water" && !boatEquipped) {
    return false;
  }

  return true;
}

function toggleBoat() {
  if (!hasBoat) {
    updateHud("Isaac does not have a boat yet.");
    return;
  }

  if (boatEquipped) {
    if (map[player.y][player.x] === "water") {
      updateHud("Cannot unequip boat while standing on water.");
      return;
    }
    boatEquipped = false;
    updateHud("Boat unequipped.");
    if (gameRunning) {
      startMusicLoop();
    }
    return;
  }

  boatEquipped = true;
  updateHud("Boat equipped. Isaac can now move across water.");
  if (gameRunning) {
    startMusicLoop();
  }
}

function move(dx, dy) {
  player.facing = { x: dx, y: dy };
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (walkable(nx, ny)) {
    player.x = nx;
    player.y = ny;
  }
}

function handleMovement() {
  if (player.moveDelay > 0) {
    player.moveDelay -= 1;
    return;
  }

  if (keys.has("ArrowUp") || keys.has("w")) {
    move(0, -1);
  } else if (keys.has("ArrowDown") || keys.has("s")) {
    move(0, 1);
  } else if (keys.has("ArrowLeft") || keys.has("a")) {
    move(-1, 0);
  } else if (keys.has("ArrowRight") || keys.has("d")) {
    move(1, 0);
  } else {
    return;
  }

  player.moveDelay = 6;
}

function drawTile(x, y, type) {
  const px = x * tileSize;
  const py = y * tileSize;

  if (type === "grass") {
    ctx.fillStyle = "#7fa95e";
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = "#739951";
    ctx.fillRect(px + 3, py + 3, 5, 5);
  }

  if (type === "path") {
    ctx.fillStyle = "#c9a979";
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = "#b18a5c";
    ctx.fillRect(px + 4, py + 4, 7, 5);
  }

  if (type === "wall") {
    ctx.fillStyle = "#7b5a43";
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = "#5f4331";
    ctx.fillRect(px + 4, py + 4, 10, 7);
  }

  if (type === "water") {
    ctx.fillStyle = "#5a9ab5";
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = "#88c0d6";
    ctx.fillRect(px + 4, py + 6, 12, 3);
  }
}

function drawPlayer() {
  const px = player.x * tileSize;
  const py = player.y * tileSize;

  if (boatEquipped) {
    ctx.fillStyle = "#6d4128";
    ctx.fillRect(px + 2, py + 18, 28, 10);
    ctx.fillStyle = "#4f2d1a";
    ctx.fillRect(px + 5, py + 21, 22, 5);
    ctx.fillStyle = "#d9b07e";
    ctx.fillRect(px + 26, py + 14, 3, 10);

    ctx.fillStyle = "#f0c58b";
    ctx.fillRect(px + 10, py + 6, 12, 9);
    ctx.fillStyle = "#2f4f90";
    ctx.fillRect(px + 8, py + 15, 16, 8);
    return;
  }

  ctx.fillStyle = "#f0c58b";
  ctx.fillRect(px + 8, py + 4, 16, 10);

  ctx.fillStyle = "#2f4f90";
  ctx.fillRect(px + 6, py + 14, 20, 13);

  ctx.fillStyle = "#d16b34";
  ctx.fillRect(px + 2, py + 17, 4, 8);
}

function drawDude(dude) {
  const px = dude.x * tileSize;
  const py = dude.y * tileSize;

  ctx.fillStyle = dude.bought ? "#bfa286" : "#f2d7a8";
  ctx.fillRect(px + 8, py + 4, 16, 10);

  ctx.fillStyle = dude.bought ? "#6d5d4a" : "#2e2e2e";
  ctx.fillRect(px + 6, py + 14, 20, 13);

  if (dude.bought) {
    ctx.fillStyle = "#d16b34";
    ctx.fillRect(px + 10, py + 18, 12, 7);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < mapHeight; y += 1) {
    for (let x = 0; x < mapWidth; x += 1) {
      drawTile(x, y, map[y][x]);
    }
  }

  dudes.forEach(drawDude);
  drawPlayer();
}

function trySell() {
  const targetX = player.x + player.facing.x;
  const targetY = player.y + player.facing.y;
  const target = dudes.find((dude) => dude.x === targetX && dude.y === targetY);

  if (!target) {
    updateHud("No dude in front of Isaac. Face a dude and press E.");
    return;
  }

  if (target.bought) {
    updateHud(`${target.name} already bought pottery today.`);
    return;
  }

  if (pottery <= 0) {
    updateHud("No pottery left. Isaac needs a restock.");
    return;
  }

  target.bought = true;
  pottery -= 1;
  sales += 1;
  playSaleChaching();

  if (sales >= goal) {
    updateHud(`${target.name} bought a pot. Goal complete for this map!`);
    gameRunning = false;
    stopMusicLoop();
    newGameBtn.textContent = "Play Again";
    startMenuEl.classList.remove("hidden");
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    return;
  }

  updateHud(`${target.name} bought a pot. Keep selling, Isaac.`);
}

function gameLoop() {
  if (!gameRunning) {
    return;
  }

  handleMovement();
  render();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function startNewGame() {
  resetGameState();
  startMenuEl.classList.add("hidden");
  newGameBtn.textContent = "New Game";
  if (!gameRunning) {
    gameRunning = true;
    startMusicLoop();
    gameLoop();
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (!gameRunning) {
    if (key === "Enter") {
      event.preventDefault();
      startNewGame();
    }
    return;
  }

  keys.add(key);

  if (key === "e") {
    event.preventDefault();
    trySell();
  }

  if (key === "b" && !event.repeat) {
    event.preventDefault();
    toggleBoat();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

newGameBtn.addEventListener("click", startNewGame);

resetGameState();
