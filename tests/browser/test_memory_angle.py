def test_memory_angle(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      result=page.evaluate('''() => {
   const api=GRIDIRON_DEBUG;
   api.reset();
   api.custom.EDGE1.PUR=60;api.custom.EDGE1.PRC=60;
   const runOnce=()=>{
    api.debugSetSpot(50,1);api.select('stretch');api.snap();
    api.debugForceCarrier('RB');api.debugSetContactEnabled(false);
    api.debugMovePlayer('RB',35,9);api.debugSetVelocity('RB',2,-3);api.debugPursuitAim('EDGE1');
    api.debugMovePlayer('RB',31.5,7);api.debugSetVelocity('RB',-2,-4);api.debugPursuitAim('EDGE1');
    api.debugWhistle('tackle');
   };
   for(let i=0;i<4;i++)runOnce();
   const memory=api.getDefensiveMemory(0);
   api.debugSetSpot(50,1);api.select('stretch');api.snap();
   api.debugForceCarrier('RB');api.debugSetContactEnabled(false);
   api.debugSetPursuitReadRoll('EDGE1',0.01);api.debugSetPursuitBias('EDGE1',1,1);
   api.debugMovePlayer('RB',33.2,9);api.debugSetVelocity('RB',-1.4,-3);
   const aim=api.debugPursuitAim('EDGE1');
   const currentCount=api.getDefensiveMemory(0).sampleSize;
   api.debugSetPursuitReadRoll('EDGE1',.99);
   const unlucky=api.debugPursuitAim('EDGE1');
   return {sample:memory.sampleSize,sides:memory.history.map(p=>p.retreatSide),aim,unlucky,currentCount};
  }''')
      assert result['sample']==4,result
      assert result['sides']==['left']*4,result
      assert result['currentCount']==4,result
      assert result['aim']['learnedRead'],result
      assert result['aim']['angleQuality']>result['unlucky']['angleQuality']+.3,result
      assert not result['unlucky']['learnedRead'],result
      assert not errors,errors
      print('PASS integrated memory-angle learning',width, 'quality:',result['aim']['angleQuality'], 'unlucky:',result['unlucky']['angleQuality'])
      page.close()
     browser.close()
