"use strict";
// CHAOS v0.36.4r — intent/decision policy only. Nothing here creates contact.
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function direction(defender,stick){
  if(stick&&stick.mag>.14){const n=Math.max(.001,Math.hypot(stick.x,stick.y));return {x:stick.x/n,y:stick.y/n};}
  const speed=Math.hypot(defender.vx||0,defender.vy||0);
  if(speed>.65)return {x:defender.vx/speed,y:defender.vy/speed};
  return {x:Math.cos(defender.face||0),y:Math.sin(defender.face||0)};
 }
 function selection(d,a,geometry){
  if(!d||!a||d.ground||d.stun>0)return 'none';
  const gap=geometry.gap,contact=geometry.contact,closing=geometry.closing;
  if(gap>3.15)return 'pursue';
  const toward=geometry.facing;
  if(toward<-.15)return 'pursue';
  // A dive is a commitment when the runner is escaping beyond a normal reach,
  // not an automatic tackle from contact-distance or an artificial skill roll.
  const desperate=gap>contact+.48&&gap<contact+1.8&&closing<.85&&geometry.runnerSpeed>3.25;
  const competent=d.TAK>=66&&d.AGI>=59;
  if(desperate&&competent&&toward>.35&&geometry.freeLane)return 'tackle-dive';
  const leverage=clamp(geometry.frontality,0,1);
  if(gap<=contact+.27&&closing>2.5&&leverage>.65&&d.HIT>=83&&d.TAK>=71&&geometry.freeLane)return 'hit-stick';
  return gap<=contact+.45?'wrap':'pursue';
 }
 function impact(d,other,closing){
  const power=clamp(((d.HIT||65)*.55+(d.STR||65)*.30+(d.PMV||65)*.15-50)/45,.18,1.35);
  const resistance=clamp(((other.STR||60)*.6+(other.BLO||55)*.4-50)/45,.2,1.4);
  const strength=clamp(Math.max(0,closing)*(.21+.24*power)/(1+.32*resistance),0,2.6);
  return {strength,power,resistance};
 }
export const ChaosTackleIntelligence = Object.freeze({direction,selection,impact});
