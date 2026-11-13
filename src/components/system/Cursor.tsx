"use client";
import { useEffect, useRef } from "react";
import { noise3 } from "@/lib/noise";

const CLICKABLE = "a, button, [role='button'], input, textarea, select, label, summary, [data-cursor]";
const MAX = 300;

type P = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; size: number; seed: number };

/**
 * Curseur "fumée verte digitale".
 * Bureau : point vert + traînée de particules carrées, portées par un champ
 * de bruit 3D ; au clic elles foncent vers la caméra (axe z, perspective).
 * Tactile : trois points CSS. Mouvement réduit : carré vert statique.
 */
export default function Cursor({ reduced }: { reduced: boolean }) {
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const touch = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const el = dot.current!;
    const cv = canvas.current!;

    /* ---------- Tactile : 3 points à opacité décroissante ---------- */
    if (!fine) {
      if (reduced) return;
      const dots = Array.from(touch.current!.children) as HTMLElement[];
      const trail = dots.map(() => ({ x: 0, y: 0 }));
      let tx = 0;
      let ty = 0;
      let alive = 0;
      let raf = 0;
      const move = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        tx = t.clientX;
        ty = t.clientY;
        if (alive <= 0) {
          trail.forEach((p) => {
            p.x = tx;
            p.y = ty;
          });
          raf = requestAnimationFrame(loop);
        }
        alive = 1;
      };
      const loop = () => {
        alive -= 0.02;
        trail.forEach((p, i) => {
          const k = 0.35 - i * 0.09;
          p.x += (tx - p.x) * k;
          p.y += (ty - p.y) * k;
          dots[i].style.transform = `translate(${p.x}px, ${p.y}px)`;
          dots[i].style.opacity = String(Math.max(0, alive) * (0.6 - i * 0.18));
        });
        if (alive > 0) raf = requestAnimationFrame(loop);
      };
      window.addEventListener("touchstart", move, { passive: true });
      window.addEventListener("touchmove", move, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("touchstart", move);
        window.removeEventListener("touchmove", move);
      };
    }

    /* ---------- Bureau ---------- */
    document.documentElement.classList.add("has-cursor");
    const ctx = cv.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = w + "px";
      cv.style.height = h + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const parts: P[] = [];
    let mx = -100;
    let my = -100;
    let lx = mx;
    let ly = my;
    let raf = 0;
    let running = false;
    let rgb = "0,255,65";
    let rgbAt = 0;

    const spawn = (x: number, y: number, burst = false) => {
      if (parts.length >= MAX) parts.shift();
      const a = Math.random() * Math.PI * 2;
      const sp = burst ? 1 + Math.random() * 3 : Math.random() * 0.4;
      parts.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        z: 0,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (burst ? 0 : 0.25),
        vz: burst ? 2.2 + Math.random() * 2.5 : 0,
        life: 1,
        size: 2 + Math.floor(Math.random() * 3) * 2,
        seed: Math.random() * 100,
      });
    };

    const frame = (now: number) => {
      if (now - rgbAt > 500) {
        rgb = getComputedStyle(document.documentElement).getPropertyValue("--green-rgb").trim() || rgb;
        rgbAt = now;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const t = now * 0.0004;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= p.vz > 0 ? 0.055 : 0.0167; // 1 s de vie, 300 ms en explosion
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        // Champ de bruit 3D : la fumée dérive et s'enroule.
        const n1 = noise3(p.x * 0.006, p.y * 0.006, t + p.seed);
        const n2 = noise3(p.y * 0.006 + 40, p.x * 0.006 - 17, t + p.seed);
        p.vx += n1 * 0.12;
        p.vy += n2 * 0.12 - 0.008;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        const persp = 1 / Math.max(0.15, 1 - p.z / 60);
        const k = 1 - p.life;
        const s = p.size * (1 + k * 0.3) * persp;
        // Pixelisation : positions alignées sur une grille de 2 px.
        const px = Math.round((p.x + (p.x - mx) * (persp - 1)) / 2) * 2;
        const py = Math.round((p.y + (p.y - my) * (persp - 1)) / 2) * 2;
        const a = 0.6 * p.life;
        // Halo (équivalent du flou qui s'élargit) puis cœur net.
        ctx.fillStyle = `rgba(${rgb},${a * 0.16 * k * 2})`;
        const halo = s + k * 15;
        ctx.fillRect(px - halo / 2, py - halo / 2, halo, halo);
        ctx.fillStyle = `rgba(${rgb},${a})`;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
      if (parts.length) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;
      el.style.transform = `translate(${mx}px, ${my}px)`;
      el.classList.add("is-on");
      const target = e.target as Element | null;
      el.classList.toggle("is-link", !!target?.closest?.(CLICKABLE));
      if (reduced) return;
      const d = Math.hypot(mx - lx, my - ly);
      if (lx < 0) {
        lx = mx;
        ly = my;
        return;
      }
      const n = Math.min(6, Math.floor(d / 7));
      for (let i = 0; i < n; i++) {
        const k = i / n;
        spawn(lx + (mx - lx) * k, ly + (my - ly) * k);
      }
      if (n > 0) {
        lx = mx;
        ly = my;
        kick();
      }
    };
    const onDown = () => {
      el.classList.add("is-down");
      if (reduced) return;
      for (const p of parts) p.vz = 2 + Math.random() * 2.5;
      for (let i = 0; i < 26; i++) spawn(mx, my, true);
      kick();
    };
    const onUp = () => el.classList.remove("is-down");
    const onLeave = () => el.classList.remove("is-on");
    // Bug intentionnel D : le curseur se dédouble une seconde.
    const onDup = () => {
      const g = document.createElement("div");
      g.className = "cursor-ghost";
      document.body.appendChild(g);
      const t0 = performance.now();
      const follow = (now: number) => {
        const k = now - t0;
        g.style.left = mx + Math.sin(k / 90) * 34 + 26 + "px";
        g.style.top = my + Math.cos(k / 120) * 22 + 18 + "px";
        if (k < 1000) requestAnimationFrame(follow);
        else {
          g.style.transition = "transform .18s, opacity .18s";
          g.style.transform = "scale(5)";
          g.style.opacity = "0";
          for (let i = 0; i < 20; i++) spawn(parseFloat(g.style.left), parseFloat(g.style.top), true);
          kick();
          window.setTimeout(() => g.remove(), 220);
        }
      };
      requestAnimationFrame(follow);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("sys:cursor-dup", onDup);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("sys:cursor-dup", onDup);
    };
  }, [reduced]);

  return (
    <div aria-hidden="true">
      <canvas ref={canvas} id="cursor-fx" />
      <div ref={dot} className="cursor" />
      <div ref={touch}>
        <i className="touch-dot" />
        <i className="touch-dot" />
        <i className="touch-dot" />
      </div>
    </div>
  );
}
