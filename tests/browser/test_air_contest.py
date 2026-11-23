"""Deep-pass participants can queue input early; distant non-participants cannot."""


def test_air_contest(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox']) as browser:
        for width in [1120,390]:
            page=browser.new_page(viewport={'width':width,'height':820})
            errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
            page.set_content(html,wait_until='load')
            result=page.evaluate('''() => {
          const g=GRIDIRON_DEBUG;
          const start=()=>{g.debugFinishCoinToss();g.reset();g.select('mesh');g.selectControlMode('defense');g.snap();g.debugSetContactEnabled(false)};
          start();
          g.debugMovePlayer('WR1',70,23);g.debugMovePlayer('CB1',69,23);
          g.debugMovePlayer('MLB',20,5);
          g.debugSetFlight(90,23,6.0,3.2,.03,'WR1');
          const cb=g.debugAirEligibility('CB1'),mlb=g.debugAirEligibility('MLB');
          const selected=g.getState().selectedDefenderKey;
          g.debugMovePlayer(selected,69.5,22.2);
          const selectedEarly=g.debugAirEligibility(selected);
          const queued=g.chooseAirAction('ball');
          const s=g.getState(),me=s.players.find(p=>p.key===selected);
          // Changing to a completely unrelated defender cannot keep remote rights.
          start();g.debugMovePlayer('WR1',70,23);g.debugMovePlayer('MLB',16,6);
          g.debugMovePlayer(g.getState().selectedDefenderKey,18,4);
          g.debugSetFlight(90,23,6.0,3.2,.03,'WR1');
          const far=g.debugAirEligibility(g.getState().selectedDefenderKey);
          const remoteY=g.chooseAirAction('ball');
          // A nearby zone defender that hasn't read the ball yet must wait;
          // a moment later, recognition makes the candidate legitimate.
          start();const z=g.getState().selectedDefenderKey;
          g.debugMovePlayer('WR1',45,5);g.debugMovePlayer(z,82,24);
          g.debugSetFlight(90,23,6.0,3.2,.03,'WR1');
          const beforeRead=g.debugAirEligibility(z);
          g.debugSetFlight(90,23,6.0,3.2,.34,'WR1');
          const afterRead=g.debugAirEligibility(z);
          return {cb,mlb,selectedEarly,queued,queuedStyle:s.airSelection.defense,pose:me.airPose,far,remoteY,beforeRead,afterRead};
        }''')
            print(f'policy {width}:',result)
            assert result['cb']['eligible'] and result['cb']['paired'], result
            assert not result['mlb']['eligible'],result
            assert result['selectedEarly']['eligible'] and result['queued'] and result['queuedStyle']=='ball',result
            assert result['pose'] is None, 'Early queue must not jump 20 yards from arrival'
            assert not result['far']['eligible'] and not result['remoteY'],result
            assert not result['beforeRead']['eligible'] and result['afterRead']['eligible'],result
            page.close()

            # A held Xbox Y from an uninvolved position should be accepted once the
            # defender arrives beside the intended WR, with no second button press.
            page=browser.new_page(viewport={'width':width,'height':820});page.set_content(html,wait_until='load')
            errs2=[];page.on('pageerror',lambda e:errs2.append(str(e)))
            page.evaluate('''() => {
          const g=GRIDIRON_DEBUG;g.debugFinishCoinToss();g.reset();g.select('mesh');
          g.selectControlMode('defense');g.snap();g.debugSetContactEnabled(false);
          window.fakePad={connected:true,index:0,id:'Xbox One fake',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
          Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.fakePad]});
          g.debugMovePlayer('WR1',70,23);
          g.debugMovePlayer(g.getState().selectedDefenderKey,20,2);
          g.debugSetFlight(90,23,6,3.3,.02,'WR1');
          fakePad.buttons[3]={pressed:true,value:1};
        }''')
            page.wait_for_timeout(110)
            first=page.evaluate('GRIDIRON_DEBUG.getState().airSelection.defense')
            assert first is None,(width,first)
            page.evaluate('''() => {
          const g=GRIDIRON_DEBUG;g.debugMovePlayer('WR1',70,23);
          g.debugMovePlayer(g.getState().selectedDefenderKey,69.1,23.3);
        }''')
            page.wait_for_timeout(120)
            final=page.evaluate('''() => {const g=GRIDIRON_DEBUG,s=g.getState();return {choice:s.airSelection.defense,key:s.airSelection.defenderKey,selected:s.selectedDefenderKey,pose:s.players.find(p=>p.key===s.selectedDefenderKey).airPose,eligibility:g.debugAirEligibility(s.selectedDefenderKey)}}''')
            print(f'held-Y {width}:',final)
            assert final['choice']=='ball' and final['key']==final['selected'] and final['eligibility']['eligible'],final
            assert final['pose'] is None, 'Animation should be held until arriving at catch point'
            assert not errs+errs2,(width,errs,errs2)
            page.close()
        browser.close()
    print('PASS: deep tracked contest, late-breaking help, unrelated players gated, held Xbox Y queue, no remote jump')
