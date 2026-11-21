"""Targeted regression for v0.34.7 outside-lane and close return tackling."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  pg=b.new_page(viewport={'width':width,'height':820})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.set_content(html,wait_until='load')
  v=pg.evaluate('''() => {const g=GRIDIRON_DEBUG;return {low:g.debugReturnEscapeSide(3,5),high:g.debugReturnEscapeSide(50,48),mid:g.debugReturnEscapeSide(24,26),lowTarget:g.debugReturnBypassTarget(3,5,1),highTarget:g.debugReturnBypassTarget(50,48,-1)};}''')
  assert v['low']==1 and v['high']==-1 and v['mid']==-1 and v['lowTarget']>5 and v['highTarget']<48,(width,v)
  pg.evaluate('''() => {const g=GRIDIRON_DEBUG;g.newGame();g.startKick();g.step(200); }''')
  s=pg.evaluate('GRIDIRON_DEBUG.getState()')
  if s['phase']=='live' and s['ballCarrier']=='RB':
   p=next(x for x in s['players'] if x['key']=='RB')
   pg.evaluate('''() => {const g=GRIDIRON_DEBUG;g.debugMovePlayer('RB',70,25);g.debugSetVelocity('RB',0,0);g.debugSetStamina('RB',0.02);g.debugMovePlayer('CB1',69.4,25);g.debugSetVelocity('CB1',0,0);g.debugSetContactEnabled(true);g.step(100);}''')
   s2=pg.evaluate('GRIDIRON_DEBUG.getState()')
   assert s2['phase']=='dead',(width,s2['contacts'],s2['logs'][-7:])
  assert not errs,(width,errs)
  print('PASS',width,'sideline recovery inward and stationary return tackle')
  pg.close()
 b.close()
