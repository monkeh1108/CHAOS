import { clamp, distance2D as dist } from "../core/math.js";
import { specialTeams } from "../sim/special_teams.js";

export function createSpecialTeamsSetup() {
  let H,
    P,
    TEAM_NAMES,
    create,
    emitPresentation,
    hidePlaybook,
    hud,
    log,
    matchState,
    maxSpeed,
    message,
    rand,
    setDriveSpot,
    setResultUI,
    setup,
    showPlaybook;

  function kickRatings() {
    return matchState.custom.K;
  }

  function setupKickoff(receivingTeam, kind = "kickoff") {
    // A safety restarts with a free kick from the conceding team's own 20.
    // Unlike a fourth-down punt it uses the modern free-kick return formation.
    setDriveSpot(receivingTeam, 20);
    matchState.returnFairCatch = false;
    matchState.specialState = {
      kind,
      kickingTeam: 1 - receivingTeam,
      receivingTeam,
      landingX: 20,
      elapsed: 0,
      airtime: 2.2,
      returning: false,
      started: false,
      returnCall: matchState.returnCall,
      releaseReady: false,
    };
    matchState.tryState = null;
    matchState.clockRunning = false;
    matchState.playSeconds = 25;
    setup();
    organizeReturnUnit();
    emitPresentation({ type: "snapControlChanged", text: "KICK OFF" });
    message(
      "<strong>" +
        (kind === "safety-kick" ? "SAFETY FREE KICK" : "KICKOFF") +
        ".</strong> " +
        (matchState.possession === matchState.controllerTeams.local
          ? "Call RETURN LEFT, MIDDLE or RIGHT."
          : "Prepare coverage.") +
        " Kicker picks the actual placement.",
    );
    showPlaybook();
    hud();
  }

  function isFreeKick(k) {
    return k?.kind === "kickoff" || k?.kind === "safety-kick";
  }

  function kickLineX(k) {
    return k?.kind === "safety-kick" ? 90 : 75;
  }

  function organizeReturnUnit() {
    if (!matchState.specialState) return;
    const k = matchState.specialState,
      ret = P("RB"),
      back = P("WR2");
    const lane = specialTeams.returnLaneY(matchState.returnCall);
    k.returnCall = matchState.returnCall;
    k.returnLaneY = lane;
    // The 2026 return setup has at least nine receivers from own 30–35,
    // and up to two deep returners. Five are on the 35, four on the 30.
    const blockers = matchState.off.filter((o) => o !== ret && o !== back);
    blockers.forEach((p, i) => {
      p.x = isFreeKick(k) ? (i < 5 ? 45 : 40) : clamp(k.landingX + 13, 27, 64);
      p.y = i < 5 ? 5.0 + i * 10.75 : 10.1 + (i - 5) * 11.4;
      p.vx = 0;
      p.vy = 0;
      p.intent = "kick-return-align";
      p.intentTarget = "return-lane";
      p.returnSlot = i;
      p.returnAssignment = null;
    });
    // Two deep returners start in different lanes, rather than stacked vertically.
    // They are deliberately wider than the exact hash marks so either sideline
    // can be fielded without a supernatural catch-up adjustment.
    ret.x = isFreeKick(k) ? 21 : clamp(k.landingX + 3, 12, 42);
    ret.y = H * 0.32;
    ret.vx = 0;
    ret.vy = 0;
    ret.intent = "await-kick";
    back.x = isFreeKick(k) ? 21 : clamp(k.landingX + 3, 12, 42);
    back.y = H * 0.68;
    back.vx = 0;
    back.vy = 0;
    back.intent = "await-kick";
    k.returnerKey = ret.key;
    k.backupReturnerKey = back.key;
    k.landed = false;
    k.groundElapsed = 0;
    // Use an actual 11th coverage athlete as kicker instead of hiding the kick.
    const fs = P("FS");
    if (fs) {
      matchState.players.splice(matchState.players.indexOf(fs), 1);
      matchState.def.splice(matchState.def.indexOf(fs), 1);
    }
    let kicker = P("K");
    if (!kicker)
      kicker = create(
        "K",
        isFreeKick(k) ? kickLineX(k) : clamp(120 - k.puntFrom + 7, 35, 108),
        26.65,
      );
    kicker.intent = "kick-align";
    kicker.intentTarget = "ball";
    kicker.vx = 0;
    kicker.vy = 0;
    matchState.def
      .filter((d) => d !== kicker)
      .forEach((d, i) => {
        // In a dynamic kickoff the other ten covering athletes start at the
        // receiving team's 40, and cannot release until the landing event.
        d.x = k.kind === "punt" ? clamp(120 - k.puntFrom + 1, 34, 107) : 50;
        d.y = 3.2 + i * 5.2;
        d.vx = 0;
        d.vy = 0;
        d.intent = "kick-coverage";
        d.intentTarget = "returner";
        d.returnBypassBlocker = null;
        d.returnBypassUntil = 0;
      });
    matchState.ballCarrier = null;
    matchState.active =
      matchState.controlMode === "defense"
        ? P(matchState.selectedDefenderKey)
        : ret;
    matchState.ball = null;
    emitPresentation({ type: "receiverPromptsHidden" });
  }

  function chooseSpecial(kind) {
    if (matchState.phase !== "presnap" || matchState.matchOver) return false;
    if (kind === "pat" && matchState.tryState) {
      const chance = 0.94 + (kickRatings().KAC - 80) * 0.002;
      const good = rand() < clamp(chance, 0.65, 0.99);
      if (good) {
        matchState.teamPoints[matchState.possession] += 1;
        matchState.score = matchState.teamPoints[matchState.possession];
      }
      matchState.clockRunning = false;
      matchState.specialState = null;
      matchState.tryState = null;
      matchState.phase = "dead";
      matchState.postWhistle = "kickoff";
      setResultUI(
        good ? "PAT GOOD" : "PAT NO GOOD",
        good
          ? "Extra point +1 · 33-yard attempt"
          : "Extra point missed · no points",
        "KICKOFF",
      );
      hidePlaybook();
      hud();
      return true;
    }
    if (kind === "two" && matchState.tryState) {
      matchState.tryState.mode = "two";
      matchState.specialState = null;
      matchState.yard = 108;
      matchState.down = 1;
      matchState.togo = 2;
      matchState.first = 110;
      setup();
      matchState.playSeconds = 25;
      showPlaybook();
      return true;
    }
    if (kind === "punt" && matchState.down === 4 && !matchState.tryState) {
      return beginPunt();
    }
    if (kind === "fg" && matchState.down === 4 && !matchState.tryState) {
      const distance = Math.round(110 - matchState.yard + 17);
      const pct = clamp(
        0.97 - (distance - 32) * 0.017 + (kickRatings().KAC - 85) * 0.003,
        0.06,
        0.985,
      );
      const good =
        distance <= Math.round(42 + (kickRatings().KPW - 70) * 0.9) &&
        rand() < pct;
      const kickingTeam = matchState.possession;
      if (good) {
        matchState.teamPoints[kickingTeam] += 3;
        matchState.score = matchState.teamPoints[kickingTeam];
        matchState.postWhistle = "kickoff";
      } else {
        const spot = Math.max(30, 120 - (matchState.yard - 7));
        setDriveSpot(1 - kickingTeam, spot);
        matchState.postWhistle = "scrimmage";
      }
      matchState.phase = "dead";
      matchState.clockRunning = false;
      setResultUI(
        good ? "FIELD GOAL GOOD" : "FIELD GOAL NO GOOD",
        distance +
          "-yard attempt · " +
          (good ? "+3 points" : "possession changes"),
        good ? "KICKOFF" : "NEXT DRIVE",
      );
      hidePlaybook();
      hud();
      return true;
    }
    return false;
  }

  function beginPunt() {
    const oldSpot = matchState.yard,
      oldTeam = matchState.possession;
    const distance = clamp(
      35 + kickRatings().PUNT * 0.14 + (rand() - 0.5) * 15,
      32,
      58,
    );
    const landingOriginal = oldSpot + distance;
    const receives = 1 - oldTeam;
    const landing = 120 - Math.min(110, landingOriginal);
    setDriveSpot(receives, Math.max(11, landing));
    matchState.returnFairCatch = false;
    matchState.specialState = {
      kind: "punt",
      kickingTeam: oldTeam,
      receivingTeam: receives,
      landingX: landing,
      elapsed: 0,
      airtime: clamp(2.1 + distance * 0.035, 2.2, 4.0),
      returning: false,
      started: false,
      puntFrom: oldSpot,
      netDistance: distance,
    };
    setup();
    organizeReturnUnit();
    kickSpecial();
    return true;
  }

  function kickerLanding(k) {
    return specialTeams.kickerLanding({
      kind: k.kind,
      previousLandingX: k.landingX,
      accuracy: kickRatings().KAC,
      power: kickRatings().KPW,
      random: rand,
      fieldHeight: H,
    });
  }

  function kickSpecial() {
    if (!matchState.specialState || matchState.phase !== "presnap")
      return false;
    hidePlaybook();
    matchState.phase = "live";
    matchState.specialState.elapsed = 0;
    matchState.specialState.started = true;
    matchState.clockRunning = matchState.specialState.kind === "punt";
    const k = matchState.specialState,
      landing = kickerLanding(k);
    k.landingX = landing.x;
    k.targetY = landing.y;
    const sourceX = isFreeKick(k)
      ? kickLineX(k)
      : clamp(120 - k.puntFrom + 7, landing.x + 12, 109);
    const specialist = P("K");
    if (specialist) {
      specialist.x = sourceX;
      specialist.y = 26.65;
      specialist.action = { kind: "kick", time: 0.55, age: 0 };
      specialist.intent = "kick-foot";
    }
    const sourceY = 26.65;
    matchState.ball = {
      x: sourceX,
      y: sourceY,
      z: 1.0,
      vx: (landing.x - sourceX) / k.airtime,
      vy: (landing.y - sourceY) / k.airtime,
      vz: 0,
      flight: k.airtime,
      t: 0,
      aimX: landing.x,
      aimY: landing.y,
      flying: true,
    };
    // Select the athlete with the more feasible arrival time, not a preset RB.
    // Kick-flight anticipation is allowed; possession is NOT awarded remotely.
    const deep = [P("RB"), P("WR2")].filter(Boolean);
    const tArrival = (p) =>
      dist(p, landing) / Math.max(3, maxSpeed(p)) + (1 - p.ACC / 100) * 0.2;
    deep.sort((a, b) => tArrival(a) - tArrival(b));
    k.returnerKey = deep[0]?.key || "RB";
    k.backupReturnerKey = deep[1]?.key || "WR2";
    const ret = P(k.returnerKey);
    if (ret) ret.intent = "track-kick";
    emitPresentation({ type: "snapControlChanged", disabled: true });
    emitPresentation({ type: "receiverPromptsHidden" });
    message(
      "<strong>" +
        k.kind.toUpperCase() +
        "!</strong> " +
        specialist?.name +
        " kicks toward the receiving team.",
    );
    log(
      k.kind.toUpperCase() +
        " · " +
        TEAM_NAMES[k.kickingTeam] +
        " kicker " +
        specialist?.name +
        " · aiming near " +
        Math.round(k.landingX - 10) +
        " yard line",
    );
    hud();
    return true;
  }

  return {
    bind(services) {
      ({
        H,
        P,
        TEAM_NAMES,
        create,
        emitPresentation,
        hidePlaybook,
        hud,
        log,
        matchState,
        maxSpeed,
        message,
        rand,
        setDriveSpot,
        setResultUI,
        setup,
        showPlaybook,
      } = services);
    },
    kickRatings,
    setupKickoff,
    isFreeKick,
    kickLineX,
    organizeReturnUnit,
    chooseSpecial,
    kickSpecial,
  };
}
