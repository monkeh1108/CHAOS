# Learning notes

## Checkpoint 1

- **Regression test** checks that a change has not broken established
  behavior. For example, a kickoff test first makes sure there actually was
  a return, so an empty or aborted play cannot count as success.
- **Golden-master test** stores the current game's output as a reference.
  After moving engine code, compare the new run's ball and player positions,
  clocks and contacts to that reference. A difference says what moved and at
  which sampled tick. It still takes judgment to decide whether the change
  was intended.
- **Deterministic** means the same starting state, inputs and seed produce
  exactly the same result. Two browser runs let us check that for a specific
  play. A future online replay can use the same idea to check whether two
  computers agree on the play.
- **Commit** is a named snapshot of a set of changes. A message like
  `Add seeded gameplay snapshots before refactoring` explains what a
  teammate will find when they open it.

Start with `tests/golden/scenarios.js` and look for `matchSnapshot`. As a
small exercise, follow `carrier` from that function into the kickoff fixture
and find the first sampled tick where someone has the ball.

## Checkpoints 2 and 3

- **Separation of concerns** gives a file one clear job. The controller
  code can turn a button press into a tackle command. The simulation
  decides when the defender can tackle, and the renderer shows what happened.
- **Version control** tracks files as they change over time. To find the
  old root engine, run `git log -- engine.js` and then
  `git show bdbd167:engine.js`. The colon asks Git for the named file
  from that commit. Try running both commands and finding the first line
  of that old engine.

## Phase 2 tooling

- **ES modules** make dependencies explicit. For example, the renderer imports
  `AnimationPolicy` from its source file. Node tests can load that module
  without starting the game.
- **A bundler** follows imports from the entry point and packages source into
  the one script that ships inside `index.html`.
- **A linter** flags patterns that deserve review. In `GRIDIRON_DEBUG.getState`,
  the duplicate `pursuitPoint` key causes the second entry to win. The build
  and lint output flag this existing duplicate.
- **A formatter** standardizes layout. It makes it easier to review an
  unrelated rule or physics change later.

## Checkpoint 5

- **Don't repeat yourself (DRY)** means sharing a rule when multiple places
  need the same behavior. The math module has one ordinary clamp and one
  clamp for physics measurements that may be invalid. Keeping both behaviors
  preserves existing handling of NaN and infinity.
- A **named tuning value** explains what a number controls. In tackle escape,
  `escapeHold.secureDifficulty` still equals `1.48`. The name connects
  that number to resistance from a secured wrap.

Try tracing `escapeHold.secureDifficulty` from `src/core/tuning/tackle.js`
into `src/physics/tackle_escape.js`. Find the condition that makes a wrap
secure and the expression that uses the difficulty.

## Checkpoint 6

- The **simulation** applies the football rules and moves the players and ball.
  **Presentation** draws the field and updates the on-screen controls.
- An **event** is a small message about something that happened. When the
  engine selects a play, it emits a `playSelectionChanged` event with the
  play's name. The browser uses that name to highlight the button. A future
  game server can run the same play without opening a window.
- **Headless** means running without a browser or screen. The Node test
  runs a full lineup through a run, pass, and kickoff twice and compares
  the resulting snapshots.

Find `playSelectionChanged` in `src/engine.js` and `src/ui/game_hud.js`. Follow
the play name from the engine to the button the browser highlights.

## Checkpoint 7

- **Match state** is the information the next tick needs, including the
  clock, ball and players, active tackles, and random sequence.
- **Serialization** turns that information into data that can be saved or
  sent. The snapshot preserves shared references so a runner still refers
  to the same athlete in both the roster and the tackle links.
- An explicit **seed** lets you replay the same setup and decisions. The
  snapshot keeps the current random sequence so a restored game continues
  from the same point.

In `tests/integration/match_snapshot.test.js`, follow the pass from release
through saving, restoring into a fresh game, and comparing subsequent events.

## Checkpoint 8

- An **input command** records what a player wants to do. The engine
  receives a move direction or a snap command with a player slot. The
  browser handles keys, gamepad buttons, and touch before it sends them.
- A **player slot** identifies which team issued a command. Possession
  determines whether that slot is playing offense or defense.

Trace readFieldControls in src/input/controls.js into dispatchInput in
src/engine.js. The CPU sends its play calls, snaps, and throws through the
same dispatcher.
