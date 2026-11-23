"""Regression: special teams advances ground recovery; a rear wrap ends a return."""


START_LIVE_RETURN = """function startLiveReturn(g) {
    g.newGame();
    g.debugFinishCoinToss('heads', 'receive');
    g.debugSetContactEnabled(false);
    g.debugSeed(3);
    g.startKick();
    const kick=g.getMatch().specialState;
    g.debugMovePlayer('RB',kick.landingX,kick.targetY);
    for(let i=0;i<240 && !g.getMatch().specialState?.returning && g.getState().phase==='live';i++)g.step(1);
} """


def test_recovery_drag(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      result=page.evaluate('''() => {
    ''' + START_LIVE_RETURN + '''
    const g=GRIDIRON_DEBUG;
    startLiveReturn(g);
    let s=g.getState();
    if(s.phase!=='live'||s.ballCarrier!=='RB')return {error:'return not live',phase:s.phase,match:g.getMatch()};
    // Representative first-contact knockdown on the outside coverage player.
    g.debugMovePlayer('CB1',55,3.2);g.debugMovePlayer('LT',54.5,4);
    const knocked=g.debugGroundContact('CB1','LT',1800,12,1,0);
    const before=g.getState().players.find(p=>p.key==='CB1');
    g.step(60);
    const after=g.getState().players.find(p=>p.key==='CB1');
    return {knocked,before:before.ground,after:after.ground,afterIntent:after.intent,phase:g.getState().phase};
  }''')
      assert 'error' not in result,(width,result)
      assert result['knocked'],(width,result)
      assert result['before'],(width,result)
      assert result['after'] is None or result['after']['age'] >= .9,(width,result)
      # Separate isolated return; ensure close pursuit isn't lost to prior contacts.
      outcome=page.evaluate('''() => {
    ''' + START_LIVE_RETURN + '''
    const g=GRIDIRON_DEBUG;
    startLiveReturn(g);
    if(g.getState().phase!=='live')return {error:'no live return'};
    g.debugSetContactEnabled(true);
    g.debugMovePlayer('RB',70,25);g.debugSetStamina('RB',.10);g.debugSetVelocity('RB',3.1,0);
    for(const p of g.getState().players.filter(p=>p.team===1)) {
      g.debugMovePlayer(p.key,24,p.y);g.debugSetVelocity(p.key,0,0);
    }
    g.debugMovePlayer('CB1',69.55,25);g.debugSetVelocity('CB1',3.8,0);
    g.debugResolveTackle(110);
    const s=g.getState();return {phase:s.phase,logs:s.logs.slice(-12)};
  }''')
      assert outcome['phase']=='dead',(width,outcome)
      assert any('tackle' in x.lower() for x in outcome['logs']),(width,outcome)
      assert not errors,(width,errors)
      print('PASS',width,'ground recovery on kickoff and trailing tackle')
      page.close()
     browser.close()
