"""Browser smoke for CHAOS q, headless Chromium both desktop and mobile."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=shutil.which('chromium'), headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
    for width in (1120,390):
        page=b.new_page(viewport={'width':width,'height':800})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
        assert page.evaluate("GRIDIRON_DEBUG.getMatch().phase")=='live'
        page.evaluate("GRIDIRON_DEBUG.debugSetContactEnabled(false)") # avoid regular wrap eating isolated foot fixture
        page.evaluate("GRIDIRON_DEBUG.debugFootScenario('RB','MLB','dive')")
        page.evaluate("GRIDIRON_DEBUG.debugMotionOnly(12)")
        low=page.evaluate("GRIDIRON_DEBUG.debugLowContact()")
        assert low['footContacts']>0,low
        print('foot',width,low)
        page.evaluate("GRIDIRON_DEBUG.debugFootScenario('RB','MLB','ground')")
        page.evaluate("GRIDIRON_DEBUG.debugMotionOnly(12)")
        low2=page.evaluate("GRIDIRON_DEBUG.debugLowContact()")
        assert low2['footContacts']>=low['footContacts'],low2
        # A Y hurdle is a real state, with physics-exposed clearance.
        page.evaluate("GRIDIRON_DEBUG.debugFootScenario('RB','MLB','dive')")
        assert page.evaluate("GRIDIRON_DEBUG.carrierMove('hurdle')")
        state=page.evaluate("GRIDIRON_DEBUG.getState()")
        rb=next(p for p in state['players'] if p['key']=='RB')
        assert rb['airState']['kind']=='hurdle',rb
        page.evaluate("GRIDIRON_DEBUG.debugMotionOnly(20)")
        h=page.evaluate("GRIDIRON_DEBUG.debugLowContact()")
        assert h['carrierAir'] and .25 < h['carrierAir']['elapsed'] < .60,h
        assert not errors,errors
        page.close()
    b.close()
print('PASS desktop/mobile live flight, contact and airborne state')
# A particularly hard, well-placed low hit can trip an upright runner.
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    p=b.new_page();p.set_content(html,wait_until='load')
    p.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap();GRIDIRON_DEBUG.debugSetContactEnabled(false);GRIDIRON_DEBUG.debugFootScenario('RB','MLB','dive')")
    p.evaluate('GRIDIRON_DEBUG.debugMovePlayer("MLB",70.3,26);GRIDIRON_DEBUG.debugSetVelocity("RB",7,0);GRIDIRON_DEBUG.debugSetVelocity("MLB",-10,0)')
    p.evaluate('GRIDIRON_DEBUG.debugSetBalance("RB",.28)')
    p.evaluate('GRIDIRON_DEBUG.debugMotionOnly(10)')
    event=p.evaluate('GRIDIRON_DEBUG.debugLowContact()')['lastFootContact']
    assert event and event['result']=='trip',event
    assert p.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='dead'
    assert any(x['ground'] and x['ground'].get('kind')=='trip' for x in p.evaluate('GRIDIRON_DEBUG.getState().players') if x['key']=='RB')
    print('PASS intense ankle impact creates a recorded trip and football whistle')
    p.close();b.close()
