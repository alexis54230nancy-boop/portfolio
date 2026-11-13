import * as THREE from "three";
import { signals } from "../../signals";
import { type Ctx, damp, makeCamera, type SceneHandle } from "../stage";

/**
 * LE FRAGMENT — silhouette humaine en fil de fer, incomplète :
 * le bras gauche manque, la tête est coupée à mi-hauteur.
 *
 * Un seul maillage non indexé (~2000 triangles). Chaque face porte son
 * barycentre et trois nombres aléatoires, ce qui permet au vertex shader de
 * la faire tomber (séparation), de la couper en deux (question) ou de la
 * disperser en particules (le nom).
 */
function buildBody() {
  const chunks: Float32Array[] = [];
  const add = (
    g: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    s: [number, number, number] = [1, 1, 1],
    rz = 0,
  ) => {
    g.scale(...s);
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    const n = g.index ? g.toNonIndexed() : g;
    chunks.push(n.attributes.position.array as Float32Array);
    g.dispose();
  };
  const cyl = (rt: number, rb: number, h: number, rs = 10, hs = 7) =>
    new THREE.CylinderGeometry(rt, rb, h, rs, hs, true);

  // Jambes + pieds
  add(cyl(0.19, 0.11, 1.55), -0.23, 0.8, 0);
  add(cyl(0.19, 0.11, 1.55), 0.23, 0.8, 0);
  add(new THREE.BoxGeometry(0.2, 0.1, 0.42, 2, 1, 3), -0.23, 0.04, 0.1);
  add(new THREE.BoxGeometry(0.2, 0.1, 0.42, 2, 1, 3), 0.23, 0.04, 0.1);
  // Bassin, torse, épaules, cou
  add(new THREE.SphereGeometry(0.5, 16, 9), 0, 1.62, 0, [0.92, 0.6, 0.62]);
  add(cyl(0.52, 0.36, 1.05, 16, 8), 0, 2.2, 0, [1, 1, 0.56]);
  add(new THREE.SphereGeometry(0.5, 16, 8), 0, 2.74, 0, [1.22, 0.36, 0.6]);
  add(cyl(0.11, 0.13, 0.24, 8, 2), 0, 2.99, 0);
  // Tête : seule la moitié basse existe
  add(new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), 0, 3.37, 0.02, [0.9, 1.18, 1]);
  // Bras droit (à gauche de l'écran quand il fait face) + main
  add(cyl(0.11, 0.09, 0.78, 9, 5), -0.69, 2.34, 0, [1, 1, 1], -0.12);
  add(cyl(0.085, 0.065, 0.76, 9, 5), -0.81, 1.6, 0.05, [1, 1, 1], -0.06);
  add(new THREE.SphereGeometry(0.09, 8, 6), -0.85, 1.16, 0.06, [1, 1.3, 0.7]);
  // Bras gauche : il ne reste qu'un moignon
  add(cyl(0.11, 0.1, 0.16, 9, 1), 0.64, 2.62, 0, [1, 1, 1], 0.5);

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const position = new Float32Array(total);
  let o = 0;
  for (const c of chunks) {
    position.set(c, o);
    o += c.length;
  }
  const faces = total / 9;
  const bary = new Float32Array(total);
  const centroid = new Float32Array(total);
  const rnd = new Float32Array(total);
  for (let f = 0; f < faces; f++) {
    const i = f * 9;
    for (let v = 0; v < 3; v++) position[i + v * 3 + 1] -= 1.75; // centre le corps sur l'origine
    const cx = (position[i] + position[i + 3] + position[i + 6]) / 3;
    const cy = (position[i + 1] + position[i + 4] + position[i + 7]) / 3;
    const cz = (position[i + 2] + position[i + 5] + position[i + 8]) / 3;
    const r = [Math.random(), Math.random(), Math.random()];
    for (let v = 0; v < 3; v++) {
      bary[i + v * 3 + v] = 1;
      centroid.set([cx, cy, cz], i + v * 3);
      rnd.set(r, i + v * 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geo.setAttribute("aBary", new THREE.BufferAttribute(bary, 3));
  geo.setAttribute("aCentroid", new THREE.BufferAttribute(centroid, 3));
  geo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  return { geo, centroid, faces };
}

const ROT = /* glsl */ `
  mat3 rot(vec3 axis, float a) {
    float s = sin(a), c = cos(a), oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c);
  }`;

export function create(ctx: Ctx): SceneHandle {
  const scene = new THREE.Scene();
  const camera = makeCamera(38, 6);
  const { geo, centroid, faces } = buildBody();

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: ctx.accent },
      uShatter: { value: 0 },
      uSplit: { value: 0 },
      uExplode: { value: 0 },
      uMissing: { value: 0.05 },
      uGlitch: { value: 0 },
      uLine: { value: 0.42 },
      uVisible: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aBary;
      attribute vec3 aCentroid;
      attribute vec3 aRnd;
      uniform float uTime, uShatter, uSplit, uExplode, uMissing, uGlitch;
      varying vec3 vBary;
      varying float vHide;
      varying float vFall;
      ${ROT}
      void main() {
        vBary = aBary;
        vec3 local = position - aCentroid;
        vec3 c = aCentroid;

        // Séparation : les faces tombent, les plus "fragiles" d'abord.
        float k = smoothstep(aRnd.x * 0.75, aRnd.x * 0.75 + 0.25, uShatter);
        local = rot(normalize(aRnd - 0.5), k * 6.0 * (aRnd.y - 0.5)) * local * (1.0 - k * 0.4);
        c += vec3((aRnd.y - 0.5) * 1.2 * k, -k * k * 4.5, (aRnd.z - 0.5) * 1.2 * k);

        // Le nom : explosion en particules.
        float e = uExplode;
        vec3 dir = normalize(c + (aRnd - 0.5) * 1.5 + vec3(0.0001));
        c += dir * e * (1.5 + aRnd.z * 6.0);
        local = rot(normalize(aRnd.zxy - 0.5), e * 8.0 * aRnd.x) * local * (1.0 - e * 0.8);

        // Glitch : tranches horizontales décalées.
        float band = step(0.5, fract(c.y * 2.6 + uTime * 13.0));
        c.x += uGlitch * band * 0.3 * sin(uTime * 80.0 + c.y * 9.0);

        vec4 mv = modelViewMatrix * vec4(c + local, 1.0);

        // La question : le corps se casse en deux, un vide noir entre les moitiés.
        float side = step(0.28 + (aRnd.y - 0.5) * 0.16, aCentroid.y) * 2.0 - 1.0;
        mv.x += side * uSplit * 0.5;
        mv.y += side * uSplit * 0.22;

        vHide = step(aRnd.x, uMissing);
        vFall = k;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uLine, uVisible;
      varying vec3 vBary;
      varying float vHide;
      varying float vFall;
      void main() {
        if (vHide > 0.5) discard;
        float e = min(vBary.x, min(vBary.y, vBary.z));
        float w = fwidth(e);
        float line = 1.0 - smoothstep(w * 0.5, w * 1.5, e);
        float a = uVisible * (1.0 - vFall * 0.75);
        // Fil vert sur remplissage noir (opacité 0,9)
        gl_FragColor = vec4(uColor * line * uLine, mix(0.9, 1.0, line) * a);
      }`,
  });
  const body = new THREE.Mesh(geo, mat);
  const pivot = new THREE.Group();
  pivot.add(body);
  scene.add(pivot);

  /* Point-œil */
  const eye = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0.02, 1.56, 0.3], 3)),
    new THREE.PointsMaterial({ size: 7, sizeAttenuation: false, transparent: true, opacity: 0, depthTest: false }),
  );
  body.add(eye);

  /* 50 particules qui s'échappent : la désintégration lente */
  const COUNT = 50;
  const start = new Float32Array(COUNT * 3);
  const pseed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const f = Math.floor(Math.random() * faces) * 9;
    start.set([centroid[f], centroid[f + 1], centroid[f + 2]], i * 3);
    pseed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(start, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(pseed, 1));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uPhase: { value: 0 }, uColor: { value: ctx.accent }, uVisible: { value: 0 }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uPhase, uScale;
      varying float vA;
      void main() {
        float life = fract(uPhase * (0.5 + aSeed) + aSeed * 7.0);
        vec3 p = position;
        p += vec3(sin(aSeed * 40.0) * 0.9, 0.5 + aSeed * 1.4, cos(aSeed * 23.0) * 0.9) * life * 1.6;
        p.x += sin(life * 6.0 + aSeed * 10.0) * 0.12;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = sin(life * 3.14159) * 0.9;
        gl_PointSize = (2.0 + aSeed * 3.0) * uScale * (5.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uVisible; varying float vA;
      void main() { gl_FragColor = vec4(uColor, vA * uVisible); }`,
  });
  const dust = new THREE.Points(pGeo, pMat);
  body.add(dust);

  let phase = 0;
  let dist = 6;
  let near = 0;
  let facing = 0;
  let split = 0;
  let shatter = 0;
  let visible = 0;
  let turn = 0;

  return {
    scene,
    camera,
    update(t, dt) {
      const d = dt || 0.016;
      const f = signals.fragment;
      const u = mat.uniforms;

      // Proximité de la souris : il se dilate à peine, les particules accélèrent.
      const m = Math.hypot(signals.mouse.x, signals.mouse.y);
      near = damp(near, m < 0.4 ? 1 : 0, 4, d);
      phase += d * 0.1 * (1 + near * 1.6) * f.decay;

      shatter = damp(shatter, f.shatter, 4, d);
      split = damp(split, f.split, 5, d);
      visible = damp(visible, f.visible * (1 - f.leave), 3, d);
      facing = damp(facing, f.eye, 2.2, d);
      turn = damp(turn, f.leave, 1.6, d);

      u.uTime.value = t;
      u.uShatter.value = shatter;
      u.uSplit.value = split;
      u.uExplode.value = f.explode;
      u.uMissing.value = 0.05 + Math.min(0.14, f.t * 0.16);
      u.uGlitch.value = f.glitch;
      u.uLine.value = 0.42 + f.pulse * 0.58 + near * 0.08;
      u.uVisible.value = visible;
      pMat.uniforms.uPhase.value = phase;
      pMat.uniforms.uVisible.value = visible * (1 - f.explode);
      pMat.uniforms.uScale.value = ctx.renderer.getPixelRatio();
      pGeo.setDrawRange(0, Math.floor(COUNT * signals.quality));

      // Flotte, respire.
      const breath = 1 + 0.01 * Math.sin(t * 1.5) + near * 0.02;
      pivot.scale.setScalar(breath);
      pivot.position.y = Math.sin(t * 0.7) * 0.07 + 0.25;

      // La caméra tourne de 360° autour de lui au fil des cinq premières frames.
      const theta = Math.PI + f.t * Math.PI * 2;
      dist = damp(dist, 6.2 - f.approach * 2.4 + turn * 9, 2.5, d);
      camera.position.set(Math.sin(theta) * dist, 0.35, Math.cos(theta) * dist);
      camera.lookAt(0, 0.2, 0);

      // L'offre : il se tourne vers le visiteur. La sortie : il se retourne.
      let face = theta % (Math.PI * 2);
      if (face > Math.PI) face -= Math.PI * 2;
      body.rotation.y = face * facing + turn * Math.PI;

      const em = eye.material as THREE.PointsMaterial;
      em.color.copy(ctx.accent);
      em.size = 7 * ctx.renderer.getPixelRatio();
      const blink = Math.sin(t * 2.2) > -0.82 ? 1 : 0;
      em.opacity = facing * blink * visible * (1 - f.explode);
    },
  };
}
