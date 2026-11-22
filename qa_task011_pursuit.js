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
  flightRead(awareness,face){
   const d=P('CB1');
   d.AWR=d.PRC=d.RCR=awareness;
   if(!passTo(0,.45))return null;
   d.x=ball.x+24;d.y=ball.y;
   let delay=null;
   for(let i=0;i<Math.ceil(ball.flight*60);i++){
    d.face=face;
    if(defenderFlightAI(d,1/60)){delay=(i+1)/60;break;}
    ball.t+=1/60;
    ball.x+=ball.vx/60;ball.y+=ball.vy/60;
   }
   return {delay,threshold:d.airReadAt};
  },
  reachDecision(){
   const a=P('RB'),d=P('MLB');
   // Re-create the offset and facing of the light brush from Stretch nickel 2027.
   Object.assign(a,{x:29.076,y:24,vx:4.835,vy:-1.216,face:-Math.PI/4});
   Object.assign(d,{x:29.938,y:24.392,vx:-3.156,vy:-.337,face:3.229});
   liveTackleContacts.clear();
   resolveTackles(a,1/60);
   return {reach:d.wrapReach,entry:tackleDiagnostics.find(e=>e.defender===d.key)};
  },
  trace(){
   const a=ballCarrier;
   const player=p=>({key:p.key,x:p.x,y:p.y,vx:p.vx,vy:p.vy,face:p.face,
    SPD:p.SPD,AGI:p.AGI,AWR:p.AWR,PRC:p.PRC,PUR:p.PUR,TAK:p.TAK,stam:p.stam});
   return {time:playClock,input:stickInput(),sprint:sprintHeld(),contactEntries:ChaosContactEvidence.last(),runner:a&&player(a),ball:ball?.flying?{x:ball.x,y:ball.y,z:ball.z,t:ball.t}:null,
    defenders:def.map(d=>{
     const dx=a?a.x-d.x:0,dy=a?a.y-d.y:0,gap=Math.hypot(dx,dy);
     return {...player(d),intent:d.intent,target:d.intentTarget,aim:d.pursuitPoint,
      assignment:d.assignment,role:d.pursuitPoint?.role||d.kickCoverageRole||d.fit?.role,
      readAge:d.pursuitVelocityRead?playClock-d.pursuitVelocityRead.at:d.pursuitPoint?.readAge,
      gap,closing:a?((d.vx-a.vx)*dx+(d.vy-a.vy)*dy)/Math.max(.001,gap):null,
      turnError:a?Math.atan2(Math.sin(Math.atan2(dy,dx)-d.face),Math.cos(Math.atan2(dy,dx)-d.face)):null,
      radius:a?radius(a)+radius(d):null,reach:d.wrapReach,action:d.action,
      decision:d.lastTackleDecision,eligibility:a?tackleDiagnostics?.find(e=>e.defender===d.key):null,
      anatomical:a&&gap<1.65?ChaosContactOutcomes.evaluate(a,d):null,
      preSeparationContact:a?liveTackleContacts.get(d.key):null,
      lowDiveImpact:lastLowDiveImpact?.defender===d.key?lastLowDiveImpact:null,
      grip:tackleLinks.get(d.key)?.grip,escape:d.escapeReaction,ballVisible:ball?.flying?InsideZoneIQ.visible(d,ball):null,
      airReadAt:d.airReadAt,airSeenFor:d.airSeenFor};
    })};
  },
  diveDecision(){
   const a=P('WR1'),d=P('CB1');
   Object.assign(a,{x:55,y:10,vx:8,vy:0});
   Object.assign(d,{x:53.3,y:10,vx:4,vy:0,face:0,TAK:85,AGI:85});
   passThrown=true;
   chooseDefenderCommitment(d,a);
   return {decision:d.lastTackleDecision,action:d.action};
  },
  setRatings(rating){for(const d of def)d.PUR=d.PRC=rating;},
  readVelocity(key){return P(key).pursuitVelocityRead?.vy??null;}
 };
 window.GRIDIRON_DEBUG={`), sandbox);
const g = sandbox.GRIDIRON_DEBUG;
const f = sandbox.fixture;
const tracePath = process.env.CHAOS_PURSUIT_TRACE;
if(tracePath)fs.writeFileSync(tracePath,'');
const metricsOnly = process.env.CHAOS_MEASURE_ONLY === '1';
const round = n => Number(n.toFixed(2));
const defenders = ['CB1','CB2','FS','SS','MLB'];
function observe(name, command, watched=defenders, limit=750) {
 let first, previous, previousGap, result, peak=0, accel=0, closing=0, minGap=Infinity;
 let releaseWidth=null, runnerTurn=null, readTurn=null, defenderTurn=null;
 let contactFrames=0, grips=0, maxX=0, recognition=null, firstAim=null, overCap=0;
 let catchGap=null,firstGripYards=null,earlyYacGap=null,firstGripDefender=null;
 let forceAhead=null,forceMinGap=Infinity,laneReaim=null,initialAimY=null;
 let meaningfulContacts=0,diveMissFrames=0;
 const firstAirBreak={};
 const reasons=new Set();
 g.debugTackleWatch?.();
 for (let i=0;i<limit;i++) {
  const state=g.getState();
  if(state.phase!=='live')break;
  command(state,i);
  g.step(1);
  if(tracePath)fs.appendFileSync(tracePath,JSON.stringify({name,...f.trace()})+"\n");
  const next=g.getState();
  if(!next.ballCarrier){
   if(next.passThrown)for(const d of next.players){
    if(['break-on-ball','air-rally','air-underneath'].includes(d.intent))firstAirBreak[d.key]??=round(next.playClock);
   }
   continue;
  }
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
  if(name.endsWith('from snap')){
   catchGap??=round(nearest);
   if(p.x-first.x<=10)earlyYacGap=Math.min(earlyYacGap??Infinity,round(nearest));
   if(next.contacts.tackles.length&&firstGripYards===null){
    firstGripYards=round(p.x-first.x);
    firstGripDefender=next.contacts.tackles[0].defender;
   }
  }
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
  for(const entry of f.diagnostics()){
   if(entry.contact||(entry.proximity??Infinity)<1.65)reasons.add(entry.reason);
   if(entry.reason==='grip started'&&entry.contact?.bodyContact)meaningfulContacts++;
   if(entry.reason==='missed dive')diveMissFrames++;
  }
  const force=next.players.find(d=>d.key===watched[0]&&d.pursuitPoint);
  if(force){
   forceAhead??=round(force.x-p.x);
   forceMinGap=Math.min(forceMinGap,Math.hypot(force.x-p.x,force.y-p.y));
   initialAimY??=force.pursuitPoint.y;
   laneReaim=Math.max(laneReaim??0,Math.abs(force.pursuitPoint.y-initialAimY));
  }
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
  catchGap,earlyYacGap,firstGripYards,firstGripDefender,firstAirBreak,meaningfulContacts,diveMissFrames,
  forceAhead,forceMinGap:Number.isFinite(forceMinGap)?round(forceMinGap):null,laneReaim:laneReaim===null?null:round(laneReaim),releaseWidth,cutRead:readTurn===null?null:round(readTurn-runnerTurn),
  cutTurn:defenderTurn===null?null:round(defenderTurn-runnerTurn),
  reasons:[...reasons],breaks:state.contacts.brokenTackleCount,phase:state.phase,score:state.score};
 console.log(JSON.stringify(row));
 return row;
}
function snap(play,front='nickel',coverage='cover1',seed=431,formation='spread',pressure) {
 f.input(0,0,false);
 g.reset();
 g.setScheme(formation,front,coverage,pressure);
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
snap('slants','nickel','cover3',2027,'spread','spy');
g.step(27);
assert.ok(g.passTo(3,.45));
g.chooseAirAction('rac');
const completed=observe('Slants from snap',state=>{if(state.ballCarrier)f.input(1,0);});
if(!metricsOnly)assert.ok(completed.grips>0,'the safety should get a wrap opportunity after the live completion');

snap('sluggo','nickel','cover3',2027,'spread','spy');
for(let i=0;i<100&&g.getState().players.find(p=>p.key==='WR1').routeIdx<1;i++)g.step(1);
const cutting=g.getState().players.find(p=>p.key==='WR2');
assert.ok(cutting.routeIdx===1&&cutting.vy<0,'release while WR2 is on the inward cut');
assert.ok(g.passTo(1,.45));
g.chooseAirAction('rac');
const sluggo=observe('Slant and Go from snap',state=>{if(state.ballCarrier)f.input(1,0);});
if(!metricsOnly){
 for(const result of [completed,sluggo]){
  assert.ok(result.firstGripYards>=0&&result.firstGripYards<=10&&result.meaningfulContacts>0,
   'a quick completion should have a physical contest in the first 10 yards');
 }
}


function open(name, defenders, vy=0, cut=false, stationary=false) {
 snap('quick');
 f.openField();
 g.debugMovePlayer('WR1',55,10);
 g.debugSetVelocity('WR1',stationary?0:8,vy);
 f.rac();
 for(const [key,x,y,vx,dy,face] of defenders){
  g.debugMovePlayer(key,x,y);
  g.debugSetVelocity(key,vx,dy);
  g.debugSetDefenderState(key,{face});
 }
 return observe(name,(state,i)=>f.input(stationary?0:1,cut&&i>=20?1:vy<0?-1:0),defenders.map(d=>d[0]),240);
}
snap('inside','nickel','cover1',431,'spread','spy');
let startingX,stage=0;
const reversal=observe('Interior reversal',state=>{
 if(!state.ballCarrier)return;
 const rb=state.players.find(p=>p.key==='RB');
 startingX??=rb.x;
 if(stage===0&&rb.y<21)stage=1;
 if(stage===1&&rb.x<startingX-2.5)stage=2;
 if(stage===2&&rb.y>40)stage=3;
 f.input(stage===1?-1:stage===3?1:0,stage===0?-1:stage===2?1:0);
},['CB2','FS','SS']);
if(!metricsOnly){
 assert.equal(stage,3,'the carrier must complete the retreat, traverse and upfield cut');
 assert.ok(reversal.laneReaim>12&&reversal.forceMinGap<2&&reversal.meaningfulContacts>0,
  'the destination force defender should re-aim and leave a physical contest');
}
console.log(JSON.stringify({name:'Reversal input',stage}));
const angle=open('RAC favorable sideline', [['CB1',65,4,-4,0,Math.PI],['FS',70,17,-5,0,Math.PI]],-2);
const rear=open('RAC trailing', [['CB1',50,10,8,0,0]]);
const cut=open('RAC cutback', [['CB1',65,4,-4,0,Math.PI],['FS',70,17,-5,0,Math.PI]],-2,true);
const collision=open('High-speed contact', [['CB1',57.5,10,-7,0,Math.PI]]);
const offset=open('Offset arrival', [['CB1',57.5,10,-7,0,Math.PI],['FS',61,12,-5,0,Math.PI]]);
const stationary=open('Stationary carrier',[['CB1',55.58,10,-3,0,Math.PI]],0,false,true);
const reads=[ [95,Math.PI], [50,Math.PI], [95,0] ].map(([rating,face])=>{
 snap('sluggo','nickel','cover3',2027,'spread','spy');
 g.step(45);
 return f.flightRead(rating,face);
});
console.log(JSON.stringify({name:'Flight recognition',high:reads[0],low:reads[1],away:reads[2]}));
snap('quick');
const dive=f.diveDecision();
console.log(JSON.stringify({name:'Receding dive decision',...dive}));
if(!metricsOnly){
 assert.ok(reads[0].delay!==null&&reads[1].delay!==null&&reads[0].delay<reads[1].delay);
 assert.equal(reads[2].delay,null,'a defender facing away never samples the ball in this fixture');
 assert.ok(offset.meaningfulContacts>0&&stationary.meaningfulContacts>0);
 assert.equal(dive.decision.choice,'tackle-dive');
 assert.ok(!dive.action,'the launch impulse must be able to close the gap');
}

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

for(const [formation,side,rating] of [['trips',-1,92],['trips',-1,55],['ace',1,92],['ace',1,55]]){
 snap('stretch','base43','cover2',431,formation,'contain');
 f.setRatings(rating);
 const edge=observe('Rated Stretch '+formation+' '+rating,state=>{
  if(!state.ballCarrier)return;
  const rb=state.players.find(p=>p.key==='RB');
  const outside=side<0?rb.y>8:rb.y<45;
  f.input(outside?0:1,outside?side:0);
 },[side<0?'CB1':'CB2']);
 if(!metricsOnly){
  assert.ok(edge.forceAhead>0&&edge.overCap<.2);
  if(rating===92)assert.ok(edge.yards<20&&edge.grips>0,'rated force unit must preserve the seeded edge window');
 }
}
g.reset();g.setScheme('spread','base34','cover1','blitz');g.debugSeed(2027);f.kickoff('middle');
let redirected=false;
const redirect=observe('Kick redirect',state=>{
 if(!state.ballCarrier){f.input(0,0,false);return;}
 const p=state.players.find(q=>q.key===state.ballCarrier);
 redirected||=p.x>15;
 f.input(1,redirected&&p.y<45?1:0);
},['CB2']);
if(!metricsOnly)assert.ok(redirected&&redirect.laneReaim>5&&redirect.contactFrames>0);

snap('quick');
assert.ok(g.debugFootScenario('RB','MLB','dive'));
observe('Committed low dive',()=>f.input(1,0),['MLB'],50);
const lowDive=g.debugContactEvidence().lastLowDiveImpact;
console.log(JSON.stringify({name:'Low dive contact',impact:lowDive}));
if(!metricsOnly)assert.ok(lowDive?.physical&&lowDive.swept);

snap('stretch');
f.openField();
g.debugTackleWatch();
const brush=f.reachDecision();
console.log(JSON.stringify({name:'Light contact reach',...brush}));
if(!metricsOnly){
 assert.equal(brush.entry.reason,'light contact');
 assert.equal(brush.reach,0,'a shallow brush should not initiate wrap reach');
}
