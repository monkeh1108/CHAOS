# Online readiness

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Headless simulation | The match engine runs seeded run, pass, and kickoff replays in Node. The browser still runs and verifies these replays plus the contact lab. | Expand headless coverage as the simulation API takes shape. |
| Fixed timestep | The headless API advances the clock and simulation in 1/60-second ticks. The browser still passes elapsed frame time into its existing clock path. | Route browser input through the tick API once compatible timing is verified. |
| Determinism | An explicit initial seed controls setup and coin toss draws. Snapshots preserve that sequence and the separate sequence used during play. Existing browser setup still draws from the browser's randomness. | Expand deterministic coverage across game phases and runtimes. |
| Input commands | Keyboard, touch, and gamepad adapters send field movement and football commands. The CPU uses the same dispatcher for play calls, snaps, and throws. | Represent commands for a second independently controlled player and schedule received inputs by simulation tick. |
| Serializable state | Versioned JSON snapshots preserve shared player references, engagement maps, clock values, and per-match contact and defensive memory. Run, pass, and kickoff continuation tests compare the restored result and events. | Define transport and long-term snapshot compatibility if needed. |
| Events | A headless tick returns the presentation events emitted during that tick. | Define a smaller event contract for clients when networking is added. |
| Controller assignment | The local slot can be assigned to either team. The CPU has the other slot and possession determines the controlled role. | Create separate player slots for multiplayer. |
| Public boundary | The headless API exposes createGame(config, seed), step(game, inputCommands), getSnapshot(game), and restoreSnapshot(game, snapshot). | Keep the API working as rules and debug code are moved into their own modules. |

See `src/engine.js` for `flipCoin`, `startNewMatch`, `reset`, and the debug stepping API.
The display frame loop lives in `src/ui/browser_session.js`.
