"use client";
import { useEffect, useRef } from "react";

/**
 * Pluie digitale, très discrète. Les glyphes sont les maximes du judo
 * (精力善用 "le meilleur usage de l'énergie", 自他共栄 "entraide et prospérité
 * mutuelle") — onze ans de tatami cachés dans le décor.
 */
const KANJI = "柔道精力善用自他共栄礼心技体一本";
const ASCII = "01<>/{}[]=+*";

function hasCJK() {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    const sig = (ch: string) => {
      x.clearRect(0, 0, 16, 16);
      x.font = "14px monospace";
      x.fillStyle = "#fff";
      x.fillText(ch, 0, 13);
      return Array.from(x.getImageData(0, 0, 16, 16).data).join("");
    };
    return sig("柔") !== sig("道");
  } catch {
    return false;
  }
}

export default function Rain({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || paused) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const glyphs = hasCJK() ? KANJI + "01" : ASCII;
    const SIZE = 16;
    let w = 0;
    let h = 0;
    type Drop = { x: number; y: number; v: number; len: number; g: string[] };
    let drops: Drop[] = [];
    const pick = () => glyphs[(Math.random() * glyphs.length) | 0];
    const spawn = (y?: number): Drop => {
      const len = 5 + ((Math.random() * 10) | 0);
      return {
        x: Math.floor((Math.random() * w) / SIZE) * SIZE,
        y: y ?? -Math.random() * h,
        v: 0.25 + Math.random() * 0.6,
        len,
        g: Array.from({ length: len }, pick),
      };
    };
    const resize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
      const n = Math.max(24, Math.min(80, Math.round(w / 22)));
      drops = Array.from({ length: n }, () => spawn(Math.random() * h));
    };
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 66 || document.hidden) return; // ~15 images/s suffisent
      last = now;
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--green-rgb").trim() || "0,255,65";
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${SIZE - 3}px monospace`;
      for (const d of drops) {
        d.y += d.v * 4;
        if (Math.random() < 0.04) d.g[(Math.random() * d.len) | 0] = pick();
        for (let i = 0; i < d.len; i++) {
          const y = d.y - i * SIZE;
          if (y < -SIZE || y > h + SIZE) continue;
          const a = (1 - i / d.len) * (i === 0 ? 0.22 : 0.11);
          ctx.fillStyle = `rgba(${rgb},${a})`;
          ctx.fillText(d.g[i], d.x, y);
        }
        if (d.y - d.len * SIZE > h) Object.assign(d, spawn(-20));
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [paused]);

  return <canvas ref={ref} id="rain" className="layer" aria-hidden="true" />;
}
