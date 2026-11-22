(() => {
  const result = document.createElement('script');
  result.id = 'chaos-golden-result';
  result.type = 'application/json';
  document.body.append(result);

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

  function contactLab() {
    const preset = document.getElementById('contactPreset');
    preset.value = 'leg';
    preset.dispatchEvent(new Event('change'));
    const step = document.getElementById('contactStep');
    for (let tick = 0; tick < 48; tick++) step.click();

    // Capture the lab's own export without downloading a file.
    const objectURL = URL.createObjectURL;
    const anchorClick = HTMLAnchorElement.prototype.click;
    const browserBlob = window.Blob;
    let exported;
    try {
      URL.createObjectURL = () => 'blob:golden-contact-lab';
      HTMLAnchorElement.prototype.click = () => {};
      window.Blob = class extends browserBlob {
        constructor(parts, options) {
          super(parts, options);
          exported = JSON.parse(parts[0]);
        }
      };
      document.getElementById('contactExport').click();
    } finally {
      URL.createObjectURL = objectURL;
      HTMLAnchorElement.prototype.click = anchorClick;
      window.Blob = browserBlob;
    }
    requireCondition(exported?.events.length > 0, 'The lab preset must export real contacts');
    return { tick: 48, readout: document.getElementById('contactReadout').textContent, export: exported };
  }

  try {
    const game = window.GRIDIRON_DEBUG;
    game.debugFinishCoinToss('heads', 'receive');
    const scenario = window.goldenScenario;
    if (scenario === 'run' || scenario === 'pass') game.reset();
    Math.random = window.goldenOriginalRandom;
    game.debugSeed(431);
    let snapshots;
    if (scenario === 'contact_lab') {
      snapshots = contactLab();
    } else {
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
      snapshots = [matchSnapshot(game, 12)];
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
    }
    requireCondition(window.goldenPageErrors.length === 0, window.goldenPageErrors.join('\n'));
    result.textContent = JSON.stringify({ snapshots });
  } catch (error) {
    result.textContent = JSON.stringify({ error: String(error.stack || error) });
  }
})();
