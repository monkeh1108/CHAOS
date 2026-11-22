
'use strict';
(()=>{
const $=id=>document.getElementById(id), canvas=$('field'), ctx=canvas.getContext('2d'), W=120,H=53.333,G=10.73,YARD_M=0.9144, MPS_TO_MPH=2.23694;
const specialTeams=window.GridironSpecialTeams;
if(!specialTeams)throw new Error('Special-teams module must load before the engine');
const BASE={
 QB:{name:'Drew Carter',pos:'QB',team:0,h:74,w:215,SPD:76,ACC:83,AGI:82,STR:61,TAK:30,BLO:32,CAT:30,JMP:72,THP:91,THA:88,AWR:89,TRK:44,COV:20},
 RB:{name:'Jalen Brooks',pos:'RB',team:0,h:71,w:211,SPD:92,ACC:94,AGI:90,STR:78,TAK:20,BLO:55,CAT:81,JMP:84,THP:10,THA:10,AWR:87,TRK:89,COV:20},
 WR1:{name:'Tyrell Reed',pos:'WR',team:0,h:76,w:201,SPD:95,ACC:92,AGI:88,STR:55,TAK:18,BLO:46,CAT:90,JMP:95,THP:10,THA:10,AWR:85,TRK:58,COV:20},
 WR2:{name:'Miles Ford',pos:'WR',team:0,h:70,w:180,SPD:97,ACC:96,AGI:96,STR:42,TAK:20,BLO:44,CAT:85,JMP:88,THP:10,THA:10,AWR:83,TRK:62,COV:20},
 WR3:{name:'Caleb Young',pos:'WR',team:0,h:71,w:192,SPD:91,ACC:94,AGI:93,STR:49,TAK:25,BLO:48,CAT:86,JMP:85,THP:10,THA:10,AWR:88,TRK:61,COV:20},
 TE:{name:'Noah Grant',pos:'TE',team:0,h:77,w:249,SPD:78,ACC:75,AGI:69,STR:87,TAK:30,BLO:85,CAT:83,JMP:80,THP:10,THA:10,AWR:81,TRK:82,COV:20},
 LT:{name:'Owen Price',pos:'LT',team:0,h:78,w:321,SPD:58,ACC:58,AGI:56,STR:93,TAK:50,BLO:92,CAT:15,JMP:42,THP:10,THA:10,AWR:88,TRK:60,COV:20},
 LG:{name:'Grant Murphy',pos:'LG',team:0,h:76,w:310,SPD:60,ACC:60,AGI:55,STR:91,TAK:45,BLO:90,CAT:15,JMP:40,THP:10,THA:10,AWR:87,TRK:58,COV:20},
 C:{name:'Cal Hayes',pos:'C',team:0,h:75,w:304,SPD:59,ACC:62,AGI:57,STR:90,TAK:48,BLO:91,CAT:15,JMP:42,THP:10,THA:10,AWR:90,TRK:62,COV:20},
 RT:{name:'Devon Tate',pos:'RT',team:0,h:78,w:315,SPD:56,ACC:59,AGI:54,STR:90,TAK:42,BLO:88,CAT:15,JMP:45,THP:10,THA:10,AWR:85,TRK:65,COV:20},
 RG:{name:'Isaac Lane',pos:'RG',team:0,h:76,w:320,SPD:56,ACC:59,AGI:54,STR:94,TAK:48,BLO:88,CAT:15,JMP:41,THP:10,THA:10,AWR:84,TRK:67,COV:20},
 EDGE1:{name:'Andre Knox',pos:'EDGE',team:1,h:76,w:260,SPD:85,ACC:86,AGI:74,STR:88,TAK:85,BLO:44,CAT:22,JMP:72,THP:10,THA:10,AWR:87,TRK:65,COV:45},
 DT:{name:'Vince Ross',pos:'DT',team:1,h:74,w:315,SPD:66,ACC:69,AGI:54,STR:94,TAK:87,BLO:30,CAT:20,JMP:59,THP:10,THA:10,AWR:84,TRK:60,COV:20},
 DT2:{name:'Aaron Hicks',pos:'DT',team:1,h:76,w:303,SPD:67,ACC:72,AGI:61,STR:90,TAK:83,BLO:32,CAT:17,JMP:58,THP:10,THA:10,AWR:85,TRK:64,COV:20},
 EDGE2:{name:'Khalil West',pos:'EDGE',team:1,h:75,w:253,SPD:83,ACC:84,AGI:74,STR:84,TAK:84,BLO:44,CAT:20,JMP:72,THP:10,THA:10,AWR:83,TRK:65,COV:40},
 MLB:{name:'Marcus Steele',pos:'MLB',team:1,h:74,w:242,SPD:86,ACC:83,AGI:76,STR:87,TAK:94,BLO:60,CAT:68,JMP:77,THP:10,THA:10,AWR:92,TRK:68,COV:77},
 OLB:{name:'Leon Bridges',pos:'OLB',team:1,h:75,w:233,SPD:87,ACC:86,AGI:81,STR:76,TAK:86,BLO:55,CAT:70,JMP:79,THP:10,THA:10,AWR:85,TRK:60,COV:80},
 CB1:{name:'Isaiah King',pos:'CB',team:1,h:72,w:190,SPD:94,ACC:92,AGI:94,STR:49,TAK:75,BLO:35,CAT:77,JMP:91,THP:10,THA:10,AWR:84,TRK:42,COV:92},
 CB2:{name:'Elijah Moon',pos:'CB',team:1,h:70,w:183,SPD:95,ACC:93,AGI:90,STR:46,TAK:71,BLO:35,CAT:74,JMP:89,THP:10,THA:10,AWR:82,TRK:40,COV:87},
 CB3:{name:'Jordan Mills',pos:'CB',team:1,h:71,w:191,SPD:91,ACC:91,AGI:92,STR:53,TAK:79,BLO:35,CAT:70,JMP:84,THP:10,THA:10,AWR:84,TRK:49,COV:85},
 FS:{name:'Chris Owens',pos:'FS',team:1,h:73,w:209,SPD:91,ACC:88,AGI:86,STR:65,TAK:86,BLO:35,CAT:83,JMP:88,THP:10,THA:10,AWR:91,TRK:54,COV:90},
 SS:{name:'David Cole',pos:'SS',team:1,h:73,w:217,SPD:87,ACC:86,AGI:83,STR:75,TAK:89,BLO:35,CAT:76,JMP:78,THP:10,THA:10,AWR:88,TRK:59,COV:82},
 TE2:{name:'Nolan Briggs',pos:'TE',team:0,h:78,w:263,SPD:75,ACC:72,AGI:65,STR:90,TAK:32,BLO:90,CAT:78,JMP:76,THP:10,THA:10,AWR:84,TRK:80,COV:25},
 FB:{name:'Cole Bennett',pos:'FB',team:0,h:73,w:244,SPD:75,ACC:76,AGI:65,STR:89,TAK:48,BLO:90,CAT:63,JMP:65,THP:10,THA:10,AWR:85,TRK:86,COV:24},
 WILL:{name:'Ethan Wells',pos:'OLB',team:1,h:73,w:228,SPD:87,ACC:84,AGI:82,STR:75,TAK:87,BLO:52,CAT:67,JMP:79,THP:10,THA:10,AWR:89,TRK:65,COV:81},
 SAM:{name:'Jamal Pierce',pos:'OLB',team:1,h:76,w:254,SPD:80,ACC:82,AGI:70,STR:90,TAK:86,BLO:53,CAT:54,JMP:72,THP:10,THA:10,AWR:82,TRK:69,COV:67},
 NT:{name:'Otis Reed',pos:'NT',team:1,h:75,w:334,SPD:56,ACC:59,AGI:48,STR:97,TAK:91,BLO:30,CAT:15,JMP:48,THP:10,THA:10,AWR:90,TRK:67,COV:18},
 DE3A:{name:'Darius Bell',pos:'DE',team:1,h:77,w:297,SPD:74,ACC:73,AGI:64,STR:94,TAK:88,BLO:35,CAT:16,JMP:60,THP:10,THA:10,AWR:85,TRK:66,COV:22},
 DE3B:{name:'Malik Roy',pos:'DE',team:1,h:77,w:294,SPD:75,ACC:75,AGI:63,STR:92,TAK:86,BLO:33,CAT:16,JMP:60,THP:10,THA:10,AWR:85,TRK:66,COV:22},
};
const custom=structuredClone(BASE);
// The kickoff/punt unit swaps its free safety for a specialist: an actual
// on-field kicker, rather than a ball launching from a nameless coordinate.
custom.K={name:'Evan Mercer',pos:'K',team:1,h:73,w:198,SPD:65,ACC:67,AGI:57,
 STR:52,TAK:44,BLO:31,CAT:22,JMP:53,THP:10,THA:10,AWR:85,TRK:32,COV:24,
 KPW:88,KAC:85,PUNT:87};
// Quarterback mental and pocket traits. Independent tunable ratings (1–99).
Object.assign(custom.QB,{VIS:87,DEC:81,TOR:80,BSK:73});
// Independent, editable contact-technique ratings. Derived defaults are only
// starting values; simulations always read the live attribute from each player.
for(const p of Object.values(custom)){
 p.HIT=clamp(.53*p.TAK+.29*p.STR+.18*p.AWR+(p.w-215)*.035,30,99);
 p.PMV=clamp(.39*p.STR+.30*p.AGI+.19*p.AWR+.12*p.TAK+(p.w-220)*.032,30,99);
 p.IBL=clamp(.53*p.BLO+.30*p.STR+.17*p.AWR+(p.w-210)*.026,30,99);
 // Independent recognition, pursuit technique and endurance ratings (live editable).
 p.PRC=clamp(.69*p.AWR+.18*p.TAK+.13*p.COV,30,99);
 p.PUR=clamp(.28*p.AWR+.27*p.SPD+.23*p.ACC+.22*p.TAK,30,99);
 p.STA=clamp(.35*p.ACC+.34*p.SPD+.31*p.AWR-(p.w>280?5:0),30,99);
}
// Independent, player-specific route and coverage technique profiles. These are
// fictional athletes, not unverified assertions about real NFL players.
const TECHNIQUES={
 WR1:{RTE:91,CUT:78,DBL:76,REL:77,HND:73},
 WR2:{RTE:87,CUT:97,DBL:87,REL:93,HND:88},
 WR3:{RTE:93,CUT:91,DBL:85,REL:89,HND:91},
 TE:{RTE:75,CUT:65,DBL:54,REL:68,HND:76},
 TE2:{RTE:68,CUT:57,DBL:45,REL:61,HND:74},
 FB:{RTE:56,CUT:56,DBL:38,REL:50,HND:48},
 CB1:{PRS:95,JAM:91,MIR:96,RCR:95,DIS:96}, CB2:{PRS:79,JAM:73,MIR:90,RCR:75,DIS:65},
 CB3:{PRS:89,JAM:84,MIR:82,RCR:82,DIS:77}, FS:{PRS:55,JAM:55,MIR:89,RCR:91,DIS:94},
 SS:{PRS:68,JAM:69,MIR:80,RCR:79,DIS:83}, OLB:{PRS:55,JAM:62,MIR:77,RCR:72,DIS:74},
 MLB:{PRS:51,JAM:65,MIR:72,RCR:71,DIS:78}
};
for(const [key,t] of Object.entries(TECHNIQUES))Object.assign(custom[key],t);
for(const p of Object.values(custom)){
 if(p.team===0){
  p.RTE??=clamp(p.AGI*.44+p.AWR*.36+p.ACC*.20,30,99);
  p.CUT??=clamp(p.AGI*.60+p.ACC*.27+p.AWR*.13,30,99);
  p.DBL??=clamp(p.RTE*.49+p.CUT*.31+p.AWR*.20,30,99);
  p.REL??=clamp(p.AGI*.42+p.STR*.28+p.AWR*.30,30,99);
  p.HND??=clamp(p.AGI*.25+p.STR*.43+p.AWR*.32,30,99);
 }else{
  p.PRS??=clamp(p.COV*.49+p.STR*.33+p.AWR*.18,30,99);
  p.JAM??=clamp(p.PRS*.54+p.STR*.31+p.AWR*.15,30,99);
  p.MIR??=clamp(p.COV*.48+p.AGI*.31+p.PRC*.21,30,99);
  // RCR reads route stems and breaks; DIS resists double-move fakes. These
  // are not the same skill as PRC, which controls *run* recognition.
  p.RCR??=clamp(p.COV*.43+p.AWR*.34+p.MIR*.23,30,99);
  p.DIS??=clamp(p.AWR*.42+p.RCR*.36+p.MIR*.22,30,99);
 }
}
// Distinct ball skills; editable independent ratings, not guaranteed-win abilities.
for(const p of Object.values(custom))if(p.team===0){
 p.JUK=clamp(p.AGI*.45+p.CUT*.33+p.AWR*.22,30,99);
 p.SFA=clamp(p.STR*.49+p.TRK*.33+p.AWR*.18,30,99);
}
const keys={}, players=[], off=[], def=[];
const fatigueBank=Object.create(null); // Between-snap stamina for each athlete
// Persistent physical engagements: nothing is resolved by a single collision roll.
const blockLinks=new Map(), tackleLinks=new Map();
// Per-physics-step anatomical evidence captured before the body solver separates pads.
const liveTackleContacts=new Map();
// Opt-in QA snapshot of the latest tackle eligibility pass.
let tackleDiagnostics=null, carrierCollisionDiagnostics=null;
let tackleCount=0, brokenTackleCount=0, blockShedCount=0, hitStickCount=0, impactBlockCount=0, powerMoveCount=0;
let pileState=null, pileStarts=0, pilePushYards=0, chainHits=0;
let windedHits=0, standUps=0;
let playTrace=[],lastTraceMeta=null,traceAccum=0,lastAnatomyTackle=null;
function traceSample(){
 if(!playTrace.length&&phase!=='live')return;
 const stick=stickInput();
 const sample={t:+playClock.toFixed(3),ballCarrier:ballCarrier?.key||null,phase,
  manual:manualDrive, stick:[+stick.x.toFixed(2),+stick.y.toFixed(2)],sprint:sprintHeld(),
  burst:+burstTime.toFixed(2), contacts:{tackles:tackleCount,hitSticks:hitStickCount,piles:pileStarts},
  p:players.map(p=>[p.key,+p.x.toFixed(2),+p.y.toFixed(2),+p.vx.toFixed(2),+p.vy.toFixed(2),
    +p.stam.toFixed(3),p.intent,p.sprinting?1:0,p.runRead?1:0,p.routeIdx,p.ground?.stage||''])};
 playTrace.push(sample);
 if(playTrace.length>1200)playTrace.shift();
}
function downloadTrace(){
 if(!playTrace.length||!lastTraceMeta)return;
 const payload={format:'gridiron-lab-play-trace-v1',samplingHz:10,
  description:'Own game simulation data only. No footage, files, or background screen capture.',
  ...lastTraceMeta,players:players.map(p=>({key:p.key,name:p.name,pos:p.pos,team:p.team,
   h:p.h,w:p.w,SPD:p.SPD,ACC:p.ACC,STA:p.STA,PUR:p.PUR,PRC:p.PRC,COV:p.COV,
   RTE:p.RTE,CUT:p.CUT,DBL:p.DBL,REL:p.REL,HND:p.HND,PRS:p.PRS,JAM:p.JAM,MIR:p.MIR,RCR:p.RCR,DIS:p.DIS})),
  samples:playTrace,events:logs};
 const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
 const uri=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=uri;a.download='gridiron_play_trace_'+lastTraceMeta.play+'_'+Date.now()+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),2500);
}

// Contact constraints run at 60Hz. This is deliberately a simple 2D rigid-body
// approximation, NOT animation-dependent collision outcomes or 3D ragdolls.
// Key is defender or blocker: each defender may hold one ball carrier, each blocker
// may engage one rusher. Contact data lives only for the current snap.

// Xbox One controllers use the W3C Standard Gamepad mapping in Chromium/Edge.
// Buttons: A=0, B=1, X=2, Y=3, LB=4, RB=5, LT=6, RT=7,
// View=8, Menu=9, L3=10, R3=11, D-pad up/down/left/right=12/13/14/15.
const XBOX={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,VIEW:8,MENU:9,UP:12,DOWN:13,LEFT:14,RIGHT:15};
let suppressManualUntilNeutral=false;
const padState={index:-1,id:'',connected:false,standard:false,lx:0,ly:0,rx:0,ry:0,lt:0,rt:0,previous:[],sampled:0};
// Three practice roles share one physics engine; controller mapping is contextual.
let controlMode='offense',selectedDefenderKey='MLB',selectedLinemanKey='LG';
let rightStickLatched=false,rightStickDirection='',xHoldStart=null,xDiveFired=false;

let paused=false, gamepadStatusLast='', sheetFocusIndex=0, sheetFocusKey='';
const plays=['inside','stretch','power','counter','sweep','slants','verticals','mesh','flood','sluggo','stick','dagger','smash'];
const RUNS=new Set(['inside','stretch','power','counter','sweep']);
const PASS_ICONS=['X','Y','A','B'];
let selectedFormation='spread', selectedFront='nickel', selectedCoverage='cover1';
const formationDesc={spread:'11 personnel · shotgun 2×2',trips:'11 personnel · trips right; isolated X',ace:'12 personnel · singleback Ace with two tight ends',iform:'21 personnel · I-formation with lead fullback',bunch:'11 personnel · shotgun bunch right, isolated X',pistol:'11 personnel · pistol with back directly behind QB'};
const defenseDesc={nickel:'4 DL, 2 LB, 5 DB',base43:'4 DL, 3 LB, 4 DB',base34:'3 DL, 4 LB, 4 DB (one OLB rushes)'};
const coverageDesc={cover1:'Man defenders trail assigned eligible receivers; a free safety protects the deep middle.',cover2:'Two safeties split deep halves. Corners handle flats; underneath defenders handle hooks.',cover3:'Two corners and a safety divide three deep thirds; underneath defenders split flats/hooks.',quarters:'Corners and safeties divide deep quarters. Underneath defenders guard shorter routes.'};
const pressureDesc={balanced:'Four-man rush with edge-lane integrity',contain:'Disciplined outside shoulders to prevent rollouts',spy:'Linebacker monitors QB and fills the escape lane',blitz:'Extra linebacker rush; fewer coverage defenders',stunt:'Inside rushers exchange lanes while edges contain'};
let pressurePreference='mix',selectedPressure='balanced',previousPressure=null,pressureRepeat=0;
let lowDiveContacts=0,lastLowDiveImpact=null,footContacts=0,lastFootContact=null;
let manualReceiver=false, coveragePreference='mix', previousMixedCoverage=null, mixRepeatCount=0, selectedPlay='inside', phase='presnap', score=0, down=1, togo=10, yard=30, first=40, totalClock=0, playClock=0, active=null, ball=null, ballCarrier=null, intended=null, passThrown=false, result='', playStart=30, camera=30, lastContact=0, msg='', logs=[], burstTime=0, burstCool=0, evadeTime=0, evadeCool=0, seq=0, flash=0, confetti=[], shake=0, offset=0, fieldSize={w:1,h:1}, joystick={x:0,y:0,active:false,pointer:null}, mobile=false, manualDrive=false, contactEnabled=true, pendingPass=null, moveCooldown=0, queuedCarrierMove=null;
const colors=['#d9f969','#7ddcf4'];
let cpuQB={nextRead:0,choice:null,reads:0,passes:0,lastScore:0,lastRisk:0};
let airSelection={offense:null,defense:null,defenderKey:null};
let currentMemoryPlay=null;
let lastAirResult=null,airCounters={rac:0,possession:0,aggressive:0,swat:0,interception:0,playReceiver:0,broken:0,drops:0,complete:0};
let visualMode='3d',renderer3d=null;
// V31: a game state wrapped around the existing physical scrimmage engine.
// x=10 is the offense's own goal line, x=110 is its opponent's goal line;
// on change of possession, field coordinates are mirrored (120 - x).
const PRESNAP_PLAY_SECONDS=20;
let scrimmagePlayCalled=false;
let firstHalfReceiver=0,secondHalfReceiver=1,tossStage='none',tossCall=null,tossWinner=null;
let tossPadPrevious=[];
let audibleOpen=false;
const AUDIBLE_BUTTONS=['A','B','X','Y'];
const OFFENSE_AUDIBLES={spread:['inside','flood','verticals','slants'],trips:['inside','flood','verticals','slants'],ace:['inside','flood','verticals','slants'],iform:['inside','flood','verticals','slants'],bunch:['inside','flood','verticals','slants'],pistol:['inside','flood','verticals','slants']};
const QUARTER_DURATION_SECONDS=60; // temporary quick-game setting; later exposed in match options
let cpuSnapAt=14;
let protectionRead=null;
let gameFlowNote='Ready';
let penaltyCount=0;
let possession=0,teamPoints=[0,0],quarter=1,quarterSeconds=QUARTER_DURATION_SECONDS,playSeconds=25,
    clockRunning=false,gameStarted=false,matchOver=false,timeOuts=[3,3],
    specialState=null,postWhistle=null,tryState=null,playbookOpen=false,
    lastWhistleType='',returnCall='middle',returnFairCatch=false,twoMinuteNoted=false,twoMinutePending=false;
const TEAM_NAMES=['HOME','AWAY'];
const TEAM_STYLES=[
 {name:'HOME',identity:'Spread & Tempo',pool:['mesh','slants','stick','verticals','inside','stretch','flood','dagger','smash']},
 {name:'AWAY',identity:'Multiple & Power',pool:['inside','power','counter','stretch','slants','mesh','smash','verticals','flood','stick']}
];
function kickRatings(){return custom.K;}
function homeTeamControl(){
 // Ordinary games keep HOME under player control. The standard 0/1 teams
 // map to offensive/defensive *roles*, which reverse when possession flips.
 const role=possession===0?'offense':'defense';
 if(controlMode!==role)selectControlMode(role);
}
function chooseCPUPlay(){
 const style=TEAM_STYLES[possession];const distance=Math.max(1,togo);
 const chooseRun=down===1?rand()<.47:down===2?rand()<.39:rand()<.21;
 const pool=style.pool.filter(p=>chooseRun?RUNS.has(p):!RUNS.has(p));
 if(pool.length)selectedPlay=pool[Math.floor(rand()*pool.length)];
 selectedFormation=RUNS.has(selectedPlay)?(rand()<.50?'iform':'ace'):(rand()<.43?'trips':rand()<.58?'spread':'bunch');
 document.querySelectorAll('.play').forEach(b=>b.classList.toggle('selected',b.dataset.play===selectedPlay));
 $('formation').value=selectedFormation;
 return selectedPlay;
} 
function clockText(seconds){const t=Math.max(0,Math.ceil(seconds));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
function spotText(y=yard){return y<60?'OWN '+Math.round(y-10):'OPP '+Math.round(110-y);}
function setDriveSpot(team,x){possession=team;yard=clamp(x,11,109);down=1;togo=Math.min(10,110-yard);first=yard+togo;if(gameStarted)homeTeamControl();}
function newPossession(team,oppositeSpot){setDriveSpot(team,120-oppositeSpot);log(TEAM_NAMES[team]+' possession at '+spotText());}
function setResultUI(heading,detail,action='NEXT PLAY'){
 result=heading;message('<strong>'+heading+'.</strong> '+detail);
 $('resultText').textContent=heading;$('resultDetail').textContent=detail;
 $('overlay').classList.add('visible');$('targets').style.display='none';$('receiverPins').style.display='none';
 $('snap').disabled=false;$('snap').textContent=action;log(heading+' · '+detail);
}
function audibleChoices(){
 if(controlMode==='defense')return [{label:'BLITZ',coverage:'cover1',pressure:'blitz'},{label:'COVER 3',coverage:'cover3',pressure:'balanced'},{label:'COVER 2',coverage:'cover2',pressure:'balanced'},{label:'MAN COVERAGE',coverage:'cover1',pressure:'balanced'}];
 const keys=OFFENSE_AUDIBLES[selectedFormation]||OFFENSE_AUDIBLES.spread;
 return keys.map((key,i)=>({label:['RUN','PASS CONCEPT*','DEEP PASS','QUICK PASS'][i],play:key}));
}
function renderAudibles(){
 const menu=$('audibleMenu');if(!menu)return;
 menu.classList.toggle('visible',audibleOpen);menu.setAttribute('aria-hidden',String(!audibleOpen));
 if(!audibleOpen)return;
 $('audibleHeading').textContent=(controlMode==='defense'?'DEFENSIVE':'OFFENSIVE')+' AUDIBLES · '+(controlMode==='defense'?selectedFront:selectedFormation).toUpperCase();
 $('audibleOptions').innerHTML=audibleChoices().map((o,i)=>`<button type="button" data-audible="${i}"><b>${AUDIBLE_BUTTONS[i]} · ${o.label}</b><small>${o.play||o.coverage+' / '+o.pressure}</small></button>`).join('');
}
function closeAudibles(){audibleOpen=false;renderAudibles();}
function openAudibles(){if(phase!=='presnap'||specialState||(tryState&&tryState.mode!=='two')||playbookOpen||!scrimmagePlayCalled)return false;audibleOpen=!audibleOpen;renderAudibles();return true;}
function applyAudible(index){
 if(!audibleOpen||phase!=='presnap'||!scrimmagePlayCalled)return false;
 const option=audibleChoices()[index];if(!option)return false;
 const remaining=playSeconds;
 if(controlMode==='defense'){coveragePreference=option.coverage;pressurePreference=option.pressure;$('coverage').value=coveragePreference;$('pressure').value=pressurePreference;setup();}
 else {selectedPlay=option.play;document.querySelectorAll('.play').forEach(b=>b.classList.toggle('selected',b.dataset.play===selectedPlay));setup();}
 playSeconds=remaining;scrimmagePlayCalled=true;closeAudibles();hud();return true;
}
function showPlaybook(){
 closeAudibles();
 if(phase!=='presnap'||matchOver)return;
 const box=$('callSheet'),list=$('callSheetPlays');
 const heading=$('callSheetHeading'),sub=$('callSheetSub');
 $('sheetToolbar').style.display=!specialState&&!tryState&&possession===0?'flex':'none';
 $('sheetFormation').value=selectedFormation;
 if(isFreeKick(specialState)){
  heading.textContent=(specialState.kind==='safety-kick'?'SAFETY FREE KICK · ':'')+(possession===0?'RETURN KICKOFF':'KICKOFF COVERAGE')+' · '+TEAM_NAMES[specialState.kickingTeam]+' kicking';
  sub.textContent='Kicker determines landing location · '+TEAM_NAMES[possession]+' receiving · '+TEAM_STYLES[possession].identity;
  list.innerHTML=possession===0?['left','middle','right'].map(v=>`<button type="button" class="sheetPick ${returnCall===v?'active':''}" data-returncall="${v}"><b>RETURN ${v.toUpperCase()}</b><small>Blocking wedge attacks the ${v} return lane · kick location is not selectable</small></button>`).join(''):
   '<button type="button" class="sheetPick special active" data-kickready="1"><b>KICKOFF COVERAGE</b><small>On-field kicker chooses spot from KPW / KAC · pursue the returner after landing</small></button>';
 }else if(tryState&&!tryState.mode){
  heading.textContent='AFTER TOUCHDOWN · '+TEAM_NAMES[possession];
  sub.textContent='Touchdown = 6 · choose a 33-yard extra-point kick or a 2-point play from the 2';
  list.innerHTML='<button type="button" class="sheetPick" data-special="pat"><b>EXTRA POINT</b><small>Kick · 1 point</small></button><button type="button" class="sheetPick" data-special="two"><b>GO FOR TWO</b><small>Run or pass · 2 points</small></button>';
 }else{
  heading.textContent=(possession===0?'CALL A PLAY':'CALL YOUR DEFENSE')+' · '+TEAM_NAMES[possession];
  sub.textContent=`${TEAM_STYLES[possession].identity} · Q${quarter} ${clockText(quarterSeconds)} · ${down}${['','st','nd','rd','th'][down]||'th'} & ${Math.max(1,Math.ceil(togo))} · ${spotText()} · ${clockText(playSeconds)} play clock`;
  if(possession===1){
   sub.textContent+=' · DEFENSE: '+defenseDesc[selectedFront]+' · LB/RB CHANGE FRONT';
   list.innerHTML='<div class="callSheetGroup">COVERAGE</div>'+['mix','cover1','cover2','cover3','quarters'].map(v=>`<button type="button" class="sheetPick ${coveragePreference===v?'active':''}" data-defense-coverage="${v}"><b>${v==='mix'?'MIX COVERAGES':v.toUpperCase()}</b><small>${v==='mix'?'Adaptive mix of coverage calls':coverageDesc[v]}</small></button>`).join('')+
    '<div class="callSheetGroup">PRESSURE</div>'+['mix','balanced','contain','spy','blitz','stunt'].map(v=>`<button type="button" class="sheetPick ${pressurePreference===v?'active':''}" data-defense-pressure="${v}"><b>${v.toUpperCase()}</b><small>${v==='mix'?'Vary rush lanes and calls':pressureDesc[v]}</small></button>`).join('');
  }else list.innerHTML=['RUN','PASS'].map(group=>'<div class="callSheetGroup">'+group+' CONCEPTS</div>'+[...document.querySelectorAll('.play[data-play]')].filter(btn=>group==='RUN'?RUNS.has(btn.dataset.play):!RUNS.has(btn.dataset.play)).map(btn=>`<button type="button" class="sheetPick ${selectedPlay===btn.dataset.play?'active':''}" data-sheetplay="${btn.dataset.play}"><b>${btn.querySelector('.name')?.textContent||btn.dataset.play}</b><small>${btn.querySelector('.ptype')?.textContent||''}</small></button>`).join('')).join('') +
   (down===4?`<button type="button" class="sheetPick special" data-special="punt"><b>PUNT</b><small>Fourth-down kick / live return</small></button><button type="button" class="sheetPick special" data-special="fg"><b>FIELD GOAL</b><small>${Math.round(110-yard+17)}-yard attempt · 3 points</small></button>`:'');
 }
 box.classList.add('visible');playbookOpen=true;
 focusSheetItem(sheetFocusIndex);
}
// Highlighting and invocation are independent of formation/coverage code.
function sheetOptions(){return [...$('callSheetPlays').querySelectorAll('button.sheetPick')];}
function focusSheetItem(index){
 const items=sheetOptions();if(!items.length){sheetFocusIndex=0;return false}
 if(sheetFocusKey){const saved=items.findIndex(el=>sheetFocusKey===el.dataset.sheetplay||sheetFocusKey===el.dataset.returncall||sheetFocusKey===el.dataset.defenseCoverage||sheetFocusKey===el.dataset.defensePressure);if(saved>=0)index=saved;}
 sheetFocusIndex=Math.max(0,Math.min(items.length-1,index));
 items.forEach((el,i)=>{el.classList.toggle('padFocus',i===sheetFocusIndex);el.setAttribute('aria-current',i===sheetFocusIndex?'true':'false')});
 items[sheetFocusIndex].scrollIntoView?.({block:'nearest',inline:'nearest'});
 return true;
}
function moveSheetFocus(direction){
 const length=sheetOptions().length,cols=window.innerWidth<=620?2:3;
 sheetFocusKey='';return focusSheetItem(PlaybookNavigation.move(sheetFocusIndex,length,cols,direction));
}
function chooseSheetFocused(){
 const selected=sheetOptions()[sheetFocusIndex];if(!selected)return false;
 if(selected.classList.contains('active')&&isFreeKick(specialState)){snap();return true;}
 sheetFocusKey=selected.dataset.sheetplay||selected.dataset.returncall||selected.dataset.defenseCoverage||selected.dataset.defensePressure||'';
 selected.click();return true;
}
function cycleSheetFormation(direction){
 if(phase!=='presnap'||specialState||tryState)return false;
 if(controlMode==='defense'){
  selectedFront=PlaybookNavigation.cycle(['nickel','base43','base34'],selectedFront,direction);
  $('front').value=selectedFront;
 }else{
  selectedFormation=PlaybookNavigation.cycle(['spread','trips','ace','iform','bunch','pistol'],selectedFormation,direction);
  $('formation').value=selectedFormation;$('sheetFormation').value=selectedFormation;
 }
 const remaining=playSeconds,wasCalled=scrimmagePlayCalled;setup();playSeconds=remaining;scrimmagePlayCalled=wasCalled;showPlaybook();return true;
}
function hidePlaybook(){playbookOpen=false;$('callSheet').classList.remove('visible');}
function tossScreen(title,description,buttons){
 const root=$('coinToss');root.hidden=false;
 $('coinTossTitle').textContent=title;$('coinTossText').textContent=description;
 const options=$('coinTossOptions');options.replaceChildren();
 buttons.forEach(({label,choose})=>{const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=label;button.addEventListener('click',choose);options.appendChild(button);});
 options.querySelector('button')?.focus({preventScroll:true});
}
function startCoinToss(){
 tossPadPrevious=[];tossStage='call';tossCall=null;tossWinner=null;
 tossScreen('OPENING COIN TOSS','HOME calls the coin. Choose heads or tails.',[
  {label:'HEADS',choose:()=>flipCoin('heads')},{label:'TAILS',choose:()=>flipCoin('tails')}]);
}
function flipCoin(call){
 if(tossStage!=='call')return;
 tossCall=call;const result=Math.random()<.5?'heads':'tails';
 tossWinner=result===call?0:1;tossStage='decision';
 if(tossWinner===0){
  tossScreen('COIN: '+result.toUpperCase()+' · HOME WINS','Choose to receive, kick, or defer the choice to the second half.',[
   {label:'RECEIVE',choose:()=>resolveToss('receive')},
   {label:'KICK',choose:()=>resolveToss('kick')},
   {label:'DEFER',choose:()=>resolveToss('defer')}]);
 }else{
  // CPU decision uses no hidden gameplay info. It generally defers.
  const choice=Math.random()<.7?'defer':'receive';
  tossScreen('COIN: '+result.toUpperCase()+' · AWAY WINS',
   'AWAY selects '+choice.toUpperCase()+'. The opening kickoff is determined.',[
   {label:'CONTINUE',choose:()=>resolveToss(choice)}]);
 }
}
function resolveToss(choice){
 if(tossStage!=='decision')return;
 const winner=tossWinner;
 // Defer = opponent chooses first half; winner gets second-half choice.
 // For this version the non-deferring team elects to receive.
 firstHalfReceiver=choice==='defer'?1-winner:choice==='receive'?winner:1-winner;
 // An outright election to kick differs from deferring: the other team
 // controls the second-half choice and would normally elect to receive.
 secondHalfReceiver=choice==='kick'?1-winner:1-firstHalfReceiver;
 tossStage='complete';$('coinToss').hidden=true;
 beginOpeningKickoff(firstHalfReceiver);
}
function beginOpeningKickoff(receiver){
 setDriveSpot(receiver,20);returnCall='middle';setupKickoff(receiver);
 log('COIN TOSS · '+TEAM_NAMES[tossWinner]+' won · HOME called '+tossCall+' · '+TEAM_NAMES[receiver]+' receives');
}
function startNewMatch(){
 gameFlowNote='Coin toss';penaltyCount=0;DefensiveMemory.reset();currentMemoryPlay=null;
 for(const k of Object.keys(fatigueBank))delete fatigueBank[k];
 teamPoints=[0,0];possession=0;score=0;quarter=1;quarterSeconds=QUARTER_DURATION_SECONDS;playSeconds=25;
 clockRunning=false;gameStarted=true;matchOver=false;timeOuts=[3,3];twoMinuteNoted=false;twoMinutePending=false;
 tryState=null;specialState=null;postWhistle=null;lastWhistleType='';
 logs=[];$('events').innerHTML='';seed((Math.floor(Math.random()*4294967296))>>>0);
 returnCall='middle';startCoinToss();
}
function setupKickoff(receivingTeam,kind='kickoff'){
 // A safety restarts with a free kick from the conceding team's own 20.
 // Unlike a fourth-down punt it uses the modern free-kick return formation.
 setDriveSpot(receivingTeam,20);returnFairCatch=false;
 specialState={kind,kickingTeam:1-receivingTeam,receivingTeam,landingX:20,elapsed:0,
  airtime:2.2,returning:false,started:false,returnCall,releaseReady:false};
 tryState=null;clockRunning=false;playSeconds=25;
 setup();organizeReturnUnit();$('snap').textContent='KICK OFF';
 message('<strong>'+(kind==='safety-kick'?'SAFETY FREE KICK':'KICKOFF')+'.</strong> '+(possession===0?'Call RETURN LEFT, MIDDLE or RIGHT.':'Prepare coverage.')+' Kicker picks the actual placement.');showPlaybook();hud();
}
function isFreeKick(k){return k?.kind==='kickoff'||k?.kind==='safety-kick';}
function kickLineX(k){return k?.kind==='safety-kick'?90:75;}
function organizeReturnUnit(){
 if(!specialState)return;
 const k=specialState,ret=P('RB'),back=P('WR2');
 const lane=specialTeams.returnLaneY(returnCall);
 k.returnCall=returnCall;k.returnLaneY=lane;
 // The 2026 return setup has at least nine receivers from own 30–35,
 // and up to two deep returners. Five are on the 35, four on the 30.
 const blockers=off.filter(o=>o!==ret&&o!==back);
 blockers.forEach((p,i)=>{
  p.x=isFreeKick(k)?(i<5?45:40):clamp(k.landingX+13,27,64);
  p.y=i<5?5.0+i*10.75:10.1+(i-5)*11.4;
  p.vx=0;p.vy=0;p.intent='kick-return-align';p.intentTarget='return-lane';
  p.returnSlot=i;p.returnAssignment=null;
 });
 // Two deep returners start in different lanes, rather than stacked vertically.
 // They are deliberately wider than the exact hash marks so either sideline
 // can be fielded without a supernatural catch-up adjustment.
 ret.x=isFreeKick(k)?21:clamp(k.landingX+3,12,42);ret.y=H*.32;
 ret.vx=0;ret.vy=0;ret.intent='await-kick';
 back.x=isFreeKick(k)?21:clamp(k.landingX+3,12,42);back.y=H*.68;
 back.vx=0;back.vy=0;back.intent='await-kick';
 k.returnerKey=ret.key;k.backupReturnerKey=back.key;k.landed=false;k.groundElapsed=0;
 // Use an actual 11th coverage athlete as kicker instead of hiding the kick.
 const fs=P('FS');if(fs){players.splice(players.indexOf(fs),1);def.splice(def.indexOf(fs),1);}
 let kicker=P('K');if(!kicker)kicker=create('K',isFreeKick(k)?kickLineX(k):clamp(120-k.puntFrom+7,35,108),26.65);
 kicker.intent='kick-align';kicker.intentTarget='ball';kicker.vx=0;kicker.vy=0;
 def.filter(d=>d!==kicker).forEach((d,i)=>{
  // In a dynamic kickoff the other ten covering athletes start at the
  // receiving team's 40, and cannot release until the landing event.
  d.x=k.kind==='punt'?clamp(120-k.puntFrom+1,34,107):50;
  d.y=3.2+i*5.2;d.vx=0;d.vy=0;d.intent='kick-coverage';d.intentTarget='returner';
  if(isFreeKick(k)){
   d.kickLaneY=d.y;
   d.kickCoverageRole=i===0?'force-left':i===def.length-2?'force-right':'coverage';
  }
  d.returnBypassBlocker=null;d.returnBypassUntil=0;
 });
 ballCarrier=null;active=controlMode==='defense'?P(selectedDefenderKey):ret;ball=null;
 $('receiverPins').style.display='none';$('targets').style.display='none';
}

function chooseSpecial(kind){
 if(phase!=='presnap'||matchOver)return false;
 if(kind==='pat'&&tryState){
  const chance=.94+(kickRatings().KAC-80)*.002;const good=rand()<clamp(chance,.65,.99);
  if(good){teamPoints[possession]+=1;score=teamPoints[possession];}
  clockRunning=false;specialState=null;tryState=null;phase='dead';postWhistle='kickoff';
  setResultUI(good?'PAT GOOD':'PAT NO GOOD',good?'Extra point +1 · 33-yard attempt':'Extra point missed · no points','KICKOFF');hidePlaybook();hud();return true;
 }
 if(kind==='two'&&tryState){
  tryState.mode='two';specialState=null;yard=108;down=1;togo=2;first=110;
  setup();playSeconds=25;showPlaybook();return true;
 }
 if(kind==='punt'&&down===4&&!tryState){return beginPunt();}
 if(kind==='fg'&&down===4&&!tryState){
  const distance=Math.round(110-yard+17);
  const pct=clamp(.97-(distance-32)*.017+(kickRatings().KAC-85)*.003,.06,.985);
  const good=distance<=Math.round(42+(kickRatings().KPW-70)*.9)&&rand()<pct;
  const kickingTeam=possession;
  if(good){teamPoints[kickingTeam]+=3;score=teamPoints[kickingTeam];postWhistle='kickoff';}
  else{const spot=Math.max(30,120-(yard-7));setDriveSpot(1-kickingTeam,spot);postWhistle='scrimmage';}
  phase='dead';clockRunning=false;
  setResultUI(good?'FIELD GOAL GOOD':'FIELD GOAL NO GOOD',distance+'-yard attempt · '+(good?'+3 points':'possession changes'),good?'KICKOFF':'NEXT DRIVE');hidePlaybook();hud();return true;
 }
 return false;
}
function beginPunt(){
 const oldSpot=yard,oldTeam=possession;
 const distance=clamp(35+kickRatings().PUNT*.14+(rand()-.5)*15,32,58);
 const landingOriginal=oldSpot+distance;
 const receives=1-oldTeam;
 const landing=120-Math.min(110,landingOriginal);
 setDriveSpot(receives,Math.max(11,landing));
 returnFairCatch=false;specialState={kind:'punt',kickingTeam:oldTeam,receivingTeam:receives,landingX:landing,
  elapsed:0,airtime:clamp(2.1+distance*.035,2.2,4.0),returning:false,started:false,puntFrom:oldSpot,netDistance:distance};
 setup();organizeReturnUnit();kickSpecial();return true;
}
function kickerLanding(k){
 return specialTeams.kickerLanding({kind:k.kind,previousLandingX:k.landingX,
  accuracy:kickRatings().KAC,power:kickRatings().KPW,random:rand,fieldHeight:H});
}
function kickSpecial(){
 if(!specialState||phase!=='presnap')return false;
 hidePlaybook();phase='live';specialState.elapsed=0;specialState.started=true;clockRunning=specialState.kind==='punt';
 const k=specialState,landing=kickerLanding(k);
 k.landingX=landing.x;k.targetY=landing.y;
 const sourceX=isFreeKick(k)?kickLineX(k):clamp(120-k.puntFrom+7,landing.x+12,109);
 const specialist=P('K');if(specialist){specialist.x=sourceX;specialist.y=26.65;specialist.action={kind:'kick',time:.55,age:0};specialist.intent='kick-foot';}
 const sourceY=26.65;
 ball={x:sourceX,y:sourceY,z:1.0,vx:(landing.x-sourceX)/k.airtime,vy:(landing.y-sourceY)/k.airtime,vz:0,
  flight:k.airtime,t:0,aimX:landing.x,aimY:landing.y,flying:true};
// Select the athlete with the more feasible arrival time, not a preset RB.
 // Kick-flight anticipation is allowed; possession is NOT awarded remotely.
 const deep=[P('RB'),P('WR2')].filter(Boolean);
 const tArrival=p=>dist(p,landing)/Math.max(3,maxSpeed(p))+(1-p.ACC/100)*.20;
 deep.sort((a,b)=>tArrival(a)-tArrival(b));
 k.returnerKey=deep[0]?.key||'RB';k.backupReturnerKey=deep[1]?.key||'WR2';
 const ret=P(k.returnerKey);if(ret)ret.intent='track-kick';
 $('snap').disabled=true;$('receiverPins').style.display='none';$('targets').style.display='none';
 message('<strong>'+k.kind.toUpperCase()+'!</strong> '+specialist?.name+' kicks toward the receiving team.');
 log(k.kind.toUpperCase()+' · '+TEAM_NAMES[k.kickingTeam]+' kicker '+specialist?.name+' · aiming near '+Math.round(k.landingX-10)+' yard line');hud();return true;
}
function finishReturn(type,x,detail){
 if(phase!=='live'||!specialState)return;
 const k=specialState;
 // A returner who fields a free kick in his own end zone may choose to
 // return it or down it. A tackle or voluntary give-up before he advances
 // out is a touchback, not a ball spotted at the one-yard line.
 if(isFreeKick(k)&&k.returnCaughtInEndzone&&!k.advancedOutOfEndzone&&x<=10.05&&type!=='touchdown'){
  type='touchback';x=k.returnTouchbackSpot||45;
  detail='Kick fielded and downed in the end zone · touchback at own '+Math.round(x-10);
 }
 // Persist return exertion so a long kickoff cannot be followed by a magically fresh runner.
 for(const p of players){
  const recovery=(p===ballCarrier?.015:.345)*(0.85+p.STA/500);
  fatigueBank[p.key]=clamp(p.stam+recovery,.045,1);
 }
 ball=null;const mark=clamp(x,10,110);
 const touchdown=type==='touchdown'||mark>=109.8;
 if(touchdown){teamPoints[possession]+=6;score=teamPoints[possession];tryState={team:possession};postWhistle='try';}
 else{setDriveSpot(possession,clamp(mark,11,109));postWhistle='scrimmage';}
 gameFlowNote=touchdown?'Return touchdown':type==='touchback'?'Touchback — receiving team ball':'Special-teams play complete';
 specialState=null;phase='dead';clockRunning=false;ballCarrier=null;
 for(const p of players){p.vx=0;p.vy=0;p.intent='whistle';}
 const name=touchdown?'RETURN TOUCHDOWN':type==='touchback'?'TOUCHBACK':type==='fair'?'FAIR CATCH':type==='out'?'RETURN OUT OF BOUNDS':'RETURN TACKLED';
 setResultUI(name,detail||`${TEAM_NAMES[possession]} starts at ${spotText()}`,touchdown?'CHOOSE TRY':'CALL OFFENSE');hud();
}
function backupReturnerLeadBlock(o,ret,dt,claimed){
 const k=specialState;
 // A backup returner becomes a lead escort once possession is established.
 // Only contest threats ahead of the runner; never sprint behind him to
 // chase a technically closer but irrelevant coverage player.
 const forwardThreats=def.filter(d=>!d.ground&&d.key!=='K'&&
  d.x>=ret.x+0.45&&d.x<=ret.x+17&&Math.abs(d.y-ret.y)<13&&
  !claimed.has(d.key)&&d.beatenUntil<=playClock);
 const threat=forwardThreats.sort((a,b)=>
  (Math.abs(a.x-(ret.x+5))+Math.abs(a.y-ret.y)*.50)-
  (Math.abs(b.x-(ret.x+5))+Math.abs(b.y-ret.y)*.50))[0];
 const leadX=clamp(ret.x+4.2,ret.x+2.5,109);
 const leadY=clamp(ret.y*.68+k.returnLaneY*.32,3,H-3);
 // The non-catching deep returner may be BEHIND the carrier after a short
 // kick. First run a shallow diagonal catch-up lane, then become an escort.
 // Don't seek an unreachable defender upfield while the carrier runs away.
 const trailing=o.x<ret.x-2.2;
 if(trailing){
  const side=o.y<=ret.y?-1:1;
  const catchY=clamp(ret.y+side*2.4,3,H-3);
  o.intent='return-escort-catchup';o.intentTarget=ret.key;
  steer(o,clamp(ret.x+2.4,ret.x+1.8,109)-o.x,catchY-o.y,dt,1.08);
  return;
 }
 if(!threat){o.intent='lead-return-escort';o.intentTarget=ret.key;
  steer(o,leadX-o.x,leadY-o.y,dt,1.08);return;}
 const projectedX=Math.max(ret.x+1.3,threat.x+threat.vx*.20);
 const projectedY=threat.y+threat.vy*.20;
 o.intent='lead-return-block';o.intentTarget=threat.key;claimed.add(threat.key);
 steer(o,projectedX-o.x,projectedY-o.y,dt,1.06);
 if(dist(o,threat)<2.15)blockBattle(o,threat,dt);
}
function returnBlockerAI(o,ret,dt,claimed){
 const k=specialState;
 // React to the kicker's actual landing side, then gradually set the
 // wedge toward the chosen LEFT / MIDDLE / RIGHT return lane.
 const progress=clamp((ret.x-k.landingX)/20,0,1);
 const preferred=k.targetY*(.75-.68*progress)+k.returnLaneY*(.25+.68*progress);
 const locked=blockLinks.get(o.key);
 const kept=locked?P(locked.defender):null;
 const picked=specialTeams.chooseReturnThreat({blocker:o,playTime:playClock,
  defenders:def,carrier:ret,claimed,returnLaneY:preferred,speedOf:speed});
 const best=kept&&!kept.ground&&dist(o,kept)<2.5?kept:picked;
 const wedgeY=clamp(preferred+(o.returnSlot-4)*1.7,4,H-4);
 const wedgeX=clamp(ret.x+clamp(3+(o.returnSlot%3)*1.2,3,6),ret.x+2,ret.x+9);
 if(!best){o.intent='return-lane';o.intentTarget='wedge';steer(o,wedgeX-o.x,wedgeY-o.y,dt,.92);return;}
 claimed.add(best.key);
 o.intent='return-block';o.intentTarget=best.key;
 if(speed(o)<.25&&dist(o,ret)>10){o.returnStall=(o.returnStall||0)+dt;}else o.returnStall=0;
 if(o.returnStall>.9){o.returnStall=0;o.beatenTarget=best.key;o.beatenUntil=playClock+.75;steer(o,ret.x+4-o.x,k.returnLaneY-o.y,dt,.96);return;}
 // Meet the threat on the approach to the returner, rather than chasing
 // its current position from behind. Protect the returner's actual lane.
 const lead=clamp(dist(o,best)/Math.max(3,speed(o)+speed(best)),.12,.58);
 const projectedX=best.x+best.vx*lead,projectedY=best.y+best.vy*lead;
 const targetX=projectedX+clamp((ret.x-projectedX)*.10,-.4,.8);
 const laneBlend=clamp((dist(best,ret)-6)/16,0,.26);
 const targetY=projectedY*(1-laneBlend)+preferred*laneBlend;
 steer(o,targetX-o.x,targetY-o.y,dt,1.06);
 if(dist(o,best)<2.15)blockBattle(o,best,dt);
}
// Avoid escaping toward a sideline: a player pinned against the left/right
// boundary cannot run around a blocker on the outside of the field.
function returnEscapeSide(d,blocker){
 if(d.y<7)return 1;
 if(d.y>H-7)return -1;
 return blocker?(d.y<=blocker.y?-1:1):(d.y<H/2?1:-1);
}
function returnBypassTarget(d,blocker,aimY){
 const side=d.returnBypassSide||1;
 return clamp(blocker?blocker.y+side*3.4:aimY+side*3.4,2.5,H-2.5);
}
function kickoffLaneAim(d,x,y){
 if(d.kickLaneY===undefined)return y;
 // Run in a shifted lane until close enough in depth to rally. Keeping the
 // offset relative to the coverage line preserves width on a lateral return.
 const lane=clamp(d.kickLaneY+(y-H/2)*.38,1.5,H-1.5);
 const hold=clamp((d.x-x-12)/12,0,1)*clamp(Math.abs(y-lane)/12,0,1);
 return y+(lane-y)*hold;
}
function coverReturnAI(d,ret,dt){
 const aim=pursuitAim(d,ret);
 // Close coverage already includes a finite observed-reaction delay in pursuitAim.
 // Do not override it with instantaneous carrier tracking here.
 // A coverage player can be jammed against a return blocker even after the
 // block resolver claims to have shed him. Measure actual displacement over
 // time, not just whether his AI is repeatedly issuing a run instruction.
 if(!d.returnTrack)d.returnTrack={x:d.x,y:d.y,age:0,still:0};
 const track=d.returnTrack;
 track.age+=dt;
 if(track.age>=.30){
  const travelled=Math.hypot(d.x-track.x,d.y-track.y);
  track.still=travelled<.30&&aim.sep>7&&d.ground===null?track.still+track.age:Math.max(0,track.still-track.age*2);
  track.x=d.x;track.y=d.y;track.age=0;
 }
 if(track.still>.90&&d.returnBypassUntil<=playClock){
  // Release stale physical engagements and go around the nearest blocker.
  const link=[...blockLinks].find(([key,e])=>e.defender===d.key);
  const blocker=link?P(link[1].blocker):off.filter(o=>o!==ret).sort((a,b)=>dist(a,d)-dist(b,d))[0];
  if(link)blockLinks.delete(link[0]);
  d.blocked=0;d.shedCooldown=Math.max(d.shedCooldown,.40);
  d.returnBypassBlocker=blocker?.key||null;
  d.returnBypassSide=returnEscapeSide(d,blocker);
  d.returnBypassUntil=playClock+1.15;
  d.vy+=d.returnBypassSide*1.2;
  track.still=0;
 }
 let targetY=kickoffLaneAim(d,ret.x,aim.y);
 if(d.returnBypassUntil>playClock){
  targetY=returnBypassTarget(d,P(d.returnBypassBlocker),aim.y);
  d.intent='return-bypass';
 }else d.intent='kick-cover';
 d.intentTarget=ret.key;
 d.pursuitPoint={...aim,y:targetY};
 steer(d,aim.x-d.x,targetY-d.y,dt,aim.sep<4?1.18:1.05);
}
// Shared grounded follow-through for genuinely missed defender dives.
// Special-team coverage previously dropped the expired action immediately,
// unlike scrimmage play, leaving return tacklers running through the miss.
function finishMissedDefenderDive(p){
 if(p.team!==1||p.action?.kind!=='tackle-dive'||p.action.used)return false;
 p.ground={stage:'winded',time:.24,fall:0,rest:.24,rise:.38,age:0,
  force:0,from:'missed-dive',kind:'missed-dive',severity:0};
 p.groundLock=0;p.vx*=.38;p.vy*=.38;
 p.stun=Math.max(p.stun,.28);p.tackleCooldown=Math.max(p.tackleCooldown,.87);
 p.intent='recover-dive';return true;
}
function stepSpecial(dt){
 const k=specialState;if(!k||phase!=='live')return;
 playClock+=dt;totalClock+=dt;k.elapsed+=dt;
 // Special teams must advance the same fall/winded/rise state as scrimmage.
 // Otherwise a coverage athlete knocked down by the first return block
 // remains grounded for the entire return, regardless of pursuit commands.
 const grounded=new Set();
 for(const p of players)if(tickGround(p,dt))grounded.add(p.key);
 // Special teams and scrimmage share transient visual cue expiration.
 // Previously a kickoff BREAK TACKLE cue stayed visible forever, even when
 // the runner was ten yards away; this is presentation, not contact state.
 for(const p of players){
  if(p.actionCue){p.actionCue.time-=dt;if(p.actionCue.time<=0)p.actionCue=null;}
  if(p.airPose){p.airPose.time-=dt;p.airPose.age=(p.airPose.age||0)+dt;if(p.airPose.time<=0)p.airPose=null;}
  if(p.action){p.action.time-=dt;p.action.age=(p.action.age||0)+dt;if(p.action.time<=0){finishMissedDefenderDive(p);p.action=null;}}
 }
 let ret=P(k.returnerKey)||P('RB');const secondary=P(k.backupReturnerKey);
 if(!k.returning){
  if(ball&&!k.landed){
   const f=Math.min(1,k.elapsed/k.airtime);
   ball.t=k.elapsed;
   // Ball follows a simplified flight trajectory, independent of returner movement.
   ball.x+=(k.landingX-ball.x)*Math.min(1,dt/Math.max(.015,k.airtime-k.elapsed));
   ball.y+=(k.targetY-ball.y)*Math.min(1,dt/Math.max(.015,k.airtime-k.elapsed));
   ball.z=Math.max(.18,.18+8*4*f*(1-f));
  }else if(ball&&k.landed){
   k.groundElapsed+=dt;
   ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
   ball.vx*=Math.exp(-2.1*dt);ball.vy*=Math.exp(-2.3*dt);
   // Temporary damped bounce and roll; full impact/orientation/spin physics are future work.
   ball.z=.18+.85*Math.abs(Math.sin(k.groundElapsed*11))*Math.exp(-3.2*k.groundElapsed);
  }
  // Only deep returners can move before the landing. Coverage and the
  // receiving setup line stay planted until the kick is touched/lands.
  if(isFreeKick(k)||k.kind==='punt'&&k.landed){
   const aim=k.landed&&ball?ball:{x:k.landingX,y:k.targetY};
   ret.intent=k.landed?'recover-loose-kick':'track-kick';
   steer(ret,aim.x-ret.x,aim.y-ret.y,dt,1.01);
   if(secondary){
    // Backup returner is a genuine alternative to fielding a wide kick,
    // but stays off the primary athlete's collision line until it drops.
    const offSide=secondary.y<ret.y?-1:1;
    const backupY=clamp(aim.y+offSide*2.6,2,H-2);
    secondary.intent=k.landed?'recover-loose-kick':'second-returner';
    steer(secondary,aim.x+2.2-secondary.x,backupY-secondary.y,dt,.98);
   }
   if(k.landed&&ball){
    // Both units release when the kick first touches down, not only after
    // a returner has collected it. Keep existing tackle/contact rules.
    const claimed=new Set();
    for(const o of off){if(o!==ret&&o!==secondary&&!grounded.has(o.key))returnBlockerAI(o,ret,dt,claimed);}
    for(const d of def){
     if(d.key==='K'||grounded.has(d.key))continue;
     d.intent='loose-kick-coverage';
     steer(d,ball.x-d.x,kickoffLaneAim(d,ball.x,ball.y)-d.y,dt,.97);
    }
    resolveBlocks(dt);
   }
   applyMotion(dt);
  }
  if(k.kind==='punt'&&k.elapsed<k.airtime){
   ret.intent='punt-track-kick';steer(ret,k.landingX-ret.x,k.targetY-ret.y,dt,.96);
   for(const d of def){if(d.key==='K')continue;d.intent='punt-cover';steer(d,ret.x-d.x,ret.y-d.y,dt,.99);}
   const claimed=new Set();for(const o of off){if(o!==ret)returnBlockerAI(o,ret,dt,claimed);}
   resolveBlocks(dt);applyMotion(dt);
  }
  if(k.elapsed>=k.airtime&&!k.landed){
   if(isFreeKick(k)&&k.landingX>30){
    setDriveSpot(possession,50);finishReturn('fair',yard,'Kick short of landing zone · receiving team ball at own 40');return;
   }
   // Never pre-award a free kick just because it reaches the end zone.
   // Check for a physically nearby returner after landing first; if no one
   // fields it, ordinary free-kick touchback rules still apply below.
   if(k.kind==='punt'&&k.landingX<=10){finishReturn('touchback',30,'Punt touchback · own 20');return;}
   k.landed=true;k.groundElapsed=0;
   // Simplified short roll toward the receiver's goal line. If nobody got
   // underneath the kick, the ball remains loose and the returners must run.
   if(ball){ball.x=k.landingX;ball.y=k.targetY;ball.z=.18;ball.vx=-3.0;ball.vy=0;}
  }
  if(ball){
   // The nearest deep player can actually recover the loose kick. Never
   // change any athlete's x/y here: possession requires physical proximity.
   const candidates=[ret,secondary].filter(Boolean);
   const touched=candidates.find(p=>!p.ground&&dist(p,ball)<1.55&&ball.z<1.25);
   if(touched){
    if(returnFairCatch&&k.kind==='punt'){finishReturn('fair',touched.x,`Fair catch · ${spotText(touched.x)}`);return;}
    k.returning=true;
    // Whichever deep player actually fields the ball becomes the carrier.
    // The OTHER deep player becomes the designated lead-return escort.
    // Keeping backupReturnerKey pointing at the new carrier skipped this
    // critical role swap on alternate-returner catches.
    const formerPrimary=k.returnerKey;
    if(touched.key===k.backupReturnerKey)k.backupReturnerKey=formerPrimary;
    k.returnerKey=touched.key;
    ret=touched; // The remainder of this frame must use the actual carrier.
    const newEscort=P(k.backupReturnerKey);
    if(newEscort){newEscort.intent='lead-return-escort';newEscort.intentTarget=touched.key;}
    // Kickoffs/safety kicks caught inside the end zone remain playable.
    // User choice: steer within 2 s to return, or remain neutral for a
    // convenient automatic touchback. This 2-second timer is a GAME INPUT
    // convenience, not an NFL dead-ball rule.
    k.returnCaughtInEndzone=isFreeKick(k)&&touched.x<=10.05;
    k.returnTouchbackSpot=k.landingX<=10?45:30;
    k.advancedOutOfEndzone=false;
    k.touchbackWindow=k.returnCaughtInEndzone&&controlMode==='offense';
    k.returnCommitted=!k.touchbackWindow;
    k.touchbackElapsed=0;
    gameFlowNote=k.touchbackWindow?'END ZONE · MOVE TO RETURN OR WAIT 2s FOR TOUCHBACK':'Kick return in progress';
    ballCarrier=touched;
    active=controlMode==='defense'?P(selectedDefenderKey):touched;
    touched.touches++;ball=null;clockRunning=true;
    touched.vx=k.touchbackWindow?0:touched.vx;
    touched.vy=k.touchbackWindow?0:touched.vy;
    message(k.touchbackWindow?'<strong>END-ZONE CATCH.</strong> Move to return, or stay still for 2 seconds for a touchback.':
     '<strong>RETURN!</strong> '+(k.returnCall||'middle').toUpperCase()+' wedge · '+touched.name+' fields the kick.');
   }else if(k.landed&&ball.x<=10.05){
    // A direct kick to the end zone earns the 35; a ball first bouncing
    // in the landing zone and then entering the end zone earns the 20.
    const spot=isFreeKick(k)?(k.landingX<=10?45:30):30;
    finishReturn('touchback',spot,'Unfielded kick enters end zone · touchback at own '+(spot-10));return;
   }else if(k.landed&&(ball.y<=.1||ball.y>=H-.1)){
    finishReturn('out',ball.x,'Loose kick rolls out of bounds');return;
   }
  }
  if(!k.returning)return;
 }
 if(k.returnCaughtInEndzone&&ret.x>10.10&&k.returnCommitted)k.advancedOutOfEndzone=true;
 if(k.touchbackWindow&&!k.returnCommitted){
  if(stickInput().mag>.12){
   k.returnCommitted=true;k.touchbackWindow=false;
   gameFlowNote='Kick return in progress';
   message('<strong>RETURN OUT!</strong> '+ret.name+' elects to return the kickoff.');
  }else{
   k.touchbackElapsed+=dt;
   if(k.touchbackElapsed>=2.0){
    finishReturn('touchback',k.returnTouchbackSpot||45,'Returner stays in end zone · automatic touchback');return;
   }
   gameFlowNote='END ZONE · MOVE TO RETURN · TOUCHBACK IN '+Math.max(0,2-k.touchbackElapsed).toFixed(1)+'s';
  }
 }
 const claimed=new Set();
 for(const o of off){
  if(grounded.has(o.key))continue;
  if(o===ret){
   if(k.touchbackWindow&&!k.returnCommitted){
    // Existing auto-carry would otherwise run out of the end zone without
    // input, making the requested voluntary touchback impossible.
    o.intent='endzone-choice';o.intentTarget='touchback-or-return';
    o.vx=0;o.vy=0;
   }else if(controlMode==='offense')userCarry(o,dt);
   else autoCarry(o,dt);
   continue;
  }
  if(o.key===k.backupReturnerKey)backupReturnerLeadBlock(o,ret,dt,claimed);
  else returnBlockerAI(o,ret,dt,claimed);
 }
 for(const d of def){
  if(grounded.has(d.key))continue;
  if(d.key==='K'){coverReturnAI(d,ret,dt);continue;}
  if(controlMode==='defense'&&d.key===selectedDefenderKey&&stickInput().mag>.13)manualAthlete(d,dt,'user-defense');
  else coverReturnAI(d,ret,dt);
 }
 resolveBlocks(dt);applyMotion(dt);
 if(ret.x>=109.8){finishReturn('touchdown',110,`${ret.name} brings the kick all the way back!`);return;}
 if(ret.y<=.1||ret.y>=H-.1){finishReturn('out',ret.x,`Returner steps out at ${spotText(ret.x)}`);return;}
 if(contactEnabled)resolveTackles(ret,dt);
 // A live return ends only on a football dead-ball event, never a wall-clock cutoff.
 if(k.elapsed% .2<dt)hud();
}
function startThirdQuarter(){
 if(phase!=='halftime')return false;
 quarter=3;quarterSeconds=QUARTER_DURATION_SECONDS;playSeconds=25;
 timeOuts=[3,3];twoMinuteNoted=false;twoMinutePending=false;
 postWhistle=null;clockRunning=false;
 setupKickoff(secondHalfReceiver);
 gameFlowNote='Third quarter kickoff ready';
 log('START OF Q3 · '+TEAM_NAMES[secondHalfReceiver]+' receiving');hud();return true;
}
function advancePeriodIfNeeded(){
 if(quarterSeconds>0||matchOver||tryState||phase==='halftime')return false;
 if(quarter===4){matchOver=true;phase='gameover';clockRunning=false;hidePlaybook();
  setResultUI('FINAL',`${TEAM_NAMES[0]} ${teamPoints[0]} – ${teamPoints[1]} ${TEAM_NAMES[1]}`,'FINAL');$('snap').disabled=true;hud();return true;}
 if(quarter===2){
  phase='halftime';clockRunning=false;playSeconds=0;scrimmagePlayCalled=false;
  specialState=null;postWhistle=null;closeAudibles();hidePlaybook();
  gameFlowNote='HALFTIME — waiting for continue';
  setResultUI('HALFTIME',`${TEAM_NAMES[0]} ${teamPoints[0]} – ${teamPoints[1]} ${TEAM_NAMES[1]} · ${TEAM_NAMES[secondHalfReceiver]} receives the second-half kickoff`,'START THIRD QUARTER');
  $('snap').disabled=false;hud();log('HALFTIME · third quarter requires continue');return true;
 }
 quarter++;quarterSeconds=QUARTER_DURATION_SECONDS;twoMinuteNoted=false;twoMinutePending=false;
 postWhistle=null;clockRunning=false;
 if(specialState?.kind==='kickoff')setupKickoff(possession);
 else{setup();if(gameStarted&&possession===1){chooseCPUPlay();scrimmagePlayCalled=true;playSeconds=PRESNAP_PLAY_SECONDS;cpuSnapAt=clamp(11+rand()*5,11,16);hidePlaybook();}else showPlaybook();}
 gameFlowNote='Quarter '+quarter+' ready';log('START OF Q'+quarter);hud();return true;
}
function applyDelayOfGame(){
 if(phase!=='presnap'||specialState||tryState||matchOver)return false;
 yard=Math.max(11,yard-5);first=Math.max(yard+1,first);
 togo=Math.max(1,first-yard);penaltyCount++;
 log('DELAY OF GAME · '+TEAM_NAMES[possession]+' offense -5 yards');
 gameFlowNote='Delay of game · '+TEAM_NAMES[possession]+' -5 yards';
 setup();playSeconds=possession===1&&gameStarted?PRESNAP_PLAY_SECONDS:40;
 scrimmagePlayCalled=possession===1&&gameStarted;
 if(scrimmagePlayCalled){cpuSnapAt=clamp(11+rand()*5,11,16);hidePlaybook();}else showPlaybook();
 message('<strong>DELAY OF GAME.</strong> '+TEAM_NAMES[possession]+' loses five yards.');hud();return true;
}
function gameTick(dt){
 if(matchOver||paused||phase==='halftime')return;
 // End a quarter at a dead-ball boundary. Do not accidentally leave a
 // 0:00 clock running while a user is stuck in the play sheet.
 if(phase==='presnap'&&quarterSeconds<=0&&!tryState){advancePeriodIfNeeded();return;}
 if(phase==='presnap'&&(scrimmagePlayCalled||specialState||tryState)){
  playSeconds=Math.max(0,playSeconds-dt);
  if(playSeconds===0){
   if(isFreeKick(specialState)){playSeconds=25;message('<strong>KICKOFF READY.</strong> Press kick to start.');}
   else if(tryState){playSeconds=25;message('<strong>TRY READY.</strong> Select extra point or two.');}
   else {applyDelayOfGame();return;}
  }
  if(gameStarted&&possession===1&&scrimmagePlayCalled&&!specialState&&(!tryState||tryState.mode==='two')&&playSeconds<=cpuSnapAt){
   snap(true);return;
  }
 }
 if(clockRunning&&(phase==='live'||phase==='presnap')){
  const old=quarterSeconds;quarterSeconds=Math.max(0,quarterSeconds-dt);
  if(QUARTER_DURATION_SECONDS>120&&!twoMinuteNoted&&(quarter===2||quarter===4)&&old>120&&quarterSeconds<=120){twoMinuteNoted=true;twoMinutePending=phase==='live';if(!twoMinutePending)clockRunning=false;log('TWO-MINUTE WARNING');}
 }
 if(phase==='presnap'&&quarterSeconds===0)advancePeriodIfNeeded();
}
function requestTimeout(){
 if(matchOver||phase==='live'||timeOuts[possession]<1)return false;
 timeOuts[possession]--;clockRunning=false;playSeconds=25;log(TEAM_NAMES[possession]+' TIMEOUT · '+timeOuts[possession]+' left');hud();return true;
}

function rand(){seq=(Math.imul(1664525,seq)+1013904223)>>>0;return seq/4294967296}
function seed(v){seq=v>>>0}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function hypot(dx,dy){return Math.hypot(dx,dy)}
function dist(a,b){return hypot(a.x-b.x,a.y-b.y)}
function speed(p){return hypot(p.vx,p.vy)}
function mass(p){return p.w*0.45359237}
function maxSpeed(p){
 // Exhaustion costs real separation; fatigue never reduces speed below a believable jog.
 const energy=clamp(p.stam??1,0,1);
 // A rested player retains their rated ceiling. Below 35% energy,
 // running speed gradually declines; exhausted athletes are slower without
 // receiving an artificial catch-up boost or violating their SPD hard cap.
 const fatigue=clamp((.35-energy)/.35,0,1);
 return (6.6+(p.SPD-55)*0.089)*(1-.26*Math.pow(fatigue,1.35));
}
function acceleration(p){return (3.1+(p.ACC-55)*0.055)*Math.pow(100/mass(p),.17)} // yd/s²
function takeoffTier(p){
 // Responsiveness tiers are *not* instant starting velocities or substitutes
 // for SPD/ACC. They describe how strongly the first running steps launch.
 // Fast skill positions: ~70; second-level defenders: low-to-mid 60s;
 // big front-seven players: mid-50s; offensive/defensive interiors: ~50.
 const tiers={WR:71,RB:71,CB:72,FS:70,SS:69,MLB:65,OLB:66,
   QB:64,TE:61,FB:60,EDGE:59,DE:57,DT:52,NT:49,
   LT:50,LG:51,C:51,RG:51,RT:50};
 return tiers[p.pos]??58;
}
function launchAssist(p,speedFraction){
 // Strong first three steps that fade before cruising speed. ACC determines
 // actual acceleration, mass still matters, and speed is capped downstream.
 // Crucially no instant speed teleport on the first frame or repeated boost
 // when a player is already running above the launch band.
 const tier=takeoffTier(p);
 const technique=clamp((p.ACC-45)/54,.20,1);
 const strength=(.12+.025*(tier-50))*(.75+.25*technique);
 const fade=Math.pow(clamp((.76-speedFraction)/.76,0,1),1.10);
 return 1+strength*fade;
}

function radius(p){return .34+(p.w-175)*.00058+(p.h-70)*.0025}
function catchReach(p){return (p.h*.0254+.28+(p.JMP-55)*.010*Math.pow(95/mass(p),.15))/YARD_M}
function log(t){logs.unshift(t);logs=logs.slice(0,14);$('events').innerHTML=logs.map(s=>'<span>'+s+'</span>').join('')}
function message(t){msg=t;$('message').innerHTML=t}
function create(k,x,y){const p={...custom[k],key:k,x,y,spawnX:x,spawnY:y,vx:0,vy:0,face:custom[k].team===1?Math.PI:0,dirX:custom[k].team===1?-1:1,dirY:0,stam:fatigueBank[k]??1, gaitCap:null,travel:0,touches:0,blockWins:0,blockMode:null,action:null,covering:false,actionOutcomes:0,beatenTarget:null,beatenUntil:0,blockFocus:null,runRead:false,readAt:0,fit:null,readAtTime:-1,ground:null,groundLock:0,diveRecovery:0,shield:0,stun:0,blocked:0,tackleCooldown:0,reengage:null,wrapReach:0,wrapLinked:false,tackleStrain:0,escapeReaction:null,breakExertion:0,airState:null,stumbleTime:0,autoHopCooldown:0,lowContactCooldown:0,ankleReachTime:0,standContact:0,squareImpact:null,shedCooldown:0,spin:0,lean:0,balance:1,impact:0,pushing:false,sprinting:false,technique:"none",throwing:false,route:null,routeIdx:0,routeTime:0,routeBreakTime:0,routeComplete:false,scrambleTarget:null,scrambleReplanAt:0,scrambleStepCount:0,releaseSlow:0,releaseBurst:0,passRushLane:null,passRushStyle:'balanced',spy:false,blitz:false,rushEngaged:0,pressResult:'',pressOpponent:null,mirrorDelay:0,coverAim:null,falseStep:null,routeReadCount:0,routeBreaks:0,doubleMoveWins:0,target:null,failed:0,number:k.replace(/\D/g,'')||'',pulse:0,intent:'align',intentTarget:null,supportTarget:null,primaryRunBlock:null,supportUntil:0,jukeDrive:null,contactCount:0,routeVariation:null,coverageVariation:null,jukeRecovery:0,stiffArmHeld:false,airPose:null};players.push(p);(p.team===0?off:def).push(p);return p}
function P(k){return players.find(q=>q.key===k)}
function snapVariation(p){
 // Small, seeded execution variance, not a new overall ability rating.
 // Elite technique tightens the distribution: it never makes all reps identical.
 const rating=p.team===0?(.55*p.RTE+.45*p.CUT):(.45*p.MIR+.30*p.RCR+.25*p.DIS);
 const spread=clamp((112-rating)/75,.16,.95);
 const roll=()=>(rand()+rand()+rand()-1.5)/.75; // center-weighted, bounded
 if(p.team===0){
  p.routeVariation={breakY:roll()*.90*spread,breakX:roll()*.62*spread,
   tempo:clamp(1+roll()*.09*spread,.88,1.12),plant:clamp(1+roll()*.16*spread,.78,1.19)};
 }else{
  p.coverageVariation={react:roll()*.095*spread,mirror:clamp(1+roll()*.10*spread,.83,1.17),
   cushion:roll()*.40*spread};
 }
}
function chooseMixedCoverage(){
 const choices=['cover1','cover2','cover3','quarters'];
 // Weighted toward common simple calls, with no fixed repeating sequence.
 const weights=[.37,.22,.27,.14];let r=rand(),choice=choices[0];
 for(let i=0;i<choices.length;i++){r-=weights[i];if(r<=0){choice=choices[i];break}}
 if(choice===previousMixedCoverage && mixRepeatCount>=1 && rand()<.76){
  const other=choices.filter(c=>c!==choice);choice=other[Math.floor(rand()*other.length)];
 }
 mixRepeatCount=choice===previousMixedCoverage?mixRepeatCount+1:1;
 previousMixedCoverage=choice;return choice;
}
// Pressure plans alter actual rush personnel and assignments. The QB spy
// trades underneath coverage for containment; a blitz trades coverage for a
// fifth rusher. No invisible speed or automatic pass-rush wins are granted.
function choosePressure(){
 if(pressurePreference!=='mix')return pressurePreference;
 const opts=['balanced','contain','spy','blitz','stunt'];
 const weights=[.22,.22,.21,.20,.15];let r=rand(),call=opts[0];
 for(let i=0;i<opts.length;i++){r-=weights[i];if(r<=0){call=opts[i];break}}
 if(call===previousPressure&&pressureRepeat>=1&&rand()<.70){call=opts.filter(o=>o!==call)[Math.floor(rand()*4)]}
 pressureRepeat=call===previousPressure?pressureRepeat+1:1;previousPressure=call;
 return call;
}
function assignPassRushPlan(){
 for(const d of def){d.spy=false;d.blitz=false;d.passRushLane=d.spawnY;d.rushEngaged=0;
  const rating=.55*d.PMV+.30*d.AWR+.15*d.ACC;
  const variance=clamp((100-rating)/60,.16,.85);
  const styleRoll=rand(),style=styleRoll<.34?'power':styleRoll<.70?'speed':'counter';
  d.passRushStyle=style;
  d.rushExecution=clamp(1+(rand()+rand()-1)*variance*.19,.83,1.16);
 }
 if(selectedPressure==='spy'){
  const spy=def.filter(d=>!d.rush&&['MLB','OLB'].includes(d.pos))
    .sort((a,b)=>(b.PUR*.5+b.AWR*.3+b.TAK*.2)-(a.PUR*.5+a.AWR*.3+a.TAK*.2))[0];
  if(spy)spy.spy=true;
 }else if(selectedPressure==='blitz'){
  const blitz=def.filter(d=>!d.rush&&['MLB','OLB'].includes(d.pos))
    .sort((a,b)=>(b.PMV*.5+b.ACC*.25+b.AWR*.25)-(a.PMV*.5+a.ACC*.25+a.AWR*.25))[0];
  if(blitz){blitz.rush=true;blitz.blitz=true;blitz.passRushLane=blitz.spawnY;}
 }else if(selectedPressure==='stunt'){
  const interiors=def.filter(d=>d.rush&&['DT','NT','DE'].includes(d.pos));
  if(interiors.length>=2){const a=interiors[0],b=interiors[1];
   a.passRushStyle='stunt';b.passRushStyle='stunt';
   a.passRushLane=b.spawnY;b.passRushLane=a.spawnY;}
 }
}
function quarterbackSpyAI(d,qb,dt){
 // Stay goal-side of the quarterback, mirror lateral rollouts, then attack
 // once the QB threatens the line. Don't abandon the area chasing a fake.
 const nearLOS=qb.x>=playStart-2.4;
 const near=dist(d,qb)<4.2;
 const tx=nearLOS||near?qb.x+.30:Math.max(playStart+1.0,qb.x+3.0);
 const ty=clamp(qb.y+qb.vy*(nearLOS?.10:.20),4,H-4);
 d.intent=nearLOS||near?'spy-close':'qb-spy';d.intentTarget='QB';
 steer(d,tx-d.x,ty-d.y,dt,nearLOS?1.17:.96);
}
function passRushAI(d,qb,dt){
 const isEdge=['EDGE','DE'].includes(d.pos)||(d.key==='SAM'&&d.rush);
 const left=d.spawnY<26.65;
 const threat=qb.x>=playStart-2.6||Math.abs(qb.y-26.65)>5.0;
 let tx=qb.x,ty=qb.y;
 let mode='rush-pocket';
 if(isEdge){
  // Set the outside shoulder. Edge rushers must not both dive through center.
  // An actual QB rollout overrides the anchor as the rusher closes downfield.
  const outside=left?-1:1;
  const offset=selectedPressure==='contain'?3.6:2.65;
  ty=clamp(qb.y+outside*(threat?1.0:offset),1.8,H-1.8);
  tx=qb.x+clamp(qb.x-d.x,-.3,.9);
  mode=threat?'edge-close':'edge-contain';
  if(threat&&((left&&qb.y<26.65)||(!left&&qb.y>=26.65))){
   ty=qb.y+outside*.45;tx=qb.x+.3;mode='edge-crash';
  }
 }else if(d.passRushStyle==='stunt'&&playClock>.40&&playClock<2.4){
  ty=d.passRushLane;tx=qb.x+.4;mode='stunt';
 }else if(d.blitz){
  ty=clamp(qb.y+(d.spawnY<26.65?-1.2:1.2),2,H-2);mode='blitz';
 }else{
  const lane=clamp((d.spawnY-26.65)*.42,-3,3);
  ty=clamp(qb.y+lane,3,H-3);
  mode='inside-rush';
 }
 const liveQB=RushAwareness.target(d,qb,playStart,playClock);
 if(liveQB){tx=liveQB.x;ty=liveQB.y;mode=liveQB.mode;}
 // Line integrity is retained when unblocked, while a blocker can still
 // overpower the rusher or force him into a less efficient path.
 const blockers=[P('LT'),P('LG'),P('C'),P('RG'),P('RT'),P('TE'),P('TE2'),P('FB')].filter(Boolean);
 const near=closestThreat(d,blockers);
 if(near.p&&near.d<1.65&&qb.x>d.x-3.5)blockBattle(near.p,d,dt);
 const execution=d.rushExecution||1;
 const urgency=RushAwareness.assess(qb,playStart,playClock).urgency;
 const rushEffort=(d.blitz?1.09:1.05)*execution*urgency*(d.blocked>0?.53:1);
 d.intent=mode;d.intentTarget='QB';
 steer(d,tx-d.x,ty-d.y,dt,rushEffort);
}
function eligibleTargets(){return [P('WR1'),P('WR2'),P('TE'),P('WR3')||P('TE2')||P('FB')].filter(Boolean)}
function skillOffense(){return off.filter(p=>!['LT','LG','C','RG','RT','QB'].includes(p.key))}
function alignRoutes(){
 const x=playStart, receivers=eligibleTargets();
 const wr1=P('WR1'),wr2=P('WR2'),te=P('TE'),other=receivers[3];
 const positions=[wr1,wr2,te,other];
 for(const p of positions){if(!p)continue; const yy=p.y;let route;
  if(selectedPlay==='slants')route=[[x+4,yy],[x+13,26.6+(yy<26?-4:4)],[x+22,26.6+(yy<26?1:-1)]];
  else if(selectedPlay==='verticals')route=[[x+11,yy],[x+23,yy],[x+42,yy+(yy<26?2:-2)]];
  else if(selectedPlay==='mesh'){
    // Mesh is a staggered shallow-cross concept: one crosser passes
    // *behind* the other, not two receivers occupying the same depth.
    if(p===wr1)route=[[x+4,yy],[x+8.6,37],[x+13.8,45]];
    else if(p===wr2)route=[[x+4,yy],[x+5.2,16],[x+12.0,8]];
    else if(p===te)route=[[x+5,yy],[x+11,25],[x+17,25]];
    else route=[[x+8,yy],[x+16,yy],[x+24,yy]];
  } else if(selectedPlay==='sluggo') {
    // Slant-and-go: outside WRs sell the slant before redirecting vertical.
    const inward=yy<26?1:-1;
    if(p===wr1||p===wr2)route=[[x+5,yy],[x+11,yy+inward*8],[x+25,yy+inward*8],[x+43,yy+inward*8]];
    else if(p===te)route=[[x+7,yy],[x+14,yy+inward*3],[x+22,yy+inward*3]];
    else route=[[x+5,yy],[x+12,yy-inward*5],[x+20,yy-inward*6]];
  } else if(selectedPlay==='flood'){
    if(p===wr2)route=[[x+11,46],[x+25,44],[x+41,42]];
    else if(p===te)route=[[x+7,38],[x+12,42],[x+16,44]];
    else if(p===other)route=[[x+3,yy],[x+4,47],[x+10,48]];
    else route=[[x+9,7],[x+16,19],[x+23,27]];
  } else if(selectedPlay==='stick'){
    if(p===te)route=[[x+5,yy],[x+7,yy],[x+7,clamp(yy+(yy<26?-4:4),3,50)]];
    else if(p===wr1)route=[[x+5,yy],[x+9,clamp(yy+7,2,51)],[x+15,clamp(yy+8,2,51)]];
    else if(p===wr2)route=[[x+3,yy],[x+5,clamp(yy-6,2,51)],[x+9,clamp(yy-7,2,51)]];
    else route=[[x+7,yy],[x+16,yy],[x+25,yy]];
  } else if(selectedPlay==='dagger'){
    if(p===wr1)route=[[x+10,yy],[x+21,yy],[x+30,clamp(yy+15,3,50)]];
    else if(p===wr2)route=[[x+12,yy],[x+23,yy],[x+36,yy]];
    else if(p===te)route=[[x+7,yy],[x+13,clamp(yy-8,3,50)],[x+18,clamp(yy-8,3,50)]];
    else route=[[x+6,yy],[x+13,clamp(yy+6,3,50)],[x+18,clamp(yy+8,3,50)]];
  } else if(selectedPlay==='smash'){
    if(p===wr1||p===wr2)route=[[x+5,yy],[x+7,clamp(yy+(yy<26?5:-5),2,51)],[x+8,clamp(yy+(yy<26?8:-8),2,51)]];
    else if(p===te)route=[[x+7,yy],[x+17,clamp(yy+(yy<26?-9:9),2,51)],[x+25,clamp(yy+(yy<26?-13:13),2,51)]];
    else route=[[x+7,yy],[x+16,yy],[x+28,yy]];
  } else route=[[x+3,yy],[x+8,yy],[x+14,yy]];
  // A route's concept remains recognizable; only execution varies slightly.
  // Avoid large distortions of collision/crossing concepts and boundary routes.
  const variation=p.routeVariation;
  if(variation){for(let i=1;i<route.length;i++){
    const taper=i===route.length-1?.55:1;
    route[i]=[route[i][0]+variation.breakX*taper,
      clamp(route[i][1]+variation.breakY*taper,1.4,H-1.4)];
  }}
  p.route=route;p.routeIdx=0;p.routeComplete=false;p.scrambleTarget=null;p.scrambleReplanAt=0;p.scrambleStepCount=0;p.routeBreaks=0;p.doubleMoveWins=0;
 }
}
function zone(d,tag,depth,lat,width){const adjusted=DefensivePresnap.compressedDepth(playStart,depth);d.assignment={kind:'zone',tag,baseX:playStart+adjusted,baseY:lat,width,depth:adjusted,originalDepth:depth};}
function assignCoverage(){
 const backs=def.filter(d=>!d.rush&&!d.spy), rec=skillOffense(), safety=P('FS'), strong=P('SS'), left=P('CB1'),right=P('CB2');
 if(selectedCoverage==='cover1'){
  for(const d of backs)zone(d,'deep-middle',19,26.65,15);
  const available=backs.filter(d=>d!==safety);
  const order=[P('WR1'),P('WR2'),P('WR3')||P('TE2')||P('FB'),P('TE'),P('RB')].filter(Boolean);
  const priority=['CB1','CB2','CB3','OLB','WILL','MLB','SAM','SS'];
  const assigned=new Set();
  for(const t of order){const candidates=available.filter(d=>!assigned.has(d.key));candidates.sort((a,b)=>(Math.abs(a.y-t.y)+((a.pos==='CB'&&t.pos==='WR')?-3:0)+priority.indexOf(a.key)*.02)-(Math.abs(b.y-t.y)+((b.pos==='CB'&&t.pos==='WR')?-3:0)+priority.indexOf(b.key)*.02));const d=candidates[0];if(d){d.assignment={kind:'man',target:t.key};assigned.add(d.key)}}
  if(safety)zone(safety,'deep-middle',19,26.65,16);
  for(const d of available){if(!assigned.has(d.key))zone(d,'robber',7,26.65,14)}
 }else{
  const zones=[];
  if(selectedCoverage==='cover2'){
   if(safety)zone(safety,'deep-half-left',19,13.3,17);
   if(strong)zone(strong,'deep-half-right',19,40,17);
   if(left)zone(left,'flat-left',3,8,10);
   if(right)zone(right,'flat-right',3,45,10);
   zones.push(['hook-left',8,16,13],['hook-middle',8,26.6,13],['hook-right',8,38,13]);
  }else if(selectedCoverage==='cover3'){
   if(safety)zone(safety,'deep-middle',18,26.65,12);
   if(left)zone(left,'deep-left',18,9,13);
   if(right)zone(right,'deep-right',18,44,13);
   zones.push(['flat-left',4,8,10],['hook-left',8,19,12],['hook-right',8,34,12],['flat-right',4,45,10]);
  }else{
   if(safety)zone(safety,'deep-quarter-inner-left',18,20,9);
   if(strong)zone(strong,'deep-quarter-inner-right',18,34,9);
   if(left)zone(left,'deep-quarter-outside-left',18,7,10);
   if(right)zone(right,'deep-quarter-outside-right',18,47,10);
   zones.push(['flat-left',5,10,13],['hook-middle',8,26.6,15],['flat-right',5,43,13]);
  }
  let free=backs.filter(d=>!d.assignment);
  // Assign short areas based on initial alignment; nearest helps nickel/4-3/3-4 adjust.
  for(const [tag,depth,lat,width] of zones){if(!free.length)break;free.sort((a,b)=>Math.abs(a.y-lat)-Math.abs(b.y-lat));zone(free.shift(),tag,depth,lat,width)}
  for(const d of free)zone(d,'hook-help',8,d.y,12);
 }
}
// Inspectable on-field matchups: see whom each receiver is facing, not just
// the overall "separation" between WR1 and whichever CB happens to be closest.
function matchupHud(){
 const panel=$('matchupReadout');if(!panel)return;
 if(RUNS.has(selectedPlay)){
  panel.textContent='PASS MATCHUPS · Select a pass play to inspect releases, cuts and coverage.';
  return;
 }
 const lines=off.filter(p=>['WR','TE'].includes(p.pos)).slice(0,4).map(p=>{
  const db=def.find(d=>d.assignment?.kind==='man'&&d.assignment.target===p.key);
  if(!db)return p.key+' · zone coverage · RTE '+Math.round(p.RTE)+' / CUT '+Math.round(p.CUT);
  const gap=phase==='presnap'?'':(' · '+dist(p,db).toFixed(1)+' yd apart');
  const released=p.pressResult?(' · '+p.pressResult.replaceAll('-',' ')):'';
  return p.key+' ↔ '+db.key+' · REL '+Math.round(p.REL)+'/PRS '+Math.round(db.PRS)+
   ' · CUT '+Math.round(p.CUT)+'/MIR '+Math.round(db.MIR)+gap+released;
 });
 panel.textContent='RECEIVER / DEFENDER MATCHUPS\n'+lines.join('\n');
}
function schemeReport(){
 const offLabel=formationDesc[selectedFormation], dLabel=defenseDesc[selectedFront], gap=RUNS.has(selectedPlay), heavy=selectedFormation==='ace'||selectedFormation==='iform',light=selectedFront==='nickel';
 let note=gap?(heavy&&light?'Heavier offensive bodies face nickel: the offense may create extra blocking angles, but the run still has to beat the actual gap defenders.':selectedPlay==='power'?'Power asks the back-side guard to pull. The defense can defeat it with penetration, pursuit and edge leverage.':'Run success depends on combo-block displacement, defender gap fits and the runner choosing a crease.'):(selectedCoverage==='cover1'?'Man coverage creates leverage and crossing-route battles; coverage and receiver ratings determine separation.':'Zones defend space. Floods and layered routes can stress the underneath-to-deep handoffs, but defenders react to the routes.');
 $('schemeReadout').innerHTML='<strong>'+offLabel+'</strong><small>Defense: '+dLabel+' · '+selectedCoverage.toUpperCase()+(coveragePreference==='mix'?' (MIXED)':'')+' · '+selectedPressure.toUpperCase()+'</small><small>'+coverageDesc[selectedCoverage]+' · '+pressureDesc[selectedPressure]+'</small><small>'+note+'</small>';
 $('targets').querySelectorAll('button').forEach((b,i)=>{const p=eligibleTargets()[i];b.innerHTML='<span class="faceIcon icon'+i+'">'+PASS_ICONS[i]+'</span><span class="targetMeta"><strong>'+ (p?.key||'—')+'</strong><small>KEY '+(i+1)+'</small></span>';b.setAttribute('aria-label','Throw to '+(p?.name||'receiver')+' — key '+(i+1));});
 $('receiverPins').querySelectorAll('button').forEach((b,i)=>{const p=eligibleTargets()[i];b.setAttribute('aria-label','Throw to '+(p?.name||'receiver')+' — key '+(i+1));});
}
function setup(){
 closeAudibles();
 scrimmagePlayCalled=false;
 paused=false;refreshPauseUI();suppressManualUntilNeutral=false;xHoldStart=null;xDiveFired=false;rightStickLatched=false;rightStickDirection='';queuedCarrierMove=null;
 players.length=0;off.length=0;def.length=0;
 if(tackleDiagnostics)tackleDiagnostics.length=0;
 if(carrierCollisionDiagnostics)carrierCollisionDiagnostics.length=0;
 ChaosContactEvidence.reset();lastAnatomyTackle=null;lowDiveContacts=0;lastLowDiveImpact=null;blockLinks.clear();tackleLinks.clear();pileState=null;pileStarts=0;pilePushYards=0;chainHits=0;tackleCount=0;brokenTackleCount=0;blockShedCount=0;hitStickCount=0;impactBlockCount=0;powerMoveCount=0;windedHits=0;standUps=0;
 playStart=yard;selectedCoverage=coveragePreference==='mix'?chooseMixedCoverage():coveragePreference;selectedPressure=choosePressure();ballCarrier=null;ball=null;intended=null;passThrown=false;active=null;manualReceiver=false;airSelection={offense:null,defense:null,defenderKey:null};lastAirResult=null;cpuQB={nextRead:0,choice:null,reads:0,passes:0,lastScore:0,lastRisk:0};lastContact=0;playClock=0;burstTime=0;burstCool=0;evadeTime=0;evadeCool=0;moveCooldown=0;pendingPass=null;flash=0;manualDrive=false;contactEnabled=true;
 const x=yard,ly=26.65;
 let qbdepth=selectedFormation==='iform'?-1.6:selectedFormation==='ace'?-1.6:-4.8;
 create('QB',x+qbdepth,ly);
 create('RB',x+(selectedFormation==='iform'?-8.3:selectedFormation==='ace'?-6.9:selectedFormation==='pistol'?-9.1:-6.5),selectedFormation==='spread'?ly+3:ly);
 for(const [k,y] of [['LT',ly-3.6],['LG',ly-1.8],['C',ly],['RG',ly+1.8],['RT',ly+3.6]])create(k,x-.65,y);
 if(selectedFormation==='spread'){
   create('WR1',x-1.2,6.5);create('WR2',x-1.2,47);create('WR3',x-2.5,16);create('TE',x-2.5,36.2);
 }else if(selectedFormation==='trips'){
   create('WR1',x-1.2,7.5);create('WR2',x-1.2,47);create('WR3',x-2.5,40.7);create('TE',x-2.5,35.6);
 }else if(selectedFormation==='bunch'){
   create('WR1',x-1.2,6.5);create('WR2',x-1.2,43.3);create('WR3',x-2.1,48.2);create('TE',x-2.5,38.0);
 }else if(selectedFormation==='pistol'){
   create('WR1',x-1.2,6.5);create('WR2',x-1.2,47);create('WR3',x-2.5,15);create('TE',x-2.0,36.8);
 }else if(selectedFormation==='ace'){
   create('WR1',x-2.3,6.5);create('WR2',x-2.3,47);create('TE2',x-.85,ly-5.8);create('TE',x-.85,ly+5.8);
 }else{
   create('WR1',x-1.2,6.5);create('WR2',x-2.3,47);create('TE',x-.85,ly+5.8);create('FB',x-4.3,ly);
 }
 if(selectedFront==='nickel'){
  create('EDGE1',x+1.9,ly-5.4);create('DT',x+1.7,ly-1.6);create('DT2',x+1.7,ly+2.1);create('EDGE2',x+1.9,ly+5.8);
  create('MLB',x+6,ly-3.4);create('OLB',x+6,ly+5);
  create('CB1',x+6,6.5);create('CB2',x+6,47);create('CB3',x+5,selectedFormation==='spread'?16:39);create('FS',x+17,18);create('SS',x+17,37);
 } else if(selectedFront==='base43'){
  create('EDGE1',x+1.9,ly-5.5);create('DT',x+1.7,ly-1.6);create('DT2',x+1.7,ly+2.2);create('EDGE2',x+1.9,ly+5.5);
  create('WILL',x+5.5,17);create('MLB',x+5.5,ly);create('OLB',x+5.5,36);
  create('CB1',x+6,6.5);create('CB2',x+6,47);create('FS',x+16,18);create('SS',x+16,37);
 }else{
  create('DE3A',x+1.7,ly-4);create('NT',x+1.7,ly);create('DE3B',x+1.7,ly+4);
  create('WILL',x+5.5,19);create('MLB',x+5.5,25);create('SAM',x+1.9,ly+7.0);create('OLB',x+5.5,35);
  create('CB1',x+6,6.5);create('CB2',x+6,47);create('FS',x+16,18);create('SS',x+16,37);
 }
 // Adjust formation geometry *before* building zone and run-fit assignments.
 // The deep safety begins compressing around the 17, while corners and LBs
 // only compress when their own actual depth approaches the goal line.
 DefensivePresnap.compressFormation(def,playStart);
 // Four rushers in nickel/base 4–3; in 3–4 one outside linebacker joins three linemen.
 for(const d of def){
  d.rush=['EDGE1','EDGE2','DT','DT2','DE3A','DE3B','NT'].includes(d.key)||(selectedFront==='base34'&&d.key==='SAM');
  d.assignment=null;d.recognition=clamp(.08+(100-d.AWR)*.005,.08,.37);
  d.fit=runFitFor(d);d.runRead=false;d.readAtTime=-1;
  const secondary=d.pos==='CB'||d.pos==='FS'||d.pos==='SS';
  d.readAt=clamp(.11+(100-d.PRC)*.009+(100-d.AWR)*.002+(secondary?.18:0),.16,1.05);
 }
 protectionRead=null;
 assignPassRushPlan();assignPassProtection();
 for(const p of players)snapVariation(p);
 assignCoverage();assignRunBlockMatches();alignRoutes();
 if(!RUNS.has(selectedPlay)){for(const d of def){if(d.assignment?.kind!=='man'||d.PRS<75)continue;const t=P(d.assignment.target);if(!t||t.pos!=='WR')continue;d.x=Math.min(d.x,t.x+clamp(2.5-(d.PRS-75)*.017,1.75,2.5));d.y=t.y+Math.sign(d.y-t.y||1)*.25;}}
 phase='presnap';if(controlMode==='defense'&&!P(selectedDefenderKey))selectedDefenderKey=def[0]?.key||selectedDefenderKey;active=controlMode==='defense'?P(selectedDefenderKey):null;$('snap').textContent=gameStarted&&possession===1?'CPU WILL SNAP':'SNAP THE BALL';$('snap').disabled=gameStarted&&possession===1;document.querySelectorAll('[data-play]').forEach(b=>b.disabled=false);for(const id of ['formation','front','coverage','pressure'])$(id).disabled=false;
 $('overlay').classList.remove('visible');$('targets').style.display='none';$('receiverPins').style.display='none';message('<strong>Ready.</strong> '+selectedFormation.toUpperCase()+' vs '+selectedFront.toUpperCase()+' · '+selectedCoverage.toUpperCase()+'.');schemeReport();hud();
}
function choosePlay(n){if(phase==='live'||specialState||controlMode==='defense'||(gameStarted&&possession!==0)||!!tryState&&!tryState.mode)return;selectedPlay=n;document.querySelectorAll('.play').forEach(b=>b.classList.toggle('selected',b.dataset.play===n));setup();playSeconds=PRESNAP_PLAY_SECONDS;scrimmagePlayCalled=true;hidePlaybook();message('<strong>Play called.</strong> '+selectedPlay.toUpperCase()+' · A to snap · 20 seconds on the play clock.');hud();}
function snap(cpu=false){if(phase==='live'||matchOver)return;if(gameStarted&&possession===1&&!cpu&&!specialState)return;closeAudibles();if(phase==='dead'){nextDown();return}if(phase!=='presnap')return;
 if(specialState){kickSpecial();return;}
 if(tryState&&!tryState.mode){showPlaybook();return;}
 currentMemoryPlay=(!specialState&&(!tryState||tryState.mode==='two'))?{team:possession,play:selectedPlay,kind:RUNS.has(selectedPlay)?'run':'pass',formation:selectedFormation,down,quarter,target:null,airYards:null,scramble:false}:null;
 // Prior observations are frozen at the snap, never recomputed against
 // the offense's hidden current play. Formation alignment is visible.
 const pursuitExperience=RunPursuitPolicy.experience(DefensiveMemory.report(possession)?.history,selectedFormation);
 // Read possible extra rushers from the *visible* defensive alignment.
 // This is a suspicion, not knowledge of whether the defender will actually blitz.
 protectionRead=ProtectionRead.evaluate(def,playStart,P('QB'),P('C'),rand());
 const visualAlert=protectionRead?.recognized?protectionRead.key:null;
 const rbProtector=P('RB');if(rbProtector)rbProtector.protectionAlert=visualAlert;
 // The center communicates the look; the nearest outside lineman can help
 // only when free of his actual assignment. This is not a guaranteed blitz ID.
 const line=['LT','LG','C','RG','RT'].map(P).filter(Boolean);
 for(const o of line)o.protectionAlert=null;
 if(visualAlert){const suspicious=P(visualAlert);
  const nearest=[...line].sort((a,b)=>Math.abs(a.y-suspicious.y)-Math.abs(b.y-suspicious.y))[0];
  if(nearest)nearest.protectionAlert=visualAlert;
  const center=P('C');if(center)center.protectionCall=visualAlert;
 }
 // The Inside Zone front is read at the snap, from observable defenders.
 // The combo pair remains committed until contact has played out.
 if(selectedPlay==='inside'){
  const plan=InsideZoneIQ.assignments(['LT','LG','C','RG','RT'].map(P).filter(Boolean),def,playStart);
  for(const o of off)if(plan[o.key]){o.insideZonePlan=plan[o.key];o.blockTarget=plan[o.key].target;}
 }
 // Freeze the real A/B gap target at the snap; OL movement must not drag it.
 for(const d of def)if(d.fit)d.fit.gapSpot=DefensivePresnap.gapTarget(d,off,playStart);
 hidePlaybook();clockRunning=true;phase='live';gameFlowNote='Live scrimmage';for(const p of players){p.animationFlavor=rand();p.actionCue=null;p.airPose=null;
  // Stable per-snap misread + rare learned read. Ratings still govern how
  // much prior experience can help; no influence on coverage play calls.
  if(p.team===1){p.pursuitLateralBias=rand()*2-1;p.pursuitDepthBias=rand()*2-1;
   p.pursuitReadRoll=rand();p.pursuitExperience=pursuitExperience;}
 }
 active=controlMode==='defense'?P(selectedDefenderKey):controlMode==='line'?P(selectedLinemanKey):P('QB');
 playClock=0;
 const snapHint=controlMode==='defense'?'Read the play and pursue the ball.':
  RUNS.has(selectedPlay)?'Find your lane, then burst through the hole.':
  'Choose a receiver icon or press 1–4 to throw. The QB automatically leads the route.';
 message('<strong>Ball snapped.</strong> '+snapHint);
 $('snap').disabled=true;document.querySelectorAll('[data-play]').forEach(b=>b.disabled=true);for(const id of ['formation','front','coverage','pressure'])$(id).disabled=true;log('SNAP · '+selectedPlay.toUpperCase());
 playTrace=[];traceAccum=0;lastTraceMeta={version:'v0.33',formation:selectedFormation,front:selectedFront,
  coverage:selectedCoverage,play:selectedPlay,seed:seq,playStart};
 $('downloadTrace').disabled=false;traceSample();resolvePressMatchups();canvas.focus({preventScroll:true});hud();}
function finish(type,x,detail){if(phase!=='live')return;
 if(specialState){finishReturn(type,x,detail);return;}
 traceSample();
 // Record observed play after the whistle, before any new play can be chosen.
 if(currentMemoryPlay){const played={...currentMemoryPlay,result:type};
  played.scramble=played.kind==='pass'&&!passThrown&&ballCarrier?.key==='QB';
  DefensiveMemory.record(played.team,played);currentMemoryPlay=null;}
 // A player who was heavily involved recovers less before the next snap.
 // Non-ball-carriers recover more, but prolonged sprints still have a cost.
 for(const p of players){
  const hadBall=p.touches>0,effort=clamp((p.travel||0)/35,0,1);
  // A fully exhausted athlete needs roughly three quiet plays without carrying the ball
  // to recover. Carrying again provides almost no between-play recovery.
  const recovery=(hadBall?.015:.345)*(0.85+p.STA/500)*(1-effort*.12);
  fatigueBank[p.key]=clamp(p.stam+recovery,.045,1);
 }
 pendingPass=null;const progressMark=pileState?.maxX??null;phase='dead';blockLinks.clear();tackleLinks.clear();pileState=null;for(const p of players){p.intent='whistle';p.intentTarget=null;p.stiffArmHeld=false;p.vx=0;p.vy=0;p.stun=0;p.ground=p.ground?.kind==='trip'?p.ground:null;p.groundLock=0}if(type==='touchdown')x=110;else if(ballCarrier&&type!=='incomplete'&&type!=='intercept'){x=clamp(type==='tackle'&&progressMark!==null?Math.max(ballCarrier.x,progressMark):ballCarrier.x,10,110)}
 const gained=Math.round((x-playStart)*10)/10;let heading=type==='touchdown'?'TOUCHDOWN':type==='tackle'?'TACKLED':type==='sack'?'QUARTERBACK SACK':type==='incomplete'?'INCOMPLETE':type==='intercept'?'INTERCEPTED':type==='out'?'OUT OF BOUNDS':type==='timeout'?'PLAY CLOCK EXPIRED':type.toUpperCase();
 if(tryState?.mode==='two'){
  const scored=type==='touchdown';if(scored){teamPoints[possession]+=2;score=teamPoints[possession];}
  detail=scored?'Two-point conversion GOOD · +2':'Two-point conversion failed · no points';
  heading=scored?'TWO POINTS':'TRY FAILED';tryState=null;postWhistle='kickoff';clockRunning=false;
 }else if(type==='touchdown'){
  teamPoints[possession]+=6;score=teamPoints[possession];detail=detail||'Touchdown! Six points; choose the extra-point try.';
  tryState={team:possession};postWhistle='try';clockRunning=false;flash=2;
 }
 result=heading;message('<strong>'+heading+'.</strong> '+detail);$('resultText').textContent=heading;$('resultDetail').textContent=detail+' · '+(type==='intercept'?'Next drive: '+spotText(clamp(120-(x>=110?90:x),11,109)):(gained>=0?'+':'')+gained.toFixed(1)+' yards gained');$('overlay').classList.add('visible');$('targets').style.display='none';$('receiverPins').style.display='none';$('snap').disabled=false;$('snap').textContent='NEXT SNAP';log(heading+' · '+(type==='intercept'?'change of possession at '+spotText(clamp(120-(x>=110?90:x),11,109)):(gained>=0?'+':'')+gained.toFixed(1)+' yd'));
 const nYd=Math.max(10,Math.round(x*10)/10);
 if(tryState||postWhistle==='kickoff'||postWhistle==='try'){
   // The kickoff/try is presented after the whistle, not automatically skipped.
 }else if(type==='intercept'){
   // Spot the ball where the interception was secured, not where the throw began.
   // An end-zone interception is a touchback to the defender's own 20.
   // Interception returns are not live yet; they need a separate possession-state update.
   newPossession(1-possession,nYd>=110?90:nYd);postWhistle='scrimmage';clockRunning=false;
 }else{
   yard=type==='incomplete'||type==='timeout'?playStart:nYd;
   if(type==='safety'||(['tackle','sack','out','down'].includes(type)&&ballCarrier&&ballCarrier.x<=10.05)){teamPoints[1-possession]+=2;score=teamPoints[possession];postWhistle='safety-kick';clockRunning=false;heading='SAFETY';$('resultText').textContent='SAFETY · +2';log('SAFETY · +2 to defense');}
   else if(yard>=first-.05){down=1;first=Math.min(110,yard+10);togo=first-yard;log('FIRST DOWN · Chains move')}
   else{down++;togo=first-yard}
   if(down>4&&postWhistle!=='safety-kick'){const lostTeam=possession;newPossession(1-lostTeam,yard);postWhistle='scrimmage';clockRunning=false;log('TURNOVER ON DOWNS · '+TEAM_NAMES[possession]+' ball');}
 }
 if(type==='incomplete'||type==='out'||type==='timeout'||twoMinutePending){clockRunning=false;twoMinutePending=false;}
 if(postWhistle==='try')$('snap').textContent='CHOOSE TRY';
 if(postWhistle==='kickoff')$('snap').textContent='KICKOFF';
 if(postWhistle==='scrimmage')$('snap').textContent='NEXT DRIVE';
 if(postWhistle==='safety-kick')$('snap').textContent='SAFETY FREE KICK';
 hud();}
function nextDown(){
 if(phase==='halftime'){startThirdQuarter();return;}
 if(phase!=='dead')return;
 if(quarterSeconds<=0&&!tryState){advancePeriodIfNeeded();return;}
 const action=postWhistle;postWhistle=null;
 if(action==='try'){
  // Keep the scoring team on the field until the try is selected.
  yard=95;down=1;togo=10;first=105;specialState=null;setup();playSeconds=25;showPlaybook();
  if(gameStarted&&possession===1)chooseSpecial('pat');
 }else if(action==='kickoff'){setupKickoff(1-possession);}
 else if(action==='safety-kick'){setupKickoff(1-possession,'safety-kick');}
 else {if(gameStarted&&possession===1)chooseCPUPlay();setup();playSeconds=gameStarted&&possession===1?PRESNAP_PLAY_SECONDS:40;scrimmagePlayCalled=gameStarted&&possession===1;cpuSnapAt=clamp(11+rand()*5,11,16);
  // CPU possessions show the field immediately for defensive repositioning.
  // VIEW still opens the optional defensive call sheet.
  if(gameStarted&&possession===1)hidePlaybook();else showPlaybook();}
}
function reset(){gameFlowNote='Ready';penaltyCount=0;DefensiveMemory.reset();currentMemoryPlay=null;gameStarted=false;selectControlMode('offense');possession=0;teamPoints=[0,0];quarter=1;quarterSeconds=QUARTER_DURATION_SECONDS;timeOuts=[3,3];playSeconds=40;specialState=null;tryState=null;postWhistle=null;clockRunning=false;hidePlaybook();for(const k of Object.keys(fatigueBank))delete fatigueBank[k];paused=false;refreshPauseUI();score=0;down=1;togo=10;yard=30;first=40;totalClock=0;logs=[];$('events').innerHTML='';seed((Math.floor(Math.random()*4294967296))>>>0);setup();log('New drive · ball on own 20')}
// Screen-oriented controls in 3D: toward the top of the screen means forward
// downfield, and right/left steer toward the corresponding screen sidelines.
// In the original overhead 2D view, retain the existing field-coordinate
// mapping (D / right = downfield, W / up = upper sideline).
// Keep this transform in one place so QB, runner, defender, and OL controls
// agree; juke-side selection remains tied to the field sidelines separately.
function fieldStickAxes(screenX,screenY,viewMode=visualMode){
 if(viewMode==='3d')return {x:-screenY,y:screenX};
 return {x:screenX,y:screenY};
}
function stickInput(){
 let screenX=0,screenY=0;
 if(keys.w||keys.arrowup)screenY-=1;
 if(keys.s||keys.arrowdown)screenY+=1;
 if(keys.a||keys.arrowleft)screenX-=1;
 if(keys.d||keys.arrowright)screenX+=1;
 screenX+=joystick.x+padState.lx;
 screenY+=joystick.y+padState.ly;
 const mag=Math.hypot(screenX,screenY);
 if(mag>1){screenX/=mag;screenY/=mag;}
 const input=fieldStickAxes(screenX,screenY);
 return {x:input.x,y:input.y,mag:Math.min(1,mag)};
}
function steer(p,dx,dy,dt,boost=1){
 if(p.jukeRecovery>0){const skill=clamp((p.JUK*.36+p.CUT*.29+p.AGI*.23+p.ACC*.12-50)/49,0,1);boost*=1+.25*skill;p.jukeRecovery=Math.max(0,p.jukeRecovery-dt);}
 if(p===active&&burstTime>0)boost*=1+0.68*clamp(p.stam/.48,.15,1);
 if(p.stun>0){p.stun=Math.max(0,p.stun-dt);dx=0;dy=0;boost=.6}
 const goalDistance=Math.hypot(dx,dy);
 let norm=goalDistance;if(norm>1){dx/=norm;dy/=norm;norm=1}
 // At arm's length, keep committed pursuit rather than easing off the gas
 // a yard before contact; distance and rated acceleration still govern.
 if(p.team===1&&ballCarrier&&goalDistance>.12&&goalDistance<1&&
    ['kick-cover','punt-cover','return-bypass','return-shed','pursue','contain','run-fit','safety-angle'].includes(p.intent)) {dx/=goalDistance;dy/=goalDistance;norm=1;}
 let vx=p.vx,vy=p.vy,spd=Math.hypot(vx,vy);
 // Full pursuit includes contain/last-line/run-fit, not only the literal
 // 'pursue' label. Old code accidentally made the outside force defender and
 // safety jog while the ball carrier sprinted straight past them.
 const fullPursuit=['pursue','contain','safety-angle','run-fit','break-on-pass','break-on-ball','air-rally','air-underneath','kick-cover','punt-cover','return-bypass','return-shed'].includes(p.intent);
 const hunting=fullPursuit||['escort','block','lead-block','pile-support','rush','run','route','route-finish','route-final-stem','scramble-open','cover-man','cover-zone','carry-auto','run-block','edge-escort','edge-stalk','climb-second-level','zone-drive','zone-combo','zone-climb','zone-search','catch-block','catch-screen','air-track','air-backup'].includes(p.intent);
 const userSteering=p===active&&(controlMode!=='offense'||manualDrive||(!ballCarrier&&!passThrown));
 const sprintDistance=fullPursuit&&ballCarrier?.team===0?.24:fullPursuit?1.3:p.intent==='cover-zone'?5.5:2.7;
 // Run fits and safety support may accelerate before arriving at the runner.
 // A defender must still *recognize* the run before using knowledge of it.
 // Defensive pursuit must include an endurance decision. Jogging when a
 // tackle is not imminent preserves energy; an approaching score or a tackle
 // window justifies a maximum-effort chase. No forced speed matching.
 const imminent=fullPursuit&&ballCarrier&&(goalDistance<16||ballCarrier.x>75||
   (p.x<ballCarrier.x&&ballCarrier.vx>3&&goalDistance<28));
 const conserve=fullPursuit&&p.stam<.37&&!imminent;
 const pursueNow=fullPursuit&&(imminent||goalDistance<23||
   (p.stam>.70&&goalDistance<36));
 // After a catch, a pursuit defender may lose the first 10 yards by
 // rationing a sprint while the carrier is already at full speed. When the
 // ball is live and the defender is outside tackling distance, close hard;
 // otherwise use the old energy-saving read for deep, low-threat positions.
 const liveChase=fullPursuit&&ballCarrier&&p.team===1&&
   (ballCarrier.x>p.x-1.5||goalDistance<28);
 const airChase=!!ball?.flying&&['break-on-ball','air-rally','air-underneath'].includes(p.intent);
 const aiSprint=!userSteering&&hunting&&p.stam>.07&&goalDistance>sprintDistance&&
   p.stun<=0&&p.blocked<.3&&(!fullPursuit||airChase||liveChase||(pursueNow&&!conserve));
 const sprinting=(aiSprint||(userSteering&&sprintHeld()&&norm>.1))&&p.stam>.055;
 p.sprinting=sprinting;
 // AI sprint uses the same full-effort gear as a player's RT rather
 // than a weaker hidden multiplier; still governed by ACC, SPD, and fatigue.
 if(aiSprint)boost*=clamp(1.20+(p.ACC-75)*.0012,1.15,1.24)*clamp(.68+p.stam*.32,.68,1);
 if(norm>.1){
   const targetAngle=Math.atan2(dy,dx);
   const faceDifference=Math.atan2(Math.sin(targetAngle-p.face),Math.cos(targetAngle-p.face));
   // Face direction changes quickly; velocity remains physically separate.
   const routeFoot=p.intent.startsWith('route')&&p.routeBreakTime>0?clamp(.83+(p.CUT-65)*.009+(p.RTE-70)*.003,.63,1.30):1;
   const maxTurn=(4.0+(p.AGI-55)*.105)*routeFoot/(1+spd*.065+Math.max(0,p.h-72)*.008)*dt;
   p.face+=clamp(faceDifference,-maxTurn,maxTurn);
   // v0.26: a defender doesn't come to a virtual stop every time a
   // receiver catches a ball or the runner changes direction. Rotate some
   // *existing momentum* toward the new pursuit vector. The turn rate is
   // bounded by agility, pursuit skill, recognition, body mass and speed:
   // 180-degree reversals still require braking, but a 20-70 degree redirect
   // can retain substantial momentum. No energy or top speed is created.
   if(p.team===1&&fullPursuit&&spd>.65){
     const heading=Math.atan2(vy,vx),desired=Math.atan2(dy,dx);
     const mismatch=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
     const technique=clamp((p.AGI*.52+p.PUR*.33+p.PRC*.15-50)/49,0,1);
     const bodyTurn=Math.pow(90/mass(p),.13);
     const turnSpeed=(2.25+2.15*technique)*bodyTurn/(1+Math.max(0,spd-6)*.075);
     // No turning a full-speed runner 180 degrees without a genuine pivot.
     const eligibility=clamp((Math.PI-Math.abs(mismatch))/.95,0,1);
     const angle=clamp(mismatch,-turnSpeed*dt,turnSpeed*dt)*eligibility;
     const c=Math.cos(angle),t=Math.sin(angle);
     const preserved=1-Math.abs(angle)*(.18-.11*technique);
     const rotatedX=vx*c-vy*t,rotatedY=vx*t+vy*c;
     vx=rotatedX*preserved;vy=rotatedY*preserved;
   }
   const alignment=spd>.15?(vx*dx+vy*dy)/(Math.hypot(vx,vy)*norm):1;
   const traction=clamp(.90+(p.AGI-70)*.0027,.74,1.0);
   const turnLoad=clamp(1-alignment,0,2);
   const planting=clamp(1-turnLoad*(.10+(95-p.AGI)*.0031),.56,1);
   const footwork=clamp((.60+p.AGI*.009)*Math.pow(98/mass(p),.20)*p.balance*routeFoot,.50,2.0);
   // Active foot plant converts sideways skating into turn/braking energy;
   // heavyweight players still take a wider arc than agile skill positions.
   const lateral=vx*(-dy)+vy*dx;
   // The planted foot still turns the body, but an agile pursuer no longer
   // scrubs off almost all sideways speed after the momentum rotation.
   const pursuitBrake=p.team===1&&fullPursuit?clamp(.50-(p.AGI-60)*.004,.35,.55):1;
   // At contact distance, commit to the ball carrier instead of endlessly
   // orbiting him on leftover lateral velocity. Preserve turning limits at
   // longer distances and keep this correction limited to live pursuit.
   const tackleApproach=p.team===1&&fullPursuit&&ballCarrier&&goalDistance<3.4;
   const closeControl=tackleApproach?1.65:1;
   const sidewaysBrake=clamp((2.5+footwork*2.9)*dt*(alignment<.80?1:.43)*pursuitBrake*closeControl,0,tackleApproach?.34:.22);
   vx+=dy*lateral*sidewaysBrake;vy-=dx*lateral*sidewaysBrake;
   if(alignment<.05){
     const backwards=Math.max(0,-(vx*dx+vy*dy));
     const brake=clamp((.85+footwork*.95)*dt,0,.10);
     vx+=dx*backwards*brake;vy+=dy*backwards*brake;
   }
   const turnAssist=1+clamp(turnLoad*.44*footwork,0,.60);
   const releaseDrive=p.releaseSlow>0?clamp(.36+(p.REL-30)*.0045,.37,.69):p.releaseBurst>0?clamp(1.08+(p.REL-65)*.002,1.02,1.17):1;
   const routeDrive=p.intent.startsWith('route')&&p.routeBreakTime>0?clamp(.93+(p.CUT-70)*.0048,.76,1.07):1;
   // v0.25: a small off-the-mark stride assist. It fades by jogging speed,
   // so ACC still controls launch, SPD remains the absolute top-speed cap,
   // and a moving player receives no artificial speed boost.
   const earlyStride=1+.16*clamp((3.2-spd)/3.2,0,1);
   // Fast initial acceleration until ~85% of the player's *own* rated
   // ceiling, a mild taper near 90%, and a tougher final 95-100%. A 75 SPD
   // defender can never reach a 95 SPD runner's ceiling via this curve.
   const speedFraction=clamp(spd/Math.max(.1,maxSpeed(p)),0,1);
   const accelerationCurve=speedFraction<=.84?1.43:
      speedFraction<=.90?1.43-(speedFraction-.84)/.06*.25:
      speedFraction<=.95?1.18-(speedFraction-.90)/.05*.20:
      .98-(speedFraction-.95)/.05*.17;
   // Faster first steps for skill positions without changing sprint, rated
   // ceiling, or the existing high-end acceleration taper.
   const launch=launchAssist(p,speedFraction);
   const force=acceleration(p)*earlyStride*accelerationCurve*launch*(.67+.33*p.stam)*boost*norm*traction*planting*turnAssist*releaseDrive*routeDrive;
   vx+=dx/norm*force*dt;vy+=dy/norm*force*dt;
   p.dirX=dx;p.dirY=dy;
   // Ratings-driven endurance. Sustained RT sprint still consumes stamina,
   // and sprinting players cannot instantly regenerate while holding RT.
   const endurance=clamp(.79+(p.STA-65)*.0085,.70,1.13);
   // Efficient sprint effort: gradual drain at middle speeds, rising steeply
   // when approaching max rated SPD. Player STA softens the energy cost.
   const gear=clamp(speed(p)/Math.max(.01,maxSpeed({...p,stam:1})),0,1);
   const topEnd=clamp((gear-.72)/.28,0,1);
   const eliteTop=clamp((p.SPD-89)/10,0,1);
   const spent=p.sprinting?(.033+.017*topEnd+.012*topEnd*topEnd*eliteTop):
     (boost>1.05?.024:.007);
   p.stam=Math.max(0,p.stam-dt*spent/endurance);
   // Conserving effort actually recovers energy during a controlled jog.
   // Full sprint carries its own increasing cost near rated top speed.
   if(!p.sprinting&&norm>.15&&p.stam<1){
     const easyPace=clamp(1-speed(p)/Math.max(1,maxSpeed(p)),0,1);
     p.stam=Math.min(1,p.stam+dt*(.017+.024*easyPace)*endurance);
   }
 }else{p.sprinting=false;p.stam=Math.min(1,p.stam+dt*.007*clamp(p.STA/75,.7,1.3))}
 const drag=norm>.1?(p.team===1&&fullPursuit?.245:.28):3.7;
 vx*=Math.max(0,1-drag*dt);vy*=Math.max(0,1-drag*dt);
 // A right-stick cut has a deliberately short sideways *velocity profile*.
 // Previous versions only added a small force, which forward left-stick
 // steering immediately canceled at full speed. A plant briefly trades some
 // forward velocity for lateral travel while respecting the SPD speed cap.
 if(p.jukeDrive&&p.jukeDrive.remaining>0){
  const j=p.jukeDrive,progress=1-j.remaining/j.duration;
  const agility=clamp(.67+(p.AGI-60)*.012,.36,1.16);
  const effort=(.36+.64*j.power)*agility;
  const targetLateral=(8.0+Math.max(0,p.CUT-70)*.023+Math.max(0,p.JUK-70)*.022)*effort;
  // Quick plant and lateral shift, then begin a physical replant rather
  // than endlessly sliding toward the sideline.
  const envelope=progress<.11?progress/.11:progress<.70?1:clamp((1-progress)/.30,0,1);
  const currentLateral=vx*j.nx+vy*j.ny;
  const delta=clamp(targetLateral*envelope-currentLateral,-60*dt,60*dt);
  vx+=j.nx*delta;vy+=j.ny*delta;
  // A juke is a short sideways plant, not a diagonal sprint. Reduce the
  // forward component at the peak of the cut; then recover it naturally as
  // the envelope fades. A sharper AGI/CUT player can plant closer to 90°.
  const plantSkill=clamp((p.JUK*.40+p.CUT*.29+p.AGI*.21+p.ACC*.10-48)/51,0,1);
  // Better cutting technique preserves forward momentum. A lateral cut must
  // still trade some forward speed: don't exceed the SPD cap or teleport.
  const forwardLimit=maxSpeed(p)*(1-(.64-.24*plantSkill)*envelope);
  const forwardSpeed=vx*j.fx+vy*j.fy;
  if(forwardSpeed>forwardLimit){
   const plantBrake=Math.min(forwardSpeed-forwardLimit,70*dt);
   vx-=j.fx*plantBrake;vy-=j.fy*plantBrake;
  }
  j.remaining=Math.max(0,j.remaining-dt);
  if(j.remaining<=0){p.jukeDrive=null;p.jukeRecovery=clamp(.18+.21*plantSkill,.18,.39);}
 }

 let s=Math.hypot(vx,vy);
 // Two genuine gears: steady running and full sprint. Releasing RT now
 // decreases the available speed, so a sprinting DB can gain ground on a
 // non-sprinting runner. This applies equally to human and AI athletes.
 // Burst is a short acceleration kick, not permanent 20% extra top speed.
 const burstCeiling=1; // SPD rating is an absolute self-powered ceiling, even during burst
 const targetCap=maxSpeed(p)*(p.sprinting?1:.84)*(p.covering?.92:1)*burstCeiling;
 if(p.gaitCap===null||!Number.isFinite(p.gaitCap))p.gaitCap=targetCap;
 const capRise=dt*clamp(5+(p.ACC-65)*.065,3,8);
 const capFall=dt*clamp(4.4+(p.AGI-65)*.040,3.2,6.2);
 p.gaitCap+=clamp(targetCap-p.gaitCap,-capFall,capRise);
 if(s>p.gaitCap){vx*=p.gaitCap/s;vy*=p.gaitCap/s}
 p.vx=vx;p.vy=vy;
}
// Deliberate braking prevents orbiting a completed route or an idle assignment.
function arrive(p,tx,ty,dt,boost=1){
 const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),v=speed(p);
 if(d<.38){if(v>.35)steer(p,-p.vx,-p.vy,dt,.94);else steer(p,0,0,dt);return}
 const closing=(p.vx*dx+p.vy*dy)/Math.max(.1,d);
 const stopDistance=Math.max(0,closing)**2/(2*Math.max(1,acceleration(p)*.80));
 if(stopDistance>d*.87&&closing>.5){steer(p,-p.vx,-p.vy,dt,.99);return}
 steer(p,dx,dy,dt,boost);
}
function resolvePressMatchups(){
 if(RUNS.has(selectedPlay))return;
 for(const d of def){
  if(d.assignment?.kind!=='man'||d.ground)continue;
  const p=P(d.assignment.target);
  if(!p||!['WR','TE'].includes(p.pos)||dist(d,p)>3.9)continue;
  const win=p.REL*.44+p.HND*.28+p.AGI*.16+p.STR*.12;
  const resist=d.PRS*.47+d.JAM*.29+d.STR*.15+d.MIR*.09;
  const margin=win-resist+(rand()-.5)*8;
  p.pressOpponent=d.key;
  if(margin<-2){
   p.releaseSlow=clamp(.22+(-margin-2)*.008,.22,.58);
   p.pressResult='jammed';d.pressResult='jammed';
  }else if(margin>2){
   p.releaseBurst=clamp(.19+(margin-2)*.006,.19,.47);
   p.pressResult='clean-release';d.pressResult='beaten-release';
   d.mirrorDelay=clamp((margin-2)*.002,.0,.12);
  }else{p.pressResult='even';d.pressResult='even';}
 }
}
function handleRouteBreak(p,oldIdx,newIdx){
 const r=p.route;if(!r||newIdx>=r.length)return;
 // The first point is the initial stem; later points are actual cuts.
 if(newIdx<1)return;
 const from=newIdx===1?[p.spawnX,p.spawnY]:r[newIdx-2];
 const vertex=r[newIdx-1],to=r[newIdx];
 const ax=vertex[0]-from[0],ay=vertex[1]-from[1];
 const bx=to[0]-vertex[0],by=to[1]-vertex[1];
 const ma=Math.hypot(ax,ay),mb=Math.hypot(bx,by);
 if(ma<.01||mb<.01)return;
 const bend=Math.acos(clamp((ax*bx+ay*by)/(ma*mb),-1,1));
 if(bend<.34)return;
 const isDouble=selectedPlay==='sluggo'&&newIdx===2&&(p.key==='WR1'||p.key==='WR2');
 p.routeBreaks++;
 p.routeBreakTime=clamp((.20+bend*.15)*(p.routeVariation?.tempo||1),.20,.49);
 const matched=def.find(d=>d.assignment?.kind==='man'&&d.assignment.target===p.key&&!d.ground);
 if(matched&&!p.prediction){
  // A route break creates finite defensive reaction delay. Excellent mirrors
  // read earlier and stay plastered; poor mirrors are later to redirect.
  const skill=p.CUT*.43+p.RTE*.35+p.AGI*.22;
  const guard=matched.MIR*.38+matched.COV*.20+matched.RCR*.42;
  const fakeSkill=p.DBL*.55+p.RTE*.25+p.HND*.20;
  const discipline=matched.DIS*.54+matched.RCR*.29+matched.AWR*.17;
  const fake=isDouble?fakeSkill-discipline:0;
  // Good defenders read route cuts sooner; elite WRs can still separate on a
  // real change of direction. No instant separation or predetermined win.
  const delay=clamp(.078+bend*.034+(skill-guard)*.0040+(isDouble?Math.max(-8,fake)*.0043:0)+(matched.coverageVariation?.react||0),.025,.39);
  matched.mirrorDelay=Math.max(matched.mirrorDelay,delay);
  matched.routeReadCount++;
  if(isDouble&&fake>12){
   // Low-discipline defenders physically take a *false step* toward the
   // selling slant. It is brief, capped and steer-driven, not teleportation.
   const direction=Math.sign(ay)||1;
   const duration=clamp(.10+(fake-12)*.006,.10,.27);
   matched.falseStep={until:playClock+duration,x:matched.x+.35,y:matched.y+direction*clamp(.55+(fake-12)*.040,.55,1.6)};
   p.doubleMoveWins++;
  }
 }
}
// Once an initial route ends, keep helping the QB. Pick reachable open space
// based on defenders and other receivers. No fixed waypoint or random wandering.
// Before the QB crosses LOS, this is still a pass route, NOT downfield blocking.
function scrambleOpenSpace(p){
 const qb=P('QB'),forward=qb&&qb.x>playStart-3.0&&qb.vx>1.2;
 const options=[];
 // A receiver may work underneath, deeper, or horizontally across coverage.
 // Slow receivers prefer shorter windows; smarter route runners anticipate them.
 const longBreak=clamp((p.RTE*.48+p.AWR*.33+p.CUT*.19-60)/39,.2,1);
 const depth=[-3,2.5,6+longBreak*2.3];
 const lateral=[-8,-4,0,4,8];
 const minX=Math.max(playStart+1.2,(qb?.x||playStart)+2.0);
 for(const dx of depth)for(const dy of lateral){
  const x=clamp(p.x+dx,Math.min(minX,108.2),108.2),y=clamp(p.y+dy,2.4,H-2.4);
  const move=Math.hypot(x-p.x,y-p.y);
  if(move<1.3||move>12.5)continue;
  const threats=def.filter(d=>!d.ground).map(d=>Math.hypot(x-(d.x+d.vx*.17),y-(d.y+d.vy*.17))).sort((a,b)=>a-b);
  const separation=(threats[0]||10)*.84+(threats[1]||12)*.18;
  const others=off.filter(o=>o!==p&&o.pos!=='QB'&&o.pos!=='RB').map(o=>dist(o,{x,y}));
  const spacing=others.length?Math.min(...others):10;
  // Stayout-of-bounds buffer; the QB needs a sensible throwing lane.
  const nearSide=Math.min(y,H-y);
  const qbProximity=qb?Math.hypot(x-qb.x,y-qb.y):15;
  const passLane=qb?Math.abs(y-qb.y)/Math.max(3,x-qb.x):0;
  const score=separation*2.2+Math.min(spacing,11)*.63+Math.min(nearSide,5)*.18
     -Math.abs(move-5.2)*.23 -Math.max(0,qbProximity-30)*.23
     -Math.max(0,passLane-1.4)*1.2
     +(forward?Math.max(0,5-Math.abs(y-qb.y))*.23:0)
     +(dx>0? .5:0);
  options.push({x,y,score});
 }
 options.sort((a,b)=>b.score-a.score);
 return options[0]||{x:clamp(p.x+2,7,108),y:clamp(p.y+(p.y<26.6?3:-3),2.4,H-2.4)};
}
function scrambleRouteAI(p,dt){
 // A receiver can continue his scramble drill only while a legal forward pass
 // is still available. QB possession beyond the LOS is handled by ballCarrier.
 const done= !p.scrambleTarget || playClock>=p.scrambleReplanAt ||
  dist(p,p.scrambleTarget)<1.4;
 if(done){
  p.scrambleTarget=scrambleOpenSpace(p);
  p.scrambleReplanAt=playClock+clamp(.50+(100-p.AWR)*.006,.5,.82);
  p.scrambleStepCount=(p.scrambleStepCount||0)+1;
 }
 p.intent='scramble-open';p.intentTarget='space-'+p.scrambleStepCount;
 // No braking at the terminal route point. Keep feet moving on timed breakouts.
 const t=p.scrambleTarget;
 steer(p,t.x-p.x,t.y-p.y,dt,clamp(.92+(p.CUT-70)*.004+(p.RTE-70)*.002,.78,1.14));
}
function AIroute(p,dt){
 p.intent='route';const r=p.route;
 if(!r){p.intent='hold';arrive(p,p.spawnX,p.spawnY,dt);return}
 // Real route end is a physical arrival, not just reaching the last index.
 let pt=r[Math.min(p.routeIdx,r.length-1)];
 if(!p.routeComplete&&Math.hypot(pt[0]-p.x,pt[1]-p.y)<1.5){
  if(p.routeIdx<r.length-1){const old=p.routeIdx;p.routeIdx++;handleRouteBreak(p,old,p.routeIdx);pt=r[p.routeIdx]}
  else {p.routeComplete=true;p.scrambleReplanAt=0}
 }
 p.releaseSlow=Math.max(0,p.releaseSlow-dt);p.releaseBurst=Math.max(0,p.releaseBurst-dt);
 p.routeBreakTime=Math.max(0,p.routeBreakTime-dt);
 if(p.routeComplete){scrambleRouteAI(p,dt);return}
 p.intent=p.routeIdx===r.length-1?'route-final-stem':'route';
 p.intentTarget='waypoint-'+p.routeIdx;
 // Mesh crossers make small, skill-dependent adjustments for real traffic.
 // Keep the original route target and timing; only change the steering vector.
 const avoid=CoverageRoutePolicy.meshAvoidance(p,off,selectedPlay);
 steer(p,pt[0]-p.x+avoid.x*4.5,pt[1]-p.y+avoid.y*4.5,dt,(p.routeIdx===0?1.03:1)*(p.routeVariation?.tempo||1));
}
function closestThreat(p,filter){let best=null,bd=999;for(let d of filter){let dd=dist(p,d);if(dd<bd){bd=dd;best=d}}return {p:best,d:bd}}
function targetDef(d){return d.assignment?.kind==='man'?P(d.assignment.target):null}
// Run fits are assigned before the snap. Defenders recognize *visual* cues at
// different delays; a coverage player doesn't magically know the offensive call.
const FITS={
 EDGE1:['force-left',19], EDGE2:['force-right',34], DT:['gap-left',24],
 DT2:['gap-right',29], NT:['gap-middle',26.6], DE3A:['gap-left',22], DE3B:['gap-right',31],
 MLB:['fill-left',22], OLB:['cutback',31], WILL:['fill-left',20], SAM:['force-right',35],
 CB1:['force-left',8], CB2:['force-right',45], CB3:['alley',18],
 FS:['last-line',18], SS:['last-line',36]
};
function runFitFor(d){let [role,lane]=FITS[d.key]||['fill-left',26];
 if(d.key==='CB3'&&d.spawnY>26){role='alley';lane=35}
 return {role,lane};
}
function hasRunCue(){
 const rg=P('RG'),rb=P('RB');
 // A pulling guard or back accelerating into the mesh can reveal a run.
 const pulling=rg && (rg.spawnY-rg.y)>.40 && rg.x<playStart+.2;
 const mesh=rb&&(rb.x-rb.spawnX)>1.15;
 return !!(ballCarrier===rb||pulling||mesh);
}
function recognizeRun(d){
 if(!RUNS.has(selectedPlay))return false;
 if(d.runRead)return true;
 // Nearby defenders can recognize the football sooner than a deep DB.
 const local=ballCarrier&&dist(d,ballCarrier)<3.4;
 // Once a handoff is established, deep defenders can recognize the shared
 // backfield/teammate cues even if their eyes are temporarily on a receiver.
 // Require a rating-sensitive read window plus a short post-handoff confirmation;
 // this never reveals a run before the football is actually handed off.
 const confirmedHandoff=ballCarrier===P('RB')&&
   playClock>=d.readAt+((d.pos==='FS'||d.pos==='SS')?.16:.12);
 if((local||playClock>=d.readAt)&&hasRunCue()&&
    (InsideZoneIQ.visible(d,ballCarrier||P('RB'))||local||confirmedHandoff)){
  d.runRead=true;d.readAtTime=playClock;
  return true;
 }
 return false;
}
function runFitAI(d,dt){
 const fit=d.fit||runFitFor(d),role=fit.role,inner=role.includes('gap')||role.includes('fill');
 const anchoredGap=fit.gapSpot??DefensivePresnap.gapTarget(d,off,playStart);
 let x=anchoredGap?.x??playStart+(inner?(role.startsWith('gap')?.9:3.2):role.includes('force')?2.0:6.2);
 let y=anchoredGap?.y??fit.lane;
 // A defender must actually be facing the running back to update his fit.
 // Do not rotate 180° toward a runner outside the player's field of view.
 const a=ballCarrier||P('RB');
 const seesRunner=a&&InsideZoneIQ.visible(d,a);
 if(a&&d.runRead&&seesRunner){
  const weight=clamp((d.PRC-35)/80,.20,.78);
  if(inner)y+=clamp(a.y-y,-5.5,5.5)*weight;
  else if(role==='cutback')y+=clamp(a.y-y,-6,6)*.26;
  else if(role==='alley')y+=clamp(a.y-y,-7,7)*.43;
 }
 d.intent='run-fit';d.intentTarget=role;
 if(selectedPlay==='inside'&&d.runRead&&seesRunner&&!d.ground&&d.blocked<.20&&
    playClock>.29&&dist(d,a)>3.4&&dist(d,a)<13){
  const response=InsideZoneIQ.response(d,off.filter(o=>['LT','LG','C','RG','RT','TE','FB'].includes(o.key)),a,role);
  // Stay near the designed gap: beating a block is not permission to abandon
  // an entire side of the formation to chase an imagined future cut.
  if(response&&Math.abs(response.y-fit.lane)<4.0){
   d.intent='run-block-read';d.intentTarget=response.blocker;
   steer(d,x+.3-d.x,y+(response.y-d.y)*.48-d.y,dt,.98);return;
  }
 }
 if(role.startsWith('gap'))steer(d,x-d.x,y-d.y,dt,.97);
 else arrive(d,x,y,dt,1.05);
}
// Estimate how far the defender can drive along each candidate path by
// its arrival time. Project current momentum onto the path so turning back
// costs time, and use rated acceleration and the current fatigue ceiling.
function interceptT(d,a,sep){
 if(sep<5.5)return .025;
 const cap=maxSpeed(d);
 const drive=acceleration(d)*1.43*(.67+.33*d.stam);
 const horizon=.85+.45*RunPursuitPolicy.quality(d);
 let best=.10,bestMiss=Infinity;
 for(let t=.10;t<=horizon+.001;t+=.10){
  const x=clamp(a.x+a.vx*t,10,110),y=clamp(a.y+a.vy*t,.45,H-.45);
  const dx=x-d.x,dy=y-d.y,gap=Math.hypot(dx,dy);
  const initial=clamp((d.vx*dx+d.vy*dy)/Math.max(.01,gap),-cap,cap);
  const driveTime=Math.min(t,(cap-initial)/drive);
  const reach=initial*driveTime+.5*drive*driveTime*driveTime+cap*(t-driveTime);
  const miss=gap-reach;
  if(miss<=.65)return t;
  if(miss<bestMiss){best=t;bestMiss=miss;}
 }
 return best;
}
function pursuitAim(d,a){
 const sep=dist(d,a),fit=d.fit||runFitFor(d);
 const role=d.kickCoverageRole||fit.role;
 const observed=sep>=5.5?ChaosPursuitReaction.observeVelocity(d,a,playClock):a;
 if(sep<5.5)d.pursuitVelocityRead=null;
 const track={x:a.x,y:a.y,vx:observed.vx,vy:observed.vy};
 const t=interceptT(d,track,sep);
 let tx=a.x+track.vx*t,ty=a.y+track.vy*t;
 let mode='close';
 if(sep>5.5){
  // Keep the outside shoulder from being surrendered early, but never chase
  // a predefined lane behind the live runner.
  if(role==='force-left'&&a.y<26.6){ty=Math.min(ty,a.y-.65);mode='edge-contain'}
  else if(role==='force-right'&&a.y>26.6){ty=Math.max(ty,a.y+.65);mode='edge-contain'}
  else if(role==='cutback'&&Math.abs(a.y-26.6)>7){ty=ty*.88+26.6*.12;mode='cutback'}
  else if(role==='last-line'&&d.x>a.x+3){
   // Deep safety protects the goal line before closing. As the runner nears,
   // the safety must still come downhill to actually make the tackle.
   tx=Math.max(tx,a.x+.60);mode='last-line';
  }
 }
 if(sep<5.5)mode='tackle';
 // Never aim *behind* the runner just because the defender trails him.
 if(d.x<a.x-1&&a.vx>1.2)tx=Math.max(tx,a.x+.10);
 tx=clamp(tx,10,110);ty=clamp(ty,.45,H-.45);
 const base={x:tx,y:ty,lead:t,mode,sep,role};
 // Track only where the live runner has physically been on this play.
 // We do not infer a route or read an unsnapped offensive play call.
 if(ballCarrier===a&&!specialState&&Number.isFinite(a.x)){
  if(!Number.isFinite(a.pursuitHighX))a.pursuitHighX=a.x;
  a.pursuitHighX=Math.max(a.pursuitHighX,a.x);
  // Learn the *observed* backward/outside escape only after the whistle.
  // This is not an observation of the hidden play or an instant AI adjustment.
  if(currentMemoryPlay?.kind==='run'&&currentMemoryPlay.team===possession){
   const side=a.y<H/2?-1:1;
   if(Math.abs(a.y-H/2)>5&&(a.vy||0)*side>1.1&&a.pursuitHighX-a.x>2.2){
    currentMemoryPlay.retreatSide=side<0?'left':'right';
   }
  }
 }
 const planned=RunPursuitPolicy.plan(d,track,base,{fieldWidth:H,
  peakX:a.pursuitHighX,enabled:ballCarrier===a&&!specialState});
 return ChaosPursuitReaction.aim(d,a,planned,playClock);
}
// A back stretching horizontally behind the line can still turn upfield.
// The outside corner protects that exit and the safety protects depth while
// the front pursues the current path. Release the hedge on an upfield cut.
function runContainmentAim(d,a,aim){
 if(!d.runRead||a.x>=playStart)return aim;
 const observed=d.pursuitVelocityRead;
 if(!observed||Math.abs(observed.vy)<=Math.abs(observed.vx)+1.1)return aim;
 const side=Math.sign(observed.vy);
 const force=aim.role===(side<0?'force-left':'force-right')&&d.pos==='CB';
 const safety=aim.role==='last-line';
 if(!force&&!safety)return aim;
 const depth=Math.min(109,playStart+(force?3:7));
 const y=force?side*Math.max(side*aim.y,side*d.spawnY-3):aim.y;
 return {...aim,x:Math.max(aim.x,depth),y,mode:force?'edge-contain':'last-line',holdLeverage:true};
}
function pursuitAI(d,a,dt){
 const aim=runContainmentAim(d,a,pursuitAim(d,a));
 d.pursuitPoint=aim;
 const rating=clamp(.95+(d.PUR-70)*.0032,.82,1.11);
 d.intent=['edge-contain','retreat-contain'].includes(aim.mode)?'contain':aim.mode==='last-line'?'safety-angle':'pursue';
 d.intentTarget=aim.role;
 const effort=rating*(d.blocked>0?.54:1);
 if(aim.holdLeverage)arrive(d,aim.x,aim.y,dt,effort);
 else steer(d,aim.x-d.x,aim.y-d.y,dt,effort);
}
// Reserve each wide receiver's *own* outside corner on designed runs.
// In Cover 1, use the defender whose man assignment is this receiver. In zone,
// match the aligned corner on the same side. A receiver does NOT automatically
// chase the nearest linebacker toward midfield merely because he moved closer.
function assignRunBlockMatches(){
 const receivers=off.filter(o=>o.pos==='WR');
 const available=new Set(def.filter(d=>!d.rush).map(d=>d.key));
 // Outside receivers get the outside corners first; don't steal CB1 for a
 // slot receiver when a base defense has only two corners.
 for(const o of [...receivers].sort((a,b)=>Math.abs(b.spawnY-26.65)-Math.abs(a.spawnY-26.65))){
  const assigned=def.find(d=>available.has(d.key)&&d.assignment?.kind==='man'&&d.assignment.target===o.key);
  const sameSide=def.filter(d=>available.has(d.key)&&d.pos==='CB'&&Math.sign(d.spawnY-26.65)===Math.sign(o.spawnY-26.65));
  const pick=assigned||sameSide.sort((a,b)=>Math.abs(a.spawnY-o.spawnY)-Math.abs(b.spawnY-o.spawnY))[0]
       ||def.filter(d=>available.has(d.key)&&d.pos!=='CB'&&Math.abs(d.spawnY-o.spawnY)<16).sort((a,b)=>Math.abs(a.spawnY-o.spawnY)-Math.abs(b.spawnY-o.spawnY))[0]
       ||def.filter(d=>available.has(d.key)).sort((a,b)=>Math.abs(a.spawnY-o.spawnY)-Math.abs(b.spawnY-o.spawnY))[0];
  if(pick){o.primaryRunBlock=pick.key;available.delete(pick.key)}
 }
}
// Run-blocking WRs defend a *lane*, not the ball carrier's position.
// A CB cutting all the way across the field to chase the runner should not drag
// the outside WR into the middle. Keep the aligned matchup while reachable;
// otherwise locate the closest threat to the WR inside his home lane.
function receiverRunBlock(o,dt,claims,carrier=null){
 const primary=o.primaryRunBlock?P(o.primaryRunBlock):null;
 const engaged=blockLinks.get(o.key);
 const laneWidth=o.key==='WR3'?9.0:8.0;
 const homeY=o.spawnY;
 const onAssignmentSide=d=>d&&!d.ground&&d.beatenUntil<playClock&&
   Math.abs(d.y-homeY)<=laneWidth&&
   Math.sign(d.y-26.65)===Math.sign(homeY-26.65)&&
   dist(o,d)<15.5;
 let target=null;
 // Finishing an existing engagement always takes precedence over chasing a
 // new defender. Release only if the original opponent has truly escaped the
 // receiver's outside blocking lane or won the block.
 if(engaged){const existing=P(engaged.defender);
  if(onAssignmentSide(existing))target=existing;
 }
 if(!target&&onAssignmentSide(primary)&&!claims.has(primary.key))target=primary;
 if(!target){
  const otherAssignments=new Set(off.filter(w=>w!==o&&w.pos==='WR'&&w.primaryRunBlock).map(w=>w.primaryRunBlock));
  const inLane=def.filter(d=>onAssignmentSide(d)&&!claims.has(d.key)&&d.key!==o.beatenTarget&&
    !otherAssignments.has(d.key)&&
    ['CB','SS','FS','LB','OLB','MLB'].includes(d.pos));
  // Distance FROM THE RECEIVER is the principal selection criterion, not the
  // distance to the carrier or which defender happens to pursue the runner.
  inLane.sort((a,b)=>{
   const score=d=>dist(o,d)+Math.abs(d.y-homeY)*.18+(d.pos==='CB'?-1.4:0);
   return score(a)-score(b);
  });
  target=inLane[0]||null;
 }
 if(target){
  claims.add(target.key);o.intent='run-block';o.intentTarget=target.key;
  const lead=clamp(.12+dist(o,target)/35,.16,.37);
  const tx=target.x+target.vx*lead-.48;
  const lane=clamp(target.y+target.vy*lead,Math.max(.8,homeY-laneWidth),Math.min(H-.8,homeY+laneWidth));
  // A moving corner is not a stationary waypoint: accelerate into the block
  // rather than braking just before making contact.
  if(dist(o,target)>1.1)steer(o,tx-o.x,lane-o.y,dt,1.12);
  else arrive(o,tx,lane,dt,1.0);
  if(dist(o,target)<2.12)blockBattle(o,target,dt);
 }else{
  // No corner in reach? Hold an outside stalk position and wait for a threat.
  // Do not escort toward the RB's y-coordinate in the middle of the field.
  o.intent='edge-stalk';o.intentTarget=primary?.key||'outside-lane';
  const advance=carrier?Math.min(carrier.x+3.1,playStart+13):playStart+6;
  const x=clamp(Math.max(o.x,advance),playStart+.6,109);
  arrive(o,x,homeY,dt,.93);
 }
}
// Forecast the danger of a defender reaching the live carrier. The estimate
// uses motion, defender top speed, acceleration, PUR and tackling technique.
// It is a stable threat estimate, not a random "choose somebody" roll.
function defenderTackleThreat(d,a){
 const sep=Math.max(.1,dist(d,a)),nx=(a.x-d.x)/sep,ny=(a.y-d.y)/sep;
 const defenderMax=Math.max(2,maxSpeed(d));
 const currentToward=d.vx*nx+d.vy*ny;
 const carrierAway=a.vx*nx+a.vy*ny;
 const approach=clamp(currentToward/defenderMax,-1,1);
 const anticipation=clamp((d.PUR-40)/60,.08,.94);
 const look=clamp(sep/(defenderMax+2)*(.25+.27*anticipation),.08,.58);
 const tx=a.x+a.vx*look,ty=a.y+a.vy*look;
 const interceptGap=Math.hypot(tx-d.x,ty-d.y);
 // Acceleration affects how soon the defender can exploit the pursuit angle.
 const attainable=clamp(Math.max(0,currentToward)+acceleration(d)*.62,2.6,defenderMax);
 const eta=clamp(Math.max(0,interceptGap-1.15)/attainable,.04,5);
 const tackles=clamp((d.TAK*.42+d.PUR*.33+d.ACC*.18+d.AWR*.07)/100,.25,.99);
 const behind=a.x>d.x+3&&a.vx>1.5;
 const relativeClosing=currentToward-carrierAway;
 const trailing=behind&&relativeClosing<0?clamp(.58+relativeClosing*.055,.22,.75):1;
 const readiness=clamp(.76+approach*.24,.52,1);
 const timeUrgency=1/(.32+Math.pow(eta,1.20));
 const risk=clamp(44*tackles*timeUrgency*readiness*trailing,0,100);
 return {risk,eta,sep,closing:relativeClosing};
}
// A high-threat defender matters only if this blocker can realistically
// reach him. This also prevents a WR chasing a defensive tackle across the
// field after a short completion. Ratings determine strength of a contest.
function blockTargetMerit(o,d,a,assigned=null){
 const danger=defenderTackleThreat(d,a),reach=dist(o,d);
 const blockerVelocity=Math.max(2.2,Math.min(maxSpeed(o),speed(o)+acceleration(o)*.65));
 const blockEta=Math.max(0,reach-1.40)/blockerVelocity;
 const chance=clamp(.73+(danger.eta-blockEta)*.30,.22,1.12);
 const physical=clamp((o.BLO*.47+o.IBL*.25+o.STR*.28)-(d.PMV*.5+d.STR*.5),-35,35);
 const current=blockLinks.get(o.key)?.defender===d.key;
 const previous=o.supportTarget===d.key&&playClock<(o.supportUntil||0);
 const matchup=assigned===d?3.6:0;
 // Threat leads, but nearby opponents remain worth blocking before they close.
 return danger.risk*chance + (Math.max(0,9-reach)*.72) + matchup
   + (current?23:0) + (previous?7:0) + physical*.075 - reach*.74
   - Math.max(0,blockEta-danger.eta)*8;
}
// Dynamic blocking intercept: meet the dangerous defender on his route to
// the carrier rather than chasing a defender's old position. Re-evaluate
// every physics tick so the intercept moves immediately when defenders cut.
function blockInterceptPoint(o,d,a){
 const incoming=defenderTackleThreat(d,a);
 const blockerSpeed=Math.max(2.0,Math.min(maxSpeed(o),speed(o)+acceleration(o)*.38));
 const arrival=clamp((dist(o,d)-1.3)/blockerSpeed,.05,.46);
 const lead=clamp(Math.min(arrival,incoming.eta*.62),.045,.38);
 const velocityX=d.x+d.vx*lead,velocityY=d.y+d.vy*lead;
 const towardX=a.x-d.x,towardY=a.y-d.y,sep=Math.max(.1,Math.hypot(towardX,towardY));
 const align=clamp((d.vx*towardX+d.vy*towardY)/(Math.max(.1,speed(d))*sep),-1,1);
 const anticipation=clamp((d.PUR-45)/55,.10,.95);
 const more=align>.15 ? clamp(.12*anticipation*(1-arrival/.6),0,.11):0;
 const projectedX=velocityX+(towardX/sep)*maxSpeed(d)*more;
 const projectedY=velocityY+(towardY/sep)*maxSpeed(d)*more;
 // Intercept on the carrier side of the target without running past him.
 const angle=Math.atan2(a.y-projectedY,a.x-projectedX),offset=clamp(.36+(o.BLO-65)*.002,.30,.48);
 return {x:clamp(projectedX+Math.cos(angle)*offset,10,109.5),
         y:clamp(projectedY+Math.sin(angle)*offset,.5,H-.5),
         eta:incoming.eta,threat:incoming.risk};
}
function bestLiveBlockTarget(o,a,options,claims,assigned=null){
 const ranked=options.filter(d=>!claims.has(d.key)).map(d=>({d,merit:blockTargetMerit(o,d,a,assigned)}))
  .sort((q,r)=>r.merit-q.merit);
 return ranked[0]?.merit>0?ranked[0].d:null;
}
// Receivers go from route-running to threat-aware downfield blocking. They
// prioritize an imminent tackler near their own route location, not a distant
// DL or whoever was first to chase the runner. Current blocks persist until
// contact truly breaks; new targets are held briefly to prevent oscillation.
function receiverAfterCatchBlock(o,a,dt,claims){
 const linked=blockLinks.get(o.key),current=linked?P(linked.defender):null;
 const assigned=def.find(d=>d.assignment?.kind==='man'&&d.assignment.target===o.key);
 const eligible=d=>d&&!d.ground&&d.stun<.65&&d.beatenUntil<playClock&&
  d.key!==o.beatenTarget&&dist(o,d)<11.5&&d.x>=a.x-9&&d.x<=a.x+17;
 let target=null;
 if(current&&!current.ground&&dist(o,current)<2.75)target=current;
 if(!target){
  const options=def.filter(eligible);
  const best=bestLiveBlockTarget(o,a,options,claims,assigned);
  const previous=options.find(d=>d.key===o.supportTarget&&!claims.has(d.key));
  if(previous&&playClock<(o.supportUntil||0)&&
     (!best||blockTargetMerit(o,previous,a,assigned)>=blockTargetMerit(o,best,a,assigned)-8))target=previous;
  else target=best;
 }
 if(target){
  claims.add(target.key);o.supportTarget=target.key;o.supportUntil=playClock+.30;
  o.intent='catch-block';o.intentTarget=target.key;
  const intercept=blockInterceptPoint(o,target,a);
  o.blockApproach=intercept;
  // Replan every physics frame; don't follow a stale waypoint after a cut.
  if(dist(o,target)>1.12)steer(o,intercept.x-o.x,intercept.y-o.y,dt,1.13);
  else arrive(o,intercept.x,intercept.y,dt,1.0);
  if(dist(o,target)<2.12)blockBattle(o,target,dt);
  return;
 }
 o.supportTarget=null;o.supportUntil=0;
 // If nobody nearby threatens the carrier, screen off the lane from the WR's
 // current route position rather than jogging toward a random inside lineman.
 o.intent='catch-screen';o.intentTarget=a.key;
 const tx=clamp(Math.max(o.x,a.x+1.2),10,109);
 const ty=clamp(o.y+(a.y-o.y)*.075,.8,H-.8);
 arrive(o,tx,ty,dt,.95);
}
// After the handoff/catch, receivers become downfield blockers, backs provide
// protection, and OL leave pass-protection routes to locate immediate threats.
// Stable targets plus claims keep six blockers from chasing the same defender.
function runSupportAI(o,a,dt,claims){
 if(pileState?.active&&pileState.carrier===a.key&&pileSupport(o,a,dt))return;
 const lineman=['LT','LG','C','RG','RT'].includes(o.key),
       interior=lineman||o.pos==='FB'||o.pos==='TE',
       maxReach=interior?12:17,
       scope=interior?13:17;
 const reserved=new Set(off.filter(p=>p.pos==='WR'&&p.primaryRunBlock).map(p=>p.primaryRunBlock));
 const livePassSupport=!RUNS.has(selectedPlay)&&a.x>=playStart;
 const candidates=def.filter(d=>!d.ground && d.stun<.65 && d.beatenUntil<playClock && d.key!==o.beatenTarget && d.x>a.x-(livePassSupport?9:5.5)&&d.x<a.x+16&&dist(d,a)<(livePassSupport?scope+3:scope)&&dist(d,o)<maxReach && (livePassSupport||!reserved.has(d.key)||dist(d,a)<2.4));
 let chosen=null;
 const current=blockLinks.get(o.key),engaged=current?P(current.defender):null;
 if(engaged&&candidates.includes(engaged))chosen=engaged;
 if(!chosen){
  const best=livePassSupport?bestLiveBlockTarget(o,a,candidates,claims):null;
  const keep=candidates.find(d=>d.key===o.supportTarget&&!claims.has(d.key));
  if(keep&&(livePassSupport?(playClock<(o.supportUntil||0)&&(!best||blockTargetMerit(o,keep,a)>=blockTargetMerit(o,best,a)-8)):dist(keep,o)<maxReach*.85))chosen=keep;
  if(!chosen&&best)chosen=best;
 }
 if(!chosen&&!livePassSupport){
  const ranked=candidates.filter(d=>!claims.has(d.key)).sort((d,e)=>{
   const merit=t=>dist(t,a)*1.15+dist(t,o)*.65+Math.max(0,o.x-t.x)*.3-(t.rush&&lineman?2:0);
   return merit(d)-merit(e);
  });
  chosen=ranked[0]||null;
 }
 if(chosen){
  claims.add(chosen.key);o.supportTarget=chosen.key;o.supportUntil=playClock+.30;o.intent='block';o.intentTarget=chosen.key;
  const intercept=blockInterceptPoint(o,chosen,a);
  o.blockApproach=intercept;
  if(dist(o,chosen)<1.75)blockBattle(o,chosen,dt);
  if(dist(o,chosen)>1.8)steer(o,intercept.x-o.x,intercept.y-o.y,dt,interior?1.02:1.10);
  else arrive(o,intercept.x,intercept.y,dt,interior?.98:1.02);
  return;
 }
 o.supportTarget=null;o.supportUntil=0;
 // No nearby immediate threat? Escort on the appropriate side of the carrier.
 // Don't send a faraway WR on an endless trek across the entire field.
 const side=o.spawnY<a.y?-1:1;
 const forward=lineman?2.2:o.pos==='WR'?5.5:3.3;
 const spacing=lineman?1.8:o.pos==='WR'?4.8:2.7;
 const homeX=clamp(a.x+forward,10,109),homeY=clamp(a.y+side*spacing,.8,H-.8);
 o.intent='escort';o.intentTarget=a.key;
 arrive(o,homeX,homeY,dt,lineman?.91:.98);
}
function quarterbackSupport(q,a,dt){
 q.intent='trail';q.intentTarget=a.key;
 // Having pitched or handed off, the QB does not keep dropping backwards forever.
 const x=clamp(playStart-3.6,10,109);
 const y=clamp(q.spawnY+(a.y<q.spawnY?2.8:-2.8),1,H-1);
 arrive(q,x,y,dt,.82);
}
function chooseDefenderCommitment(d,a){
 if(!a||d.action?.time>0||d.tackleCooldown>0||d.diveRecovery>0||d.ground||d.blocked>.25||d.stun>0)return;
 const gap=dist(d,a),dx=a.x-d.x,dy=a.y-d.y,along=Math.max(.01,gap);
 const closing=((d.vx-a.vx)*dx+(d.vy-a.vy)*dy)/along;
 const facing=(Math.cos(d.face||0)*dx+Math.sin(d.face||0)*dy)/along;
 const choice=ChaosTackleIntelligence.selection(d,a,{gap,contact:radius(d)+radius(a),closing,runnerSpeed:speed(a),facing,frontality:facing,freeLane:d.blocked<.12});
 d.lastTackleDecision={choice,gap,closing,facing,time:playClock};
 if(choice==='tackle-dive'&&!(speed(a)<.95&&gap<2.5)){
  // A planted or nearly stopped runner needs a controlled wrap, not a
  // repeated launch of low dives through the same crowded rear contact.
  // AI may commit a physically plausible low dive before contact.
  const dir={x:dx/along,y:dy/along};
  d.action={kind:'tackle-dive',time:.53,age:0,used:false,direction:dir,ai:true};
  d.technique='tackle-dive';d.diveRecovery=1.2;d.tackleCooldown=.68;
  d.vx+=dir.x*1.35;d.vy+=dir.y*1.35;
  d.stam=Math.max(0,d.stam-.032);
 }
 // If decision is a power collision, physics still choose whether it hits.
 // Never auto-start a grip or tackle action before anatomical contact.
}
function defenderAI(d,dt){
 if(d.stun>0){d.intent='recover';d.intentTarget=ballCarrier?.key||'play';steer(d,0,0,dt,.65);return}
 if(tackleLinks.has(d.key)&&ballCarrier){d.intent='wrap';d.intentTarget=ballCarrier.key;steer(d,ballCarrier.x-d.x,ballCarrier.y-d.y,dt,.82);return}
 const read=recognizeRun(d);
 // Even when playing the pass, a nearby defender can tackle a runner he can see.
 if(ballCarrier&&(!RUNS.has(selectedPlay)||read||dist(d,ballCarrier)<3.4)){
  const seen=InsideZoneIQ.visible(d,ballCarrier);
  if(seen||dist(d,ballCarrier)<1.65||selectedPlay!=='inside'){
   if(seen)d.lastVisibleRunner={x:ballCarrier.x,y:ballCarrier.y,at:playClock};
   chooseDefenderCommitment(d,ballCarrier);pursuitAI(d,ballCarrier,dt);return;
  }
  // No instant behind-the-head recognition. Reorient toward the player's
  // last observed lane; he may acquire the runner again after physically turning.
  const last=d.lastVisibleRunner;
  d.intent='locate-runner';d.intentTarget='last-seen';
  const target=last&&playClock-last.at<.7?last:{x:(d.fit?.gapSpot?.x||playStart+2),y:(d.fit?.lane||d.spawnY)};
  steer(d,target.x-d.x,target.y-d.y,dt,.86);return;
 }
 // Line defenders shoot gaps; linebackers fill; secondary maintains leverage.
 if(RUNS.has(selectedPlay)&&read){runFitAI(d,dt);return}
 if(d.spy&&!passThrown&&!ballCarrier){quarterbackSpyAI(d,P('QB'),dt);return;}
 if(d.rush){passRushAI(d,P('QB'),dt);return;}
 // A defender in shallow zone can read an obvious scramble even before the
 // passer crosses the line: coverage players don't all abandon deep routes.
 const qb=P('QB');
 if(!RUNS.has(selectedPlay)&&!passThrown&&!ballCarrier&&qb&&
    (qb.x>=playStart-1.9||RushAwareness.assess(qb,playStart,playClock).escape)&&
    (d.assignment?.kind==='zone'&&d.assignment.depth<12)&&dist(d,qb)<12){
  d.intent='scramble-alert';d.intentTarget='QB';
  steer(d,qb.x+.3-d.x,qb.y-d.y,dt,1.06);return;
 }
 // Coverage stays intact until the player sees the run cues; pass is not
 // broken merely because the offensive playbook chose a running play.
 const as=d.assignment;
 if(ball?.flying&&defenderFlightAI(d,dt))return;
 if(!as){d.intent='hold';arrive(d,d.spawnX,d.spawnY,dt);return}
 if(playClock<d.recognition){d.intent='read';steer(d,0,0,dt);return}
 if(as.kind==='man'){
  const t=P(as.target);if(!t){d.intent='read';steer(d,0,0,dt);return}
  d.intent='cover-man';d.intentTarget=t.key;
  const shadow=clamp((100-d.COV)*.012+(d.coverageVariation?.cushion||0),.06,.50),isCB=d.pos==='CB';
  const lead=.14+(d.AWR-70)*.005;
  // Preserve a deeper shoulder when the receiver stays on a vertical stem.
  // Do not instantly mirror every fake; existing mirrorDelay still governs cuts.
  const deepThreat=CoverageRoutePolicy.isVerticalThreat(t,playStart);
  const tx=t.x+clamp(t.vx*lead,-1,2)+(isCB?(deepThreat?1.8:1.0):0.6),ty=t.y+t.vy*lead+Math.sign(d.y-t.y)*shadow;
  d.mirrorDelay=Math.max(0,d.mirrorDelay-dt);
  const mirror=clamp((.90+(d.MIR-75)*.005)*(d.coverageVariation?.mirror||1),.67,1.09);
  const effort=clamp(.92+(d.COV-75)*.003,.86,1.06)*mirror;
  if(d.falseStep&&d.falseStep.until>playClock){
   d.intent='cover-fake';
   steer(d,d.falseStep.x-d.x,d.falseStep.y-d.y,dt,effort);
   return;
  }
  d.falseStep=null;
  const aim=d.mirrorDelay>0&&d.coverAim?d.coverAim:{x:tx,y:ty};
  if(d.mirrorDelay<=0||!d.coverAim)d.coverAim={x:tx,y:ty};
  steer(d,aim.x-d.x,aim.y-d.y,dt,effort);return;
 }
 let tx=as.baseX,ty=as.baseY;
 const candidates=skillOffense().filter(o=>o.x>playStart-.5&&Math.abs(o.y-as.baseY)<as.width&&(as.depth<12?o.x<playStart+18:o.x>=playStart+7));
 if(candidates.length){
  const deep=as.depth>=12;
  // Deep defenders prioritize deep threats instead of abandoning a streak
  // for the nearest short receiver. They can carry routes beyond 40 yards.
  const t=CoverageRoutePolicy.zoneThreat(candidates,as,playStart);
  const predicted=deep?CoverageRoutePolicy.deepIntercept(d,t,as,playStart):null;
  tx=clamp(predicted?predicted.x:t.x+(deep?2.2:0.6),deep?Math.min(playStart+Math.max(1.5,Math.min(8,(110-playStart)*.6+1)),114.65):playStart+2,deep?114.65:Math.min(114.65,playStart+16));
  ty=clamp(predicted?predicted.y:t.y,as.baseY-as.width*.76,as.baseY+as.width*.76);
  d.deepRead=!!predicted;
 }else d.deepRead=false;
 d.intent='cover-zone';d.intentTarget=as.tag;
 tx+=d.coverageVariation?.react||0;ty+=d.coverageVariation?.cushion||0;
 const coverEffort=clamp((.92+(d.COV-75)*.002)*(d.coverageVariation?.mirror||1),.82,1.10);
 // Don't brake short of a moving streak's projected catch lane.
 if(d.deepRead&&Math.hypot(tx-d.x,ty-d.y)>1.1)steer(d,tx-d.x,ty-d.y,dt,coverEffort);
 else arrive(d,tx,ty,dt,coverEffort);
}
// A hard hit can briefly knock an off-ball player winded. This is gameplay,
// not a medical injury model. The player falls, pauses to recover, then rises.
// Momentum, angle, impact technique, and victim stability determine severity.
// The ball carrier uses the tackle subsystem; a winded off-ball player is never
// removed from the roster or automatically replaced.
function groundContact(victim,attacker,impulse,relativeSpeed,nx,ny,kind='body'){
 if(phase!=='live'||victim.ground||victim.groundLock>0 ||victim===ballCarrier ||
   (victim===active&&!passThrown)||!Number.isFinite(impulse))return false;
 // Cheap accidental shoulder brushes can't trigger the full animation.
 if(relativeSpeed<3.2||impulse<240)return false;
 const technique=attacker.team===1?attacker.HIT:attacker.IBL;
 const impactRating=attacker.team===1?(attacker.HIT*.62+attacker.TAK*.18+attacker.STR*.20):
    (attacker.IBL*.52+attacker.BLO*.24+attacker.STR*.24);
 const resistance=victim.STR*.33+victim.AWR*.25+victim.AGI*.20+victim.STA*.22;
 const facing= Math.cos(victim.face)*(-nx)+Math.sin(victim.face)*(-ny);
 // Bracing for a frontal shot helps. An unprepared hit from behind is harder.
 const penalty=clamp(facing,-1,1)*45;
 const base=430+(resistance-75)*2.2+(mass(victim)-100)*.46-(impactRating-75)*2.7+penalty;
 const threshold=clamp(base,270,660);
 const quality=impulse/threshold;
 if(quality<1)return false;
 const excess=clamp(quality-1,0,1.4);
 const fall=clamp(.16+.06*excess,.16,.25);
 const rest=clamp(.40+.32*excess+(100-victim.STA)*.0035,.38,.92);
 const rise=clamp(.23+(100-victim.AGI)*.001,.22,.31);
 victim.ground={stage:'fall',time:fall,fall,rest,rise,age:0,force:Math.round(impulse),from:attacker.key,kind,
                 dir:Math.atan2(ny,nx),severity:quality};
 victim.groundLock=0;
 victim.stam=Math.max(.045,victim.stam-clamp(.075+.065*excess,.075,.17));
 victim.balance=clamp(victim.balance-.30-.10*excess,.25,.65);
 victim.technique='winded';victim.intent='fall';victim.intentTarget=attacker.key;
 victim.vx*=.32;victim.vy*=.32;victim.sprinting=false;
 // Drop existing blocks. Defensive pursuit resumes after recovery.
 for(const [k,b] of [...blockLinks])if(k===victim.key||b.defender===victim.key)blockLinks.delete(k);
 if(tackleLinks.has(victim.key))tackleLinks.delete(victim.key);
 if(pileState?.active && pileState.pushers) pileState.pushers=pileState.pushers.filter(p=>p.key!==victim.key);
 windedHits++;victim.pulse=.35;
 log(victim.pos+' '+victim.name+' down briefly · '+Math.round(impulse)+' N·s impact');
 return true;
}
function tickGround(p,dt){
 p.groundLock=Math.max(0,p.groundLock-dt);
 if(!p.ground)return false;
 const g=p.ground;g.age+=dt;g.time-=dt;
 if(g.time<=0){
  if(g.stage==='fall'){g.stage='winded';g.time+=g.rest;}
  else if(g.stage==='winded'){g.stage='rise';g.time+=g.rise;}
  else {p.ground=null;p.groundLock=.65;p.balance=clamp(p.balance+.20,.5,1);standUps++;
   p.intent='rejoin';p.intentTarget=ballCarrier?.key||'assignment';
   p.diveRecovery=Math.max(p.diveRecovery||0,.23);return false;}
 }
 p.intent=g.stage==='fall'?'fall':g.stage==='winded'?'winded':'getting-up';
 p.intentTarget=g.from;
 p.sprinting=false;
 p.vx*=Math.max(0,1-dt*(g.stage==='fall'?11:24));
 p.vy*=Math.max(0,1-dt*(g.stage==='fall'?11:24));
 return true;
}

// Contact is persistent. Winning a block takes position, hand placement,
// leverage, mass and time; rushers can eventually shed a blocker.
function blockBattle(o,d,dt){
 if(!o||!d||o.ground||d.ground||o.team===d.team||dist(o,d)>(specialState?.returning?2.15:1.95)||d.shedCooldown>0||tackleLinks.has(d.key)||
   (specialState?.returning&&d.returnBypassBlocker===o.key&&d.returnBypassUntil>playClock))return;
 let link=blockLinks.get(o.key);
 if(link&&link.defender!==d.key){
  // Do not teleport a block to a different opponent while still engaged.
  if(link.age<.52&&dist(o,P(link.defender))<2.25)return;
  blockLinks.delete(o.key);link=null;
 }
 if(!link){link={blocker:o.key,defender:d.key,age:0,secured:0,breakAt:0,impactDone:false,powerUsed:false,mode:'approach'};blockLinks.set(o.key,link)}
 link.touched=true;
 o.pulse=Math.max(o.pulse,.12);d.pulse=Math.max(d.pulse,.12);
}
function resolveBlocks(dt){
 for(const [key,e] of blockLinks){
  const o=P(e.blocker),d=P(e.defender);
  if(!o||!d||o.ground||d.ground||dist(o,d)>2.7||d.shedCooldown>0){
   if(o&&d&&selectedPlay==='inside'&&o.insideZonePlan&&d.ground){
    // A pancake makes a teammate available, but finding his next target is
    // a visible read, not a remote animation snap or an instant 180-degree turn.
    o.beatenTarget=d.key;o.beatenUntil=playClock+.70;
    o.insideZoneReadAfter=Math.max(o.insideZoneReadAfter||0,playClock+InsideZoneIQ.readDelay(o,rand()));
   }
   if(specialState?.returning&&d&&o){
    d.returnBypassBlocker=o.key;d.returnBypassUntil=playClock+.65;
    d.returnBypassSide=returnEscapeSide(d,o);
   }
   blockLinks.delete(key);continue
  }
  // A clean technique block on an anchored 320lb lineman is different from
  // the same hands against a 180lb receiver.
  const scoreO=o.BLO*.44+o.IBL*.18+o.STR*.27+o.AWR*.11+(mass(o)-105)*.060;
  const scoreD=d.STR*.34+d.PMV*.34+d.AGI*.17+d.AWR*.15+(mass(d)-105)*.050;
  const helpers=[...blockLinks.values()].filter(other=>other!==e&&other.defender===d.key).length;
  const matchup=BlockingPolicy.match(o,d,helpers);
  const mismatch=scoreO-scoreD+Math.min(2,helpers)*7;
  const powerEdge=(d.PMV*.48+d.STR*.33+d.AWR*.19)-(o.IBL*.31+o.BLO*.40+o.STR*.29);
  e.age+=dt;
  if(specialState?.returning){
   const choice=BlockingPolicy.decideDefender(d,o,ballCarrier?dist(d,ballCarrier):12);
   e.decision=choice;
   // Agile undersized gunners may work around a much larger blocker
   // rather than continue a losing head-on fight indefinitely.
   if(choice==='maneuver'&&e.age>.24&&e.secured<.74){
    blockLinks.delete(key);d.shedCooldown=.28;d.blocked=0;
    d.returnBypassBlocker=o.key;d.returnBypassUntil=playClock+.82;
    d.returnBypassSide=returnEscapeSide(d,o);
    d.intent='return-bypass';d.intentTarget=ballCarrier?.key||'RB';continue;
   }
   // On returns the coverage player actively disengages, then goes *around*
   // the blocker. The ordinary pass-protection stay-engaged timer was making
   // all coverage men stop indefinitely and reattach to the same guy.
   const shedAt=clamp(.75+(o.BLO-d.PMV)*.009+(o.STR-d.AGI)*.003+Math.min(helpers,2)*.20,.35,1.48);
   if(e.age>=shedAt){
    blockLinks.delete(key);d.shedCooldown=.45;d.blocked=0;
    d.returnBypassBlocker=o.key;d.returnBypassUntil=playClock+clamp(.68+d.AGI/400,.72,1.00);
    d.returnBypassSide=returnEscapeSide(d,o);
    o.beatenTarget=d.key;o.beatenUntil=playClock+.60;
    blockShedCount++;d.intent='return-shed';d.intentTarget=ballCarrier?.key||'RB';continue;
   }
  }
  // A powerful, well-timed impact block transfers real velocity to the opponent.
  const dd0=Math.max(.01,dist(o,d)),ix=(d.x-o.x)/dd0,iy=(d.y-o.y)/dd0;
  const approach=Math.max(0,(o.vx-d.vx)*ix+(o.vy-d.vy)*iy);
  if(!e.impactDone && (approach>1.0||o.action?.kind==='impact-block'&&o.action.time>0)){
   e.impactDone=true;
   const strike=clamp((o.IBL*.54+o.STR*.28+o.BLO*.18-45)/55,.20,1.20)*clamp(approach/4,.22,1.4)*(o.action?.kind==='impact-block'?1.35:1);
   const delivered=clamp(approach*.30*strike,0,2.4);
   d.vx+=ix*delivered*mass(o)/(mass(o)+mass(d));d.vy+=iy*delivered*mass(o)/(mass(o)+mass(d));
   o.vx-=ix*delivered*mass(d)/(mass(o)+mass(d));o.vy-=iy*delivered*mass(d)/(mass(o)+mass(d));
   d.balance=clamp(d.balance-.10*strike,.30,1);d.stun=Math.max(d.stun,.08*strike);
   e.secured=clamp(e.secured+strike*.24,0,1);o.technique='impact-block';o.pulse=.25;
   impactBlockCount++;
   groundContact(d,o,delivered*mass(d)*YARD_M*2,approach,ix,iy,'impact-block');
  }
  e.secured=clamp(e.secured+dt*(.72+mismatch*.0055),0,1);
  if(!e.breakAt){e.breakAt=clamp(.99+mismatch*.016-powerEdge*.012,.34,2.55)}
  // Power rushers actively drive the blocker backward and shorten engagement.
  if(d.PMV>=69 && e.age>.12 && powerEdge>-17){
   const drive=clamp((powerEdge+24)*.018,.10,.95)*clamp(mass(d)/117,.7,1.4);
   o.vx-=ix*drive*dt*3.5;o.vy-=iy*drive*dt*3.5;
   d.technique='power-move';d.lean=clamp(d.lean+.05*dt,-.5,.5);
   if(!e.powerUsed){e.powerUsed=true;powerMoveCount++;}
  }
  // A defender can shed once hand-fighting has lasted long enough. High
  // blocker skill increases the hold, high rusher skill shortens it.
  const nearRunLane=selectedPlay==='inside'&&ballCarrier&&o.insideZonePlan&&dist(d,ballCarrier)<5.2;
  const earnedHold=nearRunLane&&e.secured>.35?clamp((e.secured-.35)*.72,0,.36)*clamp((30-powerEdge)/28,.25,1):0;
  if(e.age>e.breakAt+earnedHold && (mismatch < 25 || powerEdge>16)){
   blockLinks.delete(key);d.shedCooldown=clamp(.35+(d.AGI-65)*.003,.30,.50);
   // Breaking hand contact takes a fraction of a second of balance recovery.
   // This is not a canned animation lock or an automatic missed tackle.
   d.blocked=Math.max(d.blocked,nearRunLane?.44:.22);
   d.tackleCooldown=Math.max(d.tackleCooldown,nearRunLane?.12:.06);
   o.blockTarget=null;blockShedCount++;continue;
  }
  // Finish a clean win: the defender is controlled and moved outside his
  // pursuit lane. The lineman climbs to a linebacker/safety rather than idle.
  const a=ballCarrier||P('RB');
  const cleanWin=(RUNS.has(selectedPlay)||(ballCarrier&&ballCarrier.x>=playStart))&&e.age>.47&&e.secured>.74&&mismatch>9
    && a && (d.ground||d.stun>.12||
      (d.x<a.x-1.8&&dist(d,a)>3.0)||
      (Math.abs(d.y-a.y)>4.5&&d.x<a.x+2));
  if(cleanWin){
   o.blockWins++;o.beatenTarget=d.key;o.beatenUntil=playClock+1.25;
   d.beatenUntil=playClock+.70;d.blocked=Math.max(d.blocked,.63);
   o.blockTarget=null;o.supportTarget=null;blockLinks.delete(key);
   if(selectedPlay==='inside'&&o.insideZonePlan){
    o.insideZoneReadAfter=playClock+InsideZoneIQ.readDelay(o,rand());
   }
   o.intent='climb-second-level';o.intentTarget='next-threat';
   continue;
  }
  const dd=Math.max(.01,dist(o,d)),nx=(d.x-o.x)/dd,ny=(d.y-o.y)/dd;
  // The block is a physical engagement: maintain separation and oppose
  // sideways slip as well as forward penetration. It never teleports players.
  const contact=BlockingPolicy.contact({blocker:o,defender:d,secured:e.secured,age:e.age,helpers,runner:ballCarrier||P('RB')});
  e.mode=contact.state;
  const desired=clamp(radius(o)+radius(d)+.36,1.28,1.76);
  // Physically maintain shoulder-pad space while hands are engaged. The
  // small mass-weighted correction is capped per frame (never a teleport).
  if(dd<desired){
   const separate=Math.min(.105,(desired-dd)*.43);
   const sum=mass(o)+mass(d);
   o.x-=nx*separate*mass(d)/sum;o.y-=ny*separate*mass(d)/sum;
   d.x+=nx*separate*mass(o)/sum;d.y+=ny*separate*mass(o)/sum;
  }
  const distanceError=clamp(dd-desired,-.40,.85);
  const normalRelative=(d.vx-o.vx)*nx+(d.vy-o.vy)*ny;
  const tangentX=-ny,tangentY=nx;
  const slip=(d.vx-o.vx)*tangentX+(d.vy-o.vy)*tangentY;
  const hold=contact.strength;
  const connected=clamp(distanceError*3.0+normalRelative*.32,-2.2,2.2)*hold*dt;
  const slipBrake=clamp(slip*hold*dt*.95,-.12,.12);
  // A soft spring + tangential friction makes hands-on blocking persistent,
  // while defenders can still win leverage and swim/rip around opponents.
  d.vx-=nx*connected*.52+tangentX*slipBrake*.60;
  d.vy-=ny*connected*.52+tangentY*slipBrake*.60;
  o.vx+=nx*connected*.35+tangentX*slipBrake*.33;
  o.vy+=ny*connected*.35+tangentY*slipBrake*.33;
  if(selectedPlay==='inside'&&o.insideZonePlan&&d.x>=o.x-.10&&e.secured>.18){
   // Vertical displacement is earned by secured hands, coordinated helpers
   // and actual blocking strength. No scripted opening or teleportation.
   const push=clamp((contact.advantage+5)/34,0,1.0)*
    clamp((e.secured-.10)*1.35,0,1)*(1+Math.min(1,helpers)*.23);
   d.vx+=push*2.35*dt*clamp(mass(o)/Math.max(70,mass(d)),.65,1.35);
   o.vx+=push*.23*dt;
   o.technique=helpers?'double-team':'zone-drive';
  }
  if(contact.state==='drive'||contact.state==='double-team'){
   const drive=clamp((contact.advantage-5)*.028,.02,.65)*dt;
   d.vx+=nx*drive*mass(o)/Math.max(100,mass(d));
   d.vy+=ny*drive*mass(o)/Math.max(100,mass(d));
  }
  o.blockMode=e.mode;d.blockMode=e.mode;
  o.technique=e.mode==='drive'?'drive-block':e.mode==='seal'?'seal-block':e.mode==='double-team'?'double-team':'engaged-block';
  const force=clamp(.45+mismatch*.015+e.secured*.72,.20,1.9);
  // Braking force is relative to the rusher's movement *through* the block.
  const penetration=d.vx*nx+d.vy*ny;
  if(penetration>0){d.vx-=nx*penetration*clamp(force*dt,0,.2);d.vy-=ny*penetration*clamp(force*dt,0,.2)}
  const obstruct=clamp(.25+mismatch*.008+e.secured*.4,.12,.95);
  d.vx*=Math.max(0,1-obstruct*dt);d.vy*=Math.max(0,1-obstruct*dt);
  // Both partners take opposite small forces; bigger bodies are moved less.
  const impulse=clamp(mismatch*.025,-.35,1.1)*dt;
  d.vx+=nx*impulse*mass(o)/mass(d);d.vy+=ny*impulse*mass(o)/mass(d);
  o.vx-=nx*impulse*.28;o.vy-=ny*impulse*.28;
  d.blocked=Math.max(d.blocked,.18+e.secured*.20);
  if(!tackleLinks.has(d.key)){
   // Preserve the rush-lane decision for diagnostics and animation. Block
   // resolution must not erase a live QB-rollout pursuit choice.
   if(ballCarrier)d.intent='pursue';
   else if(!['edge-contain','edge-crash','pocket-escape','blitz-close','stunt','inside-rush'].includes(d.intent))d.intent='rush';
   d.intentTarget=ballCarrier?.key||'QB';
  }
 }
}

// Persistent pass protection: one lineman owns each rush lane, with a center
// available for inside help. Assignment is decided at the snap, then revisited
// only for genuine leaks. This prevents all five linemen chasing one DT.
function assignPassProtection(){
 const line=['LT','LG','C','RG','RT'].map(P).filter(Boolean);
 for(const o of line){o.passAssignment=null;o.passHelp=null;}
 const rushers=def.filter(d=>d.rush&&!d.ground).sort((a,b)=>a.spawnY-b.spawnY);
 for(const d of rushers){d.passProtector=null;}
 // Optimize lateral travel, giving the center the nose when the front is odd.
 const available=[...line];
 const regular=rushers.filter(d=>!d.blitz);
 for(const d of regular){
  const choice=available.sort((a,b)=>{
   const cost=o=>Math.abs(o.spawnY-d.spawnY)*1.3+
      (o.key==='C'&&regular.length>=4?2.0:0)+
      (d.pos==='NT'&&o.key==='C'?-3:0)+
      (Math.abs(protectionLane(o))>2.5&&Math.abs(d.spawnY-26.65)<3?1.7:0);
   return cost(a)-cost(b);
  })[0];
  if(choice){choice.passAssignment=d.key;d.passProtector=choice.key;available.splice(available.indexOf(choice),1);}
 }
 // One uncovered blitzer is the RB's first job. The C can slide toward a
 // fifth threat when he is free, but must not abandon an inside rusher.
 const rb=P('RB');if(rb){rb.passAssignment=null;
  const unclaimed=rushers.filter(d=>!d.passProtector);
  if(unclaimed.length){const threat=unclaimed.sort((a,b)=>Math.hypot(a.x-P('QB').x,a.y-P('QB').y)-Math.hypot(b.x-P('QB').x,b.y-P('QB').y))[0];
   rb.passAssignment=threat.key;threat.passProtector='RB';}
 }
}
function protectionLane(o){return ({LT:-3.6,LG:-1.8,C:0,RG:1.8,RT:3.6})[o.key]||0}
function runningBlockThreats(o,rushing,run){
 const lane=26.65+protectionLane(o), same=o.blockTarget;
 return [...rushing].filter(d=>d.shedCooldown<=0 || d.key!==same).sort((a,b)=>{
  const rating=d=>{
   const assigned=blockLinks.get(o.key)?.defender===d.key?-5:0;
   const home=Math.abs(d.y-lane),distance=dist(o,d);
   const competing=[...blockLinks.values()].some(link=>link.blocker!==o.key&&link.defender===d.key);
   const extra=competing?3.5:0;
   const overreach=home>6.2?(home-6.2)*2:0;
   const runSide=run&&selectedPlay==='power'&&o.key==='RG'?(d.y<23?-2:3):run&&selectedPlay==='counter'&&o.key==='LG'?(d.y>30?-2:3):0;
   return distance*.7+home*.8+overreach+extra+assigned+runSide;
  };
  return rating(a)-rating(b);
 });
}
function passThreatPriority(d,qb){
 const gap=dist(d,qb),approach=((qb.x-d.x)*d.vx+(qb.y-d.y)*d.vy)/Math.max(.2,gap);
 return (12-gap)*1.4+Math.max(0,approach)*.8+(d.blitz?2.2:0)+
        (d.x<playStart?2:0)-(d.blocked>.20?3.0:0);
}
function passProtectAI(o,dt){
 const qb=P('QB'),lane=26.65+protectionLane(o),own=def.find(d=>d.key===o.passAssignment&&d.rush&&!d.ground);
 const locked=blockLinks.get(o.key);
 let t=locked?def.find(d=>d.key===locked.defender&&!d.ground):null;
 if(!t&&own){
  const outside=Math.abs(own.y-lane)>6.7;
  if(!outside||dist(own,qb)<5.4)t=own;
 }
 // A free lineman may pick up an alert only AFTER the defender visibly
 // charges the pocket. The primary blocker never abandons an engaged rusher.
 if(!t&&o.protectionAlert){
  const alert=def.find(d=>d.key===o.protectionAlert&&!d.ground);
  if(alert&&Math.abs(alert.y-lane)<7.0&&ProtectionRead.committing(alert,qb,playStart,playClock))t=alert;
 }
 // Interior help only when the home rusher has left our lane or another
 // free defender would reach the QB sooner. No arbitrary across-line shifts.
 if(!t){
  const leaks=def.filter(d=>d.rush&&!d.ground&&Math.abs(d.y-lane)<(o.key==='C'?5.2:4.3)&&
     d.x<playStart+2.4&&dist(d,qb)<7.3&&
     (!d.passProtector||d.passProtector===o.key||
       !blockLinks.has(d.passProtector)&&dist(P(d.passProtector)||o,d)>3.6));
  leaks.sort((a,b)=>passThreatPriority(b,qb)-passThreatPriority(a,qb));t=leaks[0]||null;
 }
 o.intent='pass-protect';o.intentTarget=t?.key||'pocket-lane';
 if(!t){
  // Hold an actual pass-set shape instead of drifting toward the center.
  const depth=(o.key==='LT'||o.key==='RT')?1.25:2.45;
  arrive(o,clamp(qb.x+depth,playStart-3.0,playStart-.1),lane,dt,.93);
  return;
 }
 o.blockTarget=t.key;
 const edge=o.key==='LT'||o.key==='RT';
 const predict=clamp(dist(o,t)/22,.07,.23);
 const ty=clamp(t.y+t.vy*predict,lane-(edge?7:4.3),lane+(edge?7:4.3));
 // Rushers who have penetrated MUST be followed into the pocket. Keeping
 // every OL permanently pinned to the line of scrimmage caused free sacks.
 const tx=clamp(t.x+t.vx*predict-.68,qb.x+.55,playStart+1.2);
 steer(o,tx-o.x,ty-o.y,dt,1.04);
 if(dist(o,t)<1.98)blockBattle(o,t,dt);
}
function insideZoneBlockerAI(o,dt,claims,runner){
 const info=o.insideZonePlan||{target:null,homeY:o.spawnY,combo:false};
 const engaged=blockLinks.get(o.key);
 const contact=engaged?P(engaged.defender):null;
 const assigned=info.target?P(info.target):null;
 const liveRunner=runner||P('RB');
 const primaryAvailable=assigned&&!assigned.ground&&assigned.beatenUntil<playClock&&
  assigned.key!==o.beatenTarget&&dist(o,assigned)<6.1;
 let target=contact&&!contact.ground?contact:null;
 // First fulfill the original gap and combo assignment. Do not leave a DT
 // unblocked because a linebacker is briefly closer to the runner.
 if(!target&&primaryAvailable&&(playClock<1.08||!runner||dist(o,assigned)<3.0))target=assigned;
 // Completed assignment: identify a *visible*, physically reachable tackler
 // in the developing RB lane. A blocker can't see someone 180° behind him.
 if(!target&&runner&&playClock>=(o.insideZoneReadAfter||0)){
  const nearby=def.filter(d=>!d.ground&&d.beatenUntil<playClock&&d.key!==o.beatenTarget&&
    dist(o,d)<11.5&&d.x>playStart-.8&&d.x<runner.x+15&&
    (d.pos==='MLB'||d.pos==='OLB'||d.pos==='LB'||d.pos==='WILL'||d.pos==='SAM'||
     d.pos==='FS'||d.pos==='SS'||d.rush));
  const options=nearby.filter(d=>!claims.has(d.key)&&InsideZoneIQ.visible(o,d))
   .map(d=>({d,value:InsideZoneIQ.threat(o,d,runner,playStart)}))
   .sort((a,b)=>b.value-a.value);
  const kept=options.find(q=>q.d.key===o.supportTarget);
  const top=options[0];
  if(kept&&playClock<(o.supportUntil||0)&&(!top||kept.value>=top.value-6))target=kept.d;
  else if(top&&top.value>0)target=top.d;
 }
 if(target){
  if(!contact)claims.add(target.key);
  const initial=target===assigned;
  o.blockTarget=target.key;o.intent=initial?(info.combo?'zone-combo':'zone-drive'):'zone-climb';o.intentTarget=target.key;
  if(!initial){o.supportTarget=target.key;o.supportUntil=playClock+clamp(.35+(100-o.AWR)*.004,.35,.54);}
  const lane=InsideZoneIQ.runnerProjection(liveRunner,playStart);
  const targetX=target.x-.62;
  // Anchor first-level footwork to the original gap. On a climb, the blocker
  // may track the live lane, but only in short believable lateral steps.
  const targetY=initial?clamp(target.y,info.homeY-2.45,info.homeY+2.45):
    clamp(target.y+(lane.y-target.y)*.10,Math.max(.7,o.y-2.6),Math.min(H-.7,o.y+2.6));
  steer(o,targetX-o.x,targetY-o.y,dt,initial?1.07:1.02);
  if(dist(o,target)<2.12)blockBattle(o,target,dt);
  return;
 }
 o.blockTarget=null;o.supportTarget=null;
 const p=InsideZoneIQ.runnerProjection(liveRunner,playStart);
 const forward=clamp(playStart+Math.min(6,playClock*2.2),playStart+1,109);
 const home=clamp(info.homeY+clamp(p.y-info.homeY,-1.5,1.5)*.22,.7,H-.7);
 o.intent='zone-search';o.intentTarget='visible-second-level';
 arrive(o,forward,home,dt,.94);
}
function blockerAI(o,dt){
 if(selectedPlay==='inside'){insideZoneBlockerAI(o,dt,new Set(),null);return;}
 const run=RUNS.has(selectedPlay);
 if(!run){passProtectAI(o,dt);return;}
 o.intent='protect';o.intentTarget='run-lane';
 const rushing=def.filter(d=>!d.ground&&d.beatenUntil<playClock&&d.x>playStart-1&&d.x<playStart+16&&Math.abs(d.y-(26.65+protectionLane(o)))<10);
 if(!rushing.length)return;
 if(((selectedPlay==='power'&&o.key==='RG')||(selectedPlay==='counter'&&o.key==='LG'))&&playClock<.92){
  o.intent='pull';o.intentTarget=selectedPlay==='counter'?'right C-gap':'left C-gap';
  steer(o,playStart-1.0-o.x,(selectedPlay==='counter'?32.0:21.8)-o.y,dt,.96);return;
 }
 const candidates=runningBlockThreats(o,rushing,run).filter(d=>d.key!==o.beatenTarget);
 const locked=blockLinks.get(o.key), preferred=locked&&rushing.find(d=>d.key===locked.defender);
 if(!locked&&o.beatenTarget&&playClock>=o.beatenUntil){o.beatenTarget=null;}
 let t=preferred || (o.blockTarget&&rushing.find(d=>d.key===o.blockTarget&&dist(d,o)<4.2&&d.shedCooldown<=0))||candidates[0];
 if(!t){o.intent='climb-second-level';o.intentTarget='find-linebacker';arrive(o,playStart+clamp(playClock*2.0,2,9),26.65+protectionLane(o),dt,.92);return;}
 o.blockTarget=t.key;o.intentTarget=t.key;
 const lane=26.65+protectionLane(o),tY=clamp(t.y,lane-3.4,lane+3.4);
 const tx= Math.max(playStart+.15,t.x-.6);
 const ty=tY+(selectedPlay==='stretch'?-.35:0);
 steer(o,tx-o.x,ty-o.y,dt,.96);
 if(dist(o,t)<1.9)blockBattle(o,t,dt);
}
function rbPassProtection(p,dt){
 const qb=P('QB'),rushers=def.filter(d=>d.rush&&!d.ground);
 // A suspicious DB/LB remains only a *candidate*: the RB commits if he
 // actually closes toward the pocket. Covering defenders are never chased.
 const alert=def.find(d=>d.key===p.protectionAlert&&!d.ground);
 const extra=alert&&ProtectionRead.committing(alert,qb,playStart,playClock)?alert:null;
 if(extra&&!rushers.includes(extra))rushers.push(extra);
 const locked=blockLinks.get(p.key);
 let target=locked?rushers.find(d=>d.key===locked.defender):null;
 if(!target&&p.passAssignment)target=rushers.find(d=>d.key===p.passAssignment);
 if(!target&&extra&&dist(extra,qb)<9.0)target=extra;
 if(!target){
  const unblocked=rushers.filter(d=>!d.passProtector||d.passProtector==='RB'||
    (!blockLinks.has(d.passProtector)&&dist(P(d.passProtector)||p,d)>3.6));
  unblocked.sort((a,b)=>passThreatPriority(b,qb)-passThreatPriority(a,qb));
  if(unblocked.length&&dist(unblocked[0],qb)<9)target=unblocked[0];
 }
 p.intent='pass-protect';p.intentTarget=target?.key||'pocket-check';
 if(!target){arrive(p,qb.x+1.6,clamp(qb.y+1.9,4,H-4),dt,1.0);return;}
 const future=.14;
 const tx=clamp(target.x+target.vx*future-.68,qb.x+.6,playStart+1.0);
 const ty=clamp(target.y+target.vy*future,2,H-2);
 steer(p,tx-p.x,ty-p.y,dt,1.09);
 if(dist(p,target)<1.98)blockBattle(p,target,dt);
}
function rbLeadBlock(p,dt){p.intent='lead-block';p.intentTarget='front';
 if(p.key==='FB'&&selectedPlay==='power'){let target=closestThreat(p,def.filter(d=>!d.rush&&d.x>playStart)).p;let ty=22.3,tx=playStart+Math.min(8,playClock*3);if(target&&dist(p,target)<3){tx=target.x-.65;ty=target.y;blockBattle(p,target,dt)}steer(p,tx-p.x,ty-p.y,dt,.96);return}
 const rushers=def.filter(d=>d.rush);const t=closestThreat(p,rushers).p;
 if(t&&dist(p,t)<2.3){steer(p,t.x-.45-p.x,t.y-p.y,dt,.94);blockBattle(p,t,dt)}else{steer(p,playStart+1-p.x,p.spawnY-p.y,dt,.75)}
}
// A ball carrier's objective is the opposing end zone. Prior versions used a
// landmark anchored to the snap time; a breakaway RB would outrun that landmark
// and literally steer back toward it. All automatic targets are now IN FRONT.
function autoCarry(p,dt){
 p.intent='carry-auto';p.intentTarget='endzone';
 const inBackfield=p.x<playStart+5.5 && playClock<2.5;
 const lane=selectedPlay==='stretch'?16:selectedPlay==='sweep'?39:selectedPlay==='counter'?35:selectedPlay==='power'?22.5:24.2;
 // A run gap influences the FIRST few steps only. After breaking contain, keep
 // the runner's current lane, especially along an empty sideline.
 let targetY=inBackfield&&p===P('RB')?p.y+clamp(lane-p.y,-3.0,3.0)*.62:p.y;
 // Special teams: the called return lane guides early auto-return decisions;
 // the actual kick side is independent and the user may steer elsewhere.
 if(specialState?.returning&&p===P('RB')&&specialState.elapsed<8)
  targetY=p.y+clamp(specialState.returnLaneY-p.y,-6,6)*.65;
 targetY=clamp(targetY,1.35,H-1.35);
 // Only consider defenders AHEAD of the runner. A pursuer behind must never
 // convince an open-field carrier to turn around or cut into the boundary.
 const inFront=def.filter(d=>d.stun<=0 && d.x>p.x+.9 && d.x<p.x+5 && Math.abs(d.y-p.y)<2.1)
   .sort((a,b)=>a.x-b.x)[0];
 if(inFront){
  const side=(p.y<=3.7)?1:(p.y>=H-3.7)?-1:(inFront.y>=p.y?-1:1);
  const candidate=clamp(p.y+side*2.2,1.35,H-1.35);
  if(Math.abs(candidate-inFront.y)>Math.abs(targetY-inFront.y)+.5)targetY=candidate;
 }
 // If the runner is stuck behind a crowded line, look for the less congested
 // side instead of repeatedly steering straight into the same blocking wall.
 if(!specialState && p===P('RB') && p.x<playStart+12){
  const crowded=def.filter(d=>!d.ground&&Math.abs(d.x-p.x)<4&&Math.abs(d.y-p.y)<4);
  const movingForward=p.vx>0.8;
  p.runStall=movingForward?Math.max(0,(p.runStall||0)-dt*2):(p.runStall||0)+dt;
  if(crowded.length>=2&&p.runStall>.65){
   const left=def.filter(d=>!d.ground&&d.x>p.x-1&&d.x<p.x+6&&d.y<p.y&&d.y>p.y-7).length;
   const right=def.filter(d=>!d.ground&&d.x>p.x-1&&d.x<p.x+6&&d.y>=p.y&&d.y<p.y+7).length;
   const side=left===right?(p.y<H/2?-1:1):(left<right?-1:1);
   targetY=clamp(p.y+side*4,1.35,H-1.35);
   p.intent='cutback';p.intentTarget='escape-congestion';
  }
 }
 const aheadX=Math.max(p.x+9,playStart+10);
 const dx=Math.max(2,aheadX-p.x);
 const dy=(targetY-p.y)*2.0;
 steer(p,dx,dy,dt,1.02);
}
function selectControlMode(mode){
 if(!['offense','defense','line'].includes(mode))return false;
 protectBall(false);controlMode=mode;manualDrive=false;rightStickLatched=false;rightStickDirection='';queuedCarrierMove=null;
 active=phase==='live'?(mode==='defense'?P(selectedDefenderKey):mode==='line'?P(selectedLinemanKey):ballCarrier||P('QB')):null;
 const el=$('controlMode');if(el)el.textContent='CONTROL: '+(mode==='defense'?'DEFENSE':mode==='line'?'O-LINE':'OFFENSE');
 hud();return true;
}
function cycleControlMode(){
 if(gameStarted){message('<strong>GAME DAY.</strong> HOME controls offense when receiving and defense when AWAY has the football. Use practice reset for manual role testing.');return controlMode;}
 const all=['offense','defense','line'];return selectControlMode(all[(all.indexOf(controlMode)+1)%all.length]);
}
// Movement updates only the selected player's actual location and the
// matching zone shade / run-fit lane. Man targets and rush/spy roles persist.
function positionSelectedDefender(dt){
 if(paused||phase!=='presnap'||controlMode!=='defense'||specialState||
    playbookOpen||audibleOpen||!scrimmagePlayCalled)return false;
 const d=P(selectedDefenderKey),axes=stickInput();
 const next=DefensivePresnap.move(d,axes,dt,playStart,def,sprintHeld());
 if(!next)return false;
 d.x=next.x;d.y=next.y;d.vx=0;d.vy=0;
 d.face=Math.atan2(axes.y,axes.x);
 if(d.assignment?.kind==='zone'){
   const a=d.assignment;
   if(a.homeX===undefined){a.homeX=a.baseX;a.homeY=a.baseY;}
   const anchor=DefensivePresnap.zoneAnchor(d);
   a.baseX=anchor.x;a.baseY=anchor.y;
 }
 // Keep the run-fit lane anchored to the offensive gaps; moving a linebacker
 // alters his approach angle, not which A/B gap he is assigned.
 // Stunt lane logic remains assigned, but ordinary rushers can use
 // their shifted starting lane rather than returning to the old spot.
 if(d.rush&&d.passRushStyle!=='stunt')d.passRushLane=d.y;
 return true;
}
function switchDefender(){
 if(controlMode!=='defense'||(phase!=='live'&&phase!=='presnap'))return false;
 let next;
 if(phase==='presnap'){
  // Predictable left-to-right sequence: defensive front, linebackers, corners, safeties.
  const category=d=>['EDGE','DE','DT','NT'].includes(d.pos)?0:['LB','OLB','MLB'].some(v=>d.pos.includes(v))?1:d.pos==='CB'?2:3;
  const order=[...def].sort((a,b)=>category(a)-category(b)||a.y-b.y);
  const i=order.findIndex(d=>d.key===selectedDefenderKey);
  next=order[(i+1)%order.length];
 }else{
  const carrier=ballCarrier||P('QB');if(!carrier)return false;
  const airborne=!!ball?.flying;
  const spot=airborne?(intended||flightMarkers()):carrier;
  const point=airborne&&!intended?{x:spot.catchX,y:spot.catchY}:spot;
  const order=[...def].filter(d=>!d.ground).sort((a,b)=>{
   const distance=dist(a,point)-dist(b,point);
   return Math.abs(distance)>.01?distance:a.key.localeCompare(b.key);
  });
  next=order.find(d=>d.key!==selectedDefenderKey);
 }
 if(!next)return false;
 selectedDefenderKey=next.key;active=next;hud();log('USER DEFENDER → '+next.pos);return true;
}
function manualAthlete(p,dt,label){
 // A diving tackle is a committed momentum action. Steering again during its
 // flight made the athlete visually truck/turn before falling a second time.
 if(p.action?.kind==='tackle-dive'&&p.action.time>0){
  p.intent='committed-dive';p.intentTarget='user';return;
 }
 p.intent=label;p.intentTarget='user';const input=stickInput();
 if(input.mag>.13)steer(p,input.x,input.y,dt,sprintHeld()?1.2:1.0);
 else steer(p,0,0,dt);
}
// An athlete tracking the target receiver may queue a response *well before*
// reaching the landing area if he can realistically arrive in time. Rotating
// help defenders qualify independently after reading the ball. No animations
// or interceptions are granted by this decision; physical ball contact remains
// controlled by airBall() and the existing reach/ratings checks.
function defenderAirEligibility(d){
 return AirContestPolicy.evaluate(d,intended,flightMarkers(),ball,
   d?maxSpeed(d):0,d?catchReach(d):0);
}
function defenderAirInteractionZone(d){return defenderAirEligibility(d).eligible;}
function defensiveOpenFieldDive(){
 const d=P(selectedDefenderKey);
 if(controlMode!=='defense'||phase!=='live'||!d||paused||!ball?.flying||
    d.stun>0||d.ground||d.tackleCooldown>0||d.diveRecovery>0||d.action?.time>0)return false;
 const stick=stickInput();
 const angle=Number.isFinite(d.face)?d.face:Math.PI;
 const dx=stick.mag>.14?stick.x:Math.cos(angle),dy=stick.mag>.14?stick.y:Math.sin(angle);
 const length=Math.max(.01,Math.hypot(dx,dy));
 d.action={kind:'tackle-dive',time:.53,age:0,used:false};
 d.technique='tackle-dive';d.pulse=.30;
 d.stam=Math.max(0,d.stam-.032);
 d.diveRecovery=Math.max(d.diveRecovery,1.20);
 d.tackleCooldown=Math.max(d.tackleCooldown,.68);
 d.vx+=dx/length*1.28;d.vy+=dy/length*1.28;
 d.face=Math.atan2(dy,dx);
 d.intent='committed-dive';d.intentTarget='user';
 log(d.pos+' OPEN-FIELD DIVE (ball out of reach)');
 return true;
}
function defensiveFaceButton(button){
 const d=P(selectedDefenderKey);
 if(controlMode!=='defense'||phase!=='live'||!d||paused||ball?.flying)return false;
 if(button==='A'){
  // Only indicate intent; no phantom animation, grip, or tackle. A may be
  // held for many frames without any opponent in reach.
  d.conservativeHeld=true;d.conservativeUntil=playClock+.23;return true;
 }
 if(button!=='X')return false;
 return commitDefenderImpact(d,'X');
}
function commitDefenderImpact(d,mode='X'){
 if(!d||d.team!==1||d.stun>0||d.ground||d.tackleCooldown>0||d.diveRecovery>0||d.action?.time>0)return false;
 // No target selection: launch along player motion or left-stick direction.
 const dir=ChaosTackleIntelligence.direction(d,stickInput());
 const nearest=off.filter(o=>!o.ground).map(o=>({o,gap:dist(d,o)})).sort((a,b)=>a.gap-b.gap)[0];
 const near=nearest&&nearest.gap<=radius(d)+radius(nearest.o)+.50;
 const kind=mode==='cut-stick'?'cut-stick':mode==='hit-stick'||near?'hit-stick':'tackle-dive';
 d.action={kind,time:kind==='tackle-dive'?.53:.38,age:0,used:false,direction:{...dir},impactContactKey:null};
 d.technique=kind;d.pulse=.3;d.stam=Math.max(0,d.stam-(kind==='tackle-dive'?.032:.026));
 d.face=Math.atan2(dir.y,dir.x);
 const launch=kind==='tackle-dive'?1.6:kind==='cut-stick'?.55:.75;
 d.vx+=dir.x*launch;d.vy+=dir.y*launch;
 if(kind==='tackle-dive'){d.diveRecovery=Math.max(d.diveRecovery,1.20);d.tackleCooldown=Math.max(d.tackleCooldown,.68);}
 // Power contact has no pre-contact tackle cooldown: the collision solver
 // must be able to observe the actual impact on this frame.
 d.intent='committed-'+kind;d.intentTarget='direction';
 log(d.pos+' commits '+kind+' (directional; no target lock)');return true;
}
function defensiveStick(kind){
 const d=P(selectedDefenderKey);if(controlMode!=='defense'||phase!=='live'||!d||paused||ball?.flying)return false;
 if(kind!=='hit-stick'&&kind!=='cut-stick')return false;
 return commitDefenderImpact(d,kind);
}
function lineImpact(){
 const o=P(selectedLinemanKey);if(controlMode!=='line'||phase!=='live'||!o||paused)return false;
 o.action={kind:'impact-block',time:.53,age:0,used:false};o.technique='impact-block';o.pulse=.33;
 o.stam=Math.max(0,o.stam-.021);
 const threat=closestThreat(o,def);if(threat.p&&threat.d<2.5)blockBattle(o,threat.p,1/60);
 log(o.pos+' drives impact block');return true;
}
function sprintHeld(){return !!keys.shift || (padState.connected&&padState.rt>.24)}
function userCarry(p,dt){
 const input=stickInput();
 if(suppressManualUntilNeutral){if(input.mag<=.12)suppressManualUntilNeutral=false;autoCarry(p,dt);return;}
 if(input.mag>.12)manualDrive=true;
 if(manualDrive){
  p.intent=input.mag>.12?'carry-manual':'carry-coast';p.intentTarget='user';
  if(input.mag>.12)steer(p,input.x,input.y,dt,sprintHeld()?1.2:1.0);
  else steer(p,0,0,dt); // neutral stick brakes; does NOT reactivate AI by surprise
 }else autoCarry(p,dt);
}
// Independent CPU QB: predict arrival windows instead of scanning only present
// receiver separation. The defensive player controls never force a scripted pass.
function quarterbackWindow(qb,rec){
 const rough=Math.max(.35,Math.hypot(rec.x-qb.x,rec.y-qb.y)/23);
 const predicted=projectedReceiver(rec,clamp(rough*1.35,.4,2.0));
 const flight=clamp(Math.hypot(predicted.x-qb.x,predicted.y-qb.y)/(23+(qb.THP-65)*.22)*1.35,.38,2.2);
 const arrival=projectedReceiver(rec,flight);
 const dx=arrival.x-qb.x,dy=arrival.y-qb.y,range=Math.hypot(dx,dy);
 const ballDepth=range/(35+(qb.THP-65)*.66);
 let danger=0,nearest=100,inside=0;
 for(const d of def){
  if(d.ground)continue;
  // Defensive coverage can reach the catch point after reacting, not teleport.
  const distNow=Math.hypot(arrival.x-d.x,arrival.y-d.y);
  const avail=Math.max(0,flight-clamp(.12+(100-d.AWR)*.006,.12,.55));
  const advance=clamp(speed(d)*.40*avail,0,Math.max(0,distNow-.35));
  const atCatch=Math.max(.3,distNow-advance);
  nearest=Math.min(nearest,atCatch);
  const catchRisk=clamp((3.2-atCatch)/2.8,0,1)*(d.COV*.005+d.CAT*.002+0.30);
  // A defender on the flight corridor can break up a flat pass. Evaluate the
  // middle half of the trajectory as well as the catch point.
  const deltaX=arrival.x-qb.x,deltaY=arrival.y-qb.y,length2=Math.max(.01,deltaX*deltaX+deltaY*deltaY);
  const t=clamp(((d.x-qb.x)*deltaX+(d.y-qb.y)*deltaY)/length2,0,1);
  const lineDist=Math.hypot(d.x-(qb.x+t*deltaX),d.y-(qb.y+t*deltaY));
  const trajectoryRisk=t>.16&&t<.91?clamp((1.4-lineDist)/1.4,0,1)*(.65*(1-t)) : 0;
  danger=Math.max(danger,catchRisk+trajectoryRisk);
  if(atCatch<1.7)inside++;
 }
 const openness=clamp((nearest-.7)/3.7,0,1);
 const catchSkill=rec.CAT*.07+rec.RTE*.025;
 // Decision model values yards gained, but may prioritize an easy checkdown.
 const progress=Math.max(0,arrival.x-playStart);
 const score=16*openness+catchSkill+Math.min(15,progress*.35)-danger*25-ballDepth*10;
 return {rec,arrival,flight,range,danger,openness,score,inside};
}
function cpuQuarterback(qb,dt){
 if(passThrown||ballCarrier)return;
 // Pressure is physical: an unassigned safety who actually comes downhill
 // counts once close enough to threaten the pocket. A defender merely
 // disguising a blitz before the snap does not.
 const activeRush=def.filter(d=>!d.ground&&(d.rush||
   (dist(d,qb)<5.8 && (d.vx*(qb.x-d.x)+d.vy*(qb.y-d.y))>Math.max(.6,dist(d,qb)*.42))));
 const rush=closestThreat(qb,activeRush);
 const pressure=clamp((5.2-rush.d)/4.7,0,1);
 // Stay in a pocket with lateral evasions. BSK affects escape composure.
 let wantX=playStart-4.2,wantY=26.65;
 if(rush.p&&rush.d<4){wantX=qb.x-(.6+pressure*.8);wantY=clamp(qb.y+(qb.y>=rush.p.y?1:-1)*(1.5+qb.BSK*.015),10,H-10)}
 qb.intent='qb-read';qb.intentTarget=cpuQB.choice?.key||'pocket';
 arrive(qb,wantX,wantY,dt,.58+qb.BSK*.002);
 if(playClock<cpuQB.nextRead)return;
 cpuQB.reads++;
 const options=eligibleTargets().map(r=>quarterbackWindow(qb,r));
 options.sort((a,b)=>b.score-a.score);
 // Field vision determines how much coverage the QB correctly perceives.
 // A poor VIS can underestimate risk and pick a lower-quality option.
 const recognition=clamp((qb.VIS-30)/69,0,1);
 let chosen=options[0];
 if(options.length>1 && rand()>recognition*.93+.05){
  const chance=rand();chosen=options[chance<.50?1:chance<.81?2:3]||chosen;
 }
 cpuQB.choice=chosen?.rec||null;
 cpuQB.lastScore=chosen?.score||0;cpuQB.lastRisk=chosen?.danger||0;
 const patience=clamp((100-qb.DEC)/100,0,1);
 const timeDemand=CpuQBPolicy.minimumSettle(selectedPlay,qb.DEC,qb.VIS);
 const progress=chosen?Math.max(0,chosen.arrival.x-playStart):0;
 const developed=chosen&&CpuQBPolicy.hasDeveloped(selectedPlay,playClock,progress,pressure);
 const readable=chosen&&chosen.score>CpuQBPolicy.selectThreshold(qb.DEC,qb.VIS)&&
   chosen.danger<CpuQBPolicy.dangerLimit(qb.VIS)&&chosen.openness>.22;
 // A QB with enough protection waits for receivers to complete the route's
 // meaningful break. Severe pressure permits a rushed or imperfect throw.
 const emergency=(pressure>.86&&rush.d<2.2&&playClock>Math.max(.90,timeDemand-.75))||
    playClock>Math.max(4.7,timeDemand+2.6);
 const panic=pressure>.86&&rush.d<2.1;
 if(playClock>=timeDemand && ((developed&&readable)||emergency)){
  const index=eligibleTargets().indexOf(chosen.rec);
  if(index>=0){
   const hold=chosen.range>19?.11:chosen.danger>.42?.46:.29;
   const fired=passTo(index,hold);
   if(fired){cpuQB.passes++;log('CPU QB · '+(emergency?'UNDER PRESSURE':'READ')+' · '+chosen.rec.key+' · risk '+chosen.danger.toFixed(2));return}
  }
 }
 if(panic && playClock>Math.max(1.2,timeDemand-.30) && qb.BSK>=58){
  // Scramble path responds to rush angle; crossing the LOS disables passing.
  arrive(qb,playStart+3,clamp(qb.y+(qb.y>=rush.p.y?5:-5),5,H-5),dt,1.10);
 }
 cpuQB.nextRead=playClock+clamp(.19+(100-qb.DEC)*.004,.18,.49);
}
function qbAI(p,dt){
 p.intent='qb-control';p.intentTarget='user';
 const input=stickInput();
 if(input.mag>.12)steer(p,input.x,input.y,dt,sprintHeld()?1.2:1);
 else steer(p,-.12,0,dt,.7);
}
function bodyCoupling(a,b,pass){
 // A real airborne foot clearance may pass over a *low* obstacle; upright
 // defenders still collide. A jump never creates a global collision shield.
 if((ChaosLowContact.clearance(a,b)||ChaosLowContact.clearance(b,a))&&
    !((a.ground&&b.ground)))return false;
 let dx=b.x-a.x,dy=b.y-a.y,sep=Math.hypot(dx,dy),ra=radius(a)*(a.ground?.65:1),rb=radius(b)*(b.ground?.65:1),minSep=ra+rb;
 const engaged=!!ballCarrier && ((a===ballCarrier&&tackleLinks.has(b.key))||(b===ballCarrier&&tackleLinks.has(a.key)));
 minSep=ChaosBodyConstraint.minimumSeparation(ra,rb,engaged);
 const broadSep=minSep;
 // Non-gripped carrier/defender pad collisions were being held farther apart
 // than the anatomical torso/arm capsules could actually meet. That generated
 // pushing impulses while repeatedly denying any real tackle contact.
 // Permit a small shoulder/hip engagement depth; no grip is awarded here.
 if(!engaged&&ballCarrier&&!a.ground&&!b.ground&&a.team!==b.team&&
   (a===ballCarrier||b===ballCarrier))minSep=Math.max(.30,minSep-.17);
 const meshRoutePair=selectedPlay==='mesh'&&a.team===0&&b.team===0&&!!a.route&&!!b.route;
 // Crossing teammates give one another shoulder room instead of fully
 // contacting pad-to-pad. They can still be jostled, but not pancake each other.
 if(meshRoutePair)minSep+=.32;
 if(sep>broadSep+.018)return false;
 if(sep<.0001){dx=a.key<b.key?1:-1;dy=.003;sep=Math.hypot(dx,dy)}
 const nx=dx/sep,ny=dy/sep,ma=mass(a),mb=mass(b),invA=1/ma,invB=1/mb;
 if(pass===0&&a.team!==b.team){
  // Physics contact happens first. A committed hit may strike ANY opponent:
  // receiver, blocker, lineman, or carrier. No targeted magnetism/pancake.
  for(const [attacker,victim,sign] of [[a,b,1],[b,a,-1]]){
   const act=attacker.action;
   if(!act||act.kind!=='hit-stick'||act.time<=0||act.used)continue;
   const dir=act.direction||{x:Math.cos(attacker.face||0),y:Math.sin(attacker.face||0)};
   const aim=dir.x*nx*sign+dir.y*ny*sign;
   const normal=Math.max(0,(attacker.vx-victim.vx)*nx*sign+(attacker.vy-victim.vy)*ny*sign);
   if(aim<.16||normal<.1)continue;
   const impulse=ChaosTackleIntelligence.impact(attacker,victim,normal);
   act.used=true;act.impactContactKey=victim.key;
   if(victim!==ballCarrier&&!(victim.key==='QB'&&!ballCarrier&&!passThrown)){
    victim.vx+=dir.x*impulse.strength*mass(attacker)/(ma+mb);
    victim.vy+=dir.y*impulse.strength*mass(attacker)/(ma+mb);
    victim.balance=clamp(victim.balance-impulse.strength*.085,.2,1);
    victim.impact=Math.max(victim.impact,.35*impulse.power);
    attacker.vx-=dir.x*impulse.strength*.23;attacker.vy-=dir.y*impulse.strength*.23;
    log(attacker.pos+' POWER CONTACT with '+victim.pos+' · no automatic pancake');
   }
  }
 }
 // Capture legitimate anatomical contact *before* four positional correction
 // passes can erase it from the post-solver tackle sample. Read-only evidence;
 // the tackle solver still checks eligibility, cooldown, and grip progression.
 if(pass===0&&ballCarrier&&a.team!==b.team&&!a.ground&&!b.ground&&
    (a===ballCarrier||b===ballCarrier)){
  const runner=a===ballCarrier?a:b,defender=runner===a?b:a;
  const body=ChaosContactOutcomes.evaluate(runner,defender);
  if(body.bodyContact&&body.penetration>=.095){
   const old=liveTackleContacts.get(defender.key);
   if(!old||body.penetration>old.penetration)liveTackleContacts.set(defender.key,body);
  }
 }
 const penetration=Math.max(0,minSep-sep);
 // Classify from incoming momentum BEFORE collision impulses. Body contact
 // records a short-lived physical event; animation merely reads it later.
 const square=engaged?ChaosSquareContact.classify(a,b,nx,ny):null;
 const candidate=(!a.ground&&!b.ground&&a.team!==b.team&&ballCarrier&&(a===ballCarrier||b===ballCarrier))?
   ChaosSquareContact.classify(a,b,nx,ny):null;
 if(candidate?.square>.32&&pass===0){
   const runner=a===ballCarrier?a:b,defender=runner===a?b:a;
   const previous=defender.squareImpact;
   if(!previous||previous.time<playClock-.05||candidate.square>previous.score){
    defender.squareImpact={carrier:runner.key,score:candidate.square,time:playClock};
   }
   // Impact posture persists only during real contact and is not a tackle award.
   runner.standContact=Math.max(runner.standContact||0,candidate.square*.75);
   defender.standContact=Math.max(defender.standContact||0,candidate.square*.75);
 }
 if(penetration>0){
  const correction=meshRoutePair?Math.min(.22,penetration*.88):ChaosBodyConstraint.correction(a,b,penetration,engaged); // bounded core separation
  a.x-=nx*correction*invA/(invA+invB);a.y-=ny*correction*invA/(invA+invB);
  b.x+=nx*correction*invB/(invA+invB);b.y+=ny*correction*invB/(invA+invB);
 }
 const relX=b.vx-a.vx,relY=b.vy-a.vy,closing=relX*nx+relY*ny;
 if(closing>=-.025)return penetration>0;
 const normalSpeed=-closing,slide=relX*(-ny)+relY*nx;
 const restitution=normalSpeed<1.0?.02:clamp(.06+.008*normalSpeed,.06,.16);
 // kg·yd/s impulse. Convert to N·s (kg·m/s) for HUD.
 const J=-(1+restitution)*closing/(invA+invB);
 a.vx-=J*invA*nx;a.vy-=J*invA*ny;
 b.vx+=J*invB*nx;b.vy+=J*invB*ny;
 // Friction + asymmetrical shoulder/hip contact transfers a little sideways
 // velocity and creates a visible loss of balance rather than skating bodies.
 // Opposing square pads create strong lateral friction: avoid sliding past
 // each other. Glancing contacts retain their previous freer response.
 const lateralScale=candidate?.square>.50?.42:.19;
 const jt=clamp(-slide/(invA+invB),-J*lateralScale,J*lateralScale);
 a.vx-=jt*invA*(-ny);a.vy-=jt*invA*nx;
 b.vx+=jt*invB*(-ny);b.vy+=jt*invB*nx;
 const hit=J*YARD_M;
 if(carrierCollisionDiagnostics&&(a===ballCarrier||b===ballCarrier)){
  carrierCollisionDiagnostics.push({pair:[a.key,b.key],pass,normalNs:hit,tangentNs:jt*YARD_M});
 }
 // Only the first contact iteration can generate a new down event. The repeated
 // solver passes still handle momentum transfer and prevent overlapping bodies.
 // Receivers on the same Mesh concept should avoid contact rather than
 // knock one another out of a route. Keep collision separation/impulses;
 // suppress only accidental *teammate knockdowns* from their crossing.
 if(pass===0&&!meshRoutePair&&!a.ground&&!b.ground&&hit>240){
   // A charging player who delivers the collision should not be knocked down
   // as often as the stationary or retreating player who absorbs it. Equal
   // head-on impacts can still knock both down depending on their ratings.
   const closingA=Math.max(0,a.vx*nx+a.vy*ny);
   const closingB=Math.max(0,-b.vx*nx-b.vy*ny);
   if(closingA>closingB*1.28)groundContact(b,a,hit*ChaosLowContact.bodyVulnerability(b),normalSpeed,nx,ny,'body');
   else if(closingB>closingA*1.28)groundContact(a,b,hit*ChaosLowContact.bodyVulnerability(a),normalSpeed,-nx,-ny,'body');
   else {
     groundContact(a,b,hit*ChaosLowContact.bodyVulnerability(a),normalSpeed,-nx,-ny,'body');
     groundContact(b,a,hit*ChaosLowContact.bodyVulnerability(b),normalSpeed,nx,ny,'body');
   }
 }
 if(hit>13){
  chainHits++;
  lastContact=Math.round(hit);
  const sideA=Math.sin(a.face)*nx-Math.cos(a.face)*ny;
  const sideB=-Math.sin(b.face)*nx+Math.cos(b.face)*ny;
  const angularA=clamp((slide*.09+sideA*normalSpeed*.13)*J/ma,-1.9,1.9);
  const angularB=clamp((slide*.09-sideB*normalSpeed*.13)*J/mb,-1.9,1.9);
  a.spin=clamp(a.spin-angularA,-3,3);b.spin=clamp(b.spin+angularB,-3,3);
  a.lean=clamp(a.lean+angularA*.18,-.56,.56);
  b.lean=clamp(b.lean+angularB*.18,-.56,.56);
  a.balance=clamp(a.balance-hit*ChaosLowContact.bodyVulnerability(a)/(ma*35),.20,1);
  b.balance=clamp(b.balance-hit*ChaosLowContact.bodyVulnerability(b)/(mb*35),.20,1);
  a.impact=Math.max(a.impact,clamp(hit/700,.1,.8));
  b.impact=Math.max(b.impact,clamp(hit/700,.1,.8));
  a.pulse=Math.max(a.pulse,.16);b.pulse=Math.max(b.pulse,.16);
 }
 return true;
}
function resolveBodyContacts(){
 // Four Gauss-Seidel contact passes transfer impulses down chains: A→B→C.
 // Rotating iteration order prevents all outcomes depending on roster order.
 for(let pass=0;pass<4;pass++){
  const forward=pass%2===0;
  for(let ii=0;ii<players.length;ii++){
   const i=forward?ii:players.length-1-ii;
   for(let jj=0;jj<players.length;jj++){
    const j=forward?jj:players.length-1-jj;
    if(i>=j)continue;
    bodyCoupling(players[i],players[j],pass);
   }
  }
 }
}
function applyMotion(dt){
 liveTackleContacts.clear();
 if(carrierCollisionDiagnostics)carrierCollisionDiagnostics.length=0;
 const anatomyBefore=players.map(p=>ChaosContactEvidence.poseCopy(p));
 for(const p of players){
  if(p.ground){p.vx*=.66;p.vy*=.66;}
  ChaosLowContact.advance(p,dt);
  p.travel+=Math.hypot(p.vx,p.vy)*dt;
  p.x=clamp(p.x+p.vx*dt,0,120);p.y=clamp(p.y+p.vy*dt,-.3,H+.3);
  p.diveRecovery=Math.max(0,(p.diveRecovery||0)-dt);
  p.blocked=Math.max(0,p.blocked-dt);p.tackleCooldown=Math.max(0,p.tackleCooldown-dt);
  p.shedCooldown=Math.max(0,p.shedCooldown-dt);p.pulse=Math.max(0,p.pulse-dt);
  p.impact=Math.max(0,p.impact-dt*1.5);p.standContact=Math.max(0,(p.standContact||0)-dt*1.6);p.spin*=Math.max(0,1-dt*3.7);
  p.tackleStrain=Math.max(0,(p.tackleStrain||0)-dt*2.3);
  p.breakExertion=Math.max(0,(p.breakExertion||0)-dt*.075);
  if(p.escapeReaction){p.escapeReaction.time-=dt;if(p.escapeReaction.time<=0)p.escapeReaction=null;}
  p.lean*=Math.max(0,1-dt*2.0);p.balance=clamp(p.balance+dt*.34,.3,1);
 }
 // React to downed defenders ahead; this is a *small* conditional hop, not
 // invulnerability, and a reachable grounded defender may still grab the foot.
 if(phase==='live'&&ballCarrier&&!ballCarrier.ground&&ballCarrier.team===0){
  const r=ballCarrier;
  if(!r.airState&&r.action?.kind!=='hurdle')for(const d of def){
   if(ChaosLowContact.shouldAutoHop(r,d)){
    if(ChaosLowContact.initiate(r,'hop')){
     r.autoHopCooldown=1.05;r.stam=Math.max(.04,r.stam-.009);
     actionCue(r,'HOP',true);break;
    }
   }
  }
 }
 resolveBodyContacts();
 // Physically stop low diving shoulders/arms crossing the runner's legs.
 // This applies to special-teams returns and scrimmage; contact is NOT a
 // tackle award and a genuinely wide miss is untouched.
 if(phase==='live'&&ballCarrier&&!ballCarrier.ground){
  const pre=new Map(anatomyBefore.map(p=>[p.key,p]));
  for(const d of def){
   if(d.ground||d.action?.kind!=='tackle-dive'||d.action.time<=0)continue;
   const runnerBefore=pre.get(ballCarrier.key),diveBefore=pre.get(d.key);
   if(!runnerBefore||!diveBefore)continue;
   const sample=ChaosDiveCollision.evaluate(runnerBefore,ballCarrier,diveBefore,d);
   if(!sample.hit)continue;
   // Avoid injecting the impulse repeatedly during one continuing overlap.
   const fresh=playClock-(d.lowDiveImpactAt??-999)>.13;
   const outcome=fresh?ChaosDiveCollision.response(ballCarrier,d,runnerBefore,diveBefore,sample,dt,mass(ballCarrier),mass(d)):sample;
   if(fresh){
    d.lowDiveImpactAt=playClock;
    lowDiveContacts++;
    lastLowDiveImpact={time:+playClock.toFixed(3),runner:ballCarrier.key,defender:d.key,
     kind:outcome.kind,physical:!!outcome.physical,regions:outcome.regions,swept:outcome.swept};
   }
  }
 }
 // Low foot/ankle impacts: momentum, balance and lower-body placement
 // choose a stumble, a trip or a clean clearance. This works on kickoffs too.
 if(phase==='live'&&ballCarrier&&!ballCarrier.ground&&ballCarrier.team===0){
  const r=ballCarrier,prior=new Map(anatomyBefore.map(p=>[p.key,p]));
  for(const d of def){
   if(!ChaosLowContact.isLowThreat(d)||r.lowContactCooldown>0)continue;
   const hit=ChaosLowContact.evaluate(prior.get(r.key)||r,r,prior.get(d.key)||d,d);
   if(!hit.hit)continue;
   // Ignore early capsule fringe overlaps; measure meaningful contact nearer
   // the runner's leg instead of latching a long cooldown on a toe brush.
   if(hit.contact<.35)continue;
   r.lowContactCooldown=.27;d.lowContactCooldown=.28;
   const velocity=Math.hypot(r.vx,r.vy);
   const raw=hit.contact*(.46+.07*Math.min(7,velocity)+.034*Math.min(7,hit.closing));
   const resistance=clamp((r.AGI*.43+r.STR*.22+r.TRK*.20+r.AWR*.15-65)/175,-.08,.19);
   const grip=clamp((d.TAK*.62+d.STR*.23+d.AWR*.15-65)/150,-.08,.22);
   // Harder to brace or redirect a body with no foot planted under it.
   const airRisk=ChaosLowContact.bodyVulnerability(r);
   const severity=clamp(raw*(1+grip-resistance)*airRisk,0,1.65);
   r.vx*=Math.max(.57,1-severity*.28);r.vy*=Math.max(.57,1-severity*.28);
   r.balance=clamp(r.balance-severity*.32,.16,1);
   r.impact=Math.max(r.impact,Math.min(.6,.20+severity*.30));
   r.stumbleTime=Math.max(r.stumbleTime,.21+severity*.30);
   const dir=Math.atan2(r.y-d.y,r.x-d.x);
   r.lean=clamp(r.lean-.22*severity,-.56,.56);
   r.spin=clamp(r.spin+Math.sin(dir-(r.face||0))*severity*.40,-3,3);
   d.vx*=Math.max(.22,1-severity*.34);d.vy*=Math.max(.22,1-severity*.34);
   if(d.ground)d.ankleReachTime=.34;
   else d.impact=Math.max(d.impact,.18+severity*.17);
   const truckWon=r.lastTruckOutcome?.win && r.lastTruckOutcome.defender===d.key &&
    playClock-r.lastTruckOutcome.at<.48;
   // Keep real ankle forces even during a truck, but do not overwrite a
   // successfully resolved TRUCK cue with a small leg-contact notification.
   const feedback=ChaosContactFeedback.label({severity,balance:r.balance,truckWon,tripped:false});
   const visibleStumble=feedback==='STUMBLE';
   if(feedback)actionCue(r,feedback,false);
   // Severe actual contact plus loss of support can take a runner down. A
   // light toe touch or a cleanly hurdled body never forces a tackle.
   const tripped=(severity>.88 && (r.balance<.72||severity>1.08)) ||
    (severity>.64 && r.balance<.45);
   lastFootContact={kind:hit.kind,part:hit.part,airHeight:+hit.height.toFixed(3),
    severity:+severity.toFixed(3),result:tripped?'trip':truckWon?'truck-with-leg-contact':visibleStumble?'stumble':'minor-leg-contact',defender:d.key,
    time:+playClock.toFixed(3)};
   footContacts++;
   if(tripped){
    actionCue(r,'TRIPPED',true);
    r.airState=null;r.ground={stage:'winded',time:.50,fall:.1,rest:.40,rise:.40,age:.3,
     kind:'trip',from:d.key,dir,severity};
    log(d.pos+' trips '+r.name+' at '+hit.part);
    if(specialState)finishReturn('tackle',r.x,r.name+' tripped at the ankles');
    else finish('tackle',r.x,r.name+' tripped at the ankles');
    break;
   }else if(visibleStumble)log(d.pos+' clips '+r.name+' lower leg · stumbles');
  }
 }
 // Read-only swept anatomical evidence after contact resolution. Physical
 // outcomes remain governed by the existing, stable tackle/block solvers.
 if(phase==='live')ChaosContactEvidence.scan(anatomyBefore,players.map(p=>{const s=ChaosContactEvidence.poseCopy(p);s.isCarrier=(p===ballCarrier);return s;}),playClock,{all:ChaosContactEvidence.isFullScan()});
 for(const p of players){
  p.x=clamp(p.x,0,120);p.y=clamp(p.y,-.3,H+.3);
  const v=speed(p),limit=maxSpeed(p)*1.32;
  if(v>limit){p.vx*=limit/v;p.vy*=limit/v}
 }
}

// A standing tackle can develop into a moving scrum. The OL must reach the pile
// and make contact, not trigger a scripted extra-yard roll from a distance.
function pileSupport(o,a,dt){
 if(o===a||o.team!==0||o.pos==='QB'||!(o.pos==='FB'||o.pos==='TE'||o.pos==='OL'||['LT','LG','C','RG','RT'].includes(o.key)))return false;
 if(dist(o,a)>14)return false;
 const eligible=off.filter(p=>p!==a&&(p.pos==='TE'||p.pos==='FB'||['LT','LG','C','RG','RT'].includes(p.key)))
  .sort((p,q)=>dist(p,a)-dist(q,a)).slice(0,4);
 const slot=eligible.indexOf(o);if(slot<0)return false;
 // Approach the back of the carrier; lateral slots spread the pushers around
 // the hips without instantly teleporting them into position.
 const targetX=a.x-radius(a)-radius(o)*.85-.08;
 const targetY=clamp(a.y+(slot-1.5)*.36,1,H-1);
 o.intent='pile-support';o.intentTarget=a.key;
 steer(o,targetX-o.x,(targetY-o.y)*1.2,dt,1.12);
 return true;
}
function resolvePileDrive(dt){
 for(const p of off)p.pushing=false;
 if(!pileState?.active||!ballCarrier)return;
 const a=ballCarrier,pile=pileState;pile.pushers=[];
 for(const p of off){
  if(p===a||p.intent!=='pile-support')continue;
  const dx=a.x-p.x,side=Math.abs(a.y-p.y);
  const maxReach=radius(a)+radius(p)+.29;
  if(dist(p,a)>maxReach||dx<-.10||side>1.10)continue;
  // True hand contact. Blocking, strength, mass and existing forward velocity
  // determine the OL's foot-drive. A smaller TE pushes less than a strong G.
  const body=clamp(mass(p)/135,.64,1.30);
  const technique=clamp(.30+p.BLO*.0057+p.STR*.0034,.57,1.29);
  const leverage=clamp((p.h-a.h)*.012+.99,.84,1.13)*clamp(p.balance,.5,1);
  const angle=Math.max(.16,dx/Math.max(.1,dist(p,a)));
  const output=body*technique*leverage*angle*clamp(p.stam,.30,1)*(p.action?.kind==='impact-block'&&p.action.time>0?1.23:1);
  // Feed force to the *lineman*, never teleport the carrier. The body-contact
  // solver transfers that impulse through everyone he's actually touching.
  p.vx+=acceleration(p)*output*.82*dt;
  p.vy+=(a.y-p.y)*dt*.9;
  p.stam=Math.max(.25,p.stam-dt*.047*output);
  p.pushing=true;p.intent='pile-drive';
  p.lean=clamp(p.lean*.92-.10*output,-.42,.42);
  pile.pushers.push({key:p.key,output:Number(output.toFixed(3))});
 }
 const grips=[...tackleLinks.values()].map(e=>P(e.defender)).filter(Boolean);
 pile.wrappers=grips.map(p=>p.key);
 // Tacklers push from opposite angles, holding the runner up. They generate
 // resistance at their own feet, which transmits through the same collisions.
 for(const d of grips){
  const forwardFacing=d.x>=a.x-.1;
  if(!forwardFacing)continue;
  const hold=clamp(.25+d.TAK*.0042+d.STR*.0034,.52,1.15)*clamp(mass(d)/112,.72,1.45)*(1+Math.max(0,grips.length-2)*.16);
  d.vx-=acceleration(d)*hold*.38*dt;
  d.lean=clamp(d.lean+.06*hold,-.4,.4);
 }
}
function maintainPile(a,engaged,grip,dt){
 if(!pileState?.active)return false;
 const pile=pileState;
 if(pile.carrier!==a.key){pileState=null;return false}
 pile.age+=dt;
 const advance=a.x-pile.lastX;
 if(advance>0)pilePushYards+=advance;
 // Forward progress resets the stall clock; a tiny head/hip bob doesn't.
 const progress=advance>dt*.34;
 pile.stalled=clamp(pile.stalled+(progress?-dt*1.4:dt),0,5);
 pile.lastX=a.x;
 pile.maxX=Math.max(pile.maxX,a.x);
 pile.wrappers=[...tackleLinks.keys()];
 if(engaged<2){pile.loose+=dt;if(pile.loose>.24){pileState=null;return false}}else pile.loose=0;
 // In actual football this would require officials' judgment: standstill or
 // runner down. This 2D model uses a bounded forward-progress approximation.
 if((pile.age>.55&&pile.stalled>.88)||(pile.age>3.3)|| (grip>2.75&&a.balance<.48&&pile.age>.7)){
  const pusherNames=(pile.pushers||[]).map(x=>x.key).join(' + ');
  const gain=Math.max(0,pile.maxX-pile.startX);
  const summary='Standing pile · '+Math.round(gain*10)/10+' yd driven'+(pusherNames?' · pushed by '+pusherNames:'');
  log(summary);shake=.22;
  finish('tackle',a.x,summary);return true;
 }
 return true;
}

function tackleLeverage(a,d){
 const delta=Math.max(.01,dist(a,d)),nx=(a.x-d.x)/delta,ny=(a.y-d.y)/delta;
 const closing=(d.vx-a.vx)*nx+(d.vy-a.vy)*ny;
 const impact=Math.hypot((d.vx-a.vx)*YARD_M,(d.vy-a.vy)*YARD_M);
 const impulse=mass(a)*mass(d)/(mass(a)+mass(d))*impact*1.08;
 // A running back absorbing a blind-side hit is not the same as squaring up
 // an arm tackle from behind. Tackling fundamentals / awareness matter.
 const fromBehind=clamp((a.vx*nx+a.vy*ny)/Math.max(.4,speed(a)),-1,1);
 const technique=.49*d.TAK+.18*d.STR+.17*d.AWR+.08*d.AGI+.08*d.HIT;
 const resistance=.48*a.TRK+.26*a.STR+.15*a.AGI+.11*a.AWR;
 const weight=(mass(d)-mass(a))*.105;
 const leverage=clamp((d.h-a.h)*.48,-5,5);
 const advantage=(technique-resistance)*.48+weight+leverage+closing*1.0-fromBehind*7;
 return {closing,impulse,advantage,quality:clamp(.8+advantage*.016,.43,1.43)};
}
function releaseTackle(d,a,reason,contest=null){
 const link=tackleLinks.get(d.key);if(!link)return;
 tackleLinks.delete(d.key);
 d.wrapLinked=false;d.wrapReach=0;
 d.intent='recover';d.intentTarget=a.key;
 if(reason==='escape'){
  ChaosTackleReengagement.release(d,a,radius(a)+radius(d),playClock);
  const reaction=ChaosEscapeReactions.release(a,d,link,contest||link.escapeDiagnostics||{});
  // Failure of a grip is not failure of balance. Most defenders stay upright
  // and may pursue again. A committed airborne dive still lands physically.
  d.tackleCooldown=Math.max(d.tackleCooldown,clamp(reaction.recovery,.14,.65));
  d.stun=Math.max(d.stun,reaction.fall?.17:clamp(.05+reaction.instability*.18,.05,.23));
  d.balance=clamp(d.balance-reaction.instability*.09,.23,1);
  d.vx+=reaction.nx*reaction.tug;d.vy+=reaction.ny*reaction.tug;
  d.escapeReaction={kind:reaction.kind,time:reaction.duration,duration:reaction.duration,
    intensity:reaction.intensity,side:reaction.side};
  a.escapeReaction={kind:reaction.kind==='power-pull'?'drive-through':reaction.kind,
    time:.42,duration:.42,intensity:reaction.intensity,side:reaction.side};
  if(reaction.fall){
   d.ground={stage:'fall',time:.21,fall:.21,rest:.23,rise:.36,age:0,
    force:0,from:a.key,kind:reaction.kind,dir:Math.atan2(d.y-a.y,d.x-a.x),severity:reaction.intensity};
   d.groundLock=0;d.technique='broken-grip-fall';d.intent='fall';
  }else d.technique='grip-slip';
  // Breaks consume leg energy and can reduce next attempt's power; the
  // constraint is fatigue and balance, never an arbitrary streak cap.
  const prior=clamp(a.breakExertion||0,0,1);
  a.breakExertion=clamp(prior+.17+.11*reaction.intensity,0,1);
  const cost=(link.style==='wrap'?.045:.025)+.016*prior+.014*reaction.intensity;
  a.stam=Math.max(.045,a.stam-cost);
  a.balance=clamp(a.balance-(link.style==='wrap'?.035:.014)*reaction.intensity,.25,1);
  d.stam=Math.max(.045,d.stam-.015);
  brokenTackleCount++;
  const secured=contest?.kind==='wrap break';
  actionCue(a,secured?'WRAP BREAK':'BREAK TACKLE',true);
  log(a.name+' '+(secured?'breaks secured wrap':'sheds '+d.pos+' grip')+
    ' · '+reaction.kind+(reaction.fall?' · loses balance':' · stays upright'));
 }else{
  // A hold slipping out of physical reach is a release, not a stat-awarded
  // break or an automatic defender knockdown.
  d.tackleCooldown=Math.max(d.tackleCooldown,.18);
  d.stun=Math.max(d.stun,.06);
 }
}
// Defenders choose a secure wrap or a momentum-dependent hit. A hit can
// dislodge the runner but risks failing to wrap if leverage is poor.
function tackleStyle(a,d,hit){
 if(d.conservativeHeld||d.conservativeUntil>playClock||d.action?.time>0&&d.action.kind==='conservative')return 'wrap';
 if(d.action?.time>0&&!d.action.used&&d.action.kind==='tackle-dive')return 'dive';
 if(d.action?.time>0&&!d.action.used&&d.action.kind==='cut-stick')return 'cut';
 if(!d.action&&d.lastTackleDecision?.choice==='hit-stick'&&playClock-d.lastTackleDecision.time<.15)return 'hit';
 if(d.action?.time>0&&d.action.kind==='hit-stick'&&(!d.action.used||d.action.impactContactKey===a.key))return 'hit';
 // Occasional CPU low tackle against an open-field runner. It can be hurdled,
 // but only when read early, timed and physically close. Rated PUR/TAK affect
 // the decision; the rest of the time the defender prefers the safer wrap.
 // A CPU dive must be committed before collision by chooseDefenderCommitment().
 // No new chance-driven cut-stick can appear from contact alone.
 const speedIn=Math.max(0,hit.closing);
 const headOn=hit.advantage>-12 && d.HIT>=76 && d.TAK>=66;
 const power=(d.HIT*.46+d.STR*.25+d.TAK*.20+d.AWR*.09);
 return headOn&&speed(d)>2.2&&speedIn>1.05&&power>79?'hit':'wrap';
}
function finishTackle(a,contacts,type){
 const names=contacts.map(c=>c.d.pos+(c.t.style==='hit'?' HIT':'')).join(' + ');
 const impulse=Math.round(contacts.reduce((sum,c)=>sum+c.t.initialImpulse,0));
 const description=type+' · '+names+' · '+impulse+' N·s';
 a.stam=Math.max(.045,a.stam-.022);
 for(const c of contacts)c.d.stam=Math.max(.045,c.d.stam-.037);
 log(description);shake=.18;
 finish(a===P('QB')?'sack':'tackle',a.x,description);
}
// A hurdle can evade a well-timed low cut, but it exposes the carrier to
// conventional high/wrap tackling. It never bypasses physical collision rules.
function resolveHurdle(a,d,style){
 // Y attempts a jump, not a guaranteed break. A low tackle only misses when
 // the runner's feet really clear the low obstacle at the contact instant.
 const low=style==='cut'||style==='dive'||!!d.ground;
 if(!low||!ChaosLowContact.clearance(a,d))return false;
 if(a.action?.kind==='hurdle')a.action.used=true;
 if(a.airState?.kind==='hurdle')actionCue(a,'HURDLE',true);
 return true;
}
function resolveTackles(a,dt){
 if(!a||a.team!==0)return;
 const report=tackleDiagnostics;
 if(report)report.length=0;
 for(const d of def){
  const recovery=d.ground?'grounded':d.stun>0?'stunned':
    d.tackleCooldown>0&&d.action?.kind!=='tackle-dive'?'tackle cooldown':null;
  if(recovery){report?.push({defender:d.key,reason:recovery});d.wrapReach=0;d.wrapLinked=false;continue;}
  // A quarterback holding the ball can be tackled by ANY defender who
  // physically reaches him, including a user-blitzing safety or linebacker.
  // Rush assignments affect pursuit and blocking, not tackle eligibility.
  const proximity=dist(a,d);
  if(!ChaosTackleReengagement.observe(d,a,radius(a)+radius(d),playClock)){
   report?.push({defender:d.key,reason:'reengagement'});
   d.wrapReach=0;d.wrapLinked=false;continue;
  }
  // Animate hands reaching BEFORE torso collision. This state has no effect on
  // collision awards or grip probabilities; it only drives the shared rig.
  const committedDive=d.action?.kind==='tackle-dive'&&d.action.time>0;
  const linkActive=tackleLinks.has(d.key);
  const towardX=a.x-d.x,towardY=a.y-d.y;
  const lookDot=(Math.cos(d.face||0)*towardX+Math.sin(d.face||0)*towardY)/Math.max(.001,proximity);
  // Facing matters while approaching; it cannot make a body that's already
  // physically interpenetrating the runner permanently untackleable.
  // The actual anatomical/contact test below still decides engagement.
  const establishedBodyContact=proximity<=radius(a)+radius(d)-.025;
  // A stale block penalty must not make a defender physically pressing into
  // the carrier ineligible forever. Only a nearby *live* blocker may deny
  // access to the runner; block wins and shed recovery remain meaningful away
  // from the ball. This applies equally to scrimmage and kickoff plays.
  const nearbyBlock=[...blockLinks.values()].some(link=>link.defender===d.key&&
    P(link.blocker)&&dist(P(link.blocker),d)<2.15&&link.secured>.28);
  if(proximity<radius(a)+radius(d)+.16&&!nearbyBlock&&d.blocked>.25&&
     d.shedCooldown<=0)d.blocked=0;
  const eligible=!committedDive&&(!d.action?.time||['conservative'].includes(d.action.kind)) &&
    (lookDot>-.1||linkActive||establishedBodyContact) && d.blocked<.28;
  // Intent never creates a grip or a phantom tackle. Reach begins at
  // overlapping collision bodies; the opponent remains free to sidestep.
  const contactReach=proximity<=radius(a)+radius(d)+.20||linkActive;
  const desired=eligible&&contactReach?clamp((radius(a)+radius(d)+.25-proximity)/.65,.12,1):0;
  d.wrapReach=clamp((d.wrapReach||0)+clamp(desired-(d.wrapReach||0),-dt*5.4,dt*5.4),0,1);
  d.wrapLinked=linkActive;

  // Broadphase stays cheap; only nearby runners need 15-region analysis.
  const anatomical=proximity<1.65?ChaosContactOutcomes.evaluate(a,d):null;
  const physicalContact=liveTackleContacts.get(d.key)||null;
  const touching=!!physicalContact||proximity<radius(a)+radius(d)+.20||
    (committedDive&&anatomical&&anatomical.potential&&proximity<1.45);
  const activeBlock=[...blockLinks.values()].find(link=>link.defender===d.key&&link.secured>.42&&dist(P(link.blocker),d)<2.15);
  if(activeBlock)d.blocked=Math.max(d.blocked,.34+activeBlock.secured*.15);
  if(touching&&specialState?.returning&&d.blocked>=.25){
   const link=[...blockLinks].find(([,e])=>e.defender===d.key);
   const blocker=link?P(link[1].blocker):null;
   if(!blocker||dist(d,blocker)>2.05){
    if(link)blockLinks.delete(link[0]);
    d.blocked=0;
   }
  }
  if(report&&!linkActive&&(!touching||d.blocked>=.25)){
   report.push({defender:d.key,reason:!touching?'out of contact reach':
     activeBlock?'secured block':d.shedCooldown>0?'shed recovery':'blocking penalty',proximity});
  }
  if(touching&&!linkActive&&d.blocked<.25){
   const currentContact=anatomical||ChaosContactOutcomes.evaluate(a,d);
   // Preserve real pre-separation body evidence when post-solver geometry no
   // longer intersects. This never turns bare proximity into a tackle.
   const contactState=physicalContact&&(!currentContact.bodyContact||
     physicalContact.penetration>currentContact.penetration)?physicalContact:currentContact;
   // A proximity radius is an inexpensive broad-phase only. Do not start a
   // tackle from empty air, and never convert a shallow arm brush into a wrap.
   // A committed dive may also carry swept contact evidence from this step.
   const swept=ChaosContactEvidence.history().slice(-12).some(e=>
     e.pair.includes(a.key)&&e.pair.includes(d.key)&&playClock-e.time>=0&&playClock-e.time<.075&&e.penetration>=.095);
   const committedDive=d.action?.kind==='tackle-dive'&&d.action.time>0;
   // Do not let a dive's proximity radius award a ghost tackle. Preserve the
   // stable standing-wrap solver until its full-body geometry is calibrated.
   if((committedDive&&contactState.kind==='miss'&&!swept)||
      (contactState.kind==='light contact'&&!swept)){
    report?.push({defender:d.key,reason:contactState.kind==='miss'?'missed dive':'light contact',contact:contactState});
    continue;
   }
   const hit=tackleLeverage(a,d);
   const style=tackleStyle(a,d,hit);
   if(style==='cut'&&!d.action)d.action={kind:'cut-stick',time:.40,age:0,used:false};
   if(resolveCarrierAction(a,d,hit)){
    report?.push({defender:d.key,reason:'carrier action',style,contact:contactState});
    continue;
   }
   if(resolveHurdle(a,d,style)){
    report?.push({defender:d.key,reason:'hurdle clearance',style,contact:contactState});
    continue;
   }
   // More fatigue from actual contact than ordinary straight-line sprinting.
   a.stam=Math.max(0,a.stam-.014);d.stam=Math.max(0,d.stam-.020);
   d.touches++;a.touches++;
   lastContact=Math.round(hit.impulse);tackleCount++;
   // Independent evidence: legacy radius contact can occur without a capsule hit.
   // Record this divergence for calibration rather than silently awarding a new tackle.
   if(ChaosContactEvidence.isEnabled())lastAnatomyTackle={time:+playClock.toFixed(3),carrier:a.key,defender:d.key,
    regions:AnatomyHitboxes.contacts(AnatomyHitboxes.sample(a),AnatomyHitboxes.sample(d)).slice(0,3),style,category:contactState.kind};
   const techniqueBonus=style==='cut'?clamp((d.TAK-70)*.003-(a.w-220)*.0003,-.06,.12):
     (d.conservativeHeld||d.conservativeUntil>playClock||d.action?.kind==='conservative')?DefensiveControls.conservativeGrip(d.TAK):
     style==='dive'?-clamp((95-d.TAK)*.0025,.015,.13):0;
   const placementQuality=ChaosGripAttachment.contactQuality(contactState,d,hit,style);
   const handPosition=clamp((.24+hit.advantage*.011+(style==='hit'?.05:0)+techniqueBonus)*
     (.72+.28*placementQuality),.055,.72);
   if(d.action&&['hit-stick','cut-stick','conservative','tackle-dive'].includes(d.action.kind)){
    d.action.used=true;
    if(d.action.kind==='tackle-dive'){d.action.contactAge=d.action.age||0;
     // Recovery is still owed after contact, but pre-launch cooldown must
     // not instantly delete a genuine grip created by this dive.
     d.tackleCooldown=0;}
    d.stam=Math.max(0,d.stam-(style==='hit'?.028:style==='dive'?.018:.008));
   }
   const freshSquare=d.squareImpact?.carrier===a.key&&playClock-d.squareImpact.time<.20?
     d.squareImpact.score:0;
   const link={defender:d.key,age:0,grip:handPosition,initialImpulse:hit.impulse,advantage:hit.advantage,style,contactCategory:contactState.kind,quality:placementQuality,attachment:null,square:style==='dive'?0:freshSquare};
   report?.push({defender:d.key,reason:'grip started',style,contact:contactState,quality:placementQuality});
   tackleLinks.set(d.key,link);d.wrapLinked=true;d.technique=style==='hit'?'hit-stick':'wrap';
   if(style==='hit'){
    hitStickCount++;
    const gap=Math.max(.05,dist(a,d)),nx=(a.x-d.x)/gap,ny=(a.y-d.y)/gap;
    const strike=clamp((d.HIT*.58+d.STR*.28+d.TAK*.14-55)/48,.25,1.15);
    const hitVelocity=clamp(Math.max(0,hit.closing)*strike*.52,0,2.6);
    a.vx+=nx*hitVelocity*mass(d)/(mass(a)+mass(d));a.vy+=ny*hitVelocity*mass(d)/(mass(a)+mass(d));
    d.vx-=nx*hitVelocity*mass(a)/(mass(a)+mass(d));d.vy-=ny*hitVelocity*mass(a)/(mass(a)+mass(d));
    a.balance=clamp(a.balance-.09*strike-hitVelocity*.035,.30,1);a.impact=Math.max(a.impact,.42*strike);
    // Hard hits sacrifice some hand security when outmuscled; high TAK can recover.
    if(a.TRK>d.TAK+15)link.grip*=.75;
    log(d.pos+' HIT STICK on '+a.name+' · HIT '+Math.round(d.HIT));
   }else log(d.pos+' wraps '+a.name+' · TAK '+d.TAK);
  }
 }
 let combinedGrip=0,engaged=0,totalBrake=0,contacts=[];
 for(const [key,t] of [...tackleLinks]){
  const d=P(key);if(!d||d.tackleCooldown>0){tackleLinks.delete(key);continue}
  const gap=dist(a,d),rad=radius(a)+radius(d);
  if(gap>rad+1.07){releaseTackle(d,a,'distance');continue}
  t.age+=dt;
  // Physically established square contact can hold both players face-to-face;
  // the renderer reads this posture. Does not force a tackle or a skill roll.
  if(t.square>.42&&t.grip>.30){
   const brace=t.square*clamp((t.grip-.22)/.55,0,1);
   a.standContact=Math.max(a.standContact||0,brace);
   d.standContact=Math.max(d.standContact||0,brace);
  }
  const anatomy=ChaosContactOutcomes.evaluate(a,d,t);
  t.anatomyKind=anatomy.kind;
  const hit=tackleLeverage(a,d);
  const escape=(a.TRK*.53+a.STR*.24+a.AGI*.15+a.AWR*.08)-(d.TAK*.57+d.STR*.19+d.AWR*.15+d.HIT*.09);
  const drive=speed(a)/Math.max(1,maxSpeed(a));
  // Recalculate contact quality as the hold develops. A poor initial hit
  // cannot instantly become a perfect grip; legitimate improved placement can
  // gradually strengthen it. This is independent of the tackle result.
  const observedQuality=ChaosGripAttachment.contactQuality(anatomy,d,hit,t.style);
  t.quality=clamp((t.quality??observedQuality)+clamp(observedQuality-(t.quality??observedQuality),-dt*.85,dt*.85),.18,1.25);
  const gripRate=clamp((1.83+hit.advantage*.027-escape*.012-drive*.11+(t.style==='hit'?.12:0)) *
    (.68+.32*t.quality),.32,3.45);
  // Maintaining a wrap is a skill, not just a timer. Poor tacklers cannot
  // build an unbreakable grip on an elite runner without help or clean leverage.
  const security=clamp(1.15+(d.TAK-a.TRK)*.009+(d.STR-a.STR)*.003+
    hit.advantage*.004+Math.max(0,hit.closing-2)*.026+
    (speed(a)<2?.20:0)+(a.balance<.65?.16:0),.45,1.6)*clamp(.78+.22*t.quality,.60,1.20);
  t.grip=clamp(t.grip+dt*gripRate,0,security);
  // Linked players resist separation through a damped, bounded force rather
  // than teleporting into a tackle pose. This runs only after real contact.
  t.attachment=ChaosGripAttachment.step(a,d,t,dt,radius(a),radius(d));
  // A sustained leg-drive/hold contest can shed a weak tackle or, with more
  // effort, work out of a secure wrap. Grip and contact still have to exist.
  // This never declares a winner merely because an animation played.
  const escapeContest=ChaosTackleEscape.step(a,d,t,dt);
  t.escapeDiagnostics=escapeContest;
  const visualStrain=ChaosEscapeReactions.strain(a,d,t,escapeContest);
  a.tackleStrain=Math.max(a.tackleStrain||0,visualStrain.runnerStrain);
  d.tackleStrain=Math.max(d.tackleStrain||0,visualStrain.defenderStrain);
  if(escapeContest.broken){
   releaseTackle(d,a,'escape',escapeContest);
   continue;
  }
  const contribution=clamp(t.grip,.06,1.6);
  engaged++;combinedGrip+=contribution;
  totalBrake+=clamp(.30+contribution*1.23+(mass(d)/mass(a))*.37,.35,2.45);
  contacts.push({t,d,hit});
  d.intent='wrap';d.intentTarget=a.key;d.pulse=Math.max(.12,d.pulse);
  const dMass=mass(d),aMass=mass(a);
  const blend=clamp(dt*(.43+contribution*.82),0,.12);
  d.vx+=(a.vx-d.vx)*blend*aMass/(aMass+dMass);
  d.vy+=(a.vy-d.vy)*blend*aMass/(aMass+dMass);
  // A low grip ceiling is NOT an automatic broken tackle. The old rule
  // released weak-grip wraps after ~0.7 seconds regardless of whether the
  // defender had caught the runner, producing endless chase/bend/recover loops.
  // True escapes require superior runner power or a genuinely insecure grip.
  const runnerEdge=a.TRK*.54+a.STR*.24+a.AGI*.22-(d.TAK*.59+d.STR*.23+d.AWR*.18);
  const outrunningGrip=speed(a)>3.3&&t.grip<.44&&t.age>.68;
  const physicallyEscaping=runnerEdge>14&&security<.94&&t.age>.90&&t.grip<.76;
  // A runner can pull free of a stretched weak grip; a strong wrap pulls the
  // defender along and can produce extra forward yards before resolution.
  const stretchedLoose=t.attachment?.reason==='overextended'&&t.grip<.68&&t.age>.28;
  if(outrunningGrip||physicallyEscaping||stretchedLoose){releaseTackle(d,a,'escape',t.escapeDiagnostics);contacts.pop();engaged--;combinedGrip-=contribution;totalBrake-=clamp(.30+contribution*1.23+(mass(d)/mass(a))*.37,.35,2.45)}
 }
 if(!engaged){pileState=null;return}
 const inertia=clamp(mass(a)/97,.68,1.55);
 const struggle=ChaosTackleStruggle.state(a,contacts,a.vx);
 const brake=clamp(totalBrake/inertia*.92*struggle.brakeMultiplier,.20,6.15);
 a.vx*=Math.max(0,1-brake*dt);a.vy*=Math.max(0,1-brake*dt);
 // A clean high-rating solo tackle doesn't require an almost-stopped carrier.
 const winners=contacts.filter(({d,t,hit})=>{
  const skill=d.TAK*.59+d.AWR*.16+d.STR*.16+d.HIT*.09;
  const survive=a.TRK*.54+a.STR*.22+a.AGI*.17+a.AWR*.07;
  const edge=skill-survive+hit.advantage*.24;
  const gripNeed=clamp(.92-edge*.008+(speed(a)>5?.06:0),.63,1.36);
  // Allow a visible, short carry/drag interval before a solo tackle finishes.
  // This does not change rating advantage or make every grasp succeed.
  const earlier=ChaosSquareContact.settleAge(t.square||0,t.grip,t.quality,a.balance,a.action?.kind);
  const ageNeed=clamp(.64-edge*.002+(speed(a)>5?.025:0)+struggle.finishDelay-earlier,.34,1.34);
  return t.grip>=gripNeed&&t.age>=ageNeed;
 });
 // A fully established textbook wrap has controlled the runner for several
 // frames, with real body-region contact. It is an earned finish, not a magic
 // tackle on the first frame of overlap or a light brush.
 const textbook=contacts.find(({t})=>t.age>=.54&&t.anatomyKind==='guaranteed tackle'&&a.balance<.67);
 if(textbook){finishTackle(a,contacts,'Textbook secured wrap');return;}
 const oldest=Math.max(...contacts.map(c=>c.t.age));
 // Rear-angle drag: once a pursuing defender gets hands onto a runner and
 // maintains a secure grip, forward momentum should not endlessly tow him.
 // A clean tackle break is handled above and puts the failed tackler down.
 const rearDrag=contacts.find(({t,d})=>
   t.style==='wrap'&&(t.square||0)<.42&&t.age>=.78+struggle.finishDelay*.65&&t.grip>=.65&&
   d.x<a.x-.08&&Math.abs(d.y-a.y)<radius(a)+radius(d)+.45&&
   dist(d,a)<radius(a)+radius(d)+.75);
 if(rearDrag){
  rearDrag.d.technique='drag-tackle';
  a.lean=clamp(a.lean-.32,-.56,.56);
  finishTackle(a,contacts,'Drag-down tackle');return;
 }
 // A secured wrap on a returner must eventually complete. The ordinary
 // ratings threshold can otherwise stay above a lone tackler's grip ceiling
 // forever, letting an exhausted runner be pushed downfield without a whistle.
 // Escapes still happen through the existing grip-break/leverage rules.
 if(specialState?.returning && contacts.some(({t})=>t.age>1.10+struggle.finishDelay&&t.grip>.68) &&
    (speed(a)<3.6||a.stam<.12||engaged>=2)){
  finishTackle(a,contacts,'Secured return tackle');return;
 }
 // Each additional defender adds grip and makes a standing runner less likely.
 const groupReady=engaged>=2&&oldest>.17&&combinedGrip>clamp(1.06-(engaged-2)*.20,.52,1.06);
 if(pileState?.active){
  // Three-plus secured defenders defeat a small unsupported pile quickly.
  if(engaged>=3&&pileState.age>.40&&pileState.pushers.length<engaged-1){finishTackle(a,contacts,'Gang tackle');return;}
  maintainPile(a,engaged,combinedGrip,dt);return;
 }
 if(groupReady){
  const nearbyPushers=off.some(p=>p!==a&&p.pos!=='QB'&&dist(p,a)<5.2&&p.x<a.x+1);
  const runnerUpright=a.balance>.63 && (speed(a)>1.2||a.TRK>=87) && engaged<=2;
  const canScrum=runnerUpright&&nearbyPushers;
  if(canScrum){pileState={active:true,carrier:a.key,startX:a.x,lastX:a.x,maxX:a.x,age:0,stalled:0,loose:0,pushers:[],wrappers:contacts.map(c=>c.d.key)};pileStarts++;log('STANDING PILE · teammates can push');return;}
  finishTackle(a,contacts,'Gang tackle');return;
 }
 if(winners.length){finishTackle(a,contacts,'Open-field tackle');return}
}

// Predict where a receiver will actually be after the football's flight time.
// This copies his physics state and executes the same route steering, rather than
// guessing by simply multiplying current velocity (which fails on route breaks).
function projectedReceiver(rec, flight){
 const ghost={...rec,route:rec.route?rec.route.map(pt=>pt.slice()):null,prediction:true};
 const steps=Math.max(1,Math.ceil(flight*60)),dt=flight/steps;
 for(let i=0;i<steps;i++){
  AIroute(ghost,dt);
  ghost.x=clamp(ghost.x+ghost.vx*dt,7,112);
  ghost.y=clamp(ghost.y+ghost.vy*dt,-.3,H+.3);
 }
 return {x:ghost.x,y:ghost.y};
}
// Single receiver choice determines the pass. The QB, rather than the player,
// calculates release, lead and ballistic arc; THA/pressure/distance create misses.
function convertQuarterbackScramble(){
 const qb=P('QB');
 if(phase!=='live'||RUNS.has(selectedPlay)||passThrown||ballCarrier||!qb||qb.x<=playStart+.10)return false;
 pendingPass=null;ballCarrier=qb;qb.touches++;
 // Stay under user control, including if the left stick remains held forward.
 if(controlMode==='offense'){active=qb;manualDrive=true;suppressManualUntilNeutral=false;}
 tackleLinks.clear();pileState=null;
 $('targets').style.display='none';$('receiverPins').style.display='none';
 message('<strong>QB scramble!</strong> Beyond the line of scrimmage: forward passing is locked and the offense blocks.');
 log('QB CROSSES LOS · RUSH · '+qb.name);
 hud();return true;
}
function startPass(index,source='keyboard'){
 convertQuarterbackScramble();
 if(paused||phase!=='live'||RUNS.has(selectedPlay)||passThrown||ballCarrier)return false;
 if(pendingPass)return false;
 if(!eligibleTargets()[index])return false;
 pendingPass={index,start:playClock,source};
 return true;
}
function releasePass(duration=null){
 if(!pendingPass)return false;
 const pending=pendingPass;pendingPass=null;
 return passTo(pending.index,duration===null?playClock-pending.start:duration);
}
function passTo(index,hold=.27){
 convertQuarterbackScramble();
 if(paused||phase!=='live'||RUNS.has(selectedPlay)||passThrown||ballCarrier||!P('QB'))return false;
 const qb=P('QB'),rec=eligibleTargets()[index];if(!rec)return false;
 airSelection={offense:null,defense:null,defenderKey:null};lastAirResult=null;
 const dx=rec.x-qb.x,dy=rec.y-qb.y,range=hypot(dx,dy);
 // Holding the icon shapes a real ballistic flight: tap=lob, medium=touch,
 // full hold=bullet. THP controls the maximum launch velocity and range.
 const charge=clamp((hold-.09)/.48,0,1),loft=1-charge;
 const minV=23+(qb.THP-65)*.22;
 const flight=clamp((range/minV)*(1.13+loft*.93),.39,2.45);
 const maxRange=35+(qb.THP-65)*.66;
 const powerFactor=range>maxRange?maxRange/range:1;
 const predicted=projectedReceiver(rec,flight);
 const pressureDist=closestThreat(qb,def.filter(d=>d.rush)).d;
 const pressure=clamp((4.8-pressureDist)/4.8,0,1);
 const motion=clamp(speed(qb)/7,0,1);
 const rating=clamp((qb.THA-35)/64,0,1);
 // Normal throws are predominantly catchable: slight misses are possible even with
 // high THA, whereas low THA, distance, moving throws and pressure widen the spread.
 const runPenalty=motion*(1-clamp(((qb.TOR??qb.THA)-30)/69,0,1))*.90;
 const spread=.24+(1-rating)*1.25+range*.012+pressure*1.1+motion*.18+runPenalty;
 const missX=clamp((rand()+rand()+rand()-1.5)*spread*1.4,-2.7,2.7);
 const missY=clamp((rand()+rand()+rand()-1.5)*spread*1.4,-2.7,2.7);
 const aimX=clamp(qb.x+(predicted.x-qb.x)*powerFactor+missX,7.2,111),aimY=clamp(predicted.y+missY,.3,H-.3);
 const missSize=Math.hypot(missX,missY);
 const quality=missSize<.40?'ON TARGET':missSize<1.35?'SLIGHTLY OFF':'OFF TARGET';
 const originX=qb.x+.6, originY=qb.y;
 const originZ=(qb.h*.0254+.18)/YARD_M,targetZ=rec.h*.0254*.63/YARD_M;
 const vx=(aimX-originX)/flight,vy=(aimY-originY)/flight;
 const vz=(targetZ-originZ+.5*G*flight*flight)/flight;
 ball={x:originX,y:originY,z:originZ,vx,vy,vz,t:0,flight,
       aimX,aimY,quality,accuracyError:missSize,pressure,ttl:flight+.9,flying:true,
       style:charge<.32?'LOB':charge>.77?'BULLET':'TOUCH',charge,loft,attempts:[],deflected:false};
 if(currentMemoryPlay){currentMemoryPlay.target=rec.key;currentMemoryPlay.airYards=Math.max(0,aimX-playStart);}
 intended=rec;active=null;passThrown=true;
 for(const o of off){
  const skill=.56*o.AWR+.44*(o.RTE||o.AWR);
  o.airReadAt=clamp((o===rec?.045:.19)+(99-skill)*.0035+((o.routeVariation?.tempo||1)-1)*.3,.03,.48);
 }
 for(const d of def){
  const primary=d.assignment?.target===rec.key||dist(d,rec)<4.6;
  const recognize=.48*d.AWR+.32*d.PRC+.20*(d.RCR||d.COV||d.AWR);
  const far=Math.hypot(d.x-aimX,d.y-aimY);
  const base=primary?.07:.19;
  d.airReadAt=clamp(base+(99-recognize)*.0042+(!primary&&far>22?.055:0)+(d.coverageVariation?.react||0)*.75,.06,.73);
 }
 qb.vx*=.5;qb.vy*=.5;
 const mph=Math.hypot(vx,vy,vz)*YARD_M*MPS_TO_MPH;
 message('<strong>'+ball.style+' · '+quality+'.</strong> '+qb.name+' leads '+rec.name+' · '+range.toFixed(0)+' yd · '+mph.toFixed(0)+' mph.');
 log('PASS '+ball.style+' '+PASS_ICONS[index]+' → '+rec.name+' · '+quality+' · THA '+qb.THA);
 $('targets').style.display='none';$('receiverPins').style.display='none';hud();
 return true;
}
// A pass is a contest at a physical catch point, not an automatic receiver win.
// X/A/Y commands only become ball-in-air commands AFTER the QB has released it.
// The intended receiving point is calculated once by the QB's actual ballistic
// throw. Tracking AI may REACT to that information, but it never teleports or
// moves the ball. The separate ground intercept follows the live trajectory.
function flightMarkers(b=ball){
 if(!b?.flying)return null;
 const remaining=Math.max(0,(b.flight??b.t)-b.t);
 const catchX=clamp(Number.isFinite(b.aimX)?b.aimX:b.x+b.vx*remaining,0,120);
 const catchY=clamp(Number.isFinite(b.aimY)?b.aimY:b.y+b.vy*remaining,.15,H-.15);
 const gTime=Math.max(0,((b.vz||0)+Math.sqrt(Math.max(0,(b.vz||0)**2+2*G*Math.max(0,b.z))))/G);
 return {catchX,catchY,groundX:clamp(b.x+b.vx*gTime,0,120),groundY:clamp(b.y+b.vy*gTime,0,H),remaining,shadowX:b.x,shadowY:b.y};
}
// Receivers make a real run to the projected catch point before the football
// arrives. Only the target and teammates who could realistically reach the
// ball join the contest; unrelated receivers keep running their routes.
function receiverFlightAI(o,dt){
 if(!ball?.flying||!['WR','TE','FB','RB'].includes(o.pos)||o.ground)return false;
 const m=flightMarkers(),target={x:m.catchX,y:m.catchY};
 const distance=dist(o,target),primary=o===intended;
 const remaining=Math.max(.02,m.remaining);
 const attainable=distance<=maxSpeed(o)*(remaining+.11)+catchReach(o)*.35;
 if(!primary&&(!attainable||distance>13.5))return false;
 if(ball.t<(o.airReadAt??(primary?.07:.26)))return false;
 o.intent=primary?'air-track':'air-backup';o.intentTarget=intended?.key||'football';
 // Lower-rated players take a slightly wider path to the spot. Skill is not
 // overridden by the marker or a button press.
 const reach=distance<1.30?Math.min(1.02,Math.max(.70,remaining*1.6)):
   clamp(1.03+(o.AWR-70)*.0015,.96,1.10);
 steer(o,target.x-o.x,target.y-o.y,dt,reach);
 return true;
}
// EVERY defensive back reads deep throws, not just the corner already in the
// picture. Recognition delay and actual travel distance determine whether he
// can arrive in time. Backside corners and safeties rally in support; no
// guaranteed ball-hawk outcomes or synthetic pursuit speed are added.
function defenderFlightAI(d,dt){
 if(!ball?.flying||d.ground)return false;
 const m=flightMarkers(),target={x:m.catchX,y:m.catchY};
 const db=['CB','FS','SS'].includes(d.pos),lb=['OLB','MLB'].includes(d.pos);
 if(!db&&!lb)return false;
 if(ball.t<(d.airReadAt??.34))return false;
 const distance=dist(d,target),primary=d.assignment?.target===intended?.key||
   (intended&&dist(d,intended)<4.6);
 // A linebacker may flow underneath a deep throw, but won't instantly vacate
 // his zone and sprint 40 yards to where a corner should be responsible.
 if(lb&&distance>28)return false;
 let aimX=m.catchX,aimY=m.catchY;
 if(lb&&distance>10){aimX-=Math.min(3.5,distance*.11);}
 const effort=db?clamp(1.02+(d.PRC-70)*.0014,.97,1.09):.95;
 d.intent=primary?'break-on-ball':db?'air-rally':'air-underneath';
 d.intentTarget=intended?.key||'football';
 steer(d,aimX-d.x,aimY-d.y,dt,effort);
 return true;
}
function switchToIntendedReceiver(){
 if(phase!=='live'||controlMode!=='offense'||!ball?.flying||!intended||intended.ground)return false;
 active=intended;manualReceiver=true;
 message('<strong>USER RECEIVER · '+intended.name+'.</strong> Left stick adjusts the catch point · X RAC / A possession / Y aggressive.');
 log('USER SWITCH → '+intended.key+' (airborne pass)');hud();return true;
}
// V30: visual feedback is a record of the user's actual action choice, not a
// promise that the resulting catch/swat/hurdle will succeed.
const AIR_LABELS={rac:'RAC',possession:'POSSESSION',aggressive:'AGGRESSIVE',swat:'SWAT',ball:'BALL HAWK',receiver:'PLAY RECEIVER',hurdle:'HURDLE'};
function actionCue(p,kind,result=false){
 if(!p)return;
 p.actionCue={kind,label:(AIR_LABELS[kind]||kind.toUpperCase())+(result?'!':''),time:result?1.15:1.0,result};
}
function startAirAnimation(p,kind,stage='attempt'){
 if(!p)return;
 // An anticipation pose does not cause a player to leap from 25 yards away.
 const duration=stage==='ready'?2.0:kind==='aggressive'||kind==='ball'?.78:kind==='swat'?.64:.58;
 if(stage==='ready'&&p.airPose?.stage==='attempt'&&p.airPose.time>0)return;
 if(stage==='attempt'&&p.airPose?.stage==='attempt'&&p.airPose.kind===kind&&p.airPose.time>.20)return;
 p.airPose={kind:stage==='ready'?'ready-'+kind:kind,stage,time:duration,duration,age:0,flavor:p.animationFlavor||0};
 if(stage==='attempt')actionCue(p,kind,true);
}
function cueForSelectedCatch(){
 if(phase!=='live'||!ball?.flying)return;
 const f=flightMarkers(),remaining=f.remaining;
 if(remaining>.37)return;
 const receiv=intended;
 if(receiv&&!receiv.ground&&dist(receiv,{x:f.catchX,y:f.catchY})<3.8&&airSelection.offense){
  startAirAnimation(receiv,airSelection.offense,'attempt');
 }
 const d=airSelection.defenderKey?P(airSelection.defenderKey):null;
 // Queuing from 20 yards away never starts a jump. Only a defender arriving
 // within the actual catch area can begin the attempt pose as the ball drops.
 if(d&&!d.ground&&dist(d,{x:f.catchX,y:f.catchY})<2.9&&
    defenderAirEligibility(d).reachable&&airSelection.defense){
  startAirAnimation(d,airSelection.defense,'attempt');
 }
}
function chooseAirAction(kind,source='gamepad'){
 if(phase!=='live'||!ball?.flying||paused)return false;
 if(controlMode==='defense'&&!defenderAirInteractionZone(P(selectedDefenderKey))){
  // An uninvolved defender cannot claim a remote pass reaction; X remains
  // the regular committed tackle dive. A/Y can be HELD and queued once the
  // moving player legitimately becomes eligible (see controller polling).
  return kind==='swat'?defensiveOpenFieldDive():false;
 }
 if(controlMode==='offense'){
  if(!['rac','possession','aggressive'].includes(kind))return false;
  airSelection.offense=kind;
  if(intended){startAirAnimation(intended,kind,'ready');actionCue(intended,kind);}
  message('<strong>'+kind.toUpperCase()+' CATCH selected.</strong> Timing, ratings, flight and defensive positioning still decide.');
 }else if(controlMode==='defense'){
  if(!['swat','ball','receiver'].includes(kind))return false;
  airSelection.defense=kind;airSelection.defenderKey=selectedDefenderKey;
  const d=P(selectedDefenderKey);
  // Queue intent only. Reaching/jumping is an entirely separate late-ball
  // animation that plays only when the receiver contest develops physically.
  if(d)actionCue(d,kind);
  message('<strong>'+({swat:'SWAT',ball:'BALL HAWK',receiver:'PLAY RECEIVER'})[kind]+'</strong> QUEUED for '+(d?.name||'defender')+'. Actual contact requires timing, reach, and position.');
 }else return false;
 hud();return true;
}
function airOffenseStyle(p,crowd){
 if(p===intended&&controlMode==='offense'&&airSelection.offense)return airSelection.offense;
 // CPU receivers also make situational choices; this is not a global guarantee.
 if(crowd>=2&&p.JMP>p.CAT-4)return 'aggressive';
 if(crowd>=1)return 'possession';
 return 'rac';
}
function airDefenseStyle(d){
 if(controlMode==='defense'&&airSelection.defenderKey===d.key&&airSelection.defense)return airSelection.defense;
 const instinct=.46*d.COV+.29*d.AWR+.25*d.CAT;
 const ballSkill=.55*d.CAT+.30*d.JMP+.15*d.RCR;
 if(ballSkill>86&&instinct>81&&rand()<.57)return 'ball';
 if(d.CAT<60&&d.TAK>76&&rand()<.48)return 'receiver';
 return rand()<.21+clamp((d.CAT-67)/100,0,.22)?'ball':'swat';
}
function airContext(p,point){
 const opposing=players.filter(d=>d.team!==p.team&&!d.ground&&['CB','FS','SS','OLB','MLB','WR','TE','RB'].includes(d.pos)&&dist(d,p)<2.9);
 const nearby=opposing.filter(d=>dist(d,p)<2.1);
 const separation=nearby.length?Math.min(...nearby.map(d=>dist(p,d))):8;
 return {nearby,opposing,separation,crowd:nearby.length};
}
function airCatchProbability(p,style,ctx){
 // Contests depend on proximity AND defender ball skills. Three well-placed
 // defenders are much more dangerous than a single defender five yards away.
 const skill=p.CAT*.64+p.AWR*.19+p.JMP*.17;
 const coverage=ctx.opposing.reduce((n,d)=>{
  const proximity=clamp((3.1-dist(d,p))/2.5,0,1);
  const quality=clamp((.52*(d.COV||d.CAT)+.30*d.AWR+.18*d.JMP)/85,.65,1.25);
  return n+proximity*quality;
 },0);
 let chance=.63+(skill-73)*.0061-coverage*.155;
 if(style==='rac')chance+=ctx.crowd?-.085:.045;
 if(style==='possession')chance+=.09-(ctx.crowd===0?.025:0);
 if(style==='aggressive')chance+=ctx.crowd?.065:-.07;
 if(p===intended)chance+=.035;
 if(p.team===1)chance-=.075;
 if(ball?.deflected)chance-=.12;
 return clamp(chance,.08,.94);
}
function defenderAirProbability(d,style,receiver){
 const near=receiver?dist(d,receiver):1.7;
 const leverage=clamp((2.8-near)/2.5,0,1);
 const ballDist=Math.hypot(d.x-ball.x,d.y-ball.y);
 const geometry=clamp((1.6-ballDist)/1.5,0,1);
 const grade=style==='ball'?.41*d.CAT+.27*d.JMP+.20*d.COV+.12*d.AWR:
   style==='swat'?.47*d.COV+.23*d.RCR+.18*d.JMP+.12*d.AWR:
   .42*d.COV+.34*d.AWR+.24*d.TAK;
 const base=style==='ball'?.10:style==='swat'?.28:.17;
 return clamp(base+(grade-70)*.0075+leverage*.15+geometry*.09+(style==='ball'?0:.04),.045,style==='ball'?.70:.86);
}
function awardAirInterception(d){
 startAirAnimation(d,'ball');ball.flying=false;
 lastAirResult={result:'interception',player:d.key,action:'ball',distance:dist(d,intended||d)};
 airCounters.interception++;log('BALL HAWK · '+d.name+' INTERCEPTION');
 ball=null;finish('intercept',d.x,'Defender '+d.name+' intercepted the pass.');
}
function awardAirBreakup(d,style){
 startAirAnimation(d,style);
 lastAirResult={result:'breakup',player:d.key,action:style};
 airCounters.broken++;if(style==='swat')airCounters.swat++;else airCounters.playReceiver++;
 log((style==='swat'?'SWAT / PASS BREAKUP':'PLAY RECEIVER / BREAKUP')+' · '+d.name);
 ball=null;finish('incomplete',playStart,'Pass broken up by '+d.name+'.');
}
function awardAirCatch(p,style,chance){
 startAirAnimation(p,style);ball.flying=false;tackleLinks.clear();pileState=null;
 ballCarrier=p;if(controlMode==='offense')active=p;
 // RAC preserves momentum. Secure possession and jumping contests take
 // extra time to plant after the catch; no magical sprint animation.
 if(style==='possession'){p.vx*=.58;p.vy*=.58;p.shield=.32;}
 else if(style==='aggressive'){p.vx*=.68;p.vy*=.68;p.shield=.20;}
 else{p.vx*=.96;p.vy*=.96;p.shield=.12;}
 p.touches++;lastAirResult={result:p.team===1?'interception':'complete',player:p.key,style,chance};
 if(p.team===0){airCounters[style]++;airCounters.complete++;}
 log((p.team===1?'INTERCEPTION':'CATCH · '+style.toUpperCase())+' · '+p.name+' · '+Math.round(chance*100)+'% chance');
 message('<strong>'+style.toUpperCase()+' catch!</strong> '+p.name+' secures the pass.');
 ball=null;if(p.team===1)finish('intercept',p.x,'Defender '+p.name+' intercepted the pass.');
}
function airBall(dt){
 if(!ball||!ball.flying)return;
 cueForSelectedCatch();
 ball.t+=dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt-.5*G*dt*dt;ball.vz-=G*dt;
 if(ball.t>Math.max(.20,ball.flight*.60)){
  const recs=players.filter(p=>p.team===0&&!p.ground&&['WR','TE','FB','RB'].includes(p.pos));
  const reachable=recs.map(p=>{const ctx=airContext(p),style=airOffenseStyle(p,ctx.crowd);
     const reach=catchReach(p)+(style==='aggressive'?.19:0);
     return {p,style,ctx,reach,range:1.02+(p.CAT-65)*.005+(style==='aggressive'?.10:0)};
   }).filter(o=>!ball.attempts.includes(o.p.key)&&ball.z>=.18&&ball.z<=o.reach&&dist(o.p,ball)<o.range);
  // Defenders have their own independent opportunity to attack the ball.
  // Their reach, spacing and ratings matter; mere proximity never guarantees a pick.
  const defenders=def.filter(d=>!d.ground&&!ball.attempts.includes(d.key)&&['CB','FS','SS','OLB','MLB'].includes(d.pos)&&
    dist(d,ball)<1.32+(d.COV-70)*.003&&ball.z>.20&&ball.z<=catchReach(d)+.09)
    .sort((a,b)=>dist(a,ball)-dist(b,ball));
  for(const d of defenders){
   if(!ball?.flying)return;
   ball.attempts.push(d.key);
   const style=airDefenseStyle(d);
   const nearest=recs.reduce((best,p)=>dist(p,d)<dist(best,d)?p:best,recs[0]||d);
   const chance=defenderAirProbability(d,style,nearest);
   startAirAnimation(d,style);
   if(rand()<chance){if(style==='ball')awardAirInterception(d);else awardAirBreakup(d,style);return;}
   // A missed ball-hawk attempt costs body position but cannot grant a catch.
   if(style==='ball'){d.balance=Math.max(.60,d.balance-.05);d.coverAim=null;}
  }
  reachable.sort((a,b)=>dist(a.p,ball)-dist(b.p,ball));
  for(const {p,style,ctx} of reachable){
   if(!ball?.flying)return;
   ball.attempts.push(p.key);
   startAirAnimation(p,style);
   const chance=airCatchProbability(p,style,ctx);
   if(rand()<chance){awardAirCatch(p,style,chance);return;}
   // A dropped pass may be tipped to another receiver behind the target.
   // A player cannot attempt the same pass twice.
   ball.deflected=true;airCounters.drops++;
   log('CATCH MISSED · '+p.name+' · '+style.toUpperCase()+' · '+Math.round(chance*100)+'% chance');
  }
 }
 if(ball&&(ball.z<=.10||ball.t>ball.ttl||ball.x>112||ball.y<-.5||ball.y>H+.5)){
  if(!lastAirResult)lastAirResult={result:'incomplete',action:'uncaught'};
  ball=null;finish('incomplete',playStart,'Pass falls incomplete.');
 }
}

function update(dt){
 if(specialState){stepSpecial(dt);return;}
 if(controlMode==='defense'){const selected=P(selectedDefenderKey);if(selected){selected.conservativeHeld=!!keys.z||!!(padState.connected&&padState.previous[XBOX.A]);if(selected.conservativeHeld)selected.conservativeUntil=playClock+.13;}}
 convertQuarterbackScramble();totalClock+=dt;playClock+=dt;burstTime=Math.max(0,burstTime-dt);burstCool=Math.max(0,burstCool-dt);evadeTime=Math.max(0,evadeTime-dt);evadeCool=Math.max(0,evadeCool-dt);shake=Math.max(0,shake-dt);const running=RUNS.has(selectedPlay);
 moveCooldown=Math.max(0,moveCooldown-dt);
 // Accept a second quick flick during a plant. It is executed as soon as the
 // physical replant window ends, rather than silently discarded by the input.
 if(queuedCarrierMove&&moveCooldown<=0){
  const queued=queuedCarrierMove;queuedCarrierMove=null;
  if(playClock<=queued.expires)carrierMove(queued.kind,queued.side);
 }
 if(xHoldStart!==null&&!xDiveFired&&phase==='live'&&playClock-xHoldStart>=.27){xDiveFired=true;diveForYards();}

 for(const p of players){
  if(p.airPose){p.airPose.time-=dt;p.airPose.age=(p.airPose.age||0)+dt;if(p.airPose.time<=0)p.airPose=null;}
  if(p.actionCue){p.actionCue.time-=dt;if(p.actionCue.time<=0)p.actionCue=null;}
 }
 for(const p of players)if(p.action){
  if(p.action.kind==='stiff'&&p.stiffArmHeld&&p===availableRunner()){
   p.action.time=Math.max(p.action.time,.13);
   p.stam=Math.max(0,p.stam-dt*.009); // a held arm is not a free infinite shove
  }else p.action.time-=dt;
  p.action.age+=dt;
  if(p.action.time<=0){
   finishMissedDefenderDive(p);
   p.action=null;
  }
 }
 if(pendingPass&&playClock-pendingPass.start>=.62){releasePass(.62);}
 const rb=P('RB'),qb=P('QB');
 // Everyone re-evaluates the LIVE BALL each tick. No one continues a pre-catch route
 // or pass-protection target simply because it was assigned before the handoff.
 const claims=new Set();
 const grounded=new Set();
 for(const p of players)if(tickGround(p,dt))grounded.add(p.key);
 for(const o of off){
  if(grounded.has(o.key))continue;
  if(manualReceiver&&o===active&&ball?.flying){
   const input=stickInput();
   if(input.mag>.12)manualAthlete(o,dt,'user-receiver');
   else if(!receiverFlightAI(o,dt))AIroute(o,dt);
   continue;
  }
  if(o===ballCarrier){if(controlMode==='offense')userCarry(o,dt);else autoCarry(o,dt);continue}
  if(ballCarrier){
   if(selectedPlay==='inside'&&['LT','LG','C','RG','RT'].includes(o.key)){insideZoneBlockerAI(o,dt,claims,ballCarrier);continue;}
   if(o===qb)quarterbackSupport(o,ballCarrier,dt);
   else if(running&&o.pos==='WR')receiverRunBlock(o,dt,claims,ballCarrier);
   else if(!running&&ballCarrier.x>=playStart&&(o.pos==='WR'||o.pos==='TE'))receiverAfterCatchBlock(o,ballCarrier,dt,claims);
   else runSupportAI(o,ballCarrier,dt,claims);
   continue;
  }
  if(ball?.flying&&receiverFlightAI(o,dt))continue;
  if(['LT','LG','C','RG','RT'].includes(o.key)){if(controlMode==='line'&&o.key===selectedLinemanKey)manualAthlete(o,dt,'user-block');else blockerAI(o,dt);continue}
  if(o===qb){if(running){o.intent='handoff';o.intentTarget='RB';arrive(o,playStart-2.1,26.65,dt,.7)}else if(passThrown){o.intent='post-throw';o.intentTarget=null;arrive(o,o.x-.1,o.y,dt,.7)}else if(controlMode==='offense')qbAI(o,dt);else cpuQuarterback(o,dt);continue}
  if(o===rb){if(running){o.intent='handoff';o.intentTarget='QB';arrive(o,qb.x+.3,qb.y,dt,1.1)}else{rbPassProtection(o,dt)}continue}
  if(running&&o.pos==='WR')receiverRunBlock(o,dt,claims);
  else if(running&&(o.pos==='TE'||o.pos==='FB'))rbLeadBlock(o,dt);
  else AIroute(o,dt);
 }
 for(let d of def){
  if(grounded.has(d.key))continue;
  if(['tackle-dive','hit-stick','cut-stick'].includes(d.action?.kind)&&d.action.time>0){
   // Both AI and user-controlled defenders finish the dive trajectory before
   // reconsidering pursuit. Prevents a second movement/turn during the lunge.
   d.intent='committed-dive';continue;
  }
  if(controlMode==='defense'&&d.key===selectedDefenderKey&&stickInput().mag>.12){
   // Manual input temporarily overrides the defender's responsibility.
   manualAthlete(d,dt,'user-defense');
  }else defenderAI(d,dt); // Released stick resumes the SAME assignment, from the new spot.
 }
 resolveBlocks(dt);
 resolvePileDrive(dt);
 applyMotion(dt);if(phase!=='live')return;
 convertQuarterbackScramble();
 if(running&&!ballCarrier&&playClock>(selectedFormation==='iform'?.33:.51)){tackleLinks.clear();pileState=null;ballCarrier=rb;if(controlMode==='offense')active=rb;rb.touches++; message('<strong>Handoff!</strong> Drive upfield; your weight and momentum can break a tackle.');log('HANDOFF · '+rb.name)}

 if(ball)airBall(dt);
 // The quarterback has the football before a pass or handoff, despite ballCarrier
 // remaining null. Otherwise the tackle system never runs and sacks are impossible.
 if(!running&&!passThrown&&!ballCarrier&&contactEnabled){
  resolveTackles(qb,dt);
  if(phase!=='live')return;
 }
 if(ballCarrier){const p=ballCarrier;
 if(p.action?.kind==='dive'&&p.action.age>=.42){finish('down',p.x,p.name+' dives forward.');return}
 // Crossing our own goal line alone is not a safety. The ball stays live
 // until a tackle, dead-ball dive, out of bounds or another whistle.
 p.shield=Math.max(0,p.shield-dt);if(p.x>=109.8){finish('touchdown',110,p.name+' scores from '+Math.round(110-playStart)+' yards out.');return}if(p.y<.1||p.y>H-.1){finish('out',p.x,p.name+' steps out of bounds.');return}
 if(contactEnabled)resolveTackles(p,dt);
  if(phase!=='live')return;
  // Forward progress can be ruled stopped during a sustained, crowded contact pile.
  const crowd=def.filter(d=>!d.ground&&dist(d,p)<2.65).length;
  if(crowd>=2&&Math.hypot(p.vx,p.vy)<.65){
   p.stoppedProgress=(p.stoppedProgress||0)+dt;
   if(p.stoppedProgress>2.1){finish('tackle',p.x,'Forward progress stopped in a defensive pile.');return;}
  }else p.stoppedProgress=Math.max(0,(p.stoppedProgress||0)-dt*1.5);
 }
 // QB contact was already resolved above. Never force all non-rushers into
 // tackle cooldown here: it made user-blitzing safeties pass harmlessly through the QB.
 traceAccum+=dt;if(traceAccum>=.10){traceSample();traceAccum=0}
 if(playClock% .25<dt)hud();
}

// The action itself is cheap; exertion and contact determine the additional
// cost. Each collision is rated, not a guaranteed special-move animation.
function availableRunner(){
 if(ballCarrier?.team===0)return ballCarrier;
 // LT modifies quarterback face buttons into ball skills. It doesn't throw.
 return !RUNS.has(selectedPlay)&&!passThrown&&(padState.lt>.45||keys.alt)&&phase==='live'?P('QB'):null;
}
function carrierMove(kind,side=0){
 const a=availableRunner();
 if(paused||phase!=='live'||!a||controlMode!=='offense')return false;
 if(moveCooldown>0){
  // One buffered footwork input, replaced by the most recent flick. No free
  // extra actions: fatigue and move costs apply only when it actually fires.
  if(kind==='juke'||kind==='hesi'){
   queuedCarrierMove={kind,side,expires:playClock+.42};
   return true;
  }
  return false;
 }
 queuedCarrierMove=null;
 const exhaustion=clamp(a.stam/.38,.20,1);
 const base=kind==='juke'?.020*(1-.16*clamp(((a.JUK||50)-30)/69,0,1)):kind==='hesi'?.016:kind==='spin'?.027:kind==='hurdle'?.041:kind==='truck'?.018:.018;
 a.stam=Math.max(0,a.stam-base);
 a.action={kind,side,time:kind==='hurdle'?.66:['juke','hesi','spin'].includes(kind)?.40:.50,age:0,used:false,power:exhaustion};
 // This is a timing/replant cost, not a one-move-per-play restriction.
 moveCooldown=kind==='juke'?.20:kind==='hesi'?.24:kind==='spin'?.34:kind==='hurdle'?.59:.38;
 a.technique=kind;a.pulse=.29;
 if(kind==='juke'){
  const stick=stickInput(),direction=side||(Math.abs(stick.y)>.13?Math.sign(stick.y):(a.y<26.6?1:-1));
  // A right-stick juke has a stable field-relative lateral axis. The
  // offense always attacks positive X; left and right refer to the two
  // sidelines, NOT the runner's momentary velocity. Rotating the juke frame
  // with each prior cut made repeated right flicks trace small circles.
  const fx=1,fy=0,nx=0,ny=direction;
  const effort=clamp(.25+.75*exhaustion,.40,1);
  a.jukeDrive={nx,ny,fx,fy,remaining:.43,duration:.43,power:exhaustion,side:direction};
  // The cut itself is applied each physics frame, even when the left stick
  // remains held forward. Avoid a one-frame impulse that disappears at the
  // rated speed cap.
  a.vx+=nx*.38*effort;a.vy+=ny*.38*effort;
  a.spin+=direction*.27;
 }else if(kind==='hesi'){
  a.vx*=clamp(.58+(1-exhaustion)*.22,.56,.82);
  a.vy+=side*.26*exhaustion;
 }else if(kind==='spin'){
  a.spin+=(side||1)*5.3*exhaustion;
  a.vy+=(side||1)*.64*exhaustion;
 }else if(kind==='truck')a.balance=clamp(a.balance+.13*exhaustion,.35,1);
 else if(kind==='hurdle'){
  // The runner must launch off a planted foot. No teleport or speed boost.
  if(!ChaosLowContact.initiate(a,'hurdle'))return false;
  a.balance=clamp(a.balance-.05,.35,1);a.vx*=.95;a.vy*=.95;actionCue(a,'hurdle');
 }
 log(kind.toUpperCase()+' · '+a.name+' · '+Math.round(a.stam*100)+'% energy');
 return true;
}
function holdStiffArm(held){
 const a=availableRunner();
 for(const p of off)if(p!==a)p.stiffArmHeld=false;
 if(!a||controlMode!=='offense'||phase!=='live'||paused){
  if(a)a.stiffArmHeld=false;
  return false;
 }
 if(held&&!a.stiffArmHeld){
  // Begin on press, keep the arm extended until released. Holding doesn't
  // repeatedly trigger the contact win calculation.
  if(!carrierMove('stiff'))return false;
  a.stiffArmHeld=true;
 }
 if(!held){a.stiffArmHeld=false;if(a.action?.kind==='stiff')a.action.time=Math.min(a.action.time,.20)}
 return !!a.stiffArmHeld;
}
function protectBall(held){
 const a=availableRunner()||ballCarrier;
 if(a&&a.team===0){a.covering=!!held;return true}return false;
}
function downSafe(){
 const a=availableRunner()||ballCarrier;
 if(paused||phase!=='live'||controlMode!=='offense'||!a||a.team!==0)return false;
 a.action={kind:'giveup',time:.3,age:0,used:true};a.vx=0;a.vy=0;
 a.stam=Math.max(0,a.stam-.004);finish('down',a.x,a.name+' safely gives himself up.');return true;
}
function diveForYards(){
 const a=availableRunner()||ballCarrier;
 if(paused||phase!=='live'||controlMode!=='offense'||!a||a.team!==0||
    a.ground||a.diveRecovery>0||a.action?.kind==='dive'&&a.action.time>0)return false;
 a.diveRecovery=1.10;
 const input=stickInput(),nx=input.mag>.15?input.x:Math.cos(a.face),ny=input.mag>.15?input.y:Math.sin(a.face);
 const energy=clamp(a.stam/.30,.18,1);
 a.action={kind:'dive',time:.44,age:0,used:true};a.vx+=nx*(1.35+.55*a.AGI/99)*energy;a.vy+=ny*1.4*energy;
 a.stam=Math.max(0,a.stam-.032);log(a.name+' dives for extra yards');return true;
}
function resolveCarrierAction(a,d,hit){
 const act=a.action;if(!act||act.time<=0||act.used)return false;
 const kind=act.kind;
 if(!['truck','stiff','juke','hesi','spin'].includes(kind))return false;
 const offense=(kind==='truck'?a.TRK*.43+a.STR*.30+a.w*.052+a.AWR*.10:
  kind==='stiff'?a.SFA*.40+a.STR*.21+a.TRK*.22+a.AWR*.17:
  kind==='spin'?a.AGI*.44+a.CUT*.32+a.AWR*.16+a.ACC*.08:
  kind==='hesi'?a.AGI*.33+a.CUT*.30+a.ACC*.24+a.AWR*.13:
  a.JUK*.29+a.AGI*.27+a.CUT*.22+a.ACC*.12+a.AWR*.10);
 const defense=d.TAK*.39+d.AWR*.22+d.STR*.18+d.PUR*.21;
 const angle=hit.advantage*.38+clamp((a.vx-d.vx)*.5,-3,3);
 const margin=offense*clamp(act.power??1,.22,1)-defense-angle+(rand()-.5)*16+(a.covering?-4:0);
 const win=margin>(['juke','spin','hesi'].includes(kind)?0:-2);
 act.used=true;a.actionOutcomes++;
 if(kind==='truck'){a.lastTruckOutcome={defender:d.key,win,at:playClock,margin:+margin.toFixed(2)};
  actionCue(a,win?'TRUCK':'TRUCK STOPPED',win);}
 if(win){
  const dd=Math.max(.1,dist(a,d)),nx=(d.x-a.x)/dd,ny=(d.y-a.y)/dd;
  d.stun=Math.max(d.stun,['juke','spin','hesi'].includes(kind)?.30:.22);
  d.tackleCooldown=Math.max(d.tackleCooldown,['juke','spin','hesi'].includes(kind)?.49:.36);
  if(!['juke','hesi','spin'].includes(kind)){
   const push=clamp(.5+margin*.025,.3,1.95)*mass(a)/(mass(a)+mass(d));
   d.vx+=nx*push;d.vy+=ny*push;
   a.vx-=nx*push*.23;a.vy-=ny*push*.23;
   a.stam=Math.max(.045,a.stam-(kind==='truck'?.092:.073));
   d.stam=Math.max(.045,d.stam-.022);
  }else a.stam=Math.max(0,a.stam-.012);
  a.pulse=.40;d.impact=.45;d.balance=clamp(d.balance-.16,.25,1);
  log(a.name+' wins '+kind+' against '+d.pos+' ('+Math.round(margin)+' matchup)');
  return true; // no clean tackle wrap
 }
 // A juke that fails and enters contact costs more than open-field footwork.
 a.stam=Math.max(0,a.stam-(['juke','hesi','spin'].includes(kind)?.016:.023));
 log(d.pos+' defeats '+a.name+' '+kind);
 return false;
}

function burst(){if(paused||phase!=='live'||burstCool>0)return;const p=ballCarrier||P('QB');if(!p||p.stam<.13)return;let stick=stickInput(),len=Math.hypot(stick.x,stick.y);let dx=len>.2?stick.x:Math.cos(p.face),dy=len>.2?stick.y:Math.sin(p.face);if(!isFinite(dx))dx=1;const kick=clamp(p.stam/.55,.25,1);p.vx+=dx*(.35+p.ACC*.012)*kick;p.vy+=dy*(.35+p.ACC*.012)*kick;
 const burstSpeed=speed(p),hardCap=maxSpeed(p);if(burstSpeed>hardCap){p.vx*=hardCap/burstSpeed;p.vy*=hardCap/burstSpeed}
 burstTime=.75;burstCool=3.2;p.stam=Math.max(.045,p.stam-.18);p.shield=Math.max(p.shield,.12);log(p.name+' accelerates · ACC '+p.ACC);}
function evade(){if(ballCarrier)return carrierMove('juke');if(paused||phase!=='live'||evadeCool>0)return;const p=ballCarrier||P('QB');if(!p)return;evadeTime=.45;evadeCool=2.6;p.stam=Math.max(.3,p.stam-.15);const dir=stickInput();p.vy+=(Math.abs(dir.y)>.1?dir.y:(rand()>.5?1:-1))*2.5*(.75+p.AGI/200);log('CUT · '+p.name+' · AGI '+p.AGI)}
function hud(){if(phase==='live'||phase==='presnap'||phase==='dead'){let suffix=['','ST','ND','RD','TH'][down]||'TH';$('down').textContent=specialState?(specialState.kind==='punt'?'PUNT':specialState.returning?'RETURN':'KICKOFF'):tryState?(tryState.mode==='two'?'TWO-POINT TRY':'EXTRA-POINT TRY'):down+suffix+' & '+Math.max(1,Math.round(togo));$('yardline').textContent=(yard<60?'OWN '+Math.round(yard-10):'OPP '+Math.round(110-yard))+' · BALL';$('clock').textContent=clockText(quarterSeconds);
 $('points').textContent=teamPoints[0];$('awayPoints').textContent=teamPoints[1];
 $('quarterRead').textContent=phase==='halftime'?'HALF':'Q'+quarter;$('playClockRead').textContent=clockText(playSeconds);$('playClockRead').classList.toggle('urgent',phase==='presnap'&&scrimmagePlayCalled&&playSeconds<=5);
 $('homePoss').textContent=possession===0?'● ':'';$('awayPoss').textContent=possession===1?'● ':'';
 $('timeoutsRead').textContent='TO '+timeOuts[0]+' – '+timeOuts[1];
 $('yardline').textContent=specialState?TEAM_NAMES[specialState.kickingTeam]+' TO '+TEAM_NAMES[possession]:spotText()+' · '+TEAM_NAMES[possession];}
 const ballP=controlMode==='defense'?P(selectedDefenderKey):controlMode==='line'?P(selectedLinemanKey):ballCarrier||(phase==='live'&&!ball?P('QB'):null);$('speedReading').textContent=ballP?(speed(ballP)*YARD_M*MPS_TO_MPH).toFixed(1):'0.0';$('impulseReading').textContent=lastContact+' ';const a=P('WR1'),b=P('CB1');$('separationReading').textContent=a&&b?dist(a,b).toFixed(1):'—';const qb=P('QB');$('pressureReading').textContent=qb?Math.round(clamp((5-closestThreat(qb,def).d)/5,0,1)*100)+'%':'0%';$('boost').textContent=burstCool>0?burstCool.toFixed(1)+'s':'BURST';$('dive').textContent=moveCooldown>0?moveCooldown.toFixed(1)+'s':'JUKE';
 const energy=$('staminaReading'),bar=$('staminaFill');
 const runner=controlMode==='defense'?P(selectedDefenderKey):controlMode==='line'?P(selectedLinemanKey):ballCarrier||P('QB');
 if(energy&&bar&&runner){const pct=Math.round(runner.stam*100);energy.textContent=pct+'% · '+(runner.stam<.2?'EXHAUSTED':runner.stam<.45?'TIRED':runner.sprinting?'SPRINTING':'READY');bar.style.width=pct+'%';bar.style.background=pct<25?'#f28b75':pct<50?'#e9cf79':'#bde76e'}
 const read=$('defenseRead');if(read&&phase==='live'&&RUNS.has(selectedPlay)){const count=def.filter(d=>d.runRead).length;read.textContent='DEFENSE · '+count+'/11 RECOGNIZED RUN · GAP FITS / CONTAIN / PURSUIT'}else if(read){read.textContent='DEFENSE · '+(phase==='presnap'?'ALIGNING':phase==='dead'?'WHISTLE':'COVERAGE ASSIGNMENTS')}
 const control=$('inputStatus');
 if(control&&specialState)control.textContent=specialState.returning?'SPECIAL TEAMS · RETURN IN PROGRESS':specialState.kind==='punt'?'PUNT RETURN · WATCH FOR THE BALL · K FOR FAIR CATCH':'KICKOFF · '+(possession===0?'RETURN '+returnCall.toUpperCase():'COVER THE RETURN');
 else if(control&&phase==='halftime')control.textContent='HALFTIME · '+TEAM_NAMES[secondHalfReceiver]+' RECEIVES NEXT · PRESS START THIRD QUARTER';
 else if(control)control.textContent=pendingPass?'PASS CHARGING · '+(playClock-pendingPass.start<.20?'LOB':playClock-pendingPass.start<.45?'TOUCH':'BULLET')+' · RELEASE RECEIVER BUTTON':pileState?.active?'STANDING PILE · '+pileState.wrappers.length+' DEFENDERS · '+pileState.pushers.length+' OFFENSIVE PUSHERS':paused?'PAUSED · MENU TO RESUME':phase==='presnap'?(controlMode==='defense'?'DEFENSE · '+(P(selectedDefenderKey)?.key||'DEFENDER')+' · '+DefensivePresnap.description(P(selectedDefenderKey))+' · LEFT STICK MOVE · B SWITCH · X AUDIBLE':'SNAP TO START · X AUDIBLE · A SNAP'):phase==='dead'?'WHISTLE · NEXT SNAP':controlMode==='defense'&&ball?.flying?'PASS AIRBORNE · '+(defenderAirInteractionZone(P(selectedDefenderKey))?'ON THE PLAY · X SWAT / A PLAY RECEIVER / Y BALL HAWK':'NOT IN CONTEST · X DIVES / B SWITCH DEFENDER'):controlMode==='defense'?'DEFENSE · YOU CONTROL '+(P(selectedDefenderKey)?.pos||'DEFENDER')+' · B SWITCH · A WRAP · X HIT/DIVE · RIGHT STICK HIT/CUT':controlMode==='line'?'O-LINE · YOU CONTROL '+selectedLinemanKey+' · RIGHT STICK UP IMPACT/PUSH':ballCarrier&&ballCarrier.team===0?(manualDrive?'YOU CONTROL '+ballCarrier.pos+' · GIVE AI CONTROL TO RELEASE':'AUTO RUN '+ballCarrier.pos+' · STEER TO TAKE OVER'):ball?(manualReceiver?'USER RECEIVER · LEFT STICK STEERS · X RAC / A POSSESSION / Y AGGRESSIVE':'PASS AIRBORNE · B SWITCH RECEIVER · X RAC / A POSSESSION / Y AGGRESSIVE'):RUNS.has(selectedPlay)?'HANDOFF COMING · MOVE TO TAKE CONTROL':'QB CONTROL · WASD / ARROWS';
 const airRow=$('airActions');if(airRow){const show=phase==='live'&&!specialState&&!!ball?.flying&&!paused&&controlMode!=='line'&&(controlMode!=='defense'||defenderAirInteractionZone(P(selectedDefenderKey)));airRow.style.display=show?'flex':'none';if(show){const switchButton=$('receiverSwitch');if(switchButton)switchButton.style.display=controlMode==='offense'?'inline-flex':'none';const labels=controlMode==='defense'?['X · SWAT','A · PLAY RECEIVER','Y · BALL HAWK']:['X · RAC CATCH','A · POSSESSION','Y · AGGRESSIVE'];airRow.querySelectorAll('button[data-air]').forEach((b,i)=>{if(b.textContent!==labels[i])b.textContent=labels[i];});}}
 $('fairCatchBtn').style.display=phase==='live'&&specialState?.kind==='punt'&&!!ball?.flying?'inline-flex':'none';
 const stateRead=$('gameStateRead');if(stateRead){const status=phase==='halftime'?'HALFTIME · CONTINUE':phase==='presnap'?(specialState?'KICKOFF READY':scrimmagePlayCalled?(possession===1?'CPU PRE-SNAP':'YOUR PRE-SNAP'):'PICK A PLAY'):phase==='live'?(specialState?'LIVE RETURN':'LIVE PLAY'):phase==='dead'?'WHISTLE · NEXT':phase.toUpperCase();stateRead.textContent='STATE: '+status+' · '+gameFlowNote;stateRead.dataset.phase=phase;}
 $('pause').disabled=phase!=='live';$('pause').textContent=paused?'RESUME':'PAUSE';
 const auto=$('autoRun');if(auto)auto.style.display=phase==='live'&&ballCarrier&&manualDrive?'inline-flex':'none';matchupHud();}

function resize(){const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));fieldSize={w:r.width,h:r.height,scale:dpr};if(renderer3d)renderer3d.resize();}
function setVisualMode(mode){visualMode=renderer3d&&mode==='3d'?'3d':'2d';const three=$('render3d');if(three)three.style.display=visualMode==='3d'?'block':'none';const b=$('viewMode');if(b){b.textContent=visualMode==='3d'?'VIEW: 3D · SWITCH TO 2D':renderer3d?'VIEW: 2D · SWITCH TO 3D':'VIEW: 2D · 3D UNAVAILABLE';b.disabled=!renderer3d}return visualMode}
function recoverFrom3DFailure(err){console.error('3D rendering failed; restoring visible 2D view',err);renderer3d=null;setVisualMode('2d');const status=$('renderStatus3d');if(status){status.textContent='3D display unavailable here. The game has switched back to the working 2D field.';status.hidden=false}}
function view(){const ratio=fieldSize.w/fieldSize.h;const xspan=H*ratio;const scale=fieldSize.h/H;const focus=ball?.flying?ball:(ballCarrier||P('QB')||active);let desired=phase==='presnap'?(isFreeKick(specialState)?kickLineX(specialState):playStart):(focus?focus.x:playStart);camera+=(desired-camera)*.09;const cam=clamp(camera,Math.min(xspan/2,W/2),Math.max(W-xspan/2,W/2));return {span:xspan,left:cam-xspan/2,px:scale}}
function xy(x,y,v){return [(x-v.left)*v.px,y*v.px]}
function drawField(v){const s=v.px,from=Math.max(0,Math.floor(v.left/5)*5),to=Math.min(120,v.left+v.span);ctx.fillStyle='#265b45';ctx.fillRect(0,0,fieldSize.w,fieldSize.h);
 for(let x=0;x<120;x+=10){let [px]=xy(x,0,v);ctx.fillStyle=(x/10)%2?'#2a6548':'#2a6045';ctx.fillRect(px,0,10*s,fieldSize.h)}
 for(let x of [0,110]){let [px]=xy(x,0,v);ctx.fillStyle='#1c3b52';ctx.fillRect(px,0,10*s,fieldSize.h)}
 ctx.fillStyle='#f6f8e5';ctx.globalAlpha=.7;for(let x=10;x<=110;x+=5){let [px]=xy(x,0,v);ctx.fillRect(px-.06*s,0,.12*s,fieldSize.h);for(let y of [15,38.3])ctx.fillRect(px-.48*s,y*s,.96*s,.10*s)}ctx.globalAlpha=1;
 ctx.save();ctx.font=`bold ${Math.max(8,2.25*s)}px ui-sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ecfff5a3';for(let x=20;x<110;x+=10){const yardLabel=50-Math.abs(60-x);let [px,py]=xy(x,10,v);ctx.fillText(yardLabel,px,py);ctx.save();ctx.translate(px,43*s);ctx.rotate(Math.PI);ctx.fillText(yardLabel,0,0);ctx.restore()}ctx.restore();
 for(let x of [playStart,first]){let [px]=xy(x,0,v);ctx.save();ctx.strokeStyle=x===first?'#f8e765':'#88bdfd';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,fieldSize.h);ctx.stroke();ctx.restore()}
 for(let x of [0,110]){let [px,py]=xy(x+5,H/2,v);ctx.save();ctx.translate(px,py);ctx.rotate(-Math.PI/2);ctx.font=`900 ${5*s}px ui-sans-serif`;ctx.textAlign='center';ctx.fillStyle='#d3e5f270';ctx.fillText(x===110?'END ZONE':'GRIDIRON LAB',0,0);ctx.restore()}
}
function drawAssignments(v){
 if(phase!=='presnap')return;
 ctx.save();ctx.font='600 10px ui-sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const d of def){
  if(d.rush||!d.assignment){
   if(controlMode==='defense'&&d.key===selectedDefenderKey){
    const gap=DefensivePresnap.gapTarget(d,off,playStart);
    const [dx,dy]=xy(d.x,d.y,v),[px,py]=xy(gap?.x??Math.min(109,playStart+3),gap?.y??d.fit?.lane??d.y,v);
    ctx.strokeStyle='#eaff9b';ctx.lineWidth=2;ctx.setLineDash([4,3]);
    ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(px,py);ctx.stroke();ctx.setLineDash([]);
   }
   continue;
  }
  const a=d.assignment;const [dx,dy]=xy(d.x,d.y,v);
  if(a.kind==='zone'){
   const [px,py]=xy(a.baseX,a.baseY,v);const rx=(a.depth>=12?6.5:4.5)*v.px,ry=a.width*.65*v.px;
   ctx.beginPath();ctx.ellipse(px,py,rx,ry,0,0,Math.PI*2);ctx.fillStyle='#7dcff117';ctx.fill();ctx.strokeStyle='#9bdef15d';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);
   if(controlMode==='defense'&&d.key===selectedDefenderKey){ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(px,py);ctx.strokeStyle='#eaff9b';ctx.lineWidth=2;ctx.stroke();}
  }else{const t=P(a.target);if(!t)continue;const [tx,ty]=xy(t.x,t.y,v);ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(tx,ty);ctx.strokeStyle='#92e8f5a8';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([])}
 }
 ctx.restore();
}
function drawRoute(v){if(phase==='dead'||(gameStarted&&controlMode==='defense'))return;for(let p of off){if(!p.route||ballCarrier)continue;ctx.strokeStyle=p===intended?'#e8ff91':p.key==='TE'?'#ffbf80':'#d6f6f6';ctx.globalAlpha=.45;ctx.lineWidth=1.8;ctx.setLineDash([3,5]);ctx.beginPath();let [px,py]=xy(p.x,p.y,v);ctx.moveTo(px,py);for(let j=p.routeIdx;j<p.route.length;j++){[px,py]=xy(...p.route[j],v);ctx.lineTo(px,py)}ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1}}
function drawPossessionRing(x,y,r){ctx.save();ctx.strokeStyle='#ffdc76';ctx.lineWidth=3.3;ctx.beginPath();ctx.arc(x,y,r+8,0,Math.PI*2);ctx.stroke();ctx.restore();}
function playerShape(p,v,markerCarrier){const home=(p.team===0?possession:1-possession)===0;const [x,y]=xy(p.x,p.y,v),s=v.px,r=Math.max(4,radius(p)*s);if(x<-30||x>fieldSize.w+30)return;
 ctx.save();ctx.translate(x,y);
 if(p.ground){
  const g=p.ground;
  const settle=g.stage==='fall'?clamp(g.age/g.fall,0,1):1;
  const gettingUp=g.stage==='rise'?clamp(1-g.time/g.rise,0,1):0;
  const body=clamp(1-settle*.30+gettingUp*.30,.66,1);
  ctx.rotate(g.dir+(g.stage==='fall'?.28*settle:0));
  ctx.fillStyle='#04151caa';ctx.beginPath();ctx.ellipse(2,3,r*1.38,r*.69,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=home?'#a5cb5a':'#4da6ce';
  ctx.strokeStyle=home?'#effbbd':'#d2f7ff';ctx.lineWidth=Math.max(1.3,r*.20);
  ctx.beginPath();ctx.moveTo(-r*1.03,-r*.56);ctx.lineTo(-r*.57,-r*.18);ctx.lineTo(r*.45,-r*.70);
  ctx.moveTo(-r*1.03,r*.56);ctx.lineTo(-r*.57,r*.18);ctx.lineTo(r*.45,r*.70);ctx.stroke();
  ctx.save();ctx.scale(body,1);
  ctx.beginPath();ctx.ellipse(0,0,r*1.07,r*.58,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.fillStyle=home?'#e6fba6':'#caf5fc';ctx.beginPath();ctx.arc(r*.85,0,r*.40,0,Math.PI*2);ctx.fill();
  if(g.stage==='winded'){
   const breathing=1+.13*Math.sin(totalClock*8);
   ctx.strokeStyle=home?'#dffcba':'#b6e8ff';ctx.globalAlpha=.68;ctx.lineWidth=1.4;
   ctx.beginPath();ctx.arc(-r*.1,0,r*.94*breathing,.15,Math.PI*1.08);ctx.stroke();ctx.globalAlpha=1;
  }
  if(g.stage==='rise'){
   ctx.strokeStyle='#f9f0b3';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r+4,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
  // Grounded players stay visible but cannot block, pursue, or catch until up.
  ctx.save();ctx.fillStyle='#eaf7df';ctx.font=`700 ${Math.max(8,1.45*s)}px ui-sans-serif`;
  ctx.textAlign='center';ctx.fillText(g.stage==='winded'?'•••':g.stage==='rise'?'↑':'!',x,y-r-7);ctx.restore();
  if(markerCarrier===p)drawPossessionRing(x,y,r);
  return;
 }
 const pileMotion=pileState?.active&&(p===ballCarrier||p.pushing||tackleLinks.has(p.key));
 const legRate=12+speed(p)*.9;
 const stride=Math.sin(totalClock*legRate+(p.team?1.7:0));
 const lean=p.lean+(pileMotion?.09*Math.sin(totalClock*19):0)+
  (p.action?.kind==='juke'?Math.sin(totalClock*21)*.12:p.action?.kind==='truck'?.16:p.action?.kind==='stiff'?.06:p.action?.kind==='hesi'?-.20:p.action?.kind==='dive'?.32:0);
 ctx.rotate(p.face+lean+(p.action?.kind==='spin'?p.spin*.20:p.spin*.035));
 // Procedural original overhead contact animation: feet churn and forearms
 // extend into the pile. Impact-induced lean / spin is derived from collisions.
 if(pileMotion||speed(p)>.5||p.action){
  ctx.strokeStyle=home?'#e8f5ac':'#aadbed';ctx.lineWidth=Math.max(1.6,r*.29);ctx.lineCap='round';
  const reach=p.action?.kind==='stiff'?1.85:p.action?.kind==='truck'?1.35:p.action?.kind==='impact-block'?1.70:p.pushing?1.43:pileMotion?1.17:.73;
  for(const side of [-1,1]){
   ctx.beginPath();ctx.moveTo(-r*.46,side*r*.35);ctx.lineTo(-r*(1.18+stride*.23*side),side*r*.50);ctx.stroke();
   ctx.beginPath();ctx.moveTo(r*.16,side*r*.7);ctx.lineTo(r*reach,side*r*(.58+(p.pushing?.13:0)));ctx.stroke();
  }
 }
 if(p.airState){ctx.save();ctx.strokeStyle='#eafda3';ctx.setLineDash([3,2]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*(1.35+ChaosLowContact.height(p)*.9),0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(p.action){ctx.save();ctx.strokeStyle=['juke','spin','hesi'].includes(p.action.kind)?'#e9ff70':['truck','hit-stick','impact-block'].includes(p.action.kind)?'#ff9c78':'#91f9ff';ctx.lineWidth=Math.max(2,r*.23);ctx.beginPath();ctx.arc(0,0,r*1.55,-Math.PI*.5,Math.PI*.5);ctx.stroke();ctx.restore();}
 ctx.fillStyle='#001c1a99';ctx.beginPath();ctx.ellipse(1.3,2.3,r*1.1,r*.75,0,0,Math.PI*2);ctx.fill();if(active===p){ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r+3,0,Math.PI*2);ctx.stroke()}
 ctx.fillStyle=home?'#d5f36b':'#79cef1';ctx.strokeStyle=home?'#f1ffc0':'#d5f8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#17352b';ctx.fillRect(r*.28,-r*.2,r*.33,r*.4);
 if(p.covering){ctx.strokeStyle='#e9ff8a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r+6,-1.2,1.2);ctx.stroke()}
 if(p.shield>0){ctx.strokeStyle='#ffed8d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r+4,0,Math.PI*2);ctx.stroke()}
 ctx.restore();ctx.save();ctx.fillStyle='#082a2c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(8,1.55*s)}px ui-sans-serif`;ctx.fillText(p.key==='WR1'?'X':p.key==='WR2'?'Z':p.pos==='EDGE'?'E':p.pos==='CB'?'C':p.pos==='OLB'?'O':p.pos==='MLB'?'M':p.pos==='FS'?'F':p.pos==='DT'?'D':p.pos==='NT'?'N':p.pos==='DE'?'E':p.pos==='FB'?'B':p.pos==='RB'?'R':p.pos==='QB'?'Q':p.pos==='TE'?'T':p.pos==='LT'?'L':p.pos==='RT'?'R':'C',x,y);ctx.restore();
 if(p===active&&phase==='live'){ctx.save();ctx.strokeStyle=burstTime>0?'#e9ff72':'#d5f7f6aa';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+p.vx*v.px*.47,y+p.vy*v.px*.47);ctx.stroke();ctx.restore()}
 if(p===active){ctx.save();ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(9,1.75*s)}px ui-sans-serif`;ctx.textAlign='center';ctx.fillText(p.name.split(' ').pop(),x,y-r-8);ctx.restore()}
 if(phase==='live'&&p.pulse>0){ctx.strokeStyle='#ffee9a';ctx.globalAlpha=p.pulse*2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+7,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
 if(markerCarrier===p){drawPossessionRing(x,y,r);ctx.fillStyle='#a56631';ctx.strokeStyle='#fff2cc';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(x+r*.6,y-r*.6,r*.44,r*.27,Math.PI/4,0,Math.PI*2);ctx.fill();ctx.stroke()}
}
function drawBall(v){if(!ball||!ball.flying)return;
 const spot=flightMarkers(),[sx,sy]=xy(spot.catchX,spot.catchY,v);
 const pulse=1+.10*Math.sin(totalClock*7),r=Math.max(9,v.px*.92)*pulse;
 ctx.save();ctx.strokeStyle='#f6e88e';ctx.lineWidth=2.6;ctx.globalAlpha=.87;
 ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([3,5]);ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.arc(sx,sy,r*.60,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.font='bold 10px ui-sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff8ba';ctx.fillText('CATCH',sx,sy-r-8);
 ctx.restore();const [x,y]=xy(ball.x,ball.y,v),s=v.px;const z=Math.max(0,ball.z*s);ctx.fillStyle='#020f1a90';ctx.beginPath();ctx.ellipse(x,y,6,4,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f9da91';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#efb47b';ctx.strokeStyle='#fff0cc';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x-z*.26,y-z*.43,Math.max(4,s*.4),Math.max(2,s*.23),Math.atan2(ball.vy,ball.vx),0,Math.PI*2);ctx.fill();ctx.stroke();}
function receiverPromptTargets(){
 if(controlMode!=='offense'||possession!==0||paused||matchOver||specialState||
    (tryState&&tryState.mode!=='two')||(phase!=='presnap'&&phase!=='live')||
    RUNS.has(selectedPlay)||passThrown||ball?.flying||ballCarrier)return [];
 // Dropback possession is implicit until the QB throws or becomes a runner.
 const qb=P('QB');
 if(!qb||(phase==='live'&&(active!==qb||qb.x>playStart+.10)))return [];
 return eligibleTargets();
}
function placeReceiverPins(v){
 const layer=$('receiverPins'),targets=receiverPromptTargets();
 layer.style.display=targets.length?'block':'none';
 $('targets').style.display=targets.length&&phase==='live'?'flex':'none';
 if(!targets.length)return;
 layer.querySelectorAll('button').forEach((b,i)=>{
  const p=targets[i];if(!p){b.style.display='none';return}
  const projected=visualMode==='3d'&&renderer3d?renderer3d.project(p.x,(p.h/74)*2.5,p.y):null;
  const [px,py]=projected?[projected.x,projected.y]:xy(p.x,p.y,v),visible=(!projected||projected.visible)&&px>20&&px<fieldSize.w-20&&py>24&&py<fieldSize.h-25;
  b.style.display=visible?'flex':'none';
  if(visible){b.style.left=px+'px';b.style.top=Math.max(22,py-18)+'px'}
 });
}
function placeActionCues(v){
 const layer=$('actionCueLayer');if(!layer)return;
 const activeCues=players.filter(p=>p.actionCue?.time>0&&!p.ground).slice(0,5);
 layer.replaceChildren();
 for(const p of activeCues){
  const projected=visualMode==='3d'&&renderer3d?renderer3d.project(p.x,3.10,p.y):null;
  const [x,y]=projected?[projected.x,projected.y]:xy(p.x,p.y,v);
  if((projected&&!projected.visible)||x<6||x>fieldSize.w-6||y<9||y>fieldSize.h-10)continue;
  const el=document.createElement('span');el.className='actionCue '+p.actionCue.kind+(p.actionCue.result?' confirmed':'');
  el.textContent=p.actionCue.label;el.style.left=x+'px';el.style.top=(y-12)+'px';
  layer.appendChild(el);
 }
}
// Thin amber links are active blocks; pink links are active tackle wraps.
function drawContactLinks(v){
 if(phase!=='live')return;
 ctx.save();ctx.lineCap='round';
 for(const e of blockLinks.values()){
  const a=P(e.blocker),b=P(e.defender);if(!a||!b)continue;
  const [ax,ay]=xy(a.x,a.y,v),[bx,by]=xy(b.x,b.y,v);
  ctx.strokeStyle='#ffb875';ctx.globalAlpha=.30+.40*e.secured;
  ctx.lineWidth=1.8+e.secured*2.3;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
 }
 for(const e of tackleLinks.values()){
  const a=P(e.defender),b=ballCarrier;if(!a||!b)continue;
  const [ax,ay]=xy(a.x,a.y,v),[bx,by]=xy(b.x,b.y,v);
  ctx.strokeStyle='#ff8295';ctx.globalAlpha=.60;ctx.lineWidth=2+e.grip*3;
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
 }
 ctx.restore();
}
function drawPileOverlay(v){
 if(!pileState?.active||!ballCarrier)return;
 const a=ballCarrier,[x,y]=xy(a.x,a.y,v),s=v.px;
 ctx.save();ctx.strokeStyle='#f4f4b4';ctx.globalAlpha=.62;
 ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,1.45*s,1.2*s,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.globalAlpha=1;ctx.fillStyle='#f7ffdc';ctx.textAlign='center';ctx.font='bold 10px ui-sans-serif';
 ctx.fillText('PILE  '+pileState.wrappers.length+' WRAP  ·  '+pileState.pushers.length+' PUSH',x,y-1.7*s);
 for(const entry of pileState.pushers){const p=P(entry.key);if(!p)continue;const [px,py]=xy(p.x,p.y,v);
  ctx.strokeStyle='#dfff79';ctx.globalAlpha=.48;ctx.lineWidth=2+entry.output;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x,y);ctx.stroke();}
 ctx.restore();
}
function render(){if(!canvas.width||!canvas.height)return;
 // Scrimmage models the QB's pre-release and pre-handoff possession implicitly.
 // Keep the visual holder separate from the carrier used by physics and camera.
 const markerCarrier=phase==='live'&&!ball?.flying
  ?ballCarrier||(!specialState&&controlMode==='defense'&&!passThrown&&!ball?P('QB'):null)
  :null;
 const dpr=fieldSize.scale;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,fieldSize.w,fieldSize.h);ctx.save();if(shake>0)ctx.translate(Math.sin(totalClock*173)*shake*7,Math.cos(totalClock*157)*shake*6);let v=view();drawField(v);if(!specialState){drawAssignments(v);drawRoute(v);}drawContactLinks(v);drawPileOverlay(v);for(let p of players.filter(q=>q.team===1))playerShape(p,v,markerCarrier);for(let p of players.filter(q=>q.team===0))playerShape(p,v,markerCarrier);drawBall(v);
 if(phase==='presnap'&&!specialState){let [x,y]=xy(playStart,26.6,v);ctx.fillStyle='#f8f1bf';ctx.font='bold 12px ui-sans-serif';ctx.textAlign='center';ctx.fillText('LINE OF SCRIMMAGE',x,y-31)}
 if(flash>0){ctx.fillStyle='rgba(226,255,142,'+(.16*flash/2)+')';ctx.fillRect(0,0,fieldSize.w,fieldSize.h)}ctx.restore();
 if(visualMode==='3d'&&renderer3d){
  try{renderer3d.draw({players,carrier:ballCarrier,markerCarrier,active,intended,ball,blocks:[...blockLinks.values()],tackles:[...tackleLinks.values()],possession,clock:totalClock,special:!!specialState,los:specialState?.kind==='punt'?120-specialState.puntFrom:isFreeKick(specialState)?kickLineX(specialState):playStart,first,phase,play:selectedPlay,passThrown,playStart,defenseArt:phase==='presnap'&&!specialState&&controlMode==='defense'?def.map(d=>({key:d.key,x:d.x,y:d.y,selected:d.key===selectedDefenderKey,assignment:d.assignment?{...d.assignment}:null,rush:d.rush,spy:d.spy,blitz:d.blitz,gapTarget:DefensivePresnap.gapTarget(d,off,playStart)})):[],art:phase==='presnap'&&!specialState&&!(gameStarted&&controlMode==='defense')?off.filter(p=>p.route?.length).map(p=>({key:p.key,start:[p.x,p.y],points:p.route})):[]});}
  catch(err){recoverFrom3DFailure(err)}
 }
 placeReceiverPins(v);
 placeActionCues(v);
}
// Controllers are sampled once per animation frame (not on keydown).
// Polling also discovers controllers already connected before the page loads.
function deadZone(x,y,cutoff=.18){
 const mag=Math.hypot(x,y);
 if(!Number.isFinite(mag)||mag<=cutoff)return {x:0,y:0};
 const scaled=clamp((Math.min(1,mag)-cutoff)/(1-cutoff),0,1);
 return {x:x/mag*scaled,y:y/mag*scaled};
}
function buttonValue(p,index){const b=p?.buttons?.[index];return b?Math.max(b.pressed?1:0,Number(b.value)||0):0}
function refreshControllerStatus(){
 const el=$('controllerStatus');if(!el)return;
 const status=padState.connected ?
  ('● '+(padState.standard?(/xbox|xinput|microsoft/i.test(padState.id)?'XBOX ONE CONTROLLER CONNECTED':'STANDARD GAMEPAD CONNECTED'):'CONTROLLER FOUND · UNSUPPORTED BUTTON MAP')+
   ' · '+(padState.id||'Gamepad').slice(0,66)+(padState.standard?' · RT '+Math.round(padState.rt*100)+'%':'')) :
  (typeof navigator.getGamepads==='function'?'○ Xbox One controller not detected · Connect via USB/Bluetooth, then press a button.':'○ This browser does not expose gamepad controls. Try Chrome or Edge.');
 if(status!==gamepadStatusLast){el.textContent=status;el.classList.toggle('detected',padState.connected&&padState.standard);el.classList.toggle('unsupported',padState.connected&&!padState.standard);gamepadStatusLast=status;}
}
function refreshPauseUI(){
 const curtain=$('pauseCurtain');if(curtain)curtain.style.display=paused?'grid':'none';
 const btn=$('pause');if(btn){btn.textContent=paused?'RESUME':'PAUSE';btn.disabled=phase!=='live';}
}
function togglePause(){if(phase!=='live')return false;paused=!paused;refreshPauseUI();hud();return paused}
function cyclePlay(delta){if(phase!=='presnap'||controlMode==='defense'||scrimmagePlayCalled)return;const i=plays.indexOf(selectedPlay);choosePlay(plays[(i+delta+plays.length)%plays.length]);}
function cycleScheme(kind,delta){if(phase!=='presnap')return;const keys=kind==='formation'?['spread','trips','ace','iform']:['mix','cover1','cover2','cover3','quarters'];const old=kind==='formation'?selectedFormation:coveragePreference;const next=keys[(keys.indexOf(old)+delta+keys.length)%keys.length];if(kind==='formation'){selectedFormation=next;$('formation').value=next}else{coveragePreference=next;$('coverage').value=next}setup();}
function clearPad(){protectBall(false);holdStiffArm(false);padState.connected=false;padState.standard=false;padState.index=-1;padState.id='';padState.lx=0;padState.ly=0;padState.rx=0;padState.ry=0;padState.lt=0;padState.rt=0;padState.previous=[];rightStickLatched=false;rightStickDirection='';queuedCarrierMove=null;xHoldStart=null;refreshControllerStatus();}
function pollGamepad(){
 if(tossStage==='call'||tossStage==='decision'){
  // Coin toss is controller accessible without leaking pre-snap game inputs.
  let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[])}catch(_){}
  const pad=pads.find(p=>p?.connected&&p.mapping==='standard');
  if(!pad){tossPadPrevious=[];return;}
  const held=Array.from({length:4},(_,i)=>!!pad.buttons?.[i]?.pressed);
  const chosen=held.findIndex((v,i)=>v&&!tossPadPrevious[i]);
  tossPadPrevious=held;
  if(chosen>=0){
   const options=Array.from(document.querySelectorAll('#coinTossOptions button'));
   // A/B/X map in order to heads/tails or receive/kick/defer.
   if(options[chosen])options[chosen].click();
  }
  return;
 }
 if(typeof navigator.getGamepads!=='function'){if(padState.connected)clearPad();else refreshControllerStatus();return;}
 let pads;try{pads=navigator.getGamepads()||[]}catch(e){clearPad();return;}
 // Keep the selected Xbox controller while it remains connected; otherwise use
 // the first controller with a standard layout, preferably an Xbox device.
 let pad=padState.index>=0&&pads[padState.index]?.connected?pads[padState.index]:null;
 if(!pad){const available=Array.from(pads).filter(Boolean).filter(p=>p.connected);
  pad=available.find(p=>p.mapping==='standard'&&/xbox|xinput|microsoft/i.test(p.id))||available.find(p=>p.mapping==='standard')||available[0]||null;
 }
 if(!pad){if(padState.connected)clearPad();else refreshControllerStatus();return;}
 const standard=pad.mapping==='standard';
 if(pad.index!==padState.index||pad.id!==padState.id||standard!==padState.standard){padState.previous=[];padState.index=pad.index;padState.id=pad.id;padState.standard=standard;}
 padState.connected=true;
 if(!standard){padState.lx=0;padState.ly=0;padState.rx=0;padState.ry=0;padState.lt=0;padState.rt=0;refreshControllerStatus();return;}
 const axis=deadZone(Number(pad.axes?.[0])||0,Number(pad.axes?.[1])||0);
 padState.lx=axis.x;padState.ly=axis.y;
 padState.rx=Number(pad.axes?.[2])||0;padState.ry=Number(pad.axes?.[3])||0;
 padState.lt=buttonValue(pad,XBOX.LT);padState.rt=buttonValue(pad,XBOX.RT);
 // One action per actual button-down transition; never repeat a held pass or cut.
 const next=Array.from({length:16},(_,i)=>buttonValue(pad,i)>.50);
 const was=padState.previous;
 const pressed=i=>!!next[i]&&!was[i];
 const released=i=>!next[i]&&!!was[i];
 padState.previous=next;
 if(phase==='halftime'){if(pressed(XBOX.A))startThirdQuarter();refreshControllerStatus();return;}
 if(pressed(XBOX.MENU)){togglePause();refreshControllerStatus();return;}
 if(paused){refreshControllerStatus();return;}
 if(phase==='presnap'){
  if(audibleOpen){
   for(const [button,index] of [[XBOX.A,0],[XBOX.B,1],[XBOX.X,2],[XBOX.Y,3]])if(pressed(button)){applyAudible(index);refreshControllerStatus();return;}
   if(pressed(XBOX.VIEW)){closeAudibles();refreshControllerStatus();return;}
   refreshControllerStatus();return;
  }
  if(pressed(XBOX.X)&&!playbookOpen&&!specialState&&(!tryState||tryState.mode==='two')){openAudibles();refreshControllerStatus();return;}
  if(pressed(XBOX.VIEW)){playbookOpen?hidePlaybook():showPlaybook();refreshControllerStatus();return;}
  if(controlMode==='defense'&&pressed(XBOX.B)&&!playbookOpen){switchDefender();refreshControllerStatus();return;}
  if(playbookOpen){
   for(const [button,direction] of [[XBOX.UP,'up'],[XBOX.DOWN,'down'],[XBOX.LEFT,'left'],[XBOX.RIGHT,'right']])if(pressed(button))moveSheetFocus(direction);
   if(pressed(XBOX.LB))cycleSheetFormation(-1);
   if(pressed(XBOX.RB))cycleSheetFormation(1);
   if(pressed(XBOX.A))chooseSheetFocused();
   if(pressed(XBOX.X)&&specialState)snap(); // Preserve existing kickoff controls; scrimmage X is reserved for audibles.
  }else{
   // Pre-snap D-pad never silently changes offensive calls.
   // Formation changes belong to the explicit playbook.
   if(pressed(XBOX.A))snap();
  }
 }else if(phase==='dead'){
  if(pressed(XBOX.A))nextDown();
 }else if(phase==='live'){
  if(specialState?.kind==='punt'&&ball?.flying&&pressed(XBOX.Y))returnFairCatch=true;
  if(ball?.flying&&!specialState){
   if(pressed(XBOX.B)){if(controlMode==='offense')switchToIntendedReceiver();else if(controlMode==='defense')switchDefender();}
   if(pressed(XBOX.X))chooseAirAction(controlMode==='offense'?'rac':'swat');
   if(pressed(XBOX.A))chooseAirAction(controlMode==='offense'?'possession':'receiver');
   if(pressed(XBOX.Y))chooseAirAction(controlMode==='offense'?'aggressive':'ball');
   // A held Y/A is not lost when it was pressed before this defender could
   // read or realistically reach the pass. Once eligible, queue it exactly
   // once, without repeated animations, popups, or remote catch attempts.
   if(controlMode==='defense'){
    const queuedHere=airSelection.defenderKey===selectedDefenderKey;
    if(next[XBOX.Y]&&(!queuedHere||airSelection.defense!=='ball')&&
       defenderAirInteractionZone(P(selectedDefenderKey)))chooseAirAction('ball','held-gamepad');
    else if(next[XBOX.A]&&(!queuedHere||!airSelection.defense)&&
       defenderAirInteractionZone(P(selectedDefenderKey)))chooseAirAction('receiver','held-gamepad');
   }
  }
  const qbMoveMode=!specialState&&padState.lt>.48&&!RUNS.has(selectedPlay)&&!passThrown&&!ballCarrier;
  if(!specialState&&controlMode==='offense'&&!RUNS.has(selectedPlay)&&!passThrown&&!ballCarrier&&!qbMoveMode){
   for(const [btn,idx] of [[XBOX.X,0],[XBOX.Y,1],[XBOX.A,2],[XBOX.B,3]]){
    if(pressed(btn))startPass(idx,'gamepad');
    if(released(btn)&&pendingPass?.source==='gamepad'&&pendingPass.index===idx)releasePass();
   }
  }
  if(controlMode==='offense'&&(ballCarrier?.team===0||qbMoveMode)){
   if(pressed(XBOX.B))carrierMove('spin');
   if(pressed(XBOX.Y)&&!specialState?.kind)carrierMove('hurdle');
   holdStiffArm(next[XBOX.A]);
   protectBall(next[XBOX.RB]);
   if(pressed(XBOX.X)){xHoldStart=playClock;xDiveFired=false;}
   if(released(XBOX.X)&&xHoldStart!==null){if(!xDiveFired)downSafe();xHoldStart=null;xDiveFired=false;}
   if(pressed(XBOX.LB)){manualDrive=false;suppressManualUntilNeutral=true;hud();}
  }else{holdStiffArm(false);protectBall(false);xHoldStart=null;}
  if(controlMode==='defense'&&pressed(XBOX.B)&&!ball?.flying)switchDefender();
  if(controlMode==='defense'&&!ball?.flying){
   const selected=P(selectedDefenderKey);if(selected){selected.conservativeHeld=!!next[XBOX.A];if(next[XBOX.A])selected.conservativeUntil=playClock+.12;}
   if(pressed(XBOX.X))defensiveFaceButton('X');
  }
  // Distinct flicks must be recognized even when the stick returns only
  // partway to center. Reversing left<->right also counts as a new flick.
  // Holding the same direction never auto-spams an action.
  const stickMag=Math.hypot(padState.rx,padState.ry);
  if(stickMag<.53){rightStickLatched=false;rightStickDirection='';}
  else if(stickMag>.68){
   const horizontal=Math.abs(padState.rx)>Math.abs(padState.ry)*1.12;
   const direction=horizontal?(padState.rx<0?'left':'right'):(padState.ry<0?'up':'down');
   const opposite=(rightStickDirection==='left'&&direction==='right')||(rightStickDirection==='right'&&direction==='left');
   if(!rightStickLatched||opposite){
    rightStickLatched=true;rightStickDirection=direction;
    if(controlMode==='defense'){
     if(!horizontal)defensiveStick(direction==='up'?'hit-stick':'cut-stick');
    }else if(controlMode==='line'){
     if(direction==='up')lineImpact();
    }else if(ballCarrier?.team===0||qbMoveMode){
     if(horizontal)carrierMove('juke',direction==='left'?-1:1);
     else if(direction==='up')carrierMove('truck');
     else carrierMove('hesi');
    }
   }
  }
  if(controlMode==='offense'&&pressed(XBOX.RT))burst();
 }
 refreshControllerStatus();
}
window.addEventListener('gamepadconnected',()=>refreshControllerStatus());
window.addEventListener('gamepaddisconnected',()=>pollGamepad());
function frame(timestamp){if(!frame.prev)frame.prev=timestamp;let elapsed=Math.min((timestamp-frame.prev)/1000,.05);frame.prev=timestamp;
 pollGamepad();
 if(!paused)gameTick(elapsed);
 if(phase==='live'&&!paused){frame.acc=(frame.acc||0)+elapsed;let cycles=0;while(frame.acc>=1/60&&cycles++<5&&phase==='live'){update(1/60);frame.acc-=1/60}}else{frame.acc=0;if(flash>0)flash=Math.max(0,flash-elapsed)}
 if(phase==='presnap'&&!paused)positionSelectedDefender(elapsed);
 if(phase==='presnap')hud();
 // A paused game was still rendering its 3D field 60 times per second. That
 // kept the GPU busy while the user watched video in another browser window.
 // Keep controls responsive but reduce GPU uploads/draw calls while paused.
 if(!paused||(!document.hidden&&timestamp-(frame.lastIdleRender||0)>=350)){
  render();if(paused)frame.lastIdleRender=timestamp;
 }
 requestAnimationFrame(frame)}
function summary(){const p=custom[$('athlete').value];$('physicsSummary').textContent='Calculated: '+(maxSpeed({...p,stam:1})*YARD_M*MPS_TO_MPH).toFixed(1)+' mph top speed · '+(acceleration(p)*YARD_M).toFixed(2)+' m/s² initial drive · '+mass(p).toFixed(1)+' kg mass · '+(catchReach(p)*YARD_M).toFixed(2)+' m modeled catch reach. Burst changes acceleration and velocity, not just the display.'};
function sliders(){const k=$('athlete').value, p=custom[k];$('meta').innerHTML=`<div><span>POSITION</span>${p.pos}</div><div><span>HEIGHT</span>${Math.floor(p.h/12)}′${p.h%12}″</div><div><span>WEIGHT</span>${p.w} lb</div>`;let list=['SPD','ACC','AGI','STR','TRK','TAK','BLO','CAT','JMP','AWR'];if(k==='K')list=['KPW','KAC','PUNT','SPD','ACC','AGI','AWR'];if(k==='QB')list=['SPD','ACC','AGI','THP','THA','TOR','VIS','DEC','BSK','AWR','STR'];if(k.startsWith('WR'))list=['SPD','ACC','AGI','JUK','SFA','CAT','RTE','CUT','DBL','REL','HND','STA'];if(k.startsWith('CB'))list=['SPD','ACC','AGI','COV','CAT','JMP','TAK'];if(k==='MLB'||k==='EDGE1')list=['SPD','ACC','AGI','STR','TAK','AWR','COV'];if(k==='TE')list=['SPD','ACC','STR','BLO','IBL','CAT','RTE','CUT','REL','HND'];if(k==='RB')list=['SPD','ACC','AGI','JUK','SFA','TRK','STR','CAT','STA'];
 if(['LT','LG','C','RG','RT','FB','TE2'].includes(k))list=['SPD','ACC','AGI','STR','BLO','IBL','AWR'];
 if(k==='MLB'||k==='EDGE1'||k==='NT'||k==='SAM')list=['SPD','ACC','AGI','TAK','HIT','PRC','PUR','STA','AWR'];
 if(k.startsWith('CB'))list=['SPD','ACC','AGI','COV','PRS','JAM','MIR','RCR','DIS','PRC','PUR','STA'];
 $('sliders').innerHTML=`<div class="sliderRow"><label>WEIGHT</label><input data-attr="w" type="range" min="155" max="365" step="5" value="${p.w}"><strong class="rating">${p.w}</strong></div><div class="sliderRow"><label>HEIGHT</label><input data-attr="h" type="range" min="65" max="82" step="1" value="${p.h}"><strong class="rating">${p.h}</strong></div>`+list.map(a=>`<div class="sliderRow"><label>${a}</label><input data-attr="${a}" type="range" min="30" max="99" step="1" value="${p[a]}"><strong class="rating">${p[a]}</strong></div>`).join('');
 $('sliders').querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{p[inp.dataset.attr]=Number(inp.value);inp.nextElementSibling.textContent=inp.value;summary();const live=P(k);if(live)live[inp.dataset.attr]=p[inp.dataset.attr];if(inp.dataset.attr==='h'||inp.dataset.attr==='w')$('meta').innerHTML=`<div><span>POSITION</span>${p.pos}</div><div><span>HEIGHT</span>${Math.floor(p.h/12)}′${p.h%12}″</div><div><span>WEIGHT</span>${p.w} lb</div>`;}));summary();}
function screenToField(e){const r=canvas.getBoundingClientRect(),v=view();return {x:v.left+(e.clientX-r.left)/v.px,y:(e.clientY-r.top)/v.px}}
function useTap(e){if(paused||phase!=='live'||RUNS.has(selectedPlay)||passThrown)return;const at=screenToField(e),rec=eligibleTargets();let choices=rec.map((p,i)=>({i,d:Math.hypot(p.x-at.x,p.y-at.y)})).sort((a,b)=>a.d-b.d);if(choices[0].d<6)passTo(choices[0].i,.27)}
function resizeStick(e){const r=$('joystick').getBoundingClientRect();const x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.hypot(x,y),max=r.width*.33;joystick.x=clamp(x/max,-1,1);joystick.y=clamp(y/max,-1,1);if(m>max){joystick.x=x/m;joystick.y=y/m}$('knob').style.transform=`translate(${joystick.x*max}px,${joystick.y*max}px)`}
$('joystick').addEventListener('pointerdown',e=>{joystick.active=true;joystick.pointer=e.pointerId;$('joystick').setPointerCapture(e.pointerId);resizeStick(e);e.preventDefault()});$('joystick').addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.pointer){resizeStick(e);e.preventDefault()}});function stickReset(){joystick.active=false;joystick.pointer=null;joystick.x=0;joystick.y=0;$('knob').style.transform='translate(0,0)'}$('joystick').addEventListener('pointerup',stickReset);$('joystick').addEventListener('pointercancel',stickReset);
function typingTarget(e){return ['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable;}
window.addEventListener('keydown',e=>{
 if(typingTarget(e))return;
 const key=e.key.toLowerCase();
 if(key==='p'){togglePause();e.preventDefault();return;}
 if(key==='k'&&specialState?.kind==='punt'&&phase==='live'&&ball?.flying){returnFairCatch=true;message('<strong>FAIR CATCH SIGNALED.</strong> Returner will down the punt at the catch point.');e.preventDefault();return;}
 if(paused){if([' ','shift','enter'].includes(key))e.preventDefault();return;}
 if(phase==='presnap'&&audibleOpen){
  if(['a','b','x','y'].includes(key)){applyAudible(['a','b','x','y'].indexOf(key));e.preventDefault();return;}
  if(key==='escape'){closeAudibles();e.preventDefault();return;}
  return;
 }
 if(phase==='presnap'&&key==='x'&&!playbookOpen){openAudibles();e.preventDefault();return;}
 if(phase==='presnap'&&key==='a'&&controlMode!=='defense'&&!playbookOpen){snap();e.preventDefault();return;}
 if((phase==='live'||phase==='presnap'&&controlMode==='defense')&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(key))e.preventDefault();
 keys[key]=true;
 if(e.repeat)return;
 if(['1','2','3','4'].includes(key))startPass(Number(key)-1,'keyboard');
 if(key===' ')evade();
 if(key==='t')carrierMove('truck');
 if((key==='g'||key==='y')&&controlMode==='offense'&&availableRunner())carrierMove('hurdle');
 if(key==='f'&&!e.repeat)holdStiffArm(true);
 if(key==='b'&&controlMode==='defense')switchDefender();
 if(key==='b'&&controlMode==='offense'&&ball?.flying)switchToIntendedReceiver();
 if(ball?.flying){if(key==='j')chooseAirAction(controlMode==='offense'?'rac':'swat','keyboard');if(key==='k')chooseAirAction(controlMode==='offense'?'possession':'receiver','keyboard');if(key==='l')chooseAirAction(controlMode==='offense'?'aggressive':'ball','keyboard');}
 if(key==='v'&&controlMode==='offense')carrierMove('spin');
 if(key==='c'&&controlMode==='offense')protectBall(true);
 if(key==='x'&&controlMode==='offense'&&(ballCarrier||keys.alt)){xHoldStart=playClock;xDiveFired=false;}
 if(key==='q'&&controlMode==='line')lineImpact();
 if(key==='z'&&controlMode==='defense')defensiveFaceButton('A');
 if(key==='x'&&controlMode==='defense'){
  if(ball?.flying)chooseAirAction('swat','keyboard');
  else defensiveFaceButton('X');
 }
 if(key==='h'&&controlMode==='defense')defensiveStick('hit-stick');
 if(key==='n'&&controlMode==='defense')defensiveStick('cut-stick');
 if(key==='shift')burst();
 if(key==='r')reset();
 if(key==='enter'){phase==='halftime'?startThirdQuarter():phase==='dead'?nextDown():snap();e.preventDefault()}
});
window.addEventListener('keyup',e=>{const key=e.key.toLowerCase();keys[key]=false;
 if(key==='c')protectBall(false);
 if(key==='f')holdStiffArm(false);
 if(key==='z'&&controlMode==='defense'){const d=P(selectedDefenderKey);if(d)d.conservativeHeld=false;}
 if(key==='x'&&xHoldStart!==null){if(!xDiveFired)downSafe();xHoldStart=null;xDiveFired=false;}
 if(['1','2','3','4'].includes(key)&&pendingPass?.source==='keyboard'&&pendingPass.index===Number(key)-1)releasePass();
});
window.addEventListener('blur',()=>{for(const key of Object.keys(keys))keys[key]=false;pendingPass=null;protectBall(false);holdStiffArm(false);xHoldStart=null;stickReset()});
$('airActions').querySelectorAll('button[data-air]').forEach((b,i)=>b.addEventListener('click',()=>chooseAirAction(controlMode==='defense'?['swat','receiver','ball'][i]:['rac','possession','aggressive'][i],'pointer')));
$('audibleOptions').addEventListener('click',e=>{const button=e.target.closest('[data-audible]');if(button)applyAudible(Number(button.dataset.audible));});
$('audibleClose').addEventListener('click',closeAudibles);
$('callSheet').addEventListener('click',e=>{
 const ret=e.target.closest('[data-returncall]');if(ret){returnCall=ret.dataset.returncall;organizeReturnUnit();showPlaybook();return;}
 const dc=e.target.closest('[data-defense-coverage]');if(dc&&possession===1&&phase==='presnap'){
  coveragePreference=dc.dataset.defenseCoverage;$('coverage').value=coveragePreference;
  const remaining=playSeconds,wasCalled=scrimmagePlayCalled;setup();playSeconds=remaining;scrimmagePlayCalled=wasCalled;showPlaybook();return;
 }
 const dp=e.target.closest('[data-defense-pressure]');if(dp&&possession===1&&phase==='presnap'){
  pressurePreference=dp.dataset.defensePressure;$('pressure').value=pressurePreference;
  const remaining=playSeconds,wasCalled=scrimmagePlayCalled;setup();playSeconds=remaining;scrimmagePlayCalled=wasCalled;showPlaybook();return;
 }
 const play=e.target.closest('[data-sheetplay]');if(play){if(controlMode==='offense')choosePlay(play.dataset.sheetplay);return;}
 const special=e.target.closest('[data-special]');if(special){chooseSpecial(special.dataset.special);return;}
});
$('closeSheet').addEventListener('click',hidePlaybook);
 $('sheetFormation').addEventListener('change',()=>{if(phase!=='presnap'||specialState)return;selectedFormation=$('sheetFormation').value;$('formation').value=selectedFormation;setup();showPlaybook();});
$('sheetSnap').addEventListener('click',()=>{if(tryState&&!tryState.mode){showPlaybook();return;}snap()});
$('playbookBtn').addEventListener('click',()=>phase==='presnap'?(playbookOpen?hidePlaybook():showPlaybook()):null);
$('timeoutBtn').addEventListener('click',requestTimeout);
 $('fairCatchBtn').addEventListener('click',()=>{if(phase==='live'&&specialState?.kind==='punt'&&ball?.flying){returnFairCatch=true;message('<strong>FAIR CATCH SIGNALED.</strong> The returner will down the punt.');}});
$('receiverSwitch').addEventListener('click',switchToIntendedReceiver);$('viewMode').addEventListener('click',()=>setVisualMode(visualMode==='3d'?'2d':'3d'));$('controlMode').addEventListener('click',cycleControlMode);$('jukeAction').addEventListener('click',()=>carrierMove('juke'));$('truckAction').addEventListener('click',()=>carrierMove('truck'));$('hurdleAction').addEventListener('click',()=>carrierMove('hurdle'));$('stiffAction').addEventListener('pointerdown',e=>{holdStiffArm(true);try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){};});$('stiffAction').addEventListener('pointerup',()=>holdStiffArm(false));$('stiffAction').addEventListener('pointercancel',()=>holdStiffArm(false));$('pause').addEventListener('click',togglePause);$('boost').addEventListener('click',burst);$('dive').addEventListener('click',evade);$('snap').addEventListener('click',()=>phase==='halftime'?startThirdQuarter():phase==='dead'?nextDown():snap());$('autoRun').addEventListener('click',()=>{if(phase==='live'&&ballCarrier){manualDrive=false;hud();canvas.focus({preventScroll:true});}});$('reset').addEventListener('click',()=>startNewMatch());$('downloadTrace').addEventListener('click',downloadTrace);$('athlete').addEventListener('change',sliders);for(let el of document.querySelectorAll('[data-play]'))el.addEventListener('click',()=>choosePlay(el.dataset.play));for(const [id,key] of [['formation','formation'],['front','front'],['coverage','coverage'],['pressure','pressure']])$(id).addEventListener('change',()=>{if(phase==='live')return;if(id==='formation')selectedFormation=$(id).value;if(id==='front')selectedFront=$(id).value;if(id==='coverage')coveragePreference=$(id).value;if(id==='pressure')pressurePreference=$(id).value;setup()});for(let el of document.querySelectorAll('[data-target]')){
 el.addEventListener('pointerdown',e=>{startPass(Number(el.dataset.target),'pointer');try{el.setPointerCapture(e.pointerId)}catch{}});
 el.addEventListener('pointerup',()=>{if(pendingPass?.source==='pointer')releasePass()});
 el.addEventListener('pointercancel',()=>{if(pendingPass?.source==='pointer')pendingPass=null});
 // Keyboard accessibility: Enter/Space activate a medium touch pass.
 el.addEventListener('click',e=>{if(e.detail===0)passTo(Number(el.dataset.target),.27)});
}canvas.addEventListener('click',useTap);
window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe($('canvasbox'));
try{renderer3d=createGridironRenderer($('render3d'))}catch(e){console.warn('WebGL view unavailable; using 2D',e)}
$('render3d').addEventListener('webglcontextlost',e=>{e.preventDefault();recoverFrom3DFailure(new Error('WebGL context lost'))});
setVisualMode(renderer3d?'3d':'2d');resize();sliders();startNewMatch();requestAnimationFrame(frame);
window.GRIDIRON_DEBUG={debugTackleDecision:(key)=>P(key)?.lastTackleDecision||null,debugSetConservative:(key,held)=>{const d=P(key);if(!d||d.team!==1)return false;d.conservativeHeld=!!held;d.conservativeUntil=held?playClock+.15:0;return true;},getDefensiveMemory:(team=0)=>DefensiveMemory.report(team),getDefensivePosition:()=>({key:selectedDefenderKey,assignment:DefensivePresnap.description(P(selectedDefenderKey)),gapTarget:DefensivePresnap.gapTarget(P(selectedDefenderKey),off,playStart)}),debugPositionDefender:(key,x,y)=>{if(phase!=='presnap'||controlMode!=='defense')return false;selectedDefenderKey=key;active=P(key);if(!active||active.team!==1)return false;const dx=x-active.x,dy=y-active.y;const length=Math.hypot(dx,dy);for(let i=0;i<Math.ceil(length/.055)&&i<1500;i++){const step=DefensivePresnap.move(active,{x:dx/(length||1),y:dy/(length||1)},1/60,playStart,def);if(!step)break;active.x=step.x;active.y=step.y;}if(active.assignment?.kind==='zone'){const a=active.assignment;if(a.homeX===undefined){a.homeX=a.baseX;a.homeY=a.baseY;}const v=DefensivePresnap.zoneAnchor(active);a.baseX=v.x;a.baseY=v.y;}return true;},debugReturnEscapeSide:(defenderY,blockerY)=>returnEscapeSide({y:defenderY},{y:blockerY}),debugReturnBypassTarget:(defenderY,blockerY,side)=>returnBypassTarget({y:defenderY,returnBypassSide:side},{y:blockerY},defenderY),defensiveFaceButton,moveSheetFocus,chooseSheetFocused,cycleSheetFormation,debugDefensePresnap:()=>{possession=1;selectControlMode('defense');setup();playSeconds=20;scrimmagePlayCalled=true;hud();},getAudibles:()=>({open:audibleOpen,choices:audibleChoices(),clock:playSeconds}),openAudibles,applyAudible,getSheet:()=>({open:playbookOpen,index:sheetFocusIndex,items:sheetOptions().map(b=>({label:b.innerText,focused:b.classList.contains('padFocus'),selected:b.classList.contains('active')}))}),debugCpuTiming:()=>CpuQBPolicy.minimumSettle(selectedPlay,P('QB')?.DEC||75,P('QB')?.VIS||75),debugRushTarget:(key)=>RushAwareness.target(P(key),P('QB'),playStart,playClock),debugWhistle:(type)=>finish(type,playStart,type),debugForceWhistleAt:(type,x)=>{if(phase!=='live')return false;finish(type,x,'Test whistle');return true;},newGame:startNewMatch,chooseSpecial,requestTimeout,nextDown,startKick:kickSpecial,getProtectionRead:()=>protectionRead?{...protectionRead}:null,debugProtectionStep:()=>{const rb=P('RB');if(!rb)return null;rbPassProtection(rb,1/60);return {target:rb.intentTarget,alert:rb.protectionAlert}},getQuarterDuration:()=>QUARTER_DURATION_SECONDS,startThirdQuarter,applyDelayOfGame,getCoinToss:()=>({stage:tossStage,call:tossCall,winner:tossWinner,firstHalfReceiver,secondHalfReceiver}),debugFinishCoinToss:(call='heads',choice='receive')=>{if(tossStage==='call')flipCoin(call);if(tossStage==='decision'){tossWinner=0;resolveToss(choice);}return tossStage;},getMatch:()=>({gameFlowNote,penaltyCount,phase,quarter,quarterSeconds,playSeconds,clockRunning,teamPoints:[...teamPoints],possession,controlMode,returnCall,kicker:{...kickRatings()},timeOuts:[...timeOuts],specialState:specialState?{...specialState}:null,tryState:tryState?{...tryState}:null,postWhistle,matchOver,playbookOpen}),debugSetQuarterTime:(v)=>{quarterSeconds=v;hud();},debugSetPlayClock:(v)=>{playSeconds=v;hud();},debugSetSpot:(x,d=1)=>{yard=x;down=d;first=x+10;togo=10;setup();hud();},getTrace:()=>({meta:lastTraceMeta,samples:playTrace.length,last:playTrace.at(-1)||null}),getVisual:()=>renderer3d?.getDebugState?.()||null,getController:()=>({connected:padState.connected,index:padState.index,id:padState.id,standard:padState.standard,lx:padState.lx,ly:padState.ly,rx:padState.rx,ry:padState.ry,lt:padState.lt,rt:padState.rt,paused}),getSteering:()=>({viewMode:visualMode,...stickInput()}),getState:()=>({paused,manualDrive,controlMode,selectedDefenderKey,selectedLinemanKey,moveCooldown,queuedCarrierMove:queuedCarrierMove?{...queuedCarrierMove}:null,rightStickLatched,rightStickDirection,burstCool,evadeCool,formation:selectedFormation,front:selectedFront,coverage:selectedCoverage,coveragePreference,pressure:selectedPressure,pressurePreference,airSelection:{...airSelection},airCounters:{...airCounters},lastAirResult,play:selectedPlay,phase,score,down,yard,togo,playClock,ballCarrier:ballCarrier?.key,target:intended?.key,passThrown,manualReceiver,active:active?.key,passProtection:players.filter(p=>['LT','LG','C','RG','RT','RB'].includes(p.key)).map(p=>({key:p.key,assignment:p.passAssignment||null,block:p.blockTarget||null,intent:p.intent,target:p.intentTarget})),cpuQB:{...cpuQB,choice:cpuQB.choice?.key||null},viewMode:visualMode,flightMarkers:flightMarkers(),ball:ball?{x:ball.x,y:ball.y,z:ball.z,flight:ball.flight,aimX:ball.aimX,aimY:ball.aimY,quality:ball.quality,accuracyError:ball.accuracyError,style:ball.style,loft:ball.loft}:null,pendingPass:pendingPass?{...pendingPass}:null, fatigueBank:{...fatigueBank},pile:pileState?{...pileState,pushers:[...pileState.pushers],wrappers:[...pileState.wrappers]}:null,contacts:{pileStarts,pilePushYards,chainHits,windedHits,standUps,hitStickCount,impactBlockCount,powerMoveCount,tackles:[...tackleLinks.values()].map(t=>({...t,attachment:t.attachment?{...t.attachment}:null})),blocks:[...blockLinks.values()].map(t=>({...t})),tackleCount,brokenTackleCount,blockShedCount},players:players.map(p=>({key:p.key,team:p.team,pos:p.pos,x:p.x,y:p.y,vx:p.vx,vy:p.vy,face:p.face,spawnX:p.spawnX,diveRecovery:p.diveRecovery,reengage:p.reengage?{...p.reengage}:null,stam:p.stam,gaitCap:p.gaitCap,SPD:p.SPD,ACC:p.ACC,PRC:p.PRC,PUR:p.PUR,STA:p.STA,runRead:p.runRead,readAt:p.readAt,readAtTime:p.readAtTime,fit:p.fit,blocked:p.blocked,assignment:p.assignment||null,rush:!!p.rush,spy:!!p.spy,blitz:!!p.blitz,rushStyle:p.passRushStyle,rushLane:p.passRushLane,passAssignment:p.passAssignment||null,passProtector:p.passProtector||null,routeIdx:p.routeIdx,routeComplete:p.routeComplete,scrambleTarget:p.scrambleTarget?{...p.scrambleTarget}:null,scrambleStepCount:p.scrambleStepCount,RTE:p.RTE,CUT:p.CUT,DBL:p.DBL,REL:p.REL,HND:p.HND,PRS:p.PRS,JAM:p.JAM,MIR:p.MIR,RCR:p.RCR,DIS:p.DIS,falseStep:p.falseStep?{...p.falseStep}:null,routeReadCount:p.routeReadCount,pressResult:p.pressResult,pressOpponent:p.pressOpponent,releaseSlow:p.releaseSlow,releaseBurst:p.releaseBurst,mirrorDelay:p.mirrorDelay,routeBreaks:p.routeBreaks,doubleMoveWins:p.doubleMoveWins,intent:p.intent,intentTarget:p.intentTarget,supportTarget:p.supportTarget,supportUntil:p.supportUntil,closePursuitRead:p.closePursuitRead?{...p.closePursuitRead}:null,lastTruckOutcome:p.lastTruckOutcome?{...p.lastTruckOutcome}:null,pursuitPoint:p.pursuitPoint?{...p.pursuitPoint}:null,primaryRunBlock:p.primaryRunBlock,jukeDrive:p.jukeDrive?{...p.jukeDrive}:null,pursuitPoint:p.pursuitPoint?{...p.pursuitPoint}:null,blockApproach:p.blockApproach?{...p.blockApproach}:null,blockWins:p.blockWins,blockMode:p.blockMode,beatenTarget:p.beatenTarget,beatenUntil:p.beatenUntil,action:p.action?{...p.action}:null,covering:p.covering,actionOutcomes:p.actionOutcomes,touches:p.touches,travel:p.travel,stun:p.stun,ground:p.ground?{...p.ground}:null,airReadAt:p.airReadAt,stiffArmHeld:p.stiffArmHeld,routeVariation:p.routeVariation?{...p.routeVariation}:null,coverageVariation:p.coverageVariation?{...p.coverageVariation}:null,jukeRecovery:p.jukeRecovery,pushing:p.pushing,sprinting:p.sprinting,airPose:p.airPose?{...p.airPose}:null,actionCue:p.actionCue?{...p.actionCue}:null,technique:p.technique,HIT:p.HIT,PMV:p.PMV,IBL:p.IBL,TAK:p.TAK,TRK:p.TRK,JUK:p.JUK,SFA:p.SFA,AGI:p.AGI,balance:p.balance,spin:p.spin,lean:p.lean,impact:p.impact,w:p.w,STR:p.STR,BLO:p.BLO,tackleCooldown:p.tackleCooldown,shedCooldown:p.shedCooldown,tackleStrain:p.tackleStrain,breakExertion:p.breakExertion,escapeReaction:p.escapeReaction?{...p.escapeReaction}:null,airState:p.airState?{...p.airState}:null,stumbleTime:p.stumbleTime,ankleReachTime:p.ankleReachTime,standContact:p.standContact,squareImpact:p.squareImpact?{...p.squareImpact}:null,contactCount:p.contactCount})),lastContact,logs:[...logs]}),select:choosePlay,snap,passTo,startPass,releasePass,carrierMove,protectBall,downSafe,diveForYards,selectControlMode,switchDefender,switchToIntendedReceiver,defensiveStick,lineImpact,burst,evade,reset,chooseAirAction,debugHurdleTest:(carrier,defender,low=true)=>{const a=P(carrier),d=P(defender);if(!a||!d)return false;return resolveHurdle(a,d,low?'cut':'hit');},debugCatchChance:(key,style='possession')=>{const p=P(key);return p?airCatchProbability(p,style,airContext(p)):null},debugDefenseAirChance:(key,style='swat',receiver='WR1')=>{const d=P(key);const r=P(receiver);return d?defenderAirProbability(d,style,r):null},debugAirEligibility:(key)=>defenderAirEligibility(P(key)),debugSetFlight:(x,y,z=1.5,flight=1.0,progress=.7,receiverKey=null)=>{if(phase!=='live')return false;ball={x,y,z,vx:0,vy:0,vz:0,t:flight*clamp(progress,0,.99),flight,ttl:flight+1,aimX:x,aimY:y,style:'TOUCH',flying:true,attempts:[],deflected:false};intended=receiverKey?P(receiverKey):null;passThrown=true;hud();return true},step:(n)=>{for(let i=0;i<n&&phase==='live';i++)update(1/60)},getPhysics:(key)=>{const p=custom[key];return p?{massKg:mass(p),accelerationYdPerSec2:acceleration(p),topSpeedYdPerSec:maxSpeed({...p,stam:1}),catchReachYd:catchReach(p),collisionRadiusYd:radius(p)}:null},custom,debugSeed:seed,debugPursuitAim:(key,carrier='RB')=>{const d=P(key),a=P(carrier);return d&&a?pursuitAim(d,a):null},debugSetPursuitBias:(key,lateral,depth)=>{const d=P(key);if(!d||d.team!==1)return false;d.pursuitLateralBias=clamp(lateral,-1,1);d.pursuitDepthBias=clamp(depth,-1,1);return true;},debugSetPursuitReadRoll:(key,roll)=>{const d=P(key);if(!d||d.team!==1)return false;d.pursuitReadRoll=clamp(roll,0,1);return true;},debugInsideZonePlan:()=>Object.fromEntries(['LT','LG','C','RG','RT'].map(k=>[k,P(k)?.insideZonePlan||null])),
 debugInsideZoneSight:(observer,target)=>InsideZoneIQ.visible(P(observer),P(target)),
 debugInsideZoneThreat:(blocker,defender,carrier='RB')=>{const o=P(blocker),d=P(defender),a=P(carrier);return o&&d&&a?InsideZoneIQ.threat(o,d,a,playStart):null},
 debugBlockAim:(blocker,defender,carrier='RB')=>{const o=P(blocker),d=P(defender),a=P(carrier);return o&&d&&a?blockInterceptPoint(o,d,a):null},debugSelectView:(mode)=>setVisualMode(mode),debugQuarterbackWindow:(key)=>{const p=P(key);return p?quarterbackWindow(P('QB'),p):null},debugForceCarrier:(key)=>{if(phase!=='live')return false;const p=P(key);if(!p||p.team!==0)return false;tackleLinks.clear();pileState=null;ballCarrier=p;active=p;passThrown=true;return true},debugMissTackle:(key)=>{if(phase!=='live'||!ballCarrier)return false;const d=P(key),a=ballCarrier;if(!d||d.team!==1)return false;d.x=a.x+radius(a)+radius(d)+.05;d.y=a.y;d.vx=0;d.vy=0;d.stun=0;a.shield=0;d.intent='recover';d.intentTarget=a.key;d.stun=.55+(a.TRK/99)*.55;d.shield=.2;a.shield=.68;d.contactCount++;a.contactCount++;log(a.name+' breaks '+d.pos+' tackle (test scenario)');return true},debugMovePlayer:(key,x,y)=>{const p=P(key);if(!p)return false;p.x=x;p.y=y;p.vx=0;p.vy=0;return true},debugSetVelocity:(key,vx,vy)=>{const p=P(key);if(!p)return false;p.vx=vx;p.vy=vy;return true},debugSetStamina:(key,value)=>{const p=P(key);if(!p)return false;p.stam=clamp(value,0,1);return true},debugSetBalance:(key,value)=>{const p=P(key);if(!p)return false;p.balance=clamp(value,.1,1);return true},debugSetDefenderState:(key,changes)=>{const d=P(key);if(!d||d.team!==1)return false;for(const k of ['face','blocked','shedCooldown','tackleCooldown','stun','diveRecovery','readAt'])if(Number.isFinite(changes[k]))d[k]=changes[k];if(changes.action===null)d.action=null;return true;},debugGroundContact:(victim,attacker,impulse,speed=6,nx=1,ny=0)=>{const v=P(victim),a=P(attacker);return v&&a?groundContact(v,a,impulse,speed,nx,ny):false},debugSetContactEnabled:(enabled)=>{contactEnabled=!!enabled;if(!contactEnabled)tackleLinks.clear();},debugResolveTackle:(n=1)=>{if(phase!=='live'||!ballCarrier)return false;for(let i=0;i<n&&phase==='live';i++)resolveTackles(ballCarrier,1/60);return true;},debugBlockPair:(offense,defense)=>{if(phase!=='live')return false;const o=P(offense),d=P(defense);if(!o||!d||o.team!==0||d.team!==1)return false;blockBattle(o,d,1/60);return blockLinks.has(offense);},debugAnatomy:(key)=>{const p=P(key);return p?AnatomyHitboxes.sample(p,{presnap:phase==='presnap'}):null;},debugAnatomyPair:(one,two)=>{const a=P(one),b=P(two);return a&&b?AnatomyHitboxes.contacts(AnatomyHitboxes.sample(a),AnatomyHitboxes.sample(b)):null;},debugBodyContacts:(n=1)=>{for(let i=0;i<n;i++)resolveBodyContacts();return true;},debugSetupLowDive:(runner='RB',defender='MLB',approach='front')=>{if(phase!=='live')return false;
  const a=P(runner),d=P(defender);if(!a||!d||a.team!==0||d.team!==1)return false;
  for(const p of players){if(p!==a&&p!==d){p.x=p.team===0?18:108;p.y=p.key.charCodeAt(0)%42+5;p.vx=0;p.vy=0;}}
  ballCarrier=a;active=a;passThrown=true;tackleLinks.clear();pileState=null;
  a.x=75;a.y=26;a.vx=1.4;a.vy=0;a.face=0;a.ground=null;a.balance=1;
  const angles={front:Math.PI,side:Math.PI/2,diagonal:Math.PI*3/4,miss:Math.PI/2};
  const angle=angles[approach]??Math.PI;
  const lateral=approach==='miss'?3.2:0;
  d.x=a.x+Math.cos(angle)*1.6;d.y=a.y+Math.sin(angle)*1.6+lateral;
  d.face=Math.atan2(a.y-d.y,a.x-d.x);d.vx=Math.cos(d.face)*8;d.vy=Math.sin(d.face)*8;
  d.ground=null;d.stun=0;d.tackleCooldown=0;d.blocked=0;d.lowDiveImpactAt=-999;
  d.action={kind:'tackle-dive',time:.43,age:.10,used:false};
  ChaosContactEvidence.reset();lowDiveContacts=0;lastLowDiveImpact=null;
  return true;
 },debugDiveCollision:(runner='RB',defender='MLB',runnerPrev=null,defPrev=null)=>{const a=P(runner),d=P(defender);if(!a||!d)return null;const oldA=runnerPrev||ChaosContactEvidence.poseCopy(a),oldD=defPrev||ChaosContactEvidence.poseCopy(d);return ChaosDiveCollision.evaluate(oldA,a,oldD,d);},
 debugLowContact:()=>({footContacts,lastFootContact,carrierAir:ballCarrier?.airState||null}),debugFootScenario:(runner='RB',defender='MLB',kind='dive')=>{const r=P(runner),d=P(defender);if(!r||!d)return false;for(const p of players)if(p!==r&&p!==d){p.x=p.team===0?18:106;p.y=2+(p.key.charCodeAt(0)%40);}ballCarrier=r;active=r;passThrown=true;specialState=null;tackleLinks.clear();r.x=70;r.y=26;r.vx=5;r.vy=0;r.face=0;r.balance=1;r.ground=null;r.airState=null;r.lowContactCooldown=0;r.stumbleTime=0;d.x=71.45;d.y=26;d.face=Math.PI;d.vx=-4;d.vy=0;d.ground=kind==='ground'?{stage:'winded',time:1,rest:1,rise:.3,age:0}:null;d.action=kind==='dive'?{kind:'tackle-dive',time:.5,age:.14,used:false}:null;d.lowContactCooldown=0;return true;},debugForceGripEscape:(key='MLB',recoverImmediately=false)=>{const d=P(key),a=ballCarrier;if(!d||!a||!tackleLinks.has(key))return false;releaseTackle(d,a,'escape',{effort:.5,kind:'break tackle'});if(recoverImmediately){d.ground=null;d.stun=0;d.diveRecovery=0;d.tackleCooldown=0;}return true;},debugEscapeReactions:()=>players.filter(p=>p.escapeReaction).map(p=>({key:p.key,ground:!!p.ground,kind:p.escapeReaction.kind,intensity:p.escapeReaction.intensity})),debugEscapeContests:()=>[...tackleLinks.values()].map(t=>({defender:t.defender,style:t.style,grip:t.grip,quality:t.quality,progress:t.escapeProgress||0,drive:t.escapeDiagnostics||null})),debugContactEvidence:()=>({events:ChaosContactEvidence.history(),lastAnatomyTackle,lowDiveContacts,lastLowDiveImpact,footContacts,lastFootContact}),debugContactCategory:(carrier,defender)=>{const a=P(carrier),d=P(defender);return a&&d?ChaosContactOutcomes.evaluate(a,d,tackleLinks.get(d.key)):null;},
 debugTackleWatch:(enabled=true)=>{tackleDiagnostics=enabled?[]:null;carrierCollisionDiagnostics=enabled?[]:null;},
 debugCarrierCollisionImpulses:()=>carrierCollisionDiagnostics?.slice()||[],
 debugTackleEligibility:()=>tackleDiagnostics?.slice()||[],
 debugContactWatch:(all=false)=>{ChaosContactEvidence.setEnabled(true);ChaosContactEvidence.setFullScan(all);return true;},
 debugContactReset:()=>{ChaosContactEvidence.reset();lastAnatomyTackle=null;lowDiveContacts=0;lastLowDiveImpact=null;footContacts=0;lastFootContact=null;return true;},
 debugRecognize:(key)=>{const d=P(key);return d?recognizeRun(d):false;},
 debugSecureInterception:(key,style='ball')=>{const d=P(key);if(phase!=='live'||!ball?.flying||!d||d.team!==1)return false;if(style==='catch')awardAirCatch(d,'possession',1);else awardAirInterception(d);return true;},
 debugIntercept:(key,carrier='RB')=>{const d=P(key),a=P(carrier);return d&&a?{time:interceptT(d,a),aim:pursuitAim(d,a),role:d.fit?.role}:null;},
 debugMotionOnly:(n=1)=>{for(let i=0;i<n;i++)applyMotion(1/60);return true;},
 debugSteer:(key,dx,dy,n=1,boost=1)=>{const p=P(key);if(!p)return false;for(let i=0;i<n;i++){steer(p,dx,dy,1/60,boost);p.x+=p.vx/60;p.y+=p.vy/60;}return true;},
 debugContactTackle:(carrier='RB',keys=['MLB'],n=60)=>{if(phase!=='live')return false;const a=P(carrier);if(!a)return false;ballCarrier=a;active=a;tackleLinks.clear();pileState=null;for(let i=0;i<n&&phase==='live';i++)resolveTackles(a,1/60);return true;},
 debugStartPile:(carrier='RB',tacklers=['MLB','CB1'])=>{
  if(phase!=='live')return false;
  const a=P(carrier);if(!a)return false;
  ballCarrier=a;active=a;passThrown=true;tackleLinks.clear();
  for(const key of tacklers){const d=P(key);if(!d)return false;tackleLinks.set(key,{defender:key,age:.28,grip:.5,initialImpulse:110,advantage:8});}
  pileState={active:true,carrier:a.key,startX:a.x,lastX:a.x,maxX:a.x,age:0,stalled:0,loose:0,pushers:[],wrappers:tacklers};pileStarts++;
  return true;
 },
 debugPileStep:(n=1)=>{if(phase!=='live'||!pileState)return false;
  for(let i=0;i<n&&phase==='live';i++){for(const o of off)if(o!==ballCarrier){o.intent='';if(['LT','LG','C','RG','RT','TE','TE2','FB'].includes(o.key))pileSupport(o,ballCarrier,1/60)}
   resolvePileDrive(1/60);applyMotion(1/60);resolveTackles(ballCarrier,1/60)}return true;
 },debugResolveBlock:(n=1)=>{if(phase!=='live')return false;for(let i=0;i<n;i++)resolveBlocks(1/60);return true;},setScheme:(formation,front,coverage,pressure)=>{if(formation)selectedFormation=formation;if(front)selectedFront=front;if(coverage)coveragePreference=coverage;if(pressure)pressurePreference=pressure;for(const [id,v] of [['formation',selectedFormation],['front',selectedFront],['coverage',coveragePreference],['pressure',pressurePreference]])$(id).value=v;setup();}};
})();
