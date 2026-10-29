"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, STYLES, waLien, type Style } from "@/lib/masques";

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

type Filtre = Style | "tous";
const FILTRES: { id: Filtre; nom: string }[] = [{ id: "tous", nom: "Tous" }, ...STYLES];
const NOM_STYLE = Object.fromEntries(STYLES.map((s) => [s.id, s.nom])) as Record<Style, string>;
const calme = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Catalogue() {
  const scope = useRef<HTMLElement>(null);
  const barre = useRef<HTMLSpanElement>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const retour = useRef<HTMLButtonElement | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [vu, setVu] = useState(0);
  const m = MASQUES[vu];

  // Soulignement qui glisse sous le filtre actif.
  const placeBarre = (bouton: HTMLElement | null, anime = true) => {
    if (!bouton || !barre.current) return;
    gsap.to(barre.current, { x: bouton.offsetLeft, width: bouton.offsetWidth, duration: anime && !calme() ? 0.45 : 0, ease: "power3.out" });
  };

  const { contextSafe } = useGSAP(
    () => {
      placeBarre(scope.current!.querySelector<HTMLElement>('[data-filtre="tous"]'), false);
      const onResize = () => placeBarre(scope.current?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? null, false);
      window.addEventListener("resize", onResize);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cartes = gsap.utils.toArray<HTMLElement>(".cat-carte", scope.current);
        gsap.set(cartes, { autoAlpha: 0, y: 24 });
        ScrollTrigger.batch(cartes, {
          start: "top 92%",
          once: true,
          onEnter: (lot) => gsap.to(lot, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06, overwrite: true }),
        });
      });
      return () => window.removeEventListener("resize", onResize);
    },
    { scope },
  );

  const filtrer = contextSafe((id: Filtre, bouton: HTMLElement) => {
    if (id === filtre) return;
    setFiltre(id);
    placeBarre(bouton);
    const cartes = gsap.utils.toArray<HTMLElement>(".cat-carte", scope.current);
    const etat = Flip.getState(cartes);
    // ponytail: hidden posé directement sur le DOM (React ne gère pas cet attribut ici) pour que Flip mesure avant/après.
    cartes.forEach((c) => { c.hidden = id !== "tous" && c.dataset.style !== id; });
    const fin = () => ScrollTrigger.refresh();
    if (calme()) { gsap.set(cartes, { autoAlpha: 1, y: 0 }); fin(); return; }
    Flip.from(etat, {
      duration: 0.6,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.02,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: "power2.in" }),
      onComplete: fin,
    });
  });

  // Visionneuse
  const montre = contextSafe((i: number) => {
    setVu(i);
    if (calme()) return;
    gsap.fromTo(".cat-v-img", { clipPath: "inset(0 0 100% 0)", scale: 1.06 }, { clipPath: "inset(0 0 0% 0)", scale: 1, duration: 0.6, ease: "power3.out" });
  });
  const ouvre = contextSafe((i: number, bouton: HTMLButtonElement) => {
    retour.current = bouton;
    dlg.current?.showModal();
    montre(i);
    if (!calme()) gsap.fromTo(".cat-v-boite", { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" });
  });
  const visibles = () =>
    MASQUES.map((x, i) => i).filter((i) => filtre === "tous" || MASQUES[i].style === filtre);
  const voisin = (pas: number) => {
    const v = visibles(); const k = v.indexOf(vu);
    montre(v[(k + pas + v.length) % v.length]);
  };
  const ferme = () => { dlg.current?.close(); };
  const depart = useRef(0);

  return (
    <section ref={scope} id="masques" aria-labelledby="masques-titre" className="wrap relative py-28 md:py-40">
      <h2 id="masques-titre" className="font-display font-light uppercase leading-[0.98] text-[8vw] md:text-[clamp(36px,5vw,72px)]">
        <span className="block">Vingt-trois masques,</span>
        <span className="block">pas un de plus</span>
      </h2>
      <p className="mt-6 text-[18px]">Jason 1 650 FCFA, les autres 3 750 FCFA. Les quantités sont limitées.</p>

      <div role="group" aria-label="Filtrer les masques" className="relative mt-10 flex flex-wrap gap-x-7 gap-y-3 pb-3 text-[16px]">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            data-filtre={f.id}
            aria-pressed={filtre === f.id}
            onClick={(e) => filtrer(f.id, e.currentTarget)}
            className="text-muted transition-colors duration-300 hover:text-ink aria-pressed:text-ember"
          >
            {f.nom}
          </button>
        ))}
        <span ref={barre} aria-hidden="true" className="absolute bottom-0 left-0 h-px w-0 bg-ember" />{/* taste-skill-ignore: demandé (indicateur, vignette, soulignement) */}
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {MASQUES.map((x, i) => (
          <li key={x.num} data-num={x.num} data-style={x.style} className="cat-carte group">
            <button
              type="button"
              onClick={(e) => ouvre(i, e.currentTarget)}
              aria-label={`Agrandir le masque N°${x.num}, ${x.nom}`}
              className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-[4px] bg-[#0d0a09]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={x.img}
                alt={x.nom}
                width={480}
                height={480}
                loading={i < 4 ? "eager" : "lazy"}
                className="h-full w-full object-cover brightness-[.92] contrast-[1.05] transition-transform duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] [@media(pointer:fine)]:group-hover:scale-[1.04]"
              />
              {/* Vignette douce : évite l'éblouissement des fonds blancs */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[4px] shadow-[inset_0_0_48px_14px_rgba(13,10,9,.55)]" />{/* taste-skill-ignore: demandé (indicateur, vignette, soulignement) */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-blood transition-transform duration-500 [@media(pointer:fine)]:group-hover:scale-x-100" />{/* taste-skill-ignore: demandé (indicateur, vignette, soulignement) */}
            </button>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <span className="font-display text-[15px] text-ember">N°{x.num}</span>
                <p className="truncate text-[16px] font-medium md:text-[17px]">{x.nom}</p>
                <p className="text-[15px] text-muted">{x.prix} · {NOM_STYLE[x.style]}</p>
              </div>
              <a
                href={waLien(x)}
                target="_blank"
                rel="noopener"
                aria-label={`Réserver le masque N°${x.num}, ${x.nom}, sur WhatsApp`}
                className="shrink-0 bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 text-[15px] text-ember transition-[background-size] duration-300 hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px]" /* taste-skill-ignore */
              >
                Réserver
              </a>
            </div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dlg}
        aria-labelledby="cat-v-titre"
        onClose={() => retour.current?.focus()}
        onClick={(e) => { if (e.target === dlg.current) ferme(); }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") voisin(1); if (e.key === "ArrowLeft") voisin(-1); }}
        onPointerDown={(e) => { depart.current = e.clientX; }}
        onPointerUp={(e) => { const dx = e.clientX - depart.current; if (Math.abs(dx) > 50) voisin(dx < 0 ? 1 : -1); }}
        className="m-auto w-[min(560px,calc(100%-32px))] bg-transparent p-0 text-ink backdrop:bg-black/85"
      >
        <div className="cat-v-boite rounded-[4px] bg-surface">
          <div className="relative overflow-hidden rounded-t-[4px] bg-[#0d0a09]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.img} alt={m.nom} width={480} height={480} className="cat-v-img aspect-square w-full object-cover" />
            <button type="button" onClick={ferme} aria-label="Fermer" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-2xl leading-none">×</button>
          </div>
          <div className="grid gap-4 p-5">
            <div>
              <span className="font-display text-[15px] text-ember">N°{m.num}</span>
              <p id="cat-v-titre" className="text-[20px] font-medium">{m.nom}</p>
              <p className="text-[15px] text-muted">{m.prix}</p>
            </div>
            <a href={waLien(m)} target="_blank" rel="noopener" className="btn w-full">Réserver le n°{m.num} sur WhatsApp</a>
            <div className="flex justify-between text-[15px] text-muted">
              <button type="button" onClick={() => voisin(-1)} className="hover:text-ink">Masque précédent</button>
              <button type="button" onClick={() => voisin(1)} className="hover:text-ink">Masque suivant</button>
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}
