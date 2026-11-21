'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=__dirname;
const ctx=vm.createContext({});
for(const part of ['escape_reactions.js','tackle_escape.js','animation_policy.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',part),'utf8'),ctx);
const [reaction,esc,anim]=vm.runInContext('[ChaosEscapeReactions, ChaosTackleEscape, AnimationPolicy]',ctx);
const runner={team:0,x:1,y:0,vx:5,vy:0,face:0,w:232,STR:91,TRK:90,ACC:88,stam:.98,balance:.97,travel:4};
const defender={team:1,x:0,y:0,vx:2,vy:0,face:Math.PI,TAK:67,STR:69,AWR:70,balance:1,stam:.97,travel:2};
const link={style:'wrap',grip:.48,quality:.48,age:.31,escapeProgress:.12,attachment:{force:1.17,stretch:0}};
const contest=esc.step({...runner}, {...defender}, {...link},1/60);
const frame=reaction.strain(runner,defender,link,contest);
assert(frame.runnerStrain>.15 && frame.defenderStrain>.20,'visible effort before release');
const strainPose=anim.sample({...runner,tackleStrain:frame.runnerStrain},true,false);
const neutralPose=anim.sample({...runner,tackleStrain:0},false,false);
assert(strainPose.stride>neutralPose.stride,'foot drive accelerates during resistance');
assert(strainPose.lean<neutralPose.lean,'runner braces forward before breaking');
const weak=reaction.release(runner,defender,link,contest);
assert(!weak.fall,'healthy upright defender stays upright after weak-grip break');
assert(['slip','drag-release'].includes(weak.kind),'weak grasp slips/drag release, no forced falling');
const releasePose=anim.sample({...runner,escapeReaction:{kind:weak.kind,intensity:.65,side:0,time:.20,duration:.40}},false,false);
assert(releasePose.state.startsWith('escape-')&&releasePose.escapePulse>0,'physical release has animation-visible evidence');
const twist=reaction.release({...runner,y:1.2,vx:5,vy:-4},defender,link,contest);
assert(twist.kind==='twist'&&!twist.fall,'off-axis grip twists but does not force fall');
const wrap=reaction.release(runner,defender,{...link,style:'wrap',grip:1.08,quality:.95,attachment:{force:4.5,stretch:0}},contest);
assert(wrap.kind==='power-pull'&&!wrap.fall,'secured wrap release gives powerful pull, not automatic ground');
const dive=reaction.release(runner,{...defender,action:{kind:'tackle-dive',time:.18,age:.3}},link,contest);
assert(dive.fall&&dive.kind==='dive-follow-through','airborne diving defender lands after losing grip');
const unstable=reaction.release({...runner,vx:10}, {...defender,balance:.18,vx:0},link,contest);
assert(unstable.fall,'severe imbalance and separation can cause grounded knockdown');
const exertions=[0,.3,.6,.9].map(ex=>esc.drive({...runner,breakExertion:ex},defender,link).effort);
for(let i=1;i<exertions.length;i++)assert(exertions[i]<exertions[i-1],'successive break efforts become physically more tiring');
// Five real consecutive low-quality grabs: no artificial streak cap, but
// accumulated leg exertion makes later escapes progressively harder.
const pursuit=[];
for(let i=0;i<5;i++){
 const tiring={...runner,vx:5.5,w:225,breakExertion:Math.min(1,i*.22),stam:.96-i*.045};
 const weakDefender={...defender,vx:1,TAK:66,STR:67,AWR:69};
 const hold={grip:.49,quality:.51,age:0,style:'dive',escapeProgress:0};
 let frames=0,outcome;
 for(;frames<180;frames++){
  hold.age+=1/60;
  outcome=esc.step(tiring,weakDefender,hold,1/60);
  if(outcome.broken)break;
 }
 assert(outcome.broken,'weak pursuit holds still escapable with strong forward drive');
 pursuit.push(frames);
}
assert(pursuit[4]>pursuit[0], 'repeated break attempts require progressively more physical effort');
// Sustained high-quality wrap should not become an auto break from animation.
const secure={...link,style:'wrap',grip:1.25,quality:1.08,age:.32,escapeProgress:0};
const strongDef={...defender,TAK:94,STR:92,AWR:92};
for(let i=0;i<65;i++){secure.age+=1/60;const value=esc.step(runner,strongDef,secure,1/60);assert(!value.broken,'solid wrap resists routine escape');}
// Source-based guard that was broken in v0.36.4o: no unconditional ground state.
const engine=fs.readFileSync(path.join(root,'src/engine.js'),'utf8');
const f=engine.slice(engine.indexOf('function releaseTackle('),engine.indexOf('// Defenders choose a secure wrap'));
assert(f.includes('if(reaction.fall){') && !f.includes("if(reason==='escape'){\n  d.ground"),'grounding must require physical criterion');
assert(f.includes('d.tackleCooldown') && f.includes('d.escapeReaction'),'standing defender retains a recoverable response');
console.log('PASS: weak-grip upright slip; visible pre-break strain/leg drive; twist; sustained-wrap pull; diving follow-through; earned severe imbalance; repeated-break fatigue; secure-wrap resistance');
