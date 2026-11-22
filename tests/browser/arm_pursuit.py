"""Focused v0.36.2 visual-state and close-contact pursuit regression."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[2] / 'index.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
        args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
    for width in (1120,390):
        page=browser.new_page(viewport={'width':width,'height':820})
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(html,wait_until='load')
        result=page.evaluate('''() => {
          const disengaged=AnimationPolicy.sample({intent:'rush',vx:3,vy:0,pos:'DE'},false,false);
          const engaged=AnimationPolicy.sample({intent:'rush',vx:0,vy:0,pos:'DE',blockMode:'drive'},true,false);
          const noPartner=AnimationPolicy.sample({intent:'rush',vx:0,vy:0,pos:'DE',blockMode:'drive'},false,false);
          GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap();
          GRIDIRON_DEBUG.debugForceCarrier('RB');GRIDIRON_DEBUG.debugSetContactEnabled(false);
          GRIDIRON_DEBUG.debugMovePlayer('RB',49,13);
          GRIDIRON_DEBUG.debugSetVelocity('RB',0,0);
          GRIDIRON_DEBUG.debugMovePlayer('CB1',51.5,13.1);
          GRIDIRON_DEBUG.debugSetVelocity('CB1',-.6,2.5);
          const before=GRIDIRON_DEBUG.getState().players;
          const get=p=>p.find(v=>v.key==='CB1');
          const d0=Math.hypot(get(before).x-49,get(before).y-13);
          GRIDIRON_DEBUG.step(20);
          const after=GRIDIRON_DEBUG.getState();
          const cb=get(after.players);
          return {disengaged,engaged,noPartner,d0,d1:Math.hypot(cb.x-49,cb.y-13),intent:cb.intent,phase:after.phase};
        }''')
        assert not result['disengaged']['brace'],result
        assert result['engaged']['blockArms'] and result['engaged']['blockMode']=='drive',result
        assert not result['noPartner']['blockArms'],result
        assert result['d1']<result['d0'] or result['phase']=='dead',result
        assert not errors,(width,errors)
        print('PASS',width,'real-contact arm pose, no running block-pose, corner closes',round(result['d0'],2),round(result['d1'],2))
        page.close()
    browser.close()
