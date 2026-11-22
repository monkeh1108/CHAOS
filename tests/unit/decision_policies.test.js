const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../../src');
function use(file,symbol){return new Function(fs.readFileSync(path.join(root,file),'utf8')+`\nreturn ${symbol};`)()}
const d=use('input/defensive_controls.js','DefensiveControls'),qb=use('ai/cpu_qb_policy.js','CpuQBPolicy'),r=use('ai/rush_awareness.js','RushAwareness'),p=use('ui/playbook_navigation.js','PlaybookNavigation');
assert.equal(d.choose('A',1.8,1.5),'conservative');
assert.equal(d.choose('X',1.0,1.4),'hit-stick');
assert.equal(d.choose('X',3.0,1.4),'tackle-dive');
assert.equal(d.choose('Y',1,1),null);
assert(qb.minimumSettle('verticals',84,83)>qb.minimumSettle('slants',84,83)+.9);
assert(qb.minimumSettle('verticals',50,65)>qb.minimumSettle('verticals',95,95));
assert.equal(qb.hasDeveloped('verticals',1.2,7,.1),false);
assert.equal(qb.hasDeveloped('verticals',2.8,20,.1),true);
const ed={pos:'EDGE',spawnY:33,key:'EDGE2',rush:true};
const q={x:25,y:26.65,vy:0};assert.equal(r.target(ed,q,30,1).mode,'edge-contain');
q.y=37;q.vy=4.5;assert.equal(r.target(ed,q,30,1).mode,'edge-crash');
q.y=26.65;q.vy=0;assert.equal(r.assess(q,30,1).escape,false);
assert.equal(p.move(0,13,3,'right'),1);assert.equal(p.move(5,13,3,'down'),8);assert.equal(p.move(0,13,2,'up'),0);
assert.equal(p.cycle(['spread','trips','ace'], 'ace',1),'spread');
console.log('PASS v33 independent defensive, QB, rush and playbook policy unit tests');
