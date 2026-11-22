"""v0.36.4v: actual browser-engine multi-defender rear-contact fixture."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

def scenario(page, n, gap=.80):
    page.evaluate("GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select('inside');GRIDIRON_DEBUG.snap()")
    page.evaluate('''args=>{
      const g=GRIDIRON_DEBUG,ks=g.getState().players.filter(p=>p.team===1).map(p=>p.key);
      for(const p of g.getState().players){g.debugMovePlayer(p.key,p.team===0?17:108,p.team===0?2:48);g.debugSetVelocity(p.key,0,0)}
      g.debugForceCarrier('RB');g.debugMovePlayer('RB',80,24);g.debugSetVelocity('RB',0,0);
      ks.forEach((k,i)=>{if(i<args.n){g.debugMovePlayer(k,80-args.gap-Math.floor(i/3)*.45,24+((i%3)-1)*.40);g.debugSetVelocity(k,3.1,0)}else g.debugMovePlayer(k,107,48+i*.5)});
    }''',{'n':n,'gap':gap})
    sample=[]
    for tick in range(240):
        if tick%6==0:
            s=page.evaluate('GRIDIRON_DEBUG.getState()')
            rb=next(p for p in s['players'] if p['key']=='RB')
            sample.append({'tick':tick,'phase':s['phase'],'x':round(rb['x'],2),'tacklers':len(s['contacts']['tackles']),'logs':s['logs'][:3]})
            if s['phase']!='live':break
        page.evaluate('GRIDIRON_DEBUG.step(1)')
    return sample

if __name__=='__main__':
    html=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        for width in (1120,390):
            page=browser.new_page(viewport={'width':width,'height':800});errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html,wait_until='load')
            for n in (6,11):
                records=scenario(page,n)
                finish=records[-1]
                assert finish['phase']=='dead' and finish['x']<85, (width,n,finish)
                assert any('tackle' in log.lower() or 'gang' in log.lower() for log in finish['logs']), (width,n,finish)
                print('PASS',width,n,'rear defenders ->',finish)
            single=scenario(page,1)
            # One initially weak rear contact must not become a magic first-frame takedown.
            assert len(single)>2 and single[1]['phase']=='live',(width,single[:3])
            print('PASS',width,'single defender retains a live break/drag contest')
            assert not errors,errors
            page.close()
        browser.close()
