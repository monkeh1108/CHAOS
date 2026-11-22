'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ctx=vm.createContext({});
for(const file of ['render/animation_policy','physics/dive_reach','physics/anatomy_hitboxes']){
 vm.runInContext(fs.readFileSync(__dirname+'/../../src/'+file+'.js','utf8'),ctx);
}
const R=vm.runInContext('ChaosDiveReach',ctx),A=vm.runInContext('AnatomyHitboxes',ctx);
const base={key:'MLB',x:0,y:0,face:0,h:74,w:225};
let last=-1;
for(const age of [0,.025,.06,.10,.16,.23,.29,.37]){
 const p={...base,action:{kind:'tackle-dive',age,time:.53-age,used:false}};
 const pose=R.pose(p);assert(pose.shoulder>=last,'dive reach should rise monotonically');
 assert.equal(pose.wrap,0,'precontact dive should not curl arms');
 assert.equal(A.sample(p).regions.length,15);
 last=pose.shoulder;
}
assert(last>2.34,'dive reaches 135 degrees');
last=-1;
for(const reach of [0,.1,.2,.35,.5,.7,1]){
 const p={...base,wrapReach:reach};const pose=R.standingPose(p);
 const deg=pose?pose.shoulder:0;
 assert(deg>=last,'standing reach monotonic');
 if(reach<1)assert(deg<Math.PI/2,'no precontact one-frame 90-degree snap');
 if(reach>.01){const arm=R.armPoints(p,1,1);assert(arm&&arm.wrist[0]>=0);assert.equal(A.sample(p).regions.length,15);}
 last=deg;
}
assert(Math.abs(last-Math.PI/2)<1e-8,'standing wrap reaches 90 degrees');
const linked=R.standingPose({...base,wrapReach:.8,intent:'wrap',wrapLinked:true});
assert(linked.wrap>0&&linked.inward>0,'arm wraps only once linked');
const unlinked=R.standingPose({...base,wrapReach:.8});
assert.equal(unlinked.wrap,0,'no pre-contact wrap');
console.log('PASS: progressive 135 degree dive, progressive 90 degree standing reach, synchronized anatomy, wrap only after tackle link');
