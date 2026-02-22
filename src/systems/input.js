export function bindInput({ state, elements, actions }) {
  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (key === 'm' && !event.repeat) {
      event.preventDefault();
      actions.toggleMusicEnabled();
    }
    if (key === 'n' && !event.repeat) {
      event.preventDefault();
      actions.advanceBgmSet();
    }

    if (!state.gameRunning) {
      if (key === 'Enter') {
        event.preventDefault();
        actions.startNewGame();
      }
      return;
    }

    if (state.player.isDying) {
      return;
    }

    state.keys.add(key);
    if (key === 'e') {
      event.preventDefault();
      actions.trySell();
    }
    if (key === 'b' && !event.repeat) {
      event.preventDefault();
      actions.toggleBoat();
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    state.keys.delete(key);
  });

  elements.toggleMusicBtn.addEventListener('click', actions.toggleMusicEnabled);
  elements.nextBgmBtn.addEventListener('click', actions.advanceBgmSet);
  elements.newGameBtn.addEventListener('click', actions.startNewGame);

  if (elements.difficultySelectEl) {
    elements.difficultySelectEl.addEventListener('change', (event) => {
      actions.setDifficulty(event.target.value);
    });
  }
}
