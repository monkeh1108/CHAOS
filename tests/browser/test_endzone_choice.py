"""Game-logic regression: caught-in-endzone fielding versus touchback choice."""
from pathlib import Path


def test_endzone_choice(browser_session, standalone_html):
    ROOT=Path(__file__).parent
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':850}); errors=[]
      page.on('pageerror',lambda e: errors.append(str(e)))
      page.set_content(HTML,wait_until='load');page.wait_for_timeout(100)
      def setup(seed):
       page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.debugSetContactEnabled(false)")
       page.evaluate(f'GRIDIRON_DEBUG.debugSeed({seed});GRIDIRON_DEBUG.startKick()')
       return page.evaluate('GRIDIRON_DEBUG.getMatch().specialState')
      kickseed=None
      for i in range(1,200):
       k=setup(i)
       if k['landingX']<=9.8:
        kickseed=i;break
      assert kickseed is not None,'could not find direct endzone kickoff seed'
      print('SEED',width,kickseed,'landing',k['landingX'],k['targetY'])
      def field():
       k=setup(kickseed)
       # Field from inside the end zone in physical proximity to the descending ball.
       page.evaluate('(pos)=>GRIDIRON_DEBUG.debugMovePlayer(pos.key,pos.x,pos.y)',{'key':k['returnerKey'],'x':k['landingX'],'y':k['targetY']})
       # Secondary is kept away; first receiver should genuinely be within reach.
       page.evaluate('(pos)=>GRIDIRON_DEBUG.debugMovePlayer(pos.key,20,2)',{'key':k['backupReturnerKey']})
       for _ in range(165):
        if page.evaluate('GRIDIRON_DEBUG.getMatch().specialState?.returning'):break
        if page.evaluate('GRIDIRON_DEBUG.getMatch().phase')!='live':break
        page.evaluate('GRIDIRON_DEBUG.step(1)')
       return page.evaluate('GRIDIRON_DEBUG.getMatch()')
      m=field();print('FIELD',width,m['phase'],m['specialState'] and {x:m['specialState'].get(x) for x in ['elapsed','returning','returnCaughtInEndzone','touchbackWindow','returnerKey','landingX']})
      assert m['phase']=='live' and m['specialState']['returning'] and m['specialState']['returnCaughtInEndzone'] and m['specialState']['touchbackWindow'],m
      # No directional input: after two seconds at endzone ball becomes dead, own 35.
      page.evaluate('GRIDIRON_DEBUG.step(121)')
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()');s=page.evaluate('GRIDIRON_DEBUG.getState()')
      print('IDLE',width,m['phase'],s['yard'],m['gameFlowNote'])
      assert m['phase']=='dead' and s['yard']==45,m
      # Directional input: early press commits to a real return instead of touchback.
      m=field();assert m['phase']=='live'
      page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',bubbles:true}))")
      page.evaluate('GRIDIRON_DEBUG.step(22)')
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      page.evaluate("window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}))")
      print('MOVE',width,m['phase'],m['specialState'] and {x:m['specialState'].get(x) for x in ['returning','returnCommitted','touchbackWindow','touchbackElapsed']})
      assert m['phase']=='live' and m['specialState']['returnCommitted'] and not m['specialState']['touchbackWindow'],m
      page.evaluate('GRIDIRON_DEBUG.step(132)')
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      print('AFTER RETURN',width,m['phase'],m['specialState'] and m['specialState'].get('returnCommitted'))
      assert m['phase']=='live' and m['specialState']['returnCommitted'],m
      # Deliberate give-up in one's own end zone is also a touchback.
      m=field();assert m['phase']=='live'
      assert page.evaluate('GRIDIRON_DEBUG.downSafe()')
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()');s=page.evaluate('GRIDIRON_DEBUG.getState()')
      print('GIVEUP',width,m['phase'],s['yard'],m['gameFlowNote'])
      assert m['phase']=='dead' and s['yard']==45 and m['teamPoints']==[0,0],m
      # CPU deep receiver can elect to run immediately (no forced user idle window).
      page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','kick');GRIDIRON_DEBUG.debugSetContactEnabled(false)")
      page.evaluate(f'GRIDIRON_DEBUG.debugSeed({kickseed});GRIDIRON_DEBUG.startKick()')
      k=page.evaluate('GRIDIRON_DEBUG.getMatch().specialState')
      assert page.evaluate('GRIDIRON_DEBUG.getMatch().controlMode')=='defense'
      page.evaluate('(pos)=>GRIDIRON_DEBUG.debugMovePlayer(pos.key,pos.x,pos.y)',{'key':k['returnerKey'],'x':k['landingX'],'y':k['targetY']})
      page.evaluate('(pos)=>GRIDIRON_DEBUG.debugMovePlayer(pos.key,20,2)',{'key':k['backupReturnerKey']})
      for _ in range(165):
       if page.evaluate('GRIDIRON_DEBUG.getMatch().specialState?.returning'):break
       if page.evaluate('GRIDIRON_DEBUG.getMatch().phase')!='live':break
       page.evaluate('GRIDIRON_DEBUG.step(1)')
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      print('CPU',width,m['phase'],m['specialState'] and (m['specialState'].get('returnCommitted'),m['specialState'].get('touchbackWindow')))
      assert m['phase']=='live' and m['specialState']['returnCommitted'] and not m['specialState']['touchbackWindow'],m
      # No remote catch: without a returner in range, end-zone landing is a touchback.
      k=setup(kickseed)
      page.evaluate('GRIDIRON_DEBUG.debugMovePlayer("RB",30,4);GRIDIRON_DEBUG.debugMovePlayer("WR2",30,45)')
      page.evaluate('GRIDIRON_DEBUG.step(170)')
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()');s=page.evaluate('GRIDIRON_DEBUG.getState()')
      print('UNFIELD',width,m['phase'],s['yard'])
      assert m['phase']=='dead' and s['yard']==45,m
      assert not errors, errors
      page.close()
     browser.close()
    print('PASS: fielded endzone kick gives human a return/touchback choice; no remote touch')
