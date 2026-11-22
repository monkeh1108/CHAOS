def test_defensive_memory_live(browser_session, standalone_html):
    html=standalone_html
    with browser_session(headless=True, args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']) as browser:
     for width in (1120,390):
      page=browser.new_page(viewport={'width':width,'height':820})
      errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(html,wait_until='load')
      result=page.evaluate('''() => {
   const api=GRIDIRON_DEBUG;
   api.reset();let m0=api.getDefensiveMemory(0);
   api.select('verticals');let before=api.getDefensiveMemory(0).sampleSize;
   api.snap();let afterSnap=api.getDefensiveMemory(0).sampleSize;
   api.debugWhistle('incomplete');let afterWhistle=api.getDefensiveMemory(0);
   api.nextDown();api.select('inside');api.snap();api.debugWhistle('tackle');
   let afterRun=api.getDefensiveMemory(0);
   api.reset();let afterReset=api.getDefensiveMemory(0).sampleSize;
   return {before,afterSnap,afterWhistle,afterRun,afterReset};
  }''')
      assert result['before']==0,result
      assert result['afterSnap']==0,result
      assert result['afterWhistle']['counts']['pass']==1,result
      assert result['afterRun']['counts']['run']==1,result
      assert result['afterRun']['sampleSize']==2,result
      assert result['afterReset']==0,result
      assert not errors,errors
      print('PASS browser',width,result['afterRun']['counts'])
      page.close()
     browser.close()
