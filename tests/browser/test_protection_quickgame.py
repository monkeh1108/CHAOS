"""Real-browser checks for v0.35.7 temporary 1min quarters and visible blitz read."""


def test_protection_quickgame(browser_session, standalone_html):
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':844})
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(HTML,wait_until='load')
      assert page.evaluate('GRIDIRON_DEBUG.getQuarterDuration()')==60
      assert page.evaluate('GRIDIRON_DEBUG.getMatch().quarterSeconds')==60
      page.evaluate('GRIDIRON_DEBUG.debugFinishCoinToss()')
      page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugDefensePresnap()')
      # Clean defensive look: far safety should not trigger a protection alert.
      page.evaluate('GRIDIRON_DEBUG.snap(true)')
      normal=page.evaluate('GRIDIRON_DEBUG.getProtectionRead()')
      assert normal is None or not normal.get('recognized'),normal
      # Move the safety close to the LOS before the snap, regardless of its hidden play call.
      spotted=[]
      for seed in range(1, 49):
       page.evaluate('seed => { GRIDIRON_DEBUG.reset(); GRIDIRON_DEBUG.debugSeed(seed); GRIDIRON_DEBUG.debugDefensePresnap(); }', seed)
       state=page.evaluate('GRIDIRON_DEBUG.getState()')
       safety=next(x for x in state['players'] if x['key']=='FS')
       assert page.evaluate(f'GRIDIRON_DEBUG.debugPositionDefender("FS",{state["yard"]+2.0},{safety["y"]})')
       page.evaluate('GRIDIRON_DEBUG.snap(true)')
       alert=page.evaluate('GRIDIRON_DEBUG.getProtectionRead()')
       spotted.append(alert)
      assert any(a and a.get('key')=='FS' and a.get('recognized') for a in spotted),spotted
      assert any(a and not a.get('recognized') for a in spotted),spotted
      # time change is a game rule, not an animated-clock illusion
      page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugSetQuarterTime(0)')
      page.wait_for_timeout(160)
      q=page.evaluate('GRIDIRON_DEBUG.getMatch().quarter')
      assert q==2,('Q1->Q2',q)
      page.evaluate('GRIDIRON_DEBUG.debugSetQuarterTime(0)')
      page.wait_for_timeout(160)
      assert page.evaluate('GRIDIRON_DEBUG.getMatch().phase') == 'halftime'
      page.get_by_role('button', name='START THIRD QUARTER', exact=True).click()
      state=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      assert state['quarter']==3 and state['specialState']['kind']=='kickoff',state
      assert not errors,errors
      print('PASS',width,'1-minute quarters, halftime, conditional visible safety read')
      page.close()
     browser.close()
