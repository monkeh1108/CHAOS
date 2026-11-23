import re


def test_play_selection_and_input(browser_session, standalone_html):
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(HTML,wait_until='load');page.evaluate("GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive')")
      D='GRIDIRON_DEBUG';st=lambda:page.evaluate(f'{D}.getState()')
      page.evaluate(f'{D}.reset()')
      page.evaluate(f'{D}.debugDefensePresnap()')
      assert st()['phase']=='presnap' and st()['controlMode']=='defense'
      initial=st()['selectedDefenderKey']
      assert page.evaluate(f'{D}.switchDefender()')
      second=st()['selectedDefenderKey']
      assert initial!=second
      for _ in range(12):page.evaluate(f'{D}.switchDefender()')
      assert st()['phase']=='presnap'
      assert st()['selectedDefenderKey'] in page.locator('#inputStatus').inner_text()
      assert page.evaluate('window.GRIDIRON_DEBUG.getAudibles().open') is False
      assert page.evaluate(f'{D}.openAudibles()') is True
      assert page.evaluate(f'{D}.applyAudible(2)') is True
      # Ensure no route art supplied for the 3D renderer while the user controls defense.
      assert re.search(r'''!\s*\(\s*gameStarted\s*&&\s*controlMode\s*===\s*['"]defense['"]\s*\)''', HTML)
      # Two-point attempt should support normal playbook selection followed by X audible.
      page.evaluate('GRIDIRON_DEBUG.reset()')
      page.evaluate("GRIDIRON_DEBUG.select('inside')")
      page.evaluate('GRIDIRON_DEBUG.snap()')
      page.evaluate("GRIDIRON_DEBUG.debugWhistle('touchdown')")
      page.evaluate("GRIDIRON_DEBUG.nextDown()")
      assert page.evaluate("GRIDIRON_DEBUG.chooseSpecial('two')") is True
      assert page.evaluate("GRIDIRON_DEBUG.getMatch().tryState.mode")=='two'
      page.evaluate("GRIDIRON_DEBUG.select('slants')")
      assert page.evaluate('GRIDIRON_DEBUG.openAudibles()') is True
      assert page.evaluate('GRIDIRON_DEBUG.applyAudible(0)') is True
      assert not errors,(width,errors)
      print('PASS',width,'pre-snap defender cycling and defensive audibles')
      page.close()
     browser.close()
