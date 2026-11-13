"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { humanSignal, passions, signals as inspirations, skillGroups } from "@/lib/content";
import { signals } from "@/lib/signals";
import { ChapterHead, Decode, Reveal } from "../ui";
import { useSystem } from "../system/context";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** PAGE 3 — FRÉQUENCES : compétences (égaliseur) + passions (vinyle). */
export default function Frequences() {
  const { three, reduced } = useSystem();
  const [group, setGroup] = useState(-1);
  const [passion, setPassion] = useState(-1);
  const secA = useRef<HTMLElement>(null);
  const secB = useRef<HTMLElement>(null);
  const lastNote = useRef(-1);

  const pickPassion = useCallback((i: number) => {
    setPassion(i);
    signals.freq.passion = i;
    if (i >= 0 && i !== lastNote.current) audio.piano(passions[i].note, 0.22, undefined, 0.5 + 1.7);
    lastNote.current = i;
  }, []);

  useEffect(() => {
    signals.freq.group = group;
  }, [group]);

  useEffect(() => {
    signals.freq.onPassion = (i) => pickPassion(i);
    const onScroll = () => {
      const vh = window.innerHeight;
      const a = secA.current?.getBoundingClientRect();
      const b = secB.current?.getBoundingClientRect();
      if (a) {
        // Progression dans la section A : 0 (elle arrive) → 1 (elle est passée).
        // L'anneau se disperse quand la fin de la section approche du haut de l'écran.
        const p = clamp01((vh * 1.15 - a.bottom) / (vh * 0.75));
        signals.freq.disperse = reduced ? (p > 0.5 ? 1 : 0) : smooth(0, 1, p);
      }
      if (b) {
        const arriving = smooth(vh * 0.75, vh * 0.1, b.top);
        const past = -b.top - (b.height - vh); // pixels parcourus après la fin de l'épinglage
        signals.freq.passionsIn = arriving * (1 - smooth(vh * 0.05, vh * 0.6, past));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      signals.freq.onPassion = null;
      signals.freq.group = -1;
      signals.freq.passion = -1;
      signals.freq.disperse = 0;
      signals.freq.passionsIn = 0;
    };
  }, [pickPassion, reduced]);

  return (
    <>
      <ChapterHead
        num="03"
        title="FRÉQUENCES"
        narrative={[
          "Tout ce que je sais faire émet quelque chose.",
          "Approche-toi d'une bande. Écoute ce qu'elle porte.",
        ]}
      />

      {/* ---------- Compétences ---------- */}
      <section ref={secA} className="relative md:pb-[70vh]" aria-labelledby="competences">
        <div>
          <div className="wrap grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 id="competences" className="label mb-6">
                <span className="text-green">&gt;</span> SPECTRE DES COMPÉTENCES
              </h2>
              <ul className="space-y-3">
                {skillGroups.map((g, i) => (
                  <li key={g.id}>
                  <div
                    className={`freq-group ${group === i ? "is-on" : ""}`}
                    onPointerEnter={() => setGroup(i)}
                    onPointerLeave={() => setGroup(-1)}
                    onFocus={() => setGroup(i)}
                    onBlur={() => setGroup(-1)}
                    tabIndex={0}
                    role="group"
                    aria-label={`${g.label}, ${g.sub}`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="mono text-[13px] tracking-[0.16em] text-green font-bold">{g.label}</h3>
                      <span className="mono text-[11px] tracking-[0.14em] text-dim uppercase">{g.sub}</span>
                    </div>
                    <p className="sys text-[13px] mt-1 mb-3">{g.narrative}</p>
                    <ul>
                      {g.skills.map((s) => (
                        <li key={s.name}>
                          <span>{s.name}</span>
                          <span>{s.proof}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-first md:order-none" aria-hidden="true">
              {!three && (
                <div className="eq">
                  {Array.from({ length: 64 }, (_, i) => (
                    <i key={i} style={{ ["--i" as string]: i }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Passions ---------- */}
      <section ref={secB} className="relative md:min-h-[170vh] pt-[12vh] md:pt-0" aria-labelledby="passions">
        <div className="md:sticky md:top-0 md:h-screen md:flex md:items-center">
          {/* Le nom de la passion apparaît au centre du vinyle 3D */}
          {three && (
            <div className="vinyl__label" aria-hidden="true">
              {passion >= 0 ? passions[passion].name : ""}
            </div>
          )}
          <div className="wrap grid gap-10 md:grid-cols-2 md:items-center">
            <div className="relative">
              {!three && (
                <div className="vinyl" aria-hidden="true">
                  {passions.map((p, i) => (
                    <span
                      key={p.name}
                      className={`vinyl__ring ${passion === passions.length - 1 - i ? "is-on" : ""}`}
                      style={{ ["--k" as string]: i }}
                    />
                  ))}
                </div>
              )}
              {!three && (
                <div className="vinyl__center" aria-hidden="true">
                  {passion >= 0 ? passions[passion].name : ""}
                </div>
              )}
            </div>
            <div>
              <h2 id="passions" className="label mb-2">
                <span className="text-green">&gt;</span> FRÉQUENCES_CACHÉES
              </h2>
              <p className="sys text-[14px] mb-6">Sous le spectre, il y a ce qui tourne en boucle.</p>
              <ul>
                {passions.map((p, i) => (
                  <li key={p.name}>
                    <button
                      type="button"
                      className={`passion-btn ${passion === i ? "is-on" : ""}`}
                      onPointerEnter={() => pickPassion(i)}
                      onPointerLeave={() => pickPassion(-1)}
                      onFocus={() => pickPassion(i)}
                      onBlur={() => pickPassion(-1)}
                      onClick={() => pickPassion(i)}
                      aria-describedby={`passion-${i}`}
                    >
                      <small>0{i + 1}</small>
                      {p.name}
                    </button>
                    <p
                      id={`passion-${i}`}
                      className="text-[14px] text-[#b5b5b5] overflow-hidden transition-all duration-500"
                      style={{ maxHeight: passion === i ? 120 : 0, opacity: passion === i ? 1 : 0, paddingBlock: passion === i ? 10 : 0 }}
                    >
                      {p.line}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Signaux reçus + signal humain ---------- */}
      <section className="wrap pt-[14vh] grid gap-14 md:grid-cols-2" aria-labelledby="signaux">
        <div>
          <h2 id="signaux" className="title-2">
            <Decode text="SIGNAUX_REÇUS" />
          </h2>
          <p className="sys mt-3 mb-6 text-[14px]">Ceux dont j'ai capté quelque chose.</p>
          <Reveal as="ul">
            {inspirations.map((s) => (
              <li key={s.name} className="border-b border-[#1a1a1a] py-3">
                <span className="mono text-[13px] tracking-[0.12em] text-green">{s.name.toUpperCase()}</span>
                <p className="text-[14px] fact">{s.why}</p>
              </li>
            ))}
          </Reveal>
        </div>
        <div>
          <h2 className="title-2">
            <Decode text="SIGNAL_HUMAIN" />
          </h2>
          <p className="sys mt-3 mb-6 text-[14px]">Ce qu'aucune machine ne m'a appris.</p>
          <p className="fact text-[15px] max-w-[52ch]">
            Deux ans de terrain comme commercial itinérant m'ont donné ce que le code n'enseigne pas : comprendre un besoin,
            reformuler, négocier, tenir un engagement. Je l'apporte dans chaque projet technique.
          </p>
          <Reveal as="ul" className="mt-6 flex flex-wrap gap-2">
            {humanSignal.map((h) => (
              <li key={h} className="chip !text-[12px] !py-1.5 !px-3">
                {h}
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
