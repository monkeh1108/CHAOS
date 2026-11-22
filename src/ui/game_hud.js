import { clamp, distance2D as dist } from "../core/math.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";

export function createGameHud({ readState, queries }) {
  const $ = (id) => document.getElementById(id);
  const {
    audibleChoices,
    chooseCoinToss,
    eligibleTargets,
    clockText,
    spotText,
    P,
    speed,
    closestThreat,
    defenderAirInteractionZone,
  } = queries;

  function renderAudibles() {
    const {
      audibleOpen,
      controlMode,
      selectedFront,
      selectedFormation,
      AUDIBLE_BUTTONS,
    } = readState();
    const menu = $("audibleMenu");
    if (!menu) return;
    menu.classList.toggle("visible", audibleOpen);
    menu.setAttribute("aria-hidden", String(!audibleOpen));
    if (!audibleOpen) return;
    $("audibleHeading").textContent =
      (controlMode === "defense" ? "DEFENSIVE" : "OFFENSIVE") +
      " AUDIBLES · " +
      (controlMode === "defense"
        ? selectedFront
        : selectedFormation
      ).toUpperCase();
    $("audibleOptions").innerHTML = audibleChoices()
      .map(
        (o, i) =>
          `<button type="button" data-audible="${i}"><b>${AUDIBLE_BUTTONS[i]} · ${o.label}</b><small>${o.play || o.coverage + " / " + o.pressure}</small></button>`,
      )
      .join("");
  }

  function matchupHud() {
    const { RUNS, selectedPlay, off, def, phase } = readState();
    const panel = $("matchupReadout");
    if (!panel) return;
    if (RUNS.has(selectedPlay)) {
      panel.textContent =
        "PASS MATCHUPS · Select a pass play to inspect releases, cuts and coverage.";
      return;
    }
    const lines = off
      .filter((p) => ["WR", "TE"].includes(p.pos))
      .slice(0, 4)
      .map((p) => {
        const db = def.find(
          (d) => d.assignment?.kind === "man" && d.assignment.target === p.key,
        );
        if (!db)
          return (
            p.key +
            " · zone coverage · RTE " +
            Math.round(p.RTE) +
            " / CUT " +
            Math.round(p.CUT)
          );
        const gap =
          phase === "presnap"
            ? ""
            : " · " + dist(p, db).toFixed(1) + " yd apart";
        const released = p.pressResult
          ? " · " + p.pressResult.replaceAll("-", " ")
          : "";
        return (
          p.key +
          " ↔ " +
          db.key +
          " · REL " +
          Math.round(p.REL) +
          "/PRS " +
          Math.round(db.PRS) +
          " · CUT " +
          Math.round(p.CUT) +
          "/MIR " +
          Math.round(db.MIR) +
          gap +
          released
        );
      });
    panel.textContent = "RECEIVER / DEFENDER MATCHUPS\n" + lines.join("\n");
  }

  function schemeReport() {
    const {
      formationDesc,
      selectedFormation,
      defenseDesc,
      selectedFront,
      RUNS,
      selectedPlay,
      selectedCoverage,
      coveragePreference,
      selectedPressure,
      coverageDesc,
      pressureDesc,
      PASS_ICONS,
    } = readState();
    const offLabel = formationDesc[selectedFormation],
      dLabel = defenseDesc[selectedFront],
      gap = RUNS.has(selectedPlay),
      heavy = selectedFormation === "ace" || selectedFormation === "iform",
      light = selectedFront === "nickel";
    let note = gap
      ? heavy && light
        ? "Heavier offensive bodies face nickel: the offense may create extra blocking angles, but the run still has to beat the actual gap defenders."
        : selectedPlay === "power"
          ? "Power asks the back-side guard to pull. The defense can defeat it with penetration, pursuit and edge leverage."
          : "Run success depends on combo-block displacement, defender gap fits and the runner choosing a crease."
      : selectedCoverage === "cover1"
        ? "Man coverage creates leverage and crossing-route battles; coverage and receiver ratings determine separation."
        : "Zones defend space. Floods and layered routes can stress the underneath-to-deep handoffs, but defenders react to the routes.";
    $("schemeReadout").innerHTML =
      "<strong>" +
      offLabel +
      "</strong><small>Defense: " +
      dLabel +
      " · " +
      selectedCoverage.toUpperCase() +
      (coveragePreference === "mix" ? " (MIXED)" : "") +
      " · " +
      selectedPressure.toUpperCase() +
      "</small><small>" +
      coverageDesc[selectedCoverage] +
      " · " +
      pressureDesc[selectedPressure] +
      "</small><small>" +
      note +
      "</small>";
    $("targets")
      .querySelectorAll("button")
      .forEach((b, i) => {
        const p = eligibleTargets()[i];
        b.innerHTML =
          '<span class="faceIcon icon' +
          i +
          '">' +
          PASS_ICONS[i] +
          '</span><span class="targetMeta"><strong>' +
          (p?.key || "—") +
          "</strong><small>KEY " +
          (i + 1) +
          "</small></span>";
        b.setAttribute(
          "aria-label",
          "Throw to " + (p?.name || "receiver") + " — key " + (i + 1),
        );
      });
    $("receiverPins")
      .querySelectorAll("button")
      .forEach((b, i) => {
        const p = eligibleTargets()[i];
        b.setAttribute(
          "aria-label",
          "Throw to " + (p?.name || "receiver") + " — key " + (i + 1),
        );
      });
  }

  function hud() {
    const {
      phase,
      down,
      specialState,
      tryState,
      togo,
      yard,
      quarterSeconds,
      teamPoints,
      quarter,
      playSeconds,
      scrimmagePlayCalled,
      possession,
      localTeam,
      timeOuts,
      TEAM_NAMES,
      controlMode,
      selectedDefenderKey,
      selectedLinemanKey,
      ballCarrier,
      ball,
      YARD_M,
      MPS_TO_MPH,
      lastContact,
      def,
      burstCool,
      moveCooldown,
      RUNS,
      selectedPlay,
      returnCall,
      secondHalfReceiver,
      pendingPass,
      playClock,
      pileState,
      paused,
      manualDrive,
      manualReceiver,
      gameFlowNote,
    } = readState();
    if (phase === "live" || phase === "presnap" || phase === "dead") {
      let suffix = ["", "ST", "ND", "RD", "TH"][down] || "TH";
      $("down").textContent = specialState
        ? specialState.kind === "punt"
          ? "PUNT"
          : specialState.returning
            ? "RETURN"
            : "KICKOFF"
        : tryState
          ? tryState.mode === "two"
            ? "TWO-POINT TRY"
            : "EXTRA-POINT TRY"
          : down + suffix + " & " + Math.max(1, Math.round(togo));
      $("yardline").textContent =
        (yard < 60
          ? "OWN " + Math.round(yard - 10)
          : "OPP " + Math.round(110 - yard)) + " · BALL";
      $("clock").textContent = clockText(quarterSeconds);
      $("points").textContent = teamPoints[0];
      $("awayPoints").textContent = teamPoints[1];
      $("quarterRead").textContent =
        phase === "halftime" ? "HALF" : "Q" + quarter;
      $("playClockRead").textContent = clockText(playSeconds);
      $("playClockRead").classList.toggle(
        "urgent",
        phase === "presnap" && scrimmagePlayCalled && playSeconds <= 5,
      );
      $("homePoss").textContent = possession === 0 ? "● " : "";
      $("awayPoss").textContent = possession === 1 ? "● " : "";
      $("timeoutsRead").textContent = "TO " + timeOuts[0] + " – " + timeOuts[1];
      $("yardline").textContent = specialState
        ? TEAM_NAMES[specialState.kickingTeam] + " TO " + TEAM_NAMES[possession]
        : spotText() + " · " + TEAM_NAMES[possession];
    }
    const ballP =
      controlMode === "defense"
        ? P(selectedDefenderKey)
        : controlMode === "line"
          ? P(selectedLinemanKey)
          : ballCarrier || (phase === "live" && !ball ? P("QB") : null);
    $("speedReading").textContent = ballP
      ? (speed(ballP) * YARD_M * MPS_TO_MPH).toFixed(1)
      : "0.0";
    $("impulseReading").textContent = lastContact + " ";
    const a = P("WR1"),
      b = P("CB1");
    $("separationReading").textContent = a && b ? dist(a, b).toFixed(1) : "—";
    const qb = P("QB");
    $("pressureReading").textContent = qb
      ? Math.round(clamp((5 - closestThreat(qb, def).d) / 5, 0, 1) * 100) + "%"
      : "0%";
    $("boost").textContent =
      burstCool > 0 ? burstCool.toFixed(1) + "s" : "BURST";
    $("dive").textContent =
      moveCooldown > 0 ? moveCooldown.toFixed(1) + "s" : "JUKE";
    const energy = $("staminaReading"),
      bar = $("staminaFill");
    const runner =
      controlMode === "defense"
        ? P(selectedDefenderKey)
        : controlMode === "line"
          ? P(selectedLinemanKey)
          : ballCarrier || P("QB");
    if (energy && bar && runner) {
      const pct = Math.round(runner.stam * 100);
      energy.textContent =
        pct +
        "% · " +
        (runner.stam < 0.2
          ? "EXHAUSTED"
          : runner.stam < 0.45
            ? "TIRED"
            : runner.sprinting
              ? "SPRINTING"
              : "READY");
      bar.style.width = pct + "%";
      bar.style.background =
        pct < 25 ? "#f28b75" : pct < 50 ? "#e9cf79" : "#bde76e";
    }
    const read = $("defenseRead");
    if (read && phase === "live" && RUNS.has(selectedPlay)) {
      const count = def.filter((d) => d.runRead).length;
      read.textContent =
        "DEFENSE · " +
        count +
        "/11 RECOGNIZED RUN · GAP FITS / CONTAIN / PURSUIT";
    } else if (read) {
      read.textContent =
        "DEFENSE · " +
        (phase === "presnap"
          ? "ALIGNING"
          : phase === "dead"
            ? "WHISTLE"
            : "COVERAGE ASSIGNMENTS");
    }
    const control = $("inputStatus");
    if (control && specialState)
      control.textContent = specialState.returning
        ? "SPECIAL TEAMS · RETURN IN PROGRESS"
        : specialState.kind === "punt"
          ? "PUNT RETURN · WATCH FOR THE BALL · K FOR FAIR CATCH"
          : "KICKOFF · " +
            (possession === localTeam
              ? "RETURN " + returnCall.toUpperCase()
              : "COVER THE RETURN");
    else if (control && phase === "halftime")
      control.textContent =
        "HALFTIME · " +
        TEAM_NAMES[secondHalfReceiver] +
        " RECEIVES NEXT · PRESS START THIRD QUARTER";
    else if (control)
      control.textContent = pendingPass
        ? "PASS CHARGING · " +
          (playClock - pendingPass.start < 0.2
            ? "LOB"
            : playClock - pendingPass.start < 0.45
              ? "TOUCH"
              : "BULLET") +
          " · RELEASE RECEIVER BUTTON"
        : pileState?.active
          ? "STANDING PILE · " +
            pileState.wrappers.length +
            " DEFENDERS · " +
            pileState.pushers.length +
            " OFFENSIVE PUSHERS"
          : paused
            ? "PAUSED · MENU TO RESUME"
            : phase === "presnap"
              ? controlMode === "defense"
                ? "DEFENSE · " +
                  (P(selectedDefenderKey)?.key || "DEFENDER") +
                  " · " +
                  DefensivePresnap.description(P(selectedDefenderKey)) +
                  " · LEFT STICK MOVE · B SWITCH · X AUDIBLE"
                : "SNAP TO START · X AUDIBLE · A SNAP"
              : phase === "dead"
                ? "WHISTLE · NEXT SNAP"
                : controlMode === "defense" && ball?.flying
                  ? "PASS AIRBORNE · " +
                    (defenderAirInteractionZone(P(selectedDefenderKey))
                      ? "ON THE PLAY · X SWAT / A PLAY RECEIVER / Y BALL HAWK"
                      : "NOT IN CONTEST · X DIVES / B SWITCH DEFENDER")
                  : controlMode === "defense"
                    ? "DEFENSE · YOU CONTROL " +
                      (P(selectedDefenderKey)?.pos || "DEFENDER") +
                      " · B SWITCH · A WRAP · X HIT/DIVE · RIGHT STICK HIT/CUT"
                    : controlMode === "line"
                      ? "O-LINE · YOU CONTROL " +
                        selectedLinemanKey +
                        " · RIGHT STICK UP IMPACT/PUSH"
                      : ballCarrier && ballCarrier.team === 0
                        ? manualDrive
                          ? "YOU CONTROL " +
                            ballCarrier.pos +
                            " · GIVE AI CONTROL TO RELEASE"
                          : "AUTO RUN " +
                            ballCarrier.pos +
                            " · STEER TO TAKE OVER"
                        : ball
                          ? manualReceiver
                            ? "USER RECEIVER · LEFT STICK STEERS · X RAC / A POSSESSION / Y AGGRESSIVE"
                            : "PASS AIRBORNE · B SWITCH RECEIVER · X RAC / A POSSESSION / Y AGGRESSIVE"
                          : RUNS.has(selectedPlay)
                            ? "HANDOFF COMING · MOVE TO TAKE CONTROL"
                            : "QB CONTROL · WASD / ARROWS";
    const airRow = $("airActions");
    if (airRow) {
      const show =
        phase === "live" &&
        !specialState &&
        !!ball?.flying &&
        !paused &&
        controlMode !== "line" &&
        (controlMode !== "defense" ||
          defenderAirInteractionZone(P(selectedDefenderKey)));
      airRow.style.display = show ? "flex" : "none";
      if (show) {
        const switchButton = $("receiverSwitch");
        if (switchButton)
          switchButton.style.display =
            controlMode === "offense" ? "inline-flex" : "none";
        const labels =
          controlMode === "defense"
            ? ["X · SWAT", "A · PLAY RECEIVER", "Y · BALL HAWK"]
            : ["X · RAC CATCH", "A · POSSESSION", "Y · AGGRESSIVE"];
        airRow.querySelectorAll("button[data-air]").forEach((b, i) => {
          if (b.textContent !== labels[i]) b.textContent = labels[i];
        });
      }
    }
    $("fairCatchBtn").style.display =
      phase === "live" && specialState?.kind === "punt" && !!ball?.flying
        ? "inline-flex"
        : "none";
    const stateRead = $("gameStateRead");
    if (stateRead) {
      const status =
        phase === "halftime"
          ? "HALFTIME · CONTINUE"
          : phase === "presnap"
            ? specialState
              ? "KICKOFF READY"
              : scrimmagePlayCalled
                ? possession !== localTeam
                  ? "CPU PRE-SNAP"
                  : "YOUR PRE-SNAP"
                : "PICK A PLAY"
            : phase === "live"
              ? specialState
                ? "LIVE RETURN"
                : "LIVE PLAY"
              : phase === "dead"
                ? "WHISTLE · NEXT"
                : phase.toUpperCase();
      stateRead.textContent = "STATE: " + status + " · " + gameFlowNote;
      stateRead.dataset.phase = phase;
    }
    $("pause").disabled = phase !== "live";
    $("pause").textContent = paused ? "RESUME" : "PAUSE";
    const auto = $("autoRun");
    if (auto)
      auto.style.display =
        phase === "live" && ballCarrier && manualDrive ? "inline-flex" : "none";
    matchupHud();
  }

  function tossScreen(title, description, buttons) {
    const root = $("coinToss");
    root.hidden = false;
    $("coinTossTitle").textContent = title;
    $("coinTossText").textContent = description;
    const options = $("coinTossOptions");
    options.replaceChildren();
    buttons.forEach(({ label, value }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn";
      button.textContent = label;
      button.addEventListener("click", () => chooseCoinToss(value));
      options.appendChild(button);
    });
    options.querySelector("button")?.focus({ preventScroll: true });
  }

  return function handleGameEvent(event) {
    switch (event.type) {
      case "hudChanged":
        hud();
        break;
      case "schemeChanged":
        schemeReport();
        break;
      case "audiblesChanged":
        renderAudibles();
        break;
      case "coinTossShown":
        tossScreen(event.title, event.description, event.buttons);
        break;
      case "logChanged":
        $("events").innerHTML = event.logs
          .map((s) => "<span>" + s + "</span>")
          .join("");
        break;
      case "messageChanged":
        $("message").innerHTML = event.text;
        break;
      case "fieldFocused":
        $("field").focus({ preventScroll: true });
        break;
      case "playSelectionChanged":
        for (const button of document.querySelectorAll(".play")) {
          button.classList.toggle(
            "selected",
            button.dataset.play === event.play,
          );
        }
        break;
      case "selectionChanged":
        $(event.key).value = event.value;
        break;
      case "coinTossHidden":
        $("coinToss").hidden = true;
        break;
      case "snapControlChanged":
        if (event.text !== undefined) $("snap").textContent = event.text;
        if (event.disabled !== undefined) $("snap").disabled = event.disabled;
        break;
      case "playControlsLocked":
        document
          .querySelectorAll("[data-play]")
          .forEach((button) => (button.disabled = event.locked));
        for (const id of ["formation", "front", "coverage", "pressure"])
          $(id).disabled = event.locked;
        break;
      case "resultHidden":
        $("overlay").classList.remove("visible");
        break;
      case "receiverPromptsHidden":
        $("targets").style.display = "none";
        $("receiverPins").style.display = "none";
        break;
      case "traceReady":
        $("downloadTrace").disabled = false;
        break;
      case "resultHeadingChanged":
        $("resultText").textContent = event.heading;
        break;
      case "controlModeChanged": {
        const { mode } = event;
        const el = $("controlMode");
        if (el)
          el.textContent =
            "CONTROL: " +
            (mode === "defense"
              ? "DEFENSE"
              : mode === "line"
                ? "O-LINE"
                : "OFFENSE");
        break;
      }
      case "resultShown": {
        const { heading, detail, action } = event;
        $("resultText").textContent = heading;
        $("resultDetail").textContent = detail;
        $("overlay").classList.add("visible");
        $("targets").style.display = "none";
        $("receiverPins").style.display = "none";
        $("snap").disabled = false;
        $("snap").textContent = action;
        break;
      }
    }
  };
}
