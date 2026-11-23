def test_tackle_reengagement_live(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as b:
     for width in (1120,390):
      p=b.new_page(viewport={'width':width,'height':800});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
      p.set_content(html,wait_until='load')
      p.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
      p.evaluate('''()=>{const g=GRIDIRON_DEBUG;for(const p of g.getState().players){g.debugMovePlayer(p.key,p.team===0?20:100,8);g.debugSetVelocity(p.key,0,0)}g.debugForceCarrier('RB');g.debugMovePlayer('RB',80,24);g.debugMovePlayer('MLB',79.55,24);g.debugSetVelocity('RB',5,0);g.debugSetVelocity('MLB',1.6,0)}''')
      p.evaluate('GRIDIRON_DEBUG.debugResolveTackle(1)')
      t=p.evaluate('GRIDIRON_DEBUG.getState().contacts.tackles');assert len(t)==1,t
      outcomes=p.evaluate('''()=>{
   const g=GRIDIRON_DEBUG;
   g.debugMovePlayer('RB',80,24);g.debugMovePlayer('MLB',79.55,24);
   const didRelease=g.debugForceGripEscape('MLB',true);
   g.debugMovePlayer('MLB',79.55,24);
   g.debugResolveTackle(1);
   const blocked=g.getState().contacts.tackles.length===0;
   const state=g.getState().players.find(p=>p.key==='MLB').reengage;
   g.debugMovePlayer('MLB',77,24);g.debugResolveTackle(1);
   const cleared=g.getState().players.find(p=>p.key==='MLB').reengage===null;
   g.debugMovePlayer('MLB',79.55,24);g.debugResolveTackle(1);
   const newContact=g.getState().contacts.tackles.length===1;
   const debug=g.getState().players.find(p=>p.key==='MLB');
   return {didRelease,blocked,hadPending:!!state&&!state.hasSeparated,cleared,newContact,blockedState:debug.blocked,cooldown:debug.tackleCooldown};
  }''')
      print('contact cycle',width,outcomes)
      assert outcomes["didRelease"] and outcomes["blocked"] and outcomes["hadPending"] and outcomes["cleared"],outcomes
      assert not errors,errors
      p.close()
     b.close()
    print('PASS: desktop/mobile live engine rejects overlapping instant re-grip; later separated and recovered tackle valid')
