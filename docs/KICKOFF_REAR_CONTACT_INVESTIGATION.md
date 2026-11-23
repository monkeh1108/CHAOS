# Kickoff rear-pushing investigation

**Status: Intermittent. Reproduced by the owner and in a deterministic kickoff fixture.** The owner observed approximately 30 yards of upright pushing during an apparent kickoff return. The preceding contact was unobserved. The fixture reproduces the outcome after a broken grip without establishing what preceded the owner incident.

## What the previous patch covers

PR #23 records genuine separation during cooldown in the shared tackle collector. That part runs during scrimmage and returns. Its recovery steering lives in `pursuitAI` in `src/ai/pursuit.js`. A return calls `coverReturnAI` in `src/sim/kick_return.js`, which uses `pursuitAim` and its own blocker bypass. Return coverage never invokes this recovery steering. The blocker-bypass check also expects low defender displacement while still more than seven yards from the returner. It does not cover a defender moving alongside a carrier through sustained body contact.

`src/sim/special_teams_step.js` moves bodies and resolves collisions before it calls the shared tackle resolver. A defender can therefore keep transferring momentum while shared reengagement rejects a fresh wrap. In the reproduction, the moving runner never satisfied the stationary recontact condition. The lead defender's cooldown had expired, the separation flag stayed false, and the followers remained outside tackle reach. Later CB2 established contact and the return ended.

## Deterministic evidence

1. Seed `48723`, start an opening kickoff received by the local team, and let WR2 field it using the same kickoff setup as `tests/integration/rear_pile_contact.test.js`. Place WR2 at the landing point and RB at (10, 4) before the catch. Once fielded, use neutral manual movement to isolate collision impulse from intentional running.
2. Stage WR2 at (42, 26) with forward speed 4 yd/s. Stage EDGE1 at (41, 26) with forward speed 7.1 yd/s and facing downfield. Start other coverage players at (108, 48) and other return players at (16, 2).
3. Allow the live solver to establish EDGE1's first grip. Use `debugForceGripEscape` without immediate recovery. Place DT, DT2, EDGE2, and MLB in two rows 0.7 and 1.4 yards behind EDGE1, at alternating lateral offsets of 0.16 and 0.32 yards. Give them EDGE1's forward speed plus 1 yd/s, with a minimum of 3.4 yd/s, match his lateral velocity, and face them downfield. After this setup, advance ordinary live ticks with no further overrides.
4. Use `debugTackleWatch`, `debugTackleEligibility`, `debugCarrierCollisionImpulses` and snapshots of `reengage`, runner/defender motion and grip links. Record actual positive impulses from the lead pair, separated from proximity alone and from self-propelled running.
5. WR2 advanced 26.02 yards upright. The lead pair had 291 positive-impulse ticks in the measured interval. On 283 of them, EDGE1's cooldown was zero and the eligibility reason was still reengagement. The required gap was about 1.067 yards, and no gap reset occurred. CB2 made the next grip. The play ended after 313 staged ticks.

The result matched in the exact #23 standalone, the accepted Pelvis Combined build, and the upper-thigh follow-up. The result does not depend on the anatomical render changes. A wider probe exercised neutral and held input, one and four staged followers, simultaneous and staggered arrivals, and 16 unforced seeded kickoff returns. Forced escapes are diagnostic. The unforced kickoff sweep did not reproduce the owner's long push. A sequential game probe attempted longer exposure and stopped at its tick limit on an unrelated live scrimmage play after four plays and 930 ticks. Background-tab timing and the precise owner sequence remain unverified.

## Coverage gap and proposed correction

The old kickoff regression stages six pursuers behind a neutral returner, without a prior broken grip. The post-escape pack case is scrimmage. The golden kickoff replay covers a normal return, without deliberately reaching and tracing this recovery state. Keep all those cases.

Evaluate a small return-coverage hook that gives a post-escape AI defender the same physical lane-reset opportunity when he is occupying the rear lane. Preserve the existing block bypass, collision shapes, recovery, and actual separation and contact evidence requirements. Share the narrow recovery steering logic while keeping ordinary coverage decisions and manual defender controls. Evaluate a solo-defender variant separately. A recovered solo defender transferring sustained forward impulse may need space to let go and re-approach even without a follower. A fast runner merely outrunning a close pursuer must still be able to escape. No timer ends the play, and proximity alone never awards a tackle.

Add a failing post-break return fixture and controls for first pursuit, real separation while the cooldown is active, no early re-grip, a legitimate clean escape, single and staggered followers, sideline leverage and genuine block denial. Compare scrimmage, kickoff, punt, and safety kick, with neutral, manual-drive, and CPU returners. Retain ordinary tackle outcomes and run replay plus repeated live-session coverage before owner playtesting. Physics implementation is awaiting owner authorization.
