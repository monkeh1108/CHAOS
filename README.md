# CHAOS

CHAOS is an independent 11-on-11 browser football prototype with playable offense, defense, special teams, and an anatomical contact lab. You can play with a keyboard or an Xbox-style controller.

## Run and build

Open `index.html` directly in a modern browser. Complete the coin toss, then use the on-screen playbook. The standalone is self-contained and needs no web server.

The maintained source lives under `src/`. From the repository root, use
Node.js 22.13+ or 24+ to install the pinned build tools and rebuild the
committed standalone.

```sh
npm ci
npm run build
npm run build:check
```

`python build_standalone.py --check` remains an alias for the same build check.

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

Run these commands from the repository root with Node.js 22.13+ or 24+,
npm, Python, and a Chromium-family browser. Set `CHAOS_CHROMIUM` to the
browser executable if automatic discovery does not find it.

```sh
npm run lint
npm test
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
npm run test:browser
```

`npm test` runs the Node and golden suites. For a focused browser check,
run `python -m pytest tests/browser/test_contact_lab.py`. The original QA
results are in the [Phase 0 baseline](docs/refactor/BASELINE.md).

Use `npm run format` to format the JavaScript source after making edits.

## Architecture at a glance

| Path | What lives there |
| --- | --- |
| `src/engine.js` | Match rules and play execution, runnable in Node. |
| `src/core/` | Shared simulation math and named tuning values. |
| `src/sim/`, `src/ai/`, `src/physics/` | Special teams, play decisions, and collision and tackle modules. |
| `src/input/`, `src/ui/`, `src/render/` | Controller rules, browser session and HUD, playbook, and field renderer. |
| `src/debug/`, `src/net/` | Contact diagnostics and the future online-play boundary. |
| `tests/unit/`, `tests/integration/`, `tests/browser/`, `tests/golden/` | Policy checks, standalone integration checks, browser checks, and reference replays. |
| `tools/`, `docs/` | Local diagnostics, project notes, and archived QA reports. |

Release history is in [CHANGELOG.md](CHANGELOG.md).
