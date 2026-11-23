# CHAOS development handoff

Reviewed November 23, 2026. This is a record of decisions and review status.
[AGENTS.md](../AGENTS.md) and direct owner decisions govern the work.

## Owner decision and current builds

| Scope | Status | Evidence |
| --- | --- | --- |
| Juke animation appearance | Owner accepted for the current phase. Preserve the tested left/right plants, weight transfer, push-off and recovery, plus existing timing, responsiveness and gameplay behavior. | Draft [#22](https://github.com/monkeh1108/CHAOS/pull/22), head `d55a6ca`, build SHA-256 prefix `661b52e5a350c83e`. |
| Running, foot planting and full-body articulation | Combined owner acceptance remains open. Earlier approval to integrate individual model, elbow and lower-body changes still stands. | [#18](https://github.com/monkeh1108/CHAOS/pull/18), [#19](https://github.com/monkeh1108/CHAOS/pull/19), [#20](https://github.com/monkeh1108/CHAOS/pull/20), [#22](https://github.com/monkeh1108/CHAOS/pull/22). |
| Recurring multi-defender rear-tackle regression | Open. The older rear-contact improvement and recent passing checks establish reference behavior; the owner subsequently saw a group push the carrier around the field indefinitely without completing the rear tackle. Exact build and setup still need confirmation. | [#1](https://github.com/monkeh1108/CHAOS/pull/1), [Task 001 reproduction draft](../tasks/drafts/001-rear-pile-repro.md), [Task 002 neutral-runner draft](../tasks/drafts/002-neutral-runner-rear-push-refinement.md). |
| Final Player Model & Animation Update | Awaiting combined build playtest, green checks on that candidate and explicit approval. The owner performs the merge. | Integration tip `c9979fa`; GitHub `main` at `df40a18` at review. |

Paste the corresponding path into File Explorer.

```text
%LOCALAPPDATA%\Temp\CHAOS-Lower-Body-7b155f27.html
%LOCALAPPDATA%\Temp\CHAOS-Foot-Planting-661b52e5.html
```

The first build is the integrated models, elbows, knees and running baseline.
The second adds foot planting and the accepted juke animation. Supply a
paste-ready `%LOCALAPPDATA%` path with every future playtest and record the
revision and build hash. The local checkout was still at the older `bdbd167`
baseline with in-progress tackle edits at review. Use the actual integration
ref for character work and preserve those local edits.

## Integration history

- [#6–#14](https://github.com/monkeh1108/CHAOS/pulls?q=is%3Apr+is%3Amerged+refactor)
  established the refactor baseline and moved build and test tooling, simulation,
  commands, snapshots and presentation behind separable interfaces. The owner
  chose to keep the generated `index.html` committed and directly playable.
- [#15](https://github.com/monkeh1108/CHAOS/pull/15) landed Task 005 after owner
  playtesting. Task 006 waited for that merge as requested. [#16](https://github.com/monkeh1108/CHAOS/pull/16)
  landed after review of run lanes, blocking, pursuit, coverage and tackle
  consistency. [#17](https://github.com/monkeh1108/CHAOS/pull/17) landed the
  pressure-selection correction after the owner saw better pocket movement.
  The owner did not observe a repeat scramble in that playtest; a prior live
  blitz did produce one.
- Character work uses `integration/player-model-animation`. PR #18 supplied
  anatomical models using existing pivots. PR #19 added a continuous curved
  elbow after a deep-bend comparison with a lightweight skinned prototype.
  The owner said the arms looked better. PR #21 was folded into #20 with
  explicit consolidation approval. PR #20 combined the continuous knee and
  ankle shape, independent distance-driven strides, knee recovery, sprint
  posture and coordinated arm drive. The owner approved #18, #19 and #20
  into integration in sequence.
- Draft PR #22 is the focused follow-up from #20. It anchors a supporting
  foot in field space and uses existing cut direction and timing for the
  juke animation, all on the rendering side. Local validation reported
  77 passing Node checks and four exact Chromium replays. A controlled
  22-player WebGL comparison held at 532 draw calls with median CPU
  submission around 0.9 to 1.1 ms. GPU timing and live-play review beyond the
  accepted juke appearance remain open. The [GitHub build-and-test check](https://github.com/monkeh1108/CHAOS/actions/runs/45262365427/job/138000208128)
  passed on the draft head; recheck the exact candidate before any merge. Legacy proposals [#3](https://github.com/monkeh1108/CHAOS/pull/3)
  and [#5](https://github.com/monkeh1108/CHAOS/pull/5) were still open at review.
  Check their scope against current gameplay before reusing anything.

## Working requirements to carry forward

- Preserve the realistic 11-on-11 foundation, with believable contact and
  momentum, individual ratings and decisions, and responsive controls. CHAOS
  is an original, independent game with fictional branding. The owner’s
  long-term ideas include distinctive arcade moments, player memory and
  rivalries, franchise and career modes, a fictional 32-team league and
  online play. Treat the roadmap as design intent. Each new implementation
  needs its own approved scope.
- Keep simulation authoritative. Preserve existing movement, speed caps,
  acceleration, stamina, controls, tackling, blocking, pursuit and the
  receiving/throwing paths during visual changes. Use the seeded headless
  match step, shared input commands and serializable state. Use `src/`,
  ES modules and the current standalone build tool. Older notes about
  root JS copies, globals and hand-registering modules describe the
  pre-refactor layout.
- Preserve the model proportions and athletic leg drive approved for integration across
  linemen and skill players. Jog, acceleration, sprint and braking should
  differ in stride, posture and push-off as well as cadence. Check for
  smooth hips, knees, ankles, torso and opposing arm motion, with ground
  contact and recovery that read from side, rear and three-quarter views.
  Preserve the accepted juke through transitions into running. Reuse
  anatomical pivots and the flat field where suitable. A broad rig or
  locomotion redesign needs its own owner approval.
- Keep pending anatomy work scoped to the applicable approval. Torso,
  spine and pelvis, shoulders and hands, head and neck, and full-body
  coordination were proposed work areas. The owner requested
  readable wrap-and-fall, upright and falling hit-stick outcomes, and a
  runner slipping free. Those animations have yet to be delivered and the
  broader skeletal review was approved as investigation and planning.
- Preserve [Task 005 indirect-contact rules](task-005-indirect-contact.md):
  aligned physical force can transfer through a blocker, while ordinary
  congestion or teammate bumps should generally slow or redirect. A fall
  from indirect contact stays live until a valid opponent touch. Preserve
  [Task 006 behavior](task-006-carrier-awareness.md): called run tracks
  and blocking assignments differ, manual steering takes control, ordinary
  automatic cuts vary with ratings and momentum, and blocker avoidance
  needs a visible open gap. Keep outside leverage and safety depth, require
  credible contact and grips, distinguish a stumble or loose hold from a
  credited break, and reserve dives for actual last-reach opportunities.
- Investigate the rear tackle recurrence separately. Compare neutral and
  actively driving carriers in kickoff and scrimmage using ordinary live
  update paths, with controlled rear and mixed approaches as supplements.
  Track active grips, contact eligibility, recovery, collisions and yards
  moved. Distinguish defender-transferred momentum from the runner's own
  leg drive before changing physics. A separate earlier report describes a
  breakaway receiver who could not be tackled again after breaking one
  attempt during a long rear pursuit. Preserve it as a separate repro lead
  unless evidence connects the cases. Keep historic draft issues, including
  dive recovery and interception eligibility, subject to reproduction and
  current scope approval.

## Review and handoff rules

1. Diagnose and reproduce bugs before editing. Preserve current behavior in
   unaffected systems and add focused regression coverage where feasible.
   Use matched-speed and matched-body-type visual comparisons where useful.
2. Run `python build_standalone.py --check`, the relevant Node and browser
   checks, lint and the gameplay replays appropriate to the change. Explain
   documented historical fixture failures separately from current failures.
   Check that all required checks pass on the exact candidate before any
   merge. Controlled scenarios do not establish behavior in natural
   22-player play. Use actual playtests for appearance and feel.
3. Keep related lower-body work together on focused review branches and
   coordinate with the animation integration branch. Keep changes reversible.
   Seek owner approval before restructuring or merging existing PRs.
   Leave standing policy, agent instructions, approved tasks, CI, deployment
   and credentials alone absent explicit authorization.
4. After approved parts are integrated, provide one combined playable
   build and one consolidated PR for the full character update. Record
   explicit full-update acceptance and merge authorization after playtesting.
   Only the owner performs the merge to `main`.

## Owner feedback after the Step 1 playtest

The torso, pelvis, neck, and current hunched defensive-line appearance were
visually accepted on the combined build (`de5ef9b28909a946`). Step 2 is authorized
for the shoulders, arms, and hands. Review Step 2 with the owner before advancing.
Step 1 acceptance grants no PR integration or merge authorization.

### Future defensive work

- **Defensive line stances.** Preserve the accepted crouch. A later visual
  pass should evaluate role-appropriate three-point stances, grounded hand
  placement, and anatomically coherent joint loading and first steps into
  blocking, including hand lift, torso extension, and leg drive.
- **Defensive back ready stances.** A later visual pass should evaluate a more
  athletic crouch with modest torso lean, hip and knee flexion, balanced
  weight, natural hand positions, role variation, and smooth movement into
  coverage.
- **Head-on one-on-one tackling across defensive positions.** The owner
  reports frequent apparent feet-first dives on favorable head-on approaches
  and easy lateral escapes even when a defender initially has leverage.
  Reproduce across roles and ratings. Trace selected attempt versus displayed
  animation, actual reach/grip eligibility, cooldown, leverage, reaction,
  turn, momentum, and acceleration before deciding whether the defect is
  tactical, physical, or visual. A balanced defender should be able to earn
  realistic body-level contact or a standing wrap. Keep legitimate dives,
  misses, athletic mismatches, and well-timed jukes. Future QA should compare
  jog/sprint speeds, slight inside/outside angles, lateral steering without
  a special move, and timed jukes, including successes, misses, breaks, and
  recovery. Recheck rear contact and multi-defender piles. Scope any repair
  separately and preserve ratings, tackle reach, and reaction limits.

## Sources and limits

Reviewed the visible turns of the [shared development conversation](https://chatgpt.com/share/6b04a1ec-5044-83ea-a3c5-fdf0c0157ec3),
the recovered `CHAOS IDEAS.txt` and development/refactor prompts, current
repository instructions and docs, the task and known-issue records, and
relevant PR descriptions, review/comment records and branch history.
Recovered prior owner feedback supplied the rear-pile symptom and confirmed
that automated checks cannot substitute for the owner playtest.
The shared snapshot does not expose every turn or the contents of all
original attachments. Some file-only turns have no identifying content.
Repository history was used to verify actual merge state when a historical
message or PR description was stale. Full original attachment coverage,
an exact live repro for the latest rear-tackle recurrence, and final
combined animation acceptance remain open.
