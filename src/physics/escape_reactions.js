"use strict";
// CHAOS v0.36.4p: physics-driven grip release and presentation evidence.
// These outputs describe the physical contest, not animation-triggered wins.
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
 function signSide(runner,defender){
  const x=(runner.x||0)-(defender.x||0),y=(runner.y||0)-(defender.y||0);
  const f=runner.face||0, cross=Math.cos(f)*y-Math.sin(f)*x;
  return Math.abs(cross)>.06?Math.sign(cross):0;
 }
 // Updated every live contact frame: current resistance and escape effort
 // control foot cadence, torso bracing, and arm tension, not the result.
 function strain(runner,defender,link,contest){
  const threshold=contest.kind==='wrap break'?.62:.19;
  const fraction=clamp((link.escapeProgress||0)/threshold,0,1);
  const grip=clamp(link.grip||0,0,1.6),effort=clamp(contest.effort||0,0,1);
  const drag=clamp((link.attachment?.force||0)/9+(link.attachment?.stretch||0),0,2);
  const runnerStrain=clamp((.18+.33*effort+.30*fraction+.12*drag)*clamp(grip/.52,0,1),0,1);
  const defenderStrain=clamp((.22+.26*grip+.22*fraction+.12*drag),0,1);
  return {runnerStrain,defenderStrain,side:signSide(runner,defender),fraction,effort};
 }
 function release(runner,defender,link,contest){
  const grip=clamp(link.grip||0,0,1.6),quality=clamp(link.quality??.6,0,1.25);
  const dx=(runner.x||0)-(defender.x||0),dy=(runner.y||0)-(defender.y||0);
  const dist=Math.max(.001,Math.hypot(dx,dy)),nx=dx/dist,ny=dy/dist;
  const relVx=(runner.vx||0)-(defender.vx||0),relVy=(runner.vy||0)-(defender.vy||0);
  const separating=Math.max(0,relVx*nx+relVy*ny);
  const tangent=Math.abs(relVx*(-ny)+relVy*nx);
  const effort=clamp(contest?.effort||0,0,1);
  const attached=clamp((link.attachment?.force||0)/9+(link.attachment?.stretch||0),0,1.5);
  // A high-speed physical pull with compromised balance can knock someone
  // down. Merely breaking a hold never satisfies that condition.
  const instability=clamp((1-clamp(defender.balance??1,0,1))*.62+
   separating*.050+tangent*.044+attached*.10+effort*.06,0,1.5);
  const diving=defender.action?.kind==='tackle-dive'&&defender.action.time>0;
  const fall=diving || (instability>.79 && (defender.balance??1)<.43 && separating>3.0);
  const sideways=signSide(runner,defender);
  let kind='slip';
  if(diving)kind='dive-follow-through';
  else if(link.style==='wrap'&&grip>.77&&quality>.72)kind='power-pull';
  else if(sideways!==0&&tangent>1.4)kind='twist';
  else if(attached>.30||separating>3.4)kind='drag-release';
  const intensity=clamp(.25+instability*.46+effort*.18, .18,.90);
  // A small bounded velocity response along the physical separation axis.
  // Never teleport, fake a truck, or kill the defender's entire velocity.
  const tug=clamp(separating*.105+attached*.13,0,.65);
  return {kind,fall,instability,intensity,side:sideways,nx,ny,tug,
   duration:kind==='slip'?.24:kind==='dive-follow-through'?.42:.40,
   recovery:kind==='slip'?.16:kind==='twist'?.29:.34};
 }
export const ChaosEscapeReactions = Object.freeze({strain,release});
