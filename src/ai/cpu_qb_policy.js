// V33: pure timing policy. Does not know about AI movement, coverage entities,
// or gamepad input. An elite DEC changes decisiveness, not instant telepathy.
export const CpuQBPolicy=Object.freeze({
  minimumSettle(play, dec, vision){
    const depth={verticals:2.35,sluggo:2.35,dagger:2.10,flood:1.80,smash:1.65,mesh:1.35,slants:1.20,stick:1.17};
    const base=depth[play]??1.55;
    return base+Math.max(-.18,Math.min(.36,(78-dec)*.012))+
      Math.max(-.07,Math.min(.18,(72-vision)*.003));
  },
  hasDeveloped(play,elapsed,routeProgress,pressure){
    const floor={verticals:12.5,sluggo:10.5,dagger:9.3,flood:7,smash:6,mesh:4,slants:3,stick:3}[play]??5;
    return routeProgress>=floor || (pressure>.87 && elapsed>1.05);
  },
  selectThreshold(dec,vision){return 6.6+Math.max(0,78-dec)*.17+Math.max(0,70-vision)*.08;},
  dangerLimit(vision){return Math.max(.40,Math.min(.88,.58+(vision-60)*.004));}
});
