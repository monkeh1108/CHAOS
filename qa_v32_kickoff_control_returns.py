"""V32: physical kicker, return call versus kick accuracy, user-team switching,
coverage breaking blocks, CPU defensive playbook and team-specific play sheet."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, json
HTML=Path(__file__).with_name('index.html').read_text()
ARGS=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=ARGS)
 for width in [1120,390]:
  page=browser.new_page(viewport={'width':width,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='load')
  page.wait_for_timeout(120)
  d='GRIDIRON_DEBUG'
  get=lambda:page.evaluate(f'{d}.getMatch()')
  state=lambda:page.evaluate(f'{d}.getState()')
  assert get()['possession']==0 and get()['controlMode']=='offense'
  assert page.locator('[data-returncall]').count()==3
  assert page.locator('[data-kickaim]').count()==0
  kick_locations=[]
  for call in ('left','middle','right'):
   page.evaluate(f'{d}.newGame()')
   page.locator(f'[data-returncall="{call}"]').click()
   assert get()['returnCall']==call
   assert get()['specialState']['returnLaneY']=={'left':13.5,'middle':26.65,'right':39.8}[call],get()
   # identical seed, independent of call
   page.evaluate(f'{d}.debugSeed(91827)')
   page.locator('#sheetSnap').click()
   assert state()['phase']=='live'
   s=state();m=get()
   assert m['specialState']['targetY']>0
   assert m['specialState']['landingX']>0
   assert len(s['players'])==22
   k=[p for p in s['players'] if p['key']=='K'];assert len(k)==1 and abs(k[0]['x']-75)<.1,k
   kick_locations.append((m['specialState']['landingX'],m['specialState']['targetY']))
  assert len(set(kick_locations))==1,kick_locations
  # With kicking team unselected for catch, the cover unit holds until arrival.
  page.evaluate(f'{d}.newGame();{d}.debugSeed(412)')
  page.locator('[data-returncall="middle"]').click()
  page.locator('#sheetSnap').click()
  before=state();page.evaluate(f'{d}.step(75)');mid=state()
  if mid['phase']=='live':
   for p in before['players']:
    if p['team']==1 and p['key']!='K':
     other=next(i for i in mid['players'] if i['key']==p['key'])
     assert abs(other['x']-p['x'])<.01,(p['key'],other['x'],p['x'])
   assert mid['ball'] is not None
  page.evaluate(f'{d}.step(78)');aft=state()
  assert aft['phase'] in ('live','dead')
  # TD -> try -> opposing kickoff. "Away" receives and home controls the defense.
  page.evaluate(f'{d}.newGame();{d}.startKick();{d}.step(149)')
  if state()['phase']=='live':
   page.evaluate(f"{d}.debugSetContactEnabled(false);{d}.debugMovePlayer('RB',45,0);{d}.step(2)")
  if state()['phase']=='dead':page.evaluate(f'{d}.nextDown()')
  assert state()['phase']=='presnap',state()['phase']
  page.evaluate(f"{d}.select('inside');{d}.snap();{d}.debugSetContactEnabled(false);{d}.debugWhistle('touchdown')")
  assert get()['teamPoints']==[6,0],get()
  page.evaluate(f'{d}.nextDown()')
  page.evaluate(f"{d}.chooseSpecial('pat');{d}.nextDown()")
  m=get();assert m['possession']==1 and m['controlMode']=='defense' and m['specialState']['kind']=='kickoff',m
  assert page.locator('[data-returncall]').count()==0
  assert page.locator('[data-kickready]').count()==1
  assert page.locator('#inputStatus').inner_text()!=''
  page.evaluate(f'{d}.debugSeed(431);{d}.startKick();{d}.step(180)')
  # Force the return to finish with no touchdown, then user's defensive calls
  if state()['phase']=='live':
   page.evaluate(f"{d}.debugSetContactEnabled(false);{d}.debugMovePlayer('RB',34,0);{d}.step(2)")
  if state()['phase']=='dead':page.evaluate(f'{d}.nextDown()')
  m=get();s=state()
  assert m['possession']==1 and m['controlMode']=='defense',(m,s['phase'])
  assert page.locator('[data-defense-coverage]').count()==5
  assert page.locator('[data-defense-pressure]').count()==6
  assert 'Multiple & Power' in page.locator('#callSheetSub').inner_text()
  page.locator('[data-defense-pressure="spy"]').click()
  assert state()['pressure']=='spy',state()['pressure']
  page.locator('[data-defense-coverage="cover2"]').click()
  assert state()['coverage']=='cover2',state()['coverage']
  # CPU now owns the snap on defensive possessions; the player cannot snap it.
  assert page.locator('#snap').is_disabled()
  page.evaluate(f'{d}.snap()')
  assert state()['phase']=='presnap'
  page.wait_for_function("GRIDIRON_DEBUG.getState().phase !== 'presnap'",timeout=16000)
  assert state()['phase'] in ('live','dead')
  assert not errors,errors
  print('PASS',width,'return calls, kicker, kickoff control flip, defense play sheet')
  page.close()
 browser.close()
