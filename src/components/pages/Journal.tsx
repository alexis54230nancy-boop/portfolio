"use client";
import { journal } from "@/lib/content";
import { ChapterHead, Decode, Reveal, SysLink } from "../ui";

/** PAGE 6 — JOURNAL : ce que j'apprends, version après version. */
export default function Journal() {
  return (
    <>
      <ChapterHead
        num="06"
        title="JOURNAL"
        narrative={[
          "Un système qui n'écrit pas ses journaux répète ses erreurs.",
          "J'écris les miens ici. Les plus récents en premier.",
        ]}
      />
      <section className="wrap max-w-[860px]!" aria-label="Entrées du journal">
        <div className="space-y-6">
          {journal.map((e, i) => (
            <Reveal as="article" key={e.id} className="mod" delay={i * 80}>
              <p className="mono text-[11px] tracking-[0.2em] text-dim">
                <span className="text-green">{e.id.toUpperCase()}</span> — <time>{e.date}</time>
              </p>
              <h2 className="title-2 mt-3">
                <Decode text={e.title} mode="type" />
              </h2>
              <div className="mt-4 space-y-3 text-[#cfcfcf] max-w-[64ch]">
                {e.body.map((b) => (
                  <p key={b.slice(0, 24)}>{b}</p>
                ))}
              </div>
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Ce que j'ai appris">
                {e.learned.map((l) => (
                  <li key={l} className="chip !text-green !border-[rgba(0,255,65,.25)]">
                    + {l}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <p className="mono text-[13px] tracking-[0.16em] text-dim mt-12 caret">&gt; EN ATTENTE DE LA PROCHAINE ENTRÉE</p>
        <div className="mt-10">
          <SysLink href="/connexion/" className="sys-btn">
            OUVRIR_LE_CANAL
          </SysLink>
        </div>
      </section>
    </>
  );
}
