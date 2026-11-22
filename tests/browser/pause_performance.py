"""Paused browser rendering should be low-resource without losing resume responsiveness."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
        args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader'])
    for width in (1120,390):
        page = browser.new_page(viewport={'width':width,'height':900})
        errors = []
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content((Path(__file__).resolve().parents[2] / 'index.html').read_text(),wait_until='load')
        page.evaluate('''() => {let original=CanvasRenderingContext2D.prototype.clearRect;
            window.__drawCount=0;
            CanvasRenderingContext2D.prototype.clearRect=function(...args){
                window.__drawCount++;return original.apply(this,args);
            };}''')
        page.evaluate('''() => {const g=GRIDIRON_DEBUG;
          g.debugFinishCoinToss();g.reset();g.select('inside');g.snap();}''')
        page.wait_for_timeout(1100)
        active=page.evaluate('''() => ({c:window.__drawCount,paused:GRIDIRON_DEBUG.getState().paused})''')
        page.evaluate("document.querySelector('#pause').click()")
        page.wait_for_timeout(1100)
        paused=page.evaluate('''() => ({c:window.__drawCount,paused:GRIDIRON_DEBUG.getState().paused})''')
        page.evaluate("document.querySelector('#pause').click()")
        page.wait_for_timeout(1100)
        resumed=page.evaluate('''() => ({c:window.__drawCount,paused:GRIDIRON_DEBUG.getState().paused})''')
        full=active['c'];idle=paused['c']-active['c'];awake=resumed['c']-paused['c']
        assert full>=18 and idle<=7 and awake>=18,(width,active,paused,resumed)
        assert not errors,errors
        print('PASS',width,{'draws_live_1.1s':full,'draws_paused_1.1s':idle,'draws_resumed_1.1s':awake})
        page.close()
    browser.close()
