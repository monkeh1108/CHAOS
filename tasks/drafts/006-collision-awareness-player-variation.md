# CHAOS Task 006 — Player-aware collisions & sidestep decisions (phase 2)

## Preconditions
Only begin after phase-1 indirect collision implementation is manually playtested, accepted, and merged into `main`. If phase-1 interfaces are absent, stop.

## User design requirements
Two running backs meeting the same stationary blocker at the same speed can respond differently because of their awareness, vision, agility, balance, strength, body size, and momentum. A perceptive runner may sense an obstacle early and redirect around a blocker or brace a hand against a shoulder/back; a less aware runner may collide directly and stumble or occasionally fall if actual impact justifies it. Ratings shape anticipation and physical capabilities, not magic avoidance or arbitrary outcomes.

## Scope
Implement a bounded pre-contact obstacle recognition/steering response for ball carriers, constrained by true visibility, angle, reaction window, input intent, nearby open space, and ratings already supported by the player model. Respect user input: never auto-override a deliberately chosen path without clear design reason. Use existing animations or readable state cues only; full new procedural hand-placement animation is a future separate task unless existing hooks already support it safely.

## Acceptance criteria
1. Higher awareness/vision should provide earlier opportunity to react, but successful sidestep still requires real space/agility; lower awareness may contact later.
2. Player's actual contact force and balance, not a probabilistic stat check alone, determines stumbling/falling.
3. No ghost sliding through blockers, automatic pathfinding boosts, frame-perfect psychic detection, or sudden velocity changes.
4. Test high/low awareness × high/low agility, blocked/no-gap vs open-gap, neutral and user-directed controls, low/high approach speed, and compatibility with indirect collision physics.
5. Provide human visual test checklist and clear limits of current animations.

## Mandatory engineering and safety constraints
- Read `AGENTS.md`, relevant existing source, current tests, and relevant development history before editing. Preserve existing controls, animations, play rules, and previously functioning mechanics.
- Work only on this task. No broad refactors, rewrites, new dependencies, policy/workflow edits, or automatic merge. Source lives in `src/`; regenerate `index.html` with `python build_standalone.py`.
- Reproduce the current behavior before correction where possible; add focused deterministic regression checks plus ordinary gameplay scenarios. Existing checks must remain meaningful: do not loosen, disable, or rewrite unrelated tests merely to get green status.
- Run `python build_standalone.py`, `python build_standalone.py --check`, new task tests, and related existing QA scripts. Report exact test commands/results and remaining uncertainties.
- Use review-only PR, with clear explanation of root cause, modified files, why the change is scoped, gameplay risks, and human playtesting steps. Do not edit `.github/`, `tasks/`, `AGENTS.md`, or credentials.
- A synthetic debug fixture alone is not proof that real 22-player play is correct.
