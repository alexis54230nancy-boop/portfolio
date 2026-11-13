import * as THREE from "three";
import { signals } from "../../signals";
import { type Ctx, makeCamera, type SceneHandle } from "../stage";

/** Décor neutre (Strates, Fichier, Journal) : grille en perspective qui avance. */
export function create(ctx: Ctx): SceneHandle {
  const scene = new THREE.Scene();
  const camera = makeCamera(55, 6);
  camera.position.set(0, 1.4, 6);
  camera.lookAt(0, 0.6, -10);

  const N = 44;
  const STEP = 2;
  const pts: number[] = [];
  const half = (N * STEP) / 2;
  for (let i = 0; i <= N; i++) {
    const p = -half + i * STEP;
    pts.push(p, 0, -half, p, 0, half, -half, 0, p, half, 0, p);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uColor: { value: ctx.accent }, uOffset: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uOffset;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.z = mod(p.z + uOffset + 44.0, 88.0) - 44.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vFade = smoothstep(46.0, 6.0, -mv.z) * smoothstep(0.0, 4.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vFade;
      void main() { gl_FragColor = vec4(uColor, vFade * 0.16); }`,
  });
  const grid = new THREE.LineSegments(geo, mat);
  grid.position.y = -1.6;
  scene.add(grid);

  return {
    scene,
    camera,
    update(t) {
      // Les lignes transversales défilent vers le visiteur ; le scroll accélère.
      mat.uniforms.uOffset.value = (t * 0.35 + signals.scroll * 30) % 2;
      camera.position.x = signals.mouse.x * 0.3;
      camera.lookAt(0, 0.6, -10);
    },
  };
}
