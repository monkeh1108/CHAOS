'use strict';
const assert=require('assert'),vm=require('vm'),fs=require('fs');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/src/tackle_escape.js','utf8'),ctx);
const model=vm.runInContext('ChaosTackleEscape',ctx);
function scenario({grip=.52,quality=.47,style='dive',strength=90,trucking=92,acc=89,stamina=.95,balance=.98,defense=69,runnerSpeed=5,defSpeed=1}={}){
 const runner={x:1.08,y:0,vx:runnerSpeed,vy:0,face:0,w:245,STR:strength,TRK:trucking,ACC:acc,stam:stamina,balance};
 const defender={x:0,y:0,vx:defSpeed,vy:0,TAK:defense,STR:defense,AWR:defense,w:195};
 const link={age:0,grip,quality,style,escapeProgress:0};
 return {runner,defender,link};
}
function run(s,frames=90){let out;for(let i=0;i<frames;i++){s.link.age+=1/60;out=model.step(s.runner,s.defender,s.link,1/60);if(out.broken)return {...out,frames:i+1};}return {...out,frames};}
const strong=scenario();let weak=run(strong);assert(weak.broken,'powerful runner can shed weak diving grab');assert(weak.kind==='break tackle');assert(weak.frames>9,'needs sustained contact, not instant roll');
const noDrive=run(scenario({strength:52,trucking:52,acc:55,stamina:.2,balance:.42,runnerSpeed:1}));assert(!noDrive.broken,'unbalanced fatigued runner fails identical hold');
const secured=run(scenario({grip:1.26,quality:1.08,style:'wrap',defense:90}));assert(!secured.broken,'solid secure wrap must resist routine escape');
const eliteWrap=run(scenario({grip:.83,quality:.78,style:'wrap',strength:99,trucking:99,acc:99,defense:45,runnerSpeed:7,defSpeed:-1}),200);assert(eliteWrap.broken&&eliteWrap.kind==='wrap break','elite power with poor defender can eventually break established wrap');assert(eliteWrap.frames>weak.frames,'wrap break should take longer than weak grab');
const light=scenario({grip:.12});const none=run(light);assert(!none.broken&&none.kind==='none','light brush never becomes break-tackle event');
const tired=scenario({stamina:.13}),fresh=scenario({stamina:1});assert(model.drive(fresh.runner,fresh.defender,fresh.link).effort>model.drive(tired.runner,tired.defender,tired.link).effort,'leg drive scales with stamina');
const low=scenario({strength:58}),high=scenario({strength:98});assert(model.drive(high.runner,high.defender,high.link).legPower>model.drive(low.runner,low.defender,low.link).legPower,'lower body strength contributes');
const coasting=scenario();
coasting.runner.intent='carry-coast';
const inertial=model.drive(coasting.runner,coasting.defender,coasting.link);
assert.equal(inertial.effort,0,'neutral-input runner has no active leg drive');
assert.equal(inertial.forwardSpeed,5,'collision-derived movement is still measured');
assert.ok(inertial.margin>-inertial.opposing,'separation speed can still strain the grip');
assert.ok(!run(coasting).broken,'external forward velocity alone does not power a grip escape');
console.log('PASS: weak-grab break, sustained grip, secure-wrap resistance, earned wrap break, no brush break, stamina and lower-body drive');
