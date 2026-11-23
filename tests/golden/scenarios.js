(() => {
  const result = document.createElement('script');
  result.id = 'chaos-golden-result';
  result.type = 'application/json';
  document.body.append(result);

  function requireCondition(condition, message) {
    if (!condition) throw new Error(message);
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
      snapshots = replayMatch(game, scenario);
    }
    requireCondition(window.goldenPageErrors.length === 0, window.goldenPageErrors.join('\n'));
    result.textContent = JSON.stringify({ snapshots });
  } catch (error) {
    result.textContent = JSON.stringify({ error: String(error.stack || error) });
  }
})();
