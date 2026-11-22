
'use strict';
// CHAOS physical body contact policy. Torso/hip pads resist interpenetration;
// limbs remain free to wrap. This is a bounded 2D core projection, not a full
// rigid-body skeletal solver. No position teleport across a long distance.
const ChaosBodyConstraint=(()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function correction(a,b,penetration,engaged=false){
  if(penetration<=0)return 0;
  // More authoritative for a live carrier and an actual tackler than for
  // ordinary traffic. Maximum displacement is limited on every solver pass.
  return Math.min(engaged?.19:.13,penetration*(engaged?.89:.68));
 }
 function minimumSeparation(ra,rb,engaged=false){
  return ra+rb+(engaged?.075:0);
 }
 return Object.freeze({correction,minimumSeparation});
})();
