'use strict';
const assert = require('node:assert/strict');
const { DefensiveMemory: M } = require('../../src/ai/defensive_memory.js');

M.reset();assert.equal(M.report(0).sampleSize,0);
for(let i=0;i<4;i++)assert(M.record(0,{play:'inside',kind:'run',formation:'iform',down:1,quarter:1,result:'tackle'}));
let x=M.report(0);assert.equal(x.counts.run,4);assert(x.estimatedRunShare<.85);assert.equal(x.counts.pass,0);
M.record(0,{play:'verticals',kind:'pass',formation:'spread',target:'WR2',airYards:32,result:'incomplete'});
M.record(0,{play:'slants',kind:'pass',formation:'trips',target:'WR2',airYards:5,result:'complete'});
x=M.report(0);assert.equal(x.counts.deep,1);assert.equal(x.counts.short,1);assert.equal(x.targets.WR2,2);
assert.equal(M.report(1).sampleSize,0);
x.history[0].play='tampered';assert.equal(M.report(0).history[0].play,'inside');
assert(!M.record(0,{play:'verticals',kind:'none'}));assert.equal(M.report(0).sampleSize,6);
M.reset();assert.equal(M.report(0).sampleSize,0);console.log('PASS memory unit tests');
