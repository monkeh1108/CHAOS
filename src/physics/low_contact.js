// CHAOS v0.36.4q: physical foot-level obstacles, trips and airborne clearance.
// A jump only changes the runner's vertical foot clearance; it NEVER awards a
// tackle break, freezes a defender, or grants a period of invulnerability.
 const clamp=(n,l,h)=>Math.max(l,Math.min(h,Number.isFinite(n)?n:l));
 const hyp=(x,y)=>Math.hypot(x,y);
 const isLowThreat=p=>!!p&&(!!p.ground||p.action?.time>0&&['tackle-dive','cut-stick'].includes(p.action.kind));
 function height(p){
  const air=p?.airState;
  if(!air||p.ground)return 0;
  const t=clamp((air.elapsed||0)/air.duration,0,1);
  return (air.peak||0)*Math.max(0,Math.sin(Math.PI*t)); // visual units, not yards
 }
 function initiate(p,kind){
  if(!p||p.ground||p.airState||p.stumbleTime>0)return false;
  const duration=kind==='hop'?.40:.66;
  const peak=kind==='hop'?.38:.80;
  p.airState={kind,duration,elapsed:0,peak};return true;
 }
 function advance(p,dt){
  if(p.airState){p.airState.elapsed+=dt;
   if(p.airState.elapsed>=p.airState.duration)p.airState=null;
  }
  p.stumbleTime=Math.max(0,(p.stumbleTime||0)-dt);
  p.lowContactCooldown=Math.max(0,(p.lowContactCooldown||0)-dt);
  p.autoHopCooldown=Math.max(0,(p.autoHopCooldown||0)-dt);
  p.ankleReachTime=Math.max(0,(p.ankleReachTime||0)-dt);
 }
 // A grounded defender can still reach up and try to snag the carrier's foot.
 // Facing, position and reach matter; the ground state alone never guarantees a trip.
 function reachEligible(d,r){
  if(!d.ground)return true;
  const dx=r.x-d.x,dy=r.y-d.y,dist=hyp(dx,dy);
  if(dist>1.62)return false;
  const facing=(Math.cos(d.face||0)*dx+Math.sin(d.face||0)*dy)/Math.max(.01,dist);
  return facing>-.32 && d.ground.stage!=='rise' && (d.TAK||65)>45;
 }
 // Predict closest relative approach within the step to prevent ankle tunneling.
 function sweep(a0,a1,b0,b1){
  const rx=a0.x-b0.x,ry=a0.y-b0.y;
  const vx=(a1.x-a0.x)-(b1.x-b0.x),vy=(a1.y-a0.y)-(b1.y-b0.y);
  const t=clamp(-(rx*vx+ry*vy)/Math.max(1e-8,vx*vx+vy*vy),0,1);
  return {t,d:hyp(rx+vx*t,ry+vy*t)};
 }
 function evaluate(runnerBefore,r,defBefore,d){
  if(!isLowThreat(d)||!reachEligible(d,r))return {hit:false,kind:'not-low'};
  const near=sweep(runnerBefore,r,defBefore,d);
  const distance=Math.min(near.d,hyp(r.x-d.x,r.y-d.y));
  // Foot and shin capsules extend forward beyond the actor's pivot point.
  const fX=Math.cos(r.face||0),fY=Math.sin(r.face||0);
  const forward=Math.max(-1,Math.min(1,(d.x-r.x)*fX+(d.y-r.y)*fY));
  const footBonus=clamp(.22+forward*.18,.06,.40);
  const radius=(d.ground?.92:d.action?.kind==='tackle-dive'?1.02:.83)+footBonus;
  const overlap=radius-distance;
  if(overlap<=0)return {hit:false,kind:'wide-miss',distance};
  const z=height(r);
  // High, planted-up footwork can clear the defender; a near-landing toe
  // remains reachable. A foot brush can never award immunity or a tackler fall.
  const maxLowHeight=d.ground?.36:d.action?.kind==='tackle-dive'?.43:.33;
  const heightOverlap=maxLowHeight+.055-z;
  if(heightOverlap<=0)return {hit:false,kind:'cleared',distance,clearance:z-maxLowHeight};
  const heightRatio=clamp(heightOverlap/.42,0,1);
  const contact=clamp(overlap/.56,0,1)*heightRatio;
  if(contact<.055)return {hit:false,kind:'brush',distance};
  const dvx=(d.vx||0)-(r.vx||0),dvy=(d.vy||0)-(r.vy||0);
  const delta=hyp(d.x-r.x,d.y-r.y)||.001;
  const closing=Math.max(0,(dvx*(r.x-d.x)+dvy*(r.y-d.y))/delta);
  return {hit:true,kind:d.ground?'grounded-grab':d.action?.kind==='tackle-dive'?'diving-ankle':'low-cut',
   distance,overlap,contact,closing,height:z,part:heightRatio>.76?'ankle/foot':'lower-shin',swept:near.t<.999};
 }
 function clearance(r,d){
  return isLowThreat(d)&&height(r)>(d.ground?.415:d.action?.kind==='tackle-dive'?.485:.395);
 }
 // A small automatic hop is a navigational assist, never a guaranteed dodge.
 function shouldAutoHop(r,d){
  if(!d.ground||!r||r.airState||r.ground||r.autoHopCooldown>0||r.stumbleTime>0)return false;
  const dx=d.x-r.x,dy=d.y-r.y,range=hyp(dx,dy);
  if(range<.72||range>2.08)return false;
  const velocity=hyp(r.vx||0,r.vy||0);
  if(velocity<2.85||r.balance<.52||r.stam<.12)return false;
  const toward=(dx*r.vx+dy*r.vy)/(range*velocity);
  const cross=Math.abs(dx*r.vy-dy*r.vx)/velocity;
  return toward>.72&&cross<.64&&(r.AWR||65)>.46*100;
 }
 // Higher airborne hits make balance losses more likely. This modifier is for
 // *genuine body contact* and does not fabricate a collision or decide a catch.
 function bodyVulnerability(p){return height(p)>.10?1+clamp(height(p)*.80,0,.64):1;}
export const ChaosLowContact = Object.freeze({height,initiate,advance,evaluate,clearance,shouldAutoHop,isLowThreat,bodyVulnerability});
