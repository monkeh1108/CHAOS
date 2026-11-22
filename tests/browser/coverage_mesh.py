"""Focused v0.34.9 browser regression: deep-threat selection and Mesh traffic."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':820})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  policy=page.evaluate('''() => {
   const deep={depth:19,baseX:49,baseY:8,width:16};
   const near={key:'short',x:47,y:8,vx:0,route:[[47,8]],routeComplete:false};
   const streak={key:'streak',x:74,y:9,vx:5,route:[[74,9],[85,9]],routeComplete:false};
   const threat=CoverageRoutePolicy.zoneThreat([near,streak],deep,30);
   const wr1={key:'WR1',x:43,y:26,vx:0,vy:5,AWR:75,RTE:82,route:[[50,35]],routeComplete:false};
   const wr2={key:'WR2',x:43.7,y:26.4,vx:0,vy:-5,AWR:75,RTE:82,route:[[50,16]],routeComplete:false};
   const avoid1=CoverageRoutePolicy.meshAvoidance(wr1,[wr1,wr2],'mesh');
   const avoid2=CoverageRoutePolicy.meshAvoidance(wr2,[wr1,wr2],'mesh');
   const none=CoverageRoutePolicy.meshAvoidance(wr1,[wr1,wr2],'verticals');
   return {threat:threat.key,avoid1,avoid2,none};
  }''')
  assert policy['threat']=='streak',(width,policy)
  assert policy['avoid1']['y']<0 and policy['avoid2']['y']>0,(width,policy)
  assert policy['none']=={'x':0,'y':0},(width,policy)
  # Ensure real match can run with both formerly problematic concepts.
  for play in ('verticals','mesh'):
   result=page.evaluate('''(play) => { const g=GRIDIRON_DEBUG;g.reset();g.select(play);g.selectControlMode('offense');g.snap();g.step(90);const s=g.getState();return {phase:s.phase,play:s.play,receivers:s.players.filter(p=>p.key==='WR1'||p.key==='WR2').map(p=>({key:p.key,routeIdx:p.routeIdx}))};}''',play)
   assert result['play']==play,(width,play,result)
  assert not errors,(width,errors)
  print('PASS',width,'deep threat selected; Mesh receivers separate; gameplay runs')
  page.close()
 browser.close()
