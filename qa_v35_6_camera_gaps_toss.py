"""Browser checks for v0.35.6; source files are never mutated by this test."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
HTML=Path(__file__).with_name('index.html').read_text()
args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=False,args=args)
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':844})
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(HTML,wait_until='load')
  assert page.locator('#coinToss').is_visible(), 'Coin toss must precede opening kickoff'
  assert page.evaluate("GRIDIRON_DEBUG.getCoinToss().stage")=='call'
  page.locator('#coinTossOptions button').first.click()
  assert page.evaluate("GRIDIRON_DEBUG.getCoinToss().stage")=='decision'
  state=page.evaluate('GRIDIRON_DEBUG.getCoinToss()')
  if state['winner']==0:
   page.get_by_role('button',name='DEFER',exact=True).click()
  else:
   page.get_by_role('button',name='CONTINUE',exact=True).click()
  match=page.evaluate('GRIDIRON_DEBUG.getMatch()')
  toss=page.evaluate('GRIDIRON_DEBUG.getCoinToss()')
  assert toss['stage']=='complete' and not page.locator('#coinToss').is_visible()
  assert match['possession']==toss['firstHalfReceiver'],(match,toss)
  assert toss['firstHalfReceiver']!=toss['secondHalfReceiver']
  # Deterministic defensive pre-snap scene after the toss.
  page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugDefensePresnap()')
  page.wait_for_timeout(90)
  assert page.evaluate('GRIDIRON_DEBUG.getState().controlMode')=='defense'
  before=page.evaluate('GRIDIRON_DEBUG.getVisual()')
  assert before and before['presnapView'] and before['desiredZoom']==1.4,before
  pre=page.evaluate('GRIDIRON_DEBUG.getState().players.find(p=>p.key==="MLB")')
  gap_before=page.evaluate('GRIDIRON_DEBUG.getDefensivePosition().gapTarget')
  # Move the MLB far left; gap target must stay at the same offensive line gap.
  assert page.evaluate(f'GRIDIRON_DEBUG.debugPositionDefender("MLB",{pre["x"]+4},{pre["y"]-11})')
  moved=page.evaluate('GRIDIRON_DEBUG.getState().players.find(p=>p.key==="MLB")')
  gap_after=page.evaluate('GRIDIRON_DEBUG.getDefensivePosition().gapTarget')
  assert abs(moved['y']-pre['y'])>5,(pre,moved)
  assert gap_before==gap_after,(gap_before,gap_after)
  page.wait_for_timeout(90)
  camera=page.evaluate('GRIDIRON_DEBUG.getVisual()')
  assert abs(camera['focusY']-before['focusY'])<.35,(before,camera)
  assert abs(camera['focusX']-before['focusX'])<.35,(before,camera)
  # Live coverage / gap assignments still respond from relocated coordinates.
  page.evaluate('GRIDIRON_DEBUG.snap(true)')
  assert page.evaluate('GRIDIRON_DEBUG.getState().phase')=='live'
  assert not errors,errors
  print('PASS',width,'coin toss, opening possession, static pre-snap camera, anchored gap, snap')
  page.close()
 browser.close()
# Test receive, kick and defer separately; kick is not synonymous with defer.
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=args)
 for choice,expected_first,expected_second in [('receive',0,1),('kick',1,1),('defer',1,0)]:
  page=browser.new_page(viewport={'width':1120,'height':844})
  page.set_content(HTML,wait_until='load')
  page.evaluate(f'GRIDIRON_DEBUG.debugFinishCoinToss("heads","{choice}")')
  toss=page.evaluate('GRIDIRON_DEBUG.getCoinToss()')
  assert (toss['firstHalfReceiver'],toss['secondHalfReceiver'])==(expected_first,expected_second),(choice,toss)
  assert page.evaluate('GRIDIRON_DEBUG.getMatch().possession')==expected_first
  print('PASS home chooses',choice,'first',expected_first,'second',expected_second)
  page.close()
 browser.close()
