export function createRenderer({ canvas, ctx, tileSize, state }) {
  function drawTile(x, y, type) {
    const px = x * tileSize;
    const py = y * tileSize;
    if (type === 'grass') {
      ctx.fillStyle = '#7fa95e';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#739951';
      ctx.fillRect(px + 3, py + 3, 5, 5);
    }
    if (type === 'path') {
      ctx.fillStyle = '#c9a979';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#b18a5c';
      ctx.fillRect(px + 4, py + 4, 7, 5);
    }
    if (type === 'wall') {
      ctx.fillStyle = '#7b5a43';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#5f4331';
      ctx.fillRect(px + 4, py + 4, 10, 7);
    }
    if (type === 'water') {
      ctx.fillStyle = '#5a9ab5';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#88c0d6';
      ctx.fillRect(px + 4, py + 6, 12, 3);
    }
  }

  function drawIrsAgent(agent) {
    const px = agent.x * tileSize;
    const py = agent.y * tileSize;
    ctx.fillStyle = '#8ed26f'; ctx.fillRect(px + 8, py + 4, 16, 10);
    ctx.fillStyle = '#2f7d3c'; ctx.fillRect(px + 6, py + 14, 20, 13);
    ctx.fillStyle = '#1f5228'; ctx.fillRect(px + 4, py + 16, 4, 8);
    ctx.fillStyle = '#d8f5c9'; ctx.font = 'bold 8px Chakra Petch, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('IRS', px + 16, py + 20);
  }

  function drawDude(dude) {
    const px = dude.x * tileSize;
    const py = dude.y * tileSize;
    ctx.fillStyle = dude.bought ? '#bfa286' : '#f2d7a8';
    ctx.fillRect(px + 8, py + 4, 16, 10);
    ctx.fillStyle = dude.bought ? '#6d5d4a' : '#2e2e2e';
    ctx.fillRect(px + 6, py + 14, 20, 13);
    if (dude.bought) {
      ctx.fillStyle = '#d16b34';
      ctx.fillRect(px + 10, py + 18, 12, 7);
    }
  }

  function drawPlayer() {
    const { player, boatEquipped } = state;
    const px = player.x * tileSize;
    const py = player.y * tileSize;
    if (player.isDying) {
      if (player.deathFrame > 30) return;
      const pulse = 1 + Math.sin(player.deathFrame * 0.6) * 0.2;
      const bodyWidth = Math.max(8, Math.floor(16 * (1 - player.deathFrame / 35) * pulse));
      const bodyOffset = Math.floor((32 - bodyWidth) / 2);
      ctx.fillStyle = '#f0c58b'; ctx.fillRect(px + bodyOffset, py + 6, bodyWidth, 9);
      ctx.fillStyle = '#b8483a'; ctx.fillRect(px + bodyOffset - 2, py + 15, bodyWidth + 4, 11);
      return;
    }
    const { x: facingX, y: facingY } = player.facing;
    if (boatEquipped) {
      ctx.fillStyle = '#6d4128'; ctx.fillRect(px + 2, py + 18, 28, 10);
      ctx.fillStyle = '#4f2d1a'; ctx.fillRect(px + 5, py + 21, 22, 5);
      ctx.fillStyle = '#d9b07e'; ctx.fillRect(px + 26, py + 14, 3, 10);
      ctx.fillStyle = '#f0c58b'; ctx.fillRect(px + 10, py + 6, 12, 9);
      ctx.fillStyle = '#2f4f90'; ctx.fillRect(px + 8, py + 15, 16, 8);
      const eyeOffsetX = facingX === 0 ? 0 : facingX * 2;
      const eyeOffsetY = facingY === 0 ? 0 : facingY * 2;
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(px + 13 + eyeOffsetX, py + 9 + eyeOffsetY, 2, 2);
      ctx.fillRect(px + 17 + eyeOffsetX, py + 9 + eyeOffsetY, 2, 2);
      return;
    }
    ctx.fillStyle = '#f0c58b'; ctx.fillRect(px + 8, py + 4, 16, 10);
    ctx.fillStyle = '#2f4f90'; ctx.fillRect(px + 6, py + 14, 20, 13);
    const eyeOffsetX = facingX === 0 ? 0 : facingX * 2;
    const eyeOffsetY = facingY === 0 ? 0 : facingY * 2;
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(px + 12 + eyeOffsetX, py + 8 + eyeOffsetY, 2, 2);
    ctx.fillRect(px + 18 + eyeOffsetX, py + 8 + eyeOffsetY, 2, 2);
    const potBaseX = px + 14 + facingX * 8;
    const potBaseY = py + 18 + facingY * 8;
    ctx.fillStyle = '#d16b34';
    ctx.fillRect(potBaseX, potBaseY, 4, 8);
  }

  function drawDebugHitboxes() {
    if (!state.debug.showHitboxes) {
      return;
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;

    ctx.strokeRect(state.player.x * tileSize + 6, state.player.y * tileSize + 4, 20, 24);
    state.dudes.forEach((dude) => {
      ctx.strokeRect(dude.x * tileSize + 6, dude.y * tileSize + 4, 20, 24);
    });
    state.irsAgents.forEach((agent) => {
      ctx.strokeRect(agent.x * tileSize + 4, agent.y * tileSize + 4, 24, 24);
    });
  }

  function drawDebugOverlay() {
    if (!state.debug.showOverlay) {
      return;
    }

    ctx.fillStyle = 'rgba(15, 21, 35, 0.78)';
    ctx.fillRect(8, 8, 270, 98);
    ctx.strokeStyle = 'rgba(124, 236, 166, 0.9)';
    ctx.strokeRect(8, 8, 270, 98);

    ctx.fillStyle = '#dbf7e8';
    ctx.font = '12px Chakra Petch, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lines = [
      `FPS: ${state.debug.fps || '--'} | Frame: ${state.debug.frameCount}`,
      `Player: (${state.player.x}, ${state.player.y}) | Facing: (${state.player.facing.x}, ${state.player.facing.y})`,
      `Entities: dudes=${state.dudes.length}, irs=${state.irsAgents.length}`,
      `Seed: ${state.debug.seed} | Deterministic: ${state.debug.deterministic ? 'yes' : 'no'}`,
      `Telemetry: sales=${state.telemetry.sales}, steps=${state.telemetry.steps}`,
    ];

    lines.forEach((line, index) => {
      ctx.fillText(line, 14, 14 + index * 16);
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < state.mapHeight; y += 1) {
      for (let x = 0; x < state.mapWidth; x += 1) {
        drawTile(x, y, state.map[y][x]);
      }
    }
    state.dudes.forEach(drawDude);
    state.irsAgents.forEach(drawIrsAgent);
    drawPlayer();
    drawDebugHitboxes();
    drawDebugOverlay();
  }

  return { render };
}
