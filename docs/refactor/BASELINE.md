# Phase 0 baseline

The reference is commit `bdbd167` (Tackle fall). The opening workspace also
had uncommitted changes to `engine.js`, `src/engine.js`, and `index.html`.
The baseline branch was created from the committed version so the existing
tackle edits are outside the review. Both builds passed the consistency check.

| Build | Standalone SHA-256 prefix |
| --- | --- |
| Committed `bdbd167` | `8e87e04108098567` |
| Opening working tree | `07ca4b6940026746` |

## Existing QA

Commands used Python 3.15.2 and Node 24.22.3 on Windows.
All 25 JavaScript QA entry points were run on both trees. Twenty-two passed
and three stopped in setup. The three use an exact LF-only marker to split
the inline script. A separate temporary copy of committed HTML with line
endings normalized to LF made all three pass. See [known issues](../KNOWN_ISSUES.md).

All 55 Python QA scripts were invoked against the opening workspace. Each
stopped at import because Playwright is absent. An installation attempt could
not obtain the package in this environment. These are blocked checks, so
their assertions remain unverified.

## New browser snapshots

Run the verifier with the standalone built for the revision under test.

```sh
python build_standalone.py --check
python tests/golden/test_golden.py --browser /path/to/chromium
```

The default command runs each case twice in fresh browser profiles and
compares the results to each other and to the committed JSON. `--record`
intentionally replaces the fixtures after repeatability succeeds. Review
the resulting JSON diff before accepting any change to the baseline.

Verified in Microsoft Edge 158.0.4370.33. All four scenarios matched their
committed fixtures exactly after two fresh runs each, on both the committed
build and the opening working build.

| Scenario | Snapshot SHA-256 prefix |
| --- | --- |
| Inside Zone run | `f6254acf0489` |
| Verticals pass | `6e897ab77ef8` |
| Kickoff return | `19675112ebd0` |
| Dive into legs contact-lab preset | `f35ee7653b37` |

The first determinism audit exposed that `reset()` reseeded and called
`setup()` before the test supplied its seed. Setting the test's bootstrap
randomness through reset made these runs repeatable. That finding did
not require a gameplay edit.

The automated browser run does not cover manual play. The npm lint and
test commands are planned for a later phase and do not exist in this revision.

The scripted plays sample all 22 players, positions and velocities, the
debug ball state, scoreboard, clocks and contact evidence. The contact lab
case captures the frame-48 readout and the lab's own 90-frame contact export.
The test uses the engine's direct stepping interface. After a whistle,
requested ticks still label the sampling points, while the debug step
stops advancing the play. The fixture does not cover real-time game clock
behavior, live controller input, or visual fidelity.

## Phase 2 browser comparison

The owner ran the 55 Playwright cases on the bundled build. Forty-one passed
and 14 failed on that run. A focused comparison against the original
`bdbd167` standalone reproduced failures in these 12 cases:

- Audibles, camera gaps and toss, controller CPU rush, game flow, kickoff control returns
- Play selection and input, presnap adjustments, protection quickgame, protection switch
- Recovery drag, visual smoke, Xbox ball air

Those cases remain in the strict browser CI suite. The comparison used the
same pytest cases and an override pointing to the original standalone.

The blocking stance fixture was updated to read the imported blocking
policy through `GRIDIRON_DEBUG.policies`. The live dive fixture also failed
only on the bundled run. When motion was advanced explicitly in an Edge
probe, both builds produced the same counts for front, side, diagonal and
miss approaches (1, 1, 1, and 0). The revised test now controls browser
frames as well as its explicit motion steps. These checks do not require
a gameplay edit.

The owner reran both focused Playwright cases after these fixture changes.
Both passed.
