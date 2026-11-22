import { clampFinite as clamp } from "../core/math.js";
// CHAOS original grip attachment policy. Never teleports a player or decides
// a tackle: it produces bounded velocity changes while an earned link exists.
// Contact accuracy is distinct from general tackling skill. It combines
// actual anatomical placement, facing, approach quality and skill; the score
// influences a hold, but never manufactures contact or declares a tackle.
function contactQuality(contact, defender, hit, style) {
  if (!contact || contact.kind === "miss" || contact.kind === "light contact")
    return 0;
  const placement = contact.armOnBody ? 1 : contact.bodyContact ? 0.74 : 0.3;
  const overlap = clamp((contact.penetration || 0) / 0.3, 0, 1);
  const facing = clamp(1 - (contact.approachAngle || 0) / 190, 0.05, 1);
  const control = clamp(0.55 + (hit?.advantage || 0) * 0.012, 0.28, 1);
  // TAK encodes grip technique until CHAOS has an independently defined,
  // differentiated GRIP rating. AWR reflects visual targeting and timing.
  const technique = clamp(
    ((defender?.TAK || 70) * 0.72 + (defender?.AWR || 70) * 0.28) / 85,
    0.55,
    1.16,
  );
  const styleFit =
    style === "wrap"
      ? 1.08
      : style === "dive"
        ? 0.93
        : style === "hit"
          ? 0.59
          : 0.79;
  return clamp(
    (0.22 +
      placement * 0.28 +
      overlap * 0.22 +
      facing * 0.16 +
      control * 0.12) *
      technique *
      styleFit,
    0.18,
    1.25,
  );
}
function step(runner, defender, link, dt, runnerRadius, defenderRadius) {
  if (!runner || !defender || !link || dt <= 0)
    return { active: false, reason: "missing" };
  const dx = runner.x - defender.x,
    dy = runner.y - defender.y;
  const distance = Math.max(0.0001, Math.hypot(dx, dy));
  const nx = dx / distance,
    ny = dy / distance;
  const grip = clamp(link.grip || 0, 0, 1.6);
  // A weak brush does not attach. The slack models extended arms and the
  // runner's body; the coupling only becomes meaningful as grip develops.
  if (grip < 0.3) return { active: false, reason: "unsecured", distance };
  const rest = clamp((runnerRadius + defenderRadius) * 0.9 + 0.1, 0.44, 1.2);
  const slack = clamp(0.42 - (grip - 0.3) * 0.19, 0.18, 0.42);
  const stretch = Math.max(0, distance - rest - slack);
  const maxStretch =
    rest + slack + clamp(0.52 + (1.6 - grip) * 0.19, 0.52, 0.82);
  // This reports a stretched grip for the existing release logic to assess;
  // there is no snapping, position correction, or unbreakable constraint.
  if (distance > maxStretch)
    return { active: false, reason: "overextended", distance, maxStretch };
  const massRunner = clamp(runner.w || 215, 130, 400),
    massDef = clamp(defender.w || 220, 130, 400);
  const skill = clamp(
    0.32 + (defender.TAK || 70) * 0.004 + (defender.STR || 70) * 0.0025,
    0.55,
    0.97,
  );
  const accuracy = clamp(link.quality ?? 1, 0.18, 1.25);
  const strength = clamp((grip - 0.24) * skill * accuracy, 0, 1.25);
  const separationRate =
    (runner.vx - defender.vx) * nx + (runner.vy - defender.vy) * ny;
  // Damped spring: the further apart they pull, the harder the defender
  // works to keep up. The defender bears most of the impulse; the runner
  // retains a chance to drag him for extra yards.
  const pull = clamp(
    (stretch * 17 + Math.max(0, separationRate) * 2.6) * strength,
    0,
    15.0,
  );
  const impulse = pull * dt;
  const defenderDelta = impulse * clamp(massRunner / massDef, 0.58, 1.65);
  const runnerDelta = impulse * clamp(massDef / massRunner, 0.55, 1.45) * 0.32;
  defender.vx += nx * defenderDelta;
  defender.vy += ny * defenderDelta;
  runner.vx -= nx * runnerDelta;
  runner.vy -= ny * runnerDelta;
  return { active: true, distance, stretch, force: pull, grip, rest, slack };
}
export const ChaosGripAttachment = Object.freeze({ step, contactQuality });
