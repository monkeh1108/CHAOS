def test_pursuit_live(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      result=page.evaluate('''() => {
   const api=GRIDIRON_DEBUG;
   api.reset();api.select('stretch');api.snap();api.debugForceCarrier('RB');
   api.debugSetContactEnabled(false);
   api.debugMovePlayer('EDGE1',35,13);
   api.debugMovePlayer('MLB',35,20);
   api.debugMovePlayer('RB',35,9);api.debugSetVelocity('RB',3,-3);
   const first=api.debugPursuitAim('EDGE1');
   api.debugMovePlayer('RB',32,7);api.debugSetVelocity('RB',-2,-4);
   const outside=api.debugPursuitAim('EDGE1');
   const inside=api.debugPursuitAim('MLB');
   const memory=api.getDefensiveMemory(0);
   api.step(5);
   return {first,outside,inside,phase:api.getState().phase,memoryCount:memory.sampleSize};
  }''')
      assert result['outside']['mode']=='retreat-contain',result
      assert result['outside']['x']>34,result
      assert result['outside']['y']<7,result
      assert result['inside']['mode']=='retreat-pursue',result
      assert result['inside']['y']>7,result
      assert result['memoryCount']==0,result
      assert not errors,errors
      print('PASS integrated run pursuit',width,result['first']['mode'],result['outside']['mode'],result['inside']['mode'])
      page.close()
     browser.close()
