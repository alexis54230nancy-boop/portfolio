"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";

export type VeilHandle = {
  show: (text: string) => void;
  finish: () => Promise<void>;
};

/**
 * Voile de transition : fond noir, texte tapé, warp 3D (particules projetées
 * en perspective qui s'étirent vers le visiteur), flash et ligne de scan.
 */
const Veil = forwardRef<VeilHandle>(function Veil(_, ref) {
  const root = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLParagraphElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ raf: 0, typer: 0, speed: 1, run: false });

  useImperativeHandle(ref, () => ({
    show(label: string) {
      const el = root.current!;
      const cv = canvas.current!;
      const st = state.current;
      el.classList.remove("is-flash", "is-scan");
      el.classList.add("is-on");
      // Texte tapé
      const p = text.current!;
      p.textContent = "";
      clearInterval(st.typer);
      let i = 0;
      if (label) {
        st.typer = window.setInterval(() => {
          i++;
          p.textContent = label.slice(0, i);
          if (i >= label.length) clearInterval(st.typer);
        }, 18);
      }
      // Warp
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = (cv.width = Math.floor(window.innerWidth * dpr));
      const h = (cv.height = Math.floor(window.innerHeight * dpr));
      const ctx = cv.getContext("2d")!;
      const N = 220;
      const stars = Array.from({ length: N }, () => ({
        x: (Math.random() - 0.5) * 260,
        y: (Math.random() - 0.5) * 260,
        z: Math.random() * 200 + 1,
      }));
      const f = Math.min(w, h) * 0.9;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--green-rgb").trim() || "0,255,65";
      st.speed = 0.5;
      st.run = true;
      cancelAnimationFrame(st.raf);
      let last = performance.now();
      const frame = (now: number) => {
        if (!st.run) return;
        const dt = Math.min(50, now - last) / 16.67;
        last = now;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, w, h);
        ctx.lineCap = "round";
        for (const s of stars) {
          const pz = s.z;
          s.z -= st.speed * dt;
          if (s.z < 1) {
            s.z = 200;
            s.x = (Math.random() - 0.5) * 260;
            s.y = (Math.random() - 0.5) * 260;
            continue;
          }
          const x0 = w / 2 + (s.x / pz) * f;
          const y0 = h / 2 + (s.y / pz) * f;
          const x1 = w / 2 + (s.x / s.z) * f;
          const y1 = h / 2 + (s.y / s.z) * f;
          const a = Math.min(1, (200 - s.z) / 140) * 0.8;
          ctx.strokeStyle = `rgba(${accent},${a})`;
          ctx.lineWidth = Math.max(1, (1 - s.z / 200) * 2.4 * dpr);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        st.raf = requestAnimationFrame(frame);
      };
      st.raf = requestAnimationFrame(frame);
    },
    finish() {
      const el = root.current!;
      const st = state.current;
      // Accélération : les particules s'étirent en lignes vers le visiteur.
      const t0 = performance.now();
      const ramp = () => {
        const k = Math.min(1, (performance.now() - t0) / 400);
        st.speed = 0.5 + k * k * 22;
        if (k < 1 && st.run) requestAnimationFrame(ramp);
      };
      ramp();
      el.classList.add("is-flash", "is-scan");
      return new Promise<void>((resolve) => {
        window.setTimeout(() => {
          el.classList.remove("is-on");
          window.setTimeout(() => {
            st.run = false;
            cancelAnimationFrame(st.raf);
            el.classList.remove("is-flash", "is-scan");
            resolve();
          }, 260);
        }, 400);
      });
    },
  }));

  return (
    <div ref={root} className="veil" aria-hidden="true">
      <canvas ref={canvas} />
      <p ref={text} className="veil__text" />
      <div className="veil__scan" />
      <div className="veil__flash" />
    </div>
  );
});

export default Veil;
