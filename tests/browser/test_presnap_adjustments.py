"""Step 2: play selection and 20-second countdown, including reopened playbook."""


def test_presnap_adjustments(browser_session, standalone_html):
    HTML=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
      page.set_content(HTML,wait_until='load')
      page.evaluate('GRIDIRON_DEBUG.reset()')
      page.locator('#playbookBtn').click()
      before=page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')
      page.wait_for_timeout(350)
      after=page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')
      assert abs(before-after)<.1,(before,after)
      page.locator('[data-sheetplay="verticals"]').click()
      m=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      assert not m['playbookOpen'] and m['playSeconds']<=20 and m['playSeconds']>19.5,m
      page.wait_for_timeout(350)
      m2=page.evaluate('GRIDIRON_DEBUG.getMatch()')
      assert m2['playSeconds']<m['playSeconds'],(m,m2)
      page.locator('#playbookBtn').click()
      b=page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')
      page.wait_for_timeout(300)
      a=page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')
      assert a<b,(a,b)
      page.locator('#closeSheet').click()
      page.evaluate('GRIDIRON_DEBUG.snap()')
      assert page.evaluate('GRIDIRON_DEBUG.getState().phase')=='live'
      page.evaluate('GRIDIRON_DEBUG.reset()')
      page.evaluate("GRIDIRON_DEBUG.select('inside')")
      page.evaluate('GRIDIRON_DEBUG.debugSetPlayClock(.05)')
      page.wait_for_timeout(250)
      assert any('DELAY OF GAME' in x for x in page.evaluate('GRIDIRON_DEBUG.getState().logs'))
      assert page.evaluate('GRIDIRON_DEBUG.getMatch().playbookOpen')
      assert not errors,errors
      print('PASS',width,'selection, clock countdown, reopened sheet, snap, delay penalty')
      page.close()
     browser.close()
