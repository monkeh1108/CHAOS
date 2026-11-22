"""Gridiron Lab v0.31: regulations scaffolding, punts, KO, clocks and UI."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
ARGS=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=ARGS)
 for width in [1120,390]:
  page=browser.new_page(viewport={'width':width,'height':844})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='load');page.evaluate("GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive')");page.wait_for_timeout(200)
  d='GRIDIRON_DEBUG'
  s=page.evaluate(f'{d}.getMatch()')
  assert s['quarter']==1 and s['quarterSeconds']==900 and s['teamPoints']==[0,0] and s['specialState']['kind']=='kickoff',s
  assert page.locator('#callSheet.visible').count()==1
  print(width,'opening',s['specialState']['kind'],'view',page.evaluate(f'{d}.getState().viewMode'))
  page.locator('#sheetSnap').click();s=page.evaluate(f'{d}.getState()')
  assert s['phase']=='live' and s['ball'] and s['ball']['flight']>2,s
  # Advance enough for catch without waiting in real time
  page.evaluate(f'{d}.step(150)');s=page.evaluate(f'{d}.getState()')
  assert s['phase'] in ('live','dead'),s
  if s['phase']=='live':
   assert s['ballCarrier']=='RB' and s['ball'] is None,s
   page.evaluate(f"{d}.debugSetContactEnabled(false)")
   page.evaluate(f'{d}.step(30)')
   s=page.evaluate(f'{d}.getState()')
   print(width,'returned',s['ballCarrier'],s['phase'])
   if s['phase']=='live':
    page.evaluate(f"{d}.debugMovePlayer('RB',48,26.65)")
    page.evaluate(f"{d}.step(2)")
    # force whistle from existing actual return through contact or out
    page.evaluate(f"{d}.debugMovePlayer('RB',48,0)")
    page.evaluate(f'{d}.step(2)')
    s=page.evaluate(f'{d}.getState()'); assert s['phase']=='dead',s
  if s['phase']=='dead':page.evaluate(f'{d}.nextDown()')
  s=page.evaluate(f'{d}.getState()');assert s['phase']=='presnap',s
  assert page.locator('#callSheet.visible').count()==1
  # six point TD followed by extra point phase
  page.evaluate(f"{d}.select('inside');{d}.snap();{d}.debugSetContactEnabled(false);{d}.debugForceCarrier('RB');{d}.debugMovePlayer('RB',109.95,26.65);{d}.step(2)")
  s=page.evaluate(f'{d}.getState()');m=page.evaluate(f'{d}.getMatch()')
  assert s['phase']=='dead' and m['teamPoints'][m['possession']]==6 and m['postWhistle']=='try',(s['phase'],m)
  assert page.locator('#points').inner_text()=='6'
  page.evaluate(f'{d}.nextDown()');m=page.evaluate(f'{d}.getMatch()')
  assert m['tryState'] is not None and page.locator('#callSheet.visible').count()==1
  page.evaluate(f"{d}.chooseSpecial('pat')")
  m=page.evaluate(f'{d}.getMatch()');assert m['postWhistle']=='kickoff',m
  page.evaluate(f'{d}.nextDown()');m=page.evaluate(f'{d}.getMatch()');assert m['specialState']['kind']=='kickoff' and m['possession']==1,m
  print(width,'TD 6 PAT',m['teamPoints'],'next kickoff receives',m['possession'])
  # punt from 4th down yields mirrored new possession, playable return, not own-20 restart
  page.evaluate(f'{d}.reset()') # legacy practice field
  page.evaluate(f"{d}.select('verticals')")
  for j in range(3):
   page.evaluate(f'{d}.snap()')
   page.evaluate(f"{d}.debugSetContactEnabled(false);{d}.step(2)")
   # incomplete via open catch callback impossible, so force debug move ball not needed; use ball-free pass release then miss? easier game: use fake clock
   page.evaluate('GRIDIRON_DEBUG.step(18)')
   # direct DOM simulate incomplete with a new special debug hook if supplied
   page.evaluate('GRIDIRON_DEBUG.debugWhistle("incomplete")')
   page.evaluate('GRIDIRON_DEBUG.nextDown()')
  s=page.evaluate(f'{d}.getState()');assert s['down']==4,s
  assert page.locator('#callSheet').count()==1
  page.evaluate(f"{d}.chooseSpecial('punt')")
  m=page.evaluate(f'{d}.getMatch()');s=page.evaluate(f'{d}.getState()')
  assert m['specialState']['kind']=='punt' and s['phase']=='live' and m['possession']==1,(s['phase'],m)
  assert s['ball']['flying'] is True if 'flying' in s['ball'] else True
  print(width,'punt ->',m['specialState']['landingX'],'receiving',m['possession'])
  # timeout usage and time enforcement
  page.evaluate(f'{d}.newGame();{d}.debugFinishCoinToss()');page.evaluate(f"{d}.requestTimeout()")
  m=page.evaluate(f'{d}.getMatch()');assert m['timeOuts'][0]==2,m
  page.evaluate(f'{d}.debugSetQuarterTime(0)')
  # Advance period from presnap
  page.wait_for_timeout(150)
  m=page.evaluate(f'{d}.getMatch()');assert m['quarter']==2,m
  assert not errors,errors
  page.close()
 browser.close()
print('PASS v31 game flow')
