def test_dive_collision_live(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':850});errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
      assert page.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='live'
      assert page.locator('#contactPreset option[value="kickdive"]').count()==1
      for angle in ('front','side','diagonal','miss'):
       assert page.evaluate('(angle)=>GRIDIRON_DEBUG.debugSetupLowDive("RB","MLB",angle)',angle)
       page.evaluate('GRIDIRON_DEBUG.debugMotionOnly(20)')
       evt=page.evaluate('GRIDIRON_DEBUG.debugContactEvidence()')
       print(width,angle,evt['lowDiveContacts'],evt['lastLowDiveImpact'] and evt['lastLowDiveImpact']['kind'])
       if angle!='miss':assert evt['lowDiveContacts']>0,(angle,evt)
       else:assert evt['lowDiveContacts']==0,evt
      assert not errors,errors
      page.close()
     browser.close()
    print('PASS live dive collision including isolated return-speed geometry, desktop/mobile')
