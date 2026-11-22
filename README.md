# CHAOS

CHAOS is an independent 11-on-11 browser football prototype with playable offense, defense, special teams, and an anatomical contact lab. You can play with a keyboard or an Xbox-style controller.

## Run and build

Open `index.html` directly in a modern browser. Complete the coin toss, then use the on-screen playbook. The standalone is self-contained and needs no web server.

The maintained source lives under `src/`. From the repository root, use Python 3.10 or newer to rebuild and check the standalone.

```sh
python build_standalone.py
python build_standalone.py --check
```

## Controls

| Action | Keyboard | Xbox-style controller |
| --- | --- | --- |
| Move | WASD or arrow keys | Left stick |
| Snap or advance after a play | Enter | A in scrimmage when the playbook is closed |
| Audibles before the snap | X | X |
| Pass | 1–4 | X, Y, A, B |
| Truck, juke, or back-juke as runner | T trucks, Space evades | Right stick up, left/right, or down |
| Hurdle, spin, or stiff-arm | G or Y, V, hold F | Y, B, hold A |
| Conservative tackle | Hold Z through contact | Hold A through contact |
| Hit, dive, or tackle low on defense | X commits, H hit-stick, N cut-stick | X commits, right stick up hits, down tackles low |
| Switch defender | B | B |
| Contest airborne pass on defense | J swats, K plays the receiver, L plays the ball | X swats, A plays the receiver, Y plays the ball |

Receiver icons show which pass target each button controls. The same buttons take on different actions when the ball is airborne or a play menu is open.

## Tests

Run these examples from the repository root. Golden verification takes the path to an installed Chromium-family browser. Legacy browser checks also require Python Playwright and Chromium.

```sh
node tests/unit/tackle_escape.test.js
node tests/integration/receiver_icons.test.js
python tests/golden/test_golden.py --browser /path/to/chromium
python tests/browser/contact_lab.py
```

On Windows the three Node integration checks may need an LF-only standalone copy as their first argument. See [Known issues](docs/KNOWN_ISSUES.md) and the [Phase 0 baseline](docs/refactor/BASELINE.md).

## Architecture at a glance

| Path | What lives there |
| --- | --- |
| `src/engine.js` | Current match loop, play execution, and browser wiring. |
| `src/sim/`, `src/ai/`, `src/physics/` | Special teams, play decisions, and collision and tackle modules. |
| `src/input/`, `src/ui/`, `src/render/` | Controller rules, playbook navigation, and field and player presentation. |
| `src/debug/`, `src/net/` | Contact diagnostics and the future online-play boundary. |
| `tests/unit/`, `tests/integration/`, `tests/browser/`, `tests/golden/` | Policy checks, standalone integration checks, browser checks, and reference replays. |
| `tools/`, `docs/` | Local diagnostics, project notes, and archived QA reports. |

Release history is in [CHANGELOG.md](CHANGELOG.md).
