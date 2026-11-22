// Inside Zone coordination. Pure football decisions; physics and graphics stay
// in engine.js. All angles are player-relative, not an omniscient field scan.
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const rating=(p,key,fallback=70)=>Number.isFinite(p?.[key])?p[key]:fallback;
 // Roughly 180 degrees forward, with no instant acquisition behind a player.
 // Existing physical engagements are handled by the contact solver instead.
 function visible(observer,point){
  if(!observer||!point)return false;
  const dx=point.x-observer.x,dy=point.y-observer.y,len=Math.hypot(dx,dy);
  if(len<.15)return true;
  const face=Number.isFinite(observer.face)?observer.face:0;
  return (Math.cos(face)*dx+Math.sin(face)*dy)/len>=-.04;
 }
 function assignments(line,front,playStart){
  const interior=front.filter(d=>!d.ground&&d.rush&&d.x>=playStart-.5&&d.x<playStart+6.5);
  const entries={};const taken=new Map();
  // First give every aligned defensive lineman a primary blocker. Then assign
  // available linemen to help only when their home gap can support it.
  for(const d of [...interior].sort((a,b)=>a.y-b.y)){
   const pick=line.filter(o=>!entries[o.key]).sort((a,b)=>Math.abs(a.spawnY-d.spawnY)-Math.abs(b.spawnY-d.spawnY))[0];
   if(pick){entries[pick.key]={target:d.key,homeY:pick.spawnY,combo:false};taken.set(d.key,1);}
  }
  for(const o of line.filter(o=>!entries[o.key])){
   const pick=[...interior].filter(d=>(taken.get(d.key)||0)<2)
    .sort((a,b)=>Math.abs(a.spawnY-o.spawnY)-Math.abs(b.spawnY-o.spawnY))[0];
   if(pick&&Math.abs(pick.spawnY-o.spawnY)<4.2){
    entries[o.key]={target:pick.key,homeY:o.spawnY,combo:true};taken.set(pick.key,(taken.get(pick.key)||0)+1);
   }else entries[o.key]={target:null,homeY:o.spawnY,combo:false};
  }
  // Both partners must know the block is a combo, not just the helper.
  for(const e of Object.values(entries))if(e.target&&(taken.get(e.target)||0)>1)e.combo=true;
  return entries;
 }
 // A blocker who has just finished an engagement must locate and process the
 // next threat. Recognition takes time; high-AWR players scan faster, but even
 // elite linemen do not know the next assignment instantaneously.
 function readDelay(blocker,roll=.5){
  const awareness=clamp(rating(blocker,'AWR'),1,99);
  return clamp(.075+(99-awareness)*.0035+clamp(roll,0,1)*.12,.075,.48);
 }
 function runnerProjection(a,snapX){
  const speed=Math.hypot(a?.vx||0,a?.vy||0),horizon=clamp(.24+speed*.017,.24,.43);
  const y=clamp((a?.y??26.65)+(a?.vy||0)*horizon,1.4,51.9);
  const x=clamp(Math.max(snapX+.65,(a?.x??snapX)+Math.max(0,a?.vx||0)*horizon),snapX+.65,110);
  return {x,y,look:horizon};
 }
 function threat(blocker,defender,runner,snapX){
  if(!visible(blocker,defender))return -Infinity;
  const lane=runnerProjection(runner,snapX),r=distance(defender,runner),b=distance(blocker,defender);
  const converge=clamp(((runner.x-defender.x)*(defender.vx||0)+(runner.y-defender.y)*(defender.vy||0))/Math.max(.25,r),-7,7);
  const laneDist=Math.abs(defender.y+clamp((defender.vy||0)*.25,-1.5,1.5)-lane.y);
  // A future tackler near the runner's path is a bigger threat than a famous
  // defender far away; ratings act as a tiebreak, not telepathic knowledge.
  const danger=clamp(18-laneDist*1.7-Math.max(0,defender.x-lane.x-9)*1.3,0,18);
  const defenderAbility=(rating(defender,'PUR')*.45+rating(defender,'TAK')*.35+rating(defender,'ACC')*.20-65)*.075;
  return danger+clamp(converge,0,7)*1.8+defenderAbility-b*.82-Math.max(0,r-13)*.50;
 }
 function response(defender,blockers,runner,role){
  if(!runner||!visible(defender,runner))return null;
  const near=blockers.filter(o=>!o.ground&&visible(defender,o)&&distance(defender,o)<4.3)
   .sort((a,b)=>distance(defender,a)-distance(defender,b))[0];
  if(!near)return null;
  // Gap players don't abandon their fit to dance around a blocker. Aware
  // second-level players can shade one shoulder before the engagement.
  const skill=rating(defender,'PRC')*.6+rating(defender,'AWR')*.4;
  if(skill<53)return null;
  const lateral=role?.startsWith('gap')?.30:role?.includes('fill')?.60:.80;
  const offset=defender.y<=near.y?-lateral:lateral;
  return {x:defender.x+.70,y:clamp(defender.y+offset,.5,52.8),kind:'blocker-read',blocker:near.key};
 }
export const InsideZoneIQ = Object.freeze({visible,assignments,readDelay,runnerProjection,threat,response});
