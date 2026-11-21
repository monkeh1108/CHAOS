from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).parent/'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in [1120,390]:
  page=b.new_page(viewport={'width':width,'height':800});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  lab=page.locator('#contactPreset')
  assert lab.count()==1
  for name,allowed in [('miss',{'miss'}),('brush',{'miss','light contact'}),('wrap',{'miss','light contact','meaningful contact','potential tackle','guaranteed tackle'})]:
   lab.select_option(name)
   seen=set()
   for frame in range(91):
    page.locator('#contactTimeline').fill(str(frame))
    readout=page.locator('#contactReadout').inner_text()
    seen.add(readout.split('Contact classification: ')[1].split(' |')[0])
   assert seen<=allowed,(name,seen)
   if name=='wrap':assert 'guaranteed tackle' in seen,(name,seen)
   if name=='brush':assert 'light contact' in seen,(name,seen)
  page.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss('heads','receive');GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
  assert page.evaluate("GRIDIRON_DEBUG.getMatch().phase")=='live'
  result=page.evaluate("GRIDIRON_DEBUG.debugContactCategory('RB','MLB')")
  assert isinstance(result,dict) and 'kind' in result
  assert not errors,errors
  print('PASS',width,'five classifications, light brush, earned wrap, live API')
  page.close()
 b.close()
