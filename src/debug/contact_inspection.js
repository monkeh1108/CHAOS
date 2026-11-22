import { ChaosContactOutcomes } from "../physics/contact_outcomes.js";

export function createContactInspection({
  ChaosContactEvidence,
  P,
  applyMotion,
  awardAirCatch,
  awardAirInterception,
  emitPresentation,
  interceptT,
  matchState,
  pileSupport,
  pursuitAim,
  recognizeRun,
  releaseTackle,
  resolveBlocks,
  resolvePileDrive,
  resolveTackles,
  setup,
  steer,
}) {
  return {
    debugForceGripEscape: (key = "MLB", recoverImmediately = false) => {
      const d = P(key),
        a = matchState.ballCarrier;
      if (!d || !a || !matchState.tackleLinks.has(key)) return false;
      releaseTackle(d, a, "escape", { effort: 0.5, kind: "break tackle" });
      if (recoverImmediately) {
        d.ground = null;
        d.stun = 0;
        d.diveRecovery = 0;
        d.tackleCooldown = 0;
      }
      return true;
    },
    debugEscapeReactions: () =>
      matchState.players
        .filter((p) => p.escapeReaction)
        .map((p) => ({
          key: p.key,
          ground: !!p.ground,
          kind: p.escapeReaction.kind,
          intensity: p.escapeReaction.intensity,
        })),
    debugEscapeContests: () =>
      [...matchState.tackleLinks.values()].map((t) => ({
        defender: t.defender,
        style: t.style,
        grip: t.grip,
        quality: t.quality,
        progress: t.escapeProgress || 0,
        drive: t.escapeDiagnostics || null,
      })),
    debugContactEvidence: () => ({
      events: ChaosContactEvidence.history(),
      lastAnatomyTackle: matchState.lastAnatomyTackle,
      lowDiveContacts: matchState.lowDiveContacts,
      lastLowDiveImpact: matchState.lastLowDiveImpact,
      footContacts: matchState.footContacts,
      lastFootContact: matchState.lastFootContact,
    }),
    debugContactCategory: (carrier, defender) => {
      const a = P(carrier),
        d = P(defender);
      return a && d
        ? ChaosContactOutcomes.evaluate(a, d, matchState.tackleLinks.get(d.key))
        : null;
    },
    debugTackleWatch: (enabled = true) => {
      matchState.tackleDiagnostics = enabled ? [] : null;
      matchState.carrierCollisionDiagnostics = enabled ? [] : null;
    },
    debugCarrierCollisionImpulses: () =>
      matchState.carrierCollisionDiagnostics?.slice() || [],
    debugTackleEligibility: () => matchState.tackleDiagnostics?.slice() || [],
    debugIndirectContact: () => {
      const event = matchState.ballCarrier?.lastIndirectContact;
      return event ? { ...event, chain: [...event.chain] } : null;
    },
    debugContactWatch: (all = false) => {
      ChaosContactEvidence.setEnabled(true);
      ChaosContactEvidence.setFullScan(all);
      return true;
    },
    debugContactReset: () => {
      ChaosContactEvidence.reset();
      matchState.lastAnatomyTackle = null;
      matchState.lowDiveContacts = 0;
      matchState.lastLowDiveImpact = null;
      matchState.footContacts = 0;
      matchState.lastFootContact = null;
      return true;
    },
    debugRecognize: (key) => {
      const d = P(key);
      return d ? recognizeRun(d) : false;
    },
    debugSecureInterception: (key, style = "ball") => {
      const d = P(key);
      if (
        matchState.phase !== "live" ||
        !matchState.ball?.flying ||
        !d ||
        d.team !== 1
      )
        return false;
      if (style === "catch") awardAirCatch(d, "possession", 1);
      else awardAirInterception(d);
      return true;
    },
    debugIntercept: (key, carrier = "RB") => {
      const d = P(key),
        a = P(carrier);
      return d && a
        ? { time: interceptT(d, a), aim: pursuitAim(d, a), role: d.fit?.role }
        : null;
    },
    debugMotionOnly: (n = 1) => {
      for (let i = 0; i < n; i++) applyMotion(1 / 60);
      return true;
    },
    debugSteer: (key, dx, dy, n = 1, boost = 1) => {
      const p = P(key);
      if (!p) return false;
      for (let i = 0; i < n; i++) {
        steer(p, dx, dy, 1 / 60, boost);
        p.x += p.vx / 60;
        p.y += p.vy / 60;
      }
      return true;
    },
    debugContactTackle: (carrier = "RB", keys = ["MLB"], n = 60) => {
      if (matchState.phase !== "live") return false;
      const a = P(carrier);
      if (!a) return false;
      matchState.ballCarrier = a;
      matchState.active = a;
      matchState.tackleLinks.clear();
      matchState.pileState = null;
      for (let i = 0; i < n && matchState.phase === "live"; i++)
        resolveTackles(a, 1 / 60);
      return true;
    },
    debugStartPile: (carrier = "RB", tacklers = ["MLB", "CB1"]) => {
      if (matchState.phase !== "live") return false;
      const a = P(carrier);
      if (!a) return false;
      matchState.ballCarrier = a;
      matchState.active = a;
      matchState.passThrown = true;
      matchState.tackleLinks.clear();
      for (const key of tacklers) {
        const d = P(key);
        if (!d) return false;
        matchState.tackleLinks.set(key, {
          defender: key,
          age: 0.28,
          grip: 0.5,
          initialImpulse: 110,
          advantage: 8,
        });
      }
      matchState.pileState = {
        active: true,
        carrier: a.key,
        startX: a.x,
        lastX: a.x,
        maxX: a.x,
        age: 0,
        stalled: 0,
        loose: 0,
        pushers: [],
        wrappers: tacklers,
      };
      matchState.pileStarts++;
      return true;
    },
    debugPileStep: (n = 1) => {
      if (matchState.phase !== "live" || !matchState.pileState) return false;
      for (let i = 0; i < n && matchState.phase === "live"; i++) {
        for (const o of matchState.off)
          if (o !== matchState.ballCarrier) {
            o.intent = "";
            if (
              ["LT", "LG", "C", "RG", "RT", "TE", "TE2", "FB"].includes(o.key)
            )
              pileSupport(o, matchState.ballCarrier, 1 / 60);
          }
        resolvePileDrive(1 / 60);
        applyMotion(1 / 60);
        resolveTackles(matchState.ballCarrier, 1 / 60);
      }
      return true;
    },
    debugResolveBlock: (n = 1) => {
      if (matchState.phase !== "live") return false;
      for (let i = 0; i < n; i++) resolveBlocks(1 / 60);
      return true;
    },
    setScheme: (formation, front, coverage, pressure) => {
      if (formation) matchState.selectedFormation = formation;
      if (front) matchState.selectedFront = front;
      if (coverage) matchState.coveragePreference = coverage;
      if (pressure) matchState.pressurePreference = pressure;
      for (const [id, v] of [
        ["formation", matchState.selectedFormation],
        ["front", matchState.selectedFront],
        ["coverage", matchState.coveragePreference],
        ["pressure", matchState.pressurePreference],
      ])
        emitPresentation({ type: "selectionChanged", key: id, value: v });
      setup();
    },
  };
}
