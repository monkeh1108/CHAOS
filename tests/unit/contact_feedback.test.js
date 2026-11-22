'use strict';
const assert = require('node:assert/strict');
const { ChaosContactFeedback: policy } = require('../../src/render/contact_feedback_policy.js');

assert.equal(policy.label({severity:.55,balance:.7,truckWon:true,tripped:false}),null);
assert.equal(policy.label({severity:.35,balance:.95,truckWon:false,tripped:false}),null);
assert.equal(policy.label({severity:.58,balance:.69,truckWon:false,tripped:false}),'STUMBLE');
assert.equal(policy.label({severity:.8,balance:.8,truckWon:false,tripped:false}),'STUMBLE');
assert.equal(policy.label({severity:1.0,balance:.3,truckWon:true,tripped:true}),'TRIPPED');
console.log('PASS truck feedback priority; mild clip is not a stumble; real balance loss is');
