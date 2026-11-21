from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in [1120,390]:
  page=browser.new_page(viewport={'width':width,'height':850});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  # Offensive player momentarily behind own goal line is not by itself safety.
  result=page.evaluate('''() => {const g=GRIDIRON_DEBUG;
   g.reset();g.debugSetSpot(11,1);g.select('inside');g.snap();g.debugForceCarrier('RB');
   g.debugSetContactEnabled(false);g.debugMovePlayer('RB',9.5,26.65);g.step(4);
   return {match:g.getMatch(),state:g.getState()};}''')
  print('CROSS',width,result['match']['phase'],result['match']['teamPoints'],result['state']['ballCarrier'])
  assert result['match']['phase']=='live' and result['match']['teamPoints']==[0,0],result
  # Carrier being downed inside own end zone DOES cause safety and correct free kick.
  m=page.evaluate('''() => {const g=GRIDIRON_DEBUG;g.debugMovePlayer('RB',9.3,26.65);g.debugWhistle('down');return g.getMatch();}''')
  print('SAFETY',width,m['phase'],m['postWhistle'],m['teamPoints'])
  assert m['phase']=='dead' and m['postWhistle']=='safety-kick' and m['teamPoints']==[0,2],m
  m=page.evaluate('''() => {const g=GRIDIRON_DEBUG;g.nextDown();return g.getMatch();}''')
  print('FREE KICK',width,m['specialState'])
  assert m['specialState']['kind']=='safety-kick' and m['specialState']['kickingTeam']==0 and m['specialState']['receivingTeam']==1,m
  page.evaluate('''() => {const g=GRIDIRON_DEBUG;g.newGame();g.debugFinishCoinToss();g.debugSeed(137);g.startKick();g.debugMovePlayer('RB',90,12);g.debugMovePlayer('WR2',90,42)}''')
  page.evaluate('GRIDIRON_DEBUG.step(135)')
  m=page.evaluate('''() => {const g=GRIDIRON_DEBUG;return {match:g.getMatch(),state:g.getState()};}''')
  print('LOOSE',width,m['match']['phase'],m['match']['specialState'],m['state']['ball'])
  assert m['match']['specialState'] and not m['match']['specialState']['returning'],m
  assert m['match']['specialState']['landed'] and m['state']['ball'] is not None,m
  # Cover and return units should keep moving after the ball hits turf.
  pre={p['key']:p for p in m['state']['players'] if p['team']==1}
  page.evaluate('GRIDIRON_DEBUG.step(8)')
  after=page.evaluate('GRIDIRON_DEBUG.getState()')
  travel=[((p['x']-pre[p['key']]['x'])**2+(p['y']-pre[p['key']]['y'])**2)**.5 for p in after['players'] if p['key'] in pre]
  print('RELEASE',width,max(travel),sum(x>0.05 for x in travel))
  assert sum(x>0.05 for x in travel)>=3,(width,travel)
  assert not errors,errors
  page.close()
 browser.close()
print('PASS: own-goal-line safety distinction, free kick, loose-ball recovery, coverage release')
