'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the standalone build's live simulation with an inert DOM and no animation
// clock. GRIDIRON_DEBUG.step advances the same update used during play.
const noop = () => {};
const context = new Proxy({}, {get: (target, key) => target[key] ?? noop});
// Exercise the actual renderer with inert GPU calls.
const gl = new Proxy({
 getShaderParameter: () => true, getProgramParameter: () => true,
 getAttribLocation: () => 0,
 readPixels(x, y, width, height, format, type, pixel) { pixel[0] = 255; }
}, {get: (target, key) => target[key] ?? noop});
function element() {
 return {
  style: {}, dataset: {}, value: '',
  classList: {add: noop, remove: noop, toggle: noop, contains: () => false},
  getContext: kind => kind === '2d' ? context : kind === 'webgl' ? gl : null,
  getBoundingClientRect: () => ({width: 1120, height: 800}),
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener: noop, appendChild: noop, replaceChildren: noop, focus: noop, setAttribute: noop
 };
}
const elements = new Map();
const pins = Array.from({length: 4}, element);
const targets = Array.from({length: 4}, element);
const inputHandlers = new Map();
const sandbox = vm.createContext({
 console, structuredClone, devicePixelRatio: 1,
 addEventListener: (type, handler) => inputHandlers.set(type, handler), requestAnimationFrame: noop,
 document: {
  body: element(), documentElement: element(), addEventListener: noop,
  createElement: element, querySelector: () => null, querySelectorAll: () => [],
  getElementById(id) {
   if (!elements.has(id)) {
    const node = element();
    if (id === 'receiverPins' || id === 'targets') {
     node.querySelectorAll = () => id === 'receiverPins' ? pins : targets;
    }
    elements.set(id, node);
   }
   return elements.get(id);
  }
 }
});
sandbox.window = sandbox;
vm.runInContext('Math.random = () => 431 / 4294967296', sandbox);
sandbox.document.getElementById('athlete').value = 'QB';
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, 'index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const labStart = script.indexOf("'use strict';\n// Isolated, deterministic collision replay scene");
assert.ok(labStart > 0);
vm.runInContext(script.slice(0, labStart).replace('window.GRIDIRON_DEBUG={',
 `
 window.renderFrame = render;
 window.startKickoff = () => setupKickoff(0);
 window.setMatchPossession = team => { gameStarted = true; setDriveSpot(team, 30); setup(); };
 window.fieldKick = () => {
  const returner = P(specialState.returnerKey);
  returner.x = ball.aimX;
  returner.y = ball.aimY;
  specialState.elapsed = specialState.airtime;
 };
 window.turnover = () => newPossession(1, 30);
 window.setFormation = formation => { selectedFormation = formation; setup(); };
 window.GRIDIRON_DEBUG={`), sandbox);
const g = sandbox.GRIDIRON_DEBUG;

const node = id => sandbox.document.getElementById(id);
function check(label, expected, live = false) {
 for (const view of ['2d', '3d']) {
  assert.equal(g.debugSelectView(view), view);
  sandbox.renderFrame();
  assert.equal(node('receiverPins').style.display, expected ? 'block' : 'none', label + ' pins in ' + view);
  assert.equal(node('targets').style.display, expected && live ? 'flex' : 'none', label + ' bar in ' + view);
 }
}

const snapMessages = [];
for (const play of ['slants', 'inside']) {
 g.reset();
 g.select(play);
 sandbox.setMatchPossession(1);
 assert.equal(g.getMatch().controlMode, 'defense');
 check('CPU ' + play + ' before snap', false);
 g.snap(true);
 assert.equal(g.getState().phase, 'live');
 check('CPU ' + play + ' after snap', false);
 snapMessages.push(node('message').innerHTML);
}
assert.equal(snapMessages[0], snapMessages[1]);
g.reset();
g.select('slants');
sandbox.startKickoff();
check('kickoff formation', false);
assert.ok(g.startKick());
check('airborne kickoff', false);

function checkReturn(kind) {
 assert.equal(g.getMatch().specialState.kind, kind);
 assert.ok(g.getState().ball);
 sandbox.fieldKick();
 g.step(1);
 assert.equal(g.getMatch().specialState.returning, true);
 assert.ok(g.getState().ballCarrier);
 check(kind + ' return', false);
}
checkReturn('kickoff');

g.reset();
g.select('slants');
sandbox.setMatchPossession(1);
g.debugSetSpot(25, 4);
assert.ok(g.chooseSpecial('punt'));
assert.equal(g.getMatch().possession, 0);
check('airborne punt', false);
checkReturn('punt');

g.reset();
g.select('slants');
sandbox.setFormation('spread');
check('human pass before snap', true);
for (let i = 0; i < 60; i++) sandbox.renderFrame();
assert.ok(pins.some(pin => pin.style.display === 'flex'), '3D projects at least one eligible pin');
g.debugSelectView('2d');
sandbox.renderFrame();
assert.ok(pins.every(pin => pin.style.display === 'flex'), '2D projects all four eligible pins');
for (const [formation, fourth] of [['spread', 'WR3'], ['ace', 'TE2'], ['iform', 'FB']]) {
 sandbox.setFormation(formation);
 check(formation + ' receiver assignments', true);
 for (const [i, key] of ['WR1', 'WR2', 'TE', fourth].entries()) {
  assert.match(targets[i].innerHTML, new RegExp('>' + ['X', 'Y', 'A', 'B'][i] + '</span>'));
  assert.match(targets[i].innerHTML, new RegExp('<strong>' + key + '</strong>'));
 }
}

function keyEvent(type, key) {
 inputHandlers.get(type)({key, preventDefault: noop});
}
for (const [i, receiver] of ['WR1', 'WR2', 'TE', 'WR3'].entries()) {
 sandbox.setFormation('spread');
 g.snap();
 check('QB dropback', true, true);
 keyEvent('keydown', String(i + 1));
 assert.equal(g.getState().pendingPass.index, i);
 keyEvent('keyup', String(i + 1));
 assert.equal(g.getState().target, receiver);
 assert.equal(g.getState().passThrown, true);
 check('released pass', false);
}
assert.ok(g.debugSecureInterception('FS'));
assert.equal(g.getMatch().possession, 1);
assert.equal(g.getState().phase, 'dead');
check('interception whistle', false);
g.nextDown();
check('new defensive series', false);

g.reset();
g.select('inside');
g.snap();
for (let i = 0; i < 40 && !g.getState().ballCarrier; i++) g.step(1);
assert.equal(g.getState().ballCarrier, 'RB');
check('completed handoff', false);

function snapPass() {
 g.reset();
 g.select('slants');
 g.snap();
 check('human-controlled QB', true, true);
}
snapPass();
g.selectControlMode('defense');
check('switch to defense while live', false);
g.selectControlMode('line');
check('switch to line while live', false);
g.selectControlMode('offense');
check('switch back to offense while live', true, true);
g.debugMovePlayer('QB', g.getState().yard + 1, 26.65);
check('QB beyond line of scrimmage', false);
g.step(1);
assert.equal(g.getState().ballCarrier, 'QB');
check('committed QB runner', false);

snapPass();
sandbox.turnover();
assert.equal(g.getMatch().possession, 1);
assert.equal(g.getMatch().controlMode, 'offense', 'fixture isolates the possession guard');
check('live possession flip', false);

snapPass();
assert.ok(g.debugForceWhistleAt('touchdown', 110));
check('touchdown whistle', false);
g.nextDown();
check('pending extra-point try', false);
assert.ok(g.chooseSpecial('pat'));
check('extra-point result', false);

snapPass();
assert.ok(g.debugForceWhistleAt('sack', g.getState().yard));
check('dead ball before any pass', false);

console.log('PASS: receiver prompts in 2D and 3D, possession and play transitions, and four keyboard pass assignments');
