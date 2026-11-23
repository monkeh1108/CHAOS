def test_universal_defender_contact(browser_session, standalone_html):
    # The test supplies its own contact tick. Letting animation frames move
    # the players between positioning and impact changes the collision geometry.
    html=standalone_html.replace(
     '<script>', '<script>window.requestAnimationFrame = () => 0;</script><script>', 1,
    )
    with browser_session(headless=True, args=['--no-sandbox']) as b:
     p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
     p.set_content(html,wait_until='load')
     p.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.selectControlMode('defense');GRIDIRON_DEBUG.snap();GRIDIRON_DEBUG.debugSetContactEnabled(false)")
     # Force existing receiver and a selected defender to meet at speed.
     p.evaluate('''()=>{
  const g=GRIDIRON_DEBUG, state=g.getState();
  for(const player of state.players){if(player.key!=='MLB'&&player.key!=='WR1')g.debugMovePlayer(player.key,player.team===0?20:100,player.team===0?5:48);}
  g.debugMovePlayer('MLB',75,26);g.debugMovePlayer('WR1',75.75,26);
  g.debugSetDefenderState('MLB',{face:0});
  g.debugSetVelocity('MLB',6,0);g.debugSetVelocity('WR1',0,0);
 }''')
     # Directly test manually committed hit-stick through stick direction.
     result=p.evaluate('GRIDIRON_DEBUG.defensiveStick("hit-stick")');assert result
     p.evaluate('GRIDIRON_DEBUG.debugBodyContacts(1)')
     state=p.evaluate('GRIDIRON_DEBUG.getState()')
     d=next(x for x in state['players'] if x['key']=='MLB');r=next(x for x in state['players'] if x['key']=='WR1')
     print('collision',d['action'],r['vx'],r['impact'],state['logs'][-3:])
     assert d['action']['used'] and d['action']['impactContactKey']=='WR1',d['action']
     assert r['impact']>0 or r['vx']>0,r
     assert not state['contacts']['tackles'],state['contacts']['tackles']
     assert not errors,errors
     p.close();b.close()
    print('PASS: live real receiver power contact without tackle link/target lock')
