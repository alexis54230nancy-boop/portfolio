import * as THREE from "three";
import { signals } from "../../signals";
import { type Ctx, damp, halfHeight, makeCamera, type SceneHandle } from "../stage";

/**
 * IDENTITÉ — un tore déformé en fil de fer, 200 particules en orbite.
 * Au scroll, la caméra recule : le visiteur "plonge".
 */
export function create(ctx: Ctx): SceneHandle {
  const scene = new THREE.Scene();
  const camera = makeCamera(45, 8);
  const group = new THREE.Group();
  scene.add(group);

  const torusMat = new THREE.ShaderMaterial({
    wireframe: true,
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: ctx.accent }, uOpacity: { value: 0.11 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vDepth;
      void main() {
        vec3 p = position;
        float t = uTime * 0.35;
        float d = sin(p.x * 1.7 + t) * sin(p.y * 2.1 + t * 1.3) * sin(p.z * 2.6 + t * 0.7);
        d += 0.5 * sin(p.x * 3.9 - t * 1.1) * sin(p.y * 3.1 + t);
        p += normal * d * 0.34;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vDepth;
      void main() {
        float fade = smoothstep(30.0, 5.0, vDepth);
        gl_FragColor = vec4(uColor, uOpacity * fade);
      }`,
  });
  const torus = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.82, 26, 96), torusMat);
  torus.rotation.set(1.1, 0.3, 0);
  group.add(torus);

  // 200 particules : l'orbite est calculée dans le vertex shader.
  const COUNT = 200;
  const orbit = new Float32Array(COUNT * 4);
  const tilt = new Float32Array(COUNT * 2);
  for (let i = 0; i < COUNT; i++) {
    orbit[i * 4] = 2.9 + Math.random() * 2.4; // rayon
    orbit[i * 4 + 1] = Math.random() * Math.PI * 2; // phase
    orbit[i * 4 + 2] = (0.08 + Math.random() * 0.22) * (Math.random() > 0.5 ? 1 : -1); // vitesse
    orbit[i * 4 + 3] = 1 + Math.random() * 2.2; // taille
    tilt[i * 2] = (Math.random() - 0.5) * 1.6;
    tilt[i * 2 + 1] = Math.random() * Math.PI * 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
  pGeo.setAttribute("aOrbit", new THREE.Float32BufferAttribute(orbit, 4));
  pGeo.setAttribute("aTilt", new THREE.Float32BufferAttribute(tilt, 2));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: ctx.accent }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aOrbit;
      attribute vec2 aTilt;
      uniform float uTime;
      uniform float uScale;
      varying float vA;
      void main() {
        float a = aOrbit.y + uTime * aOrbit.z;
        vec3 p = vec3(cos(a), 0.0, sin(a)) * aOrbit.x;
        float c = cos(aTilt.x), s = sin(aTilt.x);
        p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
        float c2 = cos(aTilt.y), s2 = sin(aTilt.y);
        p = vec3(p.x * c2 - p.z * s2, p.y, p.x * s2 + p.z * c2);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aOrbit.w * uScale * (9.0 / -mv.z);
        vA = smoothstep(30.0, 4.0, -mv.z) * (0.35 + 0.65 * fract(aOrbit.y * 7.3));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      void main() { gl_FragColor = vec4(uColor, vA); }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  group.add(points);

  let camZ = 8;
  return {
    scene,
    camera,
    update(t, dt) {
      torusMat.uniforms.uTime.value = t;
      pMat.uniforms.uTime.value = t;
      pMat.uniforms.uScale.value = ctx.renderer.getPixelRatio();
      pGeo.setDrawRange(0, Math.floor(COUNT * signals.quality));
      torus.rotation.z = t * 0.05;
      torus.rotation.y = 0.3 + t * 0.07;
      // Le tore se place derrière le nom, légèrement à droite sur grand écran.
      const hw = halfHeight(camera, 8) * ctx.size.aspect;
      group.position.x = ctx.size.aspect > 1.2 ? hw * 0.46 : 0;
      group.rotation.x = damp(group.rotation.x, signals.mouse.y * 0.12, 3, dt || 0.016);
      group.rotation.y = damp(group.rotation.y, signals.mouse.x * 0.16, 3, dt || 0.016);
      // Plongée : la page d'accueil fait ~3 écrans, la caméra recule avec le scroll.
      camZ = damp(camZ, 8 + signals.scroll * 16, 4, dt || 0.016);
      camera.position.z = camZ;
      torusMat.uniforms.uOpacity.value = 0.12 - signals.scroll * 0.07;
    },
  };
}
