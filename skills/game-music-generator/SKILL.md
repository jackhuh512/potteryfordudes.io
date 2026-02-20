---
name: game-music-generator
description: Generate lightweight retro game music plans and browser-playable synth cues for JavaScript canvas games. Use when creating or updating background music loops, state-based BPM changes (such as vehicle/boat mode), and short feedback SFX like sale/coin/chaching sounds without external audio files.
---

# Game Music Generator

Generate minimal music data first, then wire playback with Web Audio API.

## Workflow

1. Build a track profile JSON with `scripts/build_music_profile.js`.
2. Keep two BGM moods when needed (example: default exploration vs boat mode).
3. Keep one short SFX profile per action (example: pottery sale `chaching`).
4. In the game code, synthesize sound with oscillators and gain envelopes.
5. Start or resume audio only from a user gesture (button click/key press).

## Output Rules

- Keep loop lengths short (4-16 steps) for tiny prototypes.
- Keep melody frequencies in a playable range (about 180-900 Hz).
- Use different BPM ranges for different states (boat mode should be noticeably different).
- Keep SFX short (under 500ms) and envelope-shaped to avoid clicks.

## Script

Run:

```bash
node skills/game-music-generator/scripts/build_music_profile.js
```

Generated file:

- `skills/game-music-generator/references/music-profile.json`

Use that JSON as tuning guidance in game code; inline values into the runtime if file loading is unnecessary.
