# CHAOS — PR #5 Follow-up: Defensive Systems Refinement

**Status:** Review-only repair request for the EXISTING Task 011 pull request. Do not merge PR #5 yet. Do not submit as a new `tasks/approved` assignment unless the maintainer explicitly chooses a separate task.

## Grounded playtest findings

- Outside Stretch / outside pursuit is **noticeably better** on PR #5 than before. Preserve these improvements.
- Defenders recognize and pursue cross-field reversals, but the ball carrier can retreat 2–3 yards, traverse the field, and round defenders with little resistance.
- Defenders approach and visibly extend their arms, but routinely miss without meaningful contact. Do not assume that the problem is absence of tackle animation or awareness.
- Throwing Slant and Go early, while the receiver is making the slant cut, can produce excessive yards after catch because coverage-to-ball and catch-to-pursuit transitions fail to close realistic lanes.
- Existing regression tests pass, but scenario coverage and behavioral assertions do not establish that these exploits are resolved.

## Relevant code entry points inspected in Review 5

- `src/engine.js`: `steer`, `pursuitAim`, `runContainmentAim`, `pursuitAI`, `chooseDefenderCommitment`, `defenderAI`, and the coverage/ball-in-flight transition paths.
- `src/pursuit_reaction.js`: sampled velocity reads and close-range observed movement, subject to reaction delays.
- `src/run_pursuit_policy.js`: outside leverage, cutback / retreat and role-specific angle policy.
- `src/tackle_intelligence.js`, `src/tackle_reengagement.js`, `src/tackle_escape.js`, `src/contact_evidence.js`, `src/anatomy_hitboxes.js`, `src/square_contact.js`, and related contact/outcome modules: inspect only as required to explain failed tackle contact. Do not indiscriminately rewrite them.

## Required investigation — instrument before modifying

Collect replayable per-defender traces of: defender/runner positions and velocities; speed, agility, awareness, pursuit and tackling ratings; intent and pursuit target; observed-velocity age; role / leverage assignment; separation; relative closing velocity; facing and turn error; contact radius and anatomical overlap; tackle selection / reach timing; whether eligibility was checked; and whether contact or miss was registered. Log only useful diagnostics under a development flag, with minimal production overhead.

Distinguish: (A) chasing an unreachable interception point; (B) last-second oversteer / overshoot; (C) tackle chosen too early or late; (D) arm-reaching visuals without valid contact; (E) legal contact that fails because of grip, timing or physics; (F) lack of other defenders sealing the escape lane. Report evidence for each identified cause.

## Repair requirements

1. **Reachable pursuit and angle updates:** Replan on observed direction changes, not hidden play calls or perfect knowledge. Use realistic closing-time and turning constraints. Defenders should position ahead / outside the ball carrier when feasible, rather than all targeting the same instantaneous point.
2. **Open-field tackle approach:** For defenders with a plausible contact opportunity, support controlled footwork, lateral positioning and appropriate deceleration without making every defender slow down in a chase. Respect mass, acceleration, agility, speed, momentum and fatigue. Preserve meaningful differences between athleticism and tackling technique.
3. **Tackle selection / physical contact consistency:** Verify the timing and range of reaching, wrapping, diving, and hit-stick actions. Reconcile visible reaching with actual anatomical contact and legal eligibility. Do not create proximity-based automatic tackles, extend invisible tackle radii or introduce teleporting/snapping.
4. **Multi-defender coordination:** Distinguish first contain/force defender, inside pursuit and backside/last-line support. Allow natural lane-closing based on visible threat and assignments. Avoid perfectly synchronized or omniscient defenders.
5. **Quick-pass and YAC transition:** For early Slant and Go throws and comparable quick completions, measure recognition of release / ball flight, actual ability to see the ball, arrival at catch location, transition into pursuit, and first 3–10 yards after catch. Avoid instant omniscient break-on-ball and undeserved interceptions. Maintain rating-dependent recognition and coverage techniques.
6. **Preserve PR #5 gains:** Outside Stretch and kickoff containment improvements must remain demonstrable. Preserve Task 001 rear-contact pile behavior, player controls, receiver icons, stamina, speed caps, animation/physics separation and existing tackle mechanics.

## Deterministic gameplay QA (run before/after, with quantitative traces)

- **Cross-field reversal:** Interior run near left hash → retreat ~2–3 yards → traverse toward opposite sideline → cut upfield. Assert that defenders update interception paths and that a physically reachable defender gets a real chance to contest the route, without guaranteeing a tackle.
- **Sideline outside stretch:** Multiple left/right formations, good and poor pursuit-rated defenders. Quantify initial leverage, containment preservation, separation, misses and yards; do not assume every run must fail.
- **Quick-slant YAC:** Release on the slant cut of Slant and Go, plus a routine slant. Check ball recognition, catches, recovery position, transition delay and open-field tackle opportunities. Compare defenders with/without line of sight and high/low recognition ratings.
- **Near-contact misses:** Fast lateral jukes, straight-line approach, trailing pursuit, two defenders arriving at offset times, diving tackle, and stationary carrier. Record contact eligibility and physics outcomes—not merely animation labels.
- **Kickoffs:** Return up middle and two sidelines; test lane assignments and re-aim when the returner redirects.
- **Baseline regressions:** All existing JS/Python tests; standalone build; rear pile, QB possession indicator, icon visibility, player sprint, elite breakaway success, low-skill defender mistakes. A passing test suite alone is insufficient: attach concise scenario measurements.

## Constraints and deliverables

- Surgical fixes with clear code explanations; no arbitrary global speed nerfs/buffs or universal defense reaction boosts.
- Explicit measurable before/after summaries plus a reviewable PR patch.
- If a defect requires scope expansion outside pursuit/steering/tackle/contact/coverage transitions, document the evidence and seek approval rather than silently broadening.
- Keep PR #5 open for a human gameplay review. **PR #3 QB intelligence remains unmerged** and should not be included accidentally.

---

## Review 6 playtest addendum — REQUIRED follow-up (2026-11-21)

The prior refinement produced a measurable improvement to outside stretch and pass YAC, but the following **new human-observed regressions/exploits remain**. Treat them as high-priority acceptance criteria for the *next* PR #5 refinement pass. Keep all improvements already landed in PR #5, especially ordinary outside-stretch recognition/containment.

### A. Kickoff cross-field reversal: correct cutoff angle abandoned within tackle range

**Reproduction:** On a kickoff return, carry toward one side, reverse laterally across the field and attempt to break to the opposite sideline. In the Review 6 playtest, even the kicker correctly approached on an angle that would intercept the runner, but at approximately 1–2 yards of separation the defender noticeably slowed, drifted behind the runner, and missed the tackle. A wide-open return touchdown remained possible.

**Investigate:** The exact per-frame switch from pursuit/lead target selection into tackle approach, braking/steering, reach/wrap eligibility, and collision resolution. Instrument the defender's velocity, target intercept point, closing speed, relative angle, deceleration trigger, phase changes, tackle initiation and nearest body-to-body distance. Determine whether the close-range behavior *overwrites* a good interception target, brakes prematurely, or steers toward the runner's previous position. Do not infer which bug is present before reproducing.

**Expected:** A defender with an achievable cutoff angle maintains viable leverage while adjusting speed only as needed to make contact. A good-angle defender must not automatically become a trailing defender merely by entering tackle range. Runner footwork and ratings can still beat defenders; tackle attempts must require real spatial eligibility and honest momentum.

**Tests:** Seed repeatable kickoff reversal scenarios including kicker and multiple coverage players; test left-to-right and right-to-left, several runner/defender speed and agility combinations. Measure target-to-runner geometry at 3 yd, 2 yd, 1 yd, approach-angle retention, tackle opportunities, missed-contact causes, and outcome distribution. Compare *before and after* on the same seeds. Also verify existing ordinary outside-stretch containment does not regress.

### B. CPU-controlled one-on-one deep pass: tackles the receiver instead of contesting airborne ball

**Reproduction:** User-controlled defense, CPU-controlled defensive back in one-on-one coverage. Opposing quarterback throws a roughly 40-yard 50/50 jump ball. In Review 6, defender appeared to chase/prepare to tackle the target rather than attempt a feasible airborne-ball play; receiver caught it and scored after the catch. This was a **CPU defender** (not the user's currently controlled player).

**Investigate:** In-flight ball state and predicted arrival, defender perception/line of sight, reachability and timing, defensive receiver-vs-ball commitment decision, interception/swat/play-receiver eligibility, and transitions from contested pass to post-catch pursuit. Identify whether tackle intent activates while a legitimate in-flight contest is still possible. Trace whether the defender has access to ball trajectory but ignores it, or fails to recognize eligibility.

**Expected:** CPU DBs with realistic view, reachable ball position and available response window can attempt the ball (INT or swat) or legally contest the receiver based on position, ball skills, awareness, timing and risk. A defender who cannot possibly reach the ball may prepare for the tackle after the catch; they should not get perfect information, auto-interceptions, magnetized catches, impossible jumps or automatic knockdowns. Preserve user-controlled defender inputs and their manual X/A/Y semantics exactly.

**Tests:** One-on-one seeded 35–45-yard 50/50 throws with both reachable and unreachable ball paths, varied awareness/ball-skill ratings, both high- and low-quality positioning, early-vs-late ball recognition, and complete post-catch fallback. Assert reachable defenders *consider and attempt* a legitimate ball contest under appropriate conditions and that impossible defenders never teleport or auto-play. Include intermediate decision logs and before/after outcome comparisons. Check no regression to QB indicator, offensive passing icons, manual defense controls, kickoffs, and existing QA tests.

### Mandatory output for this addendum

1. Reproduce both findings in executable scenario tests before modifying source; distinguish geometry/phase-switch defects from animation-only symptoms.
2. Apply focused fixes to existing PR #5, *not* a new PR. Keep the fix constrained to pursuit-to-contact and CPU aerial pass coverage transitions.
3. Run the complete JS QA suite, `python build_standalone.py`, and `python build_standalone.py --check`. Add deterministic regression QA for both new issues. Print concise baseline and updated measurements.
4. If either issue cannot be fixed safely in one pass, explain the remaining gap accurately. Do not describe a pass merely because a test checks a helper function without exercising live gameplay.
5. Do not touch Task 013, PR #3, approval-task selections, workflow code, or protected files. Never merge automatically.
