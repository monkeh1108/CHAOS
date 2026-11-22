# CHAOS development rules

CHAOS is an independent 11-on-11 browser football game. See `CHANGELOG.md`
for release history.

## Working on the game

- Work on approved tasks. Preserve established physics, controls, blocking,
  and pursuit unless the task asks to change them.
- Diagnose and reproduce a failure before modifying source. Add a focused
  regression test for each actual bug when feasible.
- Explain what the tests prove and which behaviors still need verification.
  Synthetic fixtures alone cannot establish natural 22-player gameplay behavior.
- Temporary notification labels help with debugging. Animation should make
  final football behavior readable.
- Open pull requests for owner review. The owner merges PRs. Never auto-merge
  or push to `main`.
- Deployment, CI workflows, approved tasks, credentials, and agent
  instructions require explicit owner authorization to edit.

## Source layout

- `src/engine.js` wires the headless match API and its subsystems.
- `src/core/` holds shared math and tuning. `src/sim/`, `src/ai/`, and
  `src/physics/` hold match rules, AI decisions, and contact physics.
- `src/input/` handles commands. `src/ui/` and `src/render/` handle
  browser interaction and presentation. Keep diagnostic output in `src/debug/`.
- Keep the simulation independent of browser APIs and wall-clock reads.
  Use the match's seeded random state and pass time through the tick API.
- `tests/unit/`, `tests/integration/`, `tests/golden/`, and
  `tests/browser/` hold policy, gameplay, snapshot, and browser checks.

## Build and verify

Edit `src/` and rebuild the committed `index.html` with `npm run build`.
Run `npm run build:check` or its compatibility alias
`python build_standalone.py --check`. Use `npm run lint`, `npm test`,
and the relevant focused QA checks before proposing changes. Use
`npm run test:browser` for the full Playwright suite. Compare failures
with the recorded baseline in `docs/refactor/BASELINE.md`.
