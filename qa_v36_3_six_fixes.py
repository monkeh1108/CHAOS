"""v0.36.3 goal-line geometry, facing, dive/recovery, blocking and Mesh regression."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

html=Path(__file__).with_name('index.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
      args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
    for width in (1120,390):
        page=browser.new_page(viewport={'width':width,'height':820})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        result=page.evaluate('''() => {
          const g=GRIDIRON_DEBUG;
          const fronts=['nickel','base43','base34'], covs=['cover1','cover2','cover3','quarters'];
          let maxX=-Infinity,maxAnchor=-Infinity,illegal=0,unique=0,normalDepth=0,compressedDepth=0,softCompress=0;
          for(const f of fronts)for(const cv of covs){
            g.reset();g.setScheme('spread',f,cv,'balanced');
            g.debugSetSpot(93);
            const fs17=g.getState().players.find(p=>p.key==='FS');
            if(f==='nickel'&&cv==='cover2')normalDepth=fs17.x-93;
            g.debugSetSpot(95);
            const near=g.getState().players.find(p=>p.key==='FS');
            if(near.x-95<(f==='nickel'?17:16)-.02)softCompress++;
            g.debugSetSpot(109);
            const ds=g.getState().players.filter(p=>p.team===1);
            maxX=Math.max(maxX,...ds.map(p=>p.x));
            maxAnchor=Math.max(maxAnchor,...ds.filter(p=>p.assignment?.kind==='zone').map(p=>p.assignment.baseX));
            illegal+=ds.filter(p=>p.x>114.651||p.assignment?.kind==='zone'&&p.assignment.baseX>114.651).length;
            const fs=ds.find(p=>p.key==='FS');
            compressedDepth=fs.x-109;
            if(ds.every(p=>Math.abs(p.face-Math.PI)<.001))unique++;
          }
          g.reset();g.debugSetSpot(30);g.select('inside');
          const initial=g.getState();
          const offFacing=initial.players.filter(p=>p.team===0).every(p=>Math.abs(p.face)<.01);
          const defFacing=initial.players.filter(p=>p.team===1).every(p=>Math.abs(p.face-Math.PI)<.01);
          g.snap();
          const defAfterSnap=g.getState().players.find(p=>p.key==='FS').face;
          g.debugForceCarrier('RB');
          const firstDive=g.diveForYards(),spamDive=g.diveForYards();
          const diveKind=g.getState().players.find(p=>p.key==='RB').action?.kind;
          g.step(40);
          const diveDone=g.getState().phase;
          g.reset();g.select('inside');g.selectControlMode('defense');g.snap();
          g.debugForceCarrier('RB');
          const selectedDef=g.getState().selectedDefenderKey;g.debugMovePlayer(selectedDef,42,13);g.debugMovePlayer('RB',52,13);
          const firstDefDive=g.defensiveFaceButton('X'),secondDefDive=g.defensiveFaceButton('X');
          const dAction=g.getState().players.find(p=>p.key===selectedDef).action?.kind;
          g.step(37);
          const dMiss=g.getState().players.find(p=>p.key===selectedDef);
          g.step(24);
          const dRising=g.getState().players.find(p=>p.key===selectedDef);
          g.step(22);
          const dRecovered=g.getState().players.find(p=>p.key===selectedDef);
          g.reset();g.selectControlMode('offense');g.setScheme('spread','nickel','cover2','balanced');g.select('inside');g.snap();
          g.debugMovePlayer('LT',37,22);g.debugMovePlayer('EDGE1',37.45,22);
          const blockLinked=g.debugBlockPair('LT','EDGE1');
          g.debugResolveBlock(17);
          const ps=g.getState().players;
          const o=ps.find(p=>p.key==='LT'),d=ps.find(p=>p.key==='EDGE1');
          const blockGap=o&&d?Math.hypot(o.x-d.x,o.y-d.y):-99;
          const blockContact=g.getState().contacts.blocks.filter(v=>v.blocker==='LT').length;
          g.reset();g.selectControlMode('offense');g.setScheme('spread','nickel','cover2','balanced');g.select('mesh');g.snap();
          g.debugSetContactEnabled(false);
          let minMesh=999,meshGrounds=0,checkSteps=0;
          for(let i=0;i<155;i++){
            g.step(1);const state=g.getState();
            if(state.phase!=='live')break;
            const a=state.players.find(p=>p.key==='WR1'),b=state.players.find(p=>p.key==='WR2');
            minMesh=Math.min(minMesh,Math.hypot(a.x-b.x,a.y-b.y));
            meshGrounds+=(a.ground?1:0)+(b.ground?1:0);checkSteps++;
          }
          // Reproduce a close Mesh crossing physically, not just waypoint math.
          g.debugMovePlayer('WR1',75,26.0);g.debugMovePlayer('WR2',75.38,26.2);
          g.debugSetVelocity('WR1',2,5);g.debugSetVelocity('WR2',2,-5);
          g.debugBodyContacts(1);
          const pair=g.getState().players;
          const a=pair.find(p=>p.key==='WR1'),b=pair.find(p=>p.key==='WR2');
          const nearMeshGap=Math.hypot(a.x-b.x,a.y-b.y);
          const nearMeshGround=!!(a.ground||b.ground);
          const nearGoalVertical=CoverageRoutePolicy.isVerticalThreat({x:112,y:20,vx:4,route:[[115,20]],routeComplete:false},109);
          return {maxX,maxAnchor,illegal,unique,normalDepth,compressedDepth,softCompress,offFacing,defFacing,defAfterSnap,
            firstDive,spamDive,diveKind,diveDone,firstDefDive,secondDefDive,dAction,
            missedGround:dMiss.ground?.stage||null,missedCooldown:dMiss.diveRecovery,
            recoverStage:dRising.ground?.stage||null,recoveredGround:dRecovered.ground?.stage||null,blockLinked,blockGap,blockContact,
            minMesh,meshGrounds,checkSteps,nearMeshGap,nearMeshGround,nearGoalVertical};
        }''')
        assert result['illegal']==0,result
        assert result['maxX']<=114.651 and result['maxAnchor']<=114.651,result
        assert result['unique']==12 and result['softCompress']==12,result
        assert 16.9<result['normalDepth']<17.1 and result['compressedDepth']<=5.651,result
        assert result['offFacing'] and result['defFacing'] and abs(result['defAfterSnap']-3.14159265)<.001,result
        assert result['firstDive'] and not result['spamDive'] and result['diveKind']=='dive',result
        assert result['diveDone']=='dead',result
        assert result['firstDefDive'] and not result['secondDefDive'] and result['dAction']=='tackle-dive',result
        assert result['missedGround'] in ('fall','winded','rise'),result
        assert result['recoverStage'] in ('rise',None),result
        assert result['blockLinked'] and result['blockGap']>=1.22,result
        assert result['meshGrounds']==0 and not result['nearMeshGround'],result
        assert result['nearMeshGap']>.85 and result['nearGoalVertical'],result
        assert not errors,(width,errors)
        print(f'PASS {width}: legal formation, facing, dive/recovery, block space, Mesh; minMesh={result["minMesh"]:.2f} maxDefenseX={result["maxX"]:.2f} gap={result["blockGap"]:.2f}')
        page.close()
    browser.close()
