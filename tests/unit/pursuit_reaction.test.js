'use strict';
const assert=require('node:assert/strict');
const Pursuit=require('../../src/ai/pursuit_reaction');
function player(x,y,vx,vy){return {x,y,vx,vy,PUR:76,PRC:71,AGI:78}}
const carrier=player(20,20,5,0),def=player(18,20,5,0);
const base={x:20.5,y:20,mode:'tackle'};
const first=Pursuit.aim(def,carrier,base,10);
assert.equal(first.mode,'close-read');
carrier.y=22;carrier.vy=8;
const second=Pursuit.aim(def,carrier,{x:20.5,y:22,mode:'tackle'},10.02);
assert(second.y<21.7,'close chase cannot instantly track a sudden lane cut');
const third=Pursuit.aim(def,carrier,{x:21,y:22,mode:'tackle'},10.25);
assert(third.y>second.y,'defender may react to the observed runner cut');
def.x=5;def.y=5;
assert.equal(Pursuit.aim(def,carrier,{x:30,y:12,mode:'edge-contain'},10.3).x,30,'far angle preserved');
console.log('PASS close observation delay, delayed reaction, untouched far pursuit');
