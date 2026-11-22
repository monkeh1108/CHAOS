# PR #5 defensive refinement QA

The comparisons use the same seeded inputs, fixed simulation step, and live update loop in the standalone build. The baseline is `c5d0180`. Trace capture writes one JSON record per tick with controls, ball state, per-defender geometry, intent, role, pursuit target and read age, tackle decisions, eligibility diagnostics, anatomical evidence, grips, and low-dive impacts. It runs in the Node QA fixture under `CHAOS_PURSUIT_TRACE`.

```sh
git show c5d0180:index.html > /tmp/chaos-pr5-before.html
CHAOS_MEASURE_ONLY=1 CHAOS_PURSUIT_TRACE=/tmp/chaos-pr5-before.jsonl \
  node qa_task011_pursuit.js /tmp/chaos-pr5-before.html
CHAOS_PURSUIT_TRACE=/tmp/chaos-pr5-after.jsonl node qa_task011_pursuit.js
```

## What the traces showed

- **Interception and oversteer.** At 4.42 s in the baseline reversal, CB2 was moving at 1.78 yd/s toward a leverage waypoint 11.33 yards away on a 1.10 s projected lead. The runner was already 7.92 yards away with negative closing. CB2 later reached the runner at 5.97 s with an initial grip of 0.16. At 4.42 s in the patched replay, CB2 was 2.64 yards away and closing at 5.09 yd/s. The runner's location differed after earlier contact. The patch charges a travel penalty for sideways momentum on retreat and post-catch predictions. Close cutoffs project from the defender's sampled runner velocity and use lower drive and more lateral braking near a crossing path.
- **Commitment timing.** Baseline CB3 and EDGE2 launched with closing speeds of −1.82 and −5.15 yd/s during the reversal. In the isolated receding case, the runner opened a 1.70-yard gap at 4.00 yd/s and the defender committed anyway. The existing launch supplies 1.35 yd/s. The patch tests closest relative approach before committing in retreat and post-catch pursuit. The receding case now stays on its feet. The reachable seeded low dive still registered a physical swept impact at 0.417 s and a grip. Existing Node checks cover hit-stick selection, impact resistance, and shallow-contact classification.
- **Visual reach and physical contact.** At 1.55 s in baseline Stretch, MLB extended reach by 0.09 while eligibility diagnostics recorded a light brush. Replaying that pose still records light contact, with reach now at zero. Reach starts from meaningful anatomical evidence or an active grip. The existing pre-separation and swept evidence paths still handle contact through the collision step. Some legacy standing grips still start with a capsule classification of `miss`. Requiring a capsule hit for every standing grip regressed the left Stretch seed and the Task 001 rear fixture during iteration.
- **Grip and support.** The reversal still allows a breakaway when the runner escapes the physical contests. The patch sends the destination corner toward the observed crossing lane while the backside safety retains deeper inside leverage. CB2 re-aimed across 19.46 yards of lateral target range and reached 0.78 yards of separation. There were two capsule-supported grip starts across the play, including EDGE2 on the traverse and MLB after the upfield turn. Peak simultaneous grips rose from one to two and the carrier shed three grips. The replay reached its 750-tick limit with the play live in both builds.
- **Pass recognition and recovery.** In the controlled flight fixture, the high-rated defender facing away broke at 0.23 s in the baseline and never broke during the patched flight. With a forward view, ratings of 95 and 50 broke at 0.22 s and 0.40 s in the patched fixture. Recognition accumulates visible flight time. Defenders outside the estimated arrival window aim at their own shoulder of the recovery lane. The seeded Slant & Go was released with WR2 actively cutting inward. Catch separation was 5.37 → 5.44 yards, so the improvement came after possession. The closest defender within ten yards of the catch went from 1.05 to 0.62 yards away. The first measured pursuit aim in both live pass fixtures was one frame after the catch.

## Scenario measurements

Yards are maximum advance from the first possession sample. A grip count is the peak number of simultaneous links. A contact frame is a frame with a defender within 1.65 yards. That distance is a diagnostic threshold.

| Scenario | Baseline → patch |
| --- | --- |
| Slant & Go | 73.39 → 9.33 YAC. First grip at 43.31 → 8.14 yards. Peak grips 1 → 2 |
| Routine slant | 17.02 → 9.05 YAC. First grip at 8.91 → 8.74 yards |
| Interior reversal | 65.74 → 59.93 yards at the limit. Contact frames 96 → 172. Peak grips 1 → 2 |
| Spread left and right Stretch sweeps | 11.25 and 9.16 yards in both builds. Minimum gap 0.60 yards and two peak grips each |
| Trips left Stretch, pursuit and recognition 92 / 55 | 7.08 / 85.08 yards in both builds. Force defender started 10.34 yards ahead. Minimum force separation 0.80 / 1.64 yards |
| Ace right Stretch, pursuit and recognition 92 / 55 | 8.06 / 8.33 yards in both builds. Force defender started 10.58 yards ahead. Peak grips 3 / 0 |
| Kickoff middle, left, right | 19.90 / 18.10 / 18.57 yards in both builds. Coverage width at one second 46.81 / 46.40 / 46.80 yards |
| Kickoff middle redirected right | 18.72 yards and 46.79 yards of coverage width in both builds. CB2's aim moved 10.02 yards laterally |
| Favorable angle, trailing chase, lateral cut | 4.99 → 4.99, 38.35 → 38.35, and 6.02 → 5.58 yards. Trailing defender stayed at least 3.55 yards away and never gripped |
| Straight high-speed contact, offset arrivals, initially stationary carrier | Minimum gaps 0.58 / 0.60 / 0.55 yards, one capsule-supported grip each in both builds |

The Node checks exercise the real scrimmage and kickoff updates plus isolated poses and movement inputs. The seeded cases cover the directions and ratings listed here. They leave natural 22-player behavior, rendered tackle cues, and a wider set of competitive plays for human review. Visibility uses the existing facing cone. Player occlusion remains outside that model. The physical standing-grip fallback and post-catch possession recognition beyond the tested transitions remain areas for calibration.

## Verification

- Standalone build and `python build_standalone.py --check` passed.
- All 26 Node QA scripts passed, including Task 001 rear contact, Task 003 QB possession, Task 010 receiver icons, sprint and stamina parity, and the enhanced Task 011 fixture.
- All 55 Python QA scripts were attempted and stopped at import with `ModuleNotFoundError: No module named 'playwright'`. The available package index did not supply Playwright. Browser gameplay and animation remain unverified.

## Review 6 follow-up

Both scenario groups use the standalone live update loop at 60 Hz. Run the same commands with `CHAOS_DEEP_ONLY=1` to capture the lob scenarios.

```sh
git show beb5460:index.html > /tmp/chaos-review6-before.html
CHAOS_KICK_ONLY=1 CHAOS_MEASURE_ONLY=1 CHAOS_PURSUIT_TRACE=/tmp/chaos-kick-before.jsonl \
  node qa_task011_pursuit.js /tmp/chaos-review6-before.html
CHAOS_KICK_ONLY=1 CHAOS_PURSUIT_TRACE=/tmp/chaos-kick-after.jsonl node qa_task011_pursuit.js
```

- **Kickoff cutoff.** The sampled hip target drifted behind the runner even as DE3B was closing on a viable lateral collision course. The cutoff now projects that same delayed velocity read to closest approach when the defender is already on course to overlap the returner's body radius. The body radius is used only to select a steering target. Normal collision and grip eligibility still resolve the tackle.
- **Deep contest.** In the 36.8-yard seeded lob, CB1 recognized the ball at 0.12 s and turned toward the nominal marker, beyond the earlier catch window. The primary CPU DB can now aim at the descending ball's earlier reach height if that point is within its travel budget. The trace records visibility and accumulated read time. The DB still needs existing physical eligibility and a successful contest roll. The scenario uses user-defense mode with another defender selected and a scripted release.

| Scenario | Review 6 baseline → patch |
| --- | --- |
| Kickoff reversal seed 431, DE3B target along runner's motion at first sample inside 3 / 2 / 1 yd | +0.13 / −0.43 / −0.09 yd → +0.13 / +0.87 / +0.22 yd |
| Same approach, closing speed inside 3 / 2 / 1 yd | 11.98 / 11.15 / 5.09 yd/s → 11.98 / 11.05 / 9.41 yd/s. DE3B gripped in both runs |
| Kickoff reversal seed 431, maximum advance and team contact frames | 20.71 yd and 54 frames → 20.74 yd and 61 frames |
| Opposite kickoff reversal seed 2027 | 5.66 yd and 14 contact frames in both builds |
| Deep lob, 95 recognition, defender offset −2 yd | WR1 completed the pass → CB1 swatted at 1.73 s. Closest sampled descent gap 1.48 → 0.15 yd |
| Deep lob, 55 recognition, defender offset +1 yd | No CB1 attempt → swat at 1.73 s. Recognition 0.28 s in both builds |
| Deep lob, 95 recognition, defender offset +23 yd | No attempt in either build, 20.20 yd closest sampled descent gap |

Seeded spread Stretch remained at 10.63 / 9.12 yards for the left and right sweeps. Routine slant and Slant & Go remained at 9.05 / 9.33 YAC. Ordinary kickoff middle, left, and redirected returns remained at 19.90 / 18.10 / 18.72 yards. The right return went from 18.57 to 16.24 yards with identical 46.80-yard early coverage width.

The live kickoff tests reproduced the target geometry with coverage defenders. The kicker remained more than 22 yards away in both reversal seeds, so the specific kicker miss from the playtest remains unverified. These tests do not cover a kickoff speed/agility matrix or establish the frequency of return touchdowns. The deep fixture verifies the CPU defender's attempt and an impossible-position fallback. It does not reproduce the CPU QB's pass selection or establish post-catch results on naturally called 40-yard passes. The interior reversal still reached the fixture limit with play live after 59.93 yards of maximum advance.
