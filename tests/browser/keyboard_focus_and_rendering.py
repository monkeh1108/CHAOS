"""Focused regression QA for latest user feedback, using real browser.
No physical controller testing is implied by these checks.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
HTML=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
ARGS=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=ARGS)
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='load');page.wait_for_timeout(150)
  d='GRIDIRON_DEBUG'
  # Boundary: a player can move into the back half of the end zone.
  page.evaluate(f"{d}.reset();{d}.debugSetSpot(11);{d}.select('verticals');{d}.snap();{d}.debugSetContactEnabled(false);{d}.debugMovePlayer('QB',3,26);{d}.debugSetVelocity('QB',-2,0);{d}.step(5)")
  qb=next(p for p in page.evaluate(f'{d}.getState().players') if p['key']=='QB')
  assert qb['x']<3,(width,qb['x'])
  # Air-switch selection is checked atomically so animation frames cannot end the play between calls.
  result=page.evaluate("""() => {
    const g=GRIDIRON_DEBUG;
    g.reset();g.debugDefensePresnap();g.snap();
    g.debugSetFlight(66,24,2,100);
    g.debugMovePlayer('CB1',65.5,24);g.debugMovePlayer('CB2',90,45);
    const before=g.getState(); const switched=g.switchDefender();const after=g.getState();
    return {before:before.selectedDefenderKey,after:after.selectedDefenderKey,switched,phase:after.phase};
  }""")
  assert result['switched'] and result['after']!=result['before'],(width,result)
  # Sack: check that eligible QB tackle contact can end a passing down.
  page.evaluate(f"{d}.reset();{d}.debugSetSpot(35);{d}.select('verticals');{d}.snap();{d}.debugSetContactEnabled(true)")
  st=page.evaluate(f'{d}.getState()');qb=next(p for p in st['players'] if p['key']=='QB')
  page.evaluate(f"{d}.debugMovePlayer('EDGE1',{qb['x']+.3},{qb['y']});{d}.debugSetVelocity('EDGE1',0,0)")
  page.evaluate(f'{d}.step(100)')
  aft=page.evaluate(f'{d}.getState()')
  assert aft['phase']=='dead' and any('QUARTERBACK SACK' in m for m in aft['logs']),(aft['phase'],aft['logs'][:3])
  assert not errors,errors
  print('PASS',width,'full endzone depth, airborne defender selection, QB sack and no browser exceptions')
  page.close()
 browser.close()
