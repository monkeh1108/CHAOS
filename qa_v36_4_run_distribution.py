"""Compare seeded Inside Zone run behavior to v0.36.3b and rating perturbations."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json,statistics,sys
baseline_path=Path(sys.argv[1]) if len(sys.argv)>1 else None
old=baseline_path.read_text() if baseline_path and baseline_path.exists() else None
new=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader'])
 all_scores={}
 for name,html in ([('before',old)] if old else [])+[('after',new)]:
  page=browser.new_page(viewport={'width':1120,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  result=page.evaluate('''() => {
   const g=GRIDIRON_DEBUG;
   g.debugFinishCoinToss();
   const run=(power)=>{
     const data=[];
     for(let i=0;i<24;i++){
      g.reset();
      if(power==='weak') for(const k of ['LT','LG','C','RG','RT']){g.custom[k].BLO=49;g.custom[k].IBL=49;g.custom[k].STR=55;g.custom[k].AWR=59;}
      g.debugSeed(100+i);g.select('inside');g.snap();g.step(500);
      const s=g.getState(),rb=s.players.find(x=>x.key==='RB');
      data.push({gain:rb.x-30,phase:s.phase});
     }
     return data;
   };
   const normal=run('normal');
   const weak=run('weak');
   return {normal,weak};
  }''')
  scores=[round(v['gain'],2) for v in result['normal']];w=[round(v['gain'],2) for v in result['weak']]
  print(name,'NORMAL',scores,'avg',round(statistics.mean(scores),2),'WEAK',w,'avg',round(statistics.mean(w),2),'diff',round(statistics.mean(scores)-statistics.mean(w),2),'errs',errors[:1],flush=True)
  assert not errors
  all_scores[name]={'mean':statistics.mean(scores),'weakMean':statistics.mean(w),'min':min(scores),'max':max(scores)}
  page.close()
 browser.close()
print('SCORES',json.dumps(all_scores))
if old: assert all_scores['after']['mean']>=all_scores['before']['mean']+1
assert all_scores['after']['weakMean']<all_scores['after']['mean']-0.1
assert all_scores['after']['max']>all_scores['after']['min']+1
print('PASS: Inside Zone moves forward more often, rating effects and play-to-play variation preserved')
