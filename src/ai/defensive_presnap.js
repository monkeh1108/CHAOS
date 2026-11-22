// Pure pre-snap positioning rules. These never expose the CPU's play call.
 const WIDTH=53.333;
 const GOAL_LINE=110;
 // A pre-snap defender may be inside the end zone, but no deeper than
 // about five yards. Deeper NFL-style alignments begin to shrink when the
 // original assignment would otherwise reach the goal line.
 const MAX_ENDZONE_DEPTH=4.65;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function compressedDepth(los,originalDepth){
  if(!Number.isFinite(originalDepth)||originalDepth<=0)return originalDepth;
  const available=Math.max(0,GOAL_LINE-los);
  const excess=Math.max(0,originalDepth-available);
  const soft=originalDepth-excess*.33;
  return Math.max(.75,Math.min(originalDepth,soft,available+MAX_ENDZONE_DEPTH));
 }
 function compressFormation(defenders,los){
  for(const p of defenders){
   const original=p.x-los;
   const compressed=compressedDepth(los,original);
   p.x=los+compressed;
   p.spawnX=p.x;
   p.goalLineCompression=Math.max(0,original-compressed);
  }
 }

 function move(p,axes,dt,los,teammates,quickJog=false){
  if(!p||p.team!==1||!Number.isFinite(dt)||dt<=0)return null;
  const dx=Number(axes?.x)||0,dy=Number(axes?.y)||0;
  if(Math.hypot(dx,dy)<.13)return null;
  const step=Math.min(.05,dt)*4.5*(quickJog?1.45:1); // Faster jog, never full-speed sprint or stamina use.
  const x=clamp(p.x+dx*step,los+.85,GOAL_LINE+MAX_ENDZONE_DEPTH);
  const y=clamp(p.y+dy*step,1.1,WIDTH-1.1);
  // Don't stack two defenders at exactly the same spot on the snap.
  const free=(cx,cy)=>!(teammates||[]).some(t=>t!==p&&Math.hypot(cx-t.x,cy-t.y)<.8);
  if(free(x,y))return {x,y};
  if(free(x,p.y))return {x,y:p.y};
  if(free(p.x,y))return {x:p.x,y};
  return null;
 }
 function zoneAnchor(d){
  const a=d?.assignment;if(a?.kind!=='zone')return null;
  // Shading changes the *center* slightly, but not the zone's identity.
  // A deep middle safety cannot abandon the entire middle by walking outside.
  return {x:clamp((a.homeX??a.baseX)+clamp((d.x-d.spawnX)*.60,-4.5,4.5),10.8,GOAL_LINE+MAX_ENDZONE_DEPTH),
    y:clamp((a.homeY??a.baseY)+clamp((d.y-d.spawnY)*.65,-Math.min(5,a.width*.35),Math.min(5,a.width*.35)),2,WIDTH-2)};
 }
 function gapTarget(defender,offense,lineOfScrimmage){
  const fit=defender?.fit;
  if(!fit)return null;
  const role=fit.role||'';
  if(!role.startsWith('gap')&&!role.startsWith('fill'))return null;
  const byKey=Object.fromEntries((offense||[]).filter(p=>['LT','LG','C','RG','RT'].includes(p.key)).map(p=>[p.key,p]));
  const leftTackle=byKey.LT?.y??21,leftGuard=byKey.LG?.y??24;
  const center=byKey.C?.y??26.65,rightGuard=byKey.RG?.y??29,rightTackle=byKey.RT?.y??32;
  // Gap-role assignments attack the B gaps between guards and tackles.
  // Fill roles attack the A gaps between center and guards.
  const lane=role==='gap-middle'?center:
   role==='gap-left'?(leftTackle+leftGuard)/2:
   role==='gap-right'?(rightGuard+rightTackle)/2:
   role==='fill-left'?(leftGuard+center)/2:
   role==='fill-right'?(center+rightGuard)/2:(leftGuard+center)/2;
  return {x:Math.min(109,lineOfScrimmage+.9),y:clamp(lane,1,WIDTH-1),role};
 }
 function description(d){
  if(!d)return '';
  if(d.spy)return 'QB SPY';
  if(d.blitz)return 'BLITZ';
  if(d.rush)return (d.pos==='EDGE'||d.pos==='DE'?'EDGE CONTAIN / PASS RUSH':'PASS RUSH');
  if(d.assignment?.kind==='man')return 'MAN · '+d.assignment.target;
  if(d.assignment?.kind==='zone')return 'ZONE · '+d.assignment.tag.replaceAll('-',' ').toUpperCase();
  return 'RUN FIT · '+(d.fit?.role||'HOLD').replaceAll('-',' ').toUpperCase();
 }
export const DefensivePresnap = {move,zoneAnchor,gapTarget,description,compressedDepth,compressFormation,MAX_ENDZONE_DEPTH};
