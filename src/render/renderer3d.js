'use strict';
// Original lightweight WebGL renderer. No network, textures, assets, or
// third-party packages. It only reads simulation state; never resolves contact.
function createGridironRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false});
 if(!gl)return null;
 const vs=`attribute vec3 aPos;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying float vShade;void main(){vec3 n=normalize(mat3(uModel)*aNormal);vShade=0.59+0.41*max(0.0,dot(n,normalize(vec3(-0.45,1.0,0.35))));gl_Position=uMVP*vec4(aPos,1.0);}`;
 const fs=`precision mediump float;uniform vec3 uColor;varying float vShade;void main(){gl_FragColor=vec4(uColor*vShade,1.0);}`;
 const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
 gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 const attrPos=gl.getAttribLocation(prog,'aPos'),attrNormal=gl.getAttribLocation(prog,'aNormal');
 const uMVP=gl.getUniformLocation(prog,'uMVP'),uModel=gl.getUniformLocation(prog,'uModel'),uColor=gl.getUniformLocation(prog,'uColor');
 // WebGL vertex arrays start disabled. Without enabling them, all mesh triangles
 // collapse to one point and only the flat background clear color is visible.
 if(attrPos<0||attrNormal<0)throw Error('Required 3D vertex inputs missing');
 gl.enableVertexAttribArray(attrPos);
 gl.enableVertexAttribArray(attrNormal);
 const I=()=>[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
 const mul=(a,b)=>{const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o};
 const trans=(x,y,z)=>{const m=I();m[12]=x;m[13]=y;m[14]=z;return m};
 const scale=(x,y,z)=>[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
 const rotY=t=>{const c=Math.cos(t),s=Math.sin(t);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]};
 const rotZ=t=>{const c=Math.cos(t),s=Math.sin(t);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]};
 const rotX=t=>{const c=Math.cos(t),s=Math.sin(t);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]};
 const at=(m,x,y,z)=>mul(m,trans(x,y,z));
 const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
 function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),r=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*r,-1,0,0,2*far*near*r,0]}
 function lookAt(eye,center){const z=norm(eye.map((v,i)=>v-center[i])),x=norm([z[2],0,-z[0]]),y=norm([z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]]);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((v,t,i)=>v+t*eye[i],0),-y.reduce((v,t,i)=>v+t*eye[i],0),-z.reduce((v,t,i)=>v+t*eye[i],0),1]}
 function mesh(arr){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return {b,n:arr.length/6}}
 const cube=[];
 const faces=[{n:[0,0,1],v:[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]},{n:[0,0,-1],v:[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]},{n:[1,0,0],v:[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]},{n:[-1,0,0],v:[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]},{n:[0,1,0],v:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]},{n:[0,-1,0],v:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]}];
 for(const f of faces)for(const j of [0,1,2,0,2,3])cube.push(...f.v[j],...f.n);
 const ball=[];let rings=7,segments=10;
 for(let v=0;v<rings;v++)for(let u=0;u<segments;u++){
  const pt=(a,b)=>{const theta=(a/rings)*Math.PI,phi=(b/segments)*Math.PI*2;return [Math.sin(theta)*Math.cos(phi)*.5,Math.cos(theta)*.5,Math.sin(theta)*Math.sin(phi)*.5]};
  const a=pt(v,u),b=pt(v+1,u),c=pt(v+1,u+1),d=pt(v,u+1);
  for(const p of [a,b,c,a,c,d])ball.push(...p,...norm(p));
 }
 const meshes={box:mesh(cube),sphere:mesh(ball)};
 let markerDebug={catchPoint:null,ballShadow:null,carrier:null,controlled:null,intended:null};
 let viewProjection=I(),cameraCenter=30,cameraLane=26.65,cameraZoom=0,
 w=1,h=1,eye=[0,25,75],cameraTarget=[0,0,0],drawCalls=0,blankFrames=0,renderVerified=false;
 const cameraDebug={focusX:30,focusY:26.65,eye:[0,25,75],look:[0,0,0],zoom:0,ballFlight:false};
 const color=c=>c.map(v=>v/255);
 const C={field:color([37,106,72]),fieldAlt:color([42,115,76]),end:color([18,62,82]),line:color([230,240,213]),hash:color([196,225,207]),own:color([206,236,93]),enemy:color([81,193,237]),pants:color([232,234,218]),skin:color([151,118,87]),shoe:color([22,34,43]),helmetOwn:color([233,248,164]),helmetEnemy:color([166,234,252]),shadow:color([15,64,52]),catch:color([255,227,111]),ballShadow:color([246,251,253]),controlled:color([139,242,250]),carrier:color([255,190,74]),bar:color([233,244,244]),yellow:color([255,225,112]),stands:color([24,42,52]),ball:color([141,81,43])};
 function paint(which,parent,pos,size,c){const model=mul(at(parent,...pos),scale(...size));gl.uniformMatrix4fv(uMVP,false,new Float32Array(mul(viewProjection,model)));gl.uniformMatrix4fv(uModel,false,new Float32Array(model));gl.uniform3fv(uColor,c);const msh=meshes[which];gl.bindBuffer(gl.ARRAY_BUFFER,msh.b);gl.vertexAttribPointer(attrPos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(attrNormal,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,msh.n);drawCalls++}
 const box=(m,pos,size,c)=>paint('box',m,pos,size,c),sphere=(m,pos,size,c)=>paint('sphere',m,pos,size,c);
 function field(LOS,first){
  const root=I();for(let i=0;i<12;i++)box(root,[5+i*10,-.19,26.66],[10,.24,53.333],i===0||i===11?C.end:i%2?C.field:C.fieldAlt);
  for(let x=10;x<=110;x+=5){box(root,[x,-.041,26.66],[.12,.023,53.30],C.line);for(let z of [16,37.30])box(root,[x,-.025,z],[1,.023,.12],C.hash)}
  for(const z of [.16,53.15])box(root,[60,-.025,z],[100,.034,.16],C.line);
  box(root,[LOS,-.014,26.66],[.12,.036,53],C.enemy);box(root,[first,-.013,26.66],[.13,.04,53],C.yellow);
  // Stadium silhouette, simple tunnel and side barriers.
  for(const z of [-5,58]){box(root,[60,.5,z],[125,1.0,6],C.stands);box(root,[60,1.15,z],[125,.10,1],C.bar)}
  for(const x of [0,120]){
   box(root,[x,2.25,26.66],[.12,4.5,.12],C.yellow);box(root,[x,4.5,26.66],[.15,.15,6.5],C.yellow);
   for(const dz of [-3.25,3.25])box(root,[x,5.4,26.66+dz],[.13,1.8,.13],C.yellow);
  }
 }
 // Genuine 3D, turf-level play art. Unlike the old 2D canvas routes, these
 // are visible above the field in the WebGL view and follow camera perspective.
 function artStroke(a,b,c,thickness=.18){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  if(length<.06)return;
  const root=mul(trans((a[0]+b[0])*.5,.015,(a[1]+b[1])*.5),rotY(-Math.atan2(dz,dx)));
  box(root,[0,0,0],[length,.035,thickness],c);
 }
 function routeArt(sim){
  if(sim.phase!=='presnap'||sim.defenseArt?.length)return;
  const run=['inside','stretch','power','counter','sweep'].includes(sim.play);
  if(run){
   const back=sim.players.find(p=>p.key==='RB');if(!back)return;
   const start=[back.x,back.y],handoff=[sim.los+1,26.65];
   const edge=sim.play==='stretch'?[sim.los+6,8]:sim.play==='sweep'?[sim.los+8,43]:sim.play==='counter'?[sim.los+6,38]:sim.play==='power'?[sim.los+5,19]:[sim.los+8,26.65];
   const end=sim.play==='stretch'?[sim.los+15,8]:sim.play==='sweep'?[sim.los+16,46]:sim.play==='counter'?[sim.los+15,39]:sim.play==='power'?[sim.los+13,16]:[sim.los+16,26.65];
   const pts=[start,handoff,edge,end],tint=C.own;
   for(let i=0;i<pts.length-1;i++)artStroke(pts[i],pts[i+1],tint,.22);
   const a=pts.at(-2),b=pts.at(-1),theta=Math.atan2(b[1]-a[1],b[0]-a[0]);
   for(const s of [-1,1])artStroke(b,[b[0]-1.2*Math.cos(theta+s*.54),b[1]-1.2*Math.sin(theta+s*.54)],tint,.23);
  }else{
   for(const route of sim.art||[]){
    let prev=route.start;const tint=route.key==='TE'?C.yellow:C.own;
    for(const point of route.points){
     artStroke(prev,point,tint,.15);
     const theta=Math.atan2(point[1]-prev[1],point[0]-prev[0]);
     // Arrowheads help distinguish a play call from static yard lines.
     for(const s of [-1,1])artStroke(point,[point[0]-.95*Math.cos(theta+s*.57),point[1]-.95*Math.sin(theta+s*.57)],tint,.18);
     prev=point;
    }
   }
  }
 }
 // Painted at turf height so the projected catch destination and shadow can
 // be followed even when the camera tracks a high, long pass.
 function groundRing(x,z,r,c,segments=18,width=.18,height=.05){
  if(!Number.isFinite(x)||!Number.isFinite(z))return;
  for(let i=0;i<segments;i++){
   const theta=2*Math.PI*(i+.5)/segments;
   const parent=mul(trans(x+r*Math.cos(theta),.058,z+r*Math.sin(theta)),rotY(-theta-Math.PI/2));
   box(parent,[0,0,0],[2*r*Math.sin(Math.PI/segments)*.72,height,width],c);
  }
 }
 function airAndPossessionMarkers(sim){
  const a=sim.markerCarrier,selected=sim.active,b=sim.ball,rec=sim.intended;
  markerDebug={catchPoint:null,ballShadow:null,carrier:a?.key||null,controlled:selected?.key||null,intended:b?.flying?rec?.key||null:null};
  if(a){groundRing(a.x,a.y,1.00,C.carrier,22,.20);}
  if(selected&&selected!==a){groundRing(selected.x,selected.y,.92,C.controlled,17,.15);}
  if(!b?.flying)return;
  const catchX=Number.isFinite(b.aimX)?b.aimX:b.x+(b.vx||0)*Math.max(0,(b.flight||0)-(b.t||0));
  const catchY=Number.isFinite(b.aimY)?b.aimY:b.y+(b.vy||0)*Math.max(0,(b.flight||0)-(b.t||0));
  markerDebug.catchPoint={x:catchX,y:catchY};markerDebug.ballShadow={x:b.x,y:b.y};
  const pulse=1+.085*Math.sin(sim.clock*7);
  groundRing(catchX,catchY,1.14*pulse,C.catch,24,.22);
  groundRing(catchX,catchY,.48*pulse,C.ballShadow,14,.12);
  groundRing(b.x,b.y,.52,C.ballShadow,16,.14);
  box(I(),[b.x,.039,b.y],[.17,.018,.17],C.catch);
  if(rec&&rec!==selected)groundRing(rec.x,rec.y,.83,C.controlled,14,.12);
 }
 function player(p,clock,selected,carrier,contacts,possession,presnap,blockOpponent){
  const s=(p.h||74)/74,breadth=Math.max(.76,Math.min(1.40,(p.w||205)/215));
  // While hands are engaged, face the actual opponent for presentation only.
  // Do not modify p.face or the simulation's turning / blocking physics.
  const partner=blockOpponent?.get(p.key);
  const displayFace=partner?Math.atan2(partner.y-p.y,partner.x-p.x):p.face;
  let root=mul(trans(p.x,0,p.y),rotY(-displayFace));
  const ground=p.ground,winded=ground?.stage==='winded',rising=ground?.stage==='rise';
  const action=p.action?.kind||'';
  const involved=contacts?.has(p.key)||p.pushing;
  const pose=AnimationPolicy.sample(p,involved,presnap);
  const run=pose.run*(1-(pose.standUp||0)*.65),step=pose.cycle,contact=pose.brace,bob=pose.bob;
  // The same physical contact and knocked-down states drive the pose.
  if(ground){const fall=ground.stage==='fall'?Math.min(1,(ground.age||0)/Math.max(.05,ground.fall||.25)):1;
    const up=rising?Math.max(0,Math.min(1,(ground.time||0)/Math.max(.05,ground.rise||.4))):0;
    const tilt=ground.stage==='fall'?-1.28*fall:rising?-1.28*up:-1.28;
    root=mul(root,rotZ(tilt));root=at(root,0,ground.stage==='rise'?.31: .20,0);
  }else{root=at(root,0,bob-pose.crouch,0);root=mul(root,rotZ(pose.lean+pose.stanceLean-pose.impactAccent));root=mul(root,rotX(pose.bank));root=mul(root,rotY(pose.yaw));}
  root=mul(root,scale(s,s,s));
  box(I(),[p.x,-.045,p.y],[.85,.018,.69],C.shadow);
  const isHome=(p.team===0?possession:1-possession)===0;
  const jersey=isHome?C.own:C.enemy,trim=isHome?C.helmetOwn:C.helmetEnemy;
  const airPose=p.airPose?.time>0?p.airPose.kind:null,committed=!!(airPose&&!airPose.startsWith('ready-'));
  const aKind=committed?airPose:null,airTime=p.airPose;
  const t=airTime?Math.min(1,(airTime.age||0)/Math.max(.01,airTime.duration||.6)):0;
  const arc=Math.sin(Math.PI*t),flavor=(p.animationFlavor||.5)-.5;
  const rise=aKind==='aggressive'?.93:aKind==='ball'?.85:aKind==='swat'?.63:aKind==='possession'?.20:aKind==='receiver'?.19:aKind==='rac'?.045:0;
  const kick=action==='kick'&&p.action?.time>0;
  const kickT=kick?Math.min(1,(p.action.age||0)/.55):0;
  const hurdle=!!p.airState;
  const hurdleT=hurdle?Math.min(1,(p.airState.elapsed||0)/p.airState.duration):0;
  const dive=['dive','tackle-dive'].includes(action)&&p.action?.time>0;
  const divePose=dive?ChaosDiveReach.pose(p):null;
  const standingWrapPose=!dive?ChaosDiveReach.standingPose(p):null;
  const freeHandEscape=pose.escapePulse>0&&!ground&&!dive&&!standingWrapPose;
  const diveT=divePose?.progress||0;
  const lunge=['hit-stick','cut-stick','conservative'].includes(action)&&p.action?.time>0;
  const vertical=rise*arc+ChaosLowContact.height(p);
  if(vertical)root=at(root,0,vertical,0);
  if(p.stumbleTime>0&&!ground){root=mul(root,rotZ(-.15*Math.min(1,p.stumbleTime/.27)));}
  if(p.ankleReachTime>0&&ground)root=mul(root,rotZ(-.12*Math.min(1,p.ankleReachTime/.34)));
  if(dive){
   // A single continuous launch into a prone landing, rather than tilting
   // forward, returning upright, then starting a second fall.
   root=at(root,0,.13*Math.sin(Math.PI*diveT),0);
   root=mul(root,rotZ(divePose.bodyPitch));
  }
  if(lunge)root=mul(root,rotZ(-.32*Math.sin(Math.PI*Math.min(1,(p.action.age||0)/.4))));
  if(['aggressive','ball'].includes(aKind))root=mul(root,rotZ((.06+flavor*.28)*arc));
  const armsOut=pose.blockArms||!!airPose||hurdle||dive||['stiff','truck','impact-block','hit-stick','cut-stick','conservative','tackle-dive'].includes(action);
  const legAmp=pose.stride;
  const recovering=ground&&ground.stage==='rise';
  const riseProgress=recovering?Math.max(0,Math.min(1,1-(ground.time||0)/Math.max(.05,ground.rise||.3))):0;
  const groundFold=ground?(recovering?.60*(1-riseProgress):ground.stage==='fall'?.35:.58):0;
  const leftLeg=root,shift=winded?.05:0;
  // Pelvis and pads, deliberate proportional differences for linemen/skill players.
  box(root,[0,.94+shift,0],[.47*breadth,.27,.45*breadth],C.pants);
  box(root,[0,1.37+shift,0],[.53*breadth,.69,.59*breadth],jersey);
  box(root,[.015,1.67+shift,0],[.47*breadth,.18,.69*breadth],jersey);
  sphere(root,[0,1.95+shift,0],[.49,.48,.49],trim);
  // Facemask bars face downfield (positive local x).
  box(root,[.265,1.90+shift,0],[.07,.10,.49],C.bar);
  box(root,[.28,2.02+shift,0],[.06,.055,.40],C.bar);
  for(const side of [-1,1]){
   let hip=at(root,0,.87,side*.20*breadth);
   hip=mul(hip,rotZ((run?side*legAmp*step:0)+(ground?-.23+groundFold*(side<0?1:.72):0)+(pose.stance==='three-point'?.26:pose.stance==='coverage-ready'?.13:pose.stance==='receiver'?.16:0)+((hurdle||dive)?(.60+side*.22)*Math.sin(Math.PI*(hurdle?hurdleT:diveT)):0)+(rise>0?-.22*arc:0)+(kick&&side<0?-.98*Math.sin(Math.PI*kickT):0)));
   box(hip,[.03,-.23,0],[.24,.52,.25*breadth],C.pants);
   const knee=mul(at(hip,.03,-.48,0),rotZ((run?Math.abs(step*legAmp)*.50:0)+(pose.stance? .20:0)+(ground?groundFold*.72:0)+(hurdle?.85*Math.sin(Math.PI*hurdleT):0)+(rise>0?.30*arc:0)));
   box(knee,[.07,-.20,0],[.23,.43,.23*breadth],C.pants);
   box(knee,[.17,-.40,0],[.34,.16,.26*breadth],C.shoe);
   let shoulder=at(root,0,1.57+shift,side*.36*breadth);
   const stiffExtended=action==='stiff' && side<0;
   // The stiff arm extends *forward* from one shoulder; the other arm stays
   // free to carry/balance the football. Animation reflects an actual move.
   const overhead=['aggressive','ball','swat'].includes(aKind);
   const handsUp=overhead||aKind==='possession';
   // Each skill owns its own silhouette: two-handed high point, single-arm
   // DB swat, ball-hawk reach, chest-level possession, running RAC cradle.
   const highpoint=(aKind==='aggressive'?2.45+side*.08:aKind==='ball'?(side<0?2.48:2.15):aKind==='swat'?(side<0?2.50:.55):0);
   const catchArm=aKind==='possession'?(side<0?1.58:1.92):aKind==='rac'?(side<0?1.22:-.22):aKind==='receiver'?(side<0?.95:1.42):0;
   const stanceSwing=pose.stance==='three-point'?(side<0?1.08:.33):pose.stance==='receiver'?(side<0?.60:.35):pose.stance==='coverage-ready'?.35:pose.stance==='quarterback'?(side<0?.50:.43):pose.stance==='skill-ready'?.32:0;
   // Fallen players brace with forearms, then push up as their knees extend.
   // This is the same procedural body used for pancakes and missed dives.
   const getUpArm=ground?(p.ankleReachTime>0?1.48+(side<0?.17:-.10):recovering?(.95-riseProgress*.62)+(side<0?.15:-.06):ground.stage==='fall'?.68:1.02):null;
   const swing=getUpArm!==null?getUpArm:standingWrapPose?standingWrapPose.shoulder:freeHandEscape?(p.team===0?(side<0?.58:.22):.68)+pose.escapePulse*(p.team===0?(side<0?.52:-.12):.45):pose.stance?stanceSwing:kick?(side<0?-.86:.30):stiffExtended?1.30:hurdle?(side<0?1.28:.86):dive?divePose.shoulder:
     overhead?highpoint:catchArm|| (pose.blockArms?(pose.blockMode==='drive'?1.16:pose.blockMode==='seal'?.96:pose.blockMode==='double-team'?1.12:1.02)+side*.07:armsOut?.62-side*.10:(run?-side*step*legAmp*.8*pose.armDrive:.10));
   shoulder=mul(shoulder,rotZ(swing));
   box(shoulder,[dive?0:.07,-.215,0],[.23,.43,.20*breadth],jersey);
   if(ground){
    const palm=mul(at(shoulder,.08,-.42,0),rotZ(.28));
    box(palm,[.04,-.14,0],[.17,.29,.17*breadth],jersey);
    sphere(palm,[.12,-.30,0],[.14,.11,.14],C.skin);
   }else if(dive||standingWrapPose){
    const reachPose=dive?divePose:standingWrapPose;
    // Shared with anatomical hitboxes: straight reach, then inward wrap only
    // when the tackle solver confirms an engagement. No early sickle bend.
    const forearm=mul(at(shoulder,0,-.43,0),mul(rotZ(reachPose.elbow),rotY(side*reachPose.inward)));
    box(forearm,[0,-.215,0],[.16,.43,.16*breadth],jersey);
    sphere(forearm,[0,-.45,0],[.13,.12,.13],C.skin);
   }else if(pose.blockArms){
    // Two-stage reach: forearms and hands visibly extend toward the pads,
    // rather than hanging behind the torso in the old hunched pose.
    const elbow=mul(at(shoulder,.02,-.40,0),rotZ(.33));
    box(elbow,[.02,-.15,0],[.18,.33,.17*breadth],jersey);
    sphere(elbow,[.03,-.34,0],[.15,.12,.15],C.skin);
   }else box(shoulder,[.17,-.44,0],[.19,.18,.19],C.skin);
   if(pose.stance==='three-point'&&side<0){sphere(shoulder,[.20,-.53,0],[.13,.11,.13],C.skin);}
   if(overhead&&side<0){const reach=mul(at(shoulder,.13,-.46,0),rotZ(aKind==='swat'?.27:-.15));box(reach,[.08,-.13,0],[.15,.29,.16],jersey);sphere(reach,[.16,-.31,0],[.14,.13,.14],C.skin);}
  }
  if(carrier===p)sphere(root,[.36,1.32,-.24],[.32,.19,.21],C.ball);
  if(selected===p){box(I(),[p.x,.035,p.y],[1.13,.03,.09],C.yellow);box(I(),[p.x,.035,p.y],[.09,.03,1.13],C.yellow)}
 }
 function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);w=rect.width;h=rect.height;const rw=Math.max(2,Math.round(w*dpr)),rh=Math.max(2,Math.round(h*dpr));if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh}gl.viewport(0,0,rw,rh)}
 function project(x,y,z){const v=[x,y,z,1],out=[0,0,0,0];for(let r=0;r<4;r++)for(let c=0;c<4;c++)out[r]+=viewProjection[c*4+r]*v[c];if(out[3]<=.001)return null;const sx=out[0]/out[3],sy=out[1]/out[3];return {x:(sx*.5+.5)*w,y:(.5-sy*.5)*h,visible:Math.abs(sx)<1.1&&Math.abs(sy)<1.1}}
 function defensiveAssignmentArt(sim){
  if(sim.phase!=='presnap'||!sim.defenseArt?.length)return;
  for(const d of sim.defenseArt){
   if(!d.selected)continue;
   const a=d.assignment;
   if(a?.kind==='zone'){
    artStroke([d.x,d.y],[a.baseX,a.baseY],C.controlled,.18);
    groundRing(a.baseX,a.baseY,Math.min(4,a.width*.27),C.controlled,16,.12);
   }else if(a?.kind==='man'){
    const t=sim.players.find(p=>p.key===a.target);
    if(t)artStroke([d.x,d.y],[t.x,t.y],C.controlled,.15);
   }else{
    const spot=d.gapTarget?[d.gapTarget.x,d.gapTarget.y]:[Math.min(109.1,sim.los+3.0),d.y];
    artStroke([d.x,d.y],spot,C.controlled,.18);
    groundRing(spot[0],spot[1],.55,C.controlled,12,.12);
   }
  }
 }
 function draw(sim){resize();
  // During a pass the airborne football owns camera focus; after the catch or
  // handoff, follow the actual carrier. Smooth changes avoid abrupt cuts.
  const inFlight=!!sim.ball?.flying;
  const presnap=sim.phase==='presnap';
  const target=inFlight?sim.ball:(sim.carrier||sim.players.find(p=>p.key==='QB')||sim.active);
  // Before the snap, see the formation as well as the selected defender.
  // Once live, return to the original ball-follow behavior.
  const focusX=presnap ? sim.los : (target?.x??sim.los);
  const focusY=presnap ? 26.65 : (target?.y??26.65);
  const followRate=inFlight?.125:presnap?.115:.082;
  cameraCenter+=(focusX-cameraCenter)*followRate;
  cameraLane+=((.86*focusY+.14*26.65)-cameraLane)*followRate;
  const passView=inFlight||sim.phase==='live'&&!sim.carrier&&sim.play&&
   !['inside','stretch','power','counter','sweep'].includes(sim.play);
  // Give the defender room to see the offense while positioning before snap.
  // Keep live-play tracking untouched; no extra zoom on special teams.
  const presnapView=sim.phase==='presnap'&&!sim.special;
  const desiredZoom=presnapView?1.40:passView?1:0;
  cameraZoom+=(desiredZoom-cameraZoom)*(presnapView?.105:.045);
  const ratio=Math.max(.50,w/h),portrait=ratio<.85;
  // The positive-X field runs toward the opponent's end zone. Place the
  // camera behind the offense in X, rather than out on the far sideline.
  const backwards=(portrait?22:17)+cameraZoom*(portrait?8:10);
  const height=(portrait?20:15)+cameraZoom*(portrait?6:7);
  eye=[cameraCenter-backwards,height,cameraLane];
  cameraTarget=[cameraCenter+(portrait?13:14)+cameraZoom*2,1.0,cameraLane];
  cameraDebug.focusX=cameraCenter;cameraDebug.focusY=cameraLane;
  cameraDebug.eye=eye.slice();cameraDebug.look=cameraTarget.slice();
  cameraDebug.zoom=cameraZoom;cameraDebug.ballFlight=inFlight;cameraDebug.presnapView=presnapView;cameraDebug.desiredZoom=desiredZoom;
  viewProjection=mul(perspective(portrait?Math.PI/3.0:Math.PI/3.45,ratio,.3,300),lookAt(eye,cameraTarget));
  gl.clearColor(.07,.16,.19,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);drawCalls=0;
  field(sim.los,sim.first);routeArt(sim);defensiveAssignmentArt(sim);
  const contacts=new Set(),blockOpponent=new Map();
  const byKey=new Map(sim.players.map(p=>[p.key,p]));
  for(const c of sim.blocks){
   contacts.add(c.blocker);contacts.add(c.defender);
   const o=byKey.get(c.blocker),d=byKey.get(c.defender);
   if(o&&d){blockOpponent.set(o.key,d);blockOpponent.set(d.key,o)}
  }for(const c of sim.tackles){contacts.add(c.defender);if(sim.carrier)contacts.add(sim.carrier.key)}
  for(const p of sim.players)player(p,sim.clock,sim.active,sim.markerCarrier||sim.carrier,contacts,sim.possession??0,presnap,blockOpponent);
  airAndPossessionMarkers(sim);
  if(sim.ball&&sim.ball.flying){sphere(I(),[sim.ball.x,Math.max(.20,sim.ball.z),sim.ball.y],[.31,.19,.20],C.ball)}
  // A valid WebGL context does not guarantee a visible image: broken geometry
  // can silently produce a solid background. Read a few pixels only until the
  // first successful render; do not perform costly readbacks every frame.
  if(!renderVerified){
   const col=new Uint8Array(4),width=canvas.width,height=canvas.height;
   let visible=false;
   for(const ry of [.22,.40,.60,.78]){
    for(const rx of [.20,.38,.55,.72,.85]){
     gl.readPixels(Math.floor(width*rx),Math.floor(height*ry),1,1,gl.RGBA,gl.UNSIGNED_BYTE,col);
     // Clear color is (18,41,48). Field turf/players are visibly different.
     if(Math.abs(col[0]-18)+Math.abs(col[1]-41)+Math.abs(col[2]-48)>48){visible=true;break}
    }
    if(visible)break;
   }
   if(visible){renderVerified=true;blankFrames=0}
   else if(++blankFrames>=4){throw Error('3D frame contains no visible field or players')}
  }
  if(gl.isContextLost())throw Error('WebGL context lost');
  return {drawCalls,width:w,height:h,playerCount:sim.players.length};
 }
 return {draw,project,resize,getGL:()=>gl,getDebugState:()=>({...cameraDebug,markers:markerDebug,goalposts:[0,120],artVisibleIn3d:true})};
}
