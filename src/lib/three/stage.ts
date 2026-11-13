/**
 * SCÈNE 3D — un seul renderer Three.js pour tout le site.
 * Chaque chapitre fournit une "scène" (chargée à la demande) qui est
 * simplement échangée quand on change de page.
 */
import * as THREE from "three";
import { signals } from "../signals";

export type Ctx = {
  renderer: THREE.WebGLRenderer;
  /** Couleur d'accent courante (vert, ou rouge en mode profond). */
  accent: THREE.Color;
  size: { w: number; h: number; aspect: number };
};

export type SceneHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (t: number, dt: number) => void;
  resize?: (w: number, h: number) => void;
  dispose?: () => void;
};

type Factory = (ctx: Ctx) => SceneHandle;

const LOADERS: Record<string, () => Promise<{ create: Factory }>> = {
  identite: () => import("./scenes/identite"),
  frequences: () => import("./scenes/frequences"),
  fragment: () => import("./scenes/fragment"),
  chronique: () => import("./scenes/chronique"),
  connexion: () => import("./scenes/connexion"),
  ambient: () => import("./scenes/ambient"),
};

const GREEN = new THREE.Color("#00ff41");
const RED = new THREE.Color("#ff0040");

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private ctx: Ctx;
  private current: SceneHandle | null = null;
  private token = 0;
  private raf = 0;
  private last = 0;
  private time = 0;
  private slow = 0;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.ctx = {
      renderer: this.renderer,
      accent: GREEN.clone(),
      size: { w: 1, h: 1, aspect: 1 },
    };
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.raf = requestAnimationFrame(this.frame);
  }

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(w, h, false);
    this.ctx.size = { w, h, aspect: w / h };
    if (this.current) {
      this.current.camera.aspect = w / h;
      this.current.camera.updateProjectionMatrix();
      this.current.resize?.(w, h);
    }
  };

  private onVisibility = () => {
    cancelAnimationFrame(this.raf);
    if (!document.hidden && !this.disposed) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    // Adaptation : sous 30 images/s pendant 2 s, on divise les particules par deux.
    if (signals.paused) return;
    if (dt > 1 / 30) this.slow += dt;
    else this.slow = Math.max(0, this.slow - dt * 0.5);
    if (this.slow > 2 && signals.quality === 1) signals.quality = 0.5;
    if (!signals.frozen) this.time += dt;
    this.ctx.accent.copy(GREEN).lerp(RED, signals.deep);
    if (!this.current || signals.paused) return;
    this.current.update(this.time, signals.frozen ? 0 : dt);
    this.renderer.render(this.current.scene, this.current.camera);
  };

  async setScene(id: string) {
    const token = ++this.token;
    const loader = LOADERS[id] ?? LOADERS.ambient;
    this.canvas.style.opacity = "0";
    const [mod] = await Promise.all([loader(), new Promise((r) => setTimeout(r, 260))]);
    if (token !== this.token || this.disposed) return;
    this.drop();
    const handle = mod.create(this.ctx);
    handle.camera.aspect = this.ctx.size.aspect;
    handle.camera.updateProjectionMatrix();
    handle.resize?.(this.ctx.size.w, this.ctx.size.h);
    this.current = handle;
    this.canvas.style.opacity = "";
  }

  private drop() {
    const c = this.current;
    if (!c) return;
    this.current = null;
    c.dispose?.();
    c.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    this.renderer.clear();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.drop();
    this.renderer.dispose();
  }
}

/* ---------------- Utilitaires partagés par les scènes ---------------- */

export function makeCamera(fov = 45, z = 8) {
  const cam = new THREE.PerspectiveCamera(fov, 1, 0.1, 400);
  cam.position.set(0, 0, z);
  return cam;
}

/** Demi-hauteur visible (en unités monde) à la distance `d` de la caméra. */
export function halfHeight(cam: THREE.PerspectiveCamera, d: number) {
  return Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * d;
}

export const damp = (a: number, b: number, lambda: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-lambda * dt));
