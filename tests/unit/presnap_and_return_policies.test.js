'use strict';
const assert = require('node:assert/strict');
const { DefensivePresnap: presnap } = require('../../src/ai/defensive_presnap.js');

const p={team:1,x:70,y:20};
const base=presnap.move(p,{x:0,y:1},.05,60,[],false);
const faster=presnap.move(p,{x:0,y:1},.05,60,[],true);
assert.ok(faster.y-p.y>(base.y-p.y)*1.4);
assert.equal(p.stam,undefined);
assert.equal(presnap.move(p,{x:-1,y:0},.05,69.5,[],true).x,70.35);
const { specialTeams: st } = require('../../src/sim/special_teams.js');
const ret={x:30,y:26.5},block={key:'B',x:38,y:26};
const threats=[{key:'threat',x:42,y:27,vx:-6,vy:0},{key:'offlane',x:40,y:5,vx:-6,vy:0},{key:'behind',x:19,y:26,vx:4,vy:0}];
const t=st.chooseReturnThreat({blocker:block,playTime:0,defenders:threats,carrier:ret,claimed:new Set(),returnLaneY:26.5,speedOf:p=>Math.hypot(p.vx,p.vy)});
assert.equal(t.key,'threat','Blocker should protect return lane from approaching coverage');
const claimed=st.chooseReturnThreat({blocker:block,playTime:0,defenders:threats,carrier:ret,claimed:new Set(['threat']),returnLaneY:26.5,speedOf:p=>Math.hypot(p.vx,p.vy)});
assert.notEqual(claimed?.key,'threat');
console.log('PASS: faster stamina-free pre-snap jog and return threat prioritization');
