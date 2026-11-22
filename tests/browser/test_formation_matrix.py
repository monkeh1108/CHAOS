"""Ensure receiver run blockers select the aligned/man CB across schemes."""


def test_formation_matrix(browser_session, standalone_html):
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox']) as browser:
     page=browser.new_page()
     errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
     page.set_content(HTML)
     bad=[];checked=0
     for formation in ['spread','trips','ace','iform']:
      for front in ['nickel','base43','base34']:
       for coverage in ['cover1','cover2','cover3','quarters']:
        for play in ['stretch','power','inside']:
         page.evaluate('''([formation,front,coverage,play])=>{
       GRIDIRON_DEBUG.reset();
       for(let [k,v] of [['formation',formation],['front',front],['coverage',coverage]]){
         let el=document.getElementById(k);el.value=v;el.dispatchEvent(new Event('change'));
       }
       GRIDIRON_DEBUG.select(play);GRIDIRON_DEBUG.snap();
       GRIDIRON_DEBUG.debugSetContactEnabled(false);GRIDIRON_DEBUG.step(15);
     }''',[formation,front,coverage,play])
         state=page.evaluate('GRIDIRON_DEBUG.getState()')
         players={p['key']:p for p in state['players']}
         for wr,cb in [('WR1','CB1'),('WR2','CB2')]:
          if players[wr]['primaryRunBlock']!=cb or players[wr]['intentTarget']!=cb:
           bad.append((formation,front,coverage,play,wr,players[wr]['primaryRunBlock'],players[wr]['intentTarget']))
         if formation in ('spread','trips') and front=='nickel':
          assert players['WR3']['primaryRunBlock']=='CB3',(formation,front,coverage,play,players['WR3']['primaryRunBlock'])
         checked+=1
     assert not bad,bad[:12]
     assert not errors,errors
     print('PASS',checked,'formation/front/coverage/run-play combinations: outside WR assigned to their CB; slot checks; no JS errors')
     page.close();browser.close()
