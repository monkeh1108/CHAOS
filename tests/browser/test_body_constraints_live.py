def test_body_constraints_live(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as b:
     p=b.new_page(viewport={'width':1120,'height':850});errors=[]
     p.on('pageerror',lambda e:errors.append(str(e)))
     p.set_content(html,wait_until='load')
     p.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
     assert p.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='live'
     # Keep the explicit solver passes together so a browser frame cannot
     # resolve the overlap before the test measures the starting distance.
     distances=p.evaluate("""() => {
      const game=GRIDIRON_DEBUG;
      const gap=() => {
       const players=game.getState().players;
       const runner=players.find(player => player.key==='RB');
       const defender=players.find(player => player.key==='MLB');
       return Math.hypot(runner.x-defender.x, runner.y-defender.y);
      };
      game.debugMovePlayer('RB',85,25);
      game.debugMovePlayer('MLB',85.2,25);
      const before=gap();
      game.debugBodyContacts(1);
      const after=gap();
      game.debugBodyContacts(2);
      return [before,after,gap()];
     }""")
     before,after,final=distances
     assert 0.19<before<0.21,distances
     assert after>before+.025, (before,after)
     # Repeated solver passes converge without exceeding normal pad-scale contact.
     assert final>=after
     print('PASS live body separation',before,after,final)
     assert not errors,errors
     b.close()
