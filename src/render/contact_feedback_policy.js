'use strict';
// v0.36.4t. Presentation ONLY: no changes to forces, trip thresholds,
// action matchup odds, or possession/tackle resolution.
const ChaosContactFeedback=(()=>{
 function label({severity,balance,truckWon,tripped}){
  if(tripped)return 'TRIPPED';
  if(truckWon)return null; // a real TRUCK cue already describes this contact
  return severity>.45&&(balance<.78||severity>.72)?'STUMBLE':null;
 }
 return Object.freeze({label});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ChaosContactFeedback;
