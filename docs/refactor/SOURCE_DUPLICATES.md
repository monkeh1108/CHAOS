# Phase 1 source audit

Each of the 33 root JavaScript files with a same-named file under `src/`
was compared on the Phase 0 commit. Thirty paired files matched byte for
byte. The three differences were already present before the layout work.

| Root copy | Difference in maintained source |
| --- | --- |
| `engine.js` | Additional body-contact and tackle diagnostics, rear-contact eligibility and safety recognition changes, fall handling, and browser fixes around snap state, possession and receiver indicators. |
| `renderer3d.js` | Uses `sim.markerCarrier` for the possession marker and gives it priority when drawing players. |
| `tackle_escape.js` | Sets applied leg power to zero when the carrier is coasting. Contact velocity can still stretch the grip. |

`build_standalone.py` referenced the maintained `src/` versions for all
three and continues to read only maintained source after the moves. It
checks against the same SHA-256 prefix, `8e87e04108098567`. The root HTML
template matched its maintained copy. The root workflow and agent helper
copies matched their canonical counterparts at the start of this phase.
The review branch retains those copies after GitHub automatic review
blocked their removal.

Git retains the old files. To see changes to the old root engine and
open its contents at the baseline commit, run the following commands.

```sh
git log -- engine.js
git show bdbd167:engine.js
```
