# Task 006 carrier awareness and called run lanes

An automatically controlled ball carrier can turn around a visible teammate
he is catching from behind. The look-ahead follows his actual direction of
travel, including runs across the field. Awareness and vision determine when
he can react. Agility, balance, closing speed, and the available gap determine
how far he can turn. The existing movement and contact systems apply
acceleration, momentum, and impact. A late turn can still end in a bump.

The wider run calls use the same landmarks as the play art. Stretch uses
reach blocks to the left. Power sends the right guard across to lead left.
Counter sends the left guard across toward the right C-gap. Sweep takes a
wider right track with a right-guard pull, rightward reach steps, and
perimeter support. Inside Zone keeps its interior combination blocks.
Receivers stay tied to their perimeter matchups and gain playside leverage
on wide calls.

Deliberate stick or keyboard movement takes control immediately. After
releasing it, the carrier coasts or brakes.

## Playtest

1. From the default formation, call Stretch and keep movement neutral
   through the handoff. The back should head wide left and the line should
   step left. Compare with Sweep, which takes the wider right path.
2. Compare Power and Counter. Watch the opposite guards pull behind the
   line and look for the intended left and right lanes.
3. Try Counter several times with neutral movement. Watch for the back to
   plant and bank as he angles around the right tackle. The timing depends
   on how that block develops. Inside Zone can also produce a short turn
   around the center. Space can close after the runner begins turning.
4. Try deliberate steering and confirm the carrier follows your controls.
   An Inside Zone blocker driven backward by a defender should still
   transfer a physical impact when he hits the runner.

The seeded 22-player tests verify lane separation, line flow, guard pulls,
and a change in the runner's heading before contact. Controlled fixtures cover
awareness, agility, true rear approach, open and closed gaps, lateral travel,
manual steering, and other ball-carrier positions. Playtesting checks how
readable and frequent the reactions are in ordinary games.

## Run-defense follow-up

On a confirmed run, outside corners preserve their shoulder near the line.
Safeties keep separate pursuit depths, and a defender with leverage aims at
the runner's projected crossing point until close enough to finish the
tackle. The angles use live momentum after the handoff.

Test with Stretch and Sweep from different spots. Watch whether a deep
defender is still upfield when the runner turns the corner. Successful
blocks and broken tackles can still produce long gains.

For a repeatable sidestep in a fresh browser playtest, run the following in
the browser console, then close the console and watch the first cut on
Counter. This resets the practice series.

```js
GRIDIRON_DEBUG.reset();
GRIDIRON_DEBUG.debugSeed(431);
GRIDIRON_DEBUG.select("counter");
GRIDIRON_DEBUG.snap();
```

With neutral movement, the seeded Counter reaches the right tackle and
starts turning before contact. The clear-lane check can reject a sidestep
when teammates or defenders occupy the exits. This revision leaves that
choice to the existing awareness and gap checks.

## Ordinary running cuts

An automatically controlled back can plant at any rating when his intended
lane differs from his current direction of travel. This includes the transition
from the handoff to the called lane and the change from an outside sweep to
an upfield run. Agility, juke technique, and cut ability govern the turn rate
and speed retention. Body mass, speed and balance still limit the plant.
Straight running and deliberate reversals use ordinary movement.

Avoiding a particular blocker still needs a clear exit. Ordinary turns can
be seen without setting up that particular collision.

## Pass coverage and tackle consistency

Deep-zone assignments keep their role when their starting depth is compressed
near the goal line. The safeties can shade toward a developing vertical route
while preserving depth, and underneath defenders can still close short lanes.

A clean scrimmage wrap takes control sooner. A hold that physically slips out
of reach is a loose grip. A credited break requires an escape contest, and the
next hold on the same play is harder to break. The highest-rated power backs
can still win that contest again if leverage, balance and stamina allow it.

For coverage, try Verticals in the red zone and watch the safeties stay behind
the routes while the corners close underneath. For tackling, compare ordinary
backs with high-strength and high-trucking backs against the same defense.

## Pad contact and stumbles

A substantial, aligned standing pad collision on a scrimmage play gives the
defender evidence for a tackle attempt even when torso separation prevents
the standing arm capsules from overlapping. The defender must still be
eligible to tackle and has to maintain his grip. A graze or a gap between
players cannot use that path.

A low contact that produces a stumble leaves the ball live and does not
award a broken tackle. Another defender who physically establishes a grip
can finish the tackle while the runner is recovering his balance.

For a playtest, run squarely into an upright defender without using a move.
Then try cutting past a defender's outside shoulder. A solid collision
should produce a wrap attempt, while a glancing touch can leave the runner
upright. An ankle clip can buy the next defender time to finish the tackle.

## Standing pursuit and low reaches

AI defenders stay upright when they can still close on foot or an unblocked
teammate is ahead of the runner. A dive remains available to a trailing
defender when the runner is pulling away and the gap is still reachable.

A fallen defender has to settle and face a runner within reach before making a
single ankle grab during that fall. A fresh fall, a reach facing away, and a
second grab during the same fall do not produce that contact.

To compare, try several stretches and sweeps and watch how the first two
defenders approach when they have help. A late dive can still happen after a
runner escapes the last standing defender's angle.
