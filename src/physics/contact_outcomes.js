import { AnatomyHitboxes } from "./anatomy_hitboxes.js";

// CHAOS: original, deterministic anatomical contact interpretation.
// Input: detected regions and actual physics/engagement state. No random draws.
// This distinguishes touched vs tackled, and never creates a tackle by itself.
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
 const core=new Set(['torso','pelvis','thigh']);
 const arms=new Set(['upperArm','forearm','hand']);
 const legs=new Set(['thigh','shin']);
 function classify(hits=[],options={}){
  const approach=clamp(options.approachAngle??0,0,180);
  const speed=clamp(options.relativeSpeed??0,0,30);
  const grip=clamp(options.grip??0,0,3);
  const age=clamp(options.engagementAge??0,0,8);
  const wrap=options.style==='wrap'||options.style==='dive'||options.style==='conservative';
  const penetration=hits.length?Math.max(...hits.map(h=>h.penetration||0)):0;
  const central=hits.some(h=>core.has(h.a)&&core.has(h.b));
  const armOnBody=hits.some(h=> (arms.has(h.a) && (core.has(h.b)||legs.has(h.b))) || (arms.has(h.b) && (core.has(h.a)||legs.has(h.a))));
  const lowBody=hits.some(h=>(legs.has(h.a)&&core.has(h.b))||(legs.has(h.b)&&core.has(h.a)));
  const onBody=central||armOnBody||lowBody;
  const mild=penetration<.085||(!onBody&&penetration<.17);
  let kind='miss';
  if(hits.length){
   if(mild||!onBody)kind='light contact';
   else kind='meaningful contact';
   if((central||armOnBody)&&penetration>=.105&&speed>=.55&&approach<=155)kind='potential tackle';
   // A secured wrap is an earned state: a tackle link, sustained grip, body
   // contact and controlled movement. NEVER award it on the first overlap.
   if(wrap&&age>=.38&&grip>=.95&&speed<=2.2&&penetration>=.075&&onBody&&approach<=155)
    kind='guaranteed tackle';
  }
  return Object.freeze({kind,penetration:+penetration.toFixed(3),relativeSpeed:+speed.toFixed(2),approachAngle:+approach.toFixed(1),
   bodyContact:onBody,armOnBody,regions:hits.slice(0,6).map(h=>`${h.a}:${h.aSide}/${h.b}:${h.bSide}`),
   // Can be used by tackle solver for a nearly-certain completed, controlled wrap;
   // not a generic auto-win for any overlapping model geometry.
   secured:kind==='guaranteed tackle',potential:kind==='potential tackle'||kind==='guaranteed tackle'});
 }
 function angle(runner,defender){
  const dx=(runner.x||0)-(defender.x||0),dy=(runner.y||0)-(defender.y||0);
  const facing=defender.face||0;
  const cosine=(dx*Math.cos(facing)+dy*Math.sin(facing))/Math.max(.001,Math.hypot(dx,dy));
  return Math.acos(clamp(cosine,-1,1))*180/Math.PI;
 }
 function evaluate(runner,defender,link=null,hits=null){
  const contacts=hits||AnatomyHitboxes.contacts(AnatomyHitboxes.sample(defender),AnatomyHitboxes.sample(runner));
  return classify(contacts,{approachAngle:angle(runner,defender),
   relativeSpeed:Math.hypot((defender.vx||0)-(runner.vx||0),(defender.vy||0)-(runner.vy||0)),
   grip:link?.grip||0,engagementAge:link?.age||0,style:link?.style||defender.action?.kind||'none'});
 }
export const ChaosContactOutcomes = Object.freeze({classify,evaluate,angle});
