import { clamp } from "../core/math.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";
import { ChaosLowContact } from "../physics/low_contact.js";
import { createGridironRenderer } from "./renderer3d.js";

export function createFieldRenderer({
  canvas,
  width: W,
  height: H,
  readState,
  queries,
  reportDiagnostic,
}) {
  const $ = (id) => document.getElementById(id);
  const ctx = canvas.getContext("2d");
  const {
    P,
    isFreeKick,
    kickLineX,
    radius,
    speed,
    flightMarkers,
    receiverPromptTargets,
  } = queries;
  let camera = 30,
    fieldSize = { w: 1, h: 1 },
    visualMode = "3d",
    renderer3d = null;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    fieldSize = { w: r.width, h: r.height, scale: dpr };
    if (renderer3d) renderer3d.resize();
  }
  function setVisualMode(mode) {
    visualMode = renderer3d && mode === "3d" ? "3d" : "2d";
    const three = $("render3d");
    if (three) three.style.display = visualMode === "3d" ? "block" : "none";
    const b = $("viewMode");
    if (b) {
      b.textContent =
        visualMode === "3d"
          ? "VIEW: 3D · SWITCH TO 2D"
          : renderer3d
            ? "VIEW: 2D · SWITCH TO 3D"
            : "VIEW: 2D · 3D UNAVAILABLE";
      b.disabled = !renderer3d;
    }
    return visualMode;
  }
  function recoverFrom3DFailure(err) {
    reportDiagnostic?.(
      "error",
      "3D rendering failed; restoring visible 2D view",
      err,
    );
    renderer3d = null;
    setVisualMode("2d");
    const status = $("renderStatus3d");
    if (status) {
      status.textContent =
        "3D display unavailable here. The game has switched back to the working 2D field.";
      status.hidden = false;
    }
  }
  function view() {
    const { ball, ballCarrier, active, phase, specialState, playStart } =
      readState();
    const ratio = fieldSize.w / fieldSize.h;
    const xspan = H * ratio;
    const scale = fieldSize.h / H;
    const focus = ball?.flying ? ball : ballCarrier || P("QB") || active;
    const desired =
      phase === "presnap"
        ? isFreeKick(specialState)
          ? kickLineX(specialState)
          : playStart
        : focus
          ? focus.x
          : playStart;
    camera += (desired - camera) * 0.09;
    const cam = clamp(
      camera,
      Math.min(xspan / 2, W / 2),
      Math.max(W - xspan / 2, W / 2),
    );
    return { span: xspan, left: cam - xspan / 2, px: scale };
  }
  function xy(x, y, v) {
    return [(x - v.left) * v.px, y * v.px];
  }
  function drawField(v) {
    const { playStart, first } = readState();
    const s = v.px;
    ctx.fillStyle = "#265b45";
    ctx.fillRect(0, 0, fieldSize.w, fieldSize.h);
    for (let x = 0; x < 120; x += 10) {
      const [px] = xy(x, 0, v);
      ctx.fillStyle = (x / 10) % 2 ? "#2a6548" : "#2a6045";
      ctx.fillRect(px, 0, 10 * s, fieldSize.h);
    }
    for (const x of [0, 110]) {
      const [px] = xy(x, 0, v);
      ctx.fillStyle = "#1c3b52";
      ctx.fillRect(px, 0, 10 * s, fieldSize.h);
    }
    ctx.fillStyle = "#f6f8e5";
    ctx.globalAlpha = 0.7;
    for (let x = 10; x <= 110; x += 5) {
      const [px] = xy(x, 0, v);
      ctx.fillRect(px - 0.06 * s, 0, 0.12 * s, fieldSize.h);
      for (const y of [15, 38.3])
        ctx.fillRect(px - 0.48 * s, y * s, 0.96 * s, 0.1 * s);
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.font = `bold ${Math.max(8, 2.25 * s)}px ui-sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ecfff5a3";
    for (let x = 20; x < 110; x += 10) {
      const yardLabel = 50 - Math.abs(60 - x);
      const [px, py] = xy(x, 10, v);
      ctx.fillText(yardLabel, px, py);
      ctx.save();
      ctx.translate(px, 43 * s);
      ctx.rotate(Math.PI);
      ctx.fillText(yardLabel, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    for (const x of [playStart, first]) {
      const [px] = xy(x, 0, v);
      ctx.save();
      ctx.strokeStyle = x === first ? "#f8e765" : "#88bdfd";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, fieldSize.h);
      ctx.stroke();
      ctx.restore();
    }
    for (const x of [0, 110]) {
      const [px, py] = xy(x + 5, H / 2, v);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-Math.PI / 2);
      ctx.font = `900 ${5 * s}px ui-sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#d3e5f270";
      ctx.fillText(x === 110 ? "END ZONE" : "GRIDIRON LAB", 0, 0);
      ctx.restore();
    }
  }
  function drawAssignments(v) {
    const { phase, def, controlMode, selectedDefenderKey, off, playStart } =
      readState();
    if (phase !== "presnap") return;
    ctx.save();
    ctx.font = "600 10px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of def) {
      if (d.rush || !d.assignment) {
        if (controlMode === "defense" && d.key === selectedDefenderKey) {
          const gap = DefensivePresnap.gapTarget(d, off, playStart);
          const [dx, dy] = xy(d.x, d.y, v),
            [px, py] = xy(
              gap?.x ?? Math.min(109, playStart + 3),
              gap?.y ?? d.fit?.lane ?? d.y,
              v,
            );
          ctx.strokeStyle = "#eaff9b";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(dx, dy);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        continue;
      }
      const a = d.assignment;
      const [dx, dy] = xy(d.x, d.y, v);
      if (a.kind === "zone") {
        const [px, py] = xy(a.baseX, a.baseY, v);
        const rx = (a.depth >= 12 ? 6.5 : 4.5) * v.px,
          ry = a.width * 0.65 * v.px;
        ctx.beginPath();
        ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#7dcff117";
        ctx.fill();
        ctx.strokeStyle = "#9bdef15d";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (controlMode === "defense" && d.key === selectedDefenderKey) {
          ctx.beginPath();
          ctx.moveTo(dx, dy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = "#eaff9b";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        const t = P(a.target);
        if (!t) continue;
        const [tx, ty] = xy(t.x, t.y, v);
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = "#92e8f5a8";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }
  function drawRoute(v) {
    const { phase, gameStarted, controlMode, off, ballCarrier, intended } =
      readState();
    if (phase === "dead" || (gameStarted && controlMode === "defense")) return;
    for (const p of off) {
      if (!p.route || ballCarrier) continue;
      ctx.strokeStyle =
        p === intended ? "#e8ff91" : p.key === "TE" ? "#ffbf80" : "#d6f6f6";
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      let [px, py] = xy(p.x, p.y, v);
      ctx.moveTo(px, py);
      for (let j = p.routeIdx; j < p.route.length; j++) {
        [px, py] = xy(...p.route[j], v);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }
  function drawPossessionRing(x, y, r) {
    ctx.save();
    ctx.strokeStyle = "#ffdc76";
    ctx.lineWidth = 3.3;
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  function playerShape(p, v, markerCarrier) {
    const {
      possession,
      totalClock,
      pileState,
      ballCarrier,
      tackleLinks,
      active,
      phase,
      burstTime,
    } = readState();
    const home = (p.team === 0 ? possession : 1 - possession) === 0;
    const [x, y] = xy(p.x, p.y, v),
      s = v.px,
      r = Math.max(4, radius(p) * s);
    if (x < -30 || x > fieldSize.w + 30) return;
    ctx.save();
    ctx.translate(x, y);
    if (p.ground) {
      const g = p.ground;
      const settle = g.stage === "fall" ? clamp(g.age / g.fall, 0, 1) : 1;
      const gettingUp =
        g.stage === "rise" ? clamp(1 - g.time / g.rise, 0, 1) : 0;
      const body = clamp(1 - settle * 0.3 + gettingUp * 0.3, 0.66, 1);
      ctx.rotate(g.dir + (g.stage === "fall" ? 0.28 * settle : 0));
      ctx.fillStyle = "#04151caa";
      ctx.beginPath();
      ctx.ellipse(2, 3, r * 1.38, r * 0.69, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = home ? "#a5cb5a" : "#4da6ce";
      ctx.strokeStyle = home ? "#effbbd" : "#d2f7ff";
      ctx.lineWidth = Math.max(1.3, r * 0.2);
      ctx.beginPath();
      ctx.moveTo(-r * 1.03, -r * 0.56);
      ctx.lineTo(-r * 0.57, -r * 0.18);
      ctx.lineTo(r * 0.45, -r * 0.7);
      ctx.moveTo(-r * 1.03, r * 0.56);
      ctx.lineTo(-r * 0.57, r * 0.18);
      ctx.lineTo(r * 0.45, r * 0.7);
      ctx.stroke();
      ctx.save();
      ctx.scale(body, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.07, r * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = home ? "#e6fba6" : "#caf5fc";
      ctx.beginPath();
      ctx.arc(r * 0.85, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      if (g.stage === "winded") {
        const breathing = 1 + 0.13 * Math.sin(totalClock * 8);
        ctx.strokeStyle = home ? "#dffcba" : "#b6e8ff";
        ctx.globalAlpha = 0.68;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-r * 0.1, 0, r * 0.94 * breathing, 0.15, Math.PI * 1.08);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (g.stage === "rise") {
        ctx.strokeStyle = "#f9f0b3";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      // Grounded players stay visible but cannot block, pursue, or catch until up.
      ctx.save();
      ctx.fillStyle = "#eaf7df";
      ctx.font = `700 ${Math.max(8, 1.45 * s)}px ui-sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        g.stage === "winded" ? "•••" : g.stage === "rise" ? "↑" : "!",
        x,
        y - r - 7,
      );
      ctx.restore();
      if (markerCarrier === p) drawPossessionRing(x, y, r);
      return;
    }
    const pileMotion =
      pileState?.active &&
      (p === ballCarrier || p.pushing || tackleLinks.has(p.key));
    const legRate = 12 + speed(p) * 0.9;
    const stride = Math.sin(totalClock * legRate + (p.team ? 1.7 : 0));
    const lean =
      p.lean +
      (pileMotion ? 0.09 * Math.sin(totalClock * 19) : 0) +
      (p.action?.kind === "juke"
        ? Math.sin(totalClock * 21) * 0.12
        : p.action?.kind === "truck"
          ? 0.16
          : p.action?.kind === "stiff"
            ? 0.06
            : p.action?.kind === "hesi"
              ? -0.2
              : p.action?.kind === "dive"
                ? 0.32
                : 0);
    ctx.rotate(
      p.face +
        lean +
        (p.action?.kind === "spin" ? p.spin * 0.2 : p.spin * 0.035),
    );
    // Procedural original overhead contact animation: feet churn and forearms
    // extend into the pile. Impact-induced lean / spin is derived from collisions.
    if (pileMotion || speed(p) > 0.5 || p.action) {
      ctx.strokeStyle = home ? "#e8f5ac" : "#aadbed";
      ctx.lineWidth = Math.max(1.6, r * 0.29);
      ctx.lineCap = "round";
      const reach =
        p.action?.kind === "stiff"
          ? 1.85
          : p.action?.kind === "truck"
            ? 1.35
            : p.action?.kind === "impact-block"
              ? 1.7
              : p.pushing
                ? 1.43
                : pileMotion
                  ? 1.17
                  : 0.73;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.46, side * r * 0.35);
        ctx.lineTo(-r * (1.18 + stride * 0.23 * side), side * r * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.16, side * r * 0.7);
        ctx.lineTo(r * reach, side * r * (0.58 + (p.pushing ? 0.13 : 0)));
        ctx.stroke();
      }
    }
    if (p.airState) {
      ctx.save();
      ctx.strokeStyle = "#eafda3";
      ctx.setLineDash([3, 2]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        r * (1.35 + ChaosLowContact.height(p) * 0.9),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    if (p.action) {
      ctx.save();
      ctx.strokeStyle = ["juke", "spin", "hesi"].includes(p.action.kind)
        ? "#e9ff70"
        : ["truck", "hit-stick", "impact-block"].includes(p.action.kind)
          ? "#ff9c78"
          : "#91f9ff";
      ctx.lineWidth = Math.max(2, r * 0.23);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.55, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#001c1a99";
    ctx.beginPath();
    ctx.ellipse(1.3, 2.3, r * 1.1, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    if (active === p) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = home ? "#d5f36b" : "#79cef1";
    ctx.strokeStyle = home ? "#f1ffc0" : "#d5f8ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#17352b";
    ctx.fillRect(r * 0.28, -r * 0.2, r * 0.33, r * 0.4);
    if (p.covering) {
      ctx.strokeStyle = "#e9ff8a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, -1.2, 1.2);
      ctx.stroke();
    }
    if (p.shield > 0) {
      ctx.strokeStyle = "#ffed8d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#082a2c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(8, 1.55 * s)}px ui-sans-serif`;
    ctx.fillText(
      p.key === "WR1"
        ? "X"
        : p.key === "WR2"
          ? "Z"
          : p.pos === "EDGE"
            ? "E"
            : p.pos === "CB"
              ? "C"
              : p.pos === "OLB"
                ? "O"
                : p.pos === "MLB"
                  ? "M"
                  : p.pos === "FS"
                    ? "F"
                    : p.pos === "DT"
                      ? "D"
                      : p.pos === "NT"
                        ? "N"
                        : p.pos === "DE"
                          ? "E"
                          : p.pos === "FB"
                            ? "B"
                            : p.pos === "RB"
                              ? "R"
                              : p.pos === "QB"
                                ? "Q"
                                : p.pos === "TE"
                                  ? "T"
                                  : p.pos === "LT"
                                    ? "L"
                                    : p.pos === "RT"
                                      ? "R"
                                      : "C",
      x,
      y,
    );
    ctx.restore();
    if (p === active && phase === "live") {
      ctx.save();
      ctx.strokeStyle = burstTime > 0 ? "#e9ff72" : "#d5f7f6aa";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + p.vx * v.px * 0.47, y + p.vy * v.px * 0.47);
      ctx.stroke();
      ctx.restore();
    }
    if (p === active) {
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${Math.max(9, 1.75 * s)}px ui-sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(p.name.split(" ").pop(), x, y - r - 8);
      ctx.restore();
    }
    if (phase === "live" && p.pulse > 0) {
      ctx.strokeStyle = "#ffee9a";
      ctx.globalAlpha = p.pulse * 2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (markerCarrier === p) {
      drawPossessionRing(x, y, r);
      ctx.fillStyle = "#a56631";
      ctx.strokeStyle = "#fff2cc";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(
        x + r * 0.6,
        y - r * 0.6,
        r * 0.44,
        r * 0.27,
        Math.PI / 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();
    }
  }
  function drawBall(v) {
    const { ball, totalClock } = readState();
    if (!ball || !ball.flying) return;
    const spot = flightMarkers(),
      [sx, sy] = xy(spot.catchX, spot.catchY, v);
    const pulse = 1 + 0.1 * Math.sin(totalClock * 7),
      r = Math.max(9, v.px * 0.92) * pulse;
    ctx.save();
    ctx.strokeStyle = "#f6e88e";
    ctx.lineWidth = 2.6;
    ctx.globalAlpha = 0.87;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "bold 10px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff8ba";
    ctx.fillText("CATCH", sx, sy - r - 8);
    ctx.restore();
    const [x, y] = xy(ball.x, ball.y, v),
      s = v.px;
    const z = Math.max(0, ball.z * s);
    ctx.fillStyle = "#020f1a90";
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f9da91";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#efb47b";
    ctx.strokeStyle = "#fff0cc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      x - z * 0.26,
      y - z * 0.43,
      Math.max(4, s * 0.4),
      Math.max(2, s * 0.23),
      Math.atan2(ball.vy, ball.vx),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  }
  function placeReceiverPins(v) {
    const { phase } = readState();
    const layer = $("receiverPins"),
      targets = receiverPromptTargets();
    layer.style.display = targets.length ? "block" : "none";
    $("targets").style.display =
      targets.length && phase === "live" ? "flex" : "none";
    if (!targets.length) return;
    layer.querySelectorAll("button").forEach((b, i) => {
      const p = targets[i];
      if (!p) {
        b.style.display = "none";
        return;
      }
      const projected =
        visualMode === "3d" && renderer3d
          ? renderer3d.project(p.x, (p.h / 74) * 2.5, p.y)
          : null;
      const [px, py] = projected ? [projected.x, projected.y] : xy(p.x, p.y, v),
        visible =
          (!projected || projected.visible) &&
          px > 20 &&
          px < fieldSize.w - 20 &&
          py > 24 &&
          py < fieldSize.h - 25;
      b.style.display = visible ? "flex" : "none";
      if (visible) {
        b.style.left = px + "px";
        b.style.top = Math.max(22, py - 18) + "px";
      }
    });
  }
  function placeActionCues(v) {
    const { players } = readState();
    const layer = $("actionCueLayer");
    if (!layer) return;
    const activeCues = players
      .filter((p) => p.actionCue?.time > 0 && !p.ground)
      .slice(0, 5);
    layer.replaceChildren();
    for (const p of activeCues) {
      const projected =
        visualMode === "3d" && renderer3d
          ? renderer3d.project(p.x, 3.1, p.y)
          : null;
      const [x, y] = projected ? [projected.x, projected.y] : xy(p.x, p.y, v);
      if (
        (projected && !projected.visible) ||
        x < 6 ||
        x > fieldSize.w - 6 ||
        y < 9 ||
        y > fieldSize.h - 10
      )
        continue;
      const el = document.createElement("span");
      el.className =
        "actionCue " +
        p.actionCue.kind +
        (p.actionCue.result ? " confirmed" : "");
      el.textContent = p.actionCue.label;
      el.style.left = x + "px";
      el.style.top = y - 12 + "px";
      layer.appendChild(el);
    }
  }
  // Thin amber links are active blocks; pink links are active tackle wraps.
  function drawContactLinks(v) {
    const { phase, blockLinks, tackleLinks, ballCarrier } = readState();
    if (phase !== "live") return;
    ctx.save();
    ctx.lineCap = "round";
    for (const e of blockLinks.values()) {
      const a = P(e.blocker),
        b = P(e.defender);
      if (!a || !b) continue;
      const [ax, ay] = xy(a.x, a.y, v),
        [bx, by] = xy(b.x, b.y, v);
      ctx.strokeStyle = "#ffb875";
      ctx.globalAlpha = 0.3 + 0.4 * e.secured;
      ctx.lineWidth = 1.8 + e.secured * 2.3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    for (const e of tackleLinks.values()) {
      const a = P(e.defender),
        b = ballCarrier;
      if (!a || !b) continue;
      const [ax, ay] = xy(a.x, a.y, v),
        [bx, by] = xy(b.x, b.y, v);
      ctx.strokeStyle = "#ff8295";
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2 + e.grip * 3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawPileOverlay(v) {
    const { pileState, ballCarrier } = readState();
    if (!pileState?.active || !ballCarrier) return;
    const a = ballCarrier,
      [x, y] = xy(a.x, a.y, v),
      s = v.px;
    ctx.save();
    ctx.strokeStyle = "#f4f4b4";
    ctx.globalAlpha = 0.62;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.45 * s, 1.2 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f7ffdc";
    ctx.textAlign = "center";
    ctx.font = "bold 10px ui-sans-serif";
    ctx.fillText(
      "PILE  " +
        pileState.wrappers.length +
        " WRAP  ·  " +
        pileState.pushers.length +
        " PUSH",
      x,
      y - 1.7 * s,
    );
    for (const entry of pileState.pushers) {
      const p = P(entry.key);
      if (!p) continue;
      const [px, py] = xy(p.x, p.y, v);
      ctx.strokeStyle = "#dfff79";
      ctx.globalAlpha = 0.48;
      ctx.lineWidth = 2 + entry.output;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  function render() {
    const {
      phase,
      ball,
      ballCarrier,
      specialState,
      controlMode,
      passThrown,
      shake,
      totalClock,
      players,
      playStart,
      flash,
      active,
      intended,
      blockLinks,
      tackleLinks,
      wrapFinish,
      possession,
      first,
      selectedPlay,
      def,
      selectedDefenderKey,
      off,
      gameStarted,
    } = readState();
    if (!canvas.width || !canvas.height) return;
    // Scrimmage models the QB's pre-release and pre-handoff possession implicitly.
    // Keep the visual holder separate from the carrier used by physics and camera.
    const markerCarrier =
      phase === "live" && !ball?.flying
        ? ballCarrier ||
          (!specialState && controlMode === "defense" && !passThrown && !ball
            ? P("QB")
            : null)
        : null;
    const dpr = fieldSize.scale;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, fieldSize.w, fieldSize.h);
    ctx.save();
    if (shake > 0)
      ctx.translate(
        Math.sin(totalClock * 173) * shake * 7,
        Math.cos(totalClock * 157) * shake * 6,
      );
    const v = view();
    drawField(v);
    if (!specialState) {
      drawAssignments(v);
      drawRoute(v);
    }
    drawContactLinks(v);
    drawPileOverlay(v);
    for (const p of players.filter((q) => q.team === 1))
      playerShape(p, v, markerCarrier);
    for (const p of players.filter((q) => q.team === 0))
      playerShape(p, v, markerCarrier);
    drawBall(v);
    if (phase === "presnap" && !specialState) {
      const [x, y] = xy(playStart, 26.6, v);
      ctx.fillStyle = "#f8f1bf";
      ctx.font = "bold 12px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LINE OF SCRIMMAGE", x, y - 31);
    }
    if (flash > 0) {
      ctx.fillStyle = "rgba(226,255,142," + (0.16 * flash) / 2 + ")";
      ctx.fillRect(0, 0, fieldSize.w, fieldSize.h);
    }
    ctx.restore();
    if (visualMode === "3d" && renderer3d) {
      try {
        renderer3d.draw({
          players,
          carrier: ballCarrier,
          markerCarrier,
          active,
          intended,
          ball,
          blocks: [...blockLinks.values()],
          tackles: [...tackleLinks.values()],
          wrapFinish,
          possession,
          clock: totalClock,
          special: !!specialState,
          los:
            specialState?.kind === "punt"
              ? 120 - specialState.puntFrom
              : isFreeKick(specialState)
                ? kickLineX(specialState)
                : playStart,
          first,
          phase,
          play: selectedPlay,
          passThrown,
          playStart,
          defenseArt:
            phase === "presnap" && !specialState && controlMode === "defense"
              ? def.map((d) => ({
                  key: d.key,
                  x: d.x,
                  y: d.y,
                  selected: d.key === selectedDefenderKey,
                  assignment: d.assignment ? { ...d.assignment } : null,
                  rush: d.rush,
                  spy: d.spy,
                  blitz: d.blitz,
                  gapTarget: DefensivePresnap.gapTarget(d, off, playStart),
                }))
              : [],
          art:
            phase === "presnap" &&
            !specialState &&
            !(gameStarted && controlMode === "defense")
              ? off
                  .filter((p) => p.route?.length)
                  .map((p) => ({
                    key: p.key,
                    start: [p.x, p.y],
                    points: p.route,
                  }))
              : [],
        });
      } catch (err) {
        recoverFrom3DFailure(err);
      }
    }
    placeReceiverPins(v);
    placeActionCues(v);
  }
  function mount() {
    try {
      renderer3d = createGridironRenderer($("render3d"));
    } catch (e) {
      reportDiagnostic?.("warn", "WebGL view unavailable; using 2D", e);
    }
    $("render3d").addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      recoverFrom3DFailure(new Error("WebGL context lost"));
    });
    setVisualMode(renderer3d ? "3d" : "2d");
  }
  return {
    mount,
    resize,
    view,
    render,
    setVisualMode,
    getVisualMode: () => visualMode,
    getVisual: () => renderer3d?.getDebugState?.() || null,
  };
}
