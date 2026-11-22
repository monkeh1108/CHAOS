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
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, 'index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const labStart = script.indexOf("'use strict';\n// Isolated, deterministic collision replay scene");
assert.ok(labStart > 0);
vm.runInContext(script.slice(0, labStart).replace('window.GRIDIRON_DEBUG={',
 `
 window.renderFrame = render;
 window.groundQuarterback = () => {
  P('QB').ground = {stage: 'winded', dir: 0};
 };
 window.qbFixture = (tendency, obstacle) => {
  const qb = P('QB');
  Object.assign(qb,{x:playStart-4.2,y:26.65,vx:0,vy:0,SPD:94,ACC:94,SCT:tendency});
  off.filter(o => o!==qb).forEach((o,i) => Object.assign(o,{x:playStart+22,y:3+i*4,vx:0,vy:0}));
  def.forEach((d,i) => Object.assign(d,{x:playStart+25,y:3+i*4,vx:0,vy:0,rush:false}));
  if(obstacle==='edge')Object.assign(def[0],{x:qb.x-.9,y:qb.y+2.1,vy:-1,rush:true});
  if(obstacle==='wall')def.slice(0,5).forEach((d,i) => Object.assign(d,{x:playStart-1,y:qb.y+(i-2)*2.1,vx:-1}));
  playClock=1.40;
  cpuQuarterback(qb,1/60);
  return {intent:qb.intent,vx:qb.vx,vy:qb.vy};
 };
 window.startKickoff = () => setupKickoff(1);
 window.startDefensiveSeries = () => {
  gameStarted = true;
  chooseCPUPlay();
  setup();
 };
 window.GRIDIRON_DEBUG={`), sandbox);
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
assert.equal(g.getState().cpuQB.choice, 'WR1', 'initial read stays with the first receiver');
assert.equal(g.getState().passThrown, false);
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

lineUp('verts');
assert.equal(sandbox.qbFixture(96).intent, 'qb-scramble', 'mobile QB sees a clean lane without pressure');
lineUp('verts');
assert.equal(sandbox.qbFixture(20).intent, 'qb-read', 'equally athletic pocket passer waits');
lineUp('verts');
assert.equal(sandbox.qbFixture(96, 'wall').intent, 'qb-read', 'occupied corridors deter the scramble');
lineUp('verts');
const evasive = sandbox.qbFixture(20, 'edge');
assert.ok(evasive.vx >= 0 && (evasive.vx > 0 || evasive.vy < 0), 'step away from pressure without drifting back');

// Let the chosen lane feed the live update and the existing LOS conversion.
lineUp('verts');
sandbox.qbFixture(96);
const scrambled = advanceUntil(state => state.ballCarrier === 'QB', 150);
assert.equal(scrambled.passThrown, false);
assert.equal(marker('QB').desiredZoom, 0);
assert.equal(g.startPass(0), false);
assert.equal(g.passTo(0), false);
advanceUntil(state => state.players.some(p => p.team === 1 && p.pursuitPoint &&
 ['pursue','contain','safety-angle'].includes(p.intent)), 120);

// A pass attempt during the crossing itself must also lock possession.
lineUp('verts');
g.debugMovePlayer('QB', g.getState().yard + .05, 26.65);
assert.equal(g.passTo(0), false);
assert.equal(g.getState().ballCarrier, 'QB');
console.log(`PASS: adaptive CPU QB, possession markers and a ${snaps}-snap defensive series`);
