# CHAOS Task 005 — Indirect contact & collapse physics foundation (phase 1)

## Preconditions
Only begin after earlier physics task PRs are reviewed/merged, and when the owner explicitly approves this task. This is a **limited foundation**, not an instruction to implement the whole animation/trait vision.

## User design requirements
On inside runs, a defender may blow a blocker backward into the ball carrier; force and momentum should transfer through the bodies. A runner can stumble or fall from a sufficiently strong indirect impact, even without direct defensive wrapping. Simple congestion, overlap, or being surrounded must **not** trigger an automatic fall. Running into a stationary, unengaged teammate should normally slow/deflect rather than force a takedown, with plausible rare high-energy loss-of-balance outcomes.

## Scope
First inspect collision order, mass/momentum, blocking and planted states, body constraints, low contacts and ground transitions. Implement only a narrow contact-evidence and physical balance response compatible with existing solver. Do not implement procedural arm animations in this task.

## Acceptance criteria
1. Distinguish (a) unengaged stationary teammate collision, (b) blocked lineman driven backward into runner, and (c) multi-body collapse with real impulses.
2. Each response depends on measured relative velocity, collision normal/impulse, stability, balance, existing attributes, and grounded bodies. No random fall roll, proximity-only fall, invisible force, or guaranteed scripted outcome.
3. Low-energy contact causes realistic speed loss/redirection, substantial contact can produce stagger, and truly destabilizing impacts can produce fall *without claiming defensive down-by-contact when no defender caused it*. Apply football down rules correctly with developer-documented choice.
4. Avoid amplifying prior rear-push bug; no unearned pile acceleration, no ordinary lineman congestion causing frequent falls.
5. Add deterministic positive/negative and multi-contact tests; document actual source of force and animation limitations. If current architecture cannot safely support this in scope, produce diagnostics and a clear next-phase plan rather than forcing a brittle implementation.

## Mandatory engineering and safety constraints
- Read `AGENTS.md`, relevant existing source, current tests, and relevant development history before editing. Preserve existing controls, animations, play rules, and previously functioning mechanics.
- Work only on this task. No broad refactors, rewrites, new dependencies, policy/workflow edits, or automatic merge. Source lives in `src/`; regenerate `index.html` with `python build_standalone.py`.
- Reproduce the current behavior before correction where possible; add focused deterministic regression checks plus ordinary gameplay scenarios. Existing checks must remain meaningful: do not loosen, disable, or rewrite unrelated tests merely to get green status.
- Run `python build_standalone.py`, `python build_standalone.py --check`, new task tests, and related existing QA scripts. Report exact test commands/results and remaining uncertainties.
- Use review-only PR, with clear explanation of root cause, modified files, why the change is scoped, gameplay risks, and human playtesting steps. Do not edit `.github/`, `tasks/`, `AGENTS.md`, or credentials.
- A synthetic debug fixture alone is not proof that real 22-player play is correct.
