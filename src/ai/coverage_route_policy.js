// v0.34.9: isolated read-only decisions for passing lanes and crossing routes.
// This module does not change blocking, tackling, stamina or special teams.
export const CoverageRoutePolicy={
 isVerticalThreat(p,los){
  // Only count a receiver moving downfield with meaningful separation from LOS.
  const neededDepth=Math.min(8,Math.max(1.5,(110-los)*.65));
  return p.x>los+neededDepth&&p.vx>1.6&&p.route&&!p.routeComplete;
 },
 zoneThreat(candidates,assignment,los){
  const deep=assignment.depth>=12;
  const ranked=[...candidates].sort((a,b)=>{
   const score=p=>{
    const lateral=Math.abs(p.y-assignment.baseY);
    if(!deep)return lateral*.7+Math.abs(p.x-assignment.baseX)*.25;
    // A receiver attacking vertically in the defender's assigned lane is
    // much more dangerous than a short crossing route.
    const vertical=this.isVerticalThreat(p,los)?6:0;
    const depth=Math.max(0,p.x-los);
    return lateral*.85-depth*.52-vertical;
   };
   return score(a)-score(b);
  });
  return ranked[0]||null;
 },
 // Project only the receiver's OBSERVED movement, not his secret route.
 // Better awareness gives earlier anticipation; even great safeties cannot
 // know where a future cut will go before the receiver reveals it.
 deepIntercept(defender,receiver,assignment,los){
  const vertical=this.isVerticalThreat(receiver,los);
  if(!vertical)return null;
  const awareness=Math.max(0,Math.min(1,((defender.AWR||70)*.65+(defender.PRC||70)*.35-45)/50));
  const separation=Math.hypot(receiver.x-defender.x,receiver.y-defender.y);
  // A safety with space to close projects farther ahead than one already in position.
  const horizon=Math.max(.20,Math.min(.75,.24+separation*.018+awareness*.20));
  const vx=Math.max(0,receiver.vx||0),vy=receiver.vy||0;
  // Coverage aims in front of the moving receiver and protects the deep shoulder.
  const x=Math.min(114.65,receiver.x+Math.min(5.6,vx*horizon)+.9+awareness*.9);
  const y=Math.max(assignment.baseY-assignment.width*.76,Math.min(assignment.baseY+assignment.width*.76,receiver.y+Math.max(-3,Math.min(3,vy*horizon))));
  return {x,y,horizon};
 },
 meshAvoidance(p,teammates,play){
  if(play!=='mesh'||!p.route||p.routeComplete||!['WR1','WR2','TE'].includes(p.key))return {x:0,y:0};
  let x=0,y=0;
  for(const other of teammates){
   if(other===p||!other.route||other.routeComplete||other.ground)continue;
   const dx=p.x-other.x,dy=p.y-other.y;
   const dist=Math.hypot(dx,dy);
   if(dist>3.1||dist<.01)continue;
   const closing=dx*(p.vx-other.vx)+dy*(p.vy-other.vy)<0;
   if(!closing&&dist>1.35)continue;
   const skill=Math.max(0,Math.min(1,((p.AWR||70)+(p.RTE||70)-95)/100));
   const strength=(3.1-dist)/3.1*(1.3+skill*.7);
   // The crossers take opposite sides, rather than both dodging the same way.
   const side=p.key==='WR1'?-1:p.key==='WR2'?1:(dy>=0?1:-1);
   y+=side*strength;
   x+=Math.max(-.45,Math.min(.45,dx/dist*.30))*strength;
  }
  return {x:Math.max(-.6,Math.min(.6,x)),y:Math.max(-1.7,Math.min(1.7,y))};
 }
};
