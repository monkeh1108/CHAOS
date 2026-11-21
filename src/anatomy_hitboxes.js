'use strict';
// CHAOS original anatomical broad/narrow phase geometry. Stage 1: read-only,
// using the same approximate dimensions and movement states as renderer3d.
// No tackle awards, movement corrections or RNG happen in this module.
const AnatomyHitboxes=(()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
 const v=(x,y,z)=>({x,y,z});
 function dimensions(p){
  const height=clamp(p.h||74,60,86),weight=clamp(p.w||205,125,450);
  const stature=height/74;
  // Weight influences anatomical breadth, not muscle force or tackle outcomes.
  const build=clamp(weight/215,.76,1.40);
  return {heightIn:height,weightLb:weight,stature,build,visualHeight:2.44*stature};
 }
 function capsule(region,side,a,b,r){return {region,side,a,b,r};}
 function sample(p,options={}){
  const d=dimensions(p);
  const pose=options.pose|| (typeof AnimationPolicy!=='undefined' ? AnimationPolicy.sample(p,!!options.contact,!!options.presnap):{crouch:0,stanceLean:0,lean:0,stride:0,cycle:0,stance:null});
  const facing=Number.isFinite(options.facing)?options.facing:(p.face||0);
  const c=Math.cos(facing),s=Math.sin(facing);
  const action=p.action?.time>0?p.action.kind:'';
  const progress=clamp((p.action?.age||0)/Math.max(.01,(p.action?.age||0)+(p.action?.time||0)),0,1);
  const divePose=typeof ChaosDiveReach!=='undefined'?ChaosDiveReach.pose(p):null;
  const standingWrapPose=!divePose&&typeof ChaosDiveReach!=='undefined'?ChaosDiveReach.standingPose(p):null;
  const dive=divePose?Math.sin(Math.PI*.5*divePose.progress):0;
  const fallen=p.ground? (p.ground.stage==='rise'?clamp((p.ground.time||0)/Math.max(.05,p.ground.rise||.4),0,1):1):0;
  const tilt=clamp((pose.lean||0)+(pose.stanceLean||0)+(divePose?divePose.bodyPitch:-1.28*fallen),-1.57,.35);
  const leanSin=Math.sin(tilt),leanCos=Math.cos(tilt);
  const zBase=-(pose.crouch||0)+(.20*fallen)+(typeof ChaosLowContact!=='undefined'?ChaosLowContact.height(p):0);
  // Local coordinates: x forward, lateral toward player's left, z up.
  function world(x,l,z){
   const xx=x*leanCos-z*leanSin, zz=x*leanSin+z*leanCos;
   return v((p.x||0)+xx*c-l*s,(p.y||0)+xx*s+l*c,zBase+zz*d.stature);
  }
  const regions=[];
  const add=(name,side,a,b,r)=>regions.push(capsule(name,side,world(...a),world(...b),r*d.stature));
  const breadth=d.build,step=(pose.cycle||0)*(pose.stride||0);
  add('helmet',0,[0,0,1.90],[0,0,2.10],.22);
  add('torso',0,[0,0,1.10],[0,0,1.72],.345*breadth);
  add('pelvis',0,[0,0,.87],[0,0,1.08],.29*breadth);
  for(const side of [-1,1]){
   const l=side*.36*breadth;
   const block=!!pose.blockArms;
   const diveArm=(divePose||standingWrapPose)?ChaosDiveReach.armPoints(p,side,breadth):null;
   if(diveArm){
    add('upperArm',side,diveArm.shoulder,diveArm.elbow,.13*breadth);
    add('forearm',side,diveArm.elbow,diveArm.wrist,.11*breadth);
    add('hand',side,diveArm.wrist,diveArm.hand,.105);
   }else{
    const swing=block?.40:step*side*.42;
    const armForward=block?.36:Math.sin(swing)*.18;
    add('upperArm',side,[0,l,1.58],[armForward*.55,l*1.15,1.33],.13*breadth);
    add('forearm',side,[armForward*.55,l*1.15,1.33],[armForward+(block?.28:0),l*1.14,1.10],.11*breadth);
    add('hand',side,[armForward+(block?.28:0),l*1.14,1.10],[armForward+(block?.35:0),l*1.14,1.08],.105);
   }
   const hip=side*.21*breadth;
   const legSwing=step*side*.18;
   add('thigh',side,[0,hip,.87],[legSwing,hip,.47],.18*breadth);
   add('shin',side,[legSwing,hip,.47],[legSwing*.5,hip,.10],.125*breadth);
   add('foot',side,[legSwing*.5,hip,.10],[legSwing*.5+.24,hip,.09],.105*breadth);
  }
  return {key:p.key||null,dims:d,poseState:pose.state||'none',facing,regions};
 }
 // Robust closest-point distance between 3-D capsule centerline segments.
 function segmentDistanceSq(a,b,c,d){
  const sub=(p,q)=>v(p.x-q.x,p.y-q.y,p.z-q.z);
  const dot=(p,q)=>p.x*q.x+p.y*q.y+p.z*q.z;
  const u=sub(b,a),vv=sub(d,c),w=sub(a,c);
  const A=dot(u,u),B=dot(u,vv),C=dot(vv,vv),D=dot(u,w),E=dot(vv,w);
  let sc=0,tc=0;
  if(A<1e-10&&C<1e-10)return dot(w,w);
  if(A<1e-10)tc=clamp(E/C,0,1);
  else if(C<1e-10)sc=clamp(-D/A,0,1);
  else {
   const den=A*C-B*B;
   sc=den>1e-10?clamp((B*E-C*D)/den,0,1):0;
   tc=clamp((B*sc+E)/C,0,1);
   sc=clamp((B*tc-D)/A,0,1);
   tc=clamp((B*sc+E)/C,0,1);
  }
  const x=v(w.x+sc*u.x-tc*vv.x,w.y+sc*u.y-tc*vv.y,w.z+sc*u.z-tc*vv.z);
  return dot(x,x);
 }
 function contacts(a,b){
  const hits=[];
  for(const x of a.regions)for(const y of b.regions){
   const distance=Math.sqrt(segmentDistanceSq(x.a,x.b,y.a,y.b));
   const penetration=x.r+y.r-distance;
   if(penetration>0)hits.push({a:x.region,b:y.region,aSide:x.side,bSide:y.side,penetration});
  }
  return hits.sort((x,y)=>y.penetration-x.penetration);
 }
 function sweptContacts(p0,p1,q0,q1,steps=8){
  // Approximate continuous collision test: sample interpolated *poses* as well
  // as positions. Intended for repeatable debugging, not yet the live solver.
  const n=Math.round(clamp(steps,1,32)),out=[];
  const blend=(a,b,t)=>({...b,x:(a.x||0)+((b.x||0)-(a.x||0))*t,y:(a.y||0)+((b.y||0)-(a.y||0))*t,face:(a.face||0)+Math.atan2(Math.sin((b.face||0)-(a.face||0)),Math.cos((b.face||0)-(a.face||0)))*t});
  for(let i=0;i<=n;i++){
   const t=i/n, hits=contacts(sample(blend(p0,p1,t)),sample(blend(q0,q1,t)));
   if(hits.length)out.push({t,hits});
  }
  return out;
 }
 return Object.freeze({dimensions,sample,contacts,sweptContacts,segmentDistanceSq});
})();
