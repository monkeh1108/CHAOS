def test_return_smoke(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':844})
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      page.evaluate('GRIDIRON_DEBUG.debugFinishCoinToss("heads","receive")')
      phase=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      assert phase['specialState']['kind']=='kickoff',phase
      assert page.evaluate('GRIDIRON_DEBUG.startKick()')
      page.wait_for_timeout(4400)
      state=page.evaluate('GRIDIRON_DEBUG.getState()')
      assert not errors,errors
      assert len(state['players'])==22
      assert state['phase'] in ('live','dead'),state['phase']
      if state['phase']=='live':
       blockers=[a for a in state['players'] if a['team']==0 and a['key'] not in ('RB','QB')]
       assert any(a['intent'] in ('return-block','return-lane','climb-second-level') for a in blockers),[(a['key'],a['intent']) for a in blockers]
      print('PASS kickoff return browser smoke',width,state['phase'])
     browser.close()
