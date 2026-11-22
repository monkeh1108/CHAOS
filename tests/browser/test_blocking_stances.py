"""v0.36.1 blocking physics & pre-snap pose smoke tests. Does not modify game state outside the browser."""
from pathlib import Path


def test_blocking_stances(browser_session, standalone_html):
    ROOT=Path(__file__).parent
    HTML=standalone_html
    with browser_session(headless=False, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':844});errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(HTML,wait_until='load')
      values=page.evaluate('''() => {
   let sample=(pos,pre=true,contact=false)=>GRIDIRON_DEBUG.policies.AnimationPolicy.sample({pos,vx:0,vy:0},contact,pre);
   const roles=[['LT','three-point'],['EDGE','three-point'],['WR','receiver'],['QB','quarterback'],['RB','skill-ready'],['CB','coverage-ready'],['MLB','coverage-ready']];
   for(const [pos,expected] of roles){if(sample(pos).stance!==expected)throw Error(pos+' stance');if(sample(pos,false).stance!==null)throw Error(pos+' stays crouched in live play');}
   const engaged=GRIDIRON_DEBUG.policies.AnimationPolicy.sample({pos:'LT',blockMode:'drive',vx:0,vy:0},true,false);
   if(engaged.stance!==null||engaged.state!=='block-drive')throw Error('engaged stance');
   const strong={x:0,y:0,w:320,BLO:95,IBL:94,STR:95,AWR:90};
   const weak={x:1,y:0,w:190,STR:60,PMV:62,AGI:65,AWR:65};
   const result=BlockingPolicy.contact({blocker:strong,defender:weak,secured:.9,age:.6,runner:{x:5,y:0}});
   const opposite=BlockingPolicy.contact({blocker:weak,defender:{...strong,x:1},secured:.7,age:.6,runner:{x:5,y:0}});
   if(!(result.advantage>opposite.advantage))throw Error('ratings not influencing advantage');
   if(!Number.isFinite(result.strength)||result.strength<=0)throw Error('invalid block force');
   return {stances:roles.length,betterBlockerAdvantage:result.advantage,worseBlockerAdvantage:opposite.advantage,blockState:result.state};
  }''')
      page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.debugDefensePresnap()')
      page.wait_for_timeout(250)
      view=page.evaluate('GRIDIRON_DEBUG.getVisual()')
      assert view and view['presnapView'] and not errors,(view,errors)
      print('PASS',width,'roles / pre-snap only / contact override / blocking rating policy / render',values)
      page.close()
     browser.close()
    print('PASS v0.36.1 targeted visual and blocking decisions')
