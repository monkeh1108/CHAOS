# CHAOS changelog

Additional early release and QA notes are in the [release notes archive](docs/qa-history/legacy-release-notes.md).

## Unreleased

- Split match rules, clock, special teams, AI, physics, and diagnostics into
  modules. Keep the standalone playable directly from `index.html`.
- Add a seeded, headless tick API and JSON snapshot restore. Route browser
  inputs and CPU play actions through a shared command dispatcher.
- Add repeatable gameplay snapshots, consolidated test commands, and
  lint checks for the simulation boundary.

## v0.36.4w — Rear-contact tackle eligibility and safety run diagnosis
- Clear residual tackle suppression on actual runner contact only after any active live blocking and shed recovery end; avoid close-range dive spam against nearly stopped carriers.
- Deep safeties process confirmed handoff after rating-based read interval without needing to stare directly at the ball carrier; no pre-snap run foreknowledge.
- Added controlled scrimmage rear-contact and turned-away safety QA fixture, without broad physics rewrites.

## v0.36.4v — Tackle & pile contact repair
- Repaired mismatch between body collision separation and anatomical tackle contact evidence. A genuinely colliding defender can establish a legal grip before body correction hides the contact.
- Preserved high-speed square-contact broadphase, break-tackle recovery, original gang tackle resolution, and alternate kickoff returner blocking logic.
- Added real-browser rear-crowd regression at 1120px and 390px; see QA_v0364v.md.

## v0.36.4t — Close pursuit reaction and truck/stumble feedback
- New independent `src/pursuit_reaction.js` tracks live carrier movement at realistic, rating-sensitive observation intervals when defenders trail within 5.3 yards. Maintains the existing pursuit speed/turn physics and long-range pursuit strategy; also applies to special-teams coverage.
- New independent `src/contact_feedback_policy.js` controls cue priority only. Successful truck contacts are labeled TRUCK and mild leg brushes do not display STUMBLE. A true trip is never suppressed.
- Added focused unit tests, retained all v0.36.4s reattachment and physical-contact rules.

## v0.36.4r — Intelligent Tackle Selection / Universal Physical Contact (2026-11-11)
- Added directional contact commitment, A held conservative intent (without early animation), situational CPU dive choice and impact with any offensive athlete; see QA_v0364r.md.
- Preserved v0.36.4q hurdle, airborne and foot/ankle interactions, as well as v0.36.4p escape / kickoff physics.

## CHAOS v0.36.4q — foot-level contact and timed clearance (2026-11-11)
- Add `ChaosLowContact` module and live foot-impact solver. Tunable contact severity, stumble/trip/clear outcomes and anti-fringe cooldown behavior.
- Timed manual Y hurdles and contextual low hops share airborne clearance with anatomy and renderer. No random hurdle auto-escape or invulnerability shield.
- Grounded foot reach and airborne body-hit vulnerability, with 2D/3D pose cues.
- Preserve v0.36.4p escape reactions and the rest of the live play engine. Additional human-played calibration still required.

## v0.36.4p — Physics-driven escape reactions
- Replace the unconditional grounded "broken-tackle" defender state with physical slip, stagger, twist, dragged release, power pull or genuine dive follow-through.
- Track in-progress grip resistance as animation-readable strain; keep release outcome and movement physics authoritative in the solver.
- Add fatigue and balance costs to repeated successful escapes; gradual recovery; no artificial break cap.
- Add pure `src/escape_reactions.js` and targeted tests. No third-party assets or dependencies.

## v0.36.4o — Break Tackle / Wrap Break foundation
- New independently tested `src/tackle_escape.js` running continuous leg-drive vs grip contest.
- Distinguishes early weak-grip escape from earned escape of a secured standing wrap.
- Real contact, stamina, balance, contact quality, speed and relative motion are required; no forced animation or dice.
- Adds `debugEscapeContests()` to test hook; preserves v0.36.4n source modules.

# v0.36.4n — Diving collision integrity

- Adds scoped lower-leg/thigh collision resistance for committed defensive dives using anatomical swept samples.
- Adds capped momentum reaction even if grip fails; very light brushes remain negligible.
- Shares missed-dive grounded follow-through between scrimmage and kickoff returns.
- Adds kickoff-speed Contact Lab preset, live debug dive setups and low-body evidence diagnostics.
- Preserves v0.36.4m stand-up collisions, v0.36.4L kickoff lead escort, and tackle ratings.
- See `QA_v0364n.md` for measured tests and limitations.

# CHAOS v0.36.4k — Grip attachment and tackle accuracy

- Added bounded damped grip attachment to `src/grip_attachment.js`: established grips produce mutual resisting forces; players can move and gain yards while linked, without position teleportation.
- Added independent placement-quality calculation from actual anatomical body-region overlap, penetration, approach/facing, leverage and tackling/awareness ratings. Quality affects initial grip, security, grip growth and attachment strength.
- Light/empty contact cannot establish an attachment. Overextended grips release.
- Did **not** add a new player GRIP attribute: TAK/AWR are the existing technique proxies until a differentiated visible grip rating is designed and balanced. No full wrap-break minigame yet.
- Standing wrap poses, diving arm positions, and prior play rules retained.

## v0.36.4j — Anticipatory Wrap Reach & Progressive Dive Takeoff (2026-11-11)

- Standing wraps now begin lifting both arms before torso contact when a defender approaches a runner at reachable distance and is oriented toward them. The reach accumulates across simulation frames instead of snapping to 90° on tackle engagement.
- Once a tackle link is established, forearms may progressively close around the runner. Merely getting close does not grant a grip.
- Diving tacklers bring their arms up progressively after launch, still reaching the approved 135° angle; hands remain relatively straight until actual tackle contact.
- Both visual animation and the 15-region anatomical model use the same `ChaosDiveReach` pose; the Contact Lab secured-wrap scenario now animates the approach as well.
- Only animation state / pose calibration changed. Tackling probability, collision award thresholds, ratings, stamina, special-teams rules, and blocking were not tuned.

## v0.36.4i — Arm-angle calibration (2026-11-11)

- Diving tackles: increase procedural shoulder reach to 135° from the downward arm reference (180° overhead); elbows remain extended until genuine contact, then blend inward.
- Standing secured wraps: render and sample forward, approximately horizontal arms (90°) when defender is actually wrapping; do not change ordinary running poses.
- Both use the existing shared `src/dive_reach.js` geometry, now including a standing-wrap pose, so the anatomical contact regions follow the visible hands and forearms.
- Contact Lab textbook-wrap scenario now flags the standing defender as wrapping at engagement; wide misses/light contacts remain unaffected.
- No changes to tackle success chances, stamina, Inside Zone, kickoff rules, or third-party dependencies.

## v0.36.4h — Dive Reach / Contact-Pose Calibration (2026-11-11)
- Added independent `src/dive_reach.js` as the shared source for arm extension and wrap timing.
- Straightened both diving upper arms and forearms so hands lead ahead of the helmet rather than forming an inward scythe before contact.
- Added post-contact inward arm movement when the live tackle solver marks an established interaction; blends from the actual engagement time.
- Updated 15-region anatomical model to follow the same arm joint targets and revised dive torso pitch.
- Added focused deterministic test `qa_v36_4h_dive.js`.
- No external assets or dependencies added. No changes to contact classification or tackle success calculations.

## v0.36.4b — end-zone safety ruling, block hold, special-teams fielding

- Award a safety on an actual dead-ball event in the offense's own end zone rather than on ball position alone; use a safety free kick from the conceding team's own 20.
- Add modest extra Inside Zone hold on secured blocks adjacent to the runner; preserve ratings, sheds, and contact physics.
- Offset two deep returners and prevent teleporting to the landing point; allow a basic live loose ball to bounce/roll and be fielded physically.
- Coverage releases when the ball lands, even if nobody has caught it.
- Advanced ball orientation/spin and true impact-dependent bounce physics are **not** in this update.

## v0.35.6 — Camera, real gap fits and coin toss
- Stable wide pre-snap camera follows line of scrimmage, not selected defender. Live camera tracks ball/carrier.
- Gap targeting is anchored to actual C/LG/RG positions; repositioning does not change the assigned gap. 2D/3D art draws path to real gap.
- Pregame coin toss; home calls heads/tails, winner selects receive/kick/defer (CPU chooses when away wins); first and second half kickoff recipients tracked.
- No changes to blocking, tackling, stamina, adaptive defense, or animations.

## v0.35.5 — Pre-snap framing and modular visual animation
- Wider 3D camera while the players are lined up, preserving live-play ball following and the selected-defender focus.
- Added read-only `AnimationPolicy` module with animation state names and procedural pose accents.
- Integrated animation policy into existing 3D player rig; no gameplay physics or ratings changes.
- Added desktop/mobile simulated WebGL tests and preserved original tests.


## v0.35.4 — Defensive Pre-Snap Positioning
- Selected defender moves with left stick or keyboard before CPU snap while preserving his role and assignment.
- Zone shade and assignment displays update as the defender moves (2D and 3D). Man defenders keep their receiver.
- Defensive pre-snap playbook stays closed by default on CPU possessions; VIEW reopens it.
- Selected defenders resume their AI when manual steering is released after the snap.
- The gameplay physics, stamina, tackle rules, and offensive plays are untouched.

## v0.35.2 — Rated edge containment, pursuit angles, and situational learned reads
- Force defenders protect outside shoulders when a runner retreats toward a sideline. Inside and cutback defenders take distinct interception angles rather than all chasing the same spot.
- Pursuit and Play Recognition (PUR/PRC) combine to shape angle precision, while each defender gets stable per-snap misreads; high ratings remain limited by speed/position.
- Completed outside-retreat patterns now enter DefensiveMemory by visible formation and side. After repeated observations, even 60/60 defenders can OCCASIONALLY make an excellent read, but only when the ball carrier visibly repeats that escape. No unsnapped play identity is read.
- Learning is probabilistic and limited to pursuit angles; defensive play-calling, passing, stamina, tackling and special-teams movement remain unchanged.
- Added targeted policy/browser tests for retreat/cutback, 99/99 vs 60/60, left/right, situational learning, and no-teaching-before-whistle rules.

## v0.35.0 — Deep-zone anticipation
- Project safety targets from observed vertical receiver velocity and defender AWR/PRC; do not inspect future route waypoints.
- Continue running through the predicted lane rather than braking behind a streak.
- No changes to special teams, tackling, stamina, audibles, or Mesh avoidance.

# v0.33 — Defensive controls, CPU read timing, and playbook navigation

- Contextual defensive **A wrap**, **X hit stick within reach / dive from farther out**. Existing B switch, right-stick tackles and ball-in-air X/A/Y are retained.
- Pure defensive tackle policy, QB timing policy, rollout pursuit awareness, and playbook navigation as four new, small independent JavaScript modules.
- CPU QB waits for route concepts to develop before throwing, except for severe pressure/emergency decisions; no speed or catch guarantees.
- Edge and interior pass rushers adjust targets when the QB moves laterally; live rush intent no longer gets overwritten by block resolution.
- D-pad navigates visible play-calling cards; A selects; X snaps; bumpers cycle offensive formation or defensive front; VIEW toggles the sheet.
- Focused release and independent policy tests, with the prior v0.32 game-flow and v0.28 pass-protection regressions.

## v0.32 — Return concepts, specialist, coverage engagement and game-day control

- Three actual kickoff receiving calls: RETURN LEFT, MIDDLE and RIGHT. They orient the post-kick blocking and runner autopilot, taking the kicker's **actual** landing side into account. Removed selectable kickoff placement/deep aim for receiving team.
- New on-field K specialist (KPW/KAC/PUNT editable) with kicker pose. Rating-based kickoff depth/accuracy. Independent punt distance is preserved.
- NFL-2026-inspired kickoff alignment: kicker on own 35, other ten on receiving 40; five receivers at receiving 35 and four at 30, two deep returners; both setup/coverage units release on landing. Direct kick into end zone is touchback at receiving 35; premature short landing is simplified to receiving 40.
- Return defenders continue sprinting and pursuing rather than freezing in contact. Blockers claim targets, leave lanes open for other teammates, reposition to the real kick side, and pursue real threats. Defenders can shed a return block then sidestep before re-engaging the same blocker.
- HOME's possession-aware controls switch to defense on opponent possession and to coverage when HOME kicks after scoring. The defending team gets coverage and pressure menus, while CPU offense uses team-style-based play calls. Prototype style labels: HOME Spread & Tempo / AWAY Multiple & Power; no licensed team playbooks.
- Preserve all prior passing, blocking, catch/juke, and speed systems. Full penalties, replay, detailed punting and onside rules remain planned.

## v0.31 — Game Day, special teams and play-calling
- Added HOME/AWAY 2-team game state with mirrored field position, 6-point touchdowns, 1/2-point try choices, kickoff sequences, and 3-point field-goal attempts.
- New kickoff and punt return units (11 players per side with live coverage, blockers and tackle interactions), 4th-down punt/FG choices and special kicking UI. Deep kickoff touchback at 35 and punt touchback at 20.
- Added four 15-minute quarters, game/play clocks, 3 timeouts per half, basic two-minute warning, and delay-of-game.
- Added an original play-calling sheet with run/pass sections, formation choice, special-teams options, Ready/Snap and controller/keyboard access.
- Preserved v0.28.1 pocket protection, v0.29 flight tracking and v0.30 catch/hurdle animation engine. Jersey colors follow ball possession.
- This is deliberately **rules scaffolding** rather than full NFL officiating. Kicking is simplified and full penalty/timing/onside/overtime features remain planned.

# v0.30 — Ball-skill animation pass, on-player feedback, and hurdling

- Hurdle is a rated new ball-carrier technique: **Xbox Y** when carrying, **G/Y** on keyboard, or **Y · HURDLE** on screen. Y retains WR2 pass-target selection before release and aggressive catch after release. A hurdle has an actual takeoff/landing duration, stamina and small momentum cost, and can sometimes clear a timed *low* defender tackle; it cannot defeat a standing wrap/high hit automatically.
- Added several differentiated procedural 3D poses: high-point jump and two-arm reach for aggressive catches, leaping ball-hawk interception, one-arm jumping swat, chest-level possession catch, in-stride RAC cradle, defender play-receiver disruption, carrier hurdle, player dive and low-tackle lunge.
- The play is not decided by the animation; the preexisting CAT/JMP/COV/TAK ratings, reach, timing, and ball trajectory continue determining outcomes. A catch-action selection gives a subtle anticipatory pose; the actual jump triggers near the ball and uses an arc/landing, rather than jumping immediately when the pass leaves the QB.
- Added **floating above-player action labels** for RAC, POSSESSION, AGGRESSIVE, SWAT, BALL HAWK, PLAY RECEIVER, and HURDLE, including an extra confirmed-action cue when a physical attempt triggers. Labels appear in WebGL and 2D fallback and do not block input.
- Minor rated situational variation: CPU tacklers occasionally choose low approaches when the ball carrier is moving fast; this creates rare hurdle opportunities. Independent per-snap animation accents produce slightly different reach/body styles without adding arbitrary outcome modifiers.
- Kept v0.28.1 pass protection / RB blitz pickup, v0.29 deep-ball support and ground markers, manual receiver switching, speed caps, and Xbox movement mapping. Automated input, WebGL, air contests, run formation, blocking, and pursuit tests included. This is still simple procedural 3D animation, not skeletal IK or mocap.

# v0.29 — Ball-flight Tracking & Off-Ball Defensive Support

- Added turf-level 3D projected catch-target ring, moving ball-ground shadow, and visually distinct possession/control rings. The 2D fallback also shows all critical ball markers.
- The intended receiver switches from route running to physically steering toward the actual projected catch point when the ball is released. Teammates close enough to make a realistic attempt can assist; distant uninvolved receivers keep their routes.
- All CBs, FS and SS now identify deep throws and begin taking support angles. The primary man coverage reacts earlier than a distant far-side DB; AWR, PRC, distance, and assignments affect timing. Nearby LBs rally underneath when appropriate. All pursuit respects player physics and speed ceilings.
- When in defense-control mode, a user-selected defender without stick input can automatically read and break on an airborne pass; manual input immediately takes priority.
- Retained v0.28.1 coordinated pass protection, RB blitz pickup, B switch to receiver, X/A/Y catch-and-defense styles. Added deep-pass and visual regression tests.

# v0.28.1 — Coordinated Pass Protection and Manual Receiver Switching

- Fixed pass-protection distribution: each rusher is assigned one initial protector based on side/lane and personnel instead of all linemen independently picking the closest threat. This prevents empty right-side blocking and unnecessary OL clustering.
- O-linemen maintain pocket depth and their pass sets, help on a truly uncovered interior threat and follow real penetration toward the quarterback while retaining side discipline. Existing power run pulls and receiver run-blocking remain intact.
- Pass-protection RB moves into the pocket and picks up an unclaimed blitzer or a genuine leak rather than remaining at a static backfield waypoint. Blocks remain determined by physical contact, ratings and rush execution.
- On an airborne offensive pass, Xbox B (keyboard B, or on-screen B · SWITCH RECEIVER) switches manual left-stick steering to the intended WR/TE. X/A/Y still select RAC/possession/aggressive catches. QB receiver icon B still functions before throwing.
- Extended debug state and included scenario/regression tests; this is a targeted repair, not an adaptive play-recognition system.

## v0.27 — Position-based faster movement off the snap
- Added a takeoff responsiveness tier per on-field position, approximately low 70s for WR/RB/CB/safety, mid 60s for linebackers/QB, low 60s for TE/FB, 50s for line positions and defensive interior.
- These tiers modify only early acceleration as a player begins moving; they do NOT replace player SPD ratings or instantly assign an unrealistic velocity at the snap.
- The early acceleration assist fades smoothly by around 76% of the rated top speed. Current ACC and body-mass effects remain active, and the existing sprint/stamina and fatigue effects are unchanged.
- Automated comparisons with v0.26 verify that skill positions launch quicker than before, linemen receive only a small increase, higher ACC still gives better acceleration, and the hard rated SPD ceiling holds.
- Preserved the 3D camera and Xbox controls, original 2D mode, run fits, blocking, and pass mechanics. The previously requested 99-SPD/4.20s 40-yard benchmark is a separate unfinished calibration task.

## v0.24
- Added optional automatic mixed defensive coverage; manual calls remain available.
- Added per-snap rating-sensitive variations in route breaks/tempo and man/zone defender reactions.
- Added independent editable JUK and SFA ball-carrier ratings. High JUK rating preserves more forward momentum during lateral cuts and accelerates recovery without exceeding the rated top speed.
- Added sustained Xbox A / keyboard F stiff-arm input with a one-arm procedural 3D extension and small ongoing fatigue cost. Contact move still resolves via the regular rated collision model.
- Kept original input mapping, physics and renderer fallback; validated regression coverage.

## v0.23.1
- Fixed camera-relative 3D controls: up=downfield, down=back, right/left=screen laterals.
- Retained legacy top-down 2D inputs and Xbox right-stick carrier moves.
- Added gamepad input tests for actual live movement under both views.

## v0.23 — Follow camera, route art, end-zone posts, and fixed repeat jukes

- Added behind-offense camera following the ball's position; zooms out on passing plays and tracks the carrier after catches/handoffs.
- Restored visible presnap play art in WebGL for both runs and passes.
- Goalposts moved from x=10 / x=110 to x=0 / x=120.
- Juke left/right now follow fixed field sideline directions rather than rotating with a previous lateral cut.
- Defenders make stamina decisions based on threat, chase distance, field position, and rated endurance; high stamina no longer causes a top-speed penalty until under 35%.
- Included targeted 3D/WebGL, gamepad, and energy regression tests.

## v0.22.1
- Fixed blank gray 3D view by enabling WebGL vertex arrays; added a visual-failure fallback to 2D.
- Physics and input unchanged.

## v0.21 — Finish routes intelligently, QB scrambles, predicted tackle-threat blocks
- Receivers now continue after finishing their assigned routes rather than stopping at a terminal waypoint, searching for nearby open space and re-planning at intervals.
- Crossing the line of scrimmage with the football ends the QB's legal forward-pass state, including while a pass is charging.
- Receivers and linemen block based on estimated tackle threat (pursuit, acceleration, approach velocity, technique) and likelihood the blocker can actually intercept the defender.
- Added regression checks for extended routes, late throwing, run conversion and threat priority.
- Penalty enforcement remains planned, not active.

## v0.20 — Correct touchdown gain and receivers react to possession
- Fixed touchdown descriptions that treated the own-20 as a 20-yard score instead of 80. The official touchdown gain now uses the far goal line (x=110) and is displayed consistently in the result overlay and play log.
- All other eligible receivers switch into actual defender-targeting blocking/escort after an offensive teammate secures the ball beyond the line, including after a pass or QB scramble. Assigned man coverage is preferred when reasonably nearby. Their actual current positions matter.
- Preserved designed-run WR blocking assignments. Added desktop/mobile Chromium regressions. Added a written, not-yet-implemented NFL-inspired penalty enforcement plan before moving into 3D.

## v0.19 — Route recognition, double-move discipline, and verified builds
- Added individual RCR/DIS defender ratings with deterministic route-bend and double-move matchups, preserving rating-based movement, rather than canned separation.
- Added visible receiver-v-defender man coverage comparisons, including press release and distance; CB sliders expose the new ratings.
- Hardened one-source build pipeline with `--check` and safer inline generation. Added QA for actual matchup separation and build consistency.

## v0.18 — Sharper side-step jukes (target ~2 yards)
- Raised the lateral juke-drive speed and lengthened its physical plant/recovery interval slightly to produce approximately 2-yard side-steps in controlled Xbox tests while the left stick remains forward.
- At the peak of the move, reduce the *forward* velocity component based on AGI and CUT so the runner cuts much closer to sideways, rather than following a 45-degree diagonal. Restore forward acceleration as the juke finishes. No teleportation or speed-rating override.
- Retained low-stamina scaling, juke buffering, collision logic, Xbox controls and v0.17 receiver blocking unchanged.
- Added a targeted regression measuring Xbox stick displacement, peak cut angle, continued forward travel, sprint and exhausted cases on desktop and mobile. Physical controller feel still needs hardware testing.

## v0.17 — Receiver blocking lanes and juke physical displacement
- Confirmed two weak v0.16 tests: isolated juke impulses were measured without forward gamepad input, and receiver targets were checked only briefly after the snap.
- Replaced the juke's tiny steering-cancelled lateral force with a short, speed-capped lateral velocity profile. Xbox right-stick flicks visibly shift the carrier while left stick continues forward; RT sprint and zero-stamina cases are tested.
- Confined receiver run blocking to initial outside/slot lanes, preserved unique receiver-to-corner ownership, and selected replacement defenders by their proximity to the receiver rather than to the ball carrier.
- Removed braking just before block contact. Verified actual WR/CB block engagements in extended Outside Stretch and Power Left simulations.
- Added `qa_v17_real_gamepad_juke.py`, `qa_v17_real_gamepad_juke_contact.py`, and `qa_v17_receiver_lane_and_blocking.py`; existing controller, pursuit, and contact suites still pass. Two previously failing legacy test assertions remain tracked and unchanged.

## v0.16 — Sideline blocking and actual lateral jukes
- Fixed receiver assignments on designed runs: the outside WRs get their aligned corner (or Cover 1 man defender). Slot receivers receive their own assignment, including sensible matches against base defenses.
- Before and after handoffs, receivers actively pursue and attempt blocks on that corner rather than drifting to an arbitrary defender near the running back. AI receivers sprint to intercept the corner's projected run pursuit lane and preserve their side of the field.
- Juke left/right now produces measurable sideways displacement (plant and drive, velocity-integrated; no teleportation). AGI and stamina matter, but exhausted players retain reduced movement.
- Added browser-level tests for lateral movement, zero-stamina jukes, actual WR/CB blocking contact, and 144 combinations of formation/front/coverage/run-play configurations.
- Preserved keyboard/Xbox inputs and all other gameplay. Known older stamina-bank and collision-model tests remain separately documented; they were not fixed in this version.

## v0.15 — Right-stick repeat-juke response
- Fixed flicks lost during the footwork replant window by buffering one input.
- Allowed immediate left/right reversal and more forgiving stick re-arm; never auto-repeat a held direction.
- Shortened footwork cooldown, preserved fatigue-sensitive effectiveness and contextual Xbox controls.
- Documented researched 3D wall/airborne arcade ideas for much later work, with original implementation required.
- Added browser-level juke chaining QA.

## v0.14 — Xbox skill-stick controls and stamina rebalance
- Direction-aware Xbox One right stick for running back, defensive, and lineman practice roles.
- Added spin, hesitation, give-up/down-safe, hold-to-dive, ball protection, low tackles, and direct impact-block actions; QB LT turns on ball-carrier controls.
- Eliminated the low-stamina action lockout; reduced the repeat-juke delay; move power scales with actual stamina.
- Reduced excessive v0.13 stamina drain while retaining higher effort at top speeds.
- Added simulated controller QA on desktop and mobile. Unreal Engine 5 migration documented as a long-term possibility, not implemented.

# Changelog

## v0.12 — Route technique and DB matchup
- Added individualized editable RTE, CUT, DBL, REL, HND vs PRS, JAM, MIR ratings, and press/route-break responses tied to matched defenders.
- Added Slant & Go to exercise double moves, while preserving the existing coverage and passing systems.
- Updated the tuning UI and per-player debug state; none of the new behavior is a guaranteed separation boost.
- All players remain original fictional athletes.

## v0.12 — Hard-hit recovery
- Off-ball impacts can knock players temporarily down according to relative collision forces, weight, angle, and independent blocking/hit attributes.
- Timed fall/winded/get-up cycle, automatically resuming defensive pursuit or offensive blocking.
- Recovering players cannot cover, catch, block, or tackle and remain low-profile physics obstacles.
- Three-stage procedural overhead animation.
- Added later stadium entertainment/halftime mini-game roadmap entries only; not implemented.

# Gridiron Lab changes

- v0.11 — Defensive run fit and pursuit assignments, rating-specific PRC/PUR/STA, realistic continuous-sprint fatigue, stamina HUD, and regression fixtures.

# Changelog

## v0.10 — Defensive contact and agile movement
- Faster, attribute-sensitive foot plant and turning, with momentum retained.
- AI sprint/energy roles and dynamic hit-stick decisions.
- Separate HIT, PMV, IBL ratings added to editable athlete data.
- Secure solo tackles and gang tackles rebalanced; weak tacklers lose grip; unsupported open-field gang tackles finish rather than always creating a pile.
- Actual impulse on impact blocks, power moves that attack blocks based on matchup.
- New isolated technique and prior physics regression tests (desktop/mobile).

## v0.9 — Contact chains and moving piles
- Added multi-body 2D impulse propagation, maintained tackles/blocks, moving pile drive and forward-progress limits.

## v0.7 — Controller support
- W3C Xbox-style gamepad support and single-action receiver targeting.


## v0.13 — Receiver run blocking, second-level OL, ball skills, passing arcs
- Run-play WR blocking begins at snap, including eligible CB-to-safety target progression.
- Offensive linemen reassign after secured clean blocks rather than idling.
- Separate juke/truck/stiff-arm ratings-based contact and stamina costs.
- Hold-sensitive lob/touch/bullet passing with quarterback THP and THA.
- Between-snap fatigue and contact energy costs.
- Single maintained engine source; generated standalone browser HTML.

## v0.25 — Quicker first steps
- Added a small, decaying low-speed acceleration boost shared by all moving players; capped speed, existing ACC ratings, stamina and Xbox controls remain intact.

## v0.26 — Defensive closing and early acceleration
- Added skill-dependent pursuit momentum preservation, earlier live-ball sprint response, and faster acceleration up to 85–90% rated speed with high-speed taper. Top-speed caps stay untouched.

## v0.34.6 — kickoff pursuit and tackle contact corrections
- Detect physically stalled coverage athletes after blocking and allow a timed side-step recovery from stale contact.
- Remove automatic grip-security-based release of otherwise sustained tackles; keep genuine rating/momentum-dependent escapes.
- Add focused two-viewport regression test for trailing solo tackle completion and kickoff update flow.

## v0.34.7 return contact and sideline recovery
- Redirect return-coverage shedding inward near sidelines; bypass around the blocker instead of only offsetting the runner target.
- Release stale block immunity when a defender is physically touching the returner without an active nearby blocker.
- Do not start new blocks while the defender has a tackle grip.

## v0.34.8 — special-teams recovery and rear-contact tackling
- Fixed missing knockdown recovery advancement in the special-teams simulation loop.
- Added secured rear-angle drag tackle completion for sustained legitimate wraps.
- Failed defenders visibly fall after a genuine escaped tackle.
- Added regression test for kickoff ground recovery and trailing tackles.


## v0.34.9
- Zone deep-threat prioritization and full-field vertical coverage tracking.
- Man vertical leverage improvement.
- Route-aware Mesh traffic avoidance; isolated policy module.

## v0.35.1 — Read-only defensive memory
- Adds a small `src/defensive_memory.js` module, integrated into the standalone build.
- Records each completed scrimmage offensive play by team: actual play concept, run/pass, formation, known pass target and throw depth, QB scramble, down, quarter, and result.
- Tracking excludes pre-snap calls, kickoffs/punts, and unrealized routes; memory is reset for new games.
- Adds `GRIDIRON_DEBUG.getDefensiveMemory(team)` for inspecting accumulated history; defensive play calls and on-field movement are unchanged.
- Adds focused Node and browser tests.


## v0.35.7 — Short-quarter QA / visible blitz anticipation
- Quarter duration temporarily set to 60 seconds through one constant; no 2-minute warning for this mode.
- Added independent `protection_read.js` for probabilistic, observation-only pre-snap protection alerts.
- RB and available pass-blocking linemen may respond to an alert only if a defender actually attacks the pocket.
- Preserved existing camera, gaps, audibles, coverage, tackling and play-calling.
- Added dedicated protection, quick-game and halftime tests.

## v0.35.8 — Quarterback contact and safety blitz fix
- Unassigned but physically present defensive players may tackle the QB before he throws.
- Removed the per-frame tackle cooldown that prevented non-rushing defenders from sacking the QB.
- CPU QB pressure assessment includes nearby visibly charging threats without knowing hidden blitz assignments.
- See `QA_v0358.md` for focused checks and scope limits.

## v0.35.9 — Faster defensive positioning and return-block threat selection
- Hold RT (or Shift) during defensive pre-snap movement for a faster jog at no stamina cost.
- Return blockers better prioritize approaching, on-lane coverage threats and aim ahead of moving opponents.
- No changes to tackle outcomes, pass/catch controls, or the existing stamina system.

## v0.36.0 — Halftime, delay of game, return blocking, diagnostics
- Clear paused halftime screen with score, receiving team and manual Q3 continuation.
- CPU/user pre-snap delay-of-game fallback, no down consumed, five-yard penalty.
- Kickoff return blocking: retention of near engagements, earlier contact, intercepted approach path.
- Small visible game-state status indicator and expanded debug match summary.
- 1-minute quarters retained for rapid testing.
- Corrected return-loop ground-state checks so fallen special-teams players are skipped until recovered.

## v0.36.1 — Blocking contact and pre-snap stances
- Introduced isolated `blocking_policy.js` for skill/mass/leverage contact calculations and return-side engagement choices.
- Strengthened existing persistent blocking links with velocity opposition, side-slip resistance, drive/seal/double-team outcomes, and stronger presentation of hand fighting.
- Updated 3D blocking pose to reach both arms toward engaged opponents.
- Added presentation-only role stances: three-point for linemen, poised QB, receiver release-ready, RB/TE ready, and athletic coverage-ready for CB/S/LB. Pose resets on live snap.
- Preserved current game-state, passing, special-teams possession, and tackle mechanisms.

## v0.36.2 — Blocking arm pose / near-tackle pursuit
- Point blocking hands forward toward engaged opponent, with visibly bent forearm segments.
- Do not label simple pass-rush movement as an actual physical block engagement for animation.
- Slightly increase close-range lateral braking for pursuit defenders to reduce small-orbit behavior, without speed boosts.
- Add targeted browser tests and preserve established v0.36.1 blocking outcomes.

## v0.36.3a — Defensive airborne interaction range and dive transition
- Airborne defensive actions only allowed near the ball or catch point; distant X performs one ordinary dive instead.
- Removed the extra missed-dive fall sequence, prevented steering during committed dives, and re-posed diving arms.
- Airborne HUD reflects in/out of contest range.

## v0.36.4 — Inside Zone coordination, limited perception, paused rendering
- Add independent `inside_zone_iq.js` for gap-first assignment planning, primary combos, projected RB-lane threat scoring, forward 180° visibility and awareness-dependent secondary-target recognition delay.
- Maintain initial gap blocks rather than reassigning all linemen to whichever defender is near the runner after handoff.
- Enable realistic secured-contact vertical push and up-to-two-linemen combos, without guaranteed holes or altered base speed.
- Let an available blocker climb to a visually observed unclaimed linebacker or nearby threat on the RB's likely path after beating a primary defender; preserve initial assignments and avoid omniscient 180° target snaps.
- Let defenders respond to *seen* developing runs and oncoming blockers within their existing run-fit responsibility instead of instantly seeking a runner behind their field of view.
- Reduce rendering frequency while *paused* to lower background GPU/CPU contention with other browser tabs.
- Future animation principle: no Madden-style canned block transition locks; contact and motion should drive interruptible/blended poses. This is a design requirement, not a full animation rewrite in v0.36.4.
- See `QA_v0364.md` for seeded simulations, regression results, scope and limitations.

## v0.36.4c — End-zone fielded-kick choice (November 11, 2026)
- A free kick fielded in the end zone is no longer immediately declared a touchback at landing. Fielding requires physical proximity, and possession begins normally.
- When the user receives a free kick in the end zone, a two-second neutral-input window offers an automatic touchback; any directional input commits to a live return. CPU returners continue their automatic decisions. This idle shortcut is a game convenience, not a claim about NFL officiating.
- A downed or tackled free-kick returner who never left the end zone receives a touchback instead of a bogus own-one-yard-line spot.
- Touchback outcomes remain 35 after direct free kick into the end zone, or 20 after a ball first bounces in the landing zone and then enters.
- No modifications to Inside Zone blocking assignments, run-defense adaptation, tackling ratings, or the offset deep-return formation.

## v0.36.4e — Anatomical Contact Evidence + Collision Lab (2026-11-11)
- New `src/contact_evidence.js` read-only, bounded live contact event collector with broadphase and swept anatomical checks.
- New `src/contact_lab.js` embedded replay/test UI with body-size presets, scenario timeline, side/top capsule displays and JSON export.
- Live legacy tackles now expose anatomical overlap evidence in debug diagnostics; tackle outcomes are unchanged.
- Build pipeline includes both new original modules. Added `DEPENDENCIES.md`, `ASSET_PROVENANCE.md`, and `QA_v0364e.md`.

## v0.36.4f — Collision-lab calibration and directional approaches
- Extended arm-first dive appearance, with forward forearm/hand capsules following the diving pose.
- Calibrated glancing contact to record brief limb contact, leaving base anatomical dimensions unchanged.
- Added 90° side approaches, four diagonal approaches, head-on and rear-pursuit preset directions with matching defender heading.
- Added relative movement speed and approach-angle diagnostics to the contact lab.
- Maintained existing live tackling and blocking outcome rules; no contact detection event automatically becomes a tackle.
- Added `qa_v36_4f_angles.py` with repeatable, desktop/mobile directional collision coverage.

## v0.36.4g — Anatomical contact classification / gradual tackle integration
- Added `src/contact_outcomes.js`: original five-class contact assessor separated from the contact-geometry and tackle-win solvers.
- Calibrated DL torso/pad collision breadth against renderer. No blanket hitbox inflation.
- A committed dive can start an engagement from measured meaningful body contact outside the old center-circle threshold; empty-air dives and glancing brushes do not gain automatic tackle awards. Standing tackle solver intentionally preserved.
- Existing secured wrap mechanics can finish a tackled runner when meaningful body-region contact and sustained grip confirm complete control.
- Contact Lab now includes `Textbook secured wrap` and classification readout; moved the glancing scenario slightly to maintain shallow arm-only contact.
- Added `qa_v36_4g_contact.js`, `qa_v36_4g_browser.py`, and `QA_v0364g.md`.
- Dependency inventory and asset provenance documents unchanged, no new external packages.


## v0.36.4L — Core Contact / Forward Drive / Kick Return Escort
- Bounded torso/pad nonpenetration correction in the existing body-coupling loop; extra separation applied to active carrier/tackler links. Remains a simplified 2D projection, not a per-limb rigid-body solver.
- Ratings-, balance-, grip- and contact-quality-based solo tackle struggle. Clean established wraps retain fast finishes; imperfect wraps can allow more forward drive. No separate break-tackle mechanic yet.
- Backup kickoff returner uses dedicated lead escort/threat interception when return is underway rather than chasing coverage behind the ball carrier.
- New isolated policy and live-browser regression tests. No change to calibrated dive/standing arm poses.


## v0.36.4m — Head-On Contact & Stand-Up Tackling
- New `src/square_contact.js` classifies truly opposing, square pad-to-pad momentum; glancing and pursuit contacts are not automatically considered head-on.
- During square collisions, stronger lateral contact friction resists the defender sliding off the side. Existing impulse and mass physics continue to determine actual movement, with no hard position snapping.
- Short-lived, physics-derived `standContact` signal drives a procedural upright bracing silhouette (reduced stride/bob and a stronger lean), not animation-based outcomes.
- An earned square, quality wrap can finish sooner after grip develops. A weak grab cannot. Truck and stiff-arm actions suppress this timing credit; neither contact nor animation guarantees success.
- Rear drag-down rule excludes established square wraps, reducing false conversion of head-on collisions into side/rear takedowns.
- Existing tackling, missed dives, dynamic extra-yard struggles, kickoff escort behavior, and arm pose calibrations remain in place.

## v0.36.4s — same-defender repeated-grip hotfix
- Requiring physical post-escape separation and regained defensive control before the same defender can grip that carrier again; retains legitimate chase and second-tackle outcomes.
- Dedicated `tackle_reengagement.js` policy; browser and node reproduction tests; no rating changes.

## v0.36.4u — Return-role & contact-eligibility hotfix
- Corrected stuck special-teams action cue timers; physical-contact recovery after a broken grip now supports stopped runners without bypassing the genuine-separation requirement for moving runners.
- Contact overlap can overcome stale defender facing when evaluating a *real* hit, not create a phantom tackle.
- Alternate deep-returner catches now swap escort roles; a trailing deep returner takes a catch-up escort path rather than remaining confused behind the carrier.
- Renamed `TRUCK HELD` temporary diagnostic feedback to `TRUCK STOPPED`.
