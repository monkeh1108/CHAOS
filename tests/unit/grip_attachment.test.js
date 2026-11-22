'use strict';
const assert = require('node:assert/strict');
const { ChaosGripAttachment: policy } = require('../../src/physics/grip_attachment.js');

function make(grip,at=1.14){
 const runner={x:at,y:0,vx:5,vy:0,w:235,TRK:92,STR:89};
 const defender={x:0,y:0,vx:1,vy:0,w:190,TAK:78,STR:74};
 return {runner,defender,link:{grip}};
}
let {runner,defender,link}=make(.18);let result=policy.step(runner,defender,link,1/60,.39,.39);
assert.equal(result.active,false);assert.equal(defender.vx,1);assert.equal(runner.vx,5);
({runner,defender,link}=make(.98));result=policy.step(runner,defender,link,1/60,.39,.39);
assert.equal(result.active,true);assert(defender.vx>1,'defender starts following runner');assert(runner.vx<5,'runner experiences small tension');
assert(Math.abs(defender.x)<1e-12&&Math.abs(runner.x-1.14)<1e-12,'no position teleport');
const firstDefenderDelta=defender.vx-1;
({runner,defender,link}=make(.35));result=policy.step(runner,defender,link,1/60,.39,.39);
assert(result.active);assert(defender.vx-1<firstDefenderDelta,'weak grip must transmit less force');
({runner,defender,link}=make(.97,3));result=policy.step(runner,defender,link,1/60,.39,.39);
assert.equal(result.reason,'overextended');assert.equal(defender.vx,1,'no distant force');
({runner,defender,link}=make(1.25));
let activeFrames=0, stretched=false;
for(let n=0;n<35;n++){
 const v=policy.step(runner,defender,link,1/60,.39,.39);
 if(v.active)activeFrames++;
 if(v.reason==='overextended')stretched=true;
 runner.x+=runner.vx/60;defender.x+=defender.vx/60;
}
assert(activeFrames>=10,'good grip should last across multiple frames');
assert(!stretched,'strong wrap should remain attached in this reachable scenario');
assert(defender.x>0.25,'defender stays physically engaged over multiple frames');
assert(runner.x>1.14+.2,'carrier can still gain yards in grip');
console.log('PASS: slight contact no attachment, strong link follows without teleporting, weak grip weaker, overreach releases, runner retains forward progress');

// Placement is independently meaningful: identical TAK but good forearm-to-hip
// contact yields stronger attachment than a shallow/poorly aimed collision.
const defenderSkill={TAK:86,AWR:81,STR:77};
const good=policy.contactQuality({kind:'potential tackle',armOnBody:true,bodyContact:true,penetration:.24,approachAngle:12},defenderSkill,{advantage:8},'wrap');
const bad=policy.contactQuality({kind:'meaningful contact',armOnBody:false,bodyContact:true,penetration:.12,approachAngle:128},defenderSkill,{advantage:-8},'wrap');
assert(good>bad+.12,'precise, square contact should establish a better hold');
assert.equal(policy.contactQuality({kind:'light contact',armOnBody:true},defenderSkill,{},'wrap'),0,'light brush cannot establish hold');
let x=make(1.05),y=make(1.05);x.link.quality=good;y.link.quality=bad;
policy.step(x.runner,x.defender,x.link,1/60,.39,.39);
policy.step(y.runner,y.defender,y.link,1/60,.39,.39);
assert(x.defender.vx>y.defender.vx,'accurate grip transmits more resisting force');
console.log('PASS: contact quality based on regions, accuracy, approach, leverage, and TAK/AWR');
