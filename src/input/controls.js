// The Standard Gamepad layout uses physical Xbox button positions.
export const XBOX = Object.freeze({
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  VIEW: 8,
  MENU: 9,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
});

export function readFieldControls(keys, touch, pad, viewMode, playerSlot) {
  const keyboardX =
    Number(!!(keys.d || keys.arrowright)) -
    Number(!!(keys.a || keys.arrowleft));
  const keyboardY =
    Number(!!(keys.s || keys.arrowdown)) - Number(!!(keys.w || keys.arrowup));
  const screenX = keyboardX + (touch.x + pad.lx);
  const screenY = keyboardY + (touch.y + pad.ly);
  const magnitude = Math.hypot(screenX, screenY);
  const scale = Math.max(1, magnitude);
  const x = screenX / scale;
  const y = screenY / scale;
  return {
    type: "controls",
    playerSlot,
    move:
      viewMode === "3d"
        ? { x: -y, y: x, mag: Math.min(1, magnitude) }
        : { x, y, mag: Math.min(1, magnitude) },
    sprint: !!keys.shift || (pad.connected && pad.rt > 0.24),
    conservative: !!keys.z || !!(pad.connected && pad.previous[XBOX.A]),
    quarterbackMoves: pad.lt > 0.45 || !!keys.alt,
  };
}
