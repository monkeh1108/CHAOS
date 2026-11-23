function replayMatch(game, scenario) {
  function requireCondition(condition, message) {
    if (!condition) throw new Error(message);
  }

  function matchSnapshot(game, tick) {
    const state = game.getState();
    const match = game.getMatch();
    return {
      tick, phase: state.phase, down: state.down, yard: state.yard, toGo: state.togo,
      score: match.teamPoints,
      clock: { quarter: match.quarter, game: match.quarterSeconds, play: match.playSeconds },
      carrier: state.ballCarrier ?? null, target: state.target ?? null, ball: state.ball,
      returning: match.specialState?.returning ?? false,
      players: state.players.map(({key, team, x, y, vx, vy}) => ({key, team, x, y, vx, vy})),
      contacts: state.contacts,
      contactEvents: game.debugContactEvidence().events,
    };
  }

  if (scenario === 'kickoff') {
    requireCondition(game.startKick(), 'Kickoff did not start');
  } else {
    game.select(scenario === 'run' ? 'inside' : 'verticals');
    game.snap();
  }
  requireCondition(game.getState().phase === 'live', 'Play did not go live');
  game.debugContactWatch(false);
  game.step(12);
  if (scenario === 'pass') requireCondition(game.passTo(0, .24), 'Pass did not launch');
  const snapshots = [matchSnapshot(game, 12)];
  const ticks = scenario === 'kickoff' ? [130, 180, 210] : [35, 65, 110];
  let previousTick = 12;
  for (const tick of ticks) {
    game.step(tick - previousTick);
    snapshots.push(matchSnapshot(game, tick));
    previousTick = tick;
  }
  requireCondition(snapshots[0].players.length === 22, 'Expected a full lineup');
  if (scenario === 'kickoff') {
    requireCondition(snapshots.some(frame => frame.returning), 'No kickoff return was observed');
  }
  if (scenario === 'run') {
    requireCondition(snapshots.some(frame => frame.carrier === 'RB'), 'No RB carry was observed');
  }

  return snapshots;
}
