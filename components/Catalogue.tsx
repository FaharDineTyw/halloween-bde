"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, STYLES, waLien, type Style } from "@/lib/masques";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const NOM_STYLE = Object.fromEntries(STYLES.map((s) => [s.id, s.nom])) as Record<Style, string>;
const FILTRES: { id: Style | "tous"; nom: string }[] = [{ id: "tous", nom: "Tous" }, ...STYLES];

export default function Catalogue() {
  const scope = useRef<HTMLElement>(null);
  const lampe = useRef<HTMLDivElement>(null);
  const [filtre, setFiltre] = useState<Style | "tous">("tous");
  const [actif, setActif] = useState(6); // Scream ensanglanté par défaut
  const [vrais, setVrais] = useState<Set<string>>(() => new Set());
  const [apercuVrai, setApercuVrai] = useState(false);
  const m = MASQUES[actif];

  // Entrée du titre, une seule fois.
  useGSAP(() => {
    gsap.from("[data-entree]", {
      y: 28, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08,
      scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
    });
  }, { scope });

  // Les lignes visibles réapparaissent quand le filtre change.
  useGSAP(() => {
    if (filtre === "tous") return;
    gsap.fromTo("li[data-num]:not([hidden])", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: "power2.out" });
  }, { scope, dependencies: [filtre] });

  // Lampe torche : la lumière suit le pointeur sur l'aperçu.
  const { contextSafe } = useGSAP({ scope });
  const bouge = contextSafe((e: React.PointerEvent<HTMLDivElement>) => {
    const el = lampe.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, { "--x": `${e.clientX - r.left}px`, "--y": `${e.clientY - r.top}px`, duration: 0.25, ease: "power2.out", overwrite: true });
  });

  const basculeVrai = (num: string) =>
    setVrais((prev) => {
      const s = new Set(prev);
      if (s.has(num)) s.delete(num); else s.add(num);
      return s;
    });

  return (
    <section ref={scope} id="masques" className="wrap py-[clamp(120px,14vw,200px)]">
      <h2 data-entree className="font-display font-light uppercase leading-[0.98] text-[6.6vw] md:max-w-[22ch] md:text-[clamp(40px,4.5vw,68px)]">
        <span className="block md:pl-[3vw]">Vingt-trois masques,</span>
        <span className="block">pas un de plus</span>
      </h2>
      <p data-entree className="mt-6 max-w-[48ch]">
        Jason 1 650 FCFA, les autres 3 750 FCFA. Les quantités sont limitées.
      </p>

      <div data-entree role="group" aria-label="Filtrer les masques" className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filtre === f.id}
            onClick={() => setFiltre(f.id)}
            className="py-2 underline-offset-[6px] transition-colors hover:text-ember aria-pressed:text-ember aria-pressed:underline"
          >
            {f.nom}
          </button>
        ))}
      </div>

      <div className="mt-16 md:grid md:grid-cols-12 md:gap-x-[var(--margin)]">
        {/* Aperçu : grand, collant, éclairé à la lampe torche sur ordinateur. */}
        <div className="hidden md:col-span-6 md:block">
          <div className="sticky top-24">
            {/* Bichromie sang par défaut ; la lampe torche révèle les vraies couleurs sous le pointeur. */}
            <div
              ref={lampe}
              onPointerMove={bouge}
              className="relative aspect-[4/5] overflow-hidden"
              style={{ "--x": "50%", "--y": "40%" } as React.CSSProperties}
            >
              <div className="duo absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt={m.nom} width={480} height={480} className="h-full w-full object-cover" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.img}
                alt=""
                aria-hidden="true"
                width={480}
                height={480}
                className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${apercuVrai ? "" : "hidden [@media(pointer:fine)]:block motion-reduce:!hidden"}`}
                style={apercuVrai ? undefined : {
                  maskImage: "radial-gradient(circle at var(--x) var(--y), #000 0, #000 110px, transparent 220px)", /* taste-skill-ignore: effet lampe torche demandé */
                  WebkitMaskImage: "radial-gradient(circle at var(--x) var(--y), #000 0, #000 110px, transparent 220px)", /* taste-skill-ignore */
                }}
              />
            </div>
            <button
              type="button"
              aria-pressed={apercuVrai}
              onClick={() => setApercuVrai((v) => !v)}
              className="mt-4 text-[var(--step-small)] text-muted underline-offset-4 hover:text-ink hover:underline aria-pressed:text-ember"
            >
              Voir en vraies couleurs
            </button>
            <p className="mt-6 font-display text-[var(--step-lead)]" aria-live="polite">
              <span className="text-ember">N°{m.num}</span> {m.nom}, {m.prix}
            </p>
            <a href={waLien(m)} target="_blank" rel="noopener" className="btn mt-5">
              Réserver le n°{m.num} sur WhatsApp
            </a>
          </div>
        </div>

        <ul className="md:col-span-6 flex flex-col gap-[26px]">
          {MASQUES.map((x, i) => {
            const cache = filtre !== "tous" && x.style !== filtre;
            const vrai = vrais.has(x.num);
            return (
              <li
                key={x.num}
                data-num={x.num}
                data-style={x.style}
                hidden={cache}
                onPointerEnter={() => setActif(i)}
                onFocus={() => setActif(i)}
                className={`grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[3rem_minmax(0,1fr)_auto] lg:grid-cols-[3.5rem_minmax(0,1fr)_7rem_auto_auto] lg:gap-x-6 ${actif === i ? "md:text-ink" : "md:text-ink/80"}`}
              >
                <button
                  type="button"
                  aria-pressed={vrai}
                  aria-label={`Voir les vraies couleurs du masque N°${x.num}, ${x.nom}`}
                  onClick={() => basculeVrai(x.num)}
                  data-vrai={vrai}
                  className="duo h-14 w-14 overflow-hidden md:hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.img} alt="" width={56} height={56} loading="lazy" className="h-full w-full object-cover" />
                </button>
                <span className="hidden font-display text-[var(--step-lead)] text-ember md:block">{x.num}</span>
                <span className="min-w-0">
                  <span className="font-display text-ember md:hidden">N°{x.num} </span>
                  <span className="font-medium">{x.nom}</span>
                  <span className="block text-[var(--step-small)] text-muted lg:hidden">{NOM_STYLE[x.style]}, {x.prix}</span>
                </span>
                <span className="hidden text-muted lg:block">{NOM_STYLE[x.style]}</span>
                <span className="hidden text-right tabular-nums lg:block">{x.prix}</span>
                <a
                  href={waLien(x)}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Réserver le masque N°${x.num}, ${x.nom}, sur WhatsApp`}
                  className="justify-self-end font-medium text-ember underline-offset-4 hover:underline"
                >
                  Réserver
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
