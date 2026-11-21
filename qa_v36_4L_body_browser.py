from pathlib import Path
import shutil, math
from playwright.sync_api import sync_playwright
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 p=b.new_page(viewport={'width':1120,'height':850});errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.set_content(html,wait_until='load')
 p.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
 assert p.evaluate('GRIDIRON_DEBUG.getMatch().phase')=='live'
 p.evaluate('GRIDIRON_DEBUG.debugMovePlayer("RB",85,25);GRIDIRON_DEBUG.debugMovePlayer("MLB",85.2,25)')
 before=p.evaluate('''() => {let p=GRIDIRON_DEBUG.getState().players;let a=p.find(x=>x.key==='RB'), b=p.find(x=>x.key==='MLB');return Math.hypot(a.x-b.x,a.y-b.y)}''')
 p.evaluate('GRIDIRON_DEBUG.debugBodyContacts(1)')
 after=p.evaluate('''() => {let p=GRIDIRON_DEBUG.getState().players;let a=p.find(x=>x.key==='RB'), b=p.find(x=>x.key==='MLB');return Math.hypot(a.x-b.x,a.y-b.y)}''')
 assert after>before+.025, (before,after)
 # Repeated solver passes converge without exceeding normal pad-scale contact.
 p.evaluate('GRIDIRON_DEBUG.debugBodyContacts(2)')
 final=p.evaluate('''() => {let p=GRIDIRON_DEBUG.getState().players;let a=p.find(x=>x.key==='RB'), b=p.find(x=>x.key==='MLB');return Math.hypot(a.x-b.x,a.y-b.y)}''')
 assert final>=after
 print('PASS live body separation',before,after,final)
 assert not errors,errors
 b.close()
