/* ============================================================================
   scene.js — the 3D layer: a blocky Roblox-style avatar (Three.js).
   ----------------------------------------------------------------------------
   What is in here:
     • a classic R6-proportioned blocky character, rigged at shoulders and hips
     • a canvas-drawn face baked onto the head's front face
     • a studded brick pedestal (InstancedMesh studs)
     • four drifting accent bricks + the point starfield for depth

   The character is driven by three inputs from the page:
     setSection('skills')  — each section sets a pose, colour, camera and facing
     setScroll(0..1)        — turns the character and dollies the camera
     pointer                — the head looks toward your cursor

   POSES per section: home waves, skills cheers, projects points, works walks,
   gallery jumps, contact waves again. Everything eases; nothing snaps.

   Performance guards: DPR capped at 1.75, shadows and stud density reduced on
   small screens, rAF paused when the tab is hidden, one static frame when the
   visitor prefers reduced motion.
   ========================================================================= */

import * as THREE from 'three';

/* Classic Roblox "Bright yellow" — the head and arms keep this in every
   section so the character stays recognisable while the outfit recolours. */
const SKIN  = 0xf5cd30;
const BRICK = 0x5b6a86;

/* ── Per-section moods ─────────────────────────────────────────────────────
   a, b    outfit colours (torso, legs) + the two accent lights + starfield
   camZ    how far the camera sits back
   pos     character offset in world units [x, y]
   turn    facing angle in radians (0 = looking straight at you)
   pose    which POSES entry to ease toward
   scale   character size
------------------------------------------------------------------------- */
const MOODS = {
  home:     { a: 0x64ffda, b: 0x7c5cff, camZ: 5.60, pos: [ 1.80, -0.30], turn:  0.00, pose: 'wave',   scale: 1.00 },
  about:    { a: 0x7ee8ff, b: 0x64ffda, camZ: 6.40, pos: [-1.95, -0.42], turn: -0.55, pose: 'idle',   scale: 0.86 },
  skills:   { a: 0xa78bfa, b: 0x64ffda, camZ: 5.90, pos: [ 2.00, -0.30], turn:  0.30, pose: 'cheer',  scale: 0.94 },
  projects: { a: 0x64ffda, b: 0xffcc70, camZ: 6.80, pos: [-1.80, -0.20], turn: -0.95, pose: 'point',  scale: 1.05 },
  works:    { a: 0xffcc70, b: 0xa78bfa, camZ: 6.20, pos: [ 2.10, -0.35], turn:  0.75, pose: 'walk',   scale: 0.82 },
  gallery:  { a: 0xff7b92, b: 0x7c5cff, camZ: 7.20, pos: [ 0.00, -1.30], turn:  0.10, pose: 'jump',   scale: 1.15 },
  contact:  { a: 0x64ffda, b: 0x7ee8ff, camZ: 5.20, pos: [ 1.70, -0.25], turn:  0.00, pose: 'wave',   scale: 1.02 },
};

/* ── Poses ─────────────────────────────────────────────────────────────────
   Each limb is a pivot Group at the shoulder / hip, so these are rotations
   of that pivot in radians: [x, y, z].

   Sign convention (worked out from the rest pose, arms hanging down -Y):
     rotating about Z by +θ swings the +X arm outward and up; the -X arm needs
     -θ for the mirror image. π/2 ≈ straight out sideways, ~2.4 is raised
     up-and-out, π is straight overhead. Rotating a leg about X swings it
     forward / back (that is what 'walk' animates).
     aR / lR are the +X side, aL / lL the -X side.
------------------------------------------------------------------------- */
const POSES = {
  idle:   { aL: [ 0.06, 0, -0.10], aR: [-0.06, 0,  0.10], lL: [0, 0, -0.02], lR: [0, 0, 0.02] },
  wave:   { aL: [ 0.00, 0, -0.10], aR: [ 0.00, 0,  2.45], lL: [0, 0, -0.02], lR: [0, 0, 0.02], wave: true },
  cheer:  { aL: [ 0.00, 0, -2.70], aR: [ 0.00, 0,  2.70], lL: [0, 0, -0.03], lR: [0, 0, 0.03], bounce: true },
  point:  { aL: [ 0.00, 0, -0.12], aR: [-1.45, 0,  0.12], lL: [0, 0, -0.02], lR: [0, 0, 0.02] },
  walk:   { aL: [ 0.55, 0, -0.12], aR: [-0.55, 0,  0.12], lL: [-0.45, 0, -0.02], lR: [0.45, 0, 0.02], swing: true },
  jump:   { aL: [ 0.00, 0, -2.25], aR: [ 0.00, 0,  2.25], lL: [ 0.30, 0, -0.05], lR: [-0.30, 0, 0.05], hop: true },
};

/* ── Starfield shaders (kept from the original scene for depth) ─────────── */
const DUST_VERT = /* glsl */`
attribute float aScale;
attribute float aSeed;

uniform float uTime;
uniform float uSize;
uniform float uDpr;

varying float vFade;
varying float vSeed;

void main() {
  vec3 p = position;

  float t = uTime + aSeed * 6.2831853;
  p.x += cos(t * 0.21) * 0.30;
  p.y += sin(t * 0.27) * 0.30;
  p.z += sin(t * 0.17) * 0.22;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;

  gl_PointSize = uSize * aScale * uDpr * (36.0 / max(dist, 0.6));
  vFade = clamp(1.0 - (dist - 2.5) / 15.0, 0.04, 1.0);
  vSeed = aSeed;

  gl_Position = projectionMatrix * mv;
}`;

const DUST_FRAG = /* glsl */`
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform float uOpacity;

varying float vFade;
varying float vSeed;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.06, d);

  vec3 col = mix(uColorA, uColorB, vSeed);
  gl_FragColor = vec4(col, alpha * vFade * uOpacity);
}`;

/* Frame-rate independent easing toward a target. */
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* The face, drawn to a canvas. The skin colour is painted in as the background
   rather than left transparent — a transparent texel over a coloured material
   would punch a hole straight through the head. */
function makeFaceTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');

  g.fillStyle = '#f5cd30';
  g.fillRect(0, 0, 256, 256);

  g.fillStyle = '#26282e';
  g.beginPath(); g.ellipse(90,  106, 15, 21, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(166, 106, 15, 21, 0, 0, Math.PI * 2); g.fill();

  // A small highlight in each eye keeps it from looking dead-eyed.
  g.fillStyle = '#ffffff';
  g.beginPath(); g.ellipse(85,  99, 4.5, 6, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(161, 99, 4.5, 6, 0, 0, Math.PI * 2); g.fill();

  g.strokeStyle = '#26282e';
  g.lineWidth = 11;
  g.lineCap = 'round';
  g.beginPath(); g.arc(128, 138, 46, 0.20 * Math.PI, 0.80 * Math.PI); g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function initScene(canvas, { onReady } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small   = innerWidth < 760;

  /* ── Renderer ─────────────────────────────────────────────────────────── */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !small,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    document.body.classList.add('no-webgl');
    onReady?.();
    return { setSection() {}, setScroll() {}, dispose() {} };
  }

  const DPR = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  // Shadows sell the "solid plastic toy" read, but they cost — desktop only.
  if (!small) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, MOODS.home.camZ);

  const colA = new THREE.Color(MOODS.home.a);
  const colB = new THREE.Color(MOODS.home.b);

  /* ── Lights ───────────────────────────────────────────────────────────────
     Three.js uses physical light units, so the point lights need high
     intensities. These four values are the whole look — tune them here. */
  scene.add(new THREE.AmbientLight(0xdfe9ff, 1.15));

  const key = new THREE.DirectionalLight(0xffffff, 2.10);
  key.position.set(4, 8, 6);
  if (!small) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.bias = -0.0016;
  }
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 0.55);
  rim.position.set(-5, 2, -6);
  scene.add(rim);

  const lampA = new THREE.PointLight(colA.clone(), 16, 16, 2);
  lampA.position.set(-3.2, 1.4, 3.0);
  scene.add(lampA);

  const lampB = new THREE.PointLight(colB.clone(), 14, 16, 2);
  lampB.position.set(3.2, -1.2, -1.5);
  scene.add(lampB);

  /* ── Materials ────────────────────────────────────────────────────────────
     Matte plastic: no metalness, mid roughness. torsoMat and legMat are the
     two that recolour per section. */
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.62, metalness: 0.0, ...extra,
  });

  const skinMat  = mat(SKIN);
  const torsoMat = mat(colA.clone());
  const legMat   = mat(colB.clone());
  const brickMat = mat(BRICK, { roughness: 0.78 });

  const faceTex = makeFaceTexture();
  // BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z — index 4 is the front.
  const headMats = [skinMat, skinMat, skinMat, skinMat,
                    mat(0xffffff, { map: faceTex }), skinMat];

  /* ── Character rig ────────────────────────────────────────────────────────
     Built in "stud" units on classic R6 proportions (torso 2x2x1, limbs 1x2x1),
     then scaled down as a whole. Limbs hang from pivot Groups so a rotation
     swings from the shoulder / hip instead of spinning about the limb's middle.
  ------------------------------------------------------------------------- */
  const CHAR_SCALE = 0.34;

  const character = new THREE.Group();   // placed + turned by the moods
  const body = new THREE.Group();        // bobs, sways and hops
  character.add(body);
  scene.add(character);

  const part = (w, h, d, material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.castShadow = !small;
    return m;
  };

  const torso = part(2, 2, 1, torsoMat);
  body.add(torso);

  // Head: pivot at the neck so a look-around rotates the head, not the body.
  const headPivot = new THREE.Group();
  headPivot.position.y = 1;
  const head = part(1.25, 1.25, 1.25, headMats);
  head.position.y = 0.625;
  headPivot.add(head);
  body.add(headPivot);

  function limb(x, y, material) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = part(1, 2, 1, material);
    m.position.y = -1;              // hang below the pivot
    pivot.add(m);
    body.add(pivot);
    return pivot;
  }

  const armL = limb(-1.5,  1, skinMat);
  const armR = limb( 1.5,  1, skinMat);
  const legL = limb(-0.5, -1, legMat);
  const legR = limb( 0.5, -1, legMat);

  // Centre the character vertically: it spans y -3 (feet) to +2.25 (head top).
  const BODY_Y = 0.375;
  body.position.y = BODY_Y;
  const FEET_Y = -3 + BODY_Y;       // where the pedestal's top surface goes

  /* ── Studded brick pedestal ───────────────────────────────────────────── */
  const pedestal = new THREE.Group();
  pedestal.position.y = FEET_Y;
  character.add(pedestal);

  const PLATE = small ? 5 : 7;      // studs per side
  const SP = 1.15;                  // stud spacing
  const plateSize = PLATE * SP + 1.1;

  const plate = new THREE.Mesh(new THREE.BoxGeometry(plateSize, 0.8, plateSize), brickMat);
  plate.position.y = -0.4;          // top surface flush with the feet
  plate.receiveShadow = true;
  plate.castShadow = !small;
  pedestal.add(plate);

  const studGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.14, 12);
  const studs = new THREE.InstancedMesh(studGeo, brickMat, PLATE * PLATE);
  studs.receiveShadow = true;
  const slot = new THREE.Object3D();
  let n = 0;
  for (let ix = 0; ix < PLATE; ix++) {
    for (let iz = 0; iz < PLATE; iz++) {
      slot.position.set((ix - (PLATE - 1) / 2) * SP, 0.07, (iz - (PLATE - 1) / 2) * SP);
      slot.updateMatrix();
      studs.setMatrixAt(n++, slot.matrix);
    }
  }
  studs.instanceMatrix.needsUpdate = true;
  pedestal.add(studs);

  character.scale.setScalar(CHAR_SCALE);

  /* ── Drifting accent bricks ───────────────────────────────────────────── */
  const bricks = [];
  const brickShapes = [[1.1, 0.45, 0.55], [0.7, 0.35, 0.7], [1.4, 0.4, 0.5], [0.6, 0.3, 0.6]];
  brickShapes.forEach((dims, i) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(...dims),
      mat(i % 2 ? colB.clone() : colA.clone(), { roughness: 0.7 }),
    );
    m.userData = {
      radius: 2.6 + i * 0.5,
      speed: 0.20 + i * 0.09,
      phase: (i / brickShapes.length) * Math.PI * 2,
      lift: -0.6 + i * 0.45,
    };
    bricks.push(m);
    scene.add(m);
  });

  /* ── Starfield ────────────────────────────────────────────────────────── */
  const COUNT = small ? 1000 : 2200;
  const pos    = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);
  const seeds  = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const r     = 6.0 + Math.pow(Math.random(), 0.62) * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);

    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.72;
    pos[i * 3 + 2] = r * Math.cos(phi);

    scales[i] = 0.4 + Math.random() * 1.5;
    seeds[i]  = Math.random();
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aScale',   new THREE.BufferAttribute(scales, 1));
  dustGeo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));

  const dustUniforms = {
    uTime:    { value: 0 },
    uSize:    { value: 2.1 },
    uDpr:     { value: DPR },
    uColorA:  { value: colA.clone() },
    uColorB:  { value: colB.clone() },
    uOpacity: { value: 0.80 },
  };

  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms: dustUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  /* ── State: current values vs. the targets we ease toward ─────────────── */
  const cur = {
    camZ: MOODS.home.camZ, scale: MOODS.home.scale,
    x: MOODS.home.pos[0], y: MOODS.home.pos[1], turn: MOODS.home.turn,
    px: 0, py: 0,
  };

  // Live limb rotations, eased toward the active pose each frame.
  const live = {
    aL: [0, 0, -0.1], aR: [0, 0, 0.1],
    lL: [0, 0, -0.02], lR: [0, 0, 0.02],
  };

  let mood = MOODS.home;
  let pose = POSES[MOODS.home.pose];
  let pointerX = 0, pointerY = 0;
  let scroll = 0;

  const fromA = colA.clone(), fromB = colB.clone();
  const tgtA  = colA.clone(), tgtB  = colB.clone();
  let mixT = 1;

  /* ── Inputs ───────────────────────────────────────────────────────────── */
  function setSection(name) {
    const next = MOODS[name];
    if (!next || next === mood) return;
    mood = next;
    pose = POSES[next.pose] || POSES.idle;
    fromA.copy(torsoMat.color);
    fromB.copy(legMat.color);
    tgtA.set(next.a);
    tgtB.set(next.b);
    mixT = 0;
  }
  function setScroll(v) { scroll = v; }

  const onPointer = (e) => {
    pointerX = (e.clientX / innerWidth) * 2 - 1;
    pointerY = (e.clientY / innerHeight) * 2 - 1;
  };
  const onTouch = (e) => {
    if (!e.touches?.[0]) return;
    pointerX = (e.touches[0].clientX / innerWidth) * 2 - 1;
    pointerY = (e.touches[0].clientY / innerHeight) * 2 - 1;
  };
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('touchmove', onTouch, { passive: true });

  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
    }, 130);
  };
  addEventListener('resize', onResize);

  /* Ease one limb toward its pose target, then let the caller add motion. */
  function easeLimb(pivot, name, dt) {
    const t = pose[name];
    const l = live[name];
    for (let i = 0; i < 3; i++) l[i] = damp(l[i], t[i], 7.0, dt);
    pivot.rotation.set(l[0], l[1], l[2]);
  }

  /* ── Frame loop ───────────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let raf = 0;
  let running = true;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    dustUniforms.uTime.value = t;

    cur.camZ  = damp(cur.camZ,  mood.camZ,    2.0, dt);
    cur.scale = damp(cur.scale, mood.scale,   2.4, dt);
    cur.x     = damp(cur.x,     mood.pos[0],  2.0, dt);
    cur.y     = damp(cur.y,     mood.pos[1],  2.0, dt);
    cur.turn  = damp(cur.turn,  mood.turn,    2.6, dt);
    cur.px    = damp(cur.px,    pointerX,     3.4, dt);
    cur.py    = damp(cur.py,    pointerY,     3.4, dt);

    // Outfit colour cross-fade, carried into the lights and the starfield.
    if (mixT < 1) {
      mixT = Math.min(1, mixT + dt * 1.15);
      const e = mixT * mixT * (3 - 2 * mixT);
      torsoMat.color.copy(fromA).lerp(tgtA, e);
      legMat.color.copy(fromB).lerp(tgtB, e);
      lampA.color.copy(torsoMat.color);
      lampB.color.copy(legMat.color);
      dustUniforms.uColorA.value.copy(torsoMat.color);
      dustUniforms.uColorB.value.copy(legMat.color);
      bricks.forEach((b, i) => b.material.color.copy(i % 2 ? legMat.color : torsoMat.color));
    }

    /* Placement: mood position + a little pointer parallax. */
    character.position.set(cur.x + cur.px * 0.30, cur.y - cur.py * 0.22, 0);
    character.scale.setScalar(CHAR_SCALE * cur.scale);
    character.rotation.y = cur.turn + cur.px * 0.22 + scroll * 0.60;

    /* Limbs: ease to the pose, then layer the pose's own motion on top. */
    easeLimb(armL, 'aL', dt);
    easeLimb(armR, 'aR', dt);
    easeLimb(legL, 'lL', dt);
    easeLimb(legR, 'lR', dt);

    if (pose.wave) armR.rotation.z += Math.sin(t * 6.5) * 0.26;
    if (pose.bounce) {
      armL.rotation.z -= Math.sin(t * 4.2) * 0.10;
      armR.rotation.z += Math.sin(t * 4.2) * 0.10;
    }
    if (pose.swing) {
      const s = Math.sin(t * 3.2);
      armL.rotation.x += s * 0.30;
      armR.rotation.x -= s * 0.30;
      legL.rotation.x -= s * 0.40;
      legR.rotation.x += s * 0.40;
    }

    /* Idle bob, plus a real hop for the gallery pose. */
    const hop = pose.hop ? Math.abs(Math.sin(t * 2.4)) * 0.75 : 0;
    body.position.y = BODY_Y + Math.sin(t * 1.4) * 0.07 + hop;
    body.rotation.z = Math.sin(t * 0.9) * 0.022;
    if (pose.hop) body.rotation.x = Math.sin(t * 2.4) * 0.05;
    else body.rotation.x = damp(body.rotation.x, 0, 4, dt);

    /* The head follows your cursor — clamped so it never breaks its neck. */
    headPivot.rotation.y = damp(headPivot.rotation.y, clamp(cur.px * 0.55, -0.6, 0.6), 4.0, dt);
    headPivot.rotation.x = damp(headPivot.rotation.x, clamp(cur.py * 0.32, -0.3, 0.3), 4.0, dt);

    /* Accent bricks tumble slowly around the character. */
    bricks.forEach((b) => {
      const { radius, speed, phase, lift } = b.userData;
      const a = t * speed + phase;
      b.position.set(
        character.position.x + Math.cos(a) * radius,
        character.position.y + Math.sin(a * 1.3) * 0.55 + lift,
        Math.sin(a) * radius,
      );
      b.rotation.x = a * 0.9;
      b.rotation.y = a * 0.7;
    });

    dust.rotation.y = t * 0.017 + scroll * 0.55;
    dust.rotation.x = -scroll * 0.16;

    camera.position.x = damp(camera.position.x, cur.px * 0.42, 3.0, dt);
    camera.position.y = damp(camera.position.y, -cur.py * 0.30 - scroll * 0.40, 3.0, dt);
    camera.position.z = cur.camZ;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  /* Reduced motion: compose one frame in the rest pose, then stop. */
  if (reduced) {
    character.position.set(MOODS.home.pos[0], MOODS.home.pos[1], 0);
    character.rotation.y = -0.25;
    armR.rotation.z = 2.35;          // caught mid-wave
    armL.rotation.z = -0.10;
    headPivot.rotation.y = -0.12;
    renderer.render(scene, camera);
    running = false;
  } else {
    frame();
  }

  const onVis = () => {
    if (reduced) return;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      running = false;
    } else if (!running) {
      running = true;
      clock.getDelta();
      frame();
    }
  };
  document.addEventListener('visibilitychange', onVis);

  requestAnimationFrame(() => onReady?.());

  return {
    setSection,
    setScroll,
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onPointer);
      removeEventListener('touchmove', onTouch);
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      faceTex.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose?.();
      });
      renderer.dispose();
    },
  };
}
