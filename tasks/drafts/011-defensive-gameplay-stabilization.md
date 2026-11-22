# CHAOS — Task 011: Defensive Pursuit, Ball-Carrier Speed & Open-Field Tackling

## Priority: CRITICAL — Core Gameplay Stabilization

## Background

Human playtesting of CHAOS PR #3 revealed severe defensive gameplay problems.

The user reports that nearly every possession can produce an extremely long touchdown. Outside Stretch is particularly easy to exploit, but the problem also affects kickoff returns and yards after the catch.

### Confirmed playtest observations

- Ball carriers appear excessively fast, especially during kickoffs and open-field runs.
- Outside Stretch can repeatedly produce one-play touchdowns.
- Safeties and cornerbacks struggle to contain runs toward the sideline.
- Defenders often chase behind the runner rather than taking effective cutoff angles.
- AI defenders appear slow to redirect when the runner changes direction.
- Receivers can catch passes and immediately outrun multiple defenders.
- Open-field tackles are difficult because the runner passes defenders so quickly.
- User-controlled defenders can change direction reasonably well, suggesting AI behavior may contribute significantly.
- The current PR #3 build feels worse defensively than the previously merged version, although the cause has not been established.

These problems affect the fundamental balance of offense and defense.

## Objective

Investigate and correct the causes of excessive offensive breakaway plays.

**Do not simply increase defender speed or reduce every ball carrier's speed.**

Preserve meaningful player ratings, realistic momentum, acceleration, and explosive-play potential.

## Phase 1 — Measure Before Changing

Compare normal gameplay behavior in the merged baseline and current PR #3 implementation.

Record:

- Actual ball-carrier velocity and acceleration.
- Speed-rating caps and movement modifiers.
- Ball-carrier speed versus the same player's speed without possession.
- Defender closing speed.
- Pursuit target selection and predicted interception position.
- Defender reaction latency.
- Direction-change timing and acceleration.
- Missed tackle opportunities and contact eligibility.
- Kickoff coverage lane assignments.
- Safety and cornerback run-contain responses.

Determine which systems are responsible for the observed failures.

Do not assume the latest QB update caused the defensive problems without comparative evidence.

## Phase 2 — Pursuit and Containment

Defenders should:

- Recognize the runner's actual direction.
- Select physically reachable interception angles.
- Maintain outside leverage when assigned containment responsibilities.
- Accelerate and decelerate according to their physical ratings.
- Adjust pursuit when a runner cuts back.
- Avoid following directly behind a runner when a cutoff route is available.
- Preserve realistic momentum and reaction times.

Awareness and play-recognition ratings should influence how quickly defenders choose effective angles.

Lower-rated defenders should still be capable of good plays.

## Phase 3 — Ball-Carrier Movement

Inspect and correct any unintended speed or acceleration advantages associated with possession.

Ensure:

- Speed ratings remain meaningful.
- Player velocity respects established movement caps.
- Sprint and stamina systems remain functional.
- High-speed ball carriers can still break away.
- Comparable-speed defenders have realistic opportunities to close distance when angles favor them.

Do not solve pursuit problems by imposing arbitrary universal speed penalties.

## Phase 4 — Open-Field Tackling

Verify that defenders reaching the runner can initiate realistic tackle attempts.

Distinguish:

1. Defenders failing to reach the ball carrier.
2. Defenders reaching the carrier but failing tackle eligibility.
3. Defenders initiating tackles but losing legitimate physical contests.

Preserve the improved rear-contact tackle system from Task 001.

Avoid automatic tackles based solely on distance.

## Phase 5 — Kickoff Coverage

Investigate coverage lane discipline and pursuit behavior during kickoff returns.

Coverage players should not all collapse into the same lane or become easy to bypass through simple directional movement.

Test both central and sideline returns.

## Mandatory Regression Tests

Use live simulation tests to evaluate:

1. Outside Stretch against multiple defensive formations.
2. Interior runs.
3. Sideline pursuit by corners and safeties.
4. Receiver yards after catch.
5. Kickoff returns through central and outside lanes.
6. Pursuit from behind and from favorable interception angles.
7. Direction changes and cutbacks.
8. High-speed open-field tackles.
9. Runner stamina and acceleration.
10. Existing rear-contact tackles, gang tackles, and tackle escapes.

Include quantitative before-and-after comparisons.

Do not require every play to end in a tackle. Instead, verify that defenders make physically credible decisions and have realistic opportunities to stop the runner.

## Engineering Restrictions

- Read AGENTS.md.
- Preserve existing player controls.
- Make surgical changes to the relevant systems.
- Do not rewrite the complete physics engine.
- Do not modify GitHub Actions or agent policies.
- Maintain the established speed and stamina design wherever it is functioning correctly.
- Rebuild the standalone HTML.
- Run focused and existing regression tests.
- Provide measured before-and-after results.
- Explain the root causes and known limitations.
- Create a review-only pull request.
- Do not merge automatically.

## Success Criteria

Defensive gameplay should no longer be consistently exploitable through simple outside running or outrunning entire coverage units.

Explosive plays must remain possible, but should result from actual athletic advantages, blocking, defensive mistakes, and player decisions—not systemic pursuit failures or unintended speed bonuses.

**CHAOS should reward good football decisions on both offense and defense.**