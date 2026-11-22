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
