'use strict';
// v0.36.4t: close-range reaction memory. Chasers follow observed movement,
// not an instantaneous translation of every carrier juke. No velocity or
// position is imposed on either athlete.
const ChaosPursuitReaction=(()=>{
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function aim(defender,carrier,base,clock){
  if(!defender||!carrier||!base)return base;
  const distance=Math.hypot(carrier.x-defender.x,carrier.y-defender.y);
  if(distance>5.3){defender.closePursuitRead=null;return base;}
  const read=defender.closePursuitRead;
  const skill=clamp(((defender.PUR||70)*.43+(defender.PRC||70)*.30+(defender.AGI||70)*.27-45)/54,0,1);
  const reactDelay=.095+(1-skill)*.12;
  if(!read||clock-read.at>=reactDelay||clock<read.at){
   defender.closePursuitRead={x:carrier.x,y:carrier.y,vx:carrier.vx||0,vy:carrier.vy||0,at:clock};
  }
  const known=defender.closePursuitRead;
  const age=clamp(clock-known.at,0,.24);
  // A runner straight ahead remains tackleable. A cut, however, takes time
  // to register; preserve only modest prediction from a *seen* velocity.
  const prediction=clamp(.035+skill*.055-age*.38,0,.09);
  const x=known.x+known.vx*prediction,y=known.y+known.vy*prediction;
  const blend=clamp((5.3-distance)/2.6,0,.90);
  return {...base,x:base.x*(1-blend)+x*blend,y:base.y*(1-blend)+y*blend,
   mode:base.mode==='tackle'?'close-read':base.mode,readAge:+age.toFixed(3)};
 }
 return Object.freeze({aim});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ChaosPursuitReaction;
