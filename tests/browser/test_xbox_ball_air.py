def test_xbox_ball_air(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox']) as b:
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
