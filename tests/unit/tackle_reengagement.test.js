'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/../../src/physics/tackle_reengagement.js','utf8')+';globalThis.RE=ChaosTackleReengagement;',context);
const R=context.RE;

{
  const runner={key:'RB',x:10,y:10};
  const defender={key:'SS',x:9.6,y:10,balance:.9,stun:.17,diveRecovery:0,tackleCooldown:.24,ground:null};
  const gap=1.1;
  R.release(defender,runner,gap,3);
  assert.equal(R.observe(defender,runner,gap,3.2),false,'same-body overlap must not re-latch');
  defender.tackleCooldown=0;defender.stun=0;
  assert.equal(R.observe(defender,runner,gap,3.5),false,'cooldown alone cannot rearm at contact');
  defender.x=8.1;assert.equal(R.observe(defender,runner,gap,3.7),true,'actual separation + recovered stance permits chase');
  assert.equal(defender.reengage,null);
  R.release(defender,runner,gap,4);
  defender.x=9.6;defender.tackleCooldown=.12;defender.stun=.1;
  assert.equal(R.observe(defender,runner,gap,4.1),false);
  defender.x=8.1;assert.equal(R.observe(defender,runner,gap,4.2),false,'no reengagement while unbalanced');
  defender.stun=0;defender.tackleCooldown=0;assert.equal(R.observe(defender,runner,gap,4.4),true);
  assert.equal(R.observe(defender,runner,gap,4.5),true,'fully recovered may engage again');
  console.log('PASS: cannot re-grip same overlap; must physically separate and recover; later legitimate tackle permitted');
}

{
  const runner={key:'RB',x:60,y:24,vx:0,vy:0};
  const d={key:'SS',x:59.65,y:24,vx:0,vy:0,balance:1,stun:0,diveRecovery:0,tackleCooldown:0,ground:null};
  const gap=1.1;
  R.release(d,runner,gap,2);
  for(let i=1;i<=14;i++){const ok=R.observe(d,runner,gap,2+i/60);assert.equal(ok,false,'no immediate overlapping regrip at '+i);}
  assert.equal(R.observe(d,runner,gap,2+15/60),true,'stationary genuine contact after full recovery can reengage');
  R.release(d,runner,gap,3);runner.vx=3;d.vx=3;
  for(let i=1;i<100;i++){assert.equal(R.observe(d,runner,gap,3+i/60),false,'moving overlapping defenders still need separation');}
  d.x=57.4;assert.equal(R.observe(d,runner,gap,4.8),true,'moving defender can reengage after separation');
  d.x=59.65;runner.vx=0;d.vx=0;R.release(d,runner,gap,5);d.stun=.1;d.tackleCooldown=.2;
  for(let i=1;i<=30;i++)assert.equal(R.observe(d,runner,gap,5+i/60),false,'unrecovered tackler cannot auto-grip');
  d.stun=0;d.tackleCooldown=0;
  for(let i=31;i<=42;i++)assert.equal(R.observe(d,runner,gap,5+i/60),false,'contact recovery requires 0.24s');
  assert.equal(R.observe(d,runner,gap,5+47/60),true,'post-recovery settled contact may engage');
  console.log('PASS: stopped runner is not immortal; moving-overlap still requires gap; cooldown and contact are required');
}
