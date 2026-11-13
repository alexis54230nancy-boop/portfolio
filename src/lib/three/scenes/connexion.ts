import * as THREE from "three";
import { signals } from "../../signals";
import { type Ctx, damp, halfHeight, makeCamera, type SceneHandle } from "../stage";

/**
 * CONNEXION — un portail filaire qui respire autour du formulaire.
 * Il s'ouvre quand on écrit, et ses coins se replient à l'envoi.
 */
export function create(ctx: Ctx): SceneHandle {
  const scene = new THREE.Scene();
  const camera = makeCamera(40, 10);
  const group = new THREE.Group();
  scene.add(group);

  const FRAMES = 4;
  // 4 côtés par cadre + 4 arêtes de liaison entre cadres successifs
  const segs = FRAMES * 4 + (FRAMES - 1) * 4;
  const positions = new Float32Array(segs * 6);
  const alphas = new Float32Array(segs * 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uColor: { value: ctx.accent }, uOpacity: { value: 0.3 } },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      varying float vA;
      void main() { vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main() { gl_FragColor = vec4(uColor, uOpacity * vA); }`,
  });
  group.add(new THREE.LineSegments(geo, mat));

  // Poussière qui traverse le portail
  const DUST = 70;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) dustPos.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 8, -Math.random() * 30], i * 3);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3).setUsage(THREE.DynamicDrawUsage));
  const dustMat = new THREE.PointsMaterial({ size: 0.035, transparent: true, opacity: 0.5, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  let W = 4;
  let H = 4;
  let open = 0;
  const corner = new THREE.Vector3();
  const corners: THREE.Vector3[][] = Array.from({ length: FRAMES }, () =>
    Array.from({ length: 4 }, () => new THREE.Vector3()),
  );
  const SIGN = [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ];

  return {
    scene,
    camera,
    resize(w, h) {
      // Le portail encadre le formulaire : dimensions en pixels → unités monde.
      const unit = (halfHeight(camera, 10) * 2) / h;
      W = Math.min(720, w * 0.86) * unit;
      H = Math.min(700, h * 0.8) * unit;
    },
    update(t, dt) {
      const d = dt || 0.016;
      open = damp(open, signals.portal.open, 5, d);
      const c = signals.portal.collapse;
      const breath = 1 + 0.02 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 4));
      group.rotation.x = -THREE.MathUtils.degToRad(5 + open * 5);
      // Le portail reste accroché au formulaire quand la page défile.
      group.position.y = (window.scrollY * (halfHeight(camera, 10) * 2)) / ctx.size.h - 0.25;
      group.scale.setScalar(breath);
      mat.uniforms.uOpacity.value = 0.3 + open * 0.45;

      for (let fI = 0; fI < FRAMES; fI++) {
        const s = 1 - fI * 0.075;
        const z = -fI * (0.9 + open * 0.9);
        for (let k = 0; k < 4; k++) {
          // Effondrement : chaque coin se replie vers le centre en tournant.
          const fold = Math.min(1, c * (1 + k * 0.18 + fI * 0.1));
          const e = fold * fold * (3 - 2 * fold);
          corner.set((SIGN[k][0] * W * s) / 2, (SIGN[k][1] * H * s) / 2, z);
          const ang = e * Math.PI * 0.8 * (k % 2 ? 1 : -1);
          const x = corner.x * Math.cos(ang) - corner.y * Math.sin(ang);
          const y = corner.x * Math.sin(ang) + corner.y * Math.cos(ang);
          corners[fI][k].set(x * (1 - e), y * (1 - e), z - e * 6);
        }
      }
      let o = 0;
      const put = (a: THREE.Vector3, b: THREE.Vector3, alpha: number) => {
        positions.set([a.x, a.y, a.z, b.x, b.y, b.z], o * 6);
        alphas[o * 2] = alphas[o * 2 + 1] = alpha;
        o++;
      };
      for (let fI = 0; fI < FRAMES; fI++) {
        const a = 1 - fI * 0.24;
        for (let k = 0; k < 4; k++) put(corners[fI][k], corners[fI][(k + 1) % 4], a);
        if (fI < FRAMES - 1) for (let k = 0; k < 4; k++) put(corners[fI][k], corners[fI + 1][k], a * 0.5);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;

      dustMat.color.copy(ctx.accent);
      const speed = (0.6 + open * 2.2) * d;
      for (let i = 0; i < DUST; i++) {
        let z = dustPos[i * 3 + 2] + speed;
        if (z > 8) z = -30;
        dustPos[i * 3 + 2] = z;
      }
      dustGeo.attributes.position.needsUpdate = true;
      dust.visible = signals.quality === 1 || true;
      camera.position.x = signals.mouse.x * 0.25;
      camera.position.y = signals.mouse.y * 0.15;
      camera.lookAt(0, 0, 0);
    },
  };
}
