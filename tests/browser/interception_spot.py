"""v0.35.3: interception spot is the defender's actual catch position, not snap spot."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
ARGS=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']

def test_interception(page, catch_x, kind, cpu_offense=True):
    page.evaluate("GRIDIRON_DEBUG.reset()")
    if cpu_offense: page.evaluate("GRIDIRON_DEBUG.debugDefensePresnap()")
    page.evaluate("GRIDIRON_DEBUG.debugSetSpot(26)")
    if cpu_offense: page.evaluate("GRIDIRON_DEBUG.snap(true)")
    else:
        page.evaluate("GRIDIRON_DEBUG.select('verticals');GRIDIRON_DEBUG.snap()")
    assert page.evaluate("GRIDIRON_DEBUG.getState().phase")=='live'
    player='FS' if kind=='ball' else 'CB1'
    ok = page.evaluate(f"() => {{GRIDIRON_DEBUG.debugMovePlayer('{player}', {catch_x}, 25);GRIDIRON_DEBUG.debugSetFlight({catch_x},25,1.2,1.0);return GRIDIRON_DEBUG.debugSecureInterception('{player}','{kind}');}}")
    assert ok is True, (page.evaluate("({phase:GRIDIRON_DEBUG.getState().phase,ball:GRIDIRON_DEBUG.getState().ball,fs:GRIDIRON_DEBUG.getState().players.find(p=>p.key==='FS')?.team})"),kind,catch_x)
    m=page.evaluate("GRIDIRON_DEBUG.getMatch()")
    s=page.evaluate("GRIDIRON_DEBUG.getState()")
    expected_yard=30 if catch_x>=110 else 120-catch_x
    assert abs(s['yard']-expected_yard)<.2,(catch_x,kind,m,s['yard'],expected_yard)
    assert m['possession']==(0 if cpu_offense else 1),m
    assert m['postWhistle']=='scrimmage',m
    assert 'Next drive: ' in page.locator('#resultDetail').inner_text(),page.locator('#resultDetail').inner_text()
    assert s['phase']=='dead',s['phase']
    page.evaluate("GRIDIRON_DEBUG.nextDown()")
    s=page.evaluate('GRIDIRON_DEBUG.getState()')
    assert abs(s['yard']-expected_yard)<.2,(kind,s['yard'],expected_yard)
    assert s['down']==1,(kind,s['down'])

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=ARGS)
 for width in [1120,390]:
    page=browser.new_page(viewport={'width':width,'height':844})
    page.clock.install()
    errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
    page.set_content(HTML,wait_until='load')
    for catch_x in [54,66,99,112]:
       for kind in ['ball','catch']:
           test_interception(page,catch_x,kind)
    test_interception(page,64,'ball',cpu_offense=False)
    assert not errors,errors
    print('PASS',width,'interception spot + both catch paths + touchback + possession + next down')
    page.close()
 browser.close()
print('PASS v0.35.3 interception field position')
