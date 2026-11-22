from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  p=b.new_page(viewport={'width':width,'height':780}); errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(html,wait_until='load')
  p.evaluate("GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.debugSeed(48723);GRIDIRON_DEBUG.debugSetContactEnabled(false)");p.evaluate('GRIDIRON_DEBUG.startKick()')
  k=p.evaluate('GRIDIRON_DEBUG.getMatch().specialState');assert k and k['landingX']>0,k
  # Put WR2 on the intended landing spot and RB well behind in the opposite lane.
  p.evaluate('''k=>{const g=GRIDIRON_DEBUG;g.debugMovePlayer('RB',Math.max(10,k.landingX-11),4);g.debugMovePlayer('WR2',k.landingX,k.targetY)}''',k)
  for _ in range(40):
   p.evaluate('GRIDIRON_DEBUG.step(5)')
   k=p.evaluate('GRIDIRON_DEBUG.getMatch().specialState')
   if k is None or k.get('returning'):break
  assert k and k.get('returning'),k
  assert k['returnerKey']=='WR2' and k['backupReturnerKey']=='RB',k
  s=p.evaluate('GRIDIRON_DEBUG.getState()');ret=next(i for i in s['players'] if i['key']=='WR2');escort=next(i for i in s['players'] if i['key']=='RB')
  assert s['ballCarrier']=='WR2',s['ballCarrier']
  p.evaluate('GRIDIRON_DEBUG.step(6)')
  s=p.evaluate('GRIDIRON_DEBUG.getState()');escort=next(i for i in s['players'] if i['key']=='RB')
  assert escort['intent'] in ('lead-return-escort','lead-return-block','return-escort-catchup'),escort['intent']
  assert not errors,errors
  print('PASS width',width,'alternate catcher WR2, primary RB escort intent',escort['intent'])
  p.close()
 b.close()
