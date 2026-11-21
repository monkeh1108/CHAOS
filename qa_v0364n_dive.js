'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx=vm.createContext({});
for(const name of ['animation_policy','dive_reach','anatomy_hitboxes','dive_collision']){
 vm.runInContext(fs.readFileSync(__dirname+'/src/'+name+'.js','utf8'),ctx);
}
vm.runInContext('this.API={AnatomyHitboxes,ChaosDiveCollision}',ctx);
const {ChaosDiveCollision}=ctx.API;
const runner=(x,y)=>({key:'RB',team:0,pos:'RB',h:72,w:225,x,y,face:Math.PI,vx:0,vy:0,balance:1,impact:0});
const diver=(x,y,face=0)=>({key:'MLB',team:1,pos:'MLB',h:73,w:235,x,y,face,vx:8,vy:0,
 action:{kind:'tackle-dive',age:.30,time:.23,used:false},balance:1,impact:0});
const cases=[
 ['head-on',runner(10,26),runner(10,26),diver(8.1,26),diver(10.3,26)],
 ['side',runner(10,26),runner(10,26),diver(10,24.5,Math.PI/2),diver(10,27,Math.PI/2)],
 ['diagonal',runner(10,26),runner(10,26),diver(8.3,24.7,.7),diver(10.5,26.5,.7)],
 ['wide miss',runner(10,26),runner(10,26),diver(8,29),diver(10.5,29)],
];
let hitCount=0;
for(const [name,r0,r1,d0,d1] of cases){
 const result=ChaosDiveCollision.evaluate(r0,r1,d0,d1);
 if(name==='wide miss')assert(!result.hit,JSON.stringify(result));
 else {assert(result.hit,`${name} did not detect low-body collision: ${JSON.stringify(result)}`);hitCount++;}
 if(result.hit){
  const beforeD={...d1};const output=ChaosDiveCollision.response(r1,d1,r0,d0,result,1/60,100,110);
  assert(Number.isFinite(d1.x)&&Number.isFinite(r1.vx));
  assert(Math.hypot(d1.x-d0.x,d1.y-d0.y)<=Math.hypot(beforeD.x-d0.x,beforeD.y-d0.y)+1e-6);
  assert(output.kind==='body-only'||output.kind==='limb-contact');
 }
 console.log(name,result.kind,result.hit?'hit':'clear');
}
assert(hitCount===3);
const brushRunner=runner(10,26),brushDef=diver(9.2,26);
const brush=ChaosDiveCollision.response(brushRunner,brushDef,runner(10,26),diver(9.2,26),
 {hit:true,kind:'limb-contact',penetration:.012,wrapCandidate:false,swept:true,fraction:.5},1/60,100,110);
assert(brush.physical===false&&brushDef.x===9.2&&brushRunner.vx===0,
 'a brush must not rewind athletes or cause a large impact');
const inactive=diver(9,26);inactive.action=null;
assert(!ChaosDiveCollision.evaluate(runner(10,26),runner(10,26),inactive,inactive).hit);
console.log('PASS: lower-body swept contact, side/diagonal, wide miss, bounded response');
