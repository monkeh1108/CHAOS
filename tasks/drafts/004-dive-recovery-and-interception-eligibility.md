# CHAOS Task 004 — Dive recovery and interception eligibility

## User-observed behavior
Diving tackles appear repeatable very quickly, and a defender seemed able to stand up and intercept a pass immediately after diving. The latter is an observation requiring reproduction, not a confirmed engine bug.

## Scope
Audit committed dive initiation, airborne contact, landing, missed dives, stumbles, ground/rise animation, recovery/stand-up timing, tackle eligibility, swat/INT/ball-play eligibility, and buffered button inputs. Distinguish user-controlled defender and CPU defender.

## Acceptance criteria
1. A committed missed dive has a believable visible recovery; repeated button presses cannot cancel or skip its necessary physical recovery.
2. A landing/partial stumble may recover differently from a fully grounded missed dive; preserve reasonable athletic variation by existing attributes and states. Avoid fixed arcade lockout with no corresponding physical state.
3. While truly grounded or unable to contest the ball, defender cannot initiate an implausible interception; after actual recovery and valid positioning, interceptions remain possible.
4. A good committed diving tackle still works and is not arbitrarily penalized; defensive movement/controls remain responsive after recovery.
5. Add focused QA for dive spam, missed dive then re-dive, diving tackle, grounded pass arriving, and legitimate interception after recovery. Provide observed times/state transitions rather than promising a particular delay without measuring.

## Mandatory engineering and safety constraints
- Read `AGENTS.md`, relevant existing source, current tests, and relevant development history before editing. Preserve existing controls, animations, play rules, and previously functioning mechanics.
- Work only on this task. No broad refactors, rewrites, new dependencies, policy/workflow edits, or automatic merge. Source lives in `src/`; regenerate `index.html` with `python build_standalone.py`.
- Reproduce the current behavior before correction where possible; add focused deterministic regression checks plus ordinary gameplay scenarios. Existing checks must remain meaningful: do not loosen, disable, or rewrite unrelated tests merely to get green status.
- Run `python build_standalone.py`, `python build_standalone.py --check`, new task tests, and related existing QA scripts. Report exact test commands/results and remaining uncertainties.
- Use review-only PR, with clear explanation of root cause, modified files, why the change is scoped, gameplay risks, and human playtesting steps. Do not edit `.github/`, `tasks/`, `AGENTS.md`, or credentials.
- A synthetic debug fixture alone is not proof that real 22-player play is correct.
