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
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, 'index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const labStart = script.indexOf("'use strict';\n// Isolated, deterministic collision replay scene");
assert.ok(labStart > 0);
vm.runInContext(script.slice(0, labStart).replace('window.GRIDIRON_DEBUG={', `
 window.fixture={
  input(x,y,sprint=true) {
   keys.arrowright=x>0;keys.arrowleft=x<0;
   keys.arrowup=y<0;keys.arrowdown=y>0;keys.shift=sprint;
  },
  kickoff(lane) {returnCall=lane;setupKickoff(0);kickSpecial();},
  rac() {
   ball={flying:true};passThrown=true;
   awardAirCatch(P('WR1'),'rac',1);
   suppressManualUntilNeutral=false;
  },
  openField() {
   for(const p of players) {
    p.x=p.team===0?14:107;p.y=p.team===0?45:50;p.vx=0;p.vy=0;
   }
  },
  sample(key) {
   const p=P(key);
   return {x:p.x,y:p.y,vx:p.vx,vy:p.vy,stam:p.stam,cap:maxSpeed(p),
    gait:p.gaitCap};
  },
  movement(holding,sprint) {
   const p=P('RB');ballCarrier=holding?p:null;active=p;manualDrive=true;
   let launch=0,peak=0;
   for(let i=0;i<180;i++) {
    p.intent='carry-manual';steer(p,1,0,1/60,sprint?1.2:1);
    if(i===14)launch=speed(p)*4;
    peak=Math.max(peak,speed(p));
   }
   return {launch,peak,stamina:p.stam,cap:maxSpeed(p)};
  },
  diagnostics(){return typeof tackleDiagnostics==='undefined'?[]:tackleDiagnostics||[];},
  readVelocity(key){return P(key).pursuitVelocityRead?.vy??null;}
 };
 window.GRIDIRON_DEBUG={`), sandbox);
const g = sandbox.GRIDIRON_DEBUG;
const f = sandbox.fixture;
const metricsOnly = process.env.CHAOS_MEASURE_ONLY === '1';
const round = n => Number(n.toFixed(2));
const defenders = ['CB1','CB2','FS','SS','MLB'];
function observe(name, command, watched=defenders, limit=750) {
 let first, previous, previousGap, result, peak=0, accel=0, closing=0, minGap=Infinity;
 let releaseWidth=null, runnerTurn=null, readTurn=null, defenderTurn=null;
 let contactFrames=0, grips=0, maxX=0, recognition=null, firstAim=null, overCap=0;
 const reasons=new Set();
 g.debugTackleWatch?.();
 for (let i=0;i<limit;i++) {
  const state=g.getState();
  if(state.phase!=='live')break;
  command(state,i);
  g.step(1);
  const next=g.getState();
  if(!next.ballCarrier)continue;
  const p=f.sample(next.ballCarrier);
  const velocity=Math.hypot(p.vx,p.vy);
  first??={...p,time:next.playClock};
  result=p;
  const elapsed=next.playClock-first.time;
  if(name.startsWith('Kick ')&&elapsed>=1&&releaseWidth===null){
   const lanes=next.players.filter(d=>d.team===1&&d.key!=='K').map(d=>d.y);
   releaseWidth=round(Math.max(...lanes)-Math.min(...lanes));
  }
  if(name==='RAC cutback'&&i>=20){
   if(p.vy>0)runnerTurn??=next.playClock;
   if(runnerTurn!==null&&f.readVelocity('FS')>0)readTurn??=next.playClock;
   if(runnerTurn!==null&&next.players.find(d=>d.key==='FS').vy>0)defenderTurn??=next.playClock;
  }
  const nearest=next.players.filter(d=>d.team===1).reduce((best,d)=>Math.min(best,Math.hypot(d.x-p.x,d.y-p.y)),Infinity);
  if(previous)accel=Math.max(accel,(velocity-previous)*60);
  if(previousGap!==undefined)closing=Math.max(closing,(previousGap-nearest)*60);
  previous=velocity;
  previousGap=nearest;
  minGap=Math.min(minGap,nearest);
  peak=Math.max(peak,velocity);
  maxX=Math.max(maxX,p.x);
  overCap=Math.max(overCap,velocity-p.cap);
  if(nearest<1.65)contactFrames++;
  grips=Math.max(grips,next.contacts.tackles.length);
  for(const entry of f.diagnostics())if(entry.contact||(entry.proximity??Infinity)<1.65)reasons.add(entry.reason);
  const reader=watched.map(key=>next.players.find(d=>d.key===key&&d.pursuitPoint)).find(Boolean);
  if(reader&&!firstAim){
   recognition=round(next.playClock-first.time);
   firstAim={key:reader.key,lead:round(reader.pursuitPoint.lead),x:round(reader.pursuitPoint.x),y:round(reader.pursuitPoint.y)};
  }
 }
 assert.ok(first,name+' never acquired possession');
 const state=g.getState();
 const row={name,pressure:state.pressure,gait:round(result.gait??0),yards:round(maxX-first.x),peak:round(peak),accel:round(accel),overCap:round(overCap),stamina:round(result.stam),
  closing:round(closing),minGap:round(minGap),contactFrames,grips,recognition,firstAim,
  releaseWidth,cutRead:readTurn===null?null:round(readTurn-runnerTurn),
  cutTurn:defenderTurn===null?null:round(defenderTurn-runnerTurn),
  reasons:[...reasons],breaks:state.contacts.brokenTackleCount,phase:state.phase,score:state.score};
 console.log(JSON.stringify(row));
 return row;
}
function snap(play,front='nickel',coverage='cover1',seed=431) {
 f.input(0,0,false);
 g.reset();
 g.setScheme('spread',front,coverage);
 g.select(play);
 g.debugSeed(seed);
 g.snap();
}
for(const side of [-1,1]){
 snap('stretch','nickel','cover1',431);
 const sweep=observe('Stretch sweep '+(side<0?'left':'right'),state=>{
  if(!state.ballCarrier)return;
  const rb=state.players.find(p=>p.key==='RB');
  const turnUpfield=side<0?rb.y<=12:rb.y>=40;
  const outside=side<0?rb.y>7:rb.y<46;
  f.input(turnUpfield?1:0,outside?side:0);
 });
 if(!metricsOnly)assert.ok(sweep.yards<30&&sweep.grips>0,'sweeping horizontally must give the secondary a credible tackle window');
}
for(const [front,coverage] of [['nickel','cover1'],['base43','cover2'],['base34','cover3']]){
 for(const seed of [431,2027,8831]){
  snap('stretch',front,coverage,seed);
  observe('Stretch '+front+' '+seed,state=>{
   if(!state.ballCarrier)return;
   const rb=state.players.find(p=>p.key==='RB');
   f.input(1,rb.y>7?-1:0);
  });
 }
}
for(const front of ['nickel','base43','base34']){
 snap('inside',front);
 const run=observe('Inside '+front,state=>{if(state.ballCarrier)f.input(1,0);});
 if(!metricsOnly&&front==='nickel')assert.ok(run.yards<25&&run.grips>0,'nickel should close the seeded interior crease');
}
for(const lane of ['middle','left','right']){
 g.reset();g.setScheme('spread','base34','cover1');g.debugSeed(2027);f.kickoff(lane);
 const kick=observe('Kick '+lane,state=>{
  if(state.ballCarrier){
   const p=state.players.find(q=>q.key===state.ballCarrier);
   f.input(1,lane==='left'&&p.y>7?-1:lane==='right'&&p.y<46?1:0);
  }else f.input(0,0,false);
 });
 if(!metricsOnly)assert.ok(kick.releaseWidth>42&&kick.contactFrames>0&&kick.yards<45,'coverage should retain width and still reach the returner');
}
snap('slants','nickel','cover3',2027);
g.step(27);
assert.ok(g.passTo(3,.45));
g.chooseAirAction('rac');
const completed=observe('Slants from snap',state=>{if(state.ballCarrier)f.input(1,0);});
if(!metricsOnly)assert.ok(completed.grips>0,'the safety should get a wrap opportunity after the live completion');

function open(name, defenders, vy=0, cut=false) {
 snap('quick');
 f.openField();
 g.debugMovePlayer('WR1',55,10);
 g.debugSetVelocity('WR1',8,vy);
 f.rac();
 for(const [key,x,y,vx,dy,face] of defenders){
  g.debugMovePlayer(key,x,y);
  g.debugSetVelocity(key,vx,dy);
  g.debugSetDefenderState(key,{face});
 }
 return observe(name,(state,i)=>f.input(1,cut&&i>=20?1:vy<0?-1:0),defenders.map(d=>d[0]),240);
}
const angle=open('RAC favorable sideline', [['CB1',65,4,-4,0,Math.PI],['FS',70,17,-5,0,Math.PI]],-2);
const rear=open('RAC trailing', [['CB1',50,10,8,0,0]]);
const cut=open('RAC cutback', [['CB1',65,4,-4,0,Math.PI],['FS',70,17,-5,0,Math.PI]],-2,true);
const collision=open('High-speed contact', [['CB1',57.5,10,-7,0,Math.PI]]);
for(const sprint of [false,true]){
 const results=[false,true].map(holding=>{
  snap('quick');
  f.input(1,0,sprint);
  return f.movement(holding,sprint);
 });
 assert.deepEqual(results[0],results[1],'possession must not change same-input movement');
 console.log(JSON.stringify({name:sprint?'Sprint parity':'Jog parity',without:results[0],with:results[1]}));
 assert.ok(results[0].peak<=results[0].cap);
 if(sprint)assert.ok(results[0].stamina<.95);
}
if(!metricsOnly){
 assert.ok(angle.firstAim.lead>=.6,'favorable angle should lead into the cutoff');
 assert.ok(angle.minGap<1.65 && angle.yards<rear.yards,'favorable angle should reach the runner before trailing pursuit');
 assert.ok(collision.contactFrames>0 && (collision.grips||collision.breaks||collision.phase==='dead'),'high speed overlap should yield a tackle contest');
 assert.ok(cut.minGap<3&&cut.cutRead!==null&&cut.cutRead<=.20,'cutback should register within the reaction window and leave a pursuit opportunity');
}
