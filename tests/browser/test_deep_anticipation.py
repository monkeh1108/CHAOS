def test_deep_anticipation(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      results=page.evaluate("""() => {
   const z={depth:19,baseX:54,baseY:26,width:16};
   const d={x:47,y:25,AWR:90,PRC:89};
   const r={key:'WR2',x:56,y:26,vx:6,vy:1,route:[[60,27]],routeComplete:false};
   const anticipation=GRIDIRON_DEBUG.policies.CoverageRoutePolicy.deepIntercept(d,r,z,30);
   const stopped=GRIDIRON_DEBUG.policies.CoverageRoutePolicy.deepIntercept(d,{...r,vx:0},z,30);
   const low=GRIDIRON_DEBUG.policies.CoverageRoutePolicy.deepIntercept({...d,AWR:50,PRC:50},r,z,30);
   GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('verticals');GRIDIRON_DEBUG.selectControlMode('offense');GRIDIRON_DEBUG.snap();GRIDIRON_DEBUG.step(90);
   const state=GRIDIRON_DEBUG.getState();
   return {anticipation,stopped,low,phase:state.phase,play:state.play};
  }""")
      assert results['anticipation']['x']>59,results
      assert results['stopped'] is None,results
      assert results['anticipation']['x']>results['low']['x'],results
      assert results['play']=='verticals',results
      assert not errors,(width,errors)
      print('PASS',width,'moving vertical projected ahead; nonvertical not predicted; ratings matter; live play runs')
      page.close()
     browser.close()
