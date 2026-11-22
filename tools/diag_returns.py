from playwright.sync_api import sync_playwright
from pathlib import Path
import shutil
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 pg=b.new_page();pg.set_content((Path(__file__).resolve().parents[1] / 'index.html').read_text());pg.evaluate("GRIDIRON_DEBUG.newGame();GRIDIRON_DEBUG.debugFinishCoinToss();GRIDIRON_DEBUG.debugSeed(1462);GRIDIRON_DEBUG.startKick()")
 for n in [0,10,20,30,60,90,120,132,143,180,240,350,500,750]:
  pg.evaluate('GRIDIRON_DEBUG.step(%d)'%(n-int(pg.evaluate('GRIDIRON_DEBUG.getState().playClock*60')))) if n else None
  st=pg.evaluate('GRIDIRON_DEBUG.getState()');m=pg.evaluate('GRIDIRON_DEBUG.getMatch()'); ps={p['key']:p for p in st['players']};k=m['specialState'];ball=st['ball']
  print('n',n,'t',round(st['playClock'],2),'state',st['phase'], 'return',bool(k and k.get('returning')),'landed',bool(k and k.get('landed')), 'carrier',st['ballCarrier'], 'ret',k.get('returnerKey') if k else None,'ball',(round(ball['x'],1),round(ball['y'],1),round(ball['z'],1)) if ball else None,'rb',(round(ps['RB']['x'],1),round(ps['RB']['y'],1),round(ps['RB']['vx'],1),round(ps['RB']['vy'],1)),'wr',(round(ps['WR2']['x'],1),round(ps['WR2']['y'],1),round(ps['WR2']['vx'],1),round(ps['WR2']['vy'],1)))
 pg.close();b.close()
