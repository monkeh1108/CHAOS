"""v0.36.4 physical air-ball contest zone and one-motion defensive dives."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parents[2] / 'index.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  for width in (1120,390):
    page=b.new_page(viewport={'width':width,'height':820});errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load')
    result=page.evaluate('''() => {
       const g=GRIDIRON_DEBUG;
       const start=(key='FS',x=25,y=10)=>{
          g.reset();g.select('mesh');g.selectControlMode('defense');g.snap();
          g.debugSetContactEnabled(false);g.debugMovePlayer(key,x,y);
          g.debugSetFlight(88,23,4.2,2.2);
          return g.getState().selectedDefenderKey;
       };
       const selected=start();
       const farA=g.chooseAirAction('receiver'),farY=g.chooseAirAction('ball');
       const farX=g.chooseAirAction('swat');
       const dive=g.getState(),p=dive.players.find(p=>p.key===selected);
       const spam=g.chooseAirAction('swat');
       const startAir={...dive.airSelection};
       g.step(18);const progress=g.getState().players.find(p=>p.key===selected);
       g.step(16);const down=g.getState().players.find(p=>p.key===selected);
       g.step(37);const after=g.getState().players.find(p=>p.key===selected);
       const nearActions={};
       for(const style of ['swat','receiver','ball']){
          const who=start();g.debugMovePlayer(who,86.2,23.0);
          nearActions[style]={choice:g.chooseAirAction(style),selected:g.getState().airSelection.defense,action:g.getState().players.find(p=>p.key===who).action?.kind||null};
       }
       const nearCurrent=start();g.debugMovePlayer(nearCurrent,87.0,22.5);
       const swatNear=g.chooseAirAction('swat');
       g.reset();g.select('mesh');g.selectControlMode('offense');g.snap();g.debugSetContactEnabled(false);g.debugSetFlight(88,23,4.2,2.2);
       const offenseX=g.chooseAirAction('rac');
       return {selected,farA,farY,farX,spam,dive:p.action?.kind,progress:progress.action?.kind,
          downStage:down.ground?.stage||null,afterStage:after.ground?.stage||null,startAir,
          nearActions,swatNear,offenseX};
     }''')
    print('TEST', width, result)
    assert result['farA'] is False and result['farY'] is False
    assert result['farX'] is True and result['spam'] is False
    assert result['dive']=='tackle-dive' and result['progress']=='tackle-dive'
    assert result['startAir']['defense'] is None
    assert result['downStage'] in ('winded','rise')
    for style in ('swat','receiver','ball'):
      assert result['nearActions'][style]['choice'] is True
      assert result['nearActions'][style]['selected']==style
      assert result['nearActions'][style]['action'] is None
    assert result['swatNear'] is True and result['offenseX'] is True
    assert not errors,(width,errors)
    page.close()
  b.close()
print('PASS: far defenders cannot remotely swat/ball-hawk; X still dives and lands; near contests retained')
