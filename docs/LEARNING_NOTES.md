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
