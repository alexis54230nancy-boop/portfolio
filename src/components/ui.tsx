"use client";
import Link from "next/link";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { audio } from "@/lib/audio";
import { useSystem } from "./system/context";

/* ------------------------------------------------------------------ */
/* Lien interne : vraie ancre (SEO, clavier) + transition narrative.   */
/* ------------------------------------------------------------------ */

type SysLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string };

export function SysLink({ href, onClick, children, ...rest }: SysLinkProps) {
  const { navigate } = useSystem();
  return (
    <Link
      href={href}
      prefetch={false}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Decode : révélation lettre par lettre à l'entrée dans l'écran.      */
/*  - mode "scramble" : caractères brouillés puis résolus (monospace)  */
/*  - mode "type"     : frappe progressive sans décalage de mise en page */
/* Le vrai texte reste dans le DOM pour les lecteurs d'écran.          */
/* ------------------------------------------------------------------ */

const GLYPHS = "01<>/\\[]{}#$%&*+=_-";

type DecodeProps = {
  text: string;
  as?: ElementType;
  mode?: "scramble" | "type";
  delay?: number;
  /** ms par caractère (30 par défaut, plafonné pour les longs textes). */
  speed?: number;
  className?: string;
  style?: CSSProperties;
  sound?: boolean;
  /** Démarre quand `when` passe à true (au lieu de l'entrée à l'écran). */
  when?: boolean;
  onDone?: () => void;
};

export function Decode({
  text,
  as: Tag = "span",
  mode = "scramble",
  delay = 0,
  speed = 30,
  className,
  style,
  sound,
  when,
  onDone,
}: DecodeProps) {
  const { reduced } = useSystem();
  const host = useRef<HTMLElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    const el = host.current;
    const o = out.current;
    if (!el || !o) return;
    if (reduced) {
      o.textContent = text;
      if (!done.current && when !== false) {
        done.current = true;
        cb.current?.();
      }
      return;
    }
    if (done.current) {
      o.textContent = text;
      return;
    }
    let raf = 0;
    let timer = 0;
    const paint = (n: number) => {
      if (mode === "type") {
        o.innerHTML = "";
        const a = document.createElement("span");
        a.textContent = text.slice(0, Math.max(0, n - 2));
        const b = document.createElement("span");
        b.style.color = "var(--green)";
        b.textContent = text.slice(Math.max(0, n - 2), n);
        const c = document.createElement("span");
        c.style.opacity = "0";
        c.textContent = text.slice(n);
        o.append(a, b, c);
      } else {
        let s = text.slice(0, n);
        for (let i = n; i < text.length; i++) {
          const ch = text[i];
          s += ch === " " || ch === "\n" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        o.textContent = s;
      }
    };
    const run = () => {
      const per = Math.min(speed, 1400 / Math.max(1, text.length));
      const t0 = performance.now();
      if (sound) audio.sfx("decode");
      const step = (now: number) => {
        const n = Math.min(text.length, Math.floor((now - t0) / per));
        paint(n);
        if (n < text.length) raf = requestAnimationFrame(step);
        else {
          o.textContent = text;
          done.current = true;
          cb.current?.();
        }
      };
      raf = requestAnimationFrame(step);
    };
    paint(0);
    if (when !== undefined) {
      if (when) timer = window.setTimeout(run, delay);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          timer = window.setTimeout(run, delay);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [text, mode, delay, speed, reduced, sound, when]);

  return (
    <Tag ref={host} className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span ref={out} aria-hidden="true">
        {text}
      </span>
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal : apparition douce d'un bloc (pour les contenus non textuels) */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Typewriter : lignes tapées une à une (boot, Fragment…).             */
/* ------------------------------------------------------------------ */

export function Typewriter({
  lines,
  speed = 30,
  linePause = 220,
  start = true,
  onDone,
  className,
  caret = true,
}: {
  lines: string[];
  speed?: number;
  linePause?: number;
  start?: boolean;
  onDone?: () => void;
  className?: string;
  caret?: boolean;
}) {
  const { reduced } = useSystem();
  const [shown, setShown] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const cb = useRef(onDone);
  cb.current = onDone;
  const key = lines.join("\n");

  useEffect(() => {
    if (!start) {
      setShown([]);
      setFinished(false);
      return;
    }
    if (reduced) {
      setShown(lines);
      setFinished(true);
      const t = window.setTimeout(() => cb.current?.(), 600);
      return () => clearTimeout(t);
    }
    // Piloté par le temps écoulé : la frappe garde son rythme même si une image saute.
    const ends: number[] = [];
    let acc = 0;
    for (const l of lines) {
      acc += l.length * speed;
      ends.push(acc);
      acc += linePause;
    }
    const total = ends[ends.length - 1] ?? 0;
    const t0 = performance.now();
    let raf = 0;
    let lastKey = "";
    const frame = (now: number) => {
      const t = now - t0;
      const out: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const begin = ends[i] - lines[i].length * speed;
        if (t < begin) break;
        out.push(lines[i].slice(0, Math.min(lines[i].length, Math.floor((t - begin) / speed) + 1)));
      }
      const k = out.length + ":" + (out[out.length - 1]?.length ?? 0);
      if (k !== lastKey) {
        lastKey = k;
        setShown(out);
      }
      if (t >= total) {
        setShown(lines);
        setFinished(true);
        cb.current?.();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, start, reduced, speed, linePause]);

  return (
    <div className={className} aria-live="polite">
      <p className="sr-only">{start ? lines.join(" ") : ""}</p>
      {shown.map((l, i) => (
        <p
          key={i}
          aria-hidden="true"
          className={caret && i === shown.length - 1 && !finished ? "caret" : undefined}
          style={{ minHeight: "1em" }}
        >
          {l || " "}
        </p>
      ))}
    </div>
  );
}

/* Étoile à quatre branches : motif récurrent du système. */
export function Spark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`spark ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 0c.8 7 5 11.200 12 12-7 .800-11.200 5-12 12-.800-7-5-11.200-12-12 7-.800 11.200-5 12-12z" />
    </svg>
  );
}

/* Titre de chapitre : numéro + nom + phrases narratives. */
export function ChapterHead({
  num,
  title,
  narrative,
  children,
}: {
  num: string;
  title: string;
  narrative: string[];
  children?: ReactNode;
}) {
  return (
    <header className="wrap pt-28 md:pt-36 pb-10 md:pb-16">
      <p className="label mb-5 flex items-center gap-3">
        <Spark size={14} />
        <span>
          <span className="text-green">{num}</span> — CHAPITRE
        </span>
      </p>
      <h1 className="title glitch" data-text={title}>
        <Decode text={title} speed={45} />
      </h1>
      <div className="mt-7 max-w-[62ch] space-y-1">
        {narrative.map((n, i) => (
          <Decode key={i} as="p" mode="type" text={n} delay={350 + i * 500} className="sys text-[15px] md:text-base" />
        ))}
      </div>
      {children}
    </header>
  );
}

/* Pilule segmentée avec indicateur glissant. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ x: 4, w: 0 });
  useEffect(() => {
    const place = () => {
      const b = root.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (b) setInd({ x: b.offsetLeft, w: b.offsetWidth });
    };
    place();
    window.addEventListener("resize", place);
    void document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [value]);
  return (
    <div ref={root} className="seg" role="group" aria-label={label}>
      <span className="seg__ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden="true" />
      {options.map((o) => (
        <button key={o.id} type="button" className="seg__btn" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
