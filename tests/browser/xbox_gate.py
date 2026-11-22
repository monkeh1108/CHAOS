"""Xbox face-button integration for near/far defensive air-ball interaction."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[2] / 'index.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  for width in [1120,390]:
    page=browser.new_page(viewport={'width':width,'height':820});errs=[]
    page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content(html,wait_until='load')
    page.evaluate('''() => {
      window.fakePad={connected:true,index:0,id:'Xbox One fake',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
      Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[fakePad]});
      const g=GRIDIRON_DEBUG;
      g.debugFinishCoinToss();g.reset();g.select('mesh');g.selectControlMode('defense');g.snap();g.debugSetContactEnabled(false);
      g.debugMovePlayer(g.getState().selectedDefenderKey,25,10);g.debugSetFlight(88,23,4.2,2.2);
    }''')
    page.wait_for_timeout(90)
    page.evaluate('window.fakePad.buttons[2]={pressed:true,value:1}')
    page.wait_for_timeout(120)
    far=page.evaluate('''() => {const s=GRIDIRON_DEBUG.getState();return {air:s.airSelection.defense, action:s.players.find(p=>p.key===s.selectedDefenderKey).action?.kind,status:document.getElementById('inputStatus').textContent}}''')
    assert far['action']=='tackle-dive' and far['air'] is None,far
    page.evaluate('window.fakePad.buttons[2]={pressed:false,value:0}')
    page.wait_for_timeout(120)
    page.evaluate('''() => {const g=GRIDIRON_DEBUG;g.debugFinishCoinToss();g.reset();g.select('mesh');g.selectControlMode('defense');g.snap();g.debugSetContactEnabled(false);g.debugMovePlayer(g.getState().selectedDefenderKey,87,23);g.debugSetFlight(88,23,4.2,2.2);}''')
    page.wait_for_timeout(90)
    page.evaluate('window.fakePad.buttons[2]={pressed:true,value:1}')
    page.wait_for_timeout(120)
    near=page.evaluate('''() => {const s=GRIDIRON_DEBUG.getState();return {air:s.airSelection.defense, action:s.players.find(p=>p.key===s.selectedDefenderKey).action?.kind}}''')
    assert near['air']=='swat' and near['action']!='tackle-dive',near
    assert not errs,errs
    print(f'PASS controller {width}: far X dive, near X swat')
    page.close()
  browser.close()
