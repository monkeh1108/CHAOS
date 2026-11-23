# Task 005 indirect contact

On Inside Zone, the collision solver records recent physical impulses that drive
a blocker backward. Each blocker can pass through only the unused, aligned
portion of that impulse, bounded by the next collision's measured impulse.
The existing solver still applies all velocity changes. The added response
affects balance, stumble time, and the existing fall/recovery pose.

Ordinary overlap without closing speed supplies no new impulse. A teammate
bump can slow or redirect the runner without assigning the impact to a defender.
A sequence of contacts preserves the originating defender and the blockers that
transmitted the impulse. These records expire quickly and clear with the players
at the next snap.

## Whistle behavior

An indirect impact can put the carrier on the ground without ending the play.
A subsequent direct anatomical touch by an opposing player can end the play
at the carrier's spot. An untouched carrier can get up. This follows the
direct-contact distinction in [NFL Rule 7, Section 2](https://static.www.nfl.com/image/upload/league/tqivdkzt9mu6wdgsh1ku.pdf).
An indirect fall awards no grip or tackle by itself.

## Verification

The focused integration test uses the normal body motion/collision step with
all 22 players and controlled geometry. It distinguishes zero-speed overlap,
an unengaged teammate bump, a defender driving a blocker, transfer through two
blockers, and a fall that remains live until an opposing touch. Ordinary
scrimmage and kickoff checks and the original gameplay replay fixtures continue
to run separately. The frequency of indirect falls in natural play needs
manual playtesting before starting Task 006.
