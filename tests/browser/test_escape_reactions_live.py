"""Live-page grip release checks, rendering smoke and kickoff regression."""


def test_escape_reactions_live(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as b:
     for width in (1120,390):
      page=b.new_page(viewport={'width':width,'height':800}); errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      assert page.locator('#contactPreset').count()==1
      page.locator('#contactPreset').select_option('wrap')
      page.locator('#contactTimeline').fill('45')
      # Verify the live game can progress and invoke the new math on a contact.
      page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
      assert page.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='live'
      page.evaluate('''() => {
    const g=GRIDIRON_DEBUG;
    for(const p of g.getState().players){g.debugMovePlayer(p.key,p.team===0?25:100,p.y);g.debugSetVelocity(p.key,0,0);}
    g.debugForceCarrier('RB');
    g.debugMovePlayer('RB',80,24);g.debugMovePlayer('MLB',79.55,24);
    g.debugSetVelocity('RB',5.2,0);g.debugSetVelocity('MLB',1.5,0);
  }''')
      page.evaluate('GRIDIRON_DEBUG.debugContactTackle("RB",["MLB"],1)')
      state=page.evaluate('GRIDIRON_DEBUG.getState()')
      links=state['contacts']['tackles']
      print('live at',width,'links',[(t['defender'],round(t['grip'],2)) for t in links],'reactions',page.evaluate('GRIDIRON_DEBUG.debugEscapeReactions()'))
      assert len(links)==1,('no real grip entered live engine', state['logs'][-3:])
      assert links[0].get('escapeDiagnostics') is not None,links
      assert state['players'][next(i for i,p in enumerate(state['players']) if p['key']=='RB')]['tackleStrain']>0, 'strain needs live presence'
      assert not errors,errors
      page.close()
     b.close()
    print('PASS browser live grip and rendering, desktop/mobile')
