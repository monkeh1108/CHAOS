import json


def test_protection_switch(browser_session, standalone_html):
    h=standalone_html
    args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
    with browser_session(headless=True, args=args) as b:
     for size in [1120,390]:
      page=b.new_page(viewport={'width':size,'height':844});errors=[];page.on('pageerror',lambda e: errors.append(str(e)));page.set_content(h)
      # stable dedicated blockers and pressure call each front
      for front in ['nickel','base43','base34']:
       for pressure in ['balanced','blitz','stunt']:
        snap=page.evaluate('''([f,pr])=>{let d=GRIDIRON_DEBUG;d.reset();d.setScheme('spread',f,'cover1',pr);d.select('verticals');d.snap();return d.getState();}''',[front,pressure])
        rush=[d for d in snap['players'] if d['rush']]
        assigned=[d for d in rush if d['passProtector']]
        assert len(assigned)==len(rush),(front,pressure,[(d['key'],d['passProtector']) for d in rush])
        assert len({d['passProtector'] for d in assigned})==len(assigned),(front,pressure)
        if front!='base34':
         assert {d['passProtector'] for d in assigned if d['key'] in ('EDGE1','EDGE2')}=={'LT','RT'},[(d['key'],d['passProtector']) for d in rush]
        state=page.evaluate('''()=>{let d=GRIDIRON_DEBUG;d.debugSetContactEnabled(true);d.step(72);return d.getState()}''')
        line={p['key']:p for p in state['players'] if p['key'] in ('LT','LG','C','RG','RT')}
        assert line['LT']['y']<line['C']['y']<line['RT']['y'],(front,pressure,[(k,round(p['y'],1)) for k,p in line.items()])
        # Protectors should not spontaneously trade sides.
        for d in rush:
         p=line.get(d['passProtector']);
         if p and d['key'] in ('EDGE1','EDGE2'):
          assert abs(p['y']-26.65)>1.2,(front,pressure,d['key'],p['y'])
        print('PASS',size,front,pressure,'blocks',len(state['contacts']['blocks']), 'QB', [(round(p['x'],1),round(p['y'],1)) for p in state['players'] if p['key']=='QB'])
      # B switch during pass, moving receiver when stick goes right.
      a=page.evaluate('''()=>{let d=GRIDIRON_DEBUG;d.reset();d.setScheme('spread','nickel','cover1','balanced');d.select('verticals');d.snap();d.debugSetContactEnabled(false);d.step(25);d.passTo(1,.21);return d.getState()}''')
      assert a['ball'] and a['target']=='WR2' and a['active']==None,a
      page.evaluate('''()=>{window.fakePad={connected:true,index:0,id:'Xbox One test',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.fakePad]});window.fakePad.buttons[1]={pressed:true,value:1};}''')
      page.wait_for_timeout(95)
      s=page.evaluate('GRIDIRON_DEBUG.getState()');assert s['manualReceiver'] and s['active']=='WR2',(size,s['active'],s['manualReceiver'])
      # Set a live airborne ball away from WR to keep play alive, directional control.
      page.evaluate('''()=>{window.fakePad.axes=[0.65,0,0,0];}''')
      before=next(p for p in s['players'] if p['key']=='WR2')
      page.wait_for_timeout(130)
      t=page.evaluate('GRIDIRON_DEBUG.getState()')
      after=next(p for p in t['players'] if p['key']=='WR2')
      if t['ball']: assert after['intent']=='user-receiver',(size,after['intent'],t['phase'])
      # Keyboard action on a separate pass.
      page.evaluate('''()=>{let d=GRIDIRON_DEBUG;d.reset();d.select('verticals');d.snap();d.debugSetContactEnabled(false);d.step(12);d.passTo(0,.24)}''')
      page.keyboard.press('b');s=page.evaluate('GRIDIRON_DEBUG.getState()');assert s['active']=='WR1' and s['manualReceiver'],(size,s['active'])
      assert not errors,errors
      print('PASS',size,'B gamepad/keyboard receiver switch + direction steering')
      page.close()
     b.close()
    print('PASS v28.1 pass-protection assignments and manual receiver switching')
