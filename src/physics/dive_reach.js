import { clampFinite as clamp } from "../core/math.js";
// CHAOS original procedural diving reach shared by visuals and anatomy.
// Locomotion physics and tackle outcomes remain authoritative elsewhere.
const ease = (t) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
function pose(p) {
  const action = p.action?.time > 0 ? p.action.kind : "";
  if (action !== "tackle-dive" && action !== "dive") return null;
  const age = Math.max(0, p.action?.age || 0);
  const duration = action === "tackle-dive" ? 0.53 : 0.44;
  const progress = clamp(age / duration, 0, 1);
  // Launch starts with hands low. Extend gradually during flight, not in one frame.
  const extension = ease((progress - 0.035) / 0.54);
  // This signal is set by the actual tackle solver when a contact is made;
  // no bending/grabbing merely because the defender is mid-dive.
  const engaged = action === "tackle-dive" && p.action?.used === true;
  const contactAge = Number.isFinite(p.action?.contactAge)
    ? p.action.contactAge
    : Math.max(0, age - 0.1);
  const wrap = engaged ? ease((age - contactAge) / 0.14) : 0;
  // Positive shoulder rotation aims both upper arms forward; near-zero
  // elbow relative rotation keeps forearms straight until contact.
  return Object.freeze({
    progress,
    extension,
    wrap,
    bodyPitch: -0.76 * Math.sin(Math.PI * 0.5 * progress),
    // 135 degrees measured upward from a hanging arm (180 = overhead).
    // Higher forearm reach brings hands in before the helmet in a dive.
    shoulder: 2.35619449 * extension,
    elbow: -0.065 - 0.18 * wrap,
    inward: 0.18 * wrap,
    lead: extension > 0.01,
    engaged,
  });
}
// Local coords match the renderer: x forward, z height, l lateral.
// All segments share the same shoulder/elbow geometry as the WebGL rig.
function standingPose(p) {
  // A live controlled standing wrap holds the hands forward at chest height,
  // not down at the hips. It is separate from the diving launch.
  if (p.ground || (p.action?.kind === "tackle-dive" && p.action?.time > 0))
    return null;
  const engaging =
    (p.wrapReach || 0) > 0.01 ||
    p.intent === "wrap" ||
    (p.technique === "wrap" &&
      p.action?.kind === "conservative" &&
      p.action?.time > 0);
  if (!engaging) return null;
  // Reach is accumulated by the live tackle-approach observer (no pose-time
  // snapping); Contact Lab supplies the same signal from its scripted path.
  // The fallback preserves compatibility with explicitly posed test athletes.
  const extension = ease(
    p.wrapReach === undefined ? 1 : clamp(p.wrapReach, 0, 1),
  );
  const gripped = p.intent === "wrap" && p.wrapLinked === true;
  const wrap = gripped ? extension * 0.45 : 0;
  return Object.freeze({
    progress: extension,
    extension,
    wrap,
    bodyPitch: 0,
    shoulder: (Math.PI / 2) * extension,
    elbow: -0.06 * extension - 0.12 * wrap,
    inward: 0.16 * wrap,
    lead: extension > 0.01,
    engaged: gripped,
    standing: true,
  });
}
function armPoints(p, side, breadth) {
  const a = pose(p) || standingPose(p);
  if (!a) return null;
  const l = side * 0.36 * breadth;
  const shoulder = [0, l, 1.57];
  const upperLen = 0.43,
    foreLen = 0.43;
  const elbow = [
    Math.sin(a.shoulder) * upperLen,
    l,
    1.57 - Math.cos(a.shoulder) * upperLen,
  ];
  const direction = a.shoulder + a.elbow;
  const inward = side * foreLen * Math.sin(a.inward); // move toward the centerline
  const wrist = [
    elbow[0] + foreLen * Math.sin(direction) * Math.cos(a.inward),
    l - inward,
    elbow[2] - foreLen * Math.cos(direction),
  ];
  const hand = [
    wrist[0] + 0.13 * Math.sin(direction),
    wrist[1] - side * 0.02 * a.wrap,
    wrist[2] - 0.13 * Math.cos(direction),
  ];
  return { shoulder, elbow, wrist, hand, pose: a };
}
export const ChaosDiveReach = Object.freeze({ pose, standingPose, armPoints });
