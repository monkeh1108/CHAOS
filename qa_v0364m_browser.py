from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':850}); errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
  assert page.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='live'
  # Isolate collision pair from original roster traffic.
  page.evaluate('''() => {const g=GRIDIRON_DEBUG; for(const p of g.getState().players){g.debugMovePlayer(p.key,p.team===0?25:100,p.y);g.debugSetVelocity(p.key,0,0);}g.debugForceCarrier('RB');g.debugMovePlayer('RB',80,25);g.debugMovePlayer('MLB',80.70,25);g.debugSetVelocity('RB',5,0);g.debugSetVelocity('MLB',-4,0);g.debugBodyContacts(1)}''')
  state=page.evaluate('GRIDIRON_DEBUG.getState()')
  rb=next(x for x in state['players'] if x['key']=='RB');lb=next(x for x in state['players'] if x['key']=='MLB')
  assert lb['squareImpact'] and lb['squareImpact']['score']>.5,lb.get('squareImpact')
  assert rb['standContact']>.35 and lb['standContact']>.35
  assert not errors,errors
  print('PASS',width,'real browser square contact',round(lb['squareImpact']['score'],3),'brace',round(rb['standContact'],3))
  page.close()
 browser.close()
