"""Regression: no unrestrained stopped-runner shove and deep safety confirmed-handoff read."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

html = Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    for width in (1120,390):
        page=browser.new_page(viewport={'width':width,'height':800})
        errors=[]
        page.on('pageerror',lambda exc: errors.append(str(exc)))
        page.set_content(html,wait_until='load')
        rear=page.evaluate('''()=>{
            const g=GRIDIRON_DEBUG;
            g.reset();g.select('stretch');g.snap();
            for(const p of g.getState().players){g.debugMovePlayer(p.key,p.team===0?16:108,p.team===0?2:48);g.debugSetVelocity(p.key,0,0)}
            g.debugForceCarrier('RB');g.debugMovePlayer('RB',80,26);g.debugSetVelocity('RB',0,0);
            ['MLB','SAM','WILL'].forEach((k,i)=>{
                g.debugMovePlayer(k,79.6-i*.10,26+(i-1)*.16);
                g.debugSetVelocity(k,2.1,0);
                g.debugSetDefenderState(k,{blocked:.5,shedCooldown:0,face:0,action:null});
            });
            let firstGrip=null;
            for(let i=0;i<150;i++){
                g.step(1); const s=g.getState();
                if(s.contacts.tackles.length&&!firstGrip)firstGrip=i;
                if(s.phase!=='live')return {phase:s.phase,position:s.players.find(p=>p.key==='RB').x,firstGrip,logs:s.logs.slice(0,5)};
            }
            return {phase:g.getState().phase,position:g.getState().players.find(p=>p.key==='RB').x,firstGrip,logs:g.getState().logs.slice(0,5)};
        }''')
        assert rear['phase']=='dead' and rear['firstGrip'] is not None and rear['position']<87,(width,rear)
        print('PASS rear blocked-stale contact',width,rear)
        safety=page.evaluate('''()=>{
            const g=GRIDIRON_DEBUG;
            g.reset();g.select('stretch');g.snap();
            for(const p of g.getState().players){g.debugMovePlayer(p.key,p.team===0?16:108,p.team===0?2:48);g.debugSetVelocity(p.key,0,0)}
            g.debugForceCarrier('RB');g.debugMovePlayer('RB',70,25);
            g.debugMovePlayer('FS',104,25);g.debugSetDefenderState('FS',{face:0,readAt:.4});
            g.debugMovePlayer('SS',105,28);g.debugSetDefenderState('SS',{face:0,readAt:.5});
            let firstFS=null,firstSS=null,early=false;
            for(let i=0;i<90;i++){
                g.step(1);
                g.debugSetDefenderState('FS',{face:0});g.debugSetDefenderState('SS',{face:0});
                const s=g.getState(),fs=s.players.find(p=>p.key==='FS'),ss=s.players.find(p=>p.key==='SS');
                if(i<21&&(fs.runRead||ss.runRead))early=true;
                if(fs.runRead&&firstFS===null)firstFS=i/60;
                if(ss.runRead&&firstSS===null)firstSS=i/60;
            }
            return {firstFS,firstSS,early};
        }''')
        assert not safety['early'] and safety['firstFS'] is not None and safety['firstSS'] is not None,(width,safety)
        assert safety['firstFS']>=.4 and safety['firstSS']>=.5,(width,safety)
        print('PASS confirmed-handoff read',width,safety)
        assert not errors,errors
        page.close()
    browser.close()
