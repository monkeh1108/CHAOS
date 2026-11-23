def test_live_blitz(browser_session, standalone_html):
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox']) as b:
     page=b.new_page()
     page.set_content(HTML,wait_until='load')
     for _ in range(30):
      page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugDefensePresnap()')
      state=page.evaluate('GRIDIRON_DEBUG.getState()')
      fs=next(x for x in state['players'] if x['key']=='FS')
      page.evaluate(f'GRIDIRON_DEBUG.debugPositionDefender("FS",{state["yard"]+2},{fs["y"]})')
      page.evaluate('GRIDIRON_DEBUG.snap(true)')
      alert=page.evaluate('GRIDIRON_DEBUG.getProtectionRead()')
      if alert and alert['key']=='FS' and alert['recognized']:break
     else:raise AssertionError('No recognizable visible safety look in 30 attempts')
     qb=page.evaluate('GRIDIRON_DEBUG.getState().players.find(p=>p.key==="QB")')
     page.evaluate(f'GRIDIRON_DEBUG.debugMovePlayer("FS",{qb["x"]+3},{qb["y"]+1})')
     page.evaluate('GRIDIRON_DEBUG.debugSetVelocity("FS",-7,0)')
     # Directly test assigned blocker response using the current visible position/velocity.
     answer=page.evaluate("GRIDIRON_DEBUG.debugProtectionStep()")
     assert answer['alert']=='FS' and answer['target'] in ('FS','MLB','OLB','WILL','SAM','EDGE1','EDGE2','DT','DT2','NT','DE3A','DE3B'),answer
     print('PASS threat physically closes QB: RB protection responds to recognized safety',answer)
     b.close()
