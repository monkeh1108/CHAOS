from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for mode,button,expected in [('offense',2,'rac'),('offense',0,'possession'),('offense',3,'aggressive'),('defense',2,'swat'),('defense',0,'receiver'),('defense',3,'ball')]:
  p=b.new_page(); errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.set_content(html)
  p.evaluate('''([mode,btn])=>{const d=GRIDIRON_DEBUG;window.fakePad={connected:true,index:0,id:'Xbox One test',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.fakePad]});d.reset();d.selectControlMode(mode);d.select('mesh');d.snap();d.debugSetContactEnabled(false);d.debugSetFlight(102,49,4.2,2.2);window.fakePad.buttons[btn]={pressed:true,value:1};}''',[mode,button]);
  p.wait_for_timeout(95)
  result=p.evaluate('GRIDIRON_DEBUG.getState().airSelection')
  assert result[mode]==expected,(mode,button,result)
  assert not errors,errors
  print('PASS gamepad',mode,button,expected)
  p.close()
 b.close()
print('PASS all contextual Xbox ball-in-air face buttons')
