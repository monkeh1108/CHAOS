from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
HTML=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for width in (1120,390):
  page=b.new_page(viewport={'width':width,'height':840})
  errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
  page.set_content(HTML,wait_until='load')
  page.evaluate('GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss();GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugDefensePresnap()')
  previous_yard=page.evaluate('GRIDIRON_DEBUG.getState().yard')
  page.evaluate('GRIDIRON_DEBUG.debugSetPlayClock(.01)')
  page.wait_for_timeout(150)
  state=page.evaluate('GRIDIRON_DEBUG.getMatch()')
  assert state['penaltyCount']==1,state
  assert abs(page.evaluate('GRIDIRON_DEBUG.getState().yard')-(previous_yard-5))<.01,(previous_yard,page.evaluate('GRIDIRON_DEBUG.getState().yard'))
  assert state['phase']=='presnap' and state['playSeconds']>0,state
  page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugSetQuarterTime(0)')
  page.wait_for_timeout(150)
  assert page.evaluate('GRIDIRON_DEBUG.getMatch().quarter')==2
  page.evaluate('GRIDIRON_DEBUG.debugSetQuarterTime(0)')
  page.wait_for_timeout(150)
  state=page.evaluate('GRIDIRON_DEBUG.getMatch()')
  assert state['quarter']==2 and state['phase']=='halftime' and not state['clockRunning'],state
  assert page.locator('#resultText').inner_text()=='HALFTIME'
  assert 'HALFTIME' in page.locator('#gameStateRead').inner_text()
  page.wait_for_timeout(200)
  assert page.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='halftime'
  page.locator('#snap').click()
  state=page.evaluate('GRIDIRON_DEBUG.getMatch()')
  assert state['quarter']==3 and state['specialState']['kind']=='kickoff' and state['phase']=='presnap',state
  assert state['quarterSeconds']==60,state
  assert not errors,errors
  print('PASS',width,'CPU delay of game, halftime overlay, 3rd-quarter kickoff, diagnostics')
  page.close()
 b.close()
