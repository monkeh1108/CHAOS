'use strict';
// CHAOS head-on tackle policy. No animation chooses a winner: this classifier
// reads the *incoming* relative velocities and contact normal before the
// impulse solver changes them. It does not use arbitrary animation chances.
const ChaosSquareContact=(()=>{
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(v)?v:0));
 function classify(a,b,nx,ny){
  const aNormal=(a.vx||0)*nx+(a.vy||0)*ny;
  const bNormal=-(b.vx||0)*nx-(b.vy||0)*ny;
  const aSpeed=Math.hypot(a.vx||0,a.vy||0),bSpeed=Math.hypot(b.vx||0,b.vy||0);
  const oppose=aNormal>0.75&&bNormal>0.75;
  const accuracy=Math.min(aNormal/Math.max(.4,aSpeed),bNormal/Math.max(.4,bSpeed));
  const force=clamp(Math.min(aNormal,bNormal)/3.4,0,1);
  const square=oppose?clamp((accuracy-.63)/.31,0,1)*force:0;
  return {square,opposing:oppose,accuracy:clamp(accuracy,0,1),force,aNormal,bNormal};
 }
 function settleAge(square,grip,quality,runnerBalance,runnerAction){
  if(square<.43||grip<.66||quality<.55||runnerAction==='truck'||runnerAction==='stiff')return 0;
  const gripControl=clamp((grip-.66)/.35,0,1);
  const balanceLoss=clamp((.92-runnerBalance)/.45,0,1);
  return clamp(square*(.13+.15*gripControl+.10*balanceLoss),0,.34);
 }
 return Object.freeze({classify,settleAge});
})();
