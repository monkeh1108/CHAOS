# Online readiness

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Headless simulation | The match engine runs seeded run, pass, and kickoff replays in Node. The browser still runs and verifies these replays plus the contact lab. | Expand headless coverage as the simulation API takes shape. |
| Fixed timestep | The headless API advances the clock and simulation in 1/60-second ticks. The browser still passes elapsed frame time into its existing clock path. | Route browser input through the tick API once compatible timing is verified. |
| Determinism | An explicit initial seed controls setup and coin toss draws. Snapshots preserve that sequence and the separate sequence used during play. Existing browser setup still draws from the browser's randomness. | Expand deterministic coverage across game phases and runtimes. |
| Input commands | The headless API accepts coin toss, play selection, snap, and pass commands. | Convert keyboard, gamepad, and CPU behavior to commands per player slot. |
| Serializable state | Versioned JSON snapshots preserve shared player references, engagement maps, clock values, and per-match contact and defensive memory. Run, pass, and kickoff continuation tests compare the restored result and events. | Define transport and long-term snapshot compatibility if needed. |
| Events | A headless tick returns the presentation events emitted during that tick. | Define a smaller event contract for clients when networking is added. |
| Controller assignment | The harness exercises the existing local control modes. | Make player-slot and team assignment data-driven. |
| Public boundary | The headless API exposes createGame(config, seed), step(game, inputCommands), getSnapshot(game), and restoreSnapshot(game, snapshot). | Adapt browser and controller inputs in Phase 3d. |

See `src/engine.js` for `flipCoin`, `startNewMatch`, `reset`, and the debug stepping API.
The display frame loop lives in `src/ui/browser_session.js`.
