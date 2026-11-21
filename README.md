## v0.36.4t — Pursuit Reaction & Truck/Trip Feedback

- Near-contact CPU pursuit now uses a rating-dependent short observation/reaction window rather than following every single frame of a carrier cut. This affects **aim only**, never teleports, speed-matches or applies artificial forces. Long-distance pursuit angles are unchanged. Kickoff coverage uses the same close-contact policy instead of bypassing it.
- An actual successful TRUCK against a defender now receives a TRUCK cue; a defeated truck receives TRUCK HELD. Subsequent low-leg contact from that same defender cannot silently overwrite a truck win with STUMBLE unless a genuine trip occurs. Light leg clips no longer automatically display STUMBLE; physics and trip thresholds remain unchanged.
- Original tackling, block and reengagement systems retained. Regression scripts: `qa_v0364t_policy.js`, `qa_v0364t_feedback.js`, earlier `qa_v0364s_browser.py` etc. See `QA_v0364t.md`.

### v0.36.4r controls
Defense: **hold A (gamepad) or Z (keyboard)** to prepare a conservative wrap *on real contact*; just running into an opponent can also establish a natural tackle on collision. **Press X** to commit to an untargeted close-range power hit or distance-based dive; stick/velocity determines launch direction. X can physically impact offensive blockers and receivers as well as the ball carrier. Right stick up commits a direction-based power action. When the ball is airborne, existing X swat / A play receiver / Y play ball priorities remain intact.

# CHAOS v0.36.4q — Foot Contact, Trips & Hurdles

**Prototype scope:** a self-contained 11-on-11 browser physics laboratory. This version starts from the exact v0.36.4p playable baseline. `index.html` is produced by `python build_standalone.py`.

## New in v0.36.4q

- Low ankle/foot collisions use a swept horizontal approach and clearance-sensitive anatomical approximation. Fringe brushes don't trigger the long contact cooldown, and repeated impacts must earn new contact.
- Light or imperfect low impacts can disrupt momentum, balance and stride; high-impact, well-positioned contact can trip a compromised runner. A trip ends play under existing tackle/whistle rules.
- Y on the Xbox controller (G/Y on the keyboard, or the existing on-screen HURDLE control) initiates a timed jump. Whether it clears a low tackle depends on actual height at collision, not a random guaranteed evade or a temporary shield.
- A short automatic hop may trigger when a runner approaches a grounded defender squarely. Landing and toe contact are still active. Grounded defenders may reach for a runner's feet when properly oriented and near enough.
- The same airborne height increases balance penalties when an upright defender makes real body contact; no free invincibility. Midair catch impacts and complete articulated falling animations remain future work.
- Prior grip-based escape, secured wrap, blitz pickup and kickoff blocking are intentionally retained.

**Diagnostics:** `GRIDIRON_DEBUG.debugLowContact()` gives contact counts and the last contact result. `GRIDIRON_DEBUG.debugFootScenario()` prepares repeatable low-contact scenarios. `debugSetBalance()` is QA-only.

**Tests:** `node qa_v0364q_low_contact.js` and `python qa_v0364q_browser.py`; see `QA_v0364q.md`.

---

# CHAOS v0.36.4p — Physical Escape Reactions

Surgical update on **v0.36.4o** (retains head-on tackles, live anatomical collision, accurate arm reaches, kickoff blocking, leg-drive escape).

- Failed grip **does not automatically ground the defender**. `src/escape_reactions.js` classifies slip, pull-through, twist, drag-release, and airborne dive follow-through using actual velocity, grip, leverage, and balance. Only airborne committed dives or substantial physical instability permit a fall.
- **Visible runner/defender struggle** is driven by live escape exertion and grip strain, shared through read-only `AnimationPolicy`; the presentation doesn't decide whether grip releases. Gradual leg drive, bracing and torso counter-rotation replace purely textual BREAK TACKLE reactions.
- **Escaped defenders can remain upright**, briefly stagger, and rejoin pursuit after the appropriate physical recovery time. No teleporting, no arbitrary all-or-nothing fall.
- **Consecutive breaks accumulate leg fatigue and balance costs** that recover over time, avoiding arbitrary streak caps. Test both weak grabs and secured wraps.
- Debug: `GRIDIRON_DEBUG.debugEscapeContests()` and `debugEscapeReactions()`; `getState()` includes strain, exertion, release kind.

Still approximate procedural body/foot physics. No real articulated foot contacts or multibody inverse kinematics. See `QA_v0364p.md` for automated tests and manual checks.

---

# CHAOS v0.36.4o — Break Tackle / Wrap Break foundation

Based on v0.36.4n. Adds `src/tackle_escape.js`: a time-integrated escape contest driven by physical leg drive, lower-body strength (existing STR/TRK/ACC), stamina, balance, direction of travel, grip quality, defender technique and grip security. Weak/ordinary contacts have a lower release threshold than an established wrap. Escapes only occur after a physical link exists; no animation-driven auto-break and no random dice. The existing head-on, kickoff and dive systems are preserved.

The engine exposes `debugEscapeContests()` for live diagnostics. Existing runner movement during a contested grip is still provided by `tackle_struggle.js`; this release does not claim finished foot plant, skeletal escape, or complete physics.

Run `node qa_v0364o_escape.js` and `python build_standalone.py --check`. See `QA_v0364o.md` for results.
## v0.36.4n — Diving Collision Integrity

The new `src/dive_collision.js` applies swept physical low-dive impacts before the usual tackle resolver, including kickoff returns. It handles significant intersections without awarding automatic tackles; very light brushes have no substantial effect. Missed defensive dives now ground consistently on scrimmage and returns. Try the new **Kickoff-speed low dive** preset in CONTACT LAB. QA: `node qa_v0364n_dive.js`, `python qa_v0364n_browser.py`, `python build_standalone.py --check`. This is an incremental physical constraint, not complete limb/ground rigid-body physics.

# v0.36.4k note

Persistent soft attachment after established contact; actual anatomical contact quality, approach accuracy, leverage and TAK/AWR influence grip. Non-contact remains miss; weak brushes do not attach. See `QA_v0364k.md`.

### v0.36.4j — More natural arm preparation

In Contact Lab, compare **Dive into legs** and **Textbook secured wrap**. A dive now raises the arms gradually as the defender leaves the ground, reaching the existing 135° target. Standing wraps now lift arms across multiple frames while approaching the carrier rather than popping forward on torso contact. The 15-region anatomical collision model follows the same arm pose. Collision and tackle-success rules are unchanged.

Run `node qa_v36_4j_reach.js` and `python build_standalone.py --check`; see `QA_v0364j.md` for regressions and limits.

### v0.36.4i pose calibration

Diving arm reach is now ~135° (180° means straight overhead); standing wrap reaches at ~90°. Open Contact Lab and compare **Dive into legs** with **Textbook secured wrap**. This is a procedural pose refinement, not a new tackle success rule.

# CHAOS v0.36.4h
Playable standalone: open `index.html` in a modern browser. Open **CONTACT LAB** for controlled anatomy tests.

Current patch: diving arms lead and remain relatively straight until actual contact, then gradually turn inward to wrap. The pose is shared by renderer and anatomy. Actual tackling success remains governed by existing physics/rating logic.

Read `QA_v0364h.md` and `CHANGELOG.md` for scope, validation, and known limitations.

## v0.35.5 — Pre-snap camera and modular animation foundation

The 3D pre-snap camera is pulled back and balances the selected defender with the formation, then returns to ball-following during live play. The new `src/animation_policy.js` reads existing player motion, contact, ball actions, and knockdowns to provide named, physics-independent animation states and subtle body pose accents. This is a modular procedural animation foundation, **not** a new model/texture system or a collision-physics overhaul.

Run `python build_standalone.py` to generate `index.html`; run `python build_standalone.py --check` to verify it. Test the actual 3D view under a graphical environment with `xvfb-run -a python qa_v35_5_animation_camera.py` (Linux). Controller hardware and long gameplay require manual testing.

# Gridiron Lab v0.35.5 — Pre-snap Camera & Animation Foundations

Open `index.html` in Chrome/Edge to play the standalone 3D football prototype. Based on v0.35.4; no football physics or assignment rules have been modified.

- **Wider pre-snap 3D camera**: the camera backs away while an ordinary offensive or defensive play is being set, helping you see both teams before the snap. It follows the selected defender, then smoothly returns to the existing live-ball framing. Kickoff/punt pre-snap framing is unchanged.
- **Independent animation module (`src/animation_policy.js`)**: converts real player simulation states into named visual actions (idle, running, sprinting, blocking engagement, juke, spin, hesitation, hit-stick, other contact moves, airborne catch/swats, falls and standups). The 3D renderer now consumes this module for procedural stride, torso lean, banking, and event-driven accents. This does not change outcome physics, introduce fumbles, or add new player models.
- **Testing:** `python qa_v35_5_animation_camera.py` (WebGL test uses `xvfb-run -a`), plus earlier controller, 144-formation, passing, coverage, and game-flow tests.

This is the first modular animation layer, **not** a realistic skeletal or motion-capture animation system. The 2D fallback's camera framing remains unchanged. Offsides, formation-shift audibles, physics-based tackle animation variants and more realistic character models are future work.

---


## v0.35.4 — Defensive Pre-Snap Positioning
- Selected defender moves with left stick or keyboard before CPU snap while preserving his role and assignment.
- Zone shade and assignment displays update as the defender moves (2D and 3D). Man defenders keep their receiver.
- Defensive pre-snap playbook stays closed by default on CPU possessions; VIEW reopens it.
- Selected defenders resume their AI when manual steering is released after the snap.
- The gameplay physics, stamina, tackle rules, and offensive plays are untouched.

## Latest: v0.35.2

New **run-pursuit policy**: edge contain, distinct interior pursuit angles, and recognition of backward/sideline escapes. PUR and PRC combine to determine angle quality. Completed observed retreats are remembered by formation and field side: even low-rated defenders can occasionally make better reads against repeated familiar escapes, but only when the live runner gives the same visual cues. The game never exposes the currently selected offensive play to defenders through this feature. Defensive play-calling does not adapt yet.

Previous gameplay, audibles, kickoff fixes, and defensive memory remain intact. See `QA_v0352.md` for testing and limitations.

## Latest: v0.33

**Defensive Xbox A** conservative tackle; **defensive Xbox X** hit stick up close or diving tackle from farther away. While a thrown ball is airborne, defensive X/A/Y retain their existing swat / play-receiver / ball-hawk purposes. **B** continues to switch defenders. The CPU quarterback now waits longer for routes to develop, with emergency pressure decisions, and pass rushers respond to the quarterback leaving the pocket.

**Pre-snap playbook:** D-pad selects a card, A confirms, X snaps, LB/RB cycle offensive formations or defensive fronts, VIEW shows/hides. A yellow outline marks focus. Controller input works only with a connected Standard Gamepad (e.g. Xbox One), and physical Xbox hardware has not yet been validated.

See `V33_DEFENSE_QB_AND_PLAYBOOK.md` for behavior and test commands.

# Gridiron Lab v0.32 — Playable return calls and possession-aware special teams

**Play in browser:** Open `index.html` in Chrome/Edge, connect Xbox One controller or use keyboard.

**What's new:** A proper on-field kicker, whose KPW/KAC ratings determine landing depth and lateral error; a return play sheet with **RETURN LEFT / RETURN MIDDLE / RETURN RIGHT**; return coverage and receiving blockers that dynamically target, engage, shed, and bypass rather than freezing on first contact; the correct game-day side swap after a touchdown/PAT or FG; and different offense/defense play-call menus for HOME and AWAY with two prototype playbook identities. HOME starts receiving. When HOME scores, HOME kicks and the player controls coverage; after AWAY receives, the player calls defensive coverage and pressure while CPU offense chooses its own play. On kickoff return, the called lane influences blocking and returner autopilot, but **never determines where the ball is kicked**.

**Controls:** On a receiving kickoff, select Left/Middle/Right in the play sheet, then press Ready/Snap; during the return steer the returner with the left stick and use RT to sprint. When covering the opponent's kickoff, you control a defender (B switches defenders). The kicker is a new editable athlete named Evan Mercer in the Physics Tuning Room; edit KPW, KAC, and PUNT there. The 3D view remains optional; the original 2D view is retained.

**Scope:** Based on 2026 NFL free-kick setup and touchback rules as a simplified first pass, not a complete NFL rules implementation or a licensed Madden clone. See `V32_SPECIAL_TEAMS_RULES_AND_PLAYBOOKS.md` for what is implemented and what is missing, plus `QA_RESULTS_v32.md` for tested paths and limitations.

**Maintained source:** `src/engine.js`, `src/renderer3d.js`, `src/special_teams.js`, `src/browser_template.html`. Build the standalone file with `python build_standalone.py`; verify with `python build_standalone.py --check`. Test with `python qa_v32_kickoff_control_returns.py` and `xvfb-run -a python qa_v32_visual.py` when a virtual graphical display is available.

---

# Gridiron Lab v0.31 — Game Day & Special Teams

**New:** six-point touchdowns; 1-point PAT and 2-point conversion options; 3-point FG attempts; full HOME/AWAY scoreboard; four 15-minute quarters; 40/25 play clocks, timeouts and delay-of-game; kickoff and punt returns with special-team blocking and tackling; fourth-down decisions; new in-field playbook overlay. See `V31_GAME_DAY_SPECIAL_TEAMS.md` for controls, tested behavior and significant approximations. Open `index.html` to start a game from kickoff.

# Gridiron Lab v0.30 — Player Animations & Hurdles

Play offline by opening `index.html` or the packaged `Gridiron_Lab_v0_30_Playable.html` in Chrome or Edge. The same original physics engine drives 3D and 2D. This remains an experimental original prototype, not a licensed game or a polished skeletal animation system.

**New ball-carrier move:** Xbox **Y** while carrying the ball = HURDLE, keyboard **G/Y**, or press **Y · HURDLE** on screen. Before a throw Xbox Y is still the WR2 target, and after the ball is airborne it still chooses an AGGRESSIVE reception. Hurdlers spend stamina and a little momentum; a good timed hurdle can clear a low tackle, not a conventional high wrap.

**Catch/defense animations:** With the pass airborne, Xbox **X** = RAC / SWAT, **A** = POSSESSION / PLAY RECEIVER, **Y** = AGGRESSIVE / BALL HAWK. Xbox **B** still switches to the intended receiver. Floating labels over the player confirm the chosen style immediately. Once the player reaches the contest, the 3D model transitions into a specific catch, leap, swat, defensive disruption, or high-point animation with return-to-ground motion. A player may miss despite animation, or make a tough catch with matching ratings. On keyboard use J/K/L to choose the ball-in-air styles.

**Motion variety:** different posing at the catch point, independent per-snap motion accents, occasional defensive low tackles, along with the existing route and coverage variation. These are not guaranteed play outcomes or an adaptive coordinator; learning your play-calling patterns is still future work.

See `V30_CATCH_ANIMATIONS_AND_HURDLES.md` and `QA_RESULTS_v30.md`. Source: `src/engine.js`, `src/renderer3d.js`, `src/browser_template.html`. Rebuild with `python build_standalone.py`, verify with `python build_standalone.py --check`.

---

## v0.29 — Follow the football and rally to deep passes

The 3D and 2D field now show a **yellow projected catch-zone ring** where the QB's actual throw is aimed at receiver height, plus a **moving ball shadow/ring** directly beneath the ball as it flies. An amber ring shows which player possesses the football; a separate cyan ring marks the currently selected athlete. When a pass is airborne, an intended receiver with no active manual steering runs to the catch point; available nearby teammates can also attempt to help. Press **B** during a pass to manually switch to that receiver, then use the left stick, **X** RAC, **A** possession, or **Y** aggressive. Releasing the stick lets the receiver resume automatic catch-point assistance.

**Secondary support** reacts to deep throws: the primary CB reads the target first, while other corners and safeties recognize the pass and rally toward the projected spot even if they're on the opposite side of the field. A nearby LB can help underneath. Reaction is delayed according to AWR, PRC, coverage responsibility, and distance. Movement still obeys individual acceleration, speed, stamina and physics; no defender teleports or receives guaranteed picks. Defender you control also reacts automatically **during airborne passes when the stick is neutral**; moving the stick retakes control. Original blocking and pass protection remain intact.

## v0.28.1 quick test

Select **Four Verticals**, then snap. Watch LT/RT take the outside rushers, LG/RG handle interior rushers, the center help on leaks, and the RB pick up any unblocked/blitzing rusher. Throw to X/Y/A/B; **after release**, press Xbox **B** to take manual control of the intended receiver, steer to the catch point, then press X (RAC), A (possession) or Y (aggressive). Before the pass, B is still the QB fourth receiver icon. The keyboard equivalent to switch is **B**, with **J/K/L** catch styles.

# Gridiron Lab v0.29 — football physics, 3D ball tracking, and air contests

This is an **original browser-based football prototype**, not an NFL/Madden licensed game and not yet a complete football simulator.

**Quick start:** Open `index.html` or the standalone `Gridiron_Lab_v0_29_Playable.html` in Chrome/Edge. Connect an Xbox One controller via USB/Bluetooth and press a button to activate the browser Gamepad API. If WebGL is unavailable the game can return to the 2D field.

## New on-field choices

After the quarterback has released a pass, select the catch or pass-defense action using the following Xbox One buttons. The same buttons select receiver targets **before** the pass is released.

| Xbox | Receiving | Controlling defense | Keyboard equivalent |
| --- | --- | --- | --- |
| **X** | RAC: catches in stride, riskier in tight coverage | Swat: prioritize an incompletion | **J** |
| **A** | Possession: secure the ball, sacrifice some momentum | Play receiver: contest the catch physically | **K** |
| **Y** | Aggressive: jump/extend for contested catches | Ball hawk: attempt interception, greater whiff risk | **L** |

Mouse and touch players can also click the labeled ball-in-air controls that appear beneath the field when the pass launches. **No action guarantees success**: the selected defender must be in reach. Catch and contest calculations use proximity, height, jump, CAT, COV, AWR and route matchups. All other controllers are experimental. This build has browser-simulated Xbox tests but not tests using a physical Xbox One controller.

## Offensive playbook and defensive calls

13 offensive concepts: Inside Zone, Outside Stretch, Power Left, Counter Right, Sweep Right, Slants, Four Verticals, Mesh, Flood, Slant & Go, Stick/Flat, Dagger, Smash. 6 formations: Shotgun 2×2, Trips Right, Singleback Ace, I-Formation, Shotgun Bunch Right and Pistol 2×2. Defensive fronts: Nickel 4–2–5, Base 4–3, Base 3–4. Coverage: Cover 1, Cover 2, Cover 3, Quarters and mixed auto-call. **Pressure calls**: Balanced, Contain, QB Spy, Blitz, Stunt, or mixed auto-call.

Pressure assignments are no longer uniform: wide rushers maintain outer leverage, a spy can mirror a rolling QB, blitz adds a linebacker to rush, and stunt exchanges interior rush lanes. Effects are approximations, not full NFL protection / stunt geometry.

## Technical source

`src/engine.js` is the maintained game logic; `src/renderer3d.js` maintains the simple 3D presentation; `src/browser_template.html` is the UI. `build_standalone.py` combines these into a browser-openable `index.html`. `python build_standalone.py --check` verifies that the generated HTML matches its sources. In the root directory, the `qa_v28_*` scripts run repeatable browser tests using Python Playwright.

## Known limitations

- Player bodies are stylized, procedural 3D shapes, not full skeletal animation or player-to-player IK.
- Penalty enforcement, authentic full-season rules, pass-coverage audibles and NFL licensing remain future work.
- Catch and pass-defense probabilities are experimental, not measured from official play-by-play data, and will need real playtesting.
- The existing football prototype still has some older test-environment limitations; don't interpret every previous-regression timeout as a clean pass.

---

# Gridiron Lab v0.27 — Quicker positional takeoffs

Open `index.html` in Chrome or Edge; offline browser play is still supported, with 3D and automatic 2D fallback. No installation required to play.

**New in v0.27:** faster first steps for skill-position players without raising their top speed or making sprint obligatory. Early movement responsiveness uses approximate *takeoff tiers*: WR/RB/CB/safeties ~69–72, linebackers/QB ~64–66, TE/FB ~60–61, rush edges ~59, tackles/guards/center/DT/NT ~49–52. **These are NOT replacement SPD ratings or instant running speeds.** Player SPD still limits maximum speed; ACC, weight, stamina, turn behavior, and sprinting remain meaningful. The improvement fades as each player accelerates toward his top speed. It is not yet calibrated to a real 4.20-second 40-yard dash for a 99-SPD player.

See `V27_POSITIONAL_TAKEOFF.md` for measurements and `QA_RESULTS_v27.md` for tests. The previous v0.26 build remains a separate playable backup. The maintained JavaScript source is `src/engine.js`, the renderer is `src/renderer3d.js`, and `build_standalone.py` generates the `index.html` file.

---

# Gridiron Lab v0.24 — Variable Coverage, Jukes & Held Stiff-Arms

# Gridiron Lab v0.23.1 — camera-relative controls

**Playable:** open `index.html` in Chrome or Edge; no installation required.

**3D / behind-the-offense movement:** Xbox left stick UP = run toward the end zone, DOWN = back up, LEFT/RIGHT = screen-left/screen-right sidelines. WASD, arrow keys, and on-screen joystick follow the same 3D directions. RT/Shift sprint and right-stick juke input are unchanged.

**2D / overhead movement:** D / arrow RIGHT = run toward the end zone, W / arrow UP = upper sideline, as in v0.23.

**Controls are automatically adapted when switching views.** Physics, ball-carrier speed, routes, tackle/AI behavior, and camera positioning have not been modified in v0.23.1.

**Source:** `src/engine.js` is the sole maintained gameplay source. `src/renderer3d.js` is the 3D renderer. `build_standalone.py` generates the one-file HTML. `python build_standalone.py --check` verifies the generated HTML hasn't drifted.

**Testing:** `qa_v23_1_camera_relative_controls.py` verifies simulated standard Xbox controller axes, keyboard directions, and live ball-carrier movement under 3D and 2D layouts. A simulated controller is not a substitute for physical Xbox hardware validation.

---

# Gridiron Lab v0.23 — Follow Camera & Repeated-Juke Repair

Open **index.html** in Chrome or Edge. The browser game remains self-contained, offline, and controlled by Xbox One / keyboard. Use **VIEW** to switch between the experimental 3D and original 2D views. No external assets, EA code, or licenses required.

This release keeps the v0.22.1 3D visibility fix and improves camera placement and play art; see `V23_CAMERA_PURSUIT_JUKE.md`. Running-play routes are now visible in the 3D scene, as are pass routes before the snap. The goalposts sit on the **end lines** (x=0 and x=120) behind the end zones, rather than the goal lines (x=10 and x=110).

The new gamepad juke direction is stable relative to the offensive field direction. Left/right mean left/right sideline even after a prior juke. AI defenders can conserve stamina during non-urgent pursuits and sprint when closing or when a score threatens. This is an initial balance change, not proof the defensive game is finished.

**Run tests:** `python build_standalone.py --check` and QA scripts described in `QA_RESULTS_v23.md`. The maintained source files are `src/engine.js`, `src/renderer3d.js`, and `src/browser_template.html`; `index.html` is generated from those. To rebuild: `python build_standalone.py`.

---

# Gridiron Lab v0.22 — Adaptive Pursuit, CPU QB and First 3D Prototype

Open `index.html` in Chrome or Edge. This is a browser football prototype, **not** a finished Madden-scale game. v0.22 adds an optional early low-poly WebGL 3D display; browsers without WebGL fall back to the existing playable 2D view. **The automated testing browser in the development environment does not provide WebGL, so actual 3D drawing has not been visually validated here.** The 3D view and CPU QB are experimental and require real-browser playtesting.

## New in v0.22 — live adaptive pursuit / moving blockers / first 3D experiment

- Defenders continuously recalculate a pursuit aim at 60 simulation ticks per second from the runner's position and **current** velocity. A distant player takes a short rated interception lead (at most 0.85 seconds); a defender within tackling distance drives at the runner directly (about 0.025–0.035 seconds lead). Force and deep-safety positions retain leverage without creating a long phantom path. PUR influences anticipation, not an automatic speed increase.
- Receivers and linemen on post-catch runs continuously project a threatening defender's motion and attempt to get on the ball-carrier side of the collision. Block targets still prioritize likelihood of a tackle, reachability and existing contact; they do not randomly switch away from an established engagement.
- A **first low-poly WebGL 3D** field and articulated player model layer reuses the existing gameplay simulation (not 3D physics). Player body dimensions vary by height/weight and the animation poses reflect running, blocking, active contact, cuts and grounded states. The user can switch between 3D and the old 2D view. On browsers without WebGL, 2D is the fallback.
- AI-controlled QB in defensive mode assesses routes, defender positions at expected catch time, pressure, throw velocity, offensive opportunities, and decisions using VIS, DEC, TOR and BSK ratings. CPU throws are not guaranteed good choices.
- `src/engine.js` is still the one maintained physics/AI engine. `src/renderer3d.js` is a separate visual-only component. `python build_standalone.py` produces a **single, no-server HTML** from those files.
- Automated regression: `qa_v22_adaptive_pursuit.py` passes on desktop and mobile layouts; `qa_v22_smoke.py` confirms CPU QB throws in defensive-control mode; previously existing controller, QB crossing, route continuation, tackling and 144 run-play matrix tests passed; full outside WR blocking tests passed after correctly distinguishing a **fall-causing attacker** from the receiver's **blocking assignment**.
- **Limitations:** no physical gamepad test, no verified WebGL screenshot in this headless environment, 40-yard dash calibration still pending, high-quality 3D interaction animation not yet achieved, old stamina/collision-chain physics tests still have known failures. No new full penalty system yet.

## New in v0.21 — reactive route endings, QB run commitment and tackle-threat blocking

- Completed receiving routes transition into a **scramble drill**: players keep moving and search for separation based on nearby coverage, QB position, route technique and spacing with teammates.
- The QB may legally throw while behind the line. **Crossing the line of scrimmage with the ball immediately converts him to a runner**. A charged pass is canceled; running back behind the line does not restore passing. Other receivers switch to blocking.
- On a catch or QB scramble, receivers and linemen use a shared *predicted tackle threat* score. Closing velocity, acceleration, pursuit and tackling ability influence which defender matters most; blockers also consider reachability, matchup strength and already-established contacts.
- The existing standalone HTML and the single master JavaScript engine remain supported. Run `python build_standalone.py --check` to verify the browser version matches master source.
- Full penalty enforcement has **not** been implemented yet. A QB crossing the LOS is now prevented from throwing; this is a gameplay conversion, not a penalty call.

## From v0.20 — accurate touchdown gains and post-catch blocks

- Touchdowns now credit the correct distance to the opposite end zone (80 yards from your own 20), including overlay and log.
- On pass plays, once an offensive player has secured the ball beyond the line of scrimmage, other receivers switch to downfield blocking, choosing nearby defenders from their current route locations. QB scrambles trigger this too.
- The NFL-inspired penalties plan is documented in `PENALTY_IMPLEMENTATION_PLAN.md`; automatic flags are NOT yet enabled.
- Run `python qa_v20_touchdown_and_live_receivers.py` to test the new behavior in Chromium.

## New in v0.19 — matchup recognition and verified one-source builds

- CBs now have independently editable RCR (pass-route recognition) and DIS (double-move discipline) in addition to press, jam, and mirror ratings. On slant-and-go, poor discipline can cause a short physical false step; high discipline resists it. Receiver release, double moves and cuts remain ratings/physics-driven, not guaranteed wins.
- New readable pre-snap and live man-matchup comparisons in the coordinator room.
- `python build_standalone.py --check` confirms the offline HTML exactly matches the master `src/engine.js` and browser template, without modifying files. See `V19_ROUTE_MATCHUPS_AND_SINGLE_SOURCE.md`.

## Retained from v0.18 — sharper cuts closer to 90 degrees

- Right-stick left/right jukes now prioritize a **brief lateral plant** rather than a long diagonal slide. During the plant the runner trades some forward velocity for sideways movement, then accelerates downfield again.
- The controlled forward-left-stick + Xbox input test shifts the running back about **2.2 yards** sideways instead of about 1.5; peak motion direction reaches roughly **70 degrees away from straight ahead** under test conditions. That is a directional cut, not a literal instantaneous 90-degree teleport.
- AGI/CUT ratings and fatigue still govern strength, physics remains within the SPD cap, and repeated moves use the existing short input buffer. Receiver blocking, defensive AI, other controls and mechanics are retained.
- See `V18_SHARPER_JUKES.md` and `qa_v18_sharper_jukes.py` for measurements and caveats.

## Retained from v0.17 — right-stick cuts while running and true outside blocking lanes

- **Xbox left stick forward + right stick sideways** now physically redirects the running back sideways while maintaining forward progress. The cut is a short lateral velocity profile with a plant/recovery, not only a glowing move effect. It obeys the rated speed cap; AGI, CUT and stamina scale effectiveness, and low-energy jukes remain available. Simulated Standard Gamepad tests hold both sticks, with and without RT sprint.
- **Wide receivers** stick with their assigned man-coverage corner when he's reachable in their outside lane and prioritize the closest eligible defender to the receiver (not to the runner) when the initial opponent leaves. They do **not** steal another receiver's primary CB or follow a CB all the way across midfield to chase the ball carrier. The slot receiver has its own lane.
- Wide receivers accelerate into actual physical block engagements rather than braking just before contact. Coverage and blocking ratings still determine outcomes.
- Added sustained full-run tests for Outside Stretch and Power Left: all three WR/CB pairings actually engaged, WRs stayed in their lanes through ~8-second simulated runs, and Xbox right-stick cuts occurred while simultaneously holding forward and sprint inputs on desktop/mobile-sized browsers.
- The source of truth remains `src/engine.js`, with standalone `index.html` generated using `python build_standalone.py`.
- **Known limitations:** browser gamepad is simulated, not tested on a physical Xbox One controller; the older stamina-bank expectation and mass-collision-chain physics assertion are unchanged and fail their legacy tests. Route and blocking AI still need real-gameplay balancing.

## New in v0.16: real lateral jukes, receiver-v-corner run blocks
- Run plays assign each wide receiver an initial corner matchup: use actual Cover 1 man assignment when applicable; otherwise use the aligned same-side corner. In heavier fronts with no slot corner, slot WRs take a sensible nearby DB/underneath defender instead of taking the outside corner away from the outside WR.
- Receivers pursue their primary defender before and after handoffs, sprint toward predicted interception points, and attempt actual physical block contact, not pass routes or generic center-of-field escorting.
- After the initial corner is defeated or safely behind the runner, receivers choose other nearby same-side threats or escort their side of the run; they are not magically guaranteed to win their blocks.
- Right-stick left/right jukes now produce actual lateral displacement through plant-and-drive velocity. AGI and stamina affect distance, with zero-stamina but weaker jukes still available. Consecutive flicks remain buffered.
- The latest tests are `qa_v16_juke_and_run_blocking.py`, `qa_v16_live_blocks.py`, `qa_v16_formation_matrix.py`. Run `python build_standalone.py` after editing `src/engine.js`.
- This remains a 2D simulation; receiver route and coverage AI, body contact and gameplay balance will need more tuning and physical Xbox hardware verification.

## Input refinement in v0.15

- Consecutive Xbox right-stick jukes now use a shorter replant window (0.20 s) and a one-action input buffer so rapid flicks are not discarded. Opposite-direction flicks can trigger without fully centering; a held direction does not spam moves.
- Zero-stamina jukes remain possible at reduced effectiveness. This does not alter the normal stamina or defender physics from v0.14.
- See `V15_JUKE_INPUT_FIX.md` and new `qa_v15_juke_chain.py` for exact changes/tests. Future original wall-running, rebound catches and aerial moves are documented in `FUTURE_3D_ARCADE_MOVES.md`; NOT implemented.

## Retained from v0.14

- Xbox One **right-stick controls** vary by the athlete you control. For running backs: up trucks, left/right jukes, down hesitates/back-jukes. B spins, A stiff-arms, RB covers the ball, X tap gives up, X hold dives. Defensive practice adds B to switch defenders, right-stick up to hit-stick, down to tackle low; offensive-line practice adds right-stick up to impact block and help push piles. Hold QB LT to enter runner-move mode without losing X/Y/A/B receiver passing when LT is released.
- New **CONTROL** button cycles OFFENSE / DEFENSE / O-LINE practice. Other athletes continue their own AI routines.
- Moderate sprint drain, movement recovery, and no stamina lockout on repeated moves. Juke cooldown is short, and zero-energy moves execute with much less speed and matchup effectiveness.
- All v0.13 receiver blocking, second-level OL, pass trajectories, tackle ratings, and formations remain.
- See `V14_XBOX_CONTROL_AND_STAMINA.md` for mapping, verification, and experimental limitations.
- Long-term Unreal Engine 5 ambitions are documented in `FUTURE_UNREAL_ENGINE_5.md`; no UE5 game or 3D renderer is included yet.

## Run/modify

`src/engine.js` is the **single maintained gameplay source**. `src/browser_template.html` holds the webpage. Run `python build_standalone.py` to regenerate standalone `index.html`, which requires no local server. This avoids independently editing two copies of the engine. `index.html` should be considered a generated standalone artifact.

## Current limitations

- Movement/body interactions and actions are simplified overhead animations, not articulated 3D skeletal animation.
- The simulated tackle win/lose outcomes are experimental tuning, not calibrated from verified NFL tracking data.
- Deep-ball trajectories are new and need further calibration for catch point, pass breakup, late defender arrival, vertical throws, and sideline positioning. Xbox mapping is tested in browser simulation only; an actual physical Xbox One controller still needs hands-on verification.
- An older **v0.12 physics regression** fails an unconditional assertion that a heavier first hitter always gives the last man in a four-person chain more instantaneous velocity. It fails unchanged in v0.12 and v0.13 because earlier winded/ground contacts change subsequent transfer. That is a separately tracked physics-test/model issue, not a regression introduced here. Do not interpret every cascade as strictly monotonic in body mass.

## Automated QA

`qa_v13_features.py` (legacy tests with a now-outdated stamina-recovery expectation) tests receiver run blocking, receiver hold passing, action inputs, 84 play/front/formation combinations, a guarded clean block and second-level assignment, player-specific stamina carry-over, and distinct contact costs. Its original v0.13 stamina-recovery expectation no longer holds after the v0.14 tuning; retain the test for historical context.

`qa_contact_techniques.py` passed after the v0.13 update.

`qa_defense_pursuit_v11.py` passed with its preexisting old stamina expectation revised to match the actual v0.12 endurance behavior (the old test never held the player sprint button). `qa_previous_physics_and_play.py` retains the known legacy mass/velocity assertion failure for future investigation.

This is an original football simulator; no third-party proprietary game source code or assets are included.

`qa_v14_controller.py` runs the new v0.14 Xbox and stamina behavior tests in Chromium at desktop and mobile viewports. Physical hardware testing is still pending.


## v0.24 controls and balancing
- **Defense:** Coverage defaults to **Mix Coverage**; a new coverage is drawn for each new setup. The actual call appears in the scheme readout. To test a specific defense, select Cover 1, 2, 3, or Quarters manually. The custom/manual selection stays active on subsequent snaps.
- **Routes:** Route waypoints, tempo, DB reaction and mirroring vary slightly between plays; execution spread is narrower for higher route/cut/coverage technique ratings. Outcomes are not guaranteed or perfectly randomized.
- **Ball carrier:** **JUK** is an independent 1–99 juke technique rating affecting speed retention, lateral cutting and tackle-move success; **SFA** affects stiff-arm success. Set RB or WR in the tuning room to adjust them. Higher ratings still obey each player's SPD ceiling and normal stamina limits.
- **Xbox One:** Hold **A** after a handoff or catch to keep the stiff arm extended (one contact attempt per press, stamina drain while held). In QB passing mode, A remains a receiver button; holding LT switches to ball-carrier controls. **F** is the keyboard hold equivalent.
- **3D:** The simplified player model extends one arm while stiff-arming. These are procedural poses; detailed joint/contact animations remain future work.
- **Build:** Edit only `src/engine.js` and `src/renderer3d.js`, then run `python build_standalone.py` to produce `index.html`. The HTML runs locally without a server. Run `python build_standalone.py --check` to check source alignment.
- **Testing:** See `QA_RESULTS_v24.md` and `qa_v24_variation_juke_stiff.py`. Tests emulate Xbox inputs; physical controller verification remains outstanding.

### v0.25 movement tuning
Players leave a standing start slightly faster, with the extra acceleration fading smoothly before normal running speed. See `V25_QUICKER_FIRST_STEPS.md`.

### v0.26 defensive pursuit
Defenders retain more speed during manageable turns and accelerate more decisively after catches; rating-based speed caps and stamina still govern breakaways. See `V26_DEFENSIVE_CLOSING_AND_ACCELERATION.md`.


### v0.35.7 testing note
Quarter length is **temporarily one minute** for rapid testing. To restore normal 15-minute quarters, set `QUARTER_DURATION_SECONDS` from `60` to `900` in `src/engine.js`, then run `python build_standalone.py`. The two-minute warning automatically returns for quarters longer than two minutes. Future versions may expose this setting through the game menu.

### v0.36.0 testing notes
During the temporary 1-minute-quarter test mode, Q2 ends at a **HALFTIME** overlay. Click **START THIRD QUARTER**, press Enter, or press Xbox A to proceed to the second-half kickoff. The new `STATE:` indicator below the field reports what the game is waiting for. Normal scrimmage delay of game costs five yards without consuming a down; the CPU normally snaps first, but an expired CPU play clock also incurs the penalty. The return-blocking adjustments are conservative and require further live gameplay feedback.

### v0.36.2 focused animation and pursuit changes
See `QA_v0362.md`. Blocking poses now reach toward the actual block partner; close-range pursuing corners are less likely to circle rather than close. The blocking/tackling rules themselves are unchanged.

### Current v0.36.4 scope and longer-term motion requirement

`src/inside_zone_iq.js` provides Into Zone-specific primary/combination block assignments, forward-facing field-of-view, moment-to-moment visible threat scoring, and AWR-based read delays when moving to second-level targets. The contact solver applies modest strength-dependent displacement only after secured Inside Zone blocks. A paused match deliberately throttles field render calls; live game cadence is unchanged. See `QA_v0364.md` for measurements and caveats.

**Nonnegotiable animation design rule for later work:** Do not trap athletes in canned actions after contact changes. A successful shed, collision with a second blocker, stumble, brace, change of leverage or re-engagement must be able to interrupt/blend the current visual pose, with physics controlling actual movement. Prevent impossible snap rotations and omniscient reactions; animate the player state that exists, not a predetermined clip that ignores surrounding bodies. Full animation blending has **not** been implemented by v0.36.4.

### v0.36.4c — end-zone kickoff option
A returned kickoff or safety kick **caught by the user inside the end zone** stays live. Move with a direction input within two seconds to bring it out, or remain neutral for an automatic touchback (or deliberately give up). The automatic idle timer is a control convenience rather than an official NFL rule. See `QA_v0364c.md` for tests and remaining limitations.

## v0.36.4e contact laboratory
Click **CONTACT LAB** in the game controls (after completing the coin toss), then choose a scenario, player size, and timeline. Use PLAY or +1 FRAME to reproduce body-region collision tests; click EXPORT CONTACT LOG for the current scenario, or LIVE CONTACT LOG to inspect recent in-game evidence. The lab does not change real-match tackle results. See `QA_v0364e.md` for tests/limitations and `DEPENDENCIES.md` and `ASSET_PROVENANCE.md` for the new code/asset inventory.

### v0.36.4f contact lab directions
Use **CONTACT LAB → Scenario** to select rear pursuit, head-on, north/south side impact (90°), or any northeast/northwest/southeast/southwest diagonal. Step or scrub the timeline and inspect body-region contact. The glancing preset now registers light arm contact, which is intentionally **not** an automatic tackle. See `QA_v0364f.md`.

### v0.36.4g contact calibration
Select **CONTACT LAB** and compare **Glancing arm contact** (light contact), **Missed dive (wide)** (miss), **Dive into legs**, and **Textbook secured wrap** (eventually classified as a guaranteed tackle *only after sustained contact/grip*). Lab outcomes are diagnostic simulations; actual physics remains partly powered by the older tackle solver. See `QA_v0364g.md`.


### v0.36.4L changes
- New `src/body_constraint.js`: bounded 2D torso/hip pad overlap correction during body coupling; keeps anatomical arms free to wrap.
- New `src/tackle_struggle.js`: quality/ratings/balance/forward-momentum dependent finish delay and braking for imperfect solo wraps.
- Backup kickoff returner gets forward-lane lead-escort behavior after fielding.
- Run `python build_standalone.py` before distribution; `python build_standalone.py --check` confirms generated HTML.


### v0.36.4m — Square contact / stand-up foundation
- Added `src/square_contact.js` to classify physics-based opposing momentum and earned tackle timing.
- Pad-to-pad square collisions gain stronger lateral friction. Existing grip and standing-wrap animations still apply, now with a physics-derived upright bracing signal.
- Contact outcomes remain determined by mass, momentum, ratings, actual anatomical contact, and grip quality. A pose never guarantees a tackle.
- Test with `node qa_v0364m_square.js` and `python qa_v0364m_browser.py`; rebuild `index.html` with `python build_standalone.py`.
