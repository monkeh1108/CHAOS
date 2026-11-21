from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
HTML=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':820})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='load')
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
  assert page.evaluate('document.querySelector("#inputStatus").textContent').find('SELECTED')>=0
  assert page.evaluate('window.GRIDIRON_DEBUG.getAudibles().open') is False
  assert page.evaluate(f'{D}.openAudibles()') is True
  assert page.evaluate(f'{D}.applyAudible(2)') is True
  # Ensure no route art supplied for the 3D renderer while the user controls defense.
  assert 'gameStarted&&controlMode===\'defense\'' in HTML
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
