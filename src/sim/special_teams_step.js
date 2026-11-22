import { clamp, distance2D as dist } from "../core/math.js";

export function createSpecialTeamsStep() {
  let H,
    P,
    applyMotion,
    autoCarry,
    backupReturnerLeadBlock,
    coverReturnAI,
    finishReturn,
    hud,
    isFreeKick,
    manualAthlete,
    matchState,
    message,
    resolveBlocks,
    resolveTackles,
    returnBlockerAI,
    setDriveSpot,
    spotText,
    steer,
    stickInput,
    tickGround,
    userCarry;

  // Shared grounded follow-through for genuinely missed defender dives.
  // Special-team coverage previously dropped the expired action immediately,
  // unlike scrimmage play, leaving return tacklers running through the miss.
  function finishMissedDefenderDive(p) {
    if (p.team !== 1 || p.action?.kind !== "tackle-dive" || p.action.used)
      return false;
    p.ground = {
      stage: "winded",
      time: 0.24,
      fall: 0,
      rest: 0.24,
      rise: 0.38,
      age: 0,
      force: 0,
      from: "missed-dive",
      kind: "missed-dive",
      severity: 0,
    };
    p.groundLock = 0;
    p.vx *= 0.38;
    p.vy *= 0.38;
    p.stun = Math.max(p.stun, 0.28);
    p.tackleCooldown = Math.max(p.tackleCooldown, 0.87);
    p.intent = "recover-dive";
    return true;
  }

  function stepSpecial(dt) {
    const k = matchState.specialState;
    if (!k || matchState.phase !== "live") return;
    matchState.playClock += dt;
    matchState.totalClock += dt;
    k.elapsed += dt;
    // Special teams must advance the same fall/winded/rise state as scrimmage.
    // Otherwise a coverage athlete knocked down by the first return block
    // remains grounded for the entire return, regardless of pursuit commands.
    const grounded = new Set();
    for (const p of matchState.players)
      if (tickGround(p, dt)) grounded.add(p.key);
    // Special teams and scrimmage share transient visual cue expiration.
    // Previously a kickoff BREAK TACKLE cue stayed visible forever, even when
    // the runner was ten yards away; this is presentation, not contact state.
    for (const p of matchState.players) {
      if (p.actionCue) {
        p.actionCue.time -= dt;
        if (p.actionCue.time <= 0) p.actionCue = null;
      }
      if (p.airPose) {
        p.airPose.time -= dt;
        p.airPose.age = (p.airPose.age || 0) + dt;
        if (p.airPose.time <= 0) p.airPose = null;
      }
      if (p.action) {
        p.action.time -= dt;
        p.action.age = (p.action.age || 0) + dt;
        if (p.action.time <= 0) {
          finishMissedDefenderDive(p);
          p.action = null;
        }
      }
    }
    let ret = P(k.returnerKey) || P("RB");
    const secondary = P(k.backupReturnerKey);
    if (!k.returning) {
      if (matchState.ball && !k.landed) {
        const f = Math.min(1, k.elapsed / k.airtime);
        matchState.ball.t = k.elapsed;
        // Ball follows a simplified flight trajectory, independent of returner movement.
        matchState.ball.x +=
          (k.landingX - matchState.ball.x) *
          Math.min(1, dt / Math.max(0.015, k.airtime - k.elapsed));
        matchState.ball.y +=
          (k.targetY - matchState.ball.y) *
          Math.min(1, dt / Math.max(0.015, k.airtime - k.elapsed));
        matchState.ball.z = Math.max(0.18, 0.18 + 8 * 4 * f * (1 - f));
      } else if (matchState.ball && k.landed) {
        k.groundElapsed += dt;
        matchState.ball.x += matchState.ball.vx * dt;
        matchState.ball.y += matchState.ball.vy * dt;
        matchState.ball.vx *= Math.exp(-2.1 * dt);
        matchState.ball.vy *= Math.exp(-2.3 * dt);
        // Temporary damped bounce and roll; full impact/orientation/spin physics are future work.
        matchState.ball.z =
          0.18 +
          0.85 *
            Math.abs(Math.sin(k.groundElapsed * 11)) *
            Math.exp(-3.2 * k.groundElapsed);
      }
      // Only deep returners can move before the landing. Coverage and the
      // receiving setup line stay planted until the kick is touched/lands.
      if (isFreeKick(k) || (k.kind === "punt" && k.landed)) {
        const aim =
          k.landed && matchState.ball
            ? matchState.ball
            : { x: k.landingX, y: k.targetY };
        ret.intent = k.landed ? "recover-loose-kick" : "track-kick";
        steer(ret, aim.x - ret.x, aim.y - ret.y, dt, 1.01);
        if (secondary) {
          // Backup returner is a genuine alternative to fielding a wide kick,
          // but stays off the primary athlete's collision line until it drops.
          const offSide = secondary.y < ret.y ? -1 : 1;
          const backupY = clamp(aim.y + offSide * 2.6, 2, H - 2);
          secondary.intent = k.landed
            ? "recover-loose-kick"
            : "second-returner";
          steer(
            secondary,
            aim.x + 2.2 - secondary.x,
            backupY - secondary.y,
            dt,
            0.98,
          );
        }
        if (k.landed && matchState.ball) {
          // Both units release when the kick first touches down, not only after
          // a returner has collected it. Keep existing tackle/contact rules.
          const claimed = new Set();
          for (const o of matchState.off) {
            if (o !== ret && o !== secondary && !grounded.has(o.key))
              returnBlockerAI(o, ret, dt, claimed);
          }
          for (const d of matchState.def) {
            if (d.key === "K" || grounded.has(d.key)) continue;
            d.intent = "loose-kick-coverage";
            steer(
              d,
              matchState.ball.x - d.x,
              matchState.ball.y - d.y,
              dt,
              0.97,
            );
          }
          resolveBlocks(dt);
        }
        applyMotion(dt);
      }
      if (k.kind === "punt" && k.elapsed < k.airtime) {
        ret.intent = "punt-track-kick";
        steer(ret, k.landingX - ret.x, k.targetY - ret.y, dt, 0.96);
        for (const d of matchState.def) {
          if (d.key === "K") continue;
          d.intent = "punt-cover";
          steer(d, ret.x - d.x, ret.y - d.y, dt, 0.99);
        }
        const claimed = new Set();
        for (const o of matchState.off) {
          if (o !== ret) returnBlockerAI(o, ret, dt, claimed);
        }
        resolveBlocks(dt);
        applyMotion(dt);
      }
      if (k.elapsed >= k.airtime && !k.landed) {
        if (isFreeKick(k) && k.landingX > 30) {
          setDriveSpot(matchState.possession, 50);
          finishReturn(
            "fair",
            matchState.yard,
            "Kick short of landing zone · receiving team ball at own 40",
          );
          return;
        }
        // Never pre-award a free kick just because it reaches the end zone.
        // Check for a physically nearby returner after landing first; if no one
        // fields it, ordinary free-kick touchback rules still apply below.
        if (k.kind === "punt" && k.landingX <= 10) {
          finishReturn("touchback", 30, "Punt touchback · own 20");
          return;
        }
        k.landed = true;
        k.groundElapsed = 0;
        // Simplified short roll toward the receiver's goal line. If nobody got
        // underneath the kick, the ball remains loose and the returners must run.
        if (matchState.ball) {
          matchState.ball.x = k.landingX;
          matchState.ball.y = k.targetY;
          matchState.ball.z = 0.18;
          matchState.ball.vx = -3.0;
          matchState.ball.vy = 0;
        }
      }
      if (matchState.ball) {
        // The nearest deep player can actually recover the loose kick. Never
        // change any athlete's x/y here: possession requires physical proximity.
        const candidates = [ret, secondary].filter(Boolean);
        const touched = candidates.find(
          (p) =>
            !p.ground &&
            dist(p, matchState.ball) < 1.55 &&
            matchState.ball.z < 1.25,
        );
        if (touched) {
          if (matchState.returnFairCatch && k.kind === "punt") {
            finishReturn(
              "fair",
              touched.x,
              `Fair catch · ${spotText(touched.x)}`,
            );
            return;
          }
          k.returning = true;
          // Whichever deep player actually fields the ball becomes the carrier.
          // The OTHER deep player becomes the designated lead-return escort.
          // Keeping backupReturnerKey pointing at the new carrier skipped this
          // critical role swap on alternate-returner catches.
          const formerPrimary = k.returnerKey;
          if (touched.key === k.backupReturnerKey)
            k.backupReturnerKey = formerPrimary;
          k.returnerKey = touched.key;
          ret = touched; // The remainder of this frame must use the actual carrier.
          const newEscort = P(k.backupReturnerKey);
          if (newEscort) {
            newEscort.intent = "lead-return-escort";
            newEscort.intentTarget = touched.key;
          }
          // Kickoffs/safety kicks caught inside the end zone remain playable.
          // User choice: steer within 2 s to return, or remain neutral for a
          // convenient automatic touchback. This 2-second timer is a GAME INPUT
          // convenience, not an NFL dead-ball rule.
          k.returnCaughtInEndzone = isFreeKick(k) && touched.x <= 10.05;
          k.returnTouchbackSpot = k.landingX <= 10 ? 45 : 30;
          k.advancedOutOfEndzone = false;
          k.touchbackWindow =
            k.returnCaughtInEndzone && matchState.controlMode === "offense";
          k.returnCommitted = !k.touchbackWindow;
          k.touchbackElapsed = 0;
          matchState.gameFlowNote = k.touchbackWindow
            ? "END ZONE · MOVE TO RETURN OR WAIT 2s FOR TOUCHBACK"
            : "Kick return in progress";
          matchState.ballCarrier = touched;
          matchState.active =
            matchState.controlMode === "defense"
              ? P(matchState.selectedDefenderKey)
              : touched;
          touched.touches++;
          matchState.ball = null;
          matchState.clockRunning = true;
          touched.vx = k.touchbackWindow ? 0 : touched.vx;
          touched.vy = k.touchbackWindow ? 0 : touched.vy;
          message(
            k.touchbackWindow
              ? "<strong>END-ZONE CATCH.</strong> Move to return, or stay still for 2 seconds for a touchback."
              : "<strong>RETURN!</strong> " +
                  (k.returnCall || "middle").toUpperCase() +
                  " wedge · " +
                  touched.name +
                  " fields the kick.",
          );
        } else if (k.landed && matchState.ball.x <= 10.05) {
          // A direct kick to the end zone earns the 35; a ball first bouncing
          // in the landing zone and then entering the end zone earns the 20.
          const spot = isFreeKick(k) ? (k.landingX <= 10 ? 45 : 30) : 30;
          finishReturn(
            "touchback",
            spot,
            "Unfielded kick enters end zone · touchback at own " + (spot - 10),
          );
          return;
        } else if (
          k.landed &&
          (matchState.ball.y <= 0.1 || matchState.ball.y >= H - 0.1)
        ) {
          finishReturn(
            "out",
            matchState.ball.x,
            "Loose kick rolls out of bounds",
          );
          return;
        }
      }
      if (!k.returning) return;
    }
    if (k.returnCaughtInEndzone && ret.x > 10.1 && k.returnCommitted)
      k.advancedOutOfEndzone = true;
    if (k.touchbackWindow && !k.returnCommitted) {
      if (stickInput().mag > 0.12) {
        k.returnCommitted = true;
        k.touchbackWindow = false;
        matchState.gameFlowNote = "Kick return in progress";
        message(
          "<strong>RETURN OUT!</strong> " +
            ret.name +
            " elects to return the kickoff.",
        );
      } else {
        k.touchbackElapsed += dt;
        if (k.touchbackElapsed >= 2.0) {
          finishReturn(
            "touchback",
            k.returnTouchbackSpot || 45,
            "Returner stays in end zone · automatic touchback",
          );
          return;
        }
        matchState.gameFlowNote =
          "END ZONE · MOVE TO RETURN · TOUCHBACK IN " +
          Math.max(0, 2 - k.touchbackElapsed).toFixed(1) +
          "s";
      }
    }
    const claimed = new Set();
    for (const o of matchState.off) {
      if (grounded.has(o.key)) continue;
      if (o === ret) {
        if (k.touchbackWindow && !k.returnCommitted) {
          // Existing auto-carry would otherwise run out of the end zone without
          // input, making the requested voluntary touchback impossible.
          o.intent = "endzone-choice";
          o.intentTarget = "touchback-or-return";
          o.vx = 0;
          o.vy = 0;
        } else if (matchState.controlMode === "offense") userCarry(o, dt);
        else autoCarry(o, dt);
        continue;
      }
      if (o.key === k.backupReturnerKey)
        backupReturnerLeadBlock(o, ret, dt, claimed);
      else returnBlockerAI(o, ret, dt, claimed);
    }
    for (const d of matchState.def) {
      if (grounded.has(d.key)) continue;
      if (d.key === "K") {
        coverReturnAI(d, ret, dt);
        continue;
      }
      if (
        matchState.controlMode === "defense" &&
        d.key === matchState.selectedDefenderKey &&
        stickInput().mag > 0.13
      )
        manualAthlete(d, dt, "user-defense");
      else coverReturnAI(d, ret, dt);
    }
    resolveBlocks(dt);
    applyMotion(dt);
    if (ret.x >= 109.8) {
      finishReturn(
        "touchdown",
        110,
        `${ret.name} brings the kick all the way back!`,
      );
      return;
    }
    if (ret.y <= 0.1 || ret.y >= H - 0.1) {
      finishReturn("out", ret.x, `Returner steps out at ${spotText(ret.x)}`);
      return;
    }
    if (matchState.contactEnabled) resolveTackles(ret, dt);
    // A live return ends only on a football dead-ball event, never a wall-clock cutoff.
    if (k.elapsed % 0.2 < dt) hud();
  }

  return {
    bind(services) {
      ({
        H,
        P,
        applyMotion,
        autoCarry,
        backupReturnerLeadBlock,
        coverReturnAI,
        finishReturn,
        hud,
        isFreeKick,
        manualAthlete,
        matchState,
        message,
        resolveBlocks,
        resolveTackles,
        returnBlockerAI,
        setDriveSpot,
        spotText,
        steer,
        stickInput,
        tickGround,
        userCarry,
      } = services);
    },
    finishMissedDefenderDive,
    stepSpecial,
  };
}
