'use strict';
// CHAOS original grip attachment policy. Never teleports a player or decides
// a tackle: it produces bounded velocity changes while an earned link exists.
const ChaosGripAttachment=(()=>{
 const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(x)?x:lo));
 // Contact accuracy is distinct from general tackling skill. It combines
 // actual anatomical placement, facing, approach quality and skill; the score
 // influences a hold, but never manufactures contact or declares a tackle.
 function contactQuality(contact,defender,hit,style){
  if(!contact||contact.kind==='miss'||contact.kind==='light contact')return 0;
  const placement=contact.armOnBody?1:contact.bodyContact?.74:.30;
  const overlap=clamp((contact.penetration||0)/.30,0,1);
  const facing=clamp(1-(contact.approachAngle||0)/190,.05,1);
  const control=clamp(.55+(hit?.advantage||0)*.012,.28,1);
  // TAK encodes grip technique until CHAOS has an independently defined,
  // differentiated GRIP rating. AWR reflects visual targeting and timing.
  const technique=clamp(((defender?.TAK||70)*.72+(defender?.AWR||70)*.28)/85,.55,1.16);
  const styleFit=style==='wrap'?1.08:style==='dive'?.93:style==='hit'?.59:.79;
  return clamp((.22+placement*.28+overlap*.22+facing*.16+control*.12)*technique*styleFit,.18,1.25);
 }
 function step(runner,defender,link,dt,runnerRadius,defenderRadius){
  if(!runner||!defender||!link||dt<=0)return {active:false,reason:'missing'};
  const dx=runner.x-defender.x,dy=runner.y-defender.y;
  const distance=Math.max(.0001,Math.hypot(dx,dy));
  const nx=dx/distance,ny=dy/distance;
  const grip=clamp(link.grip||0,0,1.6);
  // A weak brush does not attach. The slack models extended arms and the
  // runner's body; the coupling only becomes meaningful as grip develops.
  if(grip<.30)return {active:false,reason:'unsecured',distance};
  const rest=clamp((runnerRadius+defenderRadius)*.90+.10,.44,1.20);
  const slack=clamp(.42-(grip-.3)*.19,.18,.42);
  const stretch=Math.max(0,distance-rest-slack);
  const maxStretch=rest+slack+clamp(.52+(1.6-grip)*.19,.52,.82);
  // This reports a stretched grip for the existing release logic to assess;
  // there is no snapping, position correction, or unbreakable constraint.
  if(distance>maxStretch)return {active:false,reason:'overextended',distance,maxStretch};
  const massRunner=clamp(runner.w||215,130,400),massDef=clamp(defender.w||220,130,400);
  const skill=clamp(.32+(defender.TAK||70)*.004+(defender.STR||70)*.0025,.55,.97);
  const accuracy=clamp(link.quality??1,.18,1.25);
  const strength=clamp((grip-.24)*skill*accuracy,0,1.25);
  const separationRate=(runner.vx-defender.vx)*nx+(runner.vy-defender.vy)*ny;
  // Damped spring: the further apart they pull, the harder the defender
  // works to keep up. The defender bears most of the impulse; the runner
  // retains a chance to drag him for extra yards.
  const pull=clamp((stretch*17+Math.max(0,separationRate)*2.6)*strength,0,15.0);
  const impulse=pull*dt;
  const defenderDelta=impulse*clamp(massRunner/massDef,.58,1.65);
  const runnerDelta=impulse*clamp(massDef/massRunner,.55,1.45)*.32;
  defender.vx+=nx*defenderDelta;defender.vy+=ny*defenderDelta;
  runner.vx-=nx*runnerDelta;runner.vy-=ny*runnerDelta;
  return {active:true,distance,stretch,force:pull,grip,rest,slack};
 }
 return Object.freeze({step,contactQuality});
})();
