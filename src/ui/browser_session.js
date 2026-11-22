import { createPlaybookUi } from "./playbook.js";
import { createGameHud } from "../ui/game_hud.js";
import { clamp } from "../core/math.js";
import { createFieldRenderer } from "../render/field_renderer.js";

export function attachGameBrowser(session) {
  const $ = (id) => document.getElementById(id);
  const canvas = $("field");
  const playbook = createPlaybookUi(session);
  const { moveSheetFocus, chooseSheetFocused } = playbook;
  const {
    P,
    acceleration,
    applyAudible,
    audibleChoices,
    availableRunner,
    burst,
    carrierMove,
    catchReach,
    chooseAirAction,
    choosePlay,
    chooseSpecial,
    clockText,
    closeAudibles,
    closestThreat,
    cycleControlMode,
    cycleSheetFormation,
    defenderAirInteractionZone,
    defensiveFaceButton,
    defensiveStick,
    downSafe,
    eligibleTargets,
    evade,
    flightMarkers,
    gameTick,
    hidePlaybook,
    holdStiffArm,
    hud,
    isFreeKick,
    kickLineX,
    lineImpact,
    mass,
    maxSpeed,
    message,
    nextDown,
    openAudibles,
    organizeReturnUnit,
    passTo,
    positionSelectedDefender,
    protectBall,
    radius,
    receiverPromptTargets,
    releasePass,
    requestTimeout,
    reset,
    setup,
    showPlaybook,
    snap,
    speed,
    spotText,
    startNewMatch,
    startPass,
    startThirdQuarter,
    switchDefender,
    switchToIntendedReceiver,
    tickGround,
    update,
  } = session;
  function downloadTrace() {
    if (!session.playTrace.length || !session.lastTraceMeta) return;
    const payload = {
      format: "gridiron-lab-play-trace-v1",
      samplingHz: 10,
      description:
        "Own game simulation data only. No footage, files, or background screen capture.",
      ...session.lastTraceMeta,
      players: session.players.map((p) => ({
        key: p.key,
        name: p.name,
        pos: p.pos,
        team: p.team,
        h: p.h,
        w: p.w,
        SPD: p.SPD,
        ACC: p.ACC,
        STA: p.STA,
        PUR: p.PUR,
        PRC: p.PRC,
        COV: p.COV,
        RTE: p.RTE,
        CUT: p.CUT,
        DBL: p.DBL,
        REL: p.REL,
        HND: p.HND,
        PRS: p.PRS,
        JAM: p.JAM,
        MIR: p.MIR,
        RCR: p.RCR,
        DIS: p.DIS,
      })),
      samples: session.playTrace,
      events: session.logs,
    };
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    const uri = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = uri;
    a.download =
      "gridiron_play_trace_" +
      session.lastTraceMeta.play +
      "_" +
      Date.now() +
      ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(uri), 2500);
  }

  // Controllers are sampled once per animation frame (not on keydown).
  // Polling also discovers controllers already connected before the page loads.
  function deadZone(x, y, cutoff = 0.18) {
    const mag = Math.hypot(x, y);
    if (!Number.isFinite(mag) || mag <= cutoff) return { x: 0, y: 0 };
    const scaled = clamp((Math.min(1, mag) - cutoff) / (1 - cutoff), 0, 1);
    return { x: (x / mag) * scaled, y: (y / mag) * scaled };
  }
  function buttonValue(p, index) {
    const b = p?.buttons?.[index];
    return b ? Math.max(b.pressed ? 1 : 0, Number(b.value) || 0) : 0;
  }
  function refreshControllerStatus() {
    const el = $("controllerStatus");
    if (!el) return;
    const status = session.padState.connected
      ? "● " +
        (session.padState.standard
          ? /xbox|xinput|microsoft/i.test(session.padState.id)
            ? "XBOX ONE CONTROLLER CONNECTED"
            : "STANDARD GAMEPAD CONNECTED"
          : "CONTROLLER FOUND · UNSUPPORTED BUTTON MAP") +
        " · " +
        (session.padState.id || "Gamepad").slice(0, 66) +
        (session.padState.standard
          ? " · RT " + Math.round(session.padState.rt * 100) + "%"
          : "")
      : typeof navigator.getGamepads === "function"
        ? "○ Xbox One controller not detected · Connect via USB/Bluetooth, then press a button."
        : "○ This browser does not expose gamepad controls. Try Chrome or Edge.";
    if (status !== session.gamepadStatusLast) {
      el.textContent = status;
      el.classList.toggle(
        "detected",
        session.padState.connected && session.padState.standard,
      );
      el.classList.toggle(
        "unsupported",
        session.padState.connected && !session.padState.standard,
      );
      session.gamepadStatusLast = status;
    }
  }
  function refreshPauseUI() {
    const curtain = $("pauseCurtain");
    if (curtain) curtain.style.display = session.paused ? "grid" : "none";
    const btn = $("pause");
    if (btn) {
      btn.textContent = session.paused ? "RESUME" : "PAUSE";
      btn.disabled = session.phase !== "live";
    }
  }
  function togglePause() {
    if (session.phase !== "live") return false;
    session.paused = !session.paused;
    refreshPauseUI();
    hud();
    return session.paused;
  }
  function cyclePlay(delta) {
    if (
      session.phase !== "presnap" ||
      session.controlMode === "defense" ||
      session.scrimmagePlayCalled
    )
      return;
    const i = session.plays.indexOf(session.selectedPlay);
    choosePlay(
      session.plays[(i + delta + session.plays.length) % session.plays.length],
    );
  }
  function cycleScheme(kind, delta) {
    if (session.phase !== "presnap") return;
    const keys =
      kind === "formation"
        ? ["spread", "trips", "ace", "iform"]
        : ["mix", "cover1", "cover2", "cover3", "quarters"];
    const old =
      kind === "formation"
        ? session.selectedFormation
        : session.coveragePreference;
    const next = keys[(keys.indexOf(old) + delta + keys.length) % keys.length];
    if (kind === "formation") {
      session.selectedFormation = next;
      $("formation").value = next;
    } else {
      session.coveragePreference = next;
      $("coverage").value = next;
    }
    setup();
  }
  function clearPad() {
    protectBall(false);
    holdStiffArm(false);
    session.padState.connected = false;
    session.padState.standard = false;
    session.padState.index = -1;
    session.padState.id = "";
    session.padState.lx = 0;
    session.padState.ly = 0;
    session.padState.rx = 0;
    session.padState.ry = 0;
    session.padState.lt = 0;
    session.padState.rt = 0;
    session.padState.previous = [];
    session.rightStickLatched = false;
    session.rightStickDirection = "";
    session.queuedCarrierMove = null;
    session.xHoldStart = null;
    refreshControllerStatus();
  }
  function pollGamepad() {
    if (session.tossStage === "call" || session.tossStage === "decision") {
      // Coin toss is controller accessible without leaking pre-snap game inputs.
      let pads = [];
      try {
        pads = Array.from(navigator.getGamepads?.() || []);
      } catch (_) {}
      const pad = pads.find((p) => p?.connected && p.mapping === "standard");
      if (!pad) {
        session.tossPadPrevious = [];
        return;
      }
      const held = Array.from(
        { length: 4 },
        (_, i) => !!pad.buttons?.[i]?.pressed,
      );
      const chosen = held.findIndex((v, i) => v && !session.tossPadPrevious[i]);
      session.tossPadPrevious = held;
      if (chosen >= 0) {
        const options = Array.from(
          document.querySelectorAll("#coinTossOptions button"),
        );
        // A/B/X map in order to heads/tails or receive/kick/defer.
        if (options[chosen]) options[chosen].click();
      }
      return;
    }
    if (typeof navigator.getGamepads !== "function") {
      if (session.padState.connected) clearPad();
      else refreshControllerStatus();
      return;
    }
    let pads;
    try {
      pads = navigator.getGamepads() || [];
    } catch (e) {
      clearPad();
      return;
    }
    // Keep the selected Xbox controller while it remains connected; otherwise use
    // the first controller with a standard layout, preferably an Xbox device.
    let pad =
      session.padState.index >= 0 && pads[session.padState.index]?.connected
        ? pads[session.padState.index]
        : null;
    if (!pad) {
      const available = Array.from(pads)
        .filter(Boolean)
        .filter((p) => p.connected);
      pad =
        available.find(
          (p) =>
            p.mapping === "standard" && /xbox|xinput|microsoft/i.test(p.id),
        ) ||
        available.find((p) => p.mapping === "standard") ||
        available[0] ||
        null;
    }
    if (!pad) {
      if (session.padState.connected) clearPad();
      else refreshControllerStatus();
      return;
    }
    const standard = pad.mapping === "standard";
    if (
      pad.index !== session.padState.index ||
      pad.id !== session.padState.id ||
      standard !== session.padState.standard
    ) {
      session.padState.previous = [];
      session.padState.index = pad.index;
      session.padState.id = pad.id;
      session.padState.standard = standard;
    }
    session.padState.connected = true;
    if (!standard) {
      session.padState.lx = 0;
      session.padState.ly = 0;
      session.padState.rx = 0;
      session.padState.ry = 0;
      session.padState.lt = 0;
      session.padState.rt = 0;
      refreshControllerStatus();
      return;
    }
    const axis = deadZone(
      Number(pad.axes?.[0]) || 0,
      Number(pad.axes?.[1]) || 0,
    );
    session.padState.lx = axis.x;
    session.padState.ly = axis.y;
    session.padState.rx = Number(pad.axes?.[2]) || 0;
    session.padState.ry = Number(pad.axes?.[3]) || 0;
    session.padState.lt = buttonValue(pad, session.XBOX.LT);
    session.padState.rt = buttonValue(pad, session.XBOX.RT);
    // One action per actual button-down transition; never repeat a held pass or cut.
    const next = Array.from(
      { length: 16 },
      (_, i) => buttonValue(pad, i) > 0.5,
    );
    const was = session.padState.previous;
    const pressed = (i) => !!next[i] && !was[i];
    const released = (i) => !next[i] && !!was[i];
    session.padState.previous = next;
    if (session.phase === "halftime") {
      if (pressed(session.XBOX.A)) startThirdQuarter();
      refreshControllerStatus();
      return;
    }
    if (pressed(session.XBOX.MENU)) {
      togglePause();
      refreshControllerStatus();
      return;
    }
    if (session.paused) {
      refreshControllerStatus();
      return;
    }
    if (session.phase === "presnap") {
      if (session.audibleOpen) {
        for (const [button, index] of [
          [session.XBOX.A, 0],
          [session.XBOX.B, 1],
          [session.XBOX.X, 2],
          [session.XBOX.Y, 3],
        ])
          if (pressed(button)) {
            applyAudible(index);
            refreshControllerStatus();
            return;
          }
        if (pressed(session.XBOX.VIEW)) {
          closeAudibles();
          refreshControllerStatus();
          return;
        }
        refreshControllerStatus();
        return;
      }
      if (
        pressed(session.XBOX.X) &&
        !session.playbookOpen &&
        !session.specialState &&
        (!session.tryState || session.tryState.mode === "two")
      ) {
        openAudibles();
        refreshControllerStatus();
        return;
      }
      if (pressed(session.XBOX.VIEW)) {
        session.playbookOpen ? hidePlaybook() : showPlaybook();
        refreshControllerStatus();
        return;
      }
      if (
        session.controlMode === "defense" &&
        pressed(session.XBOX.B) &&
        !session.playbookOpen
      ) {
        switchDefender();
        refreshControllerStatus();
        return;
      }
      if (session.playbookOpen) {
        for (const [button, direction] of [
          [session.XBOX.UP, "up"],
          [session.XBOX.DOWN, "down"],
          [session.XBOX.LEFT, "left"],
          [session.XBOX.RIGHT, "right"],
        ])
          if (pressed(button)) moveSheetFocus(direction);
        if (pressed(session.XBOX.LB)) cycleSheetFormation(-1);
        if (pressed(session.XBOX.RB)) cycleSheetFormation(1);
        if (pressed(session.XBOX.A)) chooseSheetFocused();
        if (pressed(session.XBOX.X) && session.specialState) snap(); // Preserve existing kickoff controls; scrimmage X is reserved for audibles.
      } else {
        // Pre-snap D-pad never silently changes offensive calls.
        // Formation changes belong to the explicit playbook.
        if (pressed(session.XBOX.A)) snap();
      }
    } else if (session.phase === "dead") {
      if (pressed(session.XBOX.A)) nextDown();
    } else if (session.phase === "live") {
      if (
        session.specialState?.kind === "punt" &&
        session.ball?.flying &&
        pressed(session.XBOX.Y)
      )
        session.returnFairCatch = true;
      if (session.ball?.flying && !session.specialState) {
        if (pressed(session.XBOX.B)) {
          if (session.controlMode === "offense") switchToIntendedReceiver();
          else if (session.controlMode === "defense") switchDefender();
        }
        if (pressed(session.XBOX.X))
          chooseAirAction(session.controlMode === "offense" ? "rac" : "swat");
        if (pressed(session.XBOX.A))
          chooseAirAction(
            session.controlMode === "offense" ? "possession" : "receiver",
          );
        if (pressed(session.XBOX.Y))
          chooseAirAction(
            session.controlMode === "offense" ? "aggressive" : "ball",
          );
        // A held Y/A is not lost when it was pressed before this defender could
        // read or realistically reach the pass. Once eligible, queue it exactly
        // once, without repeated animations, popups, or remote catch attempts.
        if (session.controlMode === "defense") {
          const queuedHere =
            session.airSelection.defenderKey === session.selectedDefenderKey;
          if (
            next[session.XBOX.Y] &&
            (!queuedHere || session.airSelection.defense !== "ball") &&
            defenderAirInteractionZone(P(session.selectedDefenderKey))
          )
            chooseAirAction("ball", "held-gamepad");
          else if (
            next[session.XBOX.A] &&
            (!queuedHere || !session.airSelection.defense) &&
            defenderAirInteractionZone(P(session.selectedDefenderKey))
          )
            chooseAirAction("receiver", "held-gamepad");
        }
      }
      const qbMoveMode =
        !session.specialState &&
        session.padState.lt > 0.48 &&
        !session.RUNS.has(session.selectedPlay) &&
        !session.passThrown &&
        !session.ballCarrier;
      if (
        !session.specialState &&
        session.controlMode === "offense" &&
        !session.RUNS.has(session.selectedPlay) &&
        !session.passThrown &&
        !session.ballCarrier &&
        !qbMoveMode
      ) {
        for (const [btn, idx] of [
          [session.XBOX.X, 0],
          [session.XBOX.Y, 1],
          [session.XBOX.A, 2],
          [session.XBOX.B, 3],
        ]) {
          if (pressed(btn)) startPass(idx, "gamepad");
          if (
            released(btn) &&
            session.pendingPass?.source === "gamepad" &&
            session.pendingPass.index === idx
          )
            releasePass();
        }
      }
      if (
        session.controlMode === "offense" &&
        (session.ballCarrier?.team === 0 || qbMoveMode)
      ) {
        if (pressed(session.XBOX.B)) carrierMove("spin");
        if (pressed(session.XBOX.Y) && !session.specialState?.kind)
          carrierMove("hurdle");
        holdStiffArm(next[session.XBOX.A]);
        protectBall(next[session.XBOX.RB]);
        if (pressed(session.XBOX.X)) {
          session.xHoldStart = session.playClock;
          session.xDiveFired = false;
        }
        if (released(session.XBOX.X) && session.xHoldStart !== null) {
          if (!session.xDiveFired) downSafe();
          session.xHoldStart = null;
          session.xDiveFired = false;
        }
        if (pressed(session.XBOX.LB)) {
          session.manualDrive = false;
          session.suppressManualUntilNeutral = true;
          hud();
        }
      } else {
        holdStiffArm(false);
        protectBall(false);
        session.xHoldStart = null;
      }
      if (
        session.controlMode === "defense" &&
        pressed(session.XBOX.B) &&
        !session.ball?.flying
      )
        switchDefender();
      if (session.controlMode === "defense" && !session.ball?.flying) {
        const selected = P(session.selectedDefenderKey);
        if (selected) {
          selected.conservativeHeld = !!next[session.XBOX.A];
          if (next[session.XBOX.A])
            selected.conservativeUntil = session.playClock + 0.12;
        }
        if (pressed(session.XBOX.X)) defensiveFaceButton("X");
      }
      // Distinct flicks must be recognized even when the stick returns only
      // partway to center. Reversing left<->right also counts as a new flick.
      // Holding the same direction never auto-spams an action.
      const stickMag = Math.hypot(session.padState.rx, session.padState.ry);
      if (stickMag < 0.53) {
        session.rightStickLatched = false;
        session.rightStickDirection = "";
      } else if (stickMag > 0.68) {
        const horizontal =
          Math.abs(session.padState.rx) > Math.abs(session.padState.ry) * 1.12;
        const direction = horizontal
          ? session.padState.rx < 0
            ? "left"
            : "right"
          : session.padState.ry < 0
            ? "up"
            : "down";
        const opposite =
          (session.rightStickDirection === "left" && direction === "right") ||
          (session.rightStickDirection === "right" && direction === "left");
        if (!session.rightStickLatched || opposite) {
          session.rightStickLatched = true;
          session.rightStickDirection = direction;
          if (session.controlMode === "defense") {
            if (!horizontal)
              defensiveStick(direction === "up" ? "hit-stick" : "cut-stick");
          } else if (session.controlMode === "line") {
            if (direction === "up") lineImpact();
          } else if (session.ballCarrier?.team === 0 || qbMoveMode) {
            if (horizontal) carrierMove("juke", direction === "left" ? -1 : 1);
            else if (direction === "up") carrierMove("truck");
            else carrierMove("hesi");
          }
        }
      }
      if (session.controlMode === "offense" && pressed(session.XBOX.RT))
        burst();
    }
    refreshControllerStatus();
  }
  window.addEventListener("gamepadconnected", () => refreshControllerStatus());
  window.addEventListener("gamepaddisconnected", () => pollGamepad());
  function frame(timestamp) {
    if (!frame.prev) frame.prev = timestamp;
    let elapsed = Math.min((timestamp - frame.prev) / 1000, 0.05);
    frame.prev = timestamp;
    pollGamepad();

    if (session.phase === "dead" && !session.paused) {
      for (const p of session.players) {
        if (p.ground?.kind === "tackle") tickGround(p, elapsed);
      }
    }

    if (!session.paused) gameTick(elapsed);
    if (session.phase === "live" && !session.paused) {
      frame.acc = (frame.acc || 0) + elapsed;
      let cycles = 0;
      while (frame.acc >= 1 / 60 && cycles++ < 5 && session.phase === "live") {
        update(1 / 60);
        frame.acc -= 1 / 60;
      }
    } else {
      frame.acc = 0;
      if (session.flash > 0)
        session.flash = Math.max(0, session.flash - elapsed);
    }
    if (session.phase === "presnap" && !session.paused)
      positionSelectedDefender(elapsed);
    if (session.phase === "presnap") hud();
    // A paused game was still rendering its 3D field 60 times per second. That
    // kept the GPU busy while the user watched video in another browser window.
    // Keep controls responsive but reduce GPU uploads/draw calls while paused.
    if (
      !session.paused ||
      (!document.hidden && timestamp - (frame.lastIdleRender || 0) >= 350)
    ) {
      render();
      if (session.paused) frame.lastIdleRender = timestamp;
    }
    requestAnimationFrame(frame);
  }
  function summary() {
    const p = session.custom[$("athlete").value];
    $("physicsSummary").textContent =
      "Calculated: " +
      (
        maxSpeed({ ...p, stam: 1 }) *
        session.YARD_M *
        session.MPS_TO_MPH
      ).toFixed(1) +
      " mph top speed · " +
      (acceleration(p) * session.YARD_M).toFixed(2) +
      " m/s² initial drive · " +
      mass(p).toFixed(1) +
      " kg mass · " +
      (catchReach(p) * session.YARD_M).toFixed(2) +
      " m modeled catch reach. Burst changes acceleration and velocity, not just the display.";
  }
  function sliders() {
    const k = $("athlete").value,
      p = session.custom[k];
    $("meta").innerHTML =
      `<div><span>POSITION</span>${p.pos}</div><div><span>HEIGHT</span>${Math.floor(p.h / 12)}′${p.h % 12}″</div><div><span>WEIGHT</span>${p.w} lb</div>`;
    let list = [
      "SPD",
      "ACC",
      "AGI",
      "STR",
      "TRK",
      "TAK",
      "BLO",
      "CAT",
      "JMP",
      "AWR",
    ];
    if (k === "K") list = ["KPW", "KAC", "PUNT", "SPD", "ACC", "AGI", "AWR"];
    if (k === "QB")
      list = [
        "SPD",
        "ACC",
        "AGI",
        "THP",
        "THA",
        "TOR",
        "VIS",
        "DEC",
        "BSK",
        "AWR",
        "STR",
      ];
    if (k.startsWith("WR"))
      list = [
        "SPD",
        "ACC",
        "AGI",
        "JUK",
        "SFA",
        "CAT",
        "RTE",
        "CUT",
        "DBL",
        "REL",
        "HND",
        "STA",
      ];
    if (k.startsWith("CB"))
      list = ["SPD", "ACC", "AGI", "COV", "CAT", "JMP", "TAK"];
    if (k === "MLB" || k === "EDGE1")
      list = ["SPD", "ACC", "AGI", "STR", "TAK", "AWR", "COV"];
    if (k === "TE")
      list = [
        "SPD",
        "ACC",
        "STR",
        "BLO",
        "IBL",
        "CAT",
        "RTE",
        "CUT",
        "REL",
        "HND",
      ];
    if (k === "RB")
      list = ["SPD", "ACC", "AGI", "JUK", "SFA", "TRK", "STR", "CAT", "STA"];
    if (["LT", "LG", "C", "RG", "RT", "FB", "TE2"].includes(k))
      list = ["SPD", "ACC", "AGI", "STR", "BLO", "IBL", "AWR"];
    if (k === "MLB" || k === "EDGE1" || k === "NT" || k === "SAM")
      list = ["SPD", "ACC", "AGI", "TAK", "HIT", "PRC", "PUR", "STA", "AWR"];
    if (k.startsWith("CB"))
      list = [
        "SPD",
        "ACC",
        "AGI",
        "COV",
        "PRS",
        "JAM",
        "MIR",
        "RCR",
        "DIS",
        "PRC",
        "PUR",
        "STA",
      ];
    $("sliders").innerHTML =
      `<div class="sliderRow"><label>WEIGHT</label><input data-attr="w" type="range" min="155" max="365" step="5" value="${p.w}"><strong class="rating">${p.w}</strong></div><div class="sliderRow"><label>HEIGHT</label><input data-attr="h" type="range" min="65" max="82" step="1" value="${p.h}"><strong class="rating">${p.h}</strong></div>` +
      list
        .map(
          (a) =>
            `<div class="sliderRow"><label>${a}</label><input data-attr="${a}" type="range" min="30" max="99" step="1" value="${p[a]}"><strong class="rating">${p[a]}</strong></div>`,
        )
        .join("");
    $("sliders")
      .querySelectorAll("input")
      .forEach((inp) =>
        inp.addEventListener("input", () => {
          p[inp.dataset.attr] = Number(inp.value);
          inp.nextElementSibling.textContent = inp.value;
          summary();
          const live = P(k);
          if (live) live[inp.dataset.attr] = p[inp.dataset.attr];
          if (inp.dataset.attr === "h" || inp.dataset.attr === "w")
            $("meta").innerHTML =
              `<div><span>POSITION</span>${p.pos}</div><div><span>HEIGHT</span>${Math.floor(p.h / 12)}′${p.h % 12}″</div><div><span>WEIGHT</span>${p.w} lb</div>`;
        }),
      );
    summary();
  }
  function screenToField(e) {
    const r = canvas.getBoundingClientRect(),
      v = view();
    return {
      x: v.left + (e.clientX - r.left) / v.px,
      y: (e.clientY - r.top) / v.px,
    };
  }
  function useTap(e) {
    if (
      session.paused ||
      session.phase !== "live" ||
      session.RUNS.has(session.selectedPlay) ||
      session.passThrown
    )
      return;
    const at = screenToField(e),
      rec = eligibleTargets();
    let choices = rec
      .map((p, i) => ({ i, d: Math.hypot(p.x - at.x, p.y - at.y) }))
      .sort((a, b) => a.d - b.d);
    if (choices[0].d < 6) passTo(choices[0].i, 0.27);
  }
  function resizeStick(e) {
    const r = $("joystick").getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2),
      y = e.clientY - (r.top + r.height / 2),
      m = Math.hypot(x, y),
      max = r.width * 0.33;
    session.joystick.x = clamp(x / max, -1, 1);
    session.joystick.y = clamp(y / max, -1, 1);
    if (m > max) {
      session.joystick.x = x / m;
      session.joystick.y = y / m;
    }
    $("knob").style.transform =
      `translate(${session.joystick.x * max}px,${session.joystick.y * max}px)`;
  }
  $("joystick").addEventListener("pointerdown", (e) => {
    session.joystick.active = true;
    session.joystick.pointer = e.pointerId;
    $("joystick").setPointerCapture(e.pointerId);
    resizeStick(e);
    e.preventDefault();
  });
  $("joystick").addEventListener("pointermove", (e) => {
    if (session.joystick.active && e.pointerId === session.joystick.pointer) {
      resizeStick(e);
      e.preventDefault();
    }
  });
  function stickReset() {
    session.joystick.active = false;
    session.joystick.pointer = null;
    session.joystick.x = 0;
    session.joystick.y = 0;
    $("knob").style.transform = "translate(0,0)";
  }
  $("joystick").addEventListener("pointerup", stickReset);
  $("joystick").addEventListener("pointercancel", stickReset);
  function typingTarget(e) {
    return (
      ["INPUT", "SELECT", "TEXTAREA"].includes(e.target?.tagName) ||
      e.target?.isContentEditable
    );
  }
  window.addEventListener("keydown", (e) => {
    if (typingTarget(e)) return;
    const key = e.key.toLowerCase();
    if (key === "p") {
      togglePause();
      e.preventDefault();
      return;
    }
    if (
      key === "k" &&
      session.specialState?.kind === "punt" &&
      session.phase === "live" &&
      session.ball?.flying
    ) {
      session.returnFairCatch = true;
      message(
        "<strong>FAIR CATCH SIGNALED.</strong> Returner will down the punt at the catch point.",
      );
      e.preventDefault();
      return;
    }
    if (session.paused) {
      if ([" ", "shift", "enter"].includes(key)) e.preventDefault();
      return;
    }
    if (session.phase === "presnap" && session.audibleOpen) {
      if (["a", "b", "x", "y"].includes(key)) {
        applyAudible(["a", "b", "x", "y"].indexOf(key));
        e.preventDefault();
        return;
      }
      if (key === "escape") {
        closeAudibles();
        e.preventDefault();
        return;
      }
      return;
    }
    if (session.phase === "presnap" && key === "x" && !session.playbookOpen) {
      openAudibles();
      e.preventDefault();
      return;
    }
    if (
      session.phase === "presnap" &&
      key === "a" &&
      session.controlMode !== "defense" &&
      !session.playbookOpen
    ) {
      snap();
      e.preventDefault();
      return;
    }
    if (
      (session.phase === "live" ||
        (session.phase === "presnap" && session.controlMode === "defense")) &&
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
        "shift",
      ].includes(key)
    )
      e.preventDefault();
    session.keys[key] = true;
    if (e.repeat) return;
    if (["1", "2", "3", "4"].includes(key))
      startPass(Number(key) - 1, "keyboard");
    if (key === " ") evade();
    if (key === "t") carrierMove("truck");
    if (
      (key === "g" || key === "y") &&
      session.controlMode === "offense" &&
      availableRunner()
    )
      carrierMove("hurdle");
    if (key === "f" && !e.repeat) holdStiffArm(true);
    if (key === "b" && session.controlMode === "defense") switchDefender();
    if (
      key === "b" &&
      session.controlMode === "offense" &&
      session.ball?.flying
    )
      switchToIntendedReceiver();
    if (session.ball?.flying) {
      if (key === "j")
        chooseAirAction(
          session.controlMode === "offense" ? "rac" : "swat",
          "keyboard",
        );
      if (key === "k")
        chooseAirAction(
          session.controlMode === "offense" ? "possession" : "receiver",
          "keyboard",
        );
      if (key === "l")
        chooseAirAction(
          session.controlMode === "offense" ? "aggressive" : "ball",
          "keyboard",
        );
    }
    if (key === "v" && session.controlMode === "offense") carrierMove("spin");
    if (key === "c" && session.controlMode === "offense") protectBall(true);
    if (
      key === "x" &&
      session.controlMode === "offense" &&
      (session.ballCarrier || session.keys.alt)
    ) {
      session.xHoldStart = session.playClock;
      session.xDiveFired = false;
    }
    if (key === "q" && session.controlMode === "line") lineImpact();
    if (key === "z" && session.controlMode === "defense")
      defensiveFaceButton("A");
    if (key === "x" && session.controlMode === "defense") {
      if (session.ball?.flying) chooseAirAction("swat", "keyboard");
      else defensiveFaceButton("X");
    }
    if (key === "h" && session.controlMode === "defense")
      defensiveStick("hit-stick");
    if (key === "n" && session.controlMode === "defense")
      defensiveStick("cut-stick");
    if (key === "shift") burst();
    if (key === "r") reset();
    if (key === "enter") {
      session.phase === "halftime"
        ? startThirdQuarter()
        : session.phase === "dead"
          ? nextDown()
          : snap();
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    session.keys[key] = false;
    if (key === "c") protectBall(false);
    if (key === "f") holdStiffArm(false);
    if (key === "z" && session.controlMode === "defense") {
      const d = P(session.selectedDefenderKey);
      if (d) d.conservativeHeld = false;
    }
    if (key === "x" && session.xHoldStart !== null) {
      if (!session.xDiveFired) downSafe();
      session.xHoldStart = null;
      session.xDiveFired = false;
    }
    if (
      ["1", "2", "3", "4"].includes(key) &&
      session.pendingPass?.source === "keyboard" &&
      session.pendingPass.index === Number(key) - 1
    )
      releasePass();
  });
  window.addEventListener("blur", () => {
    for (const key of Object.keys(session.keys)) session.keys[key] = false;
    session.pendingPass = null;
    protectBall(false);
    holdStiffArm(false);
    session.xHoldStart = null;
    stickReset();
  });
  $("airActions")
    .querySelectorAll("button[data-air]")
    .forEach((b, i) =>
      b.addEventListener("click", () =>
        chooseAirAction(
          session.controlMode === "defense"
            ? ["swat", "receiver", "ball"][i]
            : ["rac", "possession", "aggressive"][i],
          "pointer",
        ),
      ),
    );
  $("audibleOptions").addEventListener("click", (e) => {
    const button = e.target.closest("[data-audible]");
    if (button) applyAudible(Number(button.dataset.audible));
  });
  $("audibleClose").addEventListener("click", closeAudibles);
  $("callSheet").addEventListener("click", (e) => {
    const ret = e.target.closest("[data-returncall]");
    if (ret) {
      session.returnCall = ret.dataset.returncall;
      organizeReturnUnit();
      showPlaybook();
      return;
    }
    const dc = e.target.closest("[data-defense-coverage]");
    if (dc && session.possession === 1 && session.phase === "presnap") {
      session.coveragePreference = dc.dataset.defenseCoverage;
      $("coverage").value = session.coveragePreference;
      const remaining = session.playSeconds,
        wasCalled = session.scrimmagePlayCalled;
      setup();
      session.playSeconds = remaining;
      session.scrimmagePlayCalled = wasCalled;
      showPlaybook();
      return;
    }
    const dp = e.target.closest("[data-defense-pressure]");
    if (dp && session.possession === 1 && session.phase === "presnap") {
      session.pressurePreference = dp.dataset.defensePressure;
      $("pressure").value = session.pressurePreference;
      const remaining = session.playSeconds,
        wasCalled = session.scrimmagePlayCalled;
      setup();
      session.playSeconds = remaining;
      session.scrimmagePlayCalled = wasCalled;
      showPlaybook();
      return;
    }
    const play = e.target.closest("[data-sheetplay]");
    if (play) {
      if (session.controlMode === "offense") choosePlay(play.dataset.sheetplay);
      return;
    }
    const special = e.target.closest("[data-special]");
    if (special) {
      chooseSpecial(special.dataset.special);
      return;
    }
  });
  $("closeSheet").addEventListener("click", hidePlaybook);
  $("sheetFormation").addEventListener("change", () => {
    if (session.phase !== "presnap" || session.specialState) return;
    session.selectedFormation = $("sheetFormation").value;
    $("formation").value = session.selectedFormation;
    setup();
    showPlaybook();
  });
  $("sheetSnap").addEventListener("click", () => {
    if (session.tryState && !session.tryState.mode) {
      showPlaybook();
      return;
    }
    snap();
  });
  $("playbookBtn").addEventListener("click", () =>
    session.phase === "presnap"
      ? session.playbookOpen
        ? hidePlaybook()
        : showPlaybook()
      : null,
  );
  $("timeoutBtn").addEventListener("click", requestTimeout);
  $("fairCatchBtn").addEventListener("click", () => {
    if (
      session.phase === "live" &&
      session.specialState?.kind === "punt" &&
      session.ball?.flying
    ) {
      session.returnFairCatch = true;
      message(
        "<strong>FAIR CATCH SIGNALED.</strong> The returner will down the punt.",
      );
    }
  });
  $("receiverSwitch").addEventListener("click", switchToIntendedReceiver);
  $("viewMode").addEventListener("click", () =>
    setVisualMode(getVisualMode() === "3d" ? "2d" : "3d"),
  );
  $("controlMode").addEventListener("click", cycleControlMode);
  $("jukeAction").addEventListener("click", () => carrierMove("juke"));
  $("truckAction").addEventListener("click", () => carrierMove("truck"));
  $("hurdleAction").addEventListener("click", () => carrierMove("hurdle"));
  $("stiffAction").addEventListener("pointerdown", (e) => {
    holdStiffArm(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  $("stiffAction").addEventListener("pointerup", () => holdStiffArm(false));
  $("stiffAction").addEventListener("pointercancel", () => holdStiffArm(false));
  $("pause").addEventListener("click", togglePause);
  $("boost").addEventListener("click", burst);
  $("dive").addEventListener("click", evade);
  $("snap").addEventListener("click", () =>
    session.phase === "halftime"
      ? startThirdQuarter()
      : session.phase === "dead"
        ? nextDown()
        : snap(),
  );
  $("autoRun").addEventListener("click", () => {
    if (session.phase === "live" && session.ballCarrier) {
      session.manualDrive = false;
      hud();
      canvas.focus({ preventScroll: true });
    }
  });
  $("reset").addEventListener("click", () => startNewMatch());
  $("downloadTrace").addEventListener("click", downloadTrace);
  $("athlete").addEventListener("change", sliders);
  for (let el of document.querySelectorAll("[data-play]"))
    el.addEventListener("click", () => choosePlay(el.dataset.play));
  for (const [id, key] of [
    ["formation", "formation"],
    ["front", "front"],
    ["coverage", "coverage"],
    ["pressure", "pressure"],
  ])
    $(id).addEventListener("change", () => {
      if (session.phase === "live") return;
      if (id === "formation") session.selectedFormation = $(id).value;
      if (id === "front") session.selectedFront = $(id).value;
      if (id === "coverage") session.coveragePreference = $(id).value;
      if (id === "pressure") session.pressurePreference = $(id).value;
      setup();
    });
  for (let el of document.querySelectorAll("[data-target]")) {
    el.addEventListener("pointerdown", (e) => {
      startPass(Number(el.dataset.target), "pointer");
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    });
    el.addEventListener("pointerup", () => {
      if (session.pendingPass?.source === "pointer") releasePass();
    });
    el.addEventListener("pointercancel", () => {
      if (session.pendingPass?.source === "pointer") session.pendingPass = null;
    });
    // Keyboard accessibility: Enter/Space activate a medium touch pass.
    el.addEventListener("click", (e) => {
      if (e.detail === 0) passTo(Number(el.dataset.target), 0.27);
    });
  }
  const emitHudEvent = createGameHud({
    readState: () => ({
      audibleOpen: session.audibleOpen,
      controlMode: session.controlMode,
      selectedFront: session.selectedFront,
      selectedFormation: session.selectedFormation,
      AUDIBLE_BUTTONS: session.AUDIBLE_BUTTONS,
      RUNS: session.RUNS,
      selectedPlay: session.selectedPlay,
      off: session.off,
      def: session.def,
      phase: session.phase,
      formationDesc: session.formationDesc,
      defenseDesc: session.defenseDesc,
      selectedCoverage: session.selectedCoverage,
      coveragePreference: session.coveragePreference,
      selectedPressure: session.selectedPressure,
      coverageDesc: session.coverageDesc,
      pressureDesc: session.pressureDesc,
      PASS_ICONS: session.PASS_ICONS,
      down: session.down,
      specialState: session.specialState,
      tryState: session.tryState,
      togo: session.togo,
      yard: session.yard,
      quarterSeconds: session.quarterSeconds,
      teamPoints: session.teamPoints,
      quarter: session.quarter,
      playSeconds: session.playSeconds,
      scrimmagePlayCalled: session.scrimmagePlayCalled,
      possession: session.possession,
      timeOuts: session.timeOuts,
      TEAM_NAMES: session.TEAM_NAMES,
      selectedDefenderKey: session.selectedDefenderKey,
      selectedLinemanKey: session.selectedLinemanKey,
      ballCarrier: session.ballCarrier,
      ball: session.ball,
      YARD_M: session.YARD_M,
      MPS_TO_MPH: session.MPS_TO_MPH,
      lastContact: session.lastContact,
      burstCool: session.burstCool,
      moveCooldown: session.moveCooldown,
      returnCall: session.returnCall,
      secondHalfReceiver: session.secondHalfReceiver,
      pendingPass: session.pendingPass,
      playClock: session.playClock,
      pileState: session.pileState,
      paused: session.paused,
      manualDrive: session.manualDrive,
      manualReceiver: session.manualReceiver,
      gameFlowNote: session.gameFlowNote,
    }),
    queries: {
      chooseCoinToss: session.chooseCoinToss,
      audibleChoices,
      eligibleTargets,
      clockText,
      spotText,
      P,
      speed,
      closestThreat,
      defenderAirInteractionZone,
    },
  });
  const fieldRenderer = createFieldRenderer({
    canvas,
    width: session.W,
    height: session.H,
    readState: () => ({
      ball: session.ball,
      ballCarrier: session.ballCarrier,
      active: session.active,
      phase: session.phase,
      specialState: session.specialState,
      playStart: session.playStart,
      first: session.first,
      def: session.def,
      controlMode: session.controlMode,
      selectedDefenderKey: session.selectedDefenderKey,
      off: session.off,
      gameStarted: session.gameStarted,
      intended: session.intended,
      possession: session.possession,
      totalClock: session.totalClock,
      pileState: session.pileState,
      tackleLinks: session.tackleLinks,
      burstTime: session.burstTime,
      players: session.players,
      blockLinks: session.blockLinks,
      passThrown: session.passThrown,
      shake: session.shake,
      flash: session.flash,
      selectedPlay: session.selectedPlay,
    }),
    queries: {
      P,
      isFreeKick,
      kickLineX,
      radius,
      speed,
      flightMarkers,
      receiverPromptTargets,
    },
  });
  const { resize, render, view, setVisualMode, getVisualMode, getVisual } =
    fieldRenderer;
  canvas.addEventListener("click", useTap);
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe($("canvasbox"));
  fieldRenderer.mount();
  resize();
  sliders();

  return {
    emit(event) {
      if (event.type === "playbookShown") playbook.renderPlaybook();
      else if (event.type === "playbookHidden") playbook.hidePlaybook();
      else emitHudEvent(event);
    },
    getSheetItems: playbook.getSheetItems,
    refreshPauseUI,
    render,
    getVisual,
    getVisualMode,
    setVisualMode,
    startFrames: () => requestAnimationFrame(frame),
  };
}
