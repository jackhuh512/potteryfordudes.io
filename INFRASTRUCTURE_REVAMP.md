# Infrastructure Revamp Plan

This document records expert feedback on the current repository infrastructure and defines a practical improvement path.

## Current State Assessment

### What is already good
- Extremely low setup friction: open `index.html` and play.
- Simple static deployment through GitHub Pages.
- Clear, commented UI layout and styling.

### Key issues
- Game logic is in a single large `script.js` file, which increases maintenance and regression risk as features grow.
- No automated quality gates (linting, formatting, tests) to catch defects early.
- No standard package scripts for consistent local and CI workflows.
- Gameplay/content configuration is tightly coupled to runtime code.

## Verdict
The infrastructure is efficient for rapid prototyping, but not yet efficient for sustainable feature development and safe iteration.

## Improvement Phases

### Phase 1 (Immediate): Safety net without major rewrites
**Goal:** Add guardrails while preserving current architecture.

- Add linting (ESLint).
- Add formatting standards (Prettier).
- Add a basic CI workflow that runs lint + format check + tests.
- Add a smoke test that verifies core project wiring and game entry points.

### Phase 2: Modularization by responsibility
Split `script.js` into small modules:
- `src/core/gameLoop.js`
- `src/core/state.js`
- `src/systems/input.js`
- `src/systems/render.js`
- `src/systems/audio.js`
- `src/content/levels.js`
- `src/content/musicProfile.js`

### Phase 3: Type safety and scalability
- Introduce TypeScript incrementally, starting with state/config types.
- Establish architecture boundaries between content, systems, and state transitions.

### Phase 4: Game-dev productivity tools
- Add debug overlays (FPS, entity counts, optional hitboxes).
- Add deterministic debug mode/seed for reproducible bug reports.
- Add lightweight telemetry for balancing insights.

## Immediate Action (implemented now)
This repository now begins with **Phase 1**:
- Tooling setup for linting/formatting/testing.
- CI quality checks before deployment.
