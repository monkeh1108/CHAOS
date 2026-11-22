from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader'])
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':820}); errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(HTML,wait_until='load');page.evaluate('GRIDIRON_DEBUG.reset()');page.evaluate("GRIDIRON_DEBUG.select('inside')")
  page.keyboard.press('x');assert page.evaluate('GRIDIRON_DEBUG.getAudibles().open')
  assert len(page.locator('#audibleOptions button').all())==4
  before=page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds');page.wait_for_timeout(250)
  page.locator('[data-audible="2"]').click()
  state=page.evaluate('GRIDIRON_DEBUG.getState()'); assert state['play']=='verticals',state['play']
  assert not page.evaluate('GRIDIRON_DEBUG.getAudibles().open')
  assert 0<page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')<before
  page.keyboard.press('ArrowRight');assert page.evaluate('GRIDIRON_DEBUG.getState().play')=='verticals'
  page.keyboard.press('a');assert page.evaluate('GRIDIRON_DEBUG.getState().phase')=='live'
  assert not errors,errors
  print('PASS',width,'audibles visible, selection, countdown, D-pad isolation, A snap')
  page.close()
 browser.close()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_content(HTML,wait_until='load')
 page.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugDefensePresnap();")
 original=page.evaluate('GRIDIRON_DEBUG.getState().play')
 page.evaluate("GRIDIRON_DEBUG.select('verticals')")
 assert page.evaluate('GRIDIRON_DEBUG.getState().play')==original
 page.keyboard.press('ArrowRight');assert page.evaluate('GRIDIRON_DEBUG.getState().play')==original
 page.keyboard.press('x');assert page.evaluate('GRIDIRON_DEBUG.getAudibles().open')
 assert len(page.locator('#audibleOptions button').all())==4
 before=page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')
 page.locator('[data-audible="0"]').click()
 assert page.evaluate('GRIDIRON_DEBUG.getState().play')==original
 assert page.evaluate('GRIDIRON_DEBUG.getState().pressurePreference')=='blitz'
 assert page.evaluate('GRIDIRON_DEBUG.getMatch().playSeconds')<=before
 page.evaluate("GRIDIRON_DEBUG.snap()")
 assert page.evaluate('GRIDIRON_DEBUG.getState().phase')=='live'
 # closest other defender rather than rotating to the next in distance order
 page.evaluate("GRIDIRON_DEBUG.debugMovePlayer('EDGE1',30,25);GRIDIRON_DEBUG.debugMovePlayer('EDGE2',30,28);GRIDIRON_DEBUG.debugMovePlayer('MLB',55,40);")
 page.evaluate("GRIDIRON_DEBUG.switchDefender()")
 assert page.evaluate('GRIDIRON_DEBUG.getState().selectedDefenderKey') in ('EDGE1','EDGE2')
 print('PASS defensive isolation, four audible calls, preserved clock, nearest switch')
 browser.close()
