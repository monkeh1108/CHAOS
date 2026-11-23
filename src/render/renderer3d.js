import { RUN_LANDMARKS } from "../sim/match_config.js";
import { ChaosDiveReach } from "../physics/dive_reach.js";
import { ChaosLowContact } from "../physics/low_contact.js";
import {
  AnimationPolicy,
  armArticulation,
  jukeBody,
  jukeLegTarget,
  runningBody,
  runningCycle,
  runningLegTarget,
  runningWeight,
  solveGroundedLeg,
  upperBodyArticulation,
} from "./animation_policy.js";

// Original lightweight WebGL renderer. No network, textures, assets, or
// third-party packages. It only reads simulation state; never resolves contact.
export function createGridironRenderer(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    depth: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  const vs = `
    attribute vec3 aPos;
    attribute vec3 aNormal;
    uniform mat4 uMVP;
    uniform mat4 uModel;
    // Bend, inward twist, lateral build, and forearm length.
    uniform vec4 uLimb;
    uniform float uBendSpan;
    varying float vShade;

    vec3 turnLimb(vec3 v, float weight) {
      float twist = uLimb.y * weight;
      float ct = cos(twist), st = sin(twist);
      v = vec3(ct * v.x + st * v.z, v.y, ct * v.z - st * v.x);
      float bend = uLimb.x * weight;
      float cb = cos(bend), sb = sin(bend);
      return vec3(cb * v.x - sb * v.y, sb * v.x + cb * v.y, v.z);
    }

    void main() {
      vec3 point = aPos;
      vec3 normal = aNormal;
      if (uLimb.w > 0.0) {
        // Rotate the cross-sections through the bend without shrinking them.
        float span = uBendSpan;
        float y = aPos.y;
        if (y < -span) {
          y = -span + (y + span) * (uLimb.w - span) / (0.34 - span);
        }
        float blend = clamp((span - y) / (2.0 * span), 0.0, 1.0);
        vec3 radial = vec3(aPos.x, 0.0, aPos.z * uLimb.z);
        vec3 center = vec3(0.0, y, 0.0);
        if (y < -span) {
          center = turnLimb(center, 1.0);
        } else if (y < span) {
          float before = 1.0 - blend;
          center = before * before * vec3(0.0, span, 0.0) +
                   blend * blend * turnLimb(vec3(0.0, -span, 0.0), 1.0);
        }
        point = center + turnLimb(radial, blend);
        normal = turnLimb(vec3(normal.x, normal.y, normal.z / uLimb.z), blend);
      }
      mat3 axes = mat3(uModel);
      vec3 mag2 = vec3(dot(axes[0], axes[0]), dot(axes[1], axes[1]), dot(axes[2], axes[2]));
      vec3 n = normalize(axes * (normal / max(mag2, vec3(0.00001))));
      vShade = 0.59 + 0.41 * max(0.0, dot(n, normalize(vec3(-0.45, 1.0, 0.35))));
      gl_Position = uMVP * vec4(point, 1.0);
    }`;
  const fs = `precision mediump float;uniform vec3 uColor;varying float vShade;void main(){gl_FragColor=vec4(uColor*vShade,1.0);}`;
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  const attrPos = gl.getAttribLocation(prog, "aPos"),
    attrNormal = gl.getAttribLocation(prog, "aNormal");
  const uMVP = gl.getUniformLocation(prog, "uMVP"),
    uModel = gl.getUniformLocation(prog, "uModel"),
    uColor = gl.getUniformLocation(prog, "uColor");
  const uLimb = gl.getUniformLocation(prog, "uLimb"),
    uBendSpan = gl.getUniformLocation(prog, "uBendSpan");
  // WebGL vertex arrays start disabled. Without enabling them, all mesh triangles
  // collapse to one point and only the flat background clear color is visible.
  if (attrPos < 0 || attrNormal < 0)
    throw Error("Required 3D vertex inputs missing");
  gl.enableVertexAttribArray(attrPos);
  gl.enableVertexAttribArray(attrNormal);
  const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const mul = (a, b) => {
    const o = new Array(16).fill(0);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return o;
  };
  const trans = (x, y, z) => {
    const m = I();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
  };
  const scale = (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
  const rotY = (t) => {
    const c = Math.cos(t),
      s = Math.sin(t);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  };
  const rotZ = (t) => {
    const c = Math.cos(t),
      s = Math.sin(t);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  };
  const rotX = (t) => {
    const c = Math.cos(t),
      s = Math.sin(t);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  };
  const at = (m, x, y, z) => mul(m, trans(x, y, z));
  // A joint rotates around an anchor in the parent's model space. The neutral
  // transform is shared so static players add no extra matrix work.
  function rotateAtHeight(parent, height, yaw, pitch) {
    if (!yaw && !pitch) return parent;
    let rotation = rotY(yaw);
    if (pitch) rotation = mul(rotation, rotZ(pitch));
    return at(mul(at(parent, 0, height, 0), rotation), 0, -height, 0);
  }
  const norm = (v) => {
    const l = Math.hypot(...v) || 1;
    return v.map((x) => x / l);
  };
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2),
      r = 1 / (near - far);
    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * r,
      -1,
      0,
      0,
      2 * far * near * r,
      0,
    ];
  }
  function lookAt(eye, center) {
    const z = norm(eye.map((v, i) => v - center[i])),
      x = norm([z[2], 0, -z[0]]),
      y = norm([
        z[1] * x[2] - z[2] * x[1],
        z[2] * x[0] - z[0] * x[2],
        z[0] * x[1] - z[1] * x[0],
      ]);
    return [
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -x.reduce((v, t, i) => v + t * eye[i], 0),
      -y.reduce((v, t, i) => v + t * eye[i], 0),
      -z.reduce((v, t, i) => v + t * eye[i], 0),
      1,
    ];
  }
  function mesh(arr) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    return { b, n: arr.length / 6 };
  }
  const cube = [];
  const faces = [
    {
      n: [0, 0, 1],
      v: [
        [-0.5, -0.5, 0.5],
        [0.5, -0.5, 0.5],
        [0.5, 0.5, 0.5],
        [-0.5, 0.5, 0.5],
      ],
    },
    {
      n: [0, 0, -1],
      v: [
        [0.5, -0.5, -0.5],
        [-0.5, -0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [0.5, 0.5, -0.5],
      ],
    },
    {
      n: [1, 0, 0],
      v: [
        [0.5, -0.5, 0.5],
        [0.5, -0.5, -0.5],
        [0.5, 0.5, -0.5],
        [0.5, 0.5, 0.5],
      ],
    },
    {
      n: [-1, 0, 0],
      v: [
        [-0.5, -0.5, -0.5],
        [-0.5, -0.5, 0.5],
        [-0.5, 0.5, 0.5],
        [-0.5, 0.5, -0.5],
      ],
    },
    {
      n: [0, 1, 0],
      v: [
        [-0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, -0.5],
        [-0.5, 0.5, -0.5],
      ],
    },
    {
      n: [0, -1, 0],
      v: [
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [0.5, -0.5, 0.5],
        [-0.5, -0.5, 0.5],
      ],
    },
  ];
  for (const f of faces)
    for (const j of [0, 1, 2, 0, 2, 3]) cube.push(...f.v[j], ...f.n);
  const ball = [];
  const rings = 7,
    segments = 10;
  for (let v = 0; v < rings; v++)
    for (let u = 0; u < segments; u++) {
      const pt = (a, b) => {
        const theta = (a / rings) * Math.PI,
          phi = (b / segments) * Math.PI * 2;
        return [
          Math.sin(theta) * Math.cos(phi) * 0.5,
          Math.cos(theta) * 0.5,
          Math.sin(theta) * Math.sin(phi) * 0.5,
        ];
      };
      const a = pt(v, u),
        b = pt(v + 1, u),
        c = pt(v + 1, u + 1),
        d = pt(v, u + 1);
      for (const p of [a, b, c, a, c, d]) ball.push(...p, ...norm(p));
    }
  // Ring profiles give the jersey a waist and shoulder line and keep the
  // limb segments rounded at the joint while narrowing toward the wrist.
  function profileMesh(rings, materialBreak = 0) {
    const vertices = [];
    const sides = 10;
    const step = (2 * Math.PI) / sides;
    const row = rings.map(([y, radius], i) => {
      const [loY, loR] = rings[Math.max(0, i - 1)];
      const [hiY, hiR] = rings[Math.min(rings.length - 1, i + 1)];
      const slope = (loR - hiR) / (hiY - loY);
      return Array.from({ length: sides }, (_, j) => {
        const angle = j * step;
        const x = Math.cos(angle),
          z = Math.sin(angle);
        return [x * radius, y, z * radius, ...norm([x, slope, z])];
      });
    });
    for (let i = 0; i < row.length - 1; i++) {
      const lower = row[i],
        upper = row[i + 1];
      for (let j = 0; j < sides; j++) {
        const k = (j + 1) % sides;
        vertices.push(...lower[j], ...upper[j], ...upper[k]);
        vertices.push(...lower[j], ...upper[k], ...lower[k]);
      }
    }
    return { ...mesh(vertices), seam: materialBreak * 6 * sides };
  }
  const meshes = {
    box: mesh(cube),
    sphere: mesh(ball),
    arm: profileMesh(
      [
        [-0.34, 0.037],
        [-0.27, 0.051],
        [-0.16, 0.078],
        [-0.12, 0.076],
        [-0.06, 0.067],
        [0, 0.061],
        [0.06, 0.066],
        [0.12, 0.074],
        [0.19, 0.084],
        [0.32, 0.102],
        [0.39, 0.094],
        [0.43, 0.075],
      ],
      8,
    ),
    // The jersey tapers into the waist and overlaps the pants through the
    // waist pivot. The chest retains the width needed for the shoulder pads.
    glove: profileMesh([
      [-0.56, 0],
      [-0.49, 0.32],
      [-0.31, 0.49],
      [-0.03, 0.5],
      [0.2, 0.41],
      [0.37, 0.33],
      [0.43, 0],
    ]),
    torso: profileMesh([
      [-0.6, 0],
      [-0.55, 0.3],
      [-0.4, 0.35],
      [-0.19, 0.38],
      [0.04, 0.43],
      [0.24, 0.49],
      [0.37, 0.5],
      [0.46, 0.34],
      [0.5, 0],
    ]),
    pelvis: profileMesh([
      [-0.53, 0],
      [-0.42, 0.35],
      [-0.18, 0.5],
      [0.09, 0.45],
      [0.36, 0.34],
      [0.49, 0.27],
      [0.57, 0],
    ]),
    neck: profileMesh([
      [-0.56, 0],
      [-0.43, 0.5],
      [-0.17, 0.43],
      [0.19, 0.37],
      [0.43, 0.4],
      [0.54, 0],
    ]),
    leg: profileMesh([
      [-0.34, 0.056],
      [-0.3, 0.061],
      [-0.24, 0.079],
      [-0.18, 0.093],
      [-0.11, 0.084],
      [-0.055, 0.075],
      [0, 0.079],
      [0.055, 0.083],
      [0.11, 0.095],
      [0.18, 0.118],
      [0.3, 0.148],
      [0.42, 0.145],
      [0.54, 0.105],
      [0.58, 0.064],
    ]),
  };
  let markerDebug = {
    catchPoint: null,
    ballShadow: null,
    carrier: null,
    controlled: null,
    intended: null,
  };
  let viewProjection = I(),
    cameraCenter = 30,
    cameraLane = 26.65,
    cameraZoom = 0,
    w = 1,
    h = 1,
    eye = [0, 25, 75],
    cameraTarget = [0, 0, 0],
    drawCalls = 0,
    blankFrames = 0,
    renderVerified = false;
  const cameraDebug = {
    focusX: 30,
    focusY: 26.65,
    eye: [0, 25, 75],
    look: [0, 0, 0],
    zoom: 0,
    ballFlight: false,
  };
  const color = (c) => c.map((v) => v / 255);
  const C = {
    field: color([37, 106, 72]),
    fieldAlt: color([42, 115, 76]),
    end: color([18, 62, 82]),
    line: color([230, 240, 213]),
    hash: color([196, 225, 207]),
    own: color([206, 236, 93]),
    enemy: color([81, 193, 237]),
    pants: color([232, 234, 218]),
    skin: color([151, 118, 87]),
    shoe: color([22, 34, 43]),
    helmetOwn: color([233, 248, 164]),
    helmetEnemy: color([166, 234, 252]),
    shadow: color([15, 64, 52]),
    catch: color([255, 227, 111]),
    ballShadow: color([246, 251, 253]),
    controlled: color([139, 242, 250]),
    carrier: color([255, 190, 74]),
    bar: color([233, 244, 244]),
    yellow: color([255, 225, 112]),
    stands: color([24, 42, 52]),
    ball: color([141, 81, 43]),
  };
  function bindMesh(msh, model) {
    gl.uniformMatrix4fv(
      uMVP,
      false,
      new Float32Array(mul(viewProjection, model)),
    );
    gl.uniformMatrix4fv(uModel, false, new Float32Array(model));
    gl.bindBuffer(gl.ARRAY_BUFFER, msh.b);
    gl.vertexAttribPointer(attrPos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(attrNormal, 3, gl.FLOAT, false, 24, 12);
  }
  function paint(which, parent, pos, size, c) {
    const msh = meshes[which];
    bindMesh(msh, mul(at(parent, ...pos), scale(...size)));
    gl.uniform3fv(uColor, c);
    gl.drawArrays(gl.TRIANGLES, 0, msh.n);
    drawCalls++;
  }
  function drawLimb(
    msh,
    pivot,
    bend,
    twist,
    breadth,
    length,
    span,
    color,
    sleeve,
  ) {
    bindMesh(msh, pivot);
    gl.uniform4f(uLimb, bend, twist, breadth, length);
    gl.uniform1f(uBendSpan, span);
    gl.uniform3fv(uColor, color);
    gl.drawArrays(gl.TRIANGLES, 0, msh.seam || msh.n);
    drawCalls++;
    if (sleeve) {
      gl.uniform3fv(uColor, sleeve);
      gl.drawArrays(gl.TRIANGLES, msh.seam, msh.n - msh.seam);
      drawCalls++;
    }
    gl.uniform4f(uLimb, 0, 0, 0, 0);
  }
  const box = (m, pos, size, c) => paint("box", m, pos, size, c),
    sphere = (m, pos, size, c) => paint("sphere", m, pos, size, c);
  function field(LOS, first) {
    const root = I();
    for (let i = 0; i < 12; i++)
      box(
        root,
        [5 + i * 10, -0.19, 26.66],
        [10, 0.24, 53.333],
        i === 0 || i === 11 ? C.end : i % 2 ? C.field : C.fieldAlt,
      );
    for (let x = 10; x <= 110; x += 5) {
      box(root, [x, -0.041, 26.66], [0.12, 0.023, 53.3], C.line);
      for (const z of [16, 37.3])
        box(root, [x, -0.025, z], [1, 0.023, 0.12], C.hash);
    }
    for (const z of [0.16, 53.15])
      box(root, [60, -0.025, z], [100, 0.034, 0.16], C.line);
    box(root, [LOS, -0.014, 26.66], [0.12, 0.036, 53], C.enemy);
    box(root, [first, -0.013, 26.66], [0.13, 0.04, 53], C.yellow);
    // Stadium silhouette, simple tunnel and side barriers.
    for (const z of [-5, 58]) {
      box(root, [60, 0.5, z], [125, 1.0, 6], C.stands);
      box(root, [60, 1.15, z], [125, 0.1, 1], C.bar);
    }
    for (const x of [0, 120]) {
      box(root, [x, 2.25, 26.66], [0.12, 4.5, 0.12], C.yellow);
      box(root, [x, 4.5, 26.66], [0.15, 0.15, 6.5], C.yellow);
      for (const dz of [-3.25, 3.25])
        box(root, [x, 5.4, 26.66 + dz], [0.13, 1.8, 0.13], C.yellow);
    }
  }
  // Genuine 3D, turf-level play art. Unlike the old 2D canvas routes, these
  // are visible above the field in the WebGL view and follow camera perspective.
  function artStroke(a, b, c, thickness = 0.18) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz);
    if (length < 0.06) return;
    const root = mul(
      trans((a[0] + b[0]) * 0.5, 0.015, (a[1] + b[1]) * 0.5),
      rotY(-Math.atan2(dz, dx)),
    );
    box(root, [0, 0, 0], [length, 0.035, thickness], c);
  }
  function routeArt(sim) {
    if (sim.phase !== "presnap" || sim.defenseArt?.length) return;
    const track = RUN_LANDMARKS[sim.play];
    if (track) {
      const back = sim.players.find((p) => p.key === "RB");
      const quarterback = sim.players.find((p) => p.key === "QB");
      if (!back || !quarterback) return;
      const start = [back.x, back.y];
      const handoff = [quarterback.x + 0.3, quarterback.y];
      const pts = [start, handoff];
      for (const point of [track.entry, track.bend, track.finish])
        if (point) pts.push([sim.los + point[0], point[1]]);
      const tint = C.own;
      for (let i = 0; i < pts.length - 1; i++)
        artStroke(pts[i], pts[i + 1], tint, 0.22);
      const a = pts.at(-2),
        b = pts.at(-1),
        theta = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const s of [-1, 1])
        artStroke(
          b,
          [
            b[0] - 1.2 * Math.cos(theta + s * 0.54),
            b[1] - 1.2 * Math.sin(theta + s * 0.54),
          ],
          tint,
          0.23,
        );
    } else {
      for (const route of sim.art || []) {
        let prev = route.start;
        const tint = route.key === "TE" ? C.yellow : C.own;
        for (const point of route.points) {
          artStroke(prev, point, tint, 0.15);
          const theta = Math.atan2(point[1] - prev[1], point[0] - prev[0]);
          // Arrowheads help distinguish a play call from static yard lines.
          for (const s of [-1, 1])
            artStroke(
              point,
              [
                point[0] - 0.95 * Math.cos(theta + s * 0.57),
                point[1] - 0.95 * Math.sin(theta + s * 0.57),
              ],
              tint,
              0.18,
            );
          prev = point;
        }
      }
    }
  }
  // Painted at turf height so the projected catch destination and shadow can
  // be followed even when the camera tracks a high, long pass.
  function groundRing(x, z, r, c, segments = 18, width = 0.18, height = 0.05) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    for (let i = 0; i < segments; i++) {
      const theta = (2 * Math.PI * (i + 0.5)) / segments;
      const parent = mul(
        trans(x + r * Math.cos(theta), 0.058, z + r * Math.sin(theta)),
        rotY(-theta - Math.PI / 2),
      );
      box(
        parent,
        [0, 0, 0],
        [2 * r * Math.sin(Math.PI / segments) * 0.72, height, width],
        c,
      );
    }
  }
  function airAndPossessionMarkers(sim) {
    const a = sim.markerCarrier,
      selected = sim.active,
      b = sim.ball,
      rec = sim.intended;
    markerDebug = {
      catchPoint: null,
      ballShadow: null,
      carrier: a?.key || null,
      controlled: selected?.key || null,
      intended: b?.flying ? rec?.key || null : null,
    };
    if (a) {
      groundRing(a.x, a.y, 1.0, C.carrier, 22, 0.2);
    }
    if (selected && selected !== a) {
      groundRing(selected.x, selected.y, 0.92, C.controlled, 17, 0.15);
    }
    if (!b?.flying) return;
    const catchX = Number.isFinite(b.aimX)
      ? b.aimX
      : b.x + (b.vx || 0) * Math.max(0, (b.flight || 0) - (b.t || 0));
    const catchY = Number.isFinite(b.aimY)
      ? b.aimY
      : b.y + (b.vy || 0) * Math.max(0, (b.flight || 0) - (b.t || 0));
    markerDebug.catchPoint = { x: catchX, y: catchY };
    markerDebug.ballShadow = { x: b.x, y: b.y };
    const pulse = 1 + 0.085 * Math.sin(sim.clock * 7);
    groundRing(catchX, catchY, 1.14 * pulse, C.catch, 24, 0.22);
    groundRing(catchX, catchY, 0.48 * pulse, C.ballShadow, 14, 0.12);
    groundRing(b.x, b.y, 0.52, C.ballShadow, 16, 0.14);
    box(I(), [b.x, 0.039, b.y], [0.17, 0.018, 0.17], C.catch);
    if (rec && rec !== selected)
      groundRing(rec.x, rec.y, 0.83, C.controlled, 14, 0.12);
  }
  const locomotion = new WeakMap();
  function player(
    p,
    clock,
    selected,
    carrier,
    contacts,
    possession,
    presnap,
    blockOpponent,
  ) {
    const s = (p.h || 74) / 74,
      breadth = Math.max(0.76, Math.min(1.4, (p.w || 205) / 215));
    // While hands are engaged, face the actual opponent for presentation only.
    // Do not modify p.face or the simulation's turning / blocking physics.
    const partner = blockOpponent?.get(p.key);
    const displayFace = partner
      ? Math.atan2(partner.y - p.y, partner.x - p.x)
      : p.face;
    let root = mul(trans(p.x, 0, p.y), rotY(-displayFace));
    const ground = p.ground,
      winded = ground?.stage === "winded",
      rising = ground?.stage === "rise";
    const action = p.action?.kind || "";
    const involved = contacts?.has(p.key) || p.pushing;
    const pose = AnimationPolicy.sample(p, involved, presnap);
    const run = pose.run * (1 - (pose.standUp || 0) * 0.65),
      step = pose.cycle,
      bob = pose.bob;
    const prior = locomotion.get(p);
    const travel = p.travel || 0;
    const continuous =
      prior &&
      clock >= prior.cycle.clock &&
      clock - prior.cycle.clock <= 0.12 &&
      travel >= prior.cycle.travel;
    const state = continuous ? prior : null;
    const drive = p.jukeDrive;
    const canCut =
      drive?.remaining > 0 &&
      !involved &&
      !presnap &&
      !pose.ground &&
      !pose.air &&
      !p.airState &&
      !(p.stumbleTime > 0) &&
      !pose.blockArms &&
      !pose.escapePulse &&
      pose.standUp <= 0.05 &&
      !(p.wrapReach > 0.01) &&
      p.intent !== "wrap" &&
      (!pose.action || pose.action === "juke");
    const cut = canCut
      ? jukeBody(drive, displayFace, state?.cut, pose.speed)
      : null;
    const gait = involved || presnap ? 0 : runningWeight(p, pose, !!cut);
    const legWeight = gait + (1 - gait) * (cut?.weight || 0);
    const cycle =
      legWeight > 0 || state
        ? runningCycle(travel, pose.speed, s, state?.cycle, clock)
        : null;
    const feet = [null, null];
    if (cycle) locomotion.set(p, { cycle, cut, feet });
    const running = gait > 0 ? runningBody(cycle) : null;
    // The same physical contact and knocked-down states drive the pose.
    if (ground) {
      const fall =
        ground.stage === "fall"
          ? Math.min(1, (ground.age || 0) / Math.max(0.05, ground.fall || 0.25))
          : 1;
      const up = rising
        ? Math.max(
            0,
            Math.min(
              1,
              (ground.time || 0) / Math.max(0.05, ground.rise || 0.4),
            ),
          )
        : 0;
      const tilt =
        ground.stage === "fall" ? -1.28 * fall : rising ? -1.28 * up : -1.28;
      root = mul(root, rotZ(tilt));
      root = at(root, 0, ground.stage === "rise" ? 0.31 : 0.2, 0);
    } else {
      root = at(
        root,
        0,
        bob -
          pose.crouch +
          legWeight * (((running?.bob || 0) - 0.067) * s - bob) -
          (cut?.drop || 0) * s,
        (cut?.shift || 0) * s,
      );
      root = mul(root, rotZ(pose.lean + pose.stanceLean - pose.impactAccent));
      root = mul(
        root,
        rotX(pose.bank * (1 - (cut?.weight || 0)) + (cut?.bank || 0)),
      );
      root = mul(root, rotY(pose.yaw));
    }
    root = mul(root, scale(s, s, s));
    box(I(), [p.x, -0.045, p.y], [0.85, 0.018, 0.69], C.shadow);
    const isHome = (p.team === 0 ? possession : 1 - possession) === 0;
    const jersey = isHome ? C.own : C.enemy,
      trim = isHome ? C.helmetOwn : C.helmetEnemy;
    const airPose = p.airPose?.time > 0 ? p.airPose.kind : null,
      committed = !!(airPose && !airPose.startsWith("ready-"));
    const aKind = committed ? airPose : null,
      airTime = p.airPose;
    const t = airTime
      ? Math.min(
          1,
          (airTime.age || 0) / Math.max(0.01, airTime.duration || 0.6),
        )
      : 0;
    const arc = Math.sin(Math.PI * t),
      flavor = (p.animationFlavor || 0.5) - 0.5;
    const rise =
      aKind === "aggressive"
        ? 0.93
        : aKind === "ball"
          ? 0.85
          : aKind === "swat"
            ? 0.63
            : aKind === "possession"
              ? 0.2
              : aKind === "receiver"
                ? 0.19
                : aKind === "rac"
                  ? 0.045
                  : 0;
    const kick = action === "kick" && p.action?.time > 0;
    const kickT = kick ? Math.min(1, (p.action.age || 0) / 0.55) : 0;
    const hurdle = !!p.airState;
    const hurdleT = hurdle
      ? Math.min(1, (p.airState.elapsed || 0) / p.airState.duration)
      : 0;
    const dive = ["dive", "tackle-dive"].includes(action) && p.action?.time > 0;
    const divePose = dive ? ChaosDiveReach.pose(p) : null;
    const standingWrapPose = !dive ? ChaosDiveReach.standingPose(p) : null;
    const freeHandEscape =
      pose.escapePulse > 0 && !ground && !dive && !standingWrapPose;
    const diveT = divePose?.progress || 0;
    const lunge =
      ["hit-stick", "cut-stick", "conservative"].includes(action) &&
      p.action?.time > 0;
    const vertical = rise * arc + ChaosLowContact.height(p);
    if (vertical) root = at(root, 0, vertical, 0);
    if (p.stumbleTime > 0 && !ground) {
      root = mul(root, rotZ(-0.15 * Math.min(1, p.stumbleTime / 0.27)));
    }
    if (p.ankleReachTime > 0 && ground)
      root = mul(root, rotZ(-0.12 * Math.min(1, p.ankleReachTime / 0.34)));
    if (dive) {
      // A single continuous launch into a prone landing, rather than tilting
      // forward, returning upright, then starting a second fall.
      root = at(root, 0, 0.13 * Math.sin(Math.PI * diveT), 0);
      root = mul(root, rotZ(divePose.bodyPitch));
    }
    if (lunge)
      root = mul(
        root,
        rotZ(
          -0.32 * Math.sin(Math.PI * Math.min(1, (p.action.age || 0) / 0.4)),
        ),
      );
    if (["aggressive", "ball"].includes(aKind))
      root = mul(root, rotZ((0.06 + flavor * 0.28) * arc));
    const armsOut =
      pose.blockArms ||
      !!airPose ||
      hurdle ||
      dive ||
      [
        "stiff",
        "truck",
        "impact-block",
        "hit-stick",
        "cut-stick",
        "conservative",
        "tackle-dive",
      ].includes(action);
    const legAmp = pose.stride;
    const recovering = ground && ground.stage === "rise";
    const riseProgress = recovering
      ? Math.max(
          0,
          Math.min(
            1,
            1 - (ground.time || 0) / Math.max(0.05, ground.rise || 0.3),
          ),
        )
      : 0;
    const groundFold = ground
      ? recovering
        ? 0.6 * (1 - riseProgress)
        : ground.stage === "fall"
          ? 0.35
          : 0.58
      : 0;
    const shift = winded ? 0.05 : 0;
    const articulation = upperBodyArticulation(
      pose,
      running,
      gait,
      cut?.weight || 0,
    );
    const pelvis = rotateAtHeight(root, 0.87, articulation.pelvisYaw, 0);
    const chest = rotateAtHeight(
      root,
      1.02,
      articulation.chestYaw,
      articulation.chestPitch,
    );
    const head = rotateAtHeight(chest, 1.71 + shift, 0, articulation.neckPitch);
    paint(
      "pelvis",
      pelvis,
      [0, 0.94 + shift, 0],
      [0.44 * breadth, 0.37, 0.57 * breadth],
      C.pants,
    );
    paint(
      "torso",
      chest,
      [0, 1.35 + shift, 0],
      [0.54 * breadth, 0.78, 0.75 * breadth],
      jersey,
    );
    paint("neck", chest, [0.015, 1.73 + shift, 0], [0.24, 0.25, 0.27], C.skin);
    // The helmet, visor and bars are rigid equipment on a single head frame.
    sphere(head, [0.02, 1.95 + shift, 0], [0.49, 0.47, 0.46], trim);
    sphere(head, [0.13, 1.85 + shift, 0], [0.35, 0.19, 0.37], C.shoe);
    box(head, [0.285, 1.87 + shift, 0], [0.035, 0.035, 0.41], C.bar);
    box(head, [0.27, 1.94 + shift, 0], [0.035, 0.028, 0.36], C.bar);
    for (const side of [-1, 1]) {
      let hip = at(pelvis, 0, 0.87, side * 0.2 * breadth);
      const footIndex = side < 0 ? 0 : 1;
      let leg = null;
      if (legWeight > 0) {
        const stride = runningLegTarget(cycle, cycle.pace, side, s);
        const target = cut ? jukeLegTarget(cut, stride, side) : stride;
        leg = solveGroundedLeg(target, side, s, hip, state?.feet[footIndex]);
        feet[footIndex] = leg.plant;
      }
      const hipSwing =
        (run ? side * legAmp * step : 0) +
        (ground ? -0.23 + groundFold * (side < 0 ? 1 : 0.72) : 0) +
        (pose.stance === "three-point"
          ? 0.26
          : pose.stance === "coverage-ready"
            ? 0.13
            : pose.stance === "receiver"
              ? 0.16
              : 0) +
        (hurdle || dive
          ? (0.6 + side * 0.22) * Math.sin(Math.PI * (hurdle ? hurdleT : diveT))
          : 0) +
        (rise > 0 ? -0.22 * arc : 0) +
        (kick && side < 0 ? -0.98 * Math.sin(Math.PI * kickT) : 0);
      if (leg) hip = mul(hip, rotX(leg.roll * legWeight));
      hip = mul(
        hip,
        rotZ(hipSwing * (1 - legWeight) + (leg?.hip || 0) * legWeight),
      );
      const kneePivot = at(hip, 0.03, -0.48, 0);
      const baseKnee =
        (run ? Math.abs(step * legAmp) * 0.5 : 0) +
        (pose.stance ? 0.2 : 0) +
        (ground ? groundFold * 0.72 : 0) +
        (hurdle ? 0.85 * Math.sin(Math.PI * hurdleT) : 0) +
        (rise > 0 ? 0.3 * arc : 0);
      const kneeBend =
        baseKnee * (1 - legWeight) + (leg?.knee || 0) * legWeight;
      // A wider blend gives the knee room to fold while the ankle and the
      // portion of the calf below the bend still follow the original hinge.
      drawLimb(
        meshes.leg,
        kneePivot,
        kneeBend,
        0,
        breadth,
        0.415,
        0.18,
        C.pants,
      );
      const knee = mul(kneePivot, rotZ(kneeBend));
      const foot = at(knee, 0, -0.405, 0);
      if (leg) {
        const pitch = Math.atan2(foot[1], Math.hypot(foot[0], foot[2]));
        const yaw = Math.atan2(foot[2], foot[0]);
        const yawError = Math.atan2(
          Math.sin(displayFace - yaw),
          Math.cos(displayFace - yaw),
        );
        const bank = Math.atan2(-foot[9], foot[5]);
        const heading = yaw + yawError * legWeight;
        const slope = pitch + (leg.pitch - pitch) * legWeight;
        const tilt = bank * (1 - legWeight);
        // Reorient the cleat around its solved ankle without another matrix chain.
        const cy = Math.cos(heading),
          sy = Math.sin(heading);
        const cp = Math.cos(slope),
          sp = Math.sin(slope);
        const cb = Math.cos(tilt),
          sb = Math.sin(tilt);
        foot[0] = s * cy * cp;
        foot[1] = s * sp;
        foot[2] = s * sy * cp;
        foot[4] = s * (-cy * sp * cb - sy * sb);
        foot[5] = s * cp * cb;
        foot[6] = s * (-sy * sp * cb + cy * sb);
        foot[8] = s * (cy * sp * sb - sy * cb);
        foot[9] = -s * cp * sb;
        foot[10] = s * (sy * sp * sb + cy * cb);
      }
      sphere(foot, [0.12, 0, 0], [0.37, 0.145, 0.225 * breadth], C.shoe);
      const reachPose = ground ? null : divePose || standingWrapPose;
      const arm =
        ground || reachPose || cut || gait > 0
          ? null
          : armArticulation(
              side,
              aKind,
              pose.blockArms,
              pose.stance === "quarterback",
            );
      const clavicle = at(
        chest,
        arm?.advance || 0,
        1.57 + shift + (arm?.lift || 0),
        side * 0.36 * breadth,
      );
      const stiffExtended = action === "stiff" && side < 0;
      // The stiff arm extends *forward* from one shoulder; the other arm stays
      // free to carry/balance the football. Animation reflects an actual move.
      const overhead = ["aggressive", "ball", "swat"].includes(aKind);
      // Each skill owns its own silhouette: two-handed high point, single-arm
      // DB swat, ball-hawk reach, chest-level possession, running RAC cradle.
      const highpoint =
        aKind === "aggressive"
          ? 2.45 + side * 0.08
          : aKind === "ball"
            ? side < 0
              ? 2.48
              : 2.15
            : aKind === "swat"
              ? side < 0
                ? 2.5
                : 0.55
              : 0;
      const catchArm =
        aKind === "possession"
          ? side < 0
            ? 1.58
            : 1.92
          : aKind === "rac"
            ? side < 0
              ? 1.22
              : -0.22
            : aKind === "receiver"
              ? side < 0
                ? 0.95
                : 1.42
              : 0;
      const stanceSwing =
        pose.stance === "three-point"
          ? side < 0
            ? 1.08
            : 0.33
          : pose.stance === "receiver"
            ? side < 0
              ? 0.6
              : 0.35
            : pose.stance === "coverage-ready"
              ? 0.35
              : pose.stance === "quarterback"
                ? side < 0
                  ? 0.5
                  : 0.43
                : pose.stance === "skill-ready"
                  ? 0.32
                  : 0;
      // Fallen players brace with forearms, then push up as their knees extend.
      // This is the same procedural body used for pancakes and missed dives.
      const getUpArm = ground
        ? p.ankleReachTime > 0
          ? 1.48 + (side < 0 ? 0.17 : -0.1)
          : recovering
            ? 0.95 - riseProgress * 0.62 + (side < 0 ? 0.15 : -0.06)
            : ground.stage === "fall"
              ? 0.68
              : 1.02
        : null;
      const swing =
        getUpArm !== null
          ? getUpArm
          : standingWrapPose
            ? standingWrapPose.shoulder
            : freeHandEscape
              ? (p.team === 0 ? (side < 0 ? 0.58 : 0.22) : 0.68) +
                pose.escapePulse *
                  (p.team === 0 ? (side < 0 ? 0.52 : -0.12) : 0.45)
              : pose.stance
                ? stanceSwing
                : kick
                  ? side < 0
                    ? -0.86
                    : 0.3
                  : stiffExtended
                    ? 1.3
                    : hurdle
                      ? side < 0
                        ? 1.28
                        : 0.86
                      : dive
                        ? divePose.shoulder
                        : overhead
                          ? highpoint
                          : catchArm ||
                            (pose.blockArms
                              ? (pose.blockMode === "drive"
                                  ? 1.16
                                  : pose.blockMode === "seal"
                                    ? 0.96
                                    : pose.blockMode === "double-team"
                                      ? 1.12
                                      : 1.02) +
                                side * 0.07
                              : armsOut
                                ? 0.62 - side * 0.1
                                : run
                                  ? -side * step * legAmp * 0.8 * pose.armDrive
                                  : 0.1);
      const pump = running ? 0.21 + side * running.armDrive : swing;
      const cutBalance = cut
        ? cut.side * side * (0.23 * cut.load - 0.3 * cut.push) * cut.effort
        : 0;
      const elevation = swing + (pump - swing) * gait + cutBalance;
      const shoulder = mul(
        clavicle,
        arm ? mul(rotY(arm.yaw), rotZ(elevation)) : rotZ(elevation),
      );
      // Pads ride with the shoulder girdle while the reaching upper arm
      // rotates beneath them. Locomotion and contact keep their original pad pose.
      const pad = arm ? mul(clavicle, rotZ(elevation * 0.3)) : shoulder;
      sphere(
        pad,
        [0.005, -0.026, -side * 0.029 * breadth],
        [0.33 * breadth, 0.233, 0.29 * breadth],
        jersey,
      );
      // The shared contact reach still owns dive and standing-wrap elbow angles.
      const baseBend =
        reachPose?.elbow ??
        (ground ? 0.28 : pose.blockArms ? 0.33 : overhead ? -0.15 : 0.48);
      const bend = baseBend + ((running?.elbow ?? baseBend) - baseBend) * gait;
      const pivot = at(shoulder, 0, -0.43, 0);
      const twist = reachPose
        ? side * reachPose.inward
        : (arm?.roll || 0) * 0.35;
      const extension = reachPose ? 0.43 : 0.34;
      const elbow = mul(pivot, mul(rotZ(bend), rotY(twist)));
      drawLimb(
        meshes.arm,
        pivot,
        bend,
        twist,
        breadth,
        extension,
        0.12,
        C.skin,
        jersey,
      );
      const wrist = at(elbow, 0, -extension, 0);
      const palm = arm
        ? mul(wrist, mul(rotZ(arm.flex), rotY(arm.roll)))
        : wrist;
      paint("glove", palm, [0, -0.026, 0], [0.12, 0.18, 0.16], C.pants);
    }
    if (carrier === p)
      sphere(chest, [0.36, 1.32, -0.24], [0.32, 0.19, 0.21], C.ball);
    if (selected === p) {
      box(I(), [p.x, 0.035, p.y], [1.13, 0.03, 0.09], C.yellow);
      box(I(), [p.x, 0.035, p.y], [0.09, 0.03, 1.13], C.yellow);
    }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    const rw = Math.max(2, Math.round(w * dpr)),
      rh = Math.max(2, Math.round(h * dpr));
    if (canvas.width !== rw || canvas.height !== rh) {
      canvas.width = rw;
      canvas.height = rh;
    }
    gl.viewport(0, 0, rw, rh);
  }
  function project(x, y, z) {
    const v = [x, y, z, 1],
      out = [0, 0, 0, 0];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) out[r] += viewProjection[c * 4 + r] * v[c];
    if (out[3] <= 0.001) return null;
    const sx = out[0] / out[3],
      sy = out[1] / out[3];
    return {
      x: (sx * 0.5 + 0.5) * w,
      y: (0.5 - sy * 0.5) * h,
      visible: Math.abs(sx) < 1.1 && Math.abs(sy) < 1.1,
    };
  }
  function defensiveAssignmentArt(sim) {
    if (sim.phase !== "presnap" || !sim.defenseArt?.length) return;
    for (const d of sim.defenseArt) {
      if (!d.selected) continue;
      const a = d.assignment;
      if (a?.kind === "zone") {
        artStroke([d.x, d.y], [a.baseX, a.baseY], C.controlled, 0.18);
        groundRing(
          a.baseX,
          a.baseY,
          Math.min(4, a.width * 0.27),
          C.controlled,
          16,
          0.12,
        );
      } else if (a?.kind === "man") {
        const t = sim.players.find((p) => p.key === a.target);
        if (t) artStroke([d.x, d.y], [t.x, t.y], C.controlled, 0.15);
      } else {
        const spot = d.gapTarget
          ? [d.gapTarget.x, d.gapTarget.y]
          : [Math.min(109.1, sim.los + 3.0), d.y];
        artStroke([d.x, d.y], spot, C.controlled, 0.18);
        groundRing(spot[0], spot[1], 0.55, C.controlled, 12, 0.12);
      }
    }
  }
  function draw(sim) {
    resize();
    // During a pass the airborne football owns camera focus; after the catch or
    // handoff, follow the actual carrier. Smooth changes avoid abrupt cuts.
    const inFlight = !!sim.ball?.flying;
    const presnap = sim.phase === "presnap";
    const target = inFlight
      ? sim.ball
      : sim.carrier || sim.players.find((p) => p.key === "QB") || sim.active;
    // Before the snap, see the formation as well as the selected defender.
    // Once live, return to the original ball-follow behavior.
    const focusX = presnap ? sim.los : (target?.x ?? sim.los);
    const focusY = presnap ? 26.65 : (target?.y ?? 26.65);
    const followRate = inFlight ? 0.125 : presnap ? 0.115 : 0.082;
    cameraCenter += (focusX - cameraCenter) * followRate;
    cameraLane += (0.86 * focusY + 0.14 * 26.65 - cameraLane) * followRate;
    const passView =
      inFlight ||
      (sim.phase === "live" &&
        !sim.carrier &&
        sim.play &&
        !["inside", "stretch", "power", "counter", "sweep"].includes(sim.play));
    // Give the defender room to see the offense while positioning before snap.
    // Keep live-play tracking untouched; no extra zoom on special teams.
    const presnapView = sim.phase === "presnap" && !sim.special;
    const desiredZoom = presnapView ? 1.4 : passView ? 1 : 0;
    cameraZoom += (desiredZoom - cameraZoom) * (presnapView ? 0.105 : 0.045);
    const ratio = Math.max(0.5, w / h),
      portrait = ratio < 0.85;
    // The positive-X field runs toward the opponent's end zone. Place the
    // camera behind the offense in X, rather than out on the far sideline.
    const backwards = (portrait ? 22 : 17) + cameraZoom * (portrait ? 8 : 10);
    const height = (portrait ? 20 : 15) + cameraZoom * (portrait ? 6 : 7);
    eye = [cameraCenter - backwards, height, cameraLane];
    cameraTarget = [
      cameraCenter + (portrait ? 13 : 14) + cameraZoom * 2,
      1.0,
      cameraLane,
    ];
    cameraDebug.focusX = cameraCenter;
    cameraDebug.focusY = cameraLane;
    cameraDebug.eye = eye.slice();
    cameraDebug.look = cameraTarget.slice();
    cameraDebug.zoom = cameraZoom;
    cameraDebug.ballFlight = inFlight;
    cameraDebug.presnapView = presnapView;
    cameraDebug.desiredZoom = desiredZoom;
    viewProjection = mul(
      perspective(portrait ? Math.PI / 3.0 : Math.PI / 3.45, ratio, 0.3, 300),
      lookAt(eye, cameraTarget),
    );
    gl.clearColor(0.07, 0.16, 0.19, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawCalls = 0;
    field(sim.los, sim.first);
    routeArt(sim);
    defensiveAssignmentArt(sim);
    const contacts = new Set(),
      blockOpponent = new Map();
    const byKey = new Map(sim.players.map((p) => [p.key, p]));
    for (const c of sim.blocks) {
      contacts.add(c.blocker);
      contacts.add(c.defender);
      const o = byKey.get(c.blocker),
        d = byKey.get(c.defender);
      if (o && d) {
        blockOpponent.set(o.key, d);
        blockOpponent.set(d.key, o);
      }
    }
    for (const c of sim.tackles) {
      contacts.add(c.defender);
      if (sim.carrier) contacts.add(sim.carrier.key);
    }
    for (const p of sim.players)
      player(
        p,
        sim.clock,
        sim.active,
        sim.markerCarrier || sim.carrier,
        contacts,
        sim.possession ?? 0,
        presnap,
        blockOpponent,
      );
    airAndPossessionMarkers(sim);
    if (sim.ball && sim.ball.flying) {
      sphere(
        I(),
        [sim.ball.x, Math.max(0.2, sim.ball.z), sim.ball.y],
        [0.31, 0.19, 0.2],
        C.ball,
      );
    }
    // A valid WebGL context does not guarantee a visible image: broken geometry
    // can silently produce a solid background. Read a few pixels only until the
    // first successful render; do not perform costly readbacks every frame.
    if (!renderVerified) {
      const col = new Uint8Array(4),
        width = canvas.width,
        height = canvas.height;
      let visible = false;
      for (const ry of [0.22, 0.4, 0.6, 0.78]) {
        for (const rx of [0.2, 0.38, 0.55, 0.72, 0.85]) {
          gl.readPixels(
            Math.floor(width * rx),
            Math.floor(height * ry),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            col,
          );
          // Clear color is (18,41,48). Field turf/players are visibly different.
          if (
            Math.abs(col[0] - 18) +
              Math.abs(col[1] - 41) +
              Math.abs(col[2] - 48) >
            48
          ) {
            visible = true;
            break;
          }
        }
        if (visible) break;
      }
      if (visible) {
        renderVerified = true;
        blankFrames = 0;
      } else if (++blankFrames >= 4) {
        throw Error("3D frame contains no visible field or players");
      }
    }
    if (gl.isContextLost()) throw Error("WebGL context lost");
    return { drawCalls, width: w, height: h, playerCount: sim.players.length };
  }
  return {
    draw,
    project,
    resize,
    getGL: () => gl,
    getDebugState: () => ({
      ...cameraDebug,
      markers: markerDebug,
      goalposts: [0, 120],
      artVisibleIn3d: true,
    }),
  };
}
