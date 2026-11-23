# Step 3 combined anatomical foundation review

## Owner decisions and baseline

- Step 1 torso, pelvis, neck and existing defensive-line crouch were visually accepted. Step 2 shoulders, arms, hands and the football tuck were accepted on the combined playtest. Preserve locomotion, both jukes, foot planting and the ball tuck. Step 3 is under owner review.
- The intended animation integration branch is `integration/player-model-animation`. Its verified tip was `c9979fa`. [PR #22](https://github.com/monkeh1108/CHAOS/pull/22) (grounded locomotion, `d55a6ca`), [PR #24](https://github.com/monkeh1108/CHAOS/pull/24) (Step 1, `c55cf06`) and [PR #25](https://github.com/monkeh1108/CHAOS/pull/25) (Step 2, `7d96050`) form a draft stack. The Step 3 review is stacked on #25. No integration was authorized for that stack.
- The playable combined preview uses #25 at `7d9605055fe404a5eef1f4d2aa5e0a20ef5439e6` with [PR #23](https://github.com/monkeh1108/CHAOS/pull/23) at `73c7dac2f1fef99b7e25e8ced571b4262fe20725`. The three overlaid #23 files are `src/ai/pursuit.js`, `src/physics/tackle_contacts.js` and `tests/integration/rear_pile_contact.test.js`. Rebuild `index.html` after overlaying those files. The verified preview matches the accepted Step 2 combined build byte for byte. The local `main` checkout had pre-existing edits and was left alone.
- Historical context came from the repository instructions, current draft stack, [archived development handoff](https://github.com/monkeh1108/CHAOS/blob/11b0cc96651629ba32e490d34ba1e9aa12904bba/docs/DEVELOPMENT_HANDOFF.md) and direct owner feedback. The original shared conversation could not be retrieved.

## Validation

| Check | Result |
| --- | --- |
| Standalone consistency | Passed. SHA-256 `9d2026b812fa00c839d1afb0298109baaf741625af154bfc6e1c0d2896921db8`. |
| Node and focused rear-pile reproduction | 86 passed. In the seeded post-break pile, the lead tackler could not re-grip during cooldown. A teammate made the next grip and the play ended in a tackle after 158 ticks and 6.4 yards. A real gap during cooldown counted as separation, with no early re-grip. |
| Chromium gameplay replays | Run, pass, kickoff and contact lab each exactly matched the accepted combined build. |
| Browser checks | Animation/camera and run distribution passed. At 390 px the pause test recorded 11 draws during the concurrent run against a limit of 7. A serial rerun passed both widths, with 5 paused draws at 390 px. Earlier Playwright launch failures were resolved by using the bundled headless Chromium executable. |
| Visual motion review | 581 rendered fixture frames across 12 sequences, with 36 sampled frames matching the accepted combined build. Covered neutral and ready stances, a DL crouch, block engagement, jog and sprint, both juke transitions, high and possession reaches, caught-ball tuck, wrap, fall and get-up. Sampled varied player proportions and both kits. Controlled poses supplement live replays and the owner's live playtest. |
| 22-player WebGL | 532 draw calls on both builds without page errors in the controlled software-WebGL fixture. Five 90-frame repetitions reported median CPU submission of about 1.4 ms for Step 3 and 0.9 ms for the byte-identical reference. The timings vary with the run and do not measure GPU frame time or live frame rate. |
| Lint | Zero errors, 150 warnings. This review changes documentation only. |

Paste this into File Explorer to open the Step 3 playtest.

```text
%LOCALAPPDATA%\Temp\CHAOS-Step3-Combined-9d2026b8.html
```

## Pelvis and upper-leg finding

The rounded pants silhouette reproduced on skill players and broad linemen. The front view shows a low bridge over the inner thighs. Side, rear and three-quarter views show a distinct rounded seat with a visible contour break at the thigh. The seam is already visible in neutral and becomes easier to see when one thigh swings forward or the hips load a cut. Reviewed front, side, rear and three-quarter samples at neutral, sprint, juke and ready positions, alongside the full-body fall sequence.

In [renderer3d.js](../src/render/renderer3d.js), the `pelvis` mesh is an oval ring profile whose widest band sits near hip-joint height. The lower rings round inward to a single central bottom point. Each leg is another round profile with a full upper-thigh section. Those surfaces intersect and shade independently as their transforms diverge. Breadth scaling makes the outer contour more conspicuous on larger bodies. The static reproduction and the mesh layout point to the lower pelvis profile and its overlap with the high thigh as the primary drivers. The review found no reason to move the hip pivots or to change the uniform palette, locomotion solver or authoritative contact geometry.

Proposed next change is a focused renderer-only pants profile. Keep the existing waist rings and waist-to-jersey overlap. Reduce the rounded depth of the lower front and seat, contour the base into a higher crotch between the legs, and blend the top thigh shoulders into the hip profile. Preserve enough overlap through hip flexion and abduction to keep the joint covered. Keep current hip, knee and ankle transforms and the existing deformation around the knees. Before accepting a change, compare stills and continuous transitions from all four angles on a skill player and broad lineman. Check crouch, sprint, left/right plants, fall and get-up for gaps, clipping, fused thighs and abrupt contour changes. Repeat replay, rear-pile and 22-player checks.

## Step 4 recommendation and pending work

The existing procedural rig has usable hip and knee articulation, independent pelvis and chest motion, shoulder and wrist poses, and a stable held-ball attachment. The current mesh segments still shade separately at some joins. Gloves have no finger articulation. Existing tackle and ground poses do not coordinate two actors' hands, contact anchors or fall timing as a shared animation.

Resolve and playtest the pelvis silhouette before investing in shared takedown and grounded wrap poses. The current structure can support an initial scoped coordinated-animation pass after that review. A broader skeletal replacement has no demonstrated dependency. Step 4 awaits owner review and authorization.

Keep coordinated wrap/takedown work, head-on low-dive selection and lateral leverage, defensive-line three-point stances, defensive-back readiness, end-zone routes hitting the back boundary, equipment detail, hand/finger interactions and individual carry styles in their separate future scopes. No PR was integrated or merged. The owner personally playtests and authorizes any final merge to `main`.
