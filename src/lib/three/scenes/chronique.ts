import * as THREE from "three";
import { chronique } from "../../content";
import { signals } from "../../signals";
import { type Ctx, damp, makeCamera, type SceneHandle } from "../stage";

/**
 * CHRONIQUE — un tube qui serpente dans la profondeur, un nœud par étape.
 * La caméra avance le long de la ligne avec le scroll ; derrière, une pluie
 * de traits verticaux entre z = -50 et z = -200 donne une vraie parallaxe.
 */
export function create(ctx: Ctx): SceneHandle {
  const scene = new THREE.Scene();
  const camera = makeCamera(55, 6);
  const N = chronique.length;
  const GAP = 7;

  const pts = Array.from({ length: N + 2 }, (_, k) => {
    const i = k - 1;
    return new THREE.Vector3(Math.sin(i * 1.15) * 1.5, Math.cos(i * 0.8) * 0.7 - 0.4, -i * GAP);
  });
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  const tubeMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.38 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 360, 0.018, 6, false), tubeMat));

  const nodes = Array.from({ length: N }, (_, i) => {
    const u = (i + 1) / (N + 1);
    const g = new THREE.Group();
    g.position.copy(curve.getPoint(u));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({ transparent: true }));
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.25 }),
    );
    g.add(core, shell);
    scene.add(g);
    return { g, core, shell, u, level: 0 };
  });

  /* Pluie 3D, attachée à la caméra */
  const RAIN = 520;
  const pos = new Float32Array(RAIN * 6);
  const seed = new Float32Array(RAIN * 2);
  for (let i = 0; i < RAIN; i++) {
    const x = (Math.random() - 0.5) * 220;
    const z = -50 - Math.random() * 150;
    const len = 1.5 + Math.random() * 5;
    const s = Math.random();
    pos.set([x, 0, z, x, -len, z], i * 6);
    seed.set([s, s], i * 2);
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  rainGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  rainGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
  const rainMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: ctx.accent } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      varying float vA;
      void main() {
        vec3 p = position;
        float fall = mod(uTime * (4.0 + aSeed * 9.0) + aSeed * 160.0, 160.0);
        p.y += 80.0 - fall;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (0.05 + aSeed * 0.16) * smoothstep(210.0, 60.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      void main() { gl_FragColor = vec4(uColor, vA); }`,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  camera.add(rain);
  scene.add(camera);

  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  let p = 0;

  return {
    scene,
    camera,
    update(t, dt) {
      const d = dt || 0.016;
      p = damp(p, signals.chronique.progress, 3.5, d);
      // progress 0 → 1 parcourt les nœuds ; le nœud actif est juste devant la caméra.
      const u = (p * (N - 1) + 1) / (N + 1);
      curve.getPoint(Math.max(0, u - 0.045), target);
      curve.getPoint(Math.min(1, u + 0.05), look);
      camera.position.set(target.x + signals.mouse.x * 0.3, target.y + 1.7 + signals.mouse.y * 0.15, target.z + 4.6);
      camera.lookAt(look.x, look.y + 0.9, look.z);
      rainMat.uniforms.uTime.value = t;
      rainGeo.setDrawRange(0, Math.floor(RAIN * signals.quality) * 2);
      tubeMat.color.copy(ctx.accent);
      const active = p * (N - 1);
      nodes.forEach((n, i) => {
        n.level = damp(n.level, i <= active + 0.35 ? 1 : 0, 6, d);
        const core = n.core.material as THREE.MeshBasicMaterial;
        const shell = n.shell.material as THREE.MeshBasicMaterial;
        const empty = chronique[i].empty;
        core.color.copy(ctx.accent);
        core.opacity = empty ? 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(t * 3)) * n.level : 0.12 + n.level * 0.88;
        shell.color.copy(ctx.accent);
        shell.opacity = 0.12 + n.level * 0.3;
        n.g.position.y += Math.sin(t * 0.9 + i * 1.7) * 0.0012; // flottement
        n.shell.rotation.y = t * 0.3 + i;
        n.shell.rotation.x = t * 0.2;
        n.g.scale.setScalar(1 + n.level * 0.25);
      });
    },
  };
}
