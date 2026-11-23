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
