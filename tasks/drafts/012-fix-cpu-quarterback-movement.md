\# CHAOS — Task 012: Fix CPU Quarterback Movement Not Activating



\## Priority: HIGH — Gameplay Bug



\## Background



Task 007 introduced adaptive CPU quarterback intelligence, including pocket movement, pressure recognition, scrambling, and rating-dependent behavior.



The automated tests passed, but human gameplay testing revealed that the CPU quarterback still behaves almost exactly as before.



\*\*Observed behavior:\*\*

\- CPU QB performs a dropback, then remains mostly stationary.

\- QB rarely or never moves laterally.

\- QB does not visibly step up or escape the pocket.

\- QB does not roll out.

\- QB does not scramble, even when appropriate opportunities develop.

\- QB typically throws the football or gets sacked.



The user confirmed these issues during normal gameplay in the Task 007 playtest build.



\## Objective



Find and repair the actual reason CPU quarterback movement does not activate during normal gameplay.



This is a functional correction to Task 007, NOT permission to rewrite the complete offensive AI system.



\## Required Investigation



Trace the complete CPU quarterback behavior pipeline:



1\. Passing-play initialization.

2\. QB dropback.

3\. Pressure recognition.

4\. Movement decision-making.

5\. Velocity and acceleration updates.

6\. Collision and blocking interactions.

7\. Scramble commitment.

8\. Passing versus running state transitions.



Determine whether movement is prevented by overly restrictive conditions, overwritten movement commands, incorrect game phases, conflicting velocity updates, or other causes.



Do not assume the existing Task 007 tests prove the behavior works.



\## Required Fixes



\### Pocket movement

\- QB should step up when edge pressure creates an opening.

\- QB should move laterally to avoid defenders when appropriate.

\- QB should not repeatedly run into blockers.

\- Movement must respect acceleration, speed, balance, and surrounding geometry.



\### Scrambling

\- QB should recognize legitimate rushing lanes.

\- Scrambling must be possible even without pressure.

\- QB must occasionally abandon a passing play when running is the better perceived choice.

\- Different QB ratings and tendencies should influence decisions.



\### Passing preservation

\- QB must continue scanning receivers and throwing the football.

\- Do not make every quarterback scramble frequently.

\- Preserve realistic passing timing and offensive play design.

\- Maintain the QB possession indicator.



\## Mandatory Gameplay-Level Tests



Create deterministic tests that run the same live simulation update used during normal gameplay.



Tests must demonstrate actual player-position changes, not just successful decisions inside helper functions.



Include scenarios where:



1\. QB moves laterally during edge pressure.

2\. QB steps forward into a safe pocket opening.

3\. QB identifies an unpressured rushing opportunity.

4\. A mobile QB commits to a scramble and advances toward the line of scrimmage.

5\. A pocket passer generally remains more patient.

6\. QB can still throw normally.

7\. QB does not repeatedly collide with offensive linemen.

8\. QB does not illegally throw a forward pass after crossing the line of scrimmage.

9\. Existing QB possession indicators continue working.

10\. Existing blocking, tackling, and handoff behavior remains functional.



Record QB positions, velocities, movement states, and decision reasons over time.



A test must fail if the quarterback remains stationary in a scenario explicitly requiring movement.



\## Development Restrictions



\- Read AGENTS.md.

\- Inspect the current implementation before changing anything.

\- Make surgical changes.

\- Preserve existing game controls.

\- Do not modify GitHub Actions or repository permissions.

\- Run relevant regression tests.

\- Rebuild the standalone HTML.

\- Explain the identified root cause and the actual correction.

\- Open a review-only pull request.

\- Do not merge automatically.



\## Success Criteria



In normal CPU-controlled gameplay, quarterbacks should visibly move within the pocket, react to pressure, and occasionally scramble when a legitimate opportunity exists.



Automated tests must verify actual movement over time.



\*\*Do not declare this task complete merely because movement-selection functions return expected values. The live simulation must demonstrate the behavior.\*\*

