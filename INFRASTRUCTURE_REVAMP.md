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

#### Phase 1A (implemented now)
- Add standard npm quality scripts.
- Add dependency-free lint/format guard scripts using Node.
- Add smoke tests using Node's built-in test runner.
- Add CI workflow that runs these checks on push/PR.

#### Phase 1B (next step, when package registry access is available)
- Replace custom lint checks with ESLint rules.
- Replace custom format checks with Prettier checks.
- Move smoke tests to Vitest (or keep Node test runner if preferred).

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
