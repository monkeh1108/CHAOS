# CHAOS Task 003 — CPU quarterback possession marker on defense

## User-observed behavior
When playing defense against a CPU pass, the CPU quarterback does not reliably show the existing visual indicator for the current ball carrier. The QB can be confused with the nearby blocking back.

## Scope
Trace possession and rendering states for live scrimmage, handoffs, QB holding ball, passing, scramble, sacks, fumbles, turnovers, and special teams. Find existing marker rendering and reuse its design; do not add unrelated UI or change targeting controls. Focus on renderer/engine integration only.

## Acceptance criteria
1. The visible possession indicator identifies the CPU QB **while he actually holds the ball** on a pass play, viewed by the human on defense.
2. Marker transitions to RB on handoff, disappears/leaves QB on pass release, follows live possession on fumbles/interceptions, and does not linger on non-carriers or merely eligible receivers.
3. Marker remains readable without hiding players or the ball and behaves correctly across camera states.
4. Regression tests for CPU QB presnap, post-snap dropback, scramble, release, and handoff; test an ordinary complete defensive series.
5. Preserve existing offense/user-selection indicators and render performance.

## Mandatory engineering and safety constraints
- Read `AGENTS.md`, relevant existing source, current tests, and relevant development history before editing. Preserve existing controls, animations, play rules, and previously functioning mechanics.
- Work only on this task. No broad refactors, rewrites, new dependencies, policy/workflow edits, or automatic merge. Source lives in `src/`; regenerate `index.html` with `python build_standalone.py`.
- Reproduce the current behavior before correction where possible; add focused deterministic regression checks plus ordinary gameplay scenarios. Existing checks must remain meaningful: do not loosen, disable, or rewrite unrelated tests merely to get green status.
- Run `python build_standalone.py`, `python build_standalone.py --check`, new task tests, and related existing QA scripts. Report exact test commands/results and remaining uncertainties.
- Use review-only PR, with clear explanation of root cause, modified files, why the change is scoped, gameplay risks, and human playtesting steps. Do not edit `.github/`, `tasks/`, `AGENTS.md`, or credentials.
- A synthetic debug fixture alone is not proof that real 22-player play is correct.
