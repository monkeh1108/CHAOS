# CHAOS third-party dependency register

Working baseline: v0.36.4e (2026-11-11). This is an inventory of the new changes and an initial scan, **not legal clearance of all historical project files**.

| Component | Source | Role | License/commercial status | Action |
|---|---|---|---|---|
| `src/contact_evidence.js` | Authored specifically for CHAOS in this development update | Read-only live contact event monitoring | Original implementation; no third-party imports | Preserve source/history |
| `src/contact_lab.js` | Authored specifically for CHAOS in this development update | Interactive collision replay/debugger | Original implementation; no third-party imports | Preserve source/history |
| `src/anatomy_hitboxes.js` | Existing CHAOS v0.36.4d project source | Anatomical capsules and swept samples | Existing project code; no external import declared in file | Preserve source/history |
| Browser APIs (Canvas 2D, WebGL, requestAnimationFrame) | Web platform | Rendering and test interface | Platform capabilities rather than bundled libraries | No extra bundled dependency |
| Playwright (developer QA only) | Python package in testing environment | Automated browser testing, **not shipped in standalone HTML** | Dependency license must be reviewed before shipping any testing tooling | Keep out of game build |

Additional historical libraries, models, fonts, music, tutorial excerpts or assets: **not fully audited**. No new third-party packages or assets were added in v0.36.4e. Review the entire repository and its history before any public/commercial release.

## v0.36.4p
No runtime dependency changes. Pure JavaScript `src/escape_reactions.js` uses only built-ins; browser test uses the pre-existing Playwright QA environment (not shipped as a runtime library).
