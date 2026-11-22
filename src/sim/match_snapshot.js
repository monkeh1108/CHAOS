const SNAPSHOT_VERSION = 2;

function invalidSnapshot() {
  return new TypeError("Invalid CHAOS match snapshot");
}

export function captureMatchSnapshot(state) {
  const nodes = [];
  const ids = new Map();

  function encode(value) {
    if (value === undefined) return ["undefined"];
    if (typeof value === "number") {
      if (Object.is(value, -0)) return ["number", "-0"];
      if (!Number.isFinite(value)) return ["number", String(value)];
      return value;
    }
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      return value;
    }
    if (typeof value !== "object")
      throw new TypeError("Unsupported match state value");

    if (ids.has(value)) return ["ref", ids.get(value)];
    const id = nodes.length;
    ids.set(value, id);
    // Reserve the slot first so shared and circular references keep their identity.
    const node = {};
    nodes.push(node);
    if (Array.isArray(value)) {
      node.kind = "array";
      node.values = Array.from(value, encode);
    } else if (value instanceof Map) {
      node.kind = "map";
      node.values = Array.from(value, ([key, entry]) => [
        encode(key),
        encode(entry),
      ]);
    } else if (value instanceof Set) {
      node.kind = "set";
      node.values = Array.from(value, encode);
    } else {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== null && prototype !== Object.prototype) {
        throw new TypeError("Unsupported match state object");
      }
      node.kind = prototype === null ? "dictionary" : "object";
      node.values = Object.entries(value).map(([key, entry]) => [
        key,
        encode(entry),
      ]);
    }
    return ["ref", id];
  }

  const root = encode(state);
  return { version: SNAPSHOT_VERSION, root, nodes };
}

export function readMatchSnapshot(snapshot) {
  if (
    snapshot?.version !== SNAPSHOT_VERSION ||
    !Array.isArray(snapshot.nodes)
  ) {
    throw invalidSnapshot();
  }

  const nodes = snapshot.nodes.map((node) => {
    if (!Array.isArray(node?.values)) throw invalidSnapshot();
    switch (node.kind) {
      case "array":
        return [];
      case "map":
        return new Map();
      case "set":
        return new Set();
      case "dictionary":
        return Object.create(null);
      case "object":
        return {};
      default:
        throw invalidSnapshot();
    }
  });

  function decode(value) {
    if (!Array.isArray(value)) {
      if (
        value === null ||
        ["string", "boolean", "number"].includes(typeof value)
      ) {
        return value;
      }
      throw invalidSnapshot();
    }
    const [type, entry] = value;
    if (type === "undefined" && value.length === 1) return undefined;
    if (
      type === "number" &&
      ["-0", "NaN", "Infinity", "-Infinity"].includes(entry)
    ) {
      return Number(entry);
    }
    if (
      type === "ref" &&
      Number.isInteger(entry) &&
      entry >= 0 &&
      entry < nodes.length
    ) {
      return nodes[entry];
    }
    throw invalidSnapshot();
  }

  for (const [index, node] of snapshot.nodes.entries()) {
    const target = nodes[index];
    if (node.kind === "array") {
      for (const value of node.values) target.push(decode(value));
    } else if (node.kind === "map") {
      for (const [key, value] of node.values)
        target.set(decode(key), decode(value));
    } else if (node.kind === "set") {
      for (const value of node.values) target.add(decode(value));
    } else {
      for (const [key, value] of node.values) {
        if (typeof key !== "string" || Object.hasOwn(target, key))
          throw invalidSnapshot();
        Object.defineProperty(target, key, {
          value: decode(value),
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
    }
  }

  return decode(snapshot.root);
}
