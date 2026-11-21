from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':820})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  results=page.evaluate("""() => {
   const z={depth:19,baseX:54,baseY:26,width:16};
   const d={x:47,y:25,AWR:90,PRC:89};
   const r={key:'WR2',x:56,y:26,vx:6,vy:1,route:[[60,27]],routeComplete:false};
   const anticipation=CoverageRoutePolicy.deepIntercept(d,r,z,30);
   const stopped=CoverageRoutePolicy.deepIntercept(d,{...r,vx:0},z,30);
   const low=CoverageRoutePolicy.deepIntercept({...d,AWR:50,PRC:50},r,z,30);
   GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('verticals');GRIDIRON_DEBUG.selectControlMode('offense');GRIDIRON_DEBUG.snap();GRIDIRON_DEBUG.step(90);
   const state=GRIDIRON_DEBUG.getState();
   return {anticipation,stopped,low,phase:state.phase,play:state.play};
  }""")
  assert results['anticipation']['x']>59,results
  assert results['stopped'] is None,results
  assert results['anticipation']['x']>results['low']['x'],results
  assert results['play']=='verticals',results
  assert not errors,(width,errors)
  print('PASS',width,'moving vertical projected ahead; nonvertical not predicted; ratings matter; live play runs')
  page.close()
 browser.close()
