from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).resolve().parents[2] / 'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page()
 page.set_content(html,wait_until='load')
 page.evaluate('GRIDIRON_DEBUG.reset();GRIDIRON_DEBUG.select("verts");GRIDIRON_DEBUG.debugDefensePresnap();GRIDIRON_DEBUG.snap(true)')
 print('Play:',page.evaluate('GRIDIRON_DEBUG.getState().play'))
 state=page.evaluate('GRIDIRON_DEBUG.getState()')
 assert state['phase']=='live'
 qb=next(p for p in state['players'] if p['key']=='QB')
 # Let the safety reach the QB after the snap, with no hidden rush assignment.
 page.evaluate('(q)=>{GRIDIRON_DEBUG.debugMovePlayer("FS",q.x+0.55,q.y+0.1);GRIDIRON_DEBUG.debugSetVelocity("FS",-1.2,0)}',qb)
 page.evaluate('GRIDIRON_DEBUG.step(1)')
 result=page.evaluate('GRIDIRON_DEBUG.getState()')
 print('QB FS:',[(u['key'],u['x'],u['y'],u['blocked'],u['rush'],u['tackleCooldown']) for u in result['players'] if u['key'] in ('QB','FS')]); print('Phase:',result['phase'],'tackles:',result['contacts']['tackles'],'logs:',result['logs'][-5:])
 assert result['phase']!='live' or result['contacts']['tackles'] or any('wraps QB' in s for s in result['logs']), 'Unassigned safety did not start a tackle on QB'
 assert any('FS wraps' in s for s in result['logs']), 'Expected physical QB tackle feedback'
 for _ in range(55):
  if page.evaluate('GRIDIRON_DEBUG.getState().phase')!='live':break
  qb=page.evaluate('GRIDIRON_DEBUG.getState().players.find(p=>p.key==="QB")')
  page.evaluate('(q)=>{GRIDIRON_DEBUG.debugMovePlayer("FS",q.x+.48,q.y+.08); GRIDIRON_DEBUG.debugSetVelocity("FS",-1,0)}',qb)
  page.evaluate('GRIDIRON_DEBUG.step(1)')
 result=page.evaluate('GRIDIRON_DEBUG.getState()')
 print('After repeated close contact:',result['phase'],result['logs'][-6:])
 assert result['phase']!='live' and any('SACK' in t for t in result['logs']), 'Secure safety contact did not finish in a QB sack'
 b.close()
print('PASS: non-assigned safety is allowed to contact/tackle QB before throw')
