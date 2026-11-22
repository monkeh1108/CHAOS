# v0.33 QA Results

**PASS** JavaScript syntax for all new and edited JS files; single-source standalone generator check.

**PASS** `qa_v33_policy_unit.js` — conservative/hit/dive proximity thresholds, QB timing thresholds, dynamic rush target, playbook grid movement and formation wrapping.

**PASS** `qa_v33_controller_cpu_rush.py` at 1120x820 and 390x820 — real simulated Xbox D-pad and face buttons on kickoff sheet, CPU QB does not throw instantly, dynamic edge rush target/intents, three tackle commitments and formation cycling, no startup errors.

**PASS** `qa_v33_visual.py` with desktop WebGL under Xvfb at 1120 and 390 — visible menu selection and procedural defensive dive action without a blank 3D screen.

**PASS** previous `qa_v32_kickoff_control_returns.py` — kicking/receiving role reversal, return schemes, kicker, defense playbook.

**PASS** previous `qa_v31_game_flow.py` — six-point touchdowns and tries, kickoff, punt, game clock.

**PASS** previous `qa_v28_xbox_ball_air.py` — X/A/Y ball-in-air actions on both sides.

**PASS** previous `qa_v16_formation_matrix.py` — 144 run/front/coverage combinations.

**PASS** previous `qa_v28_1_protection_switch.py` — coordinated pass-protection assignments and B receiver switching.

**CPU QB controlled dry-run timings** (contact disabled; sample play): Slants / Mesh released around 1.3–1.5 seconds; Four Verticals / Dagger around 2.4–2.6 seconds. The result varies by coverage and pressure; these are not guaranteed release times.

**NOT VERIFIED** Physical Xbox One hardware, full-length statistical gameplay balance of every CPU opponent, and complete penalty/rulebook handling.
