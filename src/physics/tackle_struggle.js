// CHAOS: deterministic tackle struggle policy, driven by existing ratings,
// balance, momentum, technique, and contact quality. Not a new break-tackle roll.
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function state(runner,contacts,velocity){
  if(!contacts.length)return {drive:0,brakeMultiplier:1,finishDelay:0};
  const totalHold=contacts.reduce((n,c)=>n+Math.max(0,c.t.grip),0);
  const clean=contacts.some(c=>c.t.quality>=.96&&c.t.grip>.9);
  const avgQuality=contacts.reduce((n,c)=>n+(c.t.quality||.65),0)/contacts.length;
  const balance=clamp(runner.balance??1,0,1);
  const forward=Math.max(0,velocity);
  const power=clamp((runner.TRK*.58+runner.STR*.28+runner.AGI*.14-62)/35,0,1);
  const drive=clamp(power*balance*clamp(forward/5,0,1.0)*(1-clamp((totalHold-0.25)/3.0,0,.72)),0,1);
  const qualityPenalty=clamp((avgQuality-.6)/.7,0,1);
  // Good tackles still stop rapidly. Imperfect one-on-one holds can result
  // in more forward motion without making every tackle take longer.
  const brakeMultiplier=clamp(1-drive*.52*(1-qualityPenalty*.65),.54,1);
  const finishDelay=!clean&&contacts.length===1?drive*.52:0;
  return {drive,brakeMultiplier,finishDelay,clean,avgQuality};
 }
export const ChaosTackleStruggle = Object.freeze({state});
