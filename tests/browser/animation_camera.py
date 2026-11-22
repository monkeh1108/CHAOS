"""V0.35.5 modular animation states + 3D camera smoke; browser simulation only."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).parent
HTML=(root.resolve().parents[1] / 'index.html').read_text()
args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=False,args=args)
 for width in (1120,390):
  page=browser.new_page(viewport={'width':width,'height':844})
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(HTML,wait_until='load')
  policy=page.evaluate('''() => {
   const p={key:'RB',vx:0,vy:0,travel:0,animationFlavor:.5};
   const a=AnimationPolicy.sample;
   const still=a(p);
   const runner=a({...p,vx:7,travel:4,sprinting:true});
   const blocker=a({...p,intent:'block-right'},true);
   const juke=a({...p,action:{kind:'juke',time:.2,age:.2,side:1}});
   const hit=a({...p,action:{kind:'hit-stick',time:.2,age:.2}});
   const jump=a({...p,airPose:{kind:'aggressive',time:.2,age:.25}});
   const ground=a({...p,ground:{stage:'fall',age:.1}});
   const rise=a({...p,ground:{stage:'rise',time:.1}});
   const reverse=a({...p,action:{kind:'spin',time:.2,age:.2,side:-1}});
   return {states:[still.state,runner.state,blocker.state,juke.state,hit.state,jump.state,ground.state,rise.state,reverse.state],stride:runner.stride,brace:blocker.brace,jukeBank:juke.bank,spinYaw:reverse.yaw,impact:hit.impactAccent,finite:[still,runner,blocker,juke,hit,jump,ground,rise,reverse].every(x=>Object.values(x).filter(y=>typeof y==='number').every(Number.isFinite))};
  }''')
  assert policy['states']==['idle','sprint','engaged','juke','hit-stick','air-aggressive','knockdown','get-up','spin'],policy
  assert policy['stride']>0 and policy['brace'] and policy['jukeBank']>0 and policy['spinYaw']<0 and policy['impact']>0 and policy['finite'],policy
  page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select("verticals");GRIDIRON_DEBUG.debugDefensePresnap();')
  page.wait_for_timeout(950)
  state=page.evaluate('GRIDIRON_DEBUG.getState()'); cam=page.evaluate('GRIDIRON_DEBUG.getVisual()')
  assert state['phase']=='presnap' and state['controlMode']=='defense',state['phase']
  assert cam and cam['presnapView'] and cam['desiredZoom']==1.40 and cam['zoom']>.10,cam
  assert state['viewMode']=='3d',state['viewMode']
  page.screenshot(path=str(root/f'qa_v35_5_presnap_{width}.png'))
  page.evaluate('GRIDIRON_DEBUG.snap(true)')
  page.wait_for_function('GRIDIRON_DEBUG.getVisual()?.presnapView===false', timeout=12000)
  livecam=page.evaluate('GRIDIRON_DEBUG.getVisual()')
  assert livecam and not livecam['presnapView'] and livecam['desiredZoom']<=1,livecam
  assert not errors,errors
  print('PASS',width,'states / action poses / pre-snap wider zoom / live zoom / WebGL no errors',policy['states'])
  page.close()
 browser.close()
print('PASS v0.35.5 animation and camera')
