import { PlaybookNavigation } from "./playbook_navigation.js";

export function createPlaybookUi(session) {
  const $ = (id) => document.getElementById(id);
  const { isFreeKick, clockText, spotText, snap } = session;
  function renderPlaybook() {
    const {
      specialState,
      tryState,
      possession,
      selectedFormation,
      TEAM_NAMES,
      TEAM_STYLES,
      returnCall,
      quarter,
      quarterSeconds,
      down,
      togo,
      playSeconds,
      defenseDesc,
      selectedFront,
      coveragePreference,
      coverageDesc,
      pressurePreference,
      pressureDesc,
      RUNS,
      selectedPlay,
      yard,
    } = session;
    const box = $("callSheet"),
      list = $("callSheetPlays");
    const heading = $("callSheetHeading"),
      sub = $("callSheetSub");
    $("sheetToolbar").style.display =
      !specialState && !tryState && possession === 0 ? "flex" : "none";
    $("sheetFormation").value = selectedFormation;
    if (isFreeKick(specialState)) {
      heading.textContent =
        (specialState.kind === "safety-kick" ? "SAFETY FREE KICK · " : "") +
        (possession === 0 ? "RETURN KICKOFF" : "KICKOFF COVERAGE") +
        " · " +
        TEAM_NAMES[specialState.kickingTeam] +
        " kicking";
      sub.textContent =
        "Kicker determines landing location · " +
        TEAM_NAMES[possession] +
        " receiving · " +
        TEAM_STYLES[possession].identity;
      list.innerHTML =
        possession === 0
          ? ["left", "middle", "right"]
              .map(
                (v) =>
                  `<button type="button" class="sheetPick ${returnCall === v ? "active" : ""}" data-returncall="${v}"><b>RETURN ${v.toUpperCase()}</b><small>Blocking wedge attacks the ${v} return lane · kick location is not selectable</small></button>`,
              )
              .join("")
          : '<button type="button" class="sheetPick special active" data-kickready="1"><b>KICKOFF COVERAGE</b><small>On-field kicker chooses spot from KPW / KAC · pursue the returner after landing</small></button>';
    } else if (tryState && !tryState.mode) {
      heading.textContent = "AFTER TOUCHDOWN · " + TEAM_NAMES[possession];
      sub.textContent =
        "Touchdown = 6 · choose a 33-yard extra-point kick or a 2-point play from the 2";
      list.innerHTML =
        '<button type="button" class="sheetPick" data-special="pat"><b>EXTRA POINT</b><small>Kick · 1 point</small></button><button type="button" class="sheetPick" data-special="two"><b>GO FOR TWO</b><small>Run or pass · 2 points</small></button>';
    } else {
      heading.textContent =
        (possession === 0 ? "CALL A PLAY" : "CALL YOUR DEFENSE") +
        " · " +
        TEAM_NAMES[possession];
      sub.textContent = `${TEAM_STYLES[possession].identity} · Q${quarter} ${clockText(quarterSeconds)} · ${down}${["", "st", "nd", "rd", "th"][down] || "th"} & ${Math.max(1, Math.ceil(togo))} · ${spotText()} · ${clockText(playSeconds)} play clock`;
      if (possession === 1) {
        sub.textContent +=
          " · DEFENSE: " + defenseDesc[selectedFront] + " · LB/RB CHANGE FRONT";
        list.innerHTML =
          '<div class="callSheetGroup">COVERAGE</div>' +
          ["mix", "cover1", "cover2", "cover3", "quarters"]
            .map(
              (v) =>
                `<button type="button" class="sheetPick ${coveragePreference === v ? "active" : ""}" data-defense-coverage="${v}"><b>${v === "mix" ? "MIX COVERAGES" : v.toUpperCase()}</b><small>${v === "mix" ? "Adaptive mix of coverage calls" : coverageDesc[v]}</small></button>`,
            )
            .join("") +
          '<div class="callSheetGroup">PRESSURE</div>' +
          ["mix", "balanced", "contain", "spy", "blitz", "stunt"]
            .map(
              (v) =>
                `<button type="button" class="sheetPick ${pressurePreference === v ? "active" : ""}" data-defense-pressure="${v}"><b>${v.toUpperCase()}</b><small>${v === "mix" ? "Vary rush lanes and calls" : pressureDesc[v]}</small></button>`,
            )
            .join("");
      } else
        list.innerHTML =
          ["RUN", "PASS"]
            .map(
              (group) =>
                '<div class="callSheetGroup">' +
                group +
                " CONCEPTS</div>" +
                [...document.querySelectorAll(".play[data-play]")]
                  .filter((btn) =>
                    group === "RUN"
                      ? RUNS.has(btn.dataset.play)
                      : !RUNS.has(btn.dataset.play),
                  )
                  .map(
                    (btn) =>
                      `<button type="button" class="sheetPick ${selectedPlay === btn.dataset.play ? "active" : ""}" data-sheetplay="${btn.dataset.play}"><b>${btn.querySelector(".name")?.textContent || btn.dataset.play}</b><small>${btn.querySelector(".ptype")?.textContent || ""}</small></button>`,
                  )
                  .join(""),
            )
            .join("") +
          (down === 4
            ? `<button type="button" class="sheetPick special" data-special="punt"><b>PUNT</b><small>Fourth-down kick / live return</small></button><button type="button" class="sheetPick special" data-special="fg"><b>FIELD GOAL</b><small>${Math.round(110 - yard + 17)}-yard attempt · 3 points</small></button>`
            : "");
    }
    box.classList.add("visible");
    focusSheetItem(session.sheetFocusIndex);
  }
  // Highlighting and invocation are independent of formation/coverage code.
  function sheetOptions() {
    return [...$("callSheetPlays").querySelectorAll("button.sheetPick")];
  }
  function focusSheetItem(index) {
    const items = sheetOptions();
    if (!items.length) {
      session.sheetFocusIndex = 0;
      return false;
    }
    if (session.sheetFocusKey) {
      const saved = items.findIndex(
        (el) =>
          session.sheetFocusKey === el.dataset.sheetplay ||
          session.sheetFocusKey === el.dataset.returncall ||
          session.sheetFocusKey === el.dataset.defenseCoverage ||
          session.sheetFocusKey === el.dataset.defensePressure,
      );
      if (saved >= 0) index = saved;
    }
    session.sheetFocusIndex = Math.max(0, Math.min(items.length - 1, index));
    items.forEach((el, i) => {
      el.classList.toggle("padFocus", i === session.sheetFocusIndex);
      el.setAttribute(
        "aria-current",
        i === session.sheetFocusIndex ? "true" : "false",
      );
    });
    items[session.sheetFocusIndex].scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
    });
    return true;
  }
  function moveSheetFocus(direction) {
    const length = sheetOptions().length,
      cols = window.innerWidth <= 620 ? 2 : 3;
    session.sheetFocusKey = "";
    return focusSheetItem(
      PlaybookNavigation.move(session.sheetFocusIndex, length, cols, direction),
    );
  }
  function chooseSheetFocused() {
    const selected = sheetOptions()[session.sheetFocusIndex];
    if (!selected) return false;
    if (
      selected.classList.contains("active") &&
      isFreeKick(session.specialState)
    ) {
      snap();
      return true;
    }
    session.sheetFocusKey =
      selected.dataset.sheetplay ||
      selected.dataset.returncall ||
      selected.dataset.defenseCoverage ||
      selected.dataset.defensePressure ||
      "";
    selected.click();
    return true;
  }

  return {
    renderPlaybook,
    moveSheetFocus,
    chooseSheetFocused,
    hidePlaybook: () => $("callSheet").classList.remove("visible"),
    getSheetItems: () =>
      sheetOptions().map((button) => ({
        label: button.innerText,
        focused: button.classList.contains("padFocus"),
        selected: button.classList.contains("active"),
      })),
  };
}
