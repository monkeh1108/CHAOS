# Kickoff and punt return move lockout

**Status: Reproduced. Investigation only.** The owner reported that the first juke during a kickoff return leaves subsequent ball-carrier moves unusable. The test also reproduces the lockout when the first move is a truck, and during a punt return.

## Cause

`src/sim/ball_carrier.js` sets the shared `moveCooldown` when a move begins. Jukes set 0.20 seconds, trucks 0.38 seconds. Juke and hesitation attempts during the cooldown can replace the single buffered footwork input. Other cooldown-gated moves return false during the window.

`src/sim/match_tick.js` branches to `stepSpecial` and returns before it decrements `moveCooldown` or services `queuedCarrierMove`. `src/sim/special_teams_step.js` advances the play clock, action age and motion, but never updates that move state. The action and juke drive can finish normally, sprinting still works, and stamina can recover, while the cooldown remains exactly where the first action set it. Buffered inputs can be accepted without any action firing. This explains why switching directions or waiting does not recover the controls.

The separate [rear-contact investigation](https://github.com/monkeh1108/CHAOS/pull/28) concerns collision impulse, separation and eligibility following a tackle escape. The move lockout reproduces without defender contact. It uses a different state variable and has a separate remedy.

## Reproduction and controls

- Use seed 48723 and the same real kickoff fielding setup as the rear-contact fixture. After WR2 fields, stage coverage away so nothing interferes with movement. Sprint forward, perform a left juke, issue a right juke six ticks later, then observe the next 72 fixed ticks. The first action clears and the juke drive clears. The shared cooldown stays at 0.20 seconds and the right juke remains queued. Additional alternating jukes only replace the queue. Truck, spin and hurdle attempts do not activate.
- Repeat with truck as the initial move. Its animation finishes and move cooldown remains 0.38 seconds. Repeat with an actual punt fielded by RB and observe the same 0.20-second lockout. Both paths dispatch through the same special-teams step. Safety kicks also route there by inspection.
- Run the same inputs after an ordinary Outside Zone handoff. At six ticks the cooldown is 0.10 seconds. The queued right juke fires once the cooldown clears. After waiting, left/right jukes, truck, spin and hurdle activate again under existing rules.
- Stage real rear contact after the opening juke has finished, release a grip through the existing debug escape, move the defender out of the follow-up test lane, and wait 40 ticks. Kickoff remains at 0.20 and only queues the new input. Scrimmage reaches zero and executes the new juke.
- Leave a staged live kickoff return at neutral input after the first juke. After 300 fixed ticks, stamina is full, the action and juke drive are gone, the cooldown is still 0.20, and a right juke only queues.

## Proposed correction and regression cases

Extract the existing cooldown and single-buffer update from the scrimmage tick and invoke it exactly once in both live carrier paths at the matching point relative to play-clock advancement and action expiry. Preserve the current rates, expiry window, stamina costs, and checks for live phase, eligible carrier and control. Keep the buffer scoped to its live play and intended carrier. Inspect initialization on kick, possession change, touchback, score and whistle so no stale input crosses boundaries. Leave unrelated movement timers and tackle logic out of the correction unless separate reproduction and approval require them.

Test real kickoff and punt fielding, safety kicks, and scrimmage. Assert actual actions and stamina changes, since a buffered input can return true without performing a move. Verify alternating directions, quick buffers executed once, early non-buffered attempts rejected, expiry and replacement, multiple moves on one return, sprinting before and after, tired players, control and carrier changes, and valid moves after genuine contact or escape. Run longer return loops, the existing replays, and the independent rear-push fixtures. Provide a playable combined build after an implementation is approved and verified.
