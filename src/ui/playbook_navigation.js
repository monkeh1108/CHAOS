// V33: pure selection geometry; the engine owns actual DOM focus and callbacks.
export const PlaybookNavigation = Object.freeze({
  move(index, length, columns, direction) {
    if (length < 1) return 0;
    const cols = Math.max(1, columns | 0),
      i = Math.max(0, Math.min(length - 1, index));
    const delta =
      direction === "up"
        ? -cols
        : direction === "down"
          ? cols
          : direction === "left"
            ? -1
            : direction === "right"
              ? 1
              : 0;
    return Math.max(0, Math.min(length - 1, i + delta));
  },
  cycle(values, current, direction) {
    if (!values.length) return current;
    const index = Math.max(0, values.indexOf(current));
    return values[(index + direction + values.length) % values.length];
  },
});
