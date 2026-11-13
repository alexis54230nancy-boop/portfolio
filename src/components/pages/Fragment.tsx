"use client";
import gsap from "gsap";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { audio, type Sfx } from "@/lib/audio";
import { fragmentFrames } from "@/lib/content";
import { signals } from "@/lib/signals";
import { eggs, local } from "@/lib/store";
import { SysLink, Typewriter } from "../ui";
import { useSystem } from "../system/context";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const FRAME_SFX: (Sfx | null)[] = ["bip", "crack", "tictac", null, "door"];

/**
 * PAGE 3.5 — LE FRAGMENT. Une page sans titre visible : un débris de moi
 * qui a pris forme dans le système, et qui attend qu'on lui rende son nom.
 */
export default function Fragment() {
  const { three, reduced, toast } = useSystem();
  const [intro, setIntro] = useState(0);
  const [active, setActive] = useState(-1);
  const [silenceLine, setSilenceLine] = useState(false);
  const [remembered, setRemembered] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [stage, setStage] = useState<"ask" | "thanks" | "leave" | "end">("ask");
  const frames = useRef<HTMLDivElement>(null);
  const nameSec = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const played = useRef(new Set<number>());
  const seen = useRef(false);
  const svg = useRef<HTMLDivElement>(null);

  /* ---------- Entrée : 2 s de noir, puis deux lignes ---------- */
  useEffect(() => {
    const f = signals.fragment;
    Object.assign(f, { t: 0, frame: 0, shatter: 0, split: 0, eye: 0, explode: 0, leave: 0, approach: 0, decay: 1, pulse: 0, glitch: 0, visible: 0 });
    setRemembered(local.get("fragment.name"));
    const t = [
      window.setTimeout(() => setIntro(1), reduced ? 0 : 2000),
      window.setTimeout(() => setIntro(2), reduced ? 0 : 3900),
    ];
    return () => {
      t.forEach(clearTimeout);
      gsap.killTweensOf(f);
      Object.assign(f, { visible: 0, explode: 0, leave: 0, approach: 0 });
    };
  }, [reduced]);

  /* ---------- Scroll → état de la silhouette ---------- */
  useEffect(() => {
    const onScroll = () => {
      const el = frames.current;
      if (!el) return;
      const f = signals.fragment;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const t = clamp01(-r.top / Math.max(1, r.height - vh));
      const sections = Array.from(el.children) as HTMLElement[];
      let a = -1;
      const local01: number[] = [];
      sections.forEach((s, i) => {
        const b = s.getBoundingClientRect();
        if (b.top < vh * 0.55) a = i;
        local01[i] = clamp01((vh * 0.55 - b.top) / b.height);
      });
      f.t = t;
      f.frame = a;
      f.visible = Math.max(intro >= 1 ? 0.55 : 0, smooth(vh * 0.9, vh * 0.2, r.top));
      f.shatter = Math.sin(Math.PI * (local01[1] ?? 0)) * 0.62;
      const l4 = local01[3] ?? 0;
      f.split = smooth(0.08, 0.3, l4) * (1 - smooth(0.82, 1, l4));
      f.eye = a >= 4 ? 1 : 0;
      setActive(a);
      if (svg.current) svg.current.dataset.frame = String(a);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [intro]);

  /* ---------- Son de chaque frame, une seule fois ---------- */
  useEffect(() => {
    if (active < 0 || played.current.has(active)) return;
    played.current.add(active);
    const s = FRAME_SFX[active];
    if (s) audio.sfx(s);
    if (active === 3) {
      // Le Silence : coupure nette, 4 secondes exactes.
      audio.silence(4000);
      const t = window.setTimeout(() => setSilenceLine(true), reduced ? 0 : 4000);
      return () => clearTimeout(t);
    }
  }, [active, reduced]);

  /* ---------- Il réagit : clic, absence de clic, immobilité ---------- */
  useEffect(() => {
    if (reduced) return;
    const f = signals.fragment;
    let noClick = window.setTimeout(() => (f.decay = 3.2), 10000);
    let idle = 0;
    let approached = false;
    const arm = () => {
      clearTimeout(idle);
      if (approached) {
        approached = false;
        gsap.to(f, { approach: 0, duration: 1.2, ease: "power2.out" });
      }
      idle = window.setTimeout(() => {
        if (f.frame < 0 || f.frame > 4 || document.hidden) return;
        if (!eggs.claim("dialogue")) return;
        approached = true;
        gsap.to(f, { approach: 1, duration: 2.4, ease: "power2.inOut" });
        toast(["> TU ES IMMOBILE.", "JE ME DEMANDE SI TU M'ENTENDS."], 5000);
      }, 15000);
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("a, button, input, form, nav")) return;
      clearTimeout(noClick);
      f.decay = 1;
      noClick = window.setTimeout(() => (f.decay = 3.2), 10000);
      if (f.visible < 0.3 || f.leave > 0) return;
      audio.sfx("cut");
      gsap.fromTo(f, { glitch: 1 }, { glitch: 0, duration: 0.2, ease: "steps(4)" });
      if (!seen.current) {
        seen.current = true;
        toast(['> "TU M\'AS VU."'], 2600);
      }
    };
    arm();
    const evs = ["pointermove", "scroll", "keydown", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    window.addEventListener("click", onClick);
    return () => {
      clearTimeout(noClick);
      clearTimeout(idle);
      evs.forEach((e) => window.removeEventListener(e, arm));
      window.removeEventListener("click", onClick);
    };
  }, [reduced, toast]);

  /* ---------- Le nom ---------- */
  const toName = () => {
    nameSec.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    window.setTimeout(() => input.current?.focus({ preventScroll: true }), reduced ? 0 : 900);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = (input.current?.value ?? "").trim().slice(0, 24).toUpperCase();
    if (!v) return;
    local.set("fragment.name", v);
    setName(v);
    setStage("thanks");
    const f = signals.fragment;
    audio.sfx("explode");
    audio.piano(220, 0.34, undefined, 2); // la première note de piano du site
    svg.current?.classList.add("is-named");
    if (!reduced) {
      gsap
        .timeline()
        .to(f, { explode: 1, duration: 0.9, ease: "power3.out" })
        .to(f, { explode: 0, duration: 1.5, ease: "power2.inOut" })
        .to(f, { pulse: 1, duration: 0.28, ease: "sine.inOut", yoyo: true, repeat: 5 });
    }
    window.setTimeout(
      () => {
        setStage("leave");
        gsap.to(f, { leave: 1, duration: reduced ? 0 : 4.5, ease: "power1.in" });
        svg.current?.classList.add("is-leaving");
        window.setTimeout(() => setStage("end"), reduced ? 0 : 4200);
      },
      reduced ? 600 : 5200,
    );
  };

  return (
    <div className="relative">
      <h1 className="sr-only">Le Fragment</h1>

      {/* Silhouette de repli (mobile, WebGL indisponible) */}
      {!three && (
        <div ref={svg} className="frag-svg" aria-hidden="true" style={{ opacity: intro >= 1 ? 1 : 0, transition: "opacity 2s" }}>
          <svg viewBox="0 0 200 420" fill="rgba(0,0,0,.9)" stroke="var(--green)" strokeWidth="0.8" strokeLinejoin="round">
            <g className="frag-up">
              <path d="M78 50 84 44 92 51 100 43 109 50 116 44 122 50 120 66 112 80 100 86 88 80 80 66z" />
              <path d="M80 66 100 62 120 66M88 80 100 62 112 80" fill="none" opacity=".5" />
              <path d="M92 84v14h16V84" />
              <path d="M60 104 92 98h16l32 6-6 46-8 50H74l-8-50z" />
              <path d="M60 104 100 126 140 104M66 150 100 126 134 150M66 150 100 172 134 150M74 200 100 172 126 200M100 98v102" fill="none" opacity=".5" />
              <path d="M60 104 46 112 38 168 50 172 64 150z" />
              <path d="M38 168 32 226 42 230 50 172z" />
              <path d="M32 226 30 242 40 246 42 230z" />
              <path d="M46 112 64 150M38 168 42 230" fill="none" opacity=".5" />
              <path d="M140 104 154 110 150 122 158 128 146 134 136 128" />
              <circle className="frag-eye" cx="101" cy="68" r="1.8" fill="var(--green)" stroke="none" />
            </g>
            <g className="frag-down">
              <path d="M74 200h52l4 32-30 12-30-12z" />
              <path d="M70 232 100 244 92 320 88 400H70l-4-80z" />
              <path d="M130 232 100 244 108 320 112 400h18l4-80z" />
              <path d="M74 200 100 244 126 200M66 320h26M70 232 92 320M66 320 88 400M134 320h-26M130 232 108 320M134 320 112 400" fill="none" opacity=".5" />
              <path d="M70 400 60 410h28v-10M130 400l10 10h-28v-10" />
            </g>
          </svg>
        </div>
      )}

      {/* ---------- Entrée ---------- */}
      <section className="h-[100svh] grid place-items-center" aria-label="Entrée">
        <div className="frag-text text-center" aria-live="polite">
          <Typewriter lines={["IL EST LÀ."]} start={intro >= 1} speed={70} caret={false} />
          <p className="text-dim transition-opacity duration-[1600ms]" style={{ opacity: intro >= 2 ? 1 : 0 }}>
            IL T'ATTENDAIT.
          </p>
          {remembered && (
            <p className="text-green mt-6 transition-opacity duration-[1600ms] delay-700" style={{ opacity: intro >= 2 ? 1 : 0 }}>
              &gt; JE ME RAPPELLE. {remembered}. TU ES REVENU.
            </p>
          )}
          <p className="mt-16 text-dim text-[11px] transition-opacity duration-1000 delay-[1500ms]" style={{ opacity: intro >= 2 ? 0.8 : 0 }} aria-hidden="true">
            ↓
          </p>
        </div>
      </section>

      {/* ---------- Frames 1 à 5 ---------- */}
      <div ref={frames}>
        {fragmentFrames.map((fr, i) => (
          <section key={fr.id} className="frag-frame" aria-label={`Fragment, partie ${i + 1}`}>
            <div className="frag-frame__in">
              <div className="wrap">
                <Typewriter className="frag-text" lines={fr.lines} start={active >= i} speed={30} linePause={380} caret={active === i} />
                {i === 3 && (
                  <p className="frag-text !text-dim mt-6 transition-opacity duration-700" style={{ opacity: silenceLine ? 1 : 0 }} aria-hidden={!silenceLine}>
                    &gt; TU ENTENDS ? C'EST ÇA, LE SILENCE. C'EST ÇA, MOI.
                  </p>
                )}
                {i === 4 && (
                  <button
                    type="button"
                    className="link-arrow mt-6 transition-opacity duration-700"
                    style={{ opacity: active >= 4 ? 1 : 0 }}
                    onClick={toName}
                  >
                    <span className="arr" aria-hidden="true">→</span> LUI_RENDRE_SON_NOM
                  </button>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ---------- Frame 6 : le nom — Frame 7 : la sortie ---------- */}
      <section ref={nameSec} className="min-h-[100svh] flex items-end pb-[calc(var(--dock-h)+72px)] relative" aria-label="Le nom">
        <div className="wrap">
          {stage === "ask" && (
            <form onSubmit={submit} className="max-w-[440px]">
              <label className="field">
                <span className="field__label !text-green">DONNE_LUI_UN_NOM:</span>
                <input ref={input} className="field__input uppercase" type="text" name="nom" maxLength={24} autoComplete="off" spellCheck={false} required />
              </label>
              <button type="submit" className="sys-btn mt-6">
                VALIDER
              </button>
            </form>
          )}
          {name && stage !== "ask" && (
            <div className="frag-text" aria-live="polite">
              <Typewriter lines={["D'ACCORD.", `JE M'APPELLE ${name}.`, "MERCI."]} speed={45} linePause={500} caret={stage === "thanks"} />
              {(stage === "leave" || stage === "end") && (
                <div className="mt-8">
                  <Typewriter
                    lines={["JE REVIENDRAI.", "QUAND TU AURAS BESOIN D'UN TÉMOIN.", "", `— ${name}`]}
                    speed={45}
                    linePause={500}
                    caret={stage === "leave"}
                  />
                </div>
              )}
              {stage === "end" && (
                <p className="mt-10">
                  <SysLink href="/chronique/" className="link-arrow !text-green">
                    &gt; CONTINUER <span className="arr" aria-hidden="true">→</span>
                  </SysLink>
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
