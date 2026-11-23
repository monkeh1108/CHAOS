# Online readiness

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Headless simulation | The match engine runs seeded run, pass, and kickoff replays in Node. The browser still runs and verifies these replays plus the contact lab. | Expand headless coverage as the simulation API takes shape. |
| Fixed timestep | `update(1/60)` drives live simulation steps. `frame` uses display timestamps to accumulate updates and passes elapsed time into `gameTick` and pre-snap positioning. | Decide how game and play clocks advance independently of display frames. Verify timing before changing it. |
| Determinism | `debugSeed` sets the engine seed. Match initialization, drive reset and coin toss use `Math.random()` before that hook can control them. Tests pin bootstrap randomness, restore it after the toss and any drive reset, then use the engine seed and direct steps. | Inject randomness and clock sources, audit ordering, and test more inputs. The trace export uses `Date.now()` for its filename. |
| Input commands | Tests use existing debug actions. | Convert keyboard, gamepad and CPU behavior to explicit commands. |
| Serializable state | The debug API returns a projection that the test can serialize. | Define complete state with stable IDs and test save, restore and continuation. |
| Events | The match engine emits presentation events for the HUD, playbook, coin toss, and field controls. | Define the per-tick event payloads and return them from the simulation boundary. |
| Controller assignment | The harness exercises the existing local control modes. | Make player-slot and team assignment data-driven. |
| Public boundary | `GRIDIRON_DEBUG.step` and its state readers support the baseline. | Provide a browser-independent `createGame`, `step`, and `getSnapshot` API. |

See `src/engine.js` for `flipCoin`, `startNewMatch`, `reset`, and the debug stepping API.
The display frame loop lives in `src/ui/browser_session.js`.
