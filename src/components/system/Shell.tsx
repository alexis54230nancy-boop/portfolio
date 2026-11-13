"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { audio, type Mood } from "@/lib/audio";
import { chapterFromPath, type ChapterId } from "@/lib/content";
import { signals } from "@/lib/signals";
import { eggs, local, session } from "@/lib/store";
import { SoundIcon } from "../Icons";
import { SysContext, type Sys } from "./context";
import Cursor from "./Cursor";
import Dock from "./Dock";
import Rain from "./Rain";
import Seuil from "./Seuil";
import Veil, { type VeilHandle } from "./Veil";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useIsoLayoutEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

const MOODS: Record<ChapterId, Mood> = {
  identite: "identite",
  strates: "strates",
  frequences: "frequences",
  fragment: "fragment",
  chronique: "chronique",
  fichier: "fichier",
  journal: "journal",
  connexion: "connexion",
};

type StageLike = { setScene: (id: string) => void; dispose: () => void };

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const chapter = chapterFromPath(pathname);
  const isHome = (pathname.replace(/\/+$/, "") || "/") === "/";
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const mobile = useMedia("(max-width: 767px)");

  const [mounted, setMounted] = useState(false);
  const [booting, setBooting] = useState(isHome);
  const [activate, setActivate] = useState(false);
  const [three, setThree] = useState(false);
  const [toast, setToast] = useState<string[] | null>(null);
  const [phantomOn, setPhantomOn] = useState(false);
  const [dockGone, setDockGone] = useState(false);

  const veil = useRef<VeilHandle>(null);
  const busy = useRef(false);
  const arrive = useRef<null | (() => void)>(null);
  const stage = useRef<StageLike | null>(null);
  const lenis = useRef<{ scrollTo: (y: number, o?: object) => void; destroy: () => void; raf: (t: number) => void } | null>(null);
  const live = useRef({ chapter, reduced, booting });
  live.current = { chapter, reduced, booting };
  const toastTimer = useRef(0);

  const muted = useSyncExternalStore(
    (fn) => audio.subscribe(fn),
    () => audio.muted,
    () => false,
  );

  /* ---------------- Montage : visites, état du boot ---------------- */

  useIsoLayoutEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove("no-js");
    if (!session.get("sys.counted")) {
      session.set("sys.counted", "1");
      local.set("sys.visits", String(local.num("sys.visits") + 1));
    }
    const booted = session.get("sys.booted") === "1";
    if (booted) setBooting(false);
    else if (!isHome) {
      setBooting(false);
      setActivate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Effets globaux utilitaires ---------------- */

  const glitch = useCallback(() => {
    if (live.current.reduced) return;
    const el = document.getElementById("systeme");
    if (!el) return;
    el.classList.remove("fx-glitch");
    void el.offsetWidth;
    el.classList.add("fx-glitch");
    window.setTimeout(() => el.classList.remove("fx-glitch"), 220);
  }, []);

  const showToast = useCallback((lines: string[], ms = 3200) => {
    clearTimeout(toastTimer.current);
    setToast(lines);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }, []);

  /* ---------------- Navigation avec transition narrative ---------------- */

  const navigate = useCallback(
    (href: string) => {
      const target = chapterFromPath(href);
      if (busy.current) return;
      if (target.id === live.current.chapter.id) {
        if (lenis.current) lenis.current.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: live.current.reduced ? "auto" : "smooth" });
        return;
      }
      if (live.current.reduced || !veil.current) {
        router.push(href);
        return;
      }
      busy.current = true;
      const secret = target.id === "fragment";
      glitch();
      audio.sfx("whoosh");
      if (secret) audio.setMood("silence", 0.25);
      veil.current.show(secret ? "" : target.loading);
      const arrived = new Promise<void>((res) => {
        arrive.current = res;
        window.setTimeout(res, 3500);
      });
      window.setTimeout(() => router.push(href), 240);
      const minimum = new Promise<void>((res) => window.setTimeout(res, secret ? 1200 : 1350));
      void Promise.all([arrived, minimum]).then(async () => {
        await veil.current?.finish();
        busy.current = false;
      });
    },
    [router, glitch],
  );

  const reboot = useCallback(() => {
    session.del("sys.booted");
    audio.setMood("silence", 0.4);
    glitch();
    setBooting(true);
    if (live.current.chapter.id !== "identite") router.push("/");
    else window.scrollTo(0, 0);
  }, [router, glitch]);

  /* ---------------- Mode profond (5 clics sur le point) ---------------- */

  const deepTimer = useRef(0);
  const deepMode = useCallback(() => {
    if (document.documentElement.dataset.deep === "1") return;
    if (!eggs.claim("deep", { once: false })) return;
    document.documentElement.dataset.deep = "1";
    audio.unlock();
    audio.deep(true);
    showToast(["> MODE PROFOND ACTIVÉ.", "TU VOIS MAINTENANT."], 4200);
    const t0 = performance.now();
    const ramp = (to: number) => {
      const from = signals.deep;
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / 500);
        signals.deep = from + (to - from) * k;
        if (k < 1) requestAnimationFrame(step);
      };
      step();
    };
    ramp(1);
    clearTimeout(deepTimer.current);
    deepTimer.current = window.setTimeout(() => {
      delete document.documentElement.dataset.deep;
      signals.deep = 0;
      audio.deep(false);
    }, 10000);
  }, [showToast]);

  const phantom = useCallback(() => {
    setPhantomOn(true);
    window.setTimeout(() => {
      setPhantomOn(false);
      showToast(["> IL EST PASSÉ.", "IL NE REVIENT PAS."], 3600);
    }, 5000);
  }, [showToast]);

  /* ---------------- Changement de chapitre ---------------- */

  useEffect(() => {
    arrive.current?.();
    arrive.current = null;
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true, force: true });
    signals.scroll = 0;
    stage.current?.setScene(chapter.id);
  }, [chapter.id]);

  useEffect(() => {
    signals.paused = booting || activate;
    if (booting) return;
    audio.setMood(MOODS[chapter.id]);
  }, [chapter.id, booting, activate]);

  /* ---------------- Son : déverrouillage au premier geste + micro-sons ---------------- */

  useEffect(() => {
    const CLICKABLE = "a, button, [role='button'], summary, input, textarea";
    const unlock = () => audio.unlock();
    let lastHover: Element | null = null;
    const over = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(CLICKABLE) ?? null;
      if (t && t !== lastHover && e.pointerType !== "touch") audio.sfx("whisper");
      lastHover = t;
    };
    const down = (e: PointerEvent) => {
      unlock();
      const t = (e.target as Element | null)?.closest?.("a, button, [role='button'], summary");
      if (t) audio.sfx("tick");
    };
    // Remplissage des boutons depuis la position du curseur.
    const move = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest?.(".sys-btn") as HTMLElement | null;
      if (b) {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", `${e.clientX - r.left}px`);
        b.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      signals.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      signals.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      signals.mouse.px = e.clientX;
      signals.mouse.py = e.clientY;
    };
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  /* ---------------- Scroll : Lenis (bureau) + barre de progression ---------------- */

  useEffect(() => {
    if (!mounted) return;
    signals.frozen = reduced;
    const bar = document.getElementById("progress");
    const main = document.getElementById("contenu");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      signals.scroll = p;
      bar?.style.setProperty("--p", p.toFixed(4));
      main?.style.setProperty("--breath-y", `${window.scrollY + window.innerHeight / 2}px`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    let cancelled = false;
    let cleanup = () => {};
    if (!reduced && !mobile) {
      void Promise.all([import("lenis"), import("gsap")]).then(([{ default: Lenis }, { gsap }]) => {
        if (cancelled) return;
        const l = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
        const tick = (t: number) => l.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        lenis.current = l as unknown as typeof lenis.current;
        cleanup = () => {
          gsap.ticker.remove(tick);
          l.destroy();
          lenis.current = null;
        };
      });
    }
    return () => {
      cancelled = true;
      cleanup();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mounted, reduced, mobile]);

  /* ---------------- 3D : un seul renderer, chargé à la demande ---------------- */

  useEffect(() => {
    if (!mounted || mobile) {
      setThree(false);
      return;
    }
    const canvas = document.getElementById("stage") as HTMLCanvasElement | null;
    if (!canvas) return;
    let cancelled = false;
    void import("@/lib/three/stage")
      .then(({ Stage }) => {
        if (cancelled) return;
        try {
          const s = new Stage(canvas);
          stage.current = s;
          s.setScene(live.current.chapter.id);
          setThree(true);
        } catch {
          setThree(false); // WebGL indisponible : replis CSS
        }
      })
      .catch(() => setThree(false));
    return () => {
      cancelled = true;
      stage.current?.dispose();
      stage.current = null;
    };
  }, [mounted, mobile]);

  /* ---------------- Bug intentionnel : une fois, entre 30 s et 2 min ---------------- */

  const live2 = useRef({ mobile });
  live2.current = { mobile };
  useEffect(() => {
    if (!mounted || booting || activate || reduced) return;
    if (eggs.seen("bug")) return;
    const delay = 30000 + Math.random() * 90000;
    const t = window.setTimeout(() => {
      if (document.hidden || busy.current || !eggs.claim("bug")) return;
      const options = live2.current.mobile ? ["A", "B", "C"] : ["A", "B", "C", "D"];
      const pick = options[(Math.random() * options.length) | 0];
      audio.sfx("buzz");
      if (pick === "A") binaryBug();
      else if (pick === "B") {
        const el = document.getElementById("systeme");
        if (!el) return;
        el.style.transformOrigin = `50% ${window.scrollY + window.innerHeight / 2}px`;
        el.classList.add("fx-flip");
        window.setTimeout(() => {
          el.classList.remove("fx-flip");
          el.style.transformOrigin = "";
        }, 950);
      } else if (pick === "C") {
        setDockGone(true);
        window.setTimeout(() => {
          setDockGone(false);
          glitch();
        }, 2000);
      } else {
        window.dispatchEvent(new Event("sys:cursor-dup"));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [mounted, booting, activate, reduced, glitch]);

  /* ---------------- Fin du boot / activation ---------------- */

  const endBoot = useCallback(() => {
    session.set("sys.booted", "1");
    setBooting(false);
    glitch();
  }, [glitch]);

  const doActivate = (silent: boolean) => {
    session.set("sys.booted", "1");
    if (silent) audio.setMuted(true);
    audio.unlock();
    setActivate(false);
    glitch();
  };

  const value = useMemo<Sys>(
    () => ({ chapter, navigate, reboot, reduced, mobile, three, booting, glitch, toast: showToast, deepMode, phantom }),
    [chapter, navigate, reboot, reduced, mobile, three, booting, glitch, showToast, deepMode, phantom],
  );

  const hideChrome = booting || activate;
  const dotClicks = useRef({ n: 0, t: 0 });
  const onLogo = () => {
    const d = dotClicks.current;
    d.n++;
    clearTimeout(d.t);
    if (d.n >= 5) {
      d.n = 0;
      deepMode();
      return;
    }
    d.t = window.setTimeout(() => (d.n = 0), 1400);
  };

  return (
    <SysContext.Provider value={value}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <a className="skip-link" href="#navigation" style={{ left: 190 }}>
        Aller à la navigation
      </a>

      <canvas id="stage" className={`layer ${three ? "is-on" : ""}`} aria-hidden="true" />
      <Rain paused={reduced} />

      <div id="systeme">
        <main id="contenu" tabIndex={-1} className={reduced ? undefined : "breath"} inert={mounted && (booting || activate)}>
          {children}
        </main>
      </div>

      <div className="grain" aria-hidden="true" />
      <div id="progress" className="progress" aria-hidden="true" />

      <div className="hud" style={{ opacity: hideChrome ? 0 : 1, visibility: hideChrome ? "hidden" : "visible" }}>
        <div className="hud__id">
          <button type="button" className="hud__dot" onClick={onLogo} aria-label="Signal du système" tabIndex={-1}>
            <i />
          </button>
          <span className="hidden sm:inline">ALEXIS_MICHAUX&nbsp;//&nbsp;</span>
          <span className="hud__here">
            {chapter.secret ? "??" : chapter.num}
            <span className="hidden sm:inline"> {chapter.label}</span>
          </span>
        </div>
        <button
          type="button"
          className="hud__btn"
          aria-pressed={muted}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          onClick={() => {
            audio.unlock();
            audio.setMuted(!muted);
          }}
        >
          <SoundIcon muted={muted} />
        </button>
      </div>

      <Dock hidden={hideChrome || dockGone} />

      <Veil ref={veil} />

      {booting && isHome && <Seuil onDone={endBoot} />}

      {activate && (
        <div className="activate" role="dialog" aria-modal="true" aria-labelledby="activate-title">
          <div className="text-center px-6">
            <p id="activate-title" className="label mb-8">
              UN SYSTÈME ATTEND TON SIGNAL.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" className="sys-btn sys-btn--primary" autoFocus onClick={() => doActivate(false)}>
                ACTIVER LE SYSTÈME
              </button>
              <button type="button" className="sys-btn sys-btn--ghost" onClick={() => doActivate(true)}>
                ENTRER_EN_SILENCE
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}

      {phantomOn && (
        <svg className="phantom" viewBox="0 0 120 300" aria-hidden="true">
          <path
            fill="none"
            stroke="var(--green)"
            strokeWidth="1"
            d="M60 22a16 16 0 1 0 0 32 16 16 0 0 0 0-32zM60 54v8M34 70h52l6 78-12 4-6-58v196H62V178h-4v112H46V94l-6 58-12-4z"
          />
        </svg>
      )}

      <Cursor reduced={reduced} />

      {/* Filtre de distorsion du reflet (Identité) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="wave" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence id="wave-turb" type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="1" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </SysContext.Provider>
  );
}

/** Bug A : tous les textes visibles passent en binaire pendant 500 ms. */
function binaryBug() {
  const root = document.getElementById("systeme");
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const saved: [Text, string][] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    const p = t.parentElement;
    if (!p || !t.data.trim() || p.closest(".sr-only, script, style")) continue;
    const r = p.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    saved.push([t, t.data]);
    t.data = t.data.replace(/\S/g, () => (Math.random() > 0.5 ? "1" : "0"));
  }
  window.setTimeout(() => saved.forEach(([t, s]) => (t.data = s)), 500);
}
