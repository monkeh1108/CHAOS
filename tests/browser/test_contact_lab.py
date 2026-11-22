from pathlib import Path


def test_contact_lab(browser_session, standalone_html):
    ROOT=Path(__file__).parent
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':800});errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(HTML,wait_until='load');page.wait_for_timeout(200)
      page.evaluate("GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive')")
      assert page.locator('#chaosContactLab').count()==1
      assert page.locator('#contactReadout').inner_text().startswith('t=0.000')
      page.locator('#contactStep').click()
      assert page.locator('#contactReadout').inner_text().startswith('t=0.017')
      page.locator('#contactTimeline').fill('60')
      assert page.locator('#contactReadout').inner_text().startswith('t=1.000')
      page.locator('#contactPreset').select_option('miss')
      assert page.locator('#contactReadout').inner_text().startswith('t=0.000')
      page.locator('#contactSize').select_option('77,295')
      assert '77 in / 295 lb' in page.locator('#contactReadout').inner_text()
      # Without affecting current tackle rules, the live observer sees anatomy between 2 players.
      page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
      state=page.evaluate('GRIDIRON_DEBUG.getMatch().phase')
      assert state=='live',state
      page.evaluate("GRIDIRON_DEBUG.debugForceCarrier('RB');GRIDIRON_DEBUG.debugContactWatch(false)")
      page.evaluate("GRIDIRON_DEBUG.debugMovePlayer('RB',55,26);GRIDIRON_DEBUG.debugMovePlayer('MLB',55.3,26)")
      page.evaluate('GRIDIRON_DEBUG.step(2)')
      ev=page.evaluate('GRIDIRON_DEBUG.debugContactEvidence()')
      print(width, 'events',len(ev['events']), 'errors',errors[:2])
      assert len(ev['events'])>=1,ev
      assert any('RB' in e['pair'] and 'MLB' in e['pair'] for e in ev['events']),ev
      assert not errors,errors
      page.close()
     browser.close()
    print('PASS: collision lab UI + live anatomical observation on desktop and mobile')
