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
