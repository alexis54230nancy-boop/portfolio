import * as THREE from "three";
import { signals } from "../../signals";
import { type Ctx, damp, halfHeight, makeCamera, type SceneHandle } from "../stage";

const BARS = 64;
const RADIUS = 2.5;
export const PASSION_COUNT = 6;

/**
 * FRÉQUENCES — égaliseur circulaire de 64 barres (audio simulé), qui se
 * disperse en particules au scroll, puis six tores concentriques façon vinyle.
 */
export function create(ctx: Ctx): SceneHandle {
  const scene = new THREE.Scene();
  const camera = makeCamera(40, 11);

  /* ---------- Anneau de barres ---------- */
  const ring = new THREE.Group();
  scene.add(ring);
  const barGeo = new THREE.BoxGeometry(0.075, 1, 0.075).translate(0, 0.5, 0);
  const barMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.92 });
  const bars = new THREE.InstancedMesh(barGeo, barMat, BARS);
  bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  ring.add(bars);
  const dirs = Array.from({ length: BARS }, () =>
    new THREE.Vector3(Math.random() - 0.5, Math.random() * 1.4, Math.random() - 0.5).normalize(),
  );
  const seeds = Array.from({ length: BARS }, () => Math.random() * 10);
  const circle = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 128 }, (_, i) => {
        const a = (i / 128) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * (RADIUS - 0.18), 0, Math.sin(a) * (RADIUS - 0.18));
      }),
    ),
    new THREE.LineBasicMaterial({ transparent: true, opacity: 0.25 }),
  );
  ring.add(circle);

  /* ---------- Vinyle : tores concentriques ---------- */
  const vinyl = new THREE.Group();
  scene.add(vinyl);
  const radii = Array.from({ length: PASSION_COUNT }, (_, i) => 0.62 + i * 0.44);
  const tori = radii.map((r, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.05, 5, 110),
      new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0, depthWrite: false }),
    );
    m.rotation.x = (Math.sin(i * 2.4) * 0.09);
    m.rotation.y = (Math.cos(i * 1.7) * 0.09);
    vinyl.add(m);
    return m;
  });
  vinyl.rotation.x = -0.42;

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const normal = new THREE.Vector3();
  let tilt = 1.02;
  let picked = -1;
  const levels = new Float32Array(PASSION_COUNT);

  return {
    scene,
    camera,
    update(t, dt) {
      const d = dt || 0.016;
      const f = signals.freq;
      const wide = ctx.size.aspect > 1.15;
      const hw = halfHeight(camera, 11) * ctx.size.aspect;
      ring.position.x = wide ? hw * 0.44 : 0;
      vinyl.position.x = wide ? -hw * 0.4 : 0;

      /* Anneau */
      tilt = damp(tilt, 1.02 - (f.group >= 0 ? 0.262 : 0), 5, d); // +15° au survol d'un groupe
      ring.rotation.x = Math.PI / 2 - tilt;
      ring.rotation.y = t * 0.08;
      const dis = f.disperse;
      for (let i = 0; i < BARS; i++) {
        const g = i < 22 ? 0 : i < 43 ? 1 : 2;
        const a = (i / BARS) * Math.PI * 2;
        // Audio simulé : sinusoïdes + bruit, plus rapides et plus fines vers l'aigu.
        const sp = [1.3, 2.4, 4.6][g];
        const amp = [1.5, 1.05, 0.7][g];
        let v =
          0.5 +
          0.5 * Math.sin(t * sp + i * 0.55) * Math.sin(t * sp * 0.37 + seeds[i]) +
          0.25 * Math.sin(t * sp * 2.3 + seeds[i] * 3.0);
        v = 0.18 + Math.max(0, v) * amp;
        if (f.group === g) v *= 1.35;
        const k = dis * dis;
        dummy.position.set(Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS).addScaledVector(dirs[i], k * 7);
        dummy.rotation.set(k * seeds[i], -a + k * seeds[i] * 2, k * 3);
        dummy.scale.set(1 + k * 0.4, THREE.MathUtils.lerp(v, 0.09, Math.min(1, dis * 2.2)), 1 + k * 0.4);
        dummy.updateMatrix();
        bars.setMatrixAt(i, dummy.matrix);
        const lum = f.group === -1 ? 0.6 : f.group === g ? 1 : 0.13;
        col.copy(ctx.accent).multiplyScalar(lum * (1 - dis * 0.92));
        bars.setColorAt(i, col);
      }
      bars.instanceMatrix.needsUpdate = true;
      if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
      (circle.material as THREE.LineBasicMaterial).color.copy(ctx.accent);
      (circle.material as THREE.LineBasicMaterial).opacity = 0.25 * (1 - dis);
      ring.visible = dis < 0.995;

      /* Vinyle */
      const vin = f.passionsIn;
      vinyl.visible = vin > 0.01;
      vinyl.rotation.y = signals.mouse.x * 0.12;
      vinyl.rotation.x = -0.42 + signals.mouse.y * 0.06;
      tori.forEach((m, i) => {
        const on = f.passion === i ? 1 : 0;
        levels[i] = damp(levels[i], on, 6, d);
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.color.copy(ctx.accent);
        mat.opacity = vin * (0.2 + levels[i] * 0.5);
        m.rotation.z += d * (0.04 + i * 0.006 + levels[i] * ((Math.PI * 2) / 8));
        const s = 1 + levels[i] * 0.03;
        m.scale.setScalar(s * (0.9 + 0.1 * vin));
      });

      /* Survol : intersection souris / plan du vinyle → anneau le plus proche */
      if (vin > 0.6) {
        ndc.set(signals.mouse.x, signals.mouse.y);
        ray.setFromCamera(ndc, camera);
        vinyl.updateMatrixWorld();
        normal.set(0, 0, 1).transformDirection(vinyl.matrixWorld);
        plane.setFromNormalAndCoplanarPoint(normal, vinyl.getWorldPosition(hit));
        let pick = -1;
        if (ray.ray.intersectPlane(plane, hit)) {
          vinyl.worldToLocal(hit);
          const r = Math.hypot(hit.x, hit.y);
          let best = 0.24;
          radii.forEach((rr, i) => {
            const dd = Math.abs(r - rr);
            if (dd < best) {
              best = dd;
              pick = i;
            }
          });
        }
        if (pick !== picked) {
          picked = pick;
          f.onPassion?.(pick);
        }
      }
    },
  };
}
