# CHAOS Task 002 — Neutral-runner rear push refinement

## Preconditions
PR #1 rear-contact improvement must be reviewed and merged to `main` before this task runs. If it is not on `main`, stop and report rather than recreating or duplicating its changes.

## User-observed behavior
During live playtesting of PR #1, rear tackles improved substantially, but a stationary runner with all movement controls released may still be nudged forward roughly 1–2 yards before being brought down. The runner should not generate leg drive from external pushes alone. Do not make every tackle an automatic stop.

## Scope
Inspect live carrier input neutrality, carrier velocity, external collisions, escape resistance, grip attachments, and pile momentum in `src/engine.js`, `src/tackle_escape.js` and related narrow modules. Determine whether movement input and physics momentum are incorrectly conflated, whether body-solver impulses accumulate, or whether contact settling is unrealistic.

## Acceptance criteria
1. When a runner receives the handoff, releases movement, and defenders converge, tackling occurs reliably without appreciable **unearned** forward driving; quantify before/after displacement, not an invented absolute yardage cap.
2. When the user intentionally drives forward, realistic positive yardage, grip breaks, and pile contest remain possible; no forced zero-velocity or silent teleport corrections.
3. Rear contact from 1/3/6/10 defenders, side/mixed hits, and ordinary unforced scrimmage plays are exercised; prevent stationary pile drift and sticky contact.
4. Preserve clear distinctions among defender-caused momentum, active carrier leg drive, forward impact impulse, and animation state.
5. Add/extend focused QA; explain tradeoffs and any remaining 1–2 yard movement.

## Mandatory engineering and safety constraints
- Read `AGENTS.md`, relevant existing source, current tests, and relevant development history before editing. Preserve existing controls, animations, play rules, and previously functioning mechanics.
- Work only on this task. No broad refactors, rewrites, new dependencies, policy/workflow edits, or automatic merge. Source lives in `src/`; regenerate `index.html` with `python build_standalone.py`.
- Reproduce the current behavior before correction where possible; add focused deterministic regression checks plus ordinary gameplay scenarios. Existing checks must remain meaningful: do not loosen, disable, or rewrite unrelated tests merely to get green status.
- Run `python build_standalone.py`, `python build_standalone.py --check`, new task tests, and related existing QA scripts. Report exact test commands/results and remaining uncertainties.
- Use review-only PR, with clear explanation of root cause, modified files, why the change is scoped, gameplay risks, and human playtesting steps. Do not edit `.github/`, `tasks/`, `AGENTS.md`, or credentials.
- A synthetic debug fixture alone is not proof that real 22-player play is correct.
