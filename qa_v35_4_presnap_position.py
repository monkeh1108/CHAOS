"""V0.35.4: pre-snap defensive movement preserves coverage and never reveals offense routes."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
HTML=Path(__file__).with_name('index.html').read_text()
args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=args)
    for width in (1120,390):
        page=browser.new_page(viewport={'width':width,'height':844})
        errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(HTML,wait_until='load')
        page.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('verticals');GRIDIRON_DEBUG.debugDefensePresnap()")
        before=page.evaluate('GRIDIRON_DEBUG.getState()')
        assert before['phase']=='presnap' and before['controlMode']=='defense'
        assert before['players'] and len(before['players'])==22
        assert 'LEFT STICK MOVE' in page.locator('#inputStatus').inner_text()
        p0=next(p for p in before['players'] if p['key']=='FS')
        # Keyboard A is lateral movement on defense, not a user-controlled CPU snap.
        page.evaluate("() => {GRIDIRON_DEBUG.debugSetPlayClock(20);}")
        page.keyboard.down('a');page.wait_for_timeout(300);page.keyboard.up('a')
        assert page.evaluate('GRIDIRON_DEBUG.getState().phase')=='presnap'
        # Explicit deterministic simulated movement of the chosen safety.
        moved=page.evaluate(f'''() => GRIDIRON_DEBUG.debugPositionDefender('FS',{p0['x']+5},{p0['y']+6})''')
        assert moved
        after=page.evaluate('GRIDIRON_DEBUG.getState()')
        fs=next(p for p in after['players'] if p['key']=='FS')
        assert fs['x']>p0['x']+3 and fs['y']>p0['y']+3,(p0,fs)
        assert fs['assignment']['kind']==p0['assignment']['kind'],(p0,fs)
        assert fs['assignment']['tag']==p0['assignment']['tag'],(p0,fs)
        assert (fs['assignment']['baseX'],fs['assignment']['baseY']) != (p0['assignment']['baseX'],p0['assignment']['baseY'])
        assert after['play']==before['play'],(before['play'],after['play'])
        # No speed, stamina, or skill changes from moving pre-snap.
        assert abs(fs['stam']-p0['stam'])<.001
        # Don't cross the LOS, and don't leave the field.
        page.evaluate("GRIDIRON_DEBUG.debugPositionDefender('EDGE1',5,-8)")
        edge=next(p for p in page.evaluate('GRIDIRON_DEBUG.getState().players') if p['key']=='EDGE1')
        assert edge['x']>=after['yard']+.85-.02 and edge['y']>=1.1-.01,edge
        assert edge['rush'] and edge['assignment'] is None
        # Switching preserves prior placement and order controls.
        selected=page.evaluate('GRIDIRON_DEBUG.getDefensivePosition()')
        assert selected['key']=='EDGE1'
        page.evaluate('GRIDIRON_DEBUG.switchDefender()')
        assert page.evaluate('GRIDIRON_DEBUG.getDefensivePosition().key')!='EDGE1'
        assert abs(next(p for p in page.evaluate('GRIDIRON_DEBUG.getState().players') if p['key']=='FS')['y']-fs['y'])<.1
        # Defensive audible temporarily forbids movement; after it closes we can snap.
        assert page.evaluate('GRIDIRON_DEBUG.openAudibles()')
        q=page.evaluate('GRIDIRON_DEBUG.getState().players.find(p=>p.key===GRIDIRON_DEBUG.getDefensivePosition().key)')
        page.keyboard.down('ArrowRight');page.wait_for_timeout(160);page.keyboard.up('ArrowRight')
        q2=page.evaluate('GRIDIRON_DEBUG.getState().players.find(p=>p.key===GRIDIRON_DEBUG.getDefensivePosition().key)')
        assert abs(q['x']-q2['x'])<.02 and abs(q['y']-q2['y'])<.02,(q,q2)
        page.keyboard.press('Escape')
        page.evaluate("GRIDIRON_DEBUG.debugPositionDefender('FS',GRIDIRON_DEBUG.getState().players.find(p=>p.key==='FS').x,GRIDIRON_DEBUG.getState().players.find(p=>p.key==='FS').y)")
        page.evaluate('GRIDIRON_DEBUG.snap(true)')
        final=page.evaluate('GRIDIRON_DEBUG.getState()')
        assert final['phase']=='live'
        assert next(p for p in final['players'] if p['key']=='FS')['assignment']['tag']==fs['assignment']['tag']
        page.evaluate('GRIDIRON_DEBUG.step(45)')
        live_fs=next(p for p in page.evaluate('GRIDIRON_DEBUG.getState().players') if p['key']=='FS')
        assert live_fs['intent'] in ('cover-zone','cover-man','break-on-pass','break-on-ball'),live_fs['intent']
        assert not errors,errors
        print('PASS',width,'presnap move / live assignment / bounds / audibles / CPU snap')
        page.close()
    browser.close()
print('PASS v0.35.4')
