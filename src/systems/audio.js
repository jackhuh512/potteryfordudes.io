import {
  bgmSetDurationMs,
  bgmTempoMultiplier,
  musicProfile,
} from '../content/musicProfile.js';

export function createAudioSystem({ state, updateHud }) {
  let audioContext = null;
  let musicTimerId = null;
  let bgmSetTimerId = null;
  let gameOverMusicTimerIds = [];
  let celebrationMusicTimerIds = [];
  let celebrationMusicLoopTimerId = null;
  let musicStepIndex = 0;
  let bgmSetIndex = 0;

  function currentMusicSet() {
    return musicProfile.sets[bgmSetIndex % musicProfile.sets.length];
  }

  function currentTrack() {
    const set = currentMusicSet();
    return state.boatEquipped ? set.boat : set.normal;
  }

  function updateMusicButtons(toggleMusicBtn) {
    if (!toggleMusicBtn) {
      return;
    }

    toggleMusicBtn.textContent = `Music: ${state.musicEnabled ? 'On' : 'Off'}`;
  }

  function ensureAudioContext() {
    if (!audioContext) {
      audioContext = new window.AudioContext();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  function playSynthNote({
    frequency,
    duration,
    when = 0,
    type = 'triangle',
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

  function stopMusicLoop() {
    if (musicTimerId) {
      clearTimeout(musicTimerId);
      musicTimerId = null;
    }
  }

  function stopBgmSetRotation() {
    if (bgmSetTimerId) {
      clearInterval(bgmSetTimerId);
      bgmSetTimerId = null;
    }
  }

  function stopGameOverMusic() {
    gameOverMusicTimerIds.forEach((timerId) => clearTimeout(timerId));
    gameOverMusicTimerIds = [];
  }

  function stopCelebrationMusic() {
    celebrationMusicTimerIds.forEach((timerId) => clearTimeout(timerId));
    celebrationMusicTimerIds = [];

    if (celebrationMusicLoopTimerId) {
      clearTimeout(celebrationMusicLoopTimerId);
      celebrationMusicLoopTimerId = null;
    }
  }

  function advanceBgmSet() {
    bgmSetIndex = (bgmSetIndex + 1) % musicProfile.sets.length;
    musicStepIndex = 0;
    if (state.gameRunning && state.musicEnabled) {
      startMusicLoop();
    }
    updateHud(`Now playing soundtrack vibe: ${currentMusicSet().vibe}.`);
  }

  function startBgmSetRotation() {
    stopBgmSetRotation();
    if (!state.musicEnabled) {
      return;
    }
    bgmSetTimerId = setInterval(advanceBgmSet, bgmSetDurationMs);
  }

  function scheduleMusicStep() {
    if (!state.gameRunning || !audioContext) {
      return;
    }

    const track = currentTrack();
    const beatSeconds = 60 / (track.bpm * bgmTempoMultiplier);
    const stepFrequency = track.steps[musicStepIndex % track.steps.length];

    playSynthNote({
      frequency: stepFrequency,
      duration: beatSeconds * 0.72,
      type: track.leadType || (state.boatEquipped ? 'square' : 'triangle'),
      volume: track.leadVolume || (state.boatEquipped ? 0.05 : 0.04),
    });

    playSynthNote({
      frequency: stepFrequency / 2,
      duration: beatSeconds * 0.5,
      when: 0.02,
      type: track.bassType || 'sine',
      volume: 0.03,
    });

    musicStepIndex += 1;
    musicTimerId = setTimeout(scheduleMusicStep, beatSeconds * 1000);
  }

  function startMusicLoop() {
    if (!state.gameRunning || !state.musicEnabled) {
      return;
    }

    ensureAudioContext();
    stopMusicLoop();
    scheduleMusicStep();
  }

  function toggleMusicEnabled(toggleMusicBtn) {
    state.musicEnabled = !state.musicEnabled;
    updateMusicButtons(toggleMusicBtn);

    if (!state.musicEnabled) {
      stopMusicLoop();
      stopBgmSetRotation();
      stopCelebrationMusic();
      updateHud('Music muted. Press M or the button to turn it back on.');
      return;
    }

    if (state.awaitingReplay) {
      playCelebrationAnthem();
    } else if (state.gameRunning) {
      startBgmSetRotation();
      startMusicLoop();
    }
    updateHud(`Music enabled. Current soundtrack vibe: ${currentMusicSet().vibe}.`);
  }

  function playSaleChaching() {
    if (!state.musicEnabled) {
      return;
    }

    ensureAudioContext();
    const [n1, n2, n3] = musicProfile.sfx.sale;
    playSynthNote({ frequency: n1, duration: 0.08, type: 'square', volume: 0.09 });
    playSynthNote({
      frequency: n2,
      duration: 0.1,
      when: 0.06,
      type: 'square',
      volume: 0.08,
    });
    playSynthNote({
      frequency: n3,
      duration: 0.16,
      when: 0.12,
      type: 'triangle',
      volume: 0.07,
    });
  }

  function playGameOverViolin() {
    if (!state.musicEnabled) {
      return;
    }

    ensureAudioContext();
    stopGameOverMusic();

    const violinPhrase = [
      { frequency: 659.25, beats: 1.5 },
      { frequency: 587.33, beats: 1.5 },
      { frequency: 523.25, beats: 2 },
      { frequency: 493.88, beats: 2 },
      { frequency: 440, beats: 3 },
    ];
    const lamentBpm = 48;
    const beatSeconds = 60 / lamentBpm;

    let offsetSeconds = 0;
    violinPhrase.forEach((step, index) => {
      const timerId = setTimeout(() => {
        playSynthNote({
          frequency: step.frequency,
          duration: beatSeconds * step.beats * 0.95,
          type: 'sawtooth',
          volume: 0.05,
        });
        playSynthNote({
          frequency: step.frequency / 2,
          duration: beatSeconds * step.beats * 0.75,
          when: 0.02,
          type: 'triangle',
          volume: 0.018,
        });

        if (index === violinPhrase.length - 1) {
          gameOverMusicTimerIds = [];
        }
      }, offsetSeconds * 1000);

      gameOverMusicTimerIds.push(timerId);
      offsetSeconds += beatSeconds * step.beats;
    });
  }

  function playDrumHit({ when = 0, kick = false }) {
    if (!audioContext) {
      return;
    }

    const startTime = audioContext.currentTime + when;

    if (kick) {
      const kickOsc = audioContext.createOscillator();
      const kickGain = audioContext.createGain();

      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(160, startTime);
      kickOsc.frequency.exponentialRampToValueAtTime(48, startTime + 0.16);

      kickGain.gain.setValueAtTime(0.0001, startTime);
      kickGain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.01);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);

      kickOsc.connect(kickGain);
      kickGain.connect(audioContext.destination);
      kickOsc.start(startTime);
      kickOsc.stop(startTime + 0.22);
    }

    const noiseBuffer = audioContext.createBuffer(
      1,
      Math.floor(audioContext.sampleRate * 0.14),
      audioContext.sampleRate,
    );
    const channelData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * (1 - i / channelData.length);
    }

    const noiseSource = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();

    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(kick ? 900 : 1800, startTime);
    noiseGain.gain.setValueAtTime(0.0001, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(kick ? 0.08 : 0.05, startTime + 0.006);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.13);
  }

  function playCelebrationAnthem() {
    if (!state.musicEnabled) {
      return;
    }

    ensureAudioContext();
    stopCelebrationMusic();

    const bpm = 126;
    const beatSeconds = 60 / bpm;
    const anthemPhrase = [
      { freq: 523.25, beats: 1 },
      { freq: 659.25, beats: 1 },
      { freq: 783.99, beats: 1 },
      { freq: 880, beats: 1 },
      { freq: 783.99, beats: 0.5 },
      { freq: 698.46, beats: 0.5 },
      { freq: 659.25, beats: 1 },
      { freq: 523.25, beats: 2 },
    ];

    let offsetSeconds = 0;
    anthemPhrase.forEach((step, index) => {
      const timerId = setTimeout(() => {
        playSynthNote({
          frequency: step.freq,
          duration: beatSeconds * step.beats * 0.9,
          type: 'sawtooth',
          volume: 0.08,
        });
        playSynthNote({
          frequency: step.freq * 1.5,
          duration: beatSeconds * step.beats * 0.65,
          when: 0.01,
          type: 'square',
          volume: 0.045,
        });
        playSynthNote({
          frequency: step.freq / 2,
          duration: beatSeconds * step.beats,
          when: 0.02,
          type: 'triangle',
          volume: 0.03,
        });

        if (index === anthemPhrase.length - 1) {
          celebrationMusicTimerIds = [];
        }
      }, offsetSeconds * 1000);

      celebrationMusicTimerIds.push(timerId);
      offsetSeconds += step.beats * beatSeconds;
    });

    const drumPatternBeats = [0, 0.75, 1.5, 2, 2.75, 3.5, 4.5, 5.25, 6, 6.75];
    drumPatternBeats.forEach((beat, index) => {
      const timerId = setTimeout(() => {
        playDrumHit({ when: 0, kick: index % 2 === 0 });
      }, beat * beatSeconds * 1000);
      celebrationMusicTimerIds.push(timerId);
    });

    const loopLengthMs = offsetSeconds * 1000;
    celebrationMusicLoopTimerId = setTimeout(playCelebrationAnthem, loopLengthMs);
  }

  function resetTrackState() {
    musicStepIndex = 0;
    bgmSetIndex = 0;
    stopMusicLoop();
    stopBgmSetRotation();
  }

  return {
    updateMusicButtons,
    currentMusicSet,
    startMusicLoop,
    stopMusicLoop,
    startBgmSetRotation,
    stopBgmSetRotation,
    toggleMusicEnabled,
    advanceBgmSet,
    playSaleChaching,
    stopGameOverMusic,
    stopCelebrationMusic,
    playGameOverViolin,
    playCelebrationAnthem,
    resetTrackState,
  };
}
