# Online readiness

| Area | Phase 0 evidence | Remaining work |
| --- | --- | --- |
| Headless simulation | The legacy debug API drives the packaged game in a browser. | Separate simulation from DOM, browser globals, canvas, and presentation. Prove the same scenarios in Node. |
| Fixed timestep | `update(1/60)` drives live simulation steps. `frame` uses display timestamps to accumulate updates and passes elapsed time into `gameTick` and pre-snap positioning. | Decide how game and play clocks advance independently of display frames. Verify timing before changing it. |
| Determinism | `debugSeed` sets the engine seed. Match initialization, drive reset and coin toss use `Math.random()` before that hook can control them. Tests pin bootstrap randomness, restore it after the toss and any drive reset, then use the engine seed and direct steps. | Inject randomness and clock sources, audit ordering, and test more inputs. The trace export uses `Date.now()` for its filename. |
| Input commands | Tests use existing debug actions. | Convert keyboard, gamepad and CPU behavior to explicit commands. |
| Serializable state | The debug API returns a projection that the test can serialize. | Define complete state with stable IDs and test save, restore and continuation. |
| Events | Existing debug contact evidence is observable. | Replace simulation-to-UI calls with an explicit event list. |
| Controller assignment | The harness exercises the existing local control modes. | Make player-slot and team assignment data-driven. |
| Public boundary | `GRIDIRON_DEBUG.step` and its state readers support the baseline. | Provide a browser-independent `createGame`, `step`, and `getSnapshot` API. |

See `src/engine.js` functions `flipCoin`, `startNewMatch`, `reset`, `frame` and the
`GRIDIRON_DEBUG` object for the current timing and randomness paths.
