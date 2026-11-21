"""V33 deterministic browser integration tests; run after syntax & module unit tests."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
HTML=Path(__file__).with_name('index.html').read_text()
args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=args)
 for width in [1120,390]:
  page=browser.new_page(viewport={'width':width,'height':820})
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(HTML,wait_until='load')
  page.wait_for_timeout(90)
  D='GRIDIRON_DEBUG'
  state=lambda:page.evaluate(f'{D}.getState()')
  sheet=lambda:page.evaluate(f'{D}.getSheet()')
  assert len(sheet()['items'])==3, sheet()
  # Actual gamepad D-pad right, then A selects return right, X snaps.
  page.evaluate('''()=>{window.fakePad={connected:true,index:0,id:'Xbox One test',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.fakePad]});}''')
  def press(i):
   page.evaluate('(i)=>{window.fakePad.buttons[i]={pressed:true,value:1}}',i)
   page.wait_for_timeout(70)
   page.evaluate('(i)=>{window.fakePad.buttons[i]={pressed:false,value:0}}',i)
   page.wait_for_timeout(70)
  press(15) # Right D-pad
  assert sheet()['index']==1,sheet()
  press(15)
  assert sheet()['index']==2,sheet()
  press(0)
  assert page.evaluate(f'{D}.getMatch().returnCall')=='right',page.evaluate(f'{D}.getMatch()')
  press(2)
  assert state()['phase']=='live',(width,state()['phase'])
  # Stop synthetic gamepad influence and start the legacy practice sandbox.
  page.evaluate('''()=>{window.fakePad.connected=false; GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('verticals');GRIDIRON_DEBUG.selectControlMode('defense');GRIDIRON_DEBUG.snap();GRIDIRON_DEBUG.debugSetContactEnabled(false);}''')
  s=state();assert s['phase']=='live' and s['controlMode']=='defense'
  assert s['cpuQB']['passes']==0
  page.evaluate(f'{D}.step(45)')
  s=state();assert s['cpuQB']['passes']==0,(width,s['cpuQB'],s['playClock'])
  assert s['cpuQB']['reads']>0,(width,s['cpuQB'])
  # Manually move QB into a visible rollout and compare pass-rush aim.
  page.evaluate('''()=>{let d=GRIDIRON_DEBUG;let p=d.getState().players.find(x=>x.key==='QB');d.debugMovePlayer('QB',p.x,p.y+10);}''')
  aim=page.evaluate(f"{D}.debugRushTarget('EDGE2')")
  assert aim is not None and aim['mode']=='edge-crash',(width,aim)
  page.evaluate(f'{D}.step(4)')
  edge=next(p for p in state()['players'] if p['key']=='EDGE2')
  assert edge['intent']=='edge-crash',(width,edge['intent'])
  # After reset, independent defensive actions nearest/farthest to carrier.
  def attempt(button,delta):
   page.evaluate('''([button,delta])=>{let d=GRIDIRON_DEBUG;d.reset();d.selectControlMode('defense');d.select('inside');d.snap();d.debugSetContactEnabled(false);d.debugForceCarrier('RB');const q=d.getState().players.find(p=>p.key==='MLB'),r=d.getState().players.find(p=>p.key==='RB');d.debugMovePlayer('MLB',r.x+delta,r.y);d.defensiveFaceButton(button);}''',[button,delta])
   return next(p for p in state()['players'] if p['key']=='MLB')
  a=attempt('A',1.0);assert a['action']['kind']=='conservative',(width,a['action'])
  x=attempt('X',1.0);assert x['action']['kind']=='hit-stick',(width,x['action'])
  x=attempt('X',3.0);assert x['action']['kind']=='tackle-dive',(width,x['action'])
  # Navigate real offensive playbook with all six formation options.
  page.evaluate(f'{D}.reset()')
  page.locator('#playbookBtn').click()
  assert sheet()['open'] and len(sheet()['items'])>=13,(width,sheet())
  old=state()['formation'];page.evaluate(f'{D}.cycleSheetFormation(1)');new=state()['formation']
  assert new!=old,(width,old,new)
  page.evaluate(f"{D}.moveSheetFocus('right')")
  assert sum(1 for item in sheet()['items'] if item['focused'])==1
  assert not errors,(width,errors)
  print('PASS',width,'D-pad menu A select X snap, CPU timing, edge rollout, defensive A/X, formation LB/RB')
  page.close()
 browser.close()
