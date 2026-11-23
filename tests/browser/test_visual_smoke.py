"""Check original WebGL play sheet with controller selection and simple dive pose."""


def test_visual_smoke(browser_session, standalone_html, tmp_path):
    root=tmp_path
    with browser_session(headless=False, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(standalone_html,wait_until='load');page.evaluate("GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive')");page.wait_for_timeout(250)
      mode=page.evaluate('GRIDIRON_DEBUG.getState().viewMode')
      assert mode=='3d',(width,mode)
      assert page.locator('.sheetPick.padFocus').count()==1
      page.screenshot(path=str(root/f'qa_v33_menu_{width}.png'))
      page.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('mesh');GRIDIRON_DEBUG.selectControlMode('defense');GRIDIRON_DEBUG.snap();GRIDIRON_DEBUG.debugSetContactEnabled(false)")
      page.evaluate("""()=>{const d=GRIDIRON_DEBUG;d.debugForceCarrier('RB');let r=d.getState().players.find(p=>p.key==='RB');d.debugMovePlayer('MLB',r.x+2.7,r.y);d.defensiveFaceButton('X')}""")
      page.wait_for_timeout(55)
      assert page.evaluate("GRIDIRON_DEBUG.getState().players.find(p=>p.key==='MLB').action?.kind")=='tackle-dive'
      assert page.evaluate('GRIDIRON_DEBUG.getState().viewMode')=='3d'
      assert not errors,errors
      page.screenshot(path=str(root/f'qa_v33_tackle_{width}.png'))
      print('PASS WebGL',width,'controller highlight and defensive dive pose')
      page.close()
     browser.close()
