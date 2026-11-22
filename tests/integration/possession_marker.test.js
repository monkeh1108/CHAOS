'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the standalone build's live simulation with an inert DOM and no animation
// clock. GRIDIRON_DEBUG.step advances the same update used during play.
const noop = () => {};
let rings2d = 0;
const context = new Proxy({
 stroke() { if (this.strokeStyle === '#ffdc76') rings2d++; },
 save() { this.styles.push(this.strokeStyle); },
 restore() { this.strokeStyle = this.styles.pop(); },
 styles: []
}, {get: (target, key) => target[key] ?? noop});
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
const sandbox = vm.createContext({
 console, structuredClone, devicePixelRatio: 1,
 addEventListener: noop, requestAnimationFrame: noop,
 document: {
  body: element(), documentElement: element(), addEventListener: noop,
  createElement: element, querySelector: () => null, querySelectorAll: () => [],
  getElementById(id) {
   if (!elements.has(id)) elements.set(id, element());
   return elements.get(id);
  }
 }
});
sandbox.window = sandbox;
vm.runInContext('Math.random = () => 431 / 4294967296', sandbox);
sandbox.document.getElementById('athlete').value = 'QB';
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '../../index.html'), 'utf8');
const script = html.replace(/\r\n/g, '\n').split('<script>')[1].split('</script>')[0];
const withoutLab = script.replace(/\bmountContactLab\(\);/, '');
assert.notEqual(withoutLab, script, 'expected the contact lab mount call');
vm.runInContext(withoutLab.replace(/const\s+debug\s*=\s*\{/,
 `
 window.renderFrame = () => presentation.render();
 window.groundQuarterback = () => {
  systems.P('QB').ground = {stage: 'winded', dir: 0};
 };
 window.startKickoff = () => systems.setupKickoff(1);
 window.startDefensiveSeries = () => {
  matchState.gameStarted = true;
  systems.chooseCPUPlay();
  systems.setup();
 };
 const debug = {`), sandbox);
const g = sandbox.GRIDIRON_DEBUG;

function marker(expected) {
 rings2d = 0;
 sandbox.renderFrame();
 const visual = g.getVisual();
 assert.ok(visual, '3D rendering should remain available');
 assert.equal(visual.markers.carrier, expected, '3D possession ring');
 assert.equal(rings2d, expected ? 1 : 0, '2D possession ring count');
 assert.equal(visual.markers.controlled, g.getState().active ?? null);
 return visual;
}
function lineUp(play) {
 g.reset();
 g.debugSeed(431);
 g.select(play);
 g.debugDefensePresnap();
 assert.equal(g.getState().controlMode, 'defense');
 assert.equal(marker(null).presnapView, true);
 g.snap(true);
}

lineUp('verts');
g.step(12);
assert.equal(g.getState().players.find(p => p.key === 'QB').intent, 'qb-read');
assert.equal(g.getState().ballCarrier, undefined);
assert.equal(marker('QB').desiredZoom, 1, 'retain dropback camera');

function advanceUntil(predicate, limit = 1200) {
 let state = g.getState();
 for (let i = 0; !predicate(state) && state.phase === 'live' && i < limit; i++) {
  g.step(1);
  state = g.getState();
 }
 assert.ok(predicate(state), `Expected transition, got ${state.phase} (${state.logs.slice(-3).join(' / ')})`);
 return state;
}

const released = advanceUntil(state => !!state.ball);
const flight = marker(null);
assert.equal(flight.ballFlight, true);
assert.equal(flight.markers.intended, released.target);
assert.ok(released.target);
advanceUntil(state => state.phase === 'dead' || !!state.ballCarrier);
const afterPass = g.getState();
marker(afterPass.phase === 'live' ? afterPass.ballCarrier : null);

lineUp('verts');
advanceUntil(state => !!state.ball);
assert.ok(g.debugSecureInterception('FS'));
assert.equal(g.getState().phase, 'dead');
assert.equal(g.getMatch().possession, 0);
marker(null);

lineUp('verts');
// Move the QB across the line to exercise the regular scramble conversion.
g.debugMovePlayer('QB', g.getState().yard + 1, 26.65);
g.step(1);
assert.equal(g.getState().ballCarrier, 'QB');
assert.equal(g.getState().passThrown, false);
assert.equal(marker('QB').desiredZoom, 0);
sandbox.groundQuarterback();
marker('QB');

lineUp('inside');
g.step(1);
marker('QB');
advanceUntil(state => state.ballCarrier === 'RB');
marker('RB');
advanceUntil(state => state.phase === 'dead');
marker(null);

g.reset();
g.debugSeed(431);
g.debugDefensePresnap();
sandbox.startDefensiveSeries();
let snaps = 0;
while (g.getMatch().possession === 1 && snaps < 12) {
 assert.equal(g.getState().phase, 'presnap');
 assert.equal(g.getState().controlMode, 'defense');
 assert.equal(g.getState().players.length, 22);
 marker(null);
 g.snap(true);
 marker('QB');
 advanceUntil(state => state.phase === 'dead');
 marker(null);
 snaps++;
 if (g.getMatch().postWhistle === 'try' || g.getMatch().possession !== 1) break;
 g.nextDown();
}
assert.ok(snaps > 1, 'exercise a multi-snap defensive series');
assert.ok(g.getMatch().postWhistle === 'try' || g.getMatch().possession === 0,
 'series should end in a score or turnover');

g.reset();
sandbox.startKickoff();
assert.ok(g.getMatch().specialState);
marker(null);

g.reset();
g.select('verts');
g.snap();
assert.equal(g.getState().active, 'QB');
marker(null);
console.log(`PASS: possession marker transitions and a ${snaps}-snap defensive series`);
