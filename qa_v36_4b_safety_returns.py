from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
ROOT=Path(__file__).parent
HTML=(ROOT/'index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for w in [1120,390]:
  page=browser.new_page(viewport={'width':w,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='load');page.wait_for_timeout(150)
  game=lambda:page.evaluate('GRIDIRON_DEBUG.getMatch()')
  state=lambda:page.evaluate('GRIDIRON_DEBUG.getState()')
  # complete coin toss where applicable, wait until kickoff
  page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive')")
  a=state();m=game();print('INIT',w,m['phase'],m['specialState'] and m['specialState']['kind'],[(p['key'],round(p['x'],1),round(p['y'],1)) for p in a['players'] if p['key'] in ('RB','WR2')])
  assert m['specialState'] and m['specialState']['kind']=='kickoff'
  p1=next(p for p in a['players'] if p['key']=='RB');p2=next(p for p in a['players'] if p['key']=='WR2')
  assert abs(p1['y']-p2['y'])>=16,(p1,p2)
  page.evaluate('GRIDIRON_DEBUG.debugSeed(1462);GRIDIRON_DEBUG.startKick()')
  m=game();assert m['specialState']['returnerKey'] in ('RB','WR2'),m
  p0=state();page.evaluate('GRIDIRON_DEBUG.step(143)');p1s=state();m=game()
  print('AFTER FLIGHT',w,m['phase'],m['specialState'],[(p['key'],round(p['x'],1),round(p['y'],1)) for p in p1s['players'] if p['key'] in ('RB','WR2')])
  # No old landing-position teleport (large jump); existing crowd contact solver can cause smaller abrupt corrections
  # for this test, transition is sampled as a 1/60 sec tick.
  page.evaluate('GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss();GRIDIRON_DEBUG.debugSeed(1462);GRIDIRON_DEBUG.startKick();GRIDIRON_DEBUG.step(131)')
  for i in range(40):
   b=state();page.evaluate('GRIDIRON_DEBUG.step(1)');a=state()
   for key in ('RB','WR2'):
    before=next(p for p in b['players'] if p['key']==key);after=next(p for p in a['players'] if p['key']==key)
    assert ((after['x']-before['x'])**2+(after['y']-before['y'])**2)**.5<5.5,(w,i,key,round(before['x'],2),round(before['y'],2),round(after['x'],2),round(after['y'],2))
  # Real safety: not on crossing but only when actually tackled or out
  page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss();GRIDIRON_DEBUG.startKick();GRIDIRON_DEBUG.step(350)")
  # use precise match-based setup in next test rather than relying on return phase
  print('SMOKE',w,game()['phase'],len(errors))
  assert not errors,errors
  page.close()
 browser.close()
print('PASS: staggered deep returners without scripted landing-position teleport; contact push remains for later tuning')
