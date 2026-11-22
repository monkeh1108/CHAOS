'use strict';
// Isolated, deterministic collision replay scene for CHAOS. No imported assets,
// no impact on scoring, live players, or gameplay RNG.
(()=>{
 const lab=document.createElement('section');lab.className='panel';lab.id='chaosContactLab';
 lab.style.cssText='margin:18px 0;padding:16px;display:block';
 lab.innerHTML=`<h2 style="margin:0 0 5px">CHAOS · Anatomical Contact Lab <span style="font-size:12px;opacity:.7">v0.36.4n</span></h2>
 <p style="margin:2px 0 12px;font-size:12px;color:#bed0d9">Independent repeatable scenarios. These detect contact; they do not automatically award tackles.</p>
 <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
 <label>Scenario <select id="contactPreset" style="max-width:220px"><option value="leg">Dive into legs</option><option value="kickdive">Kickoff-speed low dive</option><option value="shoulder">Shoulder contact</option><option value="miss">Missed dive (wide)</option><option value="small">Small DB vs large RB</option><option value="brush">Glancing arm contact</option><option value="wrap">Textbook secured wrap</option><option value="west">From west · rear pursuit (0°)</option><option value="east">From east · head-on (180°)</option><option value="north">From north · side (90°)</option><option value="south">From south · side (90°)</option><option value="nw">From northwest · diagonal (45°)</option><option value="ne">From northeast · diagonal (135°)</option><option value="sw">From southwest · diagonal (45°)</option><option value="se">From southeast · diagonal (135°)</option></select></label>
 <label>Defender <select id="contactSize"><option value="72,190">CB · 6′0″ 190 lb</option><option value="74,240">LB · 6′2″ 240 lb</option><option value="77,295">DL · 6′5″ 295 lb</option></select></label>
 <button type="button" id="contactRestart">RESTART</button><button type="button" id="contactPlay">PLAY / PAUSE</button>
 <button type="button" id="contactStep">+ 1 FRAME</button><button type="button" id="contactExport">EXPORT CONTACT LOG</button><button type="button" id="contactLive">LIVE CONTACT LOG</button>
 </div><div style="margin:8px 0"><label>Timeline <input id="contactTimeline" type="range" min="0" max="90" value="0" step="1" style="width:min(480px,70vw);vertical-align:middle"></label><span id="contactTime" style="font:12px monospace;margin-left:9px">0.000 s</span></div>
 <canvas id="contactCanvas" width="820" height="410" style="display:block;width:100%;max-width:820px;height:auto;background:#132c27;border:1px solid #557c6b;border-radius:8px"></canvas>
 <div id="contactReadout" aria-live="polite" style="font:12px/1.6 monospace;white-space:pre-wrap;margin-top:9px">Move the timeline or press PLAY.</div>
 <p style="font-size:11px;color:#a8b8b8;margin-top:8px">Cyan: defender · white: runner. Gold: recorded region contact. Top-down and side views are projected 3D capsules; physical tackle outcomes still use the existing system. Control collision timeline without affecting the live game.</p>`;
 (document.querySelector('.container')||document.body).appendChild(lab);
 const link=document.createElement('button');link.type='button';link.textContent='CONTACT LAB';link.title='Open repeatable anatomical collision scenarios';
 link.onclick=()=>lab.scrollIntoView({behavior:'smooth',block:'start'});
 const row=document.querySelector('.actionRow');if(row)row.appendChild(link);
 const el=id=>lab.querySelector('#'+id),canvas=el('contactCanvas'),ctx=canvas.getContext('2d');
 const scenarios={leg:{start:-5.1,side:0,defSpeed:11.0,runSpeed:5.0,pose:'dive'},kickdive:{start:-5.8,side:.10,defSpeed:13.4,runSpeed:6.8,pose:'dive'},shoulder:{start:-4.2,side:.32,defSpeed:10,runSpeed:4.9,pose:'stand'},miss:{start:-5.1,side:2.8,defSpeed:11.0,runSpeed:5,pose:'dive'},small:{start:-5.2,side:.1,defSpeed:11.6,runSpeed:4.8,pose:'dive'},brush:{start:-4.8,side:.84,defSpeed:10,runSpeed:5.0,pose:'stand'},wrap:{start:-1.9,side:0,defSpeed:4.5,runSpeed:1.1,pose:'stand'},
 // Approach vector is direction of travel: the label states the side the defender starts on.
 west:{vector:[1,0],defSpeed:9.5,runSpeed:5.0,pose:'stand'},east:{vector:[-1,0],defSpeed:9.5,runSpeed:5.0,pose:'stand'},
 north:{vector:[0,-1],defSpeed:9.5,runSpeed:5.0,pose:'stand'},south:{vector:[0,1],defSpeed:9.5,runSpeed:5.0,pose:'stand'},
 nw:{vector:[Math.SQRT1_2,-Math.SQRT1_2],defSpeed:9.5,runSpeed:5.0,pose:'stand'},ne:{vector:[-Math.SQRT1_2,-Math.SQRT1_2],defSpeed:9.5,runSpeed:5.0,pose:'stand'},
 sw:{vector:[Math.SQRT1_2,Math.SQRT1_2],defSpeed:9.5,runSpeed:5.0,pose:'stand'},se:{vector:[-Math.SQRT1_2,Math.SQRT1_2],defSpeed:9.5,runSpeed:5.0,pose:'stand'}};
 let time=0,playing=false,frameId=null;
 const snapshot=(t,sc,defHeight,defWeight)=>{
   const runner={key:'RB',team:0,h:sc===scenarios.small?77:71,w:sc===scenarios.small?245:211,x:Math.max(0,sc.runSpeed*t),y:0,vx:sc.runSpeed,vy:0,face:0,action:null,ground:null,travel:sc.runSpeed*t};
   const dive=sc.pose==='dive',dAge=Math.max(0,t-.12);
   const ux=sc.vector?sc.vector[0]:1,uy=sc.vector?sc.vector[1]:0;
   const interceptTime=.55,interceptX=sc.runSpeed*interceptTime;
   const startX=sc.vector?interceptX-ux*sc.defSpeed*interceptTime:sc.start;
   const startY=sc.vector?-uy*sc.defSpeed*interceptTime:sc.side;
   const defender={key:'DEF',team:1,h:defHeight,w:defWeight,x:startX+ux*sc.defSpeed*t,y:startY+uy*sc.defSpeed*t,vx:ux*sc.defSpeed,vy:uy*sc.defSpeed,face:Math.atan2(uy,ux),
    action:dive&&t>=.12&&t<.75?{kind:'tackle-dive',age:dAge,time:.75-t}:null,
    ground:dive&&t>=.75?{stage:'winded',time:.3,rest:.3,rise:.4,age:t-.75}:null,travel:sc.defSpeed*t,
    intent:sc===scenarios.wrap&&t>=.48?'wrap':null,
    wrapReach:sc===scenarios.wrap?Math.max(0,Math.min(1,(t-.16)/.40)):0,
    wrapLinked:sc===scenarios.wrap&&t>=.48};
   return {runner,defender};
 };
 const draw=()=>{
   const sc=scenarios[el('contactPreset').value],dims=el('contactSize').value.split(',').map(Number),t=time/60;
   const cur=snapshot(t,sc,...dims),before=snapshot(Math.max(0,t-1/60),sc,...dims);
   const a=AnatomyHitboxes.sample(cur.runner),b=AnatomyHitboxes.sample(cur.defender);
   const contacts=AnatomyHitboxes.contacts(a,b),swept=AnatomyHitboxes.sweptContacts(before.runner,cur.runner,before.defender,cur.defender,10);
   const active=contacts.length>0||swept.length>0;
   ctx.clearRect(0,0,820,410);
   ctx.font='bold 14px sans-serif';ctx.fillStyle='#eaf9f1';ctx.fillText('TOP-DOWN · x / lateral',18,27);ctx.fillText('SIDE · x / height',18,228);
   ctx.strokeStyle='#446755';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,205);ctx.lineTo(820,205);ctx.stroke();
   const origin=480,scale=33,topY=112,sideY=372;
   for(let i=-12;i<=12;i+=2){ctx.strokeStyle='#294a3d';ctx.beginPath();ctx.moveTo(origin+i*scale,35);ctx.lineTo(origin+i*scale,400);ctx.stroke();}
   function body(p,geom,color){
    const transforms=[v=>[origin+v.x*scale,topY-v.y*scale],v=>[origin+v.x*scale,sideY-v.z*scale]];
    for(let mode=0;mode<2;mode++)for(const r of geom.regions){
     const [x1,y1]=transforms[mode](r.a),[x2,y2]=transforms[mode](r.b);
     ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.globalAlpha=.28;ctx.lineWidth=Math.max(3,r.r*2*scale);ctx.lineCap='round';ctx.stroke();
     ctx.globalAlpha=.90;ctx.lineWidth=1.5;ctx.strokeStyle=color;ctx.stroke();ctx.globalAlpha=1;
    }
   }
   body(cur.runner,a,'#e8e8e8');body(cur.defender,b,'#43cffa');
   // Highlight the actually intersecting anatomical capsules, not an arbitrary radius.
   const hits=contacts.length?contacts:swept.length?swept[0].hits:[];
   for(const match of hits.slice(0,5))for(const [geom,region,side] of [[a,match.a,match.aSide],[b,match.b,match.bSide]]){
     const r=geom.regions.find(v=>v.region===region&&v.side===side);if(!r)continue;
     for(const project of [v=>[origin+v.x*scale,topY-v.y*scale],v=>[origin+v.x*scale,sideY-v.z*scale]]){
       const [x1,y1]=project(r.a),[x2,y2]=project(r.b);
       ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=Math.max(3,r.r*scale);ctx.strokeStyle='#f5cc66';ctx.globalAlpha=.8;ctx.stroke();ctx.globalAlpha=1;
     }
   }
   ctx.fillStyle='#f4cc75';ctx.font='12px monospace';ctx.fillText('Contact '+(active?'YES':'NO'),18,47);
   const contactHits=contacts.length?contacts:swept.length?swept[0].hits:[];
   const relSpeed=Math.hypot(cur.defender.vx-cur.runner.vx,cur.defender.vy-cur.runner.vy);
   const rawAngle=ChaosContactOutcomes.angle(cur.runner,cur.defender);
   const wrapScenario=el('contactPreset').value==='wrap'&&t>=.48;
   const assessment=ChaosContactOutcomes.classify(contactHits,{relativeSpeed:wrapScenario?Math.min(1.8,relSpeed):relSpeed,approachAngle:rawAngle,
     style:wrapScenario?'wrap':'none',grip:wrapScenario?1.2:0,engagementAge:wrapScenario?t-.07:0});
   const hitNames=contacts.length?contacts.slice(0,3).map(c=>`${c.b} ↔ ${c.a}`).join(', '):swept.length?swept[0].hits.slice(0,3).map(c=>`${c.b} ↔ ${c.a}`).join(', '):'none';
   el('contactReadout').textContent=`t=${t.toFixed(3)} s | ${cur.defender.h} in / ${cur.defender.w} lb defender | runner ${cur.runner.h} in / ${cur.runner.w} lb\n`+
    `Overlap at current frame: ${contacts.length} region pairs | Swept path: ${swept.length?'contact':'clear'}\n`+
    `Body regions: ${hitNames}\nContact classification: ${assessment.kind} | depth ${assessment.penetration.toFixed(3)}\n`+
    `Relative movement speed: ${Math.hypot(cur.defender.vx-cur.runner.vx,cur.defender.vy-cur.runner.vy).toFixed(1)} yd/s | Approach ${Math.round(Math.acos(Math.max(-1,Math.min(1,cur.defender.vx / Math.max(.01,Math.hypot(cur.defender.vx,cur.defender.vy)))))*180/Math.PI)}° | Physical outcome: LAB ONLY (live response tested separately)`;
   el('contactTimeline').value=time;el('contactTime').textContent=t.toFixed(3)+' s';
 };
 const stop=()=>{playing=false;if(frameId!==null)cancelAnimationFrame(frameId);frameId=null;};
 const play=()=>{if(playing){stop();return;}playing=true;let previous=null;const tick=stamp=>{
    if(!playing)return;if(previous===null)previous=stamp;
    time=Math.min(90,time+Math.min(4,Math.round((stamp-previous)/1000*60)||1));previous=stamp;draw();
    if(time>=90){stop();return;}frameId=requestAnimationFrame(tick);
   };frameId=requestAnimationFrame(tick);};
 el('contactPlay').onclick=play;
 el('contactLive').onclick=()=>{
    const api=window.GRIDIRON_DEBUG;
    if(!api?.debugContactEvidence){el('contactReadout').textContent='Live diagnostic API not available.';return;}
    const data=api.debugContactEvidence(),events=data.events.slice(-10);
    el('contactReadout').textContent='LIVE PLAY — latest anatomical entry events (read-only)\n'+
      (events.length?events.map(e=>`${e.time}s ${e.pair.join(' vs ')}: ${e.regionA} / ${e.regionB}, relative speed ${e.relativeSpeed} yd/s${e.swept?' [between frames]':''}`).join('\n'):'No anatomical contact entries recorded yet. Play a snap, then refresh.')+ '\n'+
      (data.lastAnatomyTackle?'Last legacy tackle: '+JSON.stringify(data.lastAnatomyTackle):'No legacy tackle recorded yet.');
 };
 el('contactStep').onclick=()=>{stop();time=Math.min(90,time+1);draw();};
 el('contactRestart').onclick=()=>{stop();time=0;draw();};
 el('contactTimeline').oninput=()=>{stop();time=Number(el('contactTimeline').value);draw();};
 el('contactPreset').onchange=()=>{stop();time=0;draw();};
 el('contactSize').onchange=draw;
 el('contactExport').onclick=()=>{
    const s=scenarios[el('contactPreset').value],dims=el('contactSize').value.split(',').map(Number),events=[];
    for(let i=0;i<=90;i++){
      const at=snapshot(i/60,s,...dims),prev=snapshot(Math.max(0,(i-1)/60),s,...dims);
      const hits=AnatomyHitboxes.sweptContacts(prev.runner,at.runner,prev.defender,at.defender,8);
      if(hits.length)events.push({frame:i,t:+(i/60).toFixed(3),first:hits[0].t,regions:hits[0].hits.slice(0,6)});
    }
    const payload={format:'chaos-collision-lab-v2',scenario:el('contactPreset').value,defender:{height:dims[0],weight:dims[1]},timeStep:1/60,events};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='CHAOS_collision_lab.json';link.click();URL.revokeObjectURL(url);
 };
 draw();
})();
