# Gridiron Lab v0.33 — focused gameplay patch

This patch builds directly on v0.32. **No pass protection, special-teams game flow, offensive catch controls, kick placement, player rating profiles, or scoring rules were rewritten.**

## Defensive Xbox controls

* **A, live defense with a runner:** conservative wrap. The regular TAK/STR/leverage/grip calculation remains in charge. Conservative commitment modestly raises initial grip, with a small stamina cost.
* **X, live defense with a runner:** hit stick when within body radius + 0.4 yd (minimum 1.35 yd), otherwise a tackle dive. The dive has a physical impulse and recovery cost if it misses; no teleporting toward the runner. Both are proximity-/rating-dependent attempts, not automatic tackles.
* **B:** switch defender, retained. Right-stick up/down hit/cut sticks retained.
* **Airborne pass:** X/A/Y still select swat / play receiver / ball hawk, as in v0.32; the tackle buttons do not override ball-in-air actions.
* Keyboard practice alternatives: Z conservative, X contextual tackle; H/N existing hit/cut.
* A visible 3D forward-diving pose is added for a defender committed to a tackle dive.

The new pure `src/defensive_controls.js` module decides action type. The existing `tackleStyle`, `resolveTackles`, and `defensiveFaceButton` functions own physical application.

## CPU QB decision timing

`src/cpu_qb_policy.js` supplies independent timing and concept-development thresholds. Quick concepts can release after about 1.2–1.5 seconds, while Four Verticals / Slant-and-Go demand over two seconds unless the pocket collapses. Field vision, DEC, actual route progress, catch-window score, and coverage danger inform decisions. Strong immediate pressure still allows an emergency release or scramble. The AI is not guaranteed to make a completion, nor to throw every snap if no window is viable.

## Pursuit of a moving quarterback

`src/rush_awareness.js` calculates current pocket escape / rollout cues every AI update from QB y-position and lateral velocity. Edge rushers maintain outside contain until a rollout is visible and then close toward the live QB, while interior rushers abandon old pocket waypoints when the QB is actively escaping. Nearby shallow-zone defenders can also rally earlier. Existing contact/block-winning physics stay intact. The rush intent is preserved when block resolution updates links.

## Controller playbook

`src/playbook_navigation.js` handles D-pad selection geometry and formation cycling separately from gameplay. While the playbook sheet is open:

* D-pad moves the highlighted card (columns reflect screen width).
* A selects the highlighted play / coverage / pressure / kickoff return. On a selected kickoff call, A can also start the kick.
* X snaps after selection.
* LB / RB cycle all six offensive formations or defensive fronts.
* VIEW opens/closes the sheet. Default pre-snap control outside the sheet retains existing navigation.

Visible yellow selection outline and scrolling keep the focused card clear. No unrelated overlay/renderer rewrite.

## Validation

Before gameplay simulation: `node --check src/{engine,renderer3d,defensive_controls,cpu_qb_policy,rush_awareness,playbook_navigation}.js`, `node qa_v33_policy_unit.js`, `python build_standalone.py --check`.

Browser tests: `python qa_v33_controller_cpu_rush.py` (1120/390), `xvfb-run -a python qa_v33_visual.py` (true WebGL, 1120/390). Run previous `qa_v32_kickoff_control_returns.py`, `qa_v31_game_flow.py`, `qa_v28_xbox_ball_air.py`, `qa_v16_formation_matrix.py`, and `qa_v28_1_protection_switch.py`.

## Known limitations

Controller hardware has not been tested physically. CPU route reads and pressured scrambling are still approximations; the defensive AI is not yet a full NFL strategic coordinator. The dive animation is procedural, not motion captured; foot planting and shoulder alignment can be further improved. NFL complete penalty implementation remains future work.
