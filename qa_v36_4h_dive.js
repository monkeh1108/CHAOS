'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ctx=vm.createContext({});
for(const n of ['animation_policy','dive_reach','anatomy_hitboxes','contact_outcomes'])vm.runInContext(fs.readFileSync(__dirname+'/src/'+n+'.js','utf8'),ctx);
const R=vm.runInContext('ChaosDiveReach',ctx),A=vm.runInContext('AnatomyHitboxes',ctx),C=vm.runInContext('ChaosContactOutcomes',ctx);
const mk=(age,used=false)=>({key:'S',pos:'SS',h:74,w:210,face:0,x:0,y:0,vx:9,vy:0,travel:age*9,action:{kind:'tackle-dive',age,time:.53-age,used}});
for(const age of [.08,.22,.30,.40,.48]){
 const r=R.pose(mk(age));assert(r,'dive pose exists');
 const arm=R.armPoints(mk(age),1,1),geom=A.sample(mk(age));
 const forearm=geom.regions.find(x=>x.region==='forearm'&&x.side===1);
 assert(forearm,'forearm in anatomy');
 assert(Math.abs(Math.hypot(arm.wrist[0]-arm.elbow[0],arm.wrist[2]-arm.elbow[2])- .43)<.005,'straight extended forearm');
 assert(r.wrap===0,'no wrap unless contact');
 if(age>=.22){assert(arm.hand[0]>arm.elbow[0],'hand leads elbow');assert(r.shoulder>1.2,'arm points forward');}
}
const miss=mk(.48,false),hit=mk(.48,true); hit.action.contactAge=.30;const open=R.pose(miss),wrapped=R.pose(hit);
assert(open.wrap===0);assert(wrapped.wrap>.5);
const fresh=mk(.40,true); fresh.action.contactAge=.40; assert(R.pose(fresh).wrap===0,'no instant elbow collapse on contact');
const later=mk(.47,true); later.action.contactAge=.40; assert(R.pose(later).wrap>0&&R.pose(later).wrap<1,'wrap smoothly blends after grip starts');
assert(R.armPoints(hit,1,1).wrist[1]<R.armPoints(miss,1,1).wrist[1],'right hand turns inward after real engagement');
assert(R.armPoints(hit,-1,1).wrist[1]>R.armPoints(miss,-1,1).wrist[1],'left hand turns inward after real engagement');
assert.equal(A.sample(hit).regions.length,15);
assert.equal(C.classify([]).kind,'miss');
assert.equal(C.classify([{a:'forearm',b:'thigh',penetration:.025}],{relativeSpeed:9}).kind,'light contact');
assert.notEqual(C.classify([{a:'forearm',b:'thigh',penetration:.2}],{style:'dive',relativeSpeed:9,engagementAge:0,grip:0}).kind,'guaranteed tackle');
console.log('PASS shared dive geometry: 15 regions, straight pre-contact reaching arms, inward wrap after engagement, no ghost secured tackle');
