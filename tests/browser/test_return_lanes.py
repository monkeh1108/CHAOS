"""Regression probes for trailing solo tackles and kickoff coverage rejoining."""


def test_return_lanes(browser_session, standalone_html):
    html=standalone_html
    args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
    with browser_session(headless=True, args=args) as browser:
     for width in (1120,390):
      pg=browser.new_page(viewport={'width':width,'height':820})
      errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
      pg.set_content(html,wait_until='load')
      # Controlled low-stamina run: defender close behind must be able to complete
      # a sustained wrap without an unconditional ~0.73 sec escape.
      result=pg.evaluate('''() => {
    const g=GRIDIRON_DEBUG;g.reset();g.select('inside');g.snap();
    g.debugForceCarrier('RB');g.debugSetStamina('RB',0.05);
    let s=g.getState();const rb=s.players.find(x=>x.key==='RB');
    g.debugMovePlayer('RB',65,26);g.debugMovePlayer('CB1',64.3,26);
    g.debugSetVelocity('RB',0,0);g.debugSetVelocity('CB1',0,0);
    g.debugSetContactEnabled(true);
    g.debugContactTackle('RB',['CB1'],120);
    const after=g.getState();return {phase:after.phase,tackles:after.contacts.tackleCount,broken:after.contacts.brokenTackleCount,logs:after.logs.slice(-8)};
  }''')
      assert result['phase']=='dead',('stationary trailing contact never finished',width,result)
      # Initial coverage: kickers/defenders should participate after landing;
      # state should not fail with repeated simulated return frames.
      pg.evaluate('GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.startKick();GRIDIRON_DEBUG.step(230)')
      s=pg.evaluate('GRIDIRON_DEBUG.getState()')
      if s['phase']=='live' and s['ballCarrier']=='RB':
       coverage=[p for p in s['players'] if p['team']==1]
       assert any(p['intent'] in ('kick-cover','return-bypass','wrap','return-shed') for p in coverage),(width,[(p['key'],p['intent']) for p in coverage])
      assert not errors,(width,errors)
      print('PASS',width,'close trailing solo wrap ends play; kickoff remains responsive; no browser errors')
      pg.close()
     browser.close()
