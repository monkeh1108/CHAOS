'use strict';
const assert=require('node:assert/strict');
const Policy=require('./src/run_pursuit_policy.js');
const base=(role)=>({x:29,y:9,lead:.2,mode:'close',role,sep:9});
const carrier={x:32,y:9,vx:-2,vy:-4};
const left={x:35,y:13,PUR:89,PRC:88,AWR:84};
const leftAim=Policy.plan(left,carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
assert.equal(leftAim.mode,'retreat-contain');
assert(leftAim.x>carrier.x+2);
assert(leftAim.y<carrier.y);
assert(leftAim.y>.6);
assert.equal(leftAim.retreatRead,true);
const right=Policy.plan({...left,y:40},{x:32,y:44,vx:-2,vy:4},{...base('force-right'),y:45},{fieldWidth:53.333,peakX:38});
assert.equal(right.mode,'retreat-contain');
assert(right.y>44&&right.y<52.7);
const inside=Policy.plan({...left,y:20},carrier,base('fill-left'),{fieldWidth:53.333,peakX:37});
assert.equal(inside.mode,'retreat-pursue');
assert(inside.x>carrier.x+.7&&inside.y>carrier.y);
const last=Policy.plan({...left,y:20},carrier,base('last-line'),{fieldWidth:53.333,peakX:37});
assert.equal(last.mode,'last-line');
const ordinary=Policy.plan(left,{x:32,y:9,vx:4,vy:0},base('force-left'),{fieldWidth:53.333,peakX:38});
assert.equal(ordinary.mode,'close');
assert.equal(ordinary.retreatRead,false);
const nearby=Policy.plan({x:33,y:10,PUR:88,PRC:88,AWR:88},carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
assert.equal(nearby.mode,'close','nearby defenders should finish the tackle instead of positioning for containment');
const turnedOff=Policy.plan(left,carrier,base('force-left'),{fieldWidth:53.333,peakX:37,enabled:false});
assert.deepEqual(turnedOff,base('force-left'),'special teams should retain the existing pursuit policy');
const high=Policy.plan(left,carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
const low=Policy.plan({...left,PUR:52,PRC:51,AWR:50},carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
assert(high.x>=low.x&&high.y<=low.y,'higher recognition should provide stronger outside leverage');
console.log('PASS pursuit policy: left/right force, interior angle, last line, normal runs, short-range tackle, special teams, ratings');
// PUR and PRC both matter. At 99/99 the defender does not misread the
// intercept point, while 60/60 defenders can choose very different angles.
const ideal={...left,PUR:99,PRC:99,AWR:60,pursuitLateralBias:1,pursuitDepthBias:1};
const idealNeg={...ideal,pursuitLateralBias:-1,pursuitDepthBias:-1};
const idealA=Policy.plan(ideal,carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
const idealB=Policy.plan(idealNeg,carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
assert.equal(idealA.angleQuality,1);
assert.deepEqual(idealA,idealB,'99/99 should not be distorted by random angle errors');
const poor={...left,PUR:60,PRC:60,pursuitLateralBias:1,pursuitDepthBias:1};
const poorA=Policy.plan(poor,carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
const poorB=Policy.plan({...poor,pursuitLateralBias:-1,pursuitDepthBias:-1},carrier,base('force-left'),{fieldWidth:53.333,peakX:37});
assert(poorA.angleQuality<.25);
assert(Math.abs(poorA.y-poorB.y)>2.5,'low skill must create meaningfully different outside angles');
assert.deepEqual(poorA,Policy.plan(poor,carrier,base('force-left'),{fieldWidth:53.333,peakX:37}),
 'randomness must remain stable between frames');
const mixed1=Policy.quality({...left,PUR:99,PRC:60});
const mixed2=Policy.quality({...left,PUR:60,PRC:99});
assert(mixed1>Policy.quality(poor)&&mixed2>Policy.quality(poor),
 'both pursuit and play recognition independently improve the angle');
const subtle={x:32,y:9,vx:-1.4,vy:-3};
const idealRead=Policy.plan(ideal,subtle,base('force-left'),{fieldWidth:53.333,peakX:33.8});
const poorRead=Policy.plan(poor,subtle,base('force-left'),{fieldWidth:53.333,peakX:33.8});
assert.equal(idealRead.retreatRead,true,'elite defender recognizes a subtle observable retreat');
assert.equal(poorRead.retreatRead,false,'low PRC/PUR requires stronger observed retreat evidence');
const nearBase={...base('force-left'),mode:'tackle'};
const nearElite=Policy.plan({...ideal,x:33,y:10},carrier,nearBase,{fieldWidth:53.333,peakX:37});
const nearPoor=Policy.plan({...poor,x:33,y:10},carrier,nearBase,{fieldWidth:53.333,peakX:37});
assert.deepEqual(nearElite,nearPoor,'already-close tacklers should simply tackle, not chase a speculative lane');
console.log('PASS rating variation: elite accuracy, low-rating misreads, per-play stability, PUR+PRC and close-range safety');
// Even an inexperienced defender can occasionally make a good read when a
// repeatedly observed same-formation sideline escape happens again.
// No current play identity is provided to the policy.
const history=Array.from({length:4},()=>({kind:'run',play:'stretch',formation:'pistol',retreatSide:'left'}));
const learned=Policy.experience(history,'pistol');
assert(learned.left>.7&&learned.right===0);
assert.equal(Policy.experience(history,'trips').left,0,'memory must respect visible formation');
assert.equal(Policy.experience(history.slice(0,1),'pistol').left,0,'one instance is insufficient');
const subtleObserved={x:32,y:9,vx:-1.4,vy:-3};
const lowUnlearned=Policy.plan({...poor,pursuitLateralBias:1,pursuitDepthBias:1,pursuitReadRoll:.02},subtleObserved,base('force-left'),{fieldWidth:53.333,peakX:33.8});
const lowLearned=Policy.plan({...poor,pursuitLateralBias:1,pursuitDepthBias:1,pursuitReadRoll:.02,pursuitExperience:learned},subtleObserved,base('force-left'),{fieldWidth:53.333,peakX:33.8});
assert(lowLearned.learnedRead,'matching repeated observations can yield an exceptional low-rated read');
assert(lowLearned.angleQuality>lowUnlearned.angleQuality+.4,'experience improves *angle*, not speed');
assert.equal(lowUnlearned.retreatRead,false);
assert.equal(lowLearned.retreatRead,true);
const missedMoment=Policy.plan({...poor,pursuitReadRoll:.99,pursuitExperience:learned},subtleObserved,base('force-left'),{fieldWidth:53.333,peakX:33.8});
assert(!missedMoment.learnedRead,'not every attempt becomes a good read');
const otherSide=Policy.plan({...poor,pursuitReadRoll:.02,pursuitExperience:learned},
 {x:32,y:44,vx:-1.4,vy:3},base('force-right'),{fieldWidth:53.333,peakX:33.8});
assert(!otherSide.learnedRead,'history for left must not predict a rightward escape');
const noEvidence=Policy.plan({...poor,pursuitReadRoll:0,pursuitExperience:learned},
 {x:32,y:9,vx:3,vy:0},base('force-left'),{fieldWidth:53.333,peakX:33.8});
assert(!noEvidence.learnedRead,'memory cannot grant anticipation without current visible motion');
assert.deepEqual(lowLearned,Policy.plan({...poor,pursuitLateralBias:1,pursuitDepthBias:1,pursuitReadRoll:.02,pursuitExperience:learned},
 subtleObserved,base('force-left'),{fieldWidth:53.333,peakX:33.8}),'learned read must remain stable during the play');
console.log('PASS situational learning: 60/60 can succeed after repeats, but chance, alignment, and visible evidence still gate it');
