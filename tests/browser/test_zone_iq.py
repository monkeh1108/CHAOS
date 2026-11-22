"""v0.36.4: Inside Zone initial gaps, non-omniscient vision, physical blocking, paused draw budget."""


def test_zone_iq(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':840})
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      result=page.evaluate('''() => {
   const g=GRIDIRON_DEBUG;
   g.debugFinishCoinToss();g.reset();g.select('inside');g.snap();
   const plan=g.debugInsideZonePlan();
   const allocated=Object.values(plan).filter(p=>p?.target).map(p=>p.target);
   const counts={};for(const k of allocated)counts[k]=(counts[k]||0)+1;
   const left=plan.LT.target,right=plan.RT.target;
   const teammates=Object.values(plan).filter(p=>p?.combo);
   // Facing +x, objects behind at x=-10 cannot be magically observed.
   const front={x:7,y:0,face:0},back={x:-7,y:0};
   const sawFront=GRIDIRON_DEBUG.policies.InsideZoneIQ.visible(front,{x:8,y:0}),sawBack=GRIDIRON_DEBUG.policies.InsideZoneIQ.visible(front,back);
   // Defensive player's facing matters too.
   const d={x:0,y:0,face:Math.PI,PRC:91,AWR:91},rb={x:-6,y:0,vx:7,vy:0};
   const responsive=GRIDIRON_DEBUG.policies.InsideZoneIQ.response(d,[{key:'C',x:-2,y:.3}],rb,'fill-left');
   const blind=GRIDIRON_DEBUG.policies.InsideZoneIQ.response({...d,face:0},[{key:'C',x:-2,y:.3}],rb,'fill-left');
   // A moving back can change risk; and a blocker can't acquire someone behind.
   const o={x:0,y:26.6,face:0,AWR:85};const runner={x:2,y:26.6,vx:6,vy:0};
   const p1=GRIDIRON_DEBUG.policies.InsideZoneIQ.runnerProjection(runner,30);
   const eliteScan=GRIDIRON_DEBUG.policies.InsideZoneIQ.readDelay({AWR:96},.4),poorScan=GRIDIRON_DEBUG.policies.InsideZoneIQ.readDelay({AWR:55},.4);
   const scoreFront=GRIDIRON_DEBUG.policies.InsideZoneIQ.threat(o,{x:5,y:26.6,PUR:80,TAK:85,ACC:80,vx:-5,vy:0},runner,30);
   const scoreBack=GRIDIRON_DEBUG.policies.InsideZoneIQ.threat(o,{x:-4,y:26.6,PUR:80,TAK:85,ACC:80,vx:5,vy:0},runner,30);
   // Let scrimmage run; no page errors and block outcomes retained.
   g.step(38);let state=g.getState();
   const ol=state.players.filter(p=>['LT','LG','C','RG','RT'].includes(p.key));
   return {plan,counts,left,right,combos:teammates.length,sawFront,sawBack,responsive,blind,p1,scoreFront,scoreBack,eliteScan,poorScan,
    tick:state.playClock,ol:ol.map(p=>({key:p.key,intent:p.intent,target:p.intentTarget,x:p.x,y:p.y})),links:state.contacts.blocks.length};
  }''')
      print('WIDTH',width,result)
      assert len(result['counts'])>=3 and max(result['counts'].values())<=2,result
      assert result['combos']>=1,result
      assert result['sawFront'] and not result['sawBack'],result
      assert result['responsive'] and result['blind'] is None,result
      assert result['scoreFront']>result['scoreBack'],result
      assert result['eliteScan']<result['poorScan'] and .05<result['eliteScan']<.3,result
      assert all(p['intent'] in ['zone-drive','zone-combo','zone-climb','zone-search','whistle','handoff'] for p in result['ol']),result
      assert result['tick']>=.2,result
      assert not errors,(width,errors)
      page.close()
     browser.close()
    print('PASS: assignments, two-player combos, front FOV, run reaction, threats, browser game')
