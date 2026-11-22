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

// Regression: ordinary defensive gameplay must visibly move the QB, not merely
// return a movement instruction in a staged helper with linemen removed.
for(const play of ['verts','mesh','slants']){
 lineUp(play);
 const q0=g.getState().players.find(p=>p.key==='QB');
 let maxTravel=0, maxLateral=0, samples=0;
 for(let frame=0;frame<135;frame++){
  const state=g.getState();
  if(state.phase!=='live'||state.passThrown)break;
  g.step(1);
  const q=g.getState().players.find(p=>p.key==='QB');
  maxTravel=Math.max(maxTravel,Math.hypot(q.x-q0.x,q.y-q0.y));
  maxLateral=Math.max(maxLateral,Math.abs(q.y-q0.y));
  samples++;
 }
 assert.ok(samples>35, `${play} needs a real pocket sample`);
 assert.ok(maxTravel>1.0, `${play} QB is standing still: ${maxTravel.toFixed(2)} yards`);
 assert.ok(maxLateral>.25, `${play} QB never adjusts laterally: ${maxLateral.toFixed(2)} yards`);
 console.log(`PASS: ${play} live QB moved ${maxTravel.toFixed(2)} yd, shifted ${maxLateral.toFixed(2)} yd in ${samples} frames`);
}
