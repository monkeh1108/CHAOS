'use strict';
const assert = require('node:assert/strict');
const { ChaosBodyConstraint: body } = require('../../src/physics/body_constraint.js');
const { ChaosTackleStruggle: fight } = require('../../src/physics/tackle_struggle.js');

assert.equal(body.correction({}, {}, 0, true),0);
assert(body.correction({}, {}, .4,true)>body.correction({}, {}, .4,false));
assert(body.correction({}, {}, 4,true)<=.19);
assert(body.minimumSeparation(.41,.44,true)>body.minimumSeparation(.41,.44,false));
const runner={TRK:95,STR:90,AGI:85,balance:.95};
const bad=[{t:{grip:.50,quality:.52}}],good=[{t:{grip:1.12,quality:1.13}}],gang=[{t:{grip:1.2,quality:1.12}},{t:{grip:1,quality:1.08}}];
const loose=fight.state(runner,bad,6),proper=fight.state(runner,good,6),two=fight.state(runner,gang,6);
assert(loose.brakeMultiplier<proper.brakeMultiplier,'poor wraps should allow more forward drive');
assert(loose.finishDelay>0,'imperfect solo wrap permits contested progress');
assert(proper.finishDelay===0,'clean grip should not be arbitrarily delayed');
assert(two.finishDelay===0,'multiple wrappers avoid solo delay');
assert(fight.state({...runner,balance:.24},bad,6).drive<loose.drive,'off-balance runners cannot keep driving');
assert(fight.state(runner,bad,0).drive===0,'no forward velocity means no extra drive');
console.log('PASS body nonpenetration bounded; imperfect vs clean wrap, gang hold, balance and momentum');
