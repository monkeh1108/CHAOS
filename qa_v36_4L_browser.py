"""Browser smoke and controlled kickoff lead-escort regression."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  page=b.new_page(viewport={'width':width,'height':800}); errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  # No game regression from diagnostic lab.
  for preset in ['miss','brush','wrap','north','west','ne','sw']:
   page.locator('#contactPreset').select_option(preset)
   page.locator('#contactTimeline').fill('60')
   assert page.locator('#contactReadout').count()==1
  page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.debugSetContactEnabled(false);GRIDIRON_DEBUG.debugSeed(3);GRIDIRON_DEBUG.startKick()")
  k=page.evaluate('GRIDIRON_DEBUG.getMatch().specialState')
  # Manual landing placement to isolate possession and lead-block timing.
  page.evaluate('(o)=>GRIDIRON_DEBUG.debugMovePlayer(o.key,o.x,o.y)',{'key':k['returnerKey'],'x':k['landingX'],'y':k['targetY']})
  page.evaluate('(o)=>GRIDIRON_DEBUG.debugMovePlayer(o.key,o.x,o.y)',{'key':k['backupReturnerKey'],'x':k['landingX']-1,'y':k['targetY']+3})
  for n in range(160):
   if page.evaluate('GRIDIRON_DEBUG.getMatch().specialState?.returning'):break
   if page.evaluate('GRIDIRON_DEBUG.getMatch().phase')!='live':break
   page.evaluate('GRIDIRON_DEBUG.step(1)')
  k=page.evaluate('GRIDIRON_DEBUG.getMatch().specialState')
  assert k and k['returning'], ('no fielded return', k)
  backup=k['backupReturnerKey']
  page.evaluate('GRIDIRON_DEBUG.step(6)')
  state=page.evaluate('GRIDIRON_DEBUG.getState()')
  secondary=next(p for p in state['players'] if p['key']==backup)
  assert secondary['intent'] in ('lead-return-escort','lead-return-block'),secondary
  carrier=next(p for p in state['players'] if p['key']==k['returnerKey'])
  assert secondary['intentTarget'] != 'returner',secondary
  print('PASS',width,'live kickoff backup',secondary['intent'],'carrier x',round(carrier['x'],2),'backup x',round(secondary['x'],2))
  assert not errors,errors
  page.close()
 b.close()
