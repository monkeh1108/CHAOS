# CHAOS — Task 007: Adaptive CPU Quarterback Intelligence

## Objective

Improve CPU quarterback intelligence to create realistic, varied, rating-dependent behavior.

CPU quarterbacks must be capable of moving within the pocket, extending plays, rolling outside, identifying rushing lanes, scrambling without pressure, and making imperfect passing decisions.

**The goal is believable football behavior, not perfect decision-making.**

This task is Phase 1 of a larger player intelligence and personality system.

## Core Design Principles

CHAOS separates player attributes into five independent categories:

1. **Physical:** Speed, acceleration, strength, agility, balance, stamina.
2. **Technical:** Passing accuracy, ball handling, throwing mechanics, footwork.
3. **Cognitive:** Football IQ, awareness, coverage recognition, processing speed.
4. **Psychological:** Composure, confidence, resilience, discipline.
5. **Behavioral:** Risk tolerance, pocket patience, scrambling tendency, improvisation.

Elite physical abilities must not automatically create elite intelligence.

A physically gifted quarterback may struggle to recognize coverage or make poor decisions.

A less athletic quarterback may possess excellent awareness and decision-making.

Ratings should influence behavior without guaranteeing success or failure.

## 1. Pocket Movement

Implement contextual CPU quarterback movement.

Quarterbacks should be able to:

- Step forward when edge pressure develops.
- Slide laterally inside the pocket.
- Avoid collapsing blocking lanes.
- Occasionally roll outside the pocket.
- Reset their throwing position after escaping pressure.
- Remain in the pocket when protection is sufficient.

Movement should depend on actual defender locations, blocking geometry, open space, and quarterback attributes.

Do not implement scripted sideline movement or automatic backward drifting.

## 2. Scrambling Intelligence

Quarterbacks must be capable of scrambling both WITH and WITHOUT pressure.

Evaluate:

- Available rushing lanes.
- Nearby defenders and closing angles.
- Receiver availability.
- Down and distance.
- Expected yardage.
- Quarterback speed and acceleration.
- Scrambling tendencies.
- Risk of a sack or turnover.

A mobile quarterback may recognize a 10-yard rushing opportunity even when the offensive line provides good protection.

A pocket-oriented quarterback may recognize the same opportunity but prefer extending the passing play.

Do not force every quarterback to scramble at identical rates.

## 3. Imperfect Passing Decisions

CPU quarterbacks must not automatically identify or select the objectively best receiver.

Possible behaviors include:

- Missing an open receiver because the quarterback did not reach that progression.
- Holding the football while anticipating a route developing.
- Throwing a contested deep pass against one-on-one coverage.
- Scrambling despite an open receiver elsewhere.
- Occasionally forcing an aggressive throw.
- Passing up an available deep shot for a safer completion.

Mistakes should emerge from limited perception, processing speed, situational awareness, and individual tendencies.

Do not implement arbitrary random mistakes without game-state context.

## 4. Quarterback-Specific Ratings

Support the following concepts, preferably reusing existing attributes when possible:

- Pocket Awareness
- Coverage Recognition
- Processing Speed
- Scramble Vision
- Scramble Tendency
- Pocket Patience
- Improvisation
- Pressure Composure
- Risk Tolerance
- Throw-on-Run Ability

Avoid unnecessary duplicate attributes or an uncontrolled ratings-system rewrite.

Physical abilities must remain separate from cognitive and psychological abilities.

## 5. Behavior Variation

Different quarterbacks should display recognizably different styles.

Examples:

**Pocket passer:** Maintains progressions, steps up against pressure, avoids unnecessary scrambles.

**Improviser:** Moves laterally, extends plays, attempts throws outside the pocket.

**Dual-threat:** Recognizes rushing lanes and takes advantage of opportunities.

**Aggressive passer:** More willing to challenge single coverage and attempt contested deep throws.

These are tendencies, not fixed classes. Every quarterback must retain the ability to make different decisions.

## 6. Situational Awareness

CPU quarterback choices should account for:

- Down and distance.
- Field position.
- Available rushing space.
- Defensive coverage.
- Pass protection.
- Nearby defenders.
- Receiver separation.
- Time spent in the pocket.

Quarterbacks should not have perfect, instantaneous information about every receiver and defender.

Use existing passing progression and defensive recognition systems where possible.

## 7. Scope Restrictions

Implement only the smallest maintainable changes needed for Phase 1:

- Pocket movement.
- Pressure awareness.
- Basic scramble-lane evaluation.
- Rating-influenced decisions to extend, throw, or scramble.

If the complete imperfect-perception and personality framework requires substantial architectural changes, document it for later tasks rather than rewriting the entire game.

Do not implement persistent player memory, full positional intelligence, or a complete psychological system in this assignment.

Do not change established player controls.

## 8. Mandatory Regression Tests

Create or update focused QA tests demonstrating that:

1. A mobile quarterback can scramble without pressure when a legitimate rushing lane exists.
2. A pocket passer is generally more patient in the same situation.
3. Quarterbacks can step up or move laterally to avoid pressure.
4. Quarterbacks avoid obviously occupied rushing lanes when recognized.
5. Passing progressions and existing throwing behavior remain functional.
6. Handoffs and designed runs are unaffected.
7. Defensive pursuit works against scrambling quarterbacks.
8. The CPU quarterback ball-carrier indicator remains correct.
9. Blocking, tackling, diving, and collision systems remain intact.
10. Quarterbacks cannot cross the line of scrimmage and then make an illegal forward pass.

Use deterministic test fixtures where possible.

## 9. Required Engineering Practices

- Read `AGENTS.md` before editing.
- Review existing QB decision-making, ratings, movement, and passing logic.
- Make surgical, task-scoped changes.
- Reuse existing architecture.
- Preserve existing game controls and animation behavior.
- Do not modify `.github/`, `tasks/`, agent permissions, credentials, or workflow configuration.
- Rebuild `index.html` from maintained source.
- Run the standalone build verification and relevant regression tests.
- Report what was implemented, what was deliberately deferred, and known limitations.
- Open a review-only pull request.
- Do not merge or push directly to `main`.

## Success Criteria

The CPU quarterback should no longer behave exclusively as a stationary passer.

Different quarterbacks should demonstrate believable differences in pocket movement, scrambling, and decision-making.

A quarterback should sometimes scramble with no immediate pressure when a real rushing opportunity exists.

Passing must remain functional, and the new system must not introduce unrealistic movement, repeated instant sacks, or broken defensive pursuit.

**CHAOS philosophy: Every player operates in the same physical world, but physical ability, football intelligence, personality, and situational context influence