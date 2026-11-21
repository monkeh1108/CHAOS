# CHAOS — APPROVED DEVELOPMENT TASK 001
## Comprehensive Rear Tackling, Contact Eligibility, and Gang-Tackle Physics Investigation

**Project:** CHAOS — Independent American Football Simulation  
**Working baseline:** v0.36.4w  
**Priority:** CRITICAL — Foundational Gameplay  
**Authorization:** Approved for investigation, targeted correction, and a review-only pull request  
**Scope:** Contact detection, tackling eligibility, defensive tackling decisions, grips, collisions, gang tackles, and pile physics.

---

# 1. UNDERSTAND THE PROJECT BEFORE WRITING CODE

CHAOS is an independent football game intended to blend:

- The strategic depth and authentic football behavior of a serious simulation.
- The physical creativity and athletic spectacle of an arcade football game.
- Original, unpredictable outcomes emerging from physics and player behavior.
- Individual player abilities, personalities, physical builds, tendencies, and decision-making.
- Dark humor and extreme athletic moments where appropriate to the game's eventual identity.

The game is not intended to reproduce another company's proprietary gameplay code, assets, animations, or presentation.

**Fundamental philosophy:**

Every player is an individual. Every action has consequences. Every interaction must have a physically and logically understandable explanation.

CHAOS is intended to become a complete football game, not merely a physics demonstration.

### Critical development principles

1. Football behavior must be believable before spectacle is added.
2. AI determines intention; physics determines physical outcomes.
3. Animations should communicate actual gameplay events rather than independently decide outcomes.
4. Players must not possess impossible knowledge of other players' positions, intentions, or actions.
5. Ratings and physical characteristics must create meaningful player differences.
6. Contact, failed tackles, successful tackles, and broken tackles are separate outcomes.
7. No arbitrary animation locks, guaranteed outcomes, or invisible force corrections should conceal faulty simulation behavior.
8. A fix that solves one problem but damages another system is not considered successful.
9. Preserve working functionality through narrow, testable modifications.
10. Automated test success does not automatically establish realistic gameplay.

The developer must consider these principles throughout the assignment.

---

# 2. REQUIRED CONTEXT REVIEW

Before changing gameplay code, inspect the existing repository.

Read the following where available:

- `AGENTS.md`
- `README.md`
- `CHANGELOG.md`
- Relevant `QA_v0364*.md` reports
- Source modules relating to player movement and momentum
- Anatomical hitbox and collision systems
- Tackling and tackle-intelligence modules
- Grip attachment and tackle-escape systems
- Defensive pursuit and reaction systems
- Blocking and recovery logic
- Gang-tackle and pile-support behavior
- Kickoff and scrimmage gameplay update paths
- Standalone build instructions
- Existing automated gameplay tests
- Available CHAOS design documentation

Do not assume that a module's name accurately describes its complete behavior. Trace actual call sites and execution order.

If a referenced document is unavailable, report its absence rather than inventing its contents.

### Context preservation requirement

Before modifying code, establish:

- What the affected system is intended to do.
- Why it was originally implemented.
- Which previous versions modified it.
- Which existing tests cover it.
- Which other gameplay systems depend on it.
- Whether the current implementation conflicts with the intended design.
- Which assumptions remain unverified.

Preserve these findings in the pull request explanation.

---

# 3. HISTORICAL DEVELOPMENT CONTEXT

The following summary comes from previous CHAOS development sessions and human gameplay testing.

It must be treated as historical context, not unquestionable proof of current source behavior.

## v0.36.4o — Tackle Escape Foundation

Introduced a more continuous contest between the running back's effort to escape and the defender's ability to maintain a tackle.

Important concepts included:

- Grip strength and security.
- Ball-carrier leg drive.
- Relative momentum.
- Physical leverage.
- Strength and tackling ability.
- Balance and fatigue.
- Escaping before or after a grip becomes established.

A failed defensive grip must not automatically result in an unrealistic fall.

## v0.36.4p — Escape Reactions

Refined how defenders respond after losing a tackle.

Possible outcomes included:

- Slipping off the runner.
- Staggering.
- Twisting.
- Losing balance.
- Being dragged.
- Continuing pursuit.

The goal was to replace simplistic reactions with physical consequences.

## v0.36.4q — Lower-Body Contact

Expanded lower-body collision handling and introduced distinctions between:

- Minor foot or ankle contact.
- Balance disruption.
- Stumbling.
- Tripping.
- Hurdling or stepping over low contact.

Not every touch of a player's legs should produce a stumble.

## v0.36.4r — Tackle Intelligence

Refined defensive tackle intentions and directional behavior.

The difference between a standing wrap, committed dive, hit-stick attempt, and ordinary pursuit matters.

A defender should not repeatedly launch into a runner merely because the runner is nearby.

## v0.36.4s — Tackle Reengagement

Introduced protections against defenders instantly establishing another grip after a successful broken tackle.

However, later testing suggested these protections could also interfere with legitimate reengagement.

The correct behavior must preserve both:

- Earned separation after a broken tackle.
- Legitimate future tackling opportunities after recovery and renewed physical contact.

## v0.36.4t — Pursuit and Truck Feedback

Introduced rating-sensitive close-pursuit observation delays.

This was intended to prevent defenders from perfectly mirroring every sudden cut.

The update also distinguished trucking feedback from stumbling feedback.

Subsequent testing exposed serious crowd-contact and tackle-completion problems.

## v0.36.4u — Contact Recovery

Attempted to correct cases where defenders became unable to tackle stationary runners from behind.

The update also addressed kickoff returner role transitions.

Human testing continued to demonstrate severe rear-tackling failures.

## v0.36.4v — Contact Evidence and Pile Repair

Investigated cases where collision separation could occur before anatomical contact evidence was fully recognized.

Controlled tests showed improvement in grouped rear-contact situations.

However, human gameplay demonstrated that the original issue had not been completely resolved.

## v0.36.4w — Rear Tackle and Safety Intelligence Refinement

Investigated stale blocking penalties and defenders failing to establish valid rear tackles.

Also addressed deep safeties remaining committed to coverage too long after a confirmed handoff.

Controlled regression tests passed.

**Important:** The continued existence or complete elimination of the rear-pile defect in v0.36.4w has not been conclusively established through sufficient human gameplay.

Do not assume this latest build is free of the problem.

---

# 4. PRIMARY REPORTED DEFECT

Multiple defenders can repeatedly make contact with a nearly stationary ball carrier from behind while failing to establish or complete legitimate tackles.

In these situations, the carrier can be physically pushed around the field by the defending team.

The crowd may continue moving while individual defenders repeatedly attempt dives or lunges.

The runner sometimes becomes tackleable only when another defender approaches from a different angle, particularly the front.

This is unacceptable as routine gameplay behavior.

### Reported scenario A — Kickoff

The user controls a kickoff returner and stops moving.

Multiple defensive players approach from behind.

Approximately five or six defenders initially crowd the running back.

Additional defenders join the contact.

Repeated lunges, dives, and body collisions occur without effective tackle completion.

The carrier is gradually pushed around the field.

Eventually a defender approaching from another direction can secure the tackle.

### Reported scenario B — Outside Zone

The ball carrier runs an Outside Zone play and stops around the 45-yard line.

Approximately three defenders make sustained rear contact.

The carrier is pushed approximately 25 yards without a completed tackle.

This strongly suggests the underlying defect is shared by scrimmage and special-teams gameplay, although the precise cause has not been proven.

---

# 5. MANDATORY ROOT-CAUSE INVESTIGATION

Do not begin by assuming the gang-tackle system is the primary cause.

Investigate the entire sequence that converts defensive movement into physical contact and then into a possible tackle.

The following systems must be examined together.

## A. Collision detection

Determine how the engine recognizes contact between the runner and a defender.

Examine:

- Contact distances.
- Anatomical hit regions.
- Body orientation.
- Relative speed.
- Swept contact detection.
- Collision overlap and penetration.
- Contact persistence between physics frames.

Determine whether collision evidence can disappear or become invalid during collision resolution.

## B. Collision resolution and force transfer

Investigate whether repeated crowd collisions inject unrealistic momentum into the runner.

Determine whether:

- Multiple defenders continuously apply forward impulses.
- Player separation creates artificial forward movement.
- Overlapping players produce repeated positional corrections.
- Pile forces are applied without actual restraining grips.
- Momentum is effectively added more than once.
- The runner is being pushed out of the front of the crowd.

Do not remove legitimate momentum transfer.

Correct invalid force accumulation at its source.

## C. Tackle eligibility

Trace every condition that can prevent a defender from initiating or establishing a tackle.

Investigate:

- Blocking penalties.
- Recovery states.
- Previous broken-tackle cooldowns.
- Dive follow-through.
- Defender orientation.
- Contact angles.
- Tackle reach.
- Relative movement.
- Existing tackle attachments.
- Special-teams or scrimmage restrictions.

For every rejected tackle attempt, the engine should be capable of reporting the specific eligibility reason during testing.

## D. Grip establishment

Determine whether physically valid contact is failing to establish grips.

Investigate:

- Placement quality.
- Reach.
- Grip initiation.
- Contact duration.
- Initial grip security.
- Grip persistence.
- Release conditions.
- Defensive recovery after failed attachment.

A defender making genuine contact may fail a tackle, but that failure should have an identifiable physical or mechanical cause.

## E. Gang-tackle formation

Examine how multiple defenders contribute to a running back's movement and balance.

Determine:

- Whether defenders must already possess established grips to participate.
- How additional defenders join an existing tackle.
- How conflicting forces combine.
- How tackle leverage changes during a pile.
- Whether a runner can be unintentionally accelerated through the crowd.
- Whether multiple valid grips can fail to trigger tackle progression.
- Whether the pile becomes stuck in an incomplete physical state.

A standing pile must not function as an uncontrolled momentum generator.

## F. Defensive decision-making

Inspect how defenders choose between:

- Pursuing.
- Standing wrap.
- Diving tackle.
- Hit-stick attempt.
- Recovery.
- Reengagement.
- Support of an existing tackle.

Defenders should not repeatedly initiate desperate dives against a nearly stationary runner when a standing wrap would be the more appropriate football decision.

Their decisions must remain influenced by player ratings, positioning, awareness, and actual gameplay state.

---

# 6. REQUIRED REPRODUCTION SCENARIOS

Create deterministic or repeatable tests using the actual game engine wherever practical.

Do not rely exclusively on isolated unit tests.

Required scenarios:

1. One defender approaching a stationary runner from behind.
2. Three defenders approaching a stationary runner from behind.
3. Six or more defenders surrounding a stationary runner.
4. A moving runner being caught from directly behind.
5. A runner who breaks one grip and remains within reach of another defender.
6. A defender recovering from a missed dive.
7. A defender recovering from an offensive block.
8. A runner attempting to drive through multiple established grips.
9. A normal Outside Zone running play.
10. A kickoff return with several coverage defenders converging.

### Required diagnostics

Record relevant information such as:

- Simulation timestamp.
- Player identifiers.
- Player position and velocity.
- Ball-carrier displacement.
- Defender tackle decision.
- Contact detection result.
- Anatomical contact location.
- Contact quality.
- Tackle eligibility.
- Rejection reason.
- Grip establishment and release.
- Collision impulse.
- Accumulated pile force.
- Defender recovery state.
- Tackle completion.
- Final ball-carrier outcome.

Instrument the simulation with temporary diagnostic output where appropriate.

Diagnostics must not alter physics outcomes.

### Before-and-after evidence

Reproduce at least one representative failure using the original baseline before modifying it.

Record measurable results.

Then run the same scenario against the corrected version.

If the exact problem cannot be reproduced, document that clearly and provide the investigation findings without claiming a confirmed correction.

---

# 7. REQUIRED PHYSICAL BEHAVIOR

## Legitimate rear tackles

Defenders approaching from behind must be capable of securing a runner through physically justified contact.

This may involve a body wrap, leg wrap, drag-down, or another appropriate contact outcome.

Rear contact must not create automatic invulnerability.

## Legitimate broken tackles

Running backs must retain the ability to break tackles when their physical advantages justify the outcome.

Strength, momentum, balance, technique, fatigue, and body positioning should matter.

Do not introduce predetermined outcomes.

## Realistic gang tackling

Multiple defenders should create resistance through genuine contact and established grips.

The running back may continue moving if his momentum and leg drive overpower the resistance.

Additional defenders must meaningfully contribute when positioned to do so.

Do not create a simple rule such as "three defenders always tackle the runner."

## Controlled pile movement

Piles may move forward, backward, sideways, or collapse.

However, the movement must emerge from actual physical forces.

Collision corrections must not create continuous unrealistic acceleration.

## Realistic failed tackles

A defender can miss, lose his grip, stumble, or fail to finish a tackle.

Those failures should result from identifiable physical conditions.

A miss must not automatically cause the defender to become permanently ineligible.

## Meaningful player individuality

Mass, height, strength, tackling, agility, balance, awareness, fatigue, and other existing attributes must continue influencing physical behavior.

Avoid making every defender equally effective.

---

# 8. PROTECT RELATED GAMEPLAY SYSTEMS

Tackling is interconnected with nearly every major system in CHAOS.

Before modifying shared collision, movement, or defensive logic, identify downstream effects.

Pay particular attention to:

- Offensive line blocking.
- Defensive line engagement.
- Running-back momentum.
- Sprinting and stamina.
- Acceleration and deceleration.
- Cutting and juking.
- Trucking.
- Stiff arms.
- Hit sticks.
- Diving attacks.
- Low-body contact.
- Stumbles and trips.
- Hurdles.
- Defensive pursuit.
- Player switching.
- Kickoff coverage.
- Return blocking.
- Receiver and defensive-back collisions.
- Tackling animations.
- Camera and playable presentation.

Do not rewrite these systems as part of this task.

When a proposed modification affects shared movement or contact code, identify and test the affected behavior.

---

# 9. DEVELOPMENT AND CODE-QUALITY RULES

Follow these requirements:

1. Investigate before editing.
2. Reproduce the failure before declaring a root cause.
3. Prefer narrow changes over broad rewrites.
4. Maintain source module boundaries where practical.
5. Preserve existing control mappings.
6. Keep physics authoritative over animations.
7. Preserve player ratings and individuality.
8. Avoid hardcoded outcomes designed only to satisfy tests.
9. Never weaken existing assertions merely to make tests pass.
10. Keep diagnostics separate from physical outcomes.
11. Avoid adding unnecessary dependencies.
12. Do not modify repository secrets, agent approval policy, or GitHub workflows.
13. Do not modify unrelated gameplay systems.
14. Do not claim success without supporting test evidence.
15. Never automatically merge the resulting pull request.

If the necessary correction requires major architectural changes, stop after investigation and prepare a documented proposal for human approval.

---

# 10. TEMPORARY DEBUG FEEDBACK

CHAOS currently includes text-based feedback for actions such as:

- BREAK TACKLE
- TRUCK
- TRUCK HELD
- STUMBLE
- TRIPPED

These notifications are development diagnostics.

The long-term design is for players to recognize gameplay outcomes through animation, body movement, and physical interactions rather than intrusive text.

Do not expand the permanent gameplay notification system during this assignment.

Keep diagnostic feedback separate from the authoritative physics model.

Broad notification cleanup is outside the scope of this task.

---

# 11. REQUIRED REGRESSION TESTING

Test the corrected behavior against the relevant existing gameplay systems.

At minimum, verify:

- Valid rear tackles.
- Standing wraps.
- Committed diving tackles.
- Failed dives and recovery.
- Single-defender tackle escapes.
- Reengagement after broken tackles.
- Multiple-defender gang tackles.
- Legitimate forward pile movement.
- Stationary runner contact.
- Offensive blocking interactions.
- Defensive contact eligibility.
- Low-body contact.
- Stumbles and trips.
- Hurdles.
- Trucking.
- Kickoff tackle interactions.
- Normal offensive running plays.
- Standalone HTML build consistency.

Run the existing QA suite where supported.

Document:

- Tests that passed.
- Tests that failed.
- Tests that were skipped.
- Tests that were nondeterministic.
- Environmental limitations.
- Remaining suspected bugs.

Do not conceal failures.

---

# 12. REQUIRED PULL REQUEST DELIVERABLES

Submit a review-only pull request with the following sections.

## A. Investigation summary

Explain the bug, how it was reproduced, and what source code was responsible.

## B. Root-cause analysis

Identify the actual cause with relevant file references, functions, and execution paths.

Separate confirmed findings from hypotheses.

## C. Changes implemented

Explain exactly what changed and why.

Describe how the modification preserves previous functionality.

## D. Before-and-after results

Provide measurable reproduction results using the same scenario.

## E. Regression testing

Summarize all relevant automated test results.

## F. Remaining limitations

Identify behaviors not conclusively validated.

## G. Human gameplay validation

Provide a concise manual testing plan involving:

- Stationary kickoff returner.
- Stationary Outside Zone runner.
- Rear-contact tackling.
- Multiple-defender pile.
- One-on-one broken tackles.
- Running back attempting to drive through a gang tackle.

## H. Recommended next steps

Identify future improvements separately from the current correction.

Do not implement unrelated recommendations without approval.

---

# 13. FINAL ACCEPTANCE CRITERIA

The task is ready for human review only when:

- A representative version of the reported bug has been reproduced.
- The underlying cause has been identified with evidence.
- The fix addresses the cause rather than merely hiding the symptoms.
- The stationary ball carrier can be tackled through legitimate physical contact.
- Multiple defenders can establish meaningful combined resistance.
- Unrealistic repeated crowd pushing is reduced or eliminated in the reproduced scenario.
- Legitimate broken tackles remain possible.
- Relevant existing regression tests pass, or failures are documented.
- The project remains buildable.
- All code changes are clearly explained.
- No unrelated gameplay changes have been introduced.
- A review-only pull request is created.

The coding agent must not merge its own work.

The project owner retains final authority over gameplay decisions, source integration, and release readiness.

---

# 14. DEVELOPMENT PHILOSOPHY

CHAOS must not become a game where a defender wins because a hidden script decided it was time for a tackle.

Nor should a running back become untackleable because several physics subsystems fail to coordinate.

A runner may overpower one defender, drag two others, or drive a pile forward.

A defender may secure a difficult rear tackle, lose his grip, or fail because of poor technique.

Every result should emerge from believable interactions between human decision-making, physical attributes, momentum, anatomy, and contact.

**The goal is not merely to make the game function.**

**The goal is to build a football simulation whose behavior makes sense, remains internally consistent, and becomes more believable with every approved improvement.**

CHAOS — Leave It All on the Field.
