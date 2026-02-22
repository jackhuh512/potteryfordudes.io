# potteryfordudes.io

A tiny browser game experiment by **Isaac Huh**.

## Purpose of this project

**potteryfordudes.io** is a mini project Isaac created to explore what happens when a game is built through pure vibe coding with Codex.

The process is intentionally unconventional:

- Every pull request is created by Codex.
- Every pull request is merged with no human review.
- The workflow runs on trust and curiosity.

This project exists as a public experiment in AI-assisted creation—both the upside and the downside. The goal is to learn in the open: what AI can accelerate, what quality risks appear, and what this style of development feels like in practice.

## A little about Isaac and “potteryfordudes”

Isaac started an Instagram account called **potteryfordudes**.

The concept came from a simple observation: many people buying ceramics (or interested in making ceramics) seemed to be women. This stood out even more when Isaac visited a maker's market with his wife and noticed most ceramics were being purchased by women, sometimes with a disinterested or reluctant boyfriend nearby.

That inspired him to make ceramics with a different vibe: pottery that's less "cute and aesthetic" and more straightforwardly **for the dudes**.

## How to start playing

1. Open `index.html` in your browser.
2. In the start menu, choose a difficulty.
3. Click **New Game**.
4. Walk up to dudes and press **E** to sell pottery.
5. Hit each level's sales target to advance through all 5 levels.

## Controls

- **Move:** `W`, `A`, `S`, `D` or Arrow Keys
- **Interact / Sell pottery:** `E`
- **Toggle boat mode:** `B`
- **Toggle music on/off:** `M`
- **Switch to next BGM set:** `N`
- **Toggle debug overlay:** `F3`
- **Toggle debug hitboxes:** `H` (only when debug mode is on)

## Thank you

If you played **potteryfordudes.io**, thank you.

Whether you stayed for 30 seconds or finished all 5 levels, you're part of this experiment and I appreciate you checking out this weird little AI + pottery + game-dev journey.

## Quality checks (Phase 1)

Run local guardrails before pushing:

- `npm run lint` — repository hygiene checks
- `npm run format:check` — newline / line-ending checks
- `npm test` — smoke tests for game wiring and loop hooks
- `npm run check` — run all of the above


## Phase 4 debug + telemetry tools

- Launch with `?debug=1` to enable deterministic debug mode and overlay by default.
- Optional URL params:
  - `seed=<number>` sets the deterministic RNG seed used for IRS tie-break decisions.
  - `hitboxes=1` enables hitboxes on load.
- Lightweight telemetry now tracks total sales, steps, and boat toggles for balancing.
