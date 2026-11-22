import { createBrowserPorts } from "./sim/browser_ports.js";
import { createMatchSystems } from "./sim/match_systems.js";
import { createMatchState } from "./sim/match_state.js";
import { createMatchCommands } from "./input/match_commands.js";
import { createGameDebug } from "./debug/game_debug.js";
import {
  H,
  G,
  YARD_M,
  MPS_TO_MPH,
  RUNS,
  PASS_ICONS,
  PRESNAP_PLAY_SECONDS,
  OFFENSE_AUDIBLES,
  QUARTER_DURATION_SECONDS,
  TEAM_NAMES,
  TEAM_STYLES,
} from "./sim/match_config.js";

import { runningSpeed } from "./core/tuning/movement.js";

import { clamp, distance2D as dist, hypot } from "./core/math.js";

import { createDefensiveMemory } from "./ai/defensive_memory.js";

import { createContactEvidence } from "./debug/contact_evidence.js";

import {
  captureMatchSnapshot,
  readMatchSnapshot,
} from "./sim/match_snapshot.js";

const TICK_SECONDS = 1 / 60;
const RANDOM_RANGE = 4294967296;

function nextRandomSequence(sequence) {
  return (Math.imul(1664525, sequence) + 1013904223) >>> 0;
}

export function createGame(
  { attach, onEvent, random = () => Math.random(), localTeam = 0 } = {},
  initialSeed,
) {
  if (localTeam !== 0 && localTeam !== 1)
    throw new RangeError("Invalid local team");
  const matchState = createMatchState(localTeam, initialSeed);
  const ChaosContactEvidence = createContactEvidence(
    () => matchState.contactEvidence,
  );
  const DefensiveMemory = createDefensiveMemory(
    () => matchState.defensiveMemory,
  );
  let tickEvents = null;

  function matchRandom() {
    if (matchState.bootstrapSequence === null) return random();
    matchState.bootstrapSequence = nextRandomSequence(
      matchState.bootstrapSequence,
    );
    return matchState.bootstrapSequence / RANDOM_RANGE;
  }

  function traceSample() {
    if (!matchState.playTrace.length && matchState.phase !== "live") return;
    const stick = stickInput();
    const sample = {
      t: +matchState.playClock.toFixed(3),
      ballCarrier: matchState.ballCarrier?.key || null,
      phase: matchState.phase,
      manual: matchState.manualDrive,
      stick: [+stick.x.toFixed(2), +stick.y.toFixed(2)],
      sprint: sprintHeld(),
      burst: +matchState.burstTime.toFixed(2),
      contacts: {
        tackles: matchState.tackleCount,
        hitSticks: matchState.hitStickCount,
        piles: matchState.pileStarts,
      },
      p: matchState.players.map((p) => [
        p.key,
        +p.x.toFixed(2),
        +p.y.toFixed(2),
        +p.vx.toFixed(2),
        +p.vy.toFixed(2),
        +p.stam.toFixed(3),
        p.intent,
        p.sprinting ? 1 : 0,
        p.runRead ? 1 : 0,
        p.routeIdx,
        p.ground?.stage || "",
      ]),
    };
    matchState.playTrace.push(sample);
    if (matchState.playTrace.length > 1200) matchState.playTrace.shift();
  }

  function clockText(seconds) {
    const t = Math.max(0, Math.ceil(seconds));
    return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  }
  function spotText(y = matchState.yard) {
    return y < 60 ? "OWN " + Math.round(y - 10) : "OPP " + Math.round(110 - y);
  }

  function setResultUI(heading, detail, action = "NEXT PLAY") {
    matchState.result = heading;
    message("<strong>" + heading + ".</strong> " + detail);
    emitPresentation({ type: "resultShown", heading, detail, action });
    log(heading + " · " + detail);
  }

  function rand() {
    matchState.seq = nextRandomSequence(matchState.seq);
    return matchState.seq / RANDOM_RANGE;
  }
  function seed(v) {
    matchState.seq = v >>> 0;
  }
  function speed(p) {
    return hypot(p.vx, p.vy);
  }
  function mass(p) {
    return p.w * 0.45359237;
  }
  function maxSpeed(p) {
    // Exhaustion costs real separation; fatigue never reduces speed below a believable jog.
    const energy = clamp(p.stam ?? 1, 0, 1);
    // A rested player retains their rated ceiling. Below 35% energy,
    // running speed gradually declines; exhausted athletes are slower without
    // receiving an artificial catch-up boost or violating their SPD hard cap.
    const fatigue = clamp(
      (runningSpeed.fatigueStaminaThreshold - energy) /
        runningSpeed.fatigueStaminaThreshold,
      0,
      1,
    );
    return (
      (runningSpeed.baseYardsPerSecond +
        (p.SPD - runningSpeed.baseRating) *
          runningSpeed.yardsPerSecondPerRating) *
      (1 -
        runningSpeed.maximumFatiguePenalty *
          Math.pow(fatigue, runningSpeed.fatigueExponent))
    );
  }
  function acceleration(p) {
    return (3.1 + (p.ACC - 55) * 0.055) * Math.pow(100 / mass(p), 0.17);
  } // yd/s²
  function takeoffTier(p) {
    // Responsiveness tiers are *not* instant starting velocities or substitutes
    // for SPD/ACC. They describe how strongly the first running steps launch.
    // Fast skill positions: ~70; second-level defenders: low-to-mid 60s;
    // big front-seven players: mid-50s; offensive/defensive interiors: ~50.
    const tiers = {
      WR: 71,
      RB: 71,
      CB: 72,
      FS: 70,
      SS: 69,
      MLB: 65,
      OLB: 66,
      QB: 64,
      TE: 61,
      FB: 60,
      EDGE: 59,
      DE: 57,
      DT: 52,
      NT: 49,
      LT: 50,
      LG: 51,
      C: 51,
      RG: 51,
      RT: 50,
    };
    return tiers[p.pos] ?? 58;
  }
  function launchAssist(p, speedFraction) {
    // Strong first three steps that fade before cruising speed. ACC determines
    // actual acceleration, mass still matters, and speed is capped downstream.
    // Crucially no instant speed teleport on the first frame or repeated boost
    // when a player is already running above the launch band.
    const tier = takeoffTier(p);
    const technique = clamp((p.ACC - 45) / 54, 0.2, 1);
    const strength = (0.12 + 0.025 * (tier - 50)) * (0.75 + 0.25 * technique);
    const fade = Math.pow(clamp((0.76 - speedFraction) / 0.76, 0, 1), 1.1);
    return 1 + strength * fade;
  }

  function radius(p) {
    return 0.34 + (p.w - 175) * 0.00058 + (p.h - 70) * 0.0025;
  }
  function catchReach(p) {
    return (
      (p.h * 0.0254 +
        0.28 +
        (p.JMP - 55) * 0.01 * Math.pow(95 / mass(p), 0.15)) /
      YARD_M
    );
  }
  function log(t) {
    matchState.logs.unshift(t);
    matchState.logs = matchState.logs.slice(0, 14);
    emitPresentation({ type: "logChanged", logs: matchState.logs });
  }
  function message(t) {
    matchState.msg = t;
    emitPresentation({ type: "messageChanged", text: t });
  }

  function stickInput() {
    return matchState.controls.move;
  }

  function closestThreat(p, filter) {
    let best = null,
      bd = 999;
    for (let d of filter) {
      let dd = dist(p, d);
      if (dd < bd) {
        bd = dd;
        best = d;
      }
    }
    return { p: best, d: bd };
  }

  function hud() {
    emitPresentation({ type: "hudChanged" });
  }

  function emitPresentation(event) {
    if (tickEvents) tickEvents.push(structuredClone(event));
    presentation?.emit(event);
    onEvent?.(event);
  }
  function refreshPauseUI() {
    presentation?.refreshPauseUI();
  }
  function getVisual() {
    return presentation?.getVisual() ?? null;
  }
  function getVisualMode() {
    return presentation?.getVisualMode() ?? "3d";
  }
  function setVisualMode(mode) {
    return presentation?.setVisualMode(mode) ?? mode;
  }
  const systems = createMatchSystems({
    ChaosContactEvidence,
    DefensiveMemory,
    G,
    H,
    MPS_TO_MPH,
    OFFENSE_AUDIBLES,
    PASS_ICONS,
    PRESNAP_PLAY_SECONDS,
    QUARTER_DURATION_SECONDS,
    RANDOM_RANGE,
    RUNS,
    TEAM_NAMES,
    TEAM_STYLES,
    YARD_M,
    acceleration,
    catchReach,
    closestThreat,
    dispatchInput,
    emitPresentation,
    hud,
    launchAssist,
    log,
    mass,
    matchRandom,
    matchState,
    maxSpeed,
    message,
    radius,
    rand,
    refreshPauseUI,
    seed,
    setResultUI,
    speed,
    spotText,
    stickInput,
    traceSample,
  });
  const {
    gameTick,
    positionSelectedDefender,
    sprintHeld,
    startNewMatch,
    tickGround,
    update,
  } = systems;

  const matchCommands = createMatchCommands(systems);
  function dispatchInput(command) {
    return matchCommands.dispatchInput(command);
  }

  const presentation = attach?.(createBrowserPorts({ ...systems, clockText }));
  startNewMatch();
  presentation?.startFrames();
  function snapshot() {
    return captureMatchSnapshot(matchState);
  }

  function restore(snapshot) {
    const restored = readMatchSnapshot(snapshot);
    if (
      !restored ||
      Object.getPrototypeOf(restored) !== Object.prototype ||
      Object.keys(restored).length !== Object.keys(matchState).length ||
      Object.keys(matchState).some((key) => !Object.hasOwn(restored, key))
    ) {
      throw new TypeError("Invalid CHAOS match state");
    }
    Object.assign(matchState, restored);
  }

  function advanceTick(commands) {
    for (const command of commands) matchCommands.validateInput(command);
    const events = [];
    tickEvents = events;
    try {
      for (const command of commands) dispatchInput(command);
      if (!matchState.paused) {
        if (matchState.phase === "dead") {
          for (const player of matchState.players) {
            if (player.ground?.kind === "tackle")
              tickGround(player, TICK_SECONDS);
          }
        }
        gameTick(TICK_SECONDS);
        if (matchState.phase === "live") update(TICK_SECONDS);
        if (matchState.phase === "presnap")
          positionSelectedDefender(TICK_SECONDS);
      }
    } finally {
      tickEvents = null;
    }
    return events;
  }

  const debugServices = {
    ...systems,
    TICK_SECONDS,
    advanceTick,
    getVisual,
    getVisualMode,
    presentation,
    restore,
    setVisualMode,
    snapshot,
  };
  const debug = { ...createGameDebug(debugServices) };
  return debug;
}

// Existing browser and debug adapters keep their established timing and controls.
export function step(game, inputCommands = []) {
  return { state: game, events: game.advanceTick(inputCommands) };
}

export function getSnapshot(game) {
  return game.captureSnapshot();
}

export function restoreSnapshot(game, snapshot) {
  game.restoreSnapshot(snapshot);
  return game;
}
