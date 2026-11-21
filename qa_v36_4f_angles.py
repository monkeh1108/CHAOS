from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for w in [1120,390]:
  p=b.new_page(viewport={'width':w,'height':800}); errs=[]
  p.on('pageerror',lambda e:errs.append(str(e)))
  p.set_content(html,wait_until='load')
  for sc in ['brush','miss','north','south','nw','ne','sw','se','east','west','leg']:
   p.locator('#contactPreset').select_option(sc)
   samples=p.evaluate('''() => {let out=[]; const slider=document.querySelector('#contactTimeline'); for(let i=0;i<=90;i++){slider.value=i; slider.dispatchEvent(new Event('input',{bubbles:true}));let text=document.querySelector('#contactReadout').textContent; if(/Overlap at current frame: [1-9]|Swept path: contact/.test(text))out.push({frame:i,text});}return out;}''')
   print(w,sc,'contact_frames',len(samples), 'first',samples[0]['frame'] if samples else '-')
   if sc=='miss':assert not samples,'miss scenario must stay clear'
   else:assert samples, f'{sc} should make some contact'
   if sc=='brush':
    # Brush is expected to be light, not torso-on-torso
    assert any(('arm' in x['text'].lower() or 'hand' in x['text'].lower()) for x in samples),'brush must include arm/hand region'
  assert not errs,errs
  p.close()
 b.close()
print('PASS all directional approaches, brush and wide miss')
