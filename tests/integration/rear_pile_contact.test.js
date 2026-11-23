'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the standalone build's live simulation with an inert DOM and no animation
// clock. GRIDIRON_DEBUG.step advances the same update used during play.
const noop = () => {};
const context = new Proxy({}, {get: () => noop});
function element() {
 return {
  style: {}, dataset: {}, value: '',
  classList: {add: noop, remove: noop, toggle: noop, contains: () => false},
  getContext: kind => kind === '2d' ? context : null,
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
// Set fixture inputs and inspect closure state without changing production debug controls.
vm.runInContext(withoutLab.replace(/const\s+debug\s*=\s*\{/, `
 window.fixture = {
  recovery(key) {const d = systems.P(key); return {cooldown: d.tackleCooldown, separated: d.reengage?.hasSeparated};},
  neutral() {matchState.controlMode='offense';matchState.manualDrive=true;matchState.suppressManualUntilNeutral=false;},
  input(value) {dispatchInput({type:"controls",move:{x:0,y:Number(value),mag:Number(value)}});},
  time() {return matchState.playClock;},
  contacts() {return Object.fromEntries(matchState.liveTackleContacts);},
  missDive(key) {
   systems.P(key).action={kind:'tackle-dive',time:.01,age:.52,used:false};
   systems.P(key).diveRecovery=1.2;
  }
 };
 const debug = {`), sandbox);
const g = sandbox.GRIDIRON_DEBUG;
const f = sandbox.fixture;
if (process.env.CHAOS_TRACE) g.debugTackleWatch?.();
const defenderOrder = ['MLB','WILL','DT2','EDGE1','EDGE2','DT','CB1','CB2','FS','SS','OLB'];
const player = (key, state = g.getState()) => state.players.find(p => p.key === key);

function arrange(carrier, count, gap, spread, speed = 0, blocked = 0) {
 for (const p of g.getState().players) {
  g.debugMovePlayer(p.key, p.team === 0 ? 16 : 108, p.team === 0 ? 2 : 48);
 }
 f.neutral();
 g.debugMovePlayer(carrier, 55, 26);
 g.debugSetVelocity(carrier, speed, 0);
 const defenders = defenderOrder.filter(key => player(key)).slice(0, count);
 assert.equal(defenders.length, count);
 defenders.forEach((key, i) => {
  g.debugMovePlayer(key, 55 - gap - Math.floor(i / 3) * .45, 26 + (i % 3 - 1) * spread);
  g.debugSetVelocity(key, speed + 3.1, 0);
  g.debugSetDefenderState(key, {face: 0, blocked});
 });
 return defenders;
}

function scrimmage() {
 g.debugSeed(431);
 g.reset();
 g.select('stretch');
 g.snap();
}

function observe(name, carrier, defenders, limit = 150, onFrame = noop) {
 const startX = player(carrier).x;
 let peakGrips = 0;
 let firstGrip = null;
 let maxX = startX;
 let frames = 0;
 const trace = [];
 for (; frames < limit && g.getState().phase === 'live'; frames++) {
  g.step(1);
  const state = g.getState();
  const links = state.contacts.tackles;
  const runner = player(carrier, state);
  maxX = Math.max(maxX, runner.x);
  peakGrips = Math.max(peakGrips, links.length);
  if (links.length && state.phase === 'live') firstGrip ??= frames + 1;
  if (process.env.CHAOS_TRACE) {
   trace.push({
    time: f.time(), runner, links, pile: state.pile,
    defenders: defenders.map(key => ({...player(key, state), decision: g.debugTackleDecision(key)})),
    preSeparationContacts: f.contacts(),
    collisionImpulses: g.debugCarrierCollisionImpulses?.(),
    totalGripPull: links.reduce((sum, link) => sum + (link.attachment?.force || 0), 0),
    eligibility: g.debugTackleEligibility?.(),
    breaks: state.contacts.brokenTackleCount, logs: state.logs
   });
  }
  onFrame(state, links, frames);
 }
 const state = g.getState();
 const result = {name, frames, phase: state.phase, firstGrip, peakGrips,
  yards: +(player(carrier, state).x - startX).toFixed(2),
  maxAdvance: +(maxX - startX).toFixed(2), breaks: state.contacts.brokenTackleCount,
  logs: state.logs.slice(0, 4)};
 console.log(JSON.stringify(result));
 if (trace.length) console.log(JSON.stringify({name, trace}));
 return result;
}

const results = [];
for (const count of [1, 3, 6, 10]) {
 scrimmage();
 g.debugForceCarrier('RB');
 const gap = count === 10 ? 1 : 2;
 results.push(observe(`neutral Outside Zone, ${count} rear`, 'RB',
  arrange('RB', count, gap, .8)));
}

scrimmage();
g.debugForceCarrier('RB');
const ring = arrange('RB', 6, 2, .8);
ring.forEach((key, i) => {
 const angle = i * Math.PI / 3 + Math.PI / 6;
 g.debugMovePlayer(key, 55 + Math.cos(angle) * 1.5, 26 + Math.sin(angle) * 1.5);
 g.debugSetVelocity(key, -Math.cos(angle) * 2, -Math.sin(angle) * 2);
 g.debugSetDefenderState(key, {face: angle + Math.PI});
});
results.push(observe('neutral Outside Zone, six surrounding', 'RB', ring));

g.newGame();
g.debugFinishCoinToss('heads', 'receive');
g.debugSeed(48723);
g.startKick();
const kick = g.getMatch().specialState;
g.debugMovePlayer('RB', 10, 4);
g.debugMovePlayer('WR2', kick.landingX, kick.targetY);
for (let i = 0; i < 200 && !g.getMatch().specialState?.returning; i++) g.step(1);
assert.ok(g.getMatch().specialState?.returning);
const returner = g.getState().ballCarrier;
results.push(observe('neutral kickoff, six rear', returner, arrange(returner, 6, 2, .8)));

scrimmage();
const normal = observe('Outside Zone from snap, no forced handoff', 'RB', []);
assert.ok(normal.frames > 31 && normal.yards > 0);

scrimmage();
g.debugForceCarrier('RB');
const moving = arrange('RB', 1, 1.5, 0, 4);
f.input(true);
const chase = observe('moving runner caught from behind', 'RB', moving);
f.input(false);
assert.ok(chase.firstGrip && chase.yards > 0 && chase.breaks > 0);

scrimmage();
assert.ok(g.debugSetupLowDive('RB', 'MLB', 'front'));
let diveGrip = false;
observe('committed dive contacts the runner', 'RB', ['MLB'], 30, (_, links) => {
 diveGrip ||= links.some(link => link.style === 'dive');
});
assert.ok(diveGrip && g.debugContactEvidence().lowDiveContacts > 0);

scrimmage();
g.debugForceCarrier('RB');
const recovering = arrange('RB', 1, 2, 0);
f.missDive(recovering[0]);
let grounded = false;
const recovery = observe('missed dive then rear approach', 'RB', recovering, 180, (state, links) => {
 const defender = player(recovering[0], state);
 if (defender.ground?.kind === 'missed-dive') {
  grounded = true;
  assert.equal(links.length, 0);
 }
});
assert.ok(grounded && recovery.firstGrip > 45);

scrimmage();
g.debugForceCarrier('RB');
const blocked = arrange('RB', 3, .5, .16, 0, .5);
const blockRecovery = observe('rear approach after block suppression', 'RB', blocked);
assert.ok(blockRecovery.firstGrip);

scrimmage();
g.debugForceCarrier('RB');
const second = arrange('RB', 1, 1, .16);
let released = false;
let backupGrip = false;
observe('second defender after a broken grip', 'RB', [...second, 'DT2'], 150, (state, links) => {
 if (!released && links.some(link => link.defender === second[0])) {
  released = g.debugForceGripEscape(second[0]);
  const runner = player('RB', state);
  g.debugMovePlayer('DT2', runner.x + .48, runner.y + .1);
  g.debugSetDefenderState('DT2', {face: Math.PI});
 }
 if (released && links.some(link => link.defender === 'DT2')) backupGrip = true;
});
assert.ok(released && backupGrip);

scrimmage();
g.debugForceCarrier('RB');
const [lead] = arrange('RB', 1, 1, 0, 2);
const pack = ['WILL', 'DT2', 'EDGE1', 'EDGE2'];
let breakAt = null;
let followUp = null;
const rearPack = observe('rear pack after a broken grip', 'RB', [lead, ...pack], 240, (state, links, frame) => {
 if (breakAt === null && links.some(link => link.defender === lead)) {
  assert.ok(g.debugForceGripEscape(lead));
  breakAt = frame;
  const first = player(lead, state);
  // Seed the crowd immediately behind the defender who just lost his grip.
  // The pursuit, collisions and next tackle all run through live updates.
  pack.forEach((key, i) => {
   const row = 1 + Math.floor(i / 2);
   g.debugMovePlayer(key, first.x - .7 * row, first.y + (i % 2 ? 1 : -1) * .16 * row);
   g.debugSetVelocity(key, Math.max(first.vx + 1, 3.4), first.vy);
   g.debugSetDefenderState(key, {face: 0});
  });
 } else if (breakAt !== null) {
  if (f.recovery(lead).cooldown > 0)
   assert.ok(!links.some(link => link.defender === lead), 'cooldown still prevents an immediate re-grip');
  if (followUp === null && links.length > 0) followUp = links[0].defender;
 }
});
assert.ok(breakAt !== null && followUp && followUp !== lead, 'another defender must reach the runner after the release');
assert.ok(rearPack.phase === 'dead' && rearPack.logs.some(log => /tackle/i.test(log)), JSON.stringify(rearPack));
assert.ok(rearPack.maxAdvance < 9, JSON.stringify(rearPack));

scrimmage();
g.debugForceCarrier('RB');
const [resetDefender] = arrange('RB', 1, 1, 0, 2);
g.step(1);
assert.ok(g.debugForceGripEscape(resetDefender));
const runningBack = player('RB');
g.debugMovePlayer(resetDefender, runningBack.x - 2, runningBack.y);
g.step(1);
assert.ok(f.recovery(resetDefender).cooldown > 0);
assert.equal(f.recovery(resetDefender).separated, true, 'a real gap during cooldown counts as separation');
const afterGap = player('RB');
g.debugMovePlayer(resetDefender, afterGap.x - .6, afterGap.y);
g.step(1);
assert.ok(f.recovery(resetDefender).cooldown > 0);
assert.equal(f.recovery(resetDefender).separated, true);
assert.equal(g.getState().contacts.tackles.length, 0);

scrimmage();
g.debugForceCarrier('RB');
const wrappers = arrange('RB', 2, .5, .4, 3);
g.debugMovePlayer('LG', 53.7, 26);
assert.ok(g.debugStartPile('RB', wrappers));
f.input(true);
let loaded = false;
const drive = observe('runner drives with two seeded holds', 'RB', wrappers, 120, (state, links) => {
 if (state.pile?.active && links.length >= 2 && player('RB', state).vx > 0) loaded = true;
});
f.input(false);
assert.ok(loaded && drive.maxAdvance > .2);

if (!process.env.CHAOS_BASELINE) {
 for (const result of results) {
  assert.equal(result.phase, 'dead', JSON.stringify(result));
  assert.ok(result.firstGrip !== null && result.firstGrip >= 1, JSON.stringify(result));
  assert.ok(result.maxAdvance < 4, JSON.stringify(result));
  assert.ok(result.logs.some(log => /tackle/i.test(log)), JSON.stringify(result));
 }
 assert.ok(results[1].peakGrips > 1 || results[3].peakGrips > 1);
}
