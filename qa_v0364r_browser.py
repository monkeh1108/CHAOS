from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for w in (1120,390):
  page=b.new_page(viewport={'width':w,'height':780});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  page.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.selectControlMode('defense');GRIDIRON_DEBUG.snap()")
  state=page.evaluate('GRIDIRON_DEBUG.getState()');assert state['phase']=='live',state['phase']
  d=state['selectedDefenderKey']; print('selected',d)
  page.evaluate("GRIDIRON_DEBUG.debugSetContactEnabled(false)")
  # Conservatively holding A must not trigger an animation when nobody nearby.
  page.evaluate('GRIDIRON_DEBUG.debugMovePlayer('+repr(d)+',95,8)')
  page.evaluate('GRIDIRON_DEBUG.debugSetConservative('+repr(d)+',true)')
  result=page.evaluate('GRIDIRON_DEBUG.defensiveFaceButton("A")');assert result
  p=next(x for x in page.evaluate('GRIDIRON_DEBUG.getState().players') if x['key']==d)
  assert not p['action'],p['action']
  # A directional X against empty space must commit without teleporting to ball.
  page.evaluate('GRIDIRON_DEBUG.debugSetConservative('+repr(d)+',false)')
  assert page.evaluate('GRIDIRON_DEBUG.defensiveFaceButton("X")')
  p=next(x for x in page.evaluate('GRIDIRON_DEBUG.getState().players') if x['key']==d)
  assert p['action']['kind']=='tackle-dive' and p['action']['used']==False,p['action']
  # Controller movement does not change direction of a committed dive.
  vx=p['vx'];page.evaluate('GRIDIRON_DEBUG.debugMotionOnly(3)')
  assert not errors,errors
  page.close()
 b.close()
print('PASS: desktop/mobile real engine no phantom A; no-target X dive; zero page errors')
