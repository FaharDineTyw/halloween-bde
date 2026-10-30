"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, STYLES, waLien, type Style } from "@/lib/masques";
import IconeWhatsApp from "@/components/ui/IconeWhatsApp";

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

type Filtre = Style | "tous";
const FILTRES: { id: Filtre; nom: string }[] = [{ id: "tous", nom: "Tous" }, ...STYLES];
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
    gsap.to(barre.current, { x: bouton.offsetLeft, width: bouton.offsetWidth, duration: anime && !calme() ? 0.28 : 0, ease: "power3.out" });
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
    // ponytail: hidden posé directement sur le DOM (hors React) pour que Flip mesure avant/après ; si un rendu React se met
    // à gérer `hidden` sur ces <li>, passer le filtrage dans l'état React et lancer Flip dans un useLayoutEffect.
    cartes.forEach((c) => { c.hidden = id !== "tous" && c.dataset.style !== id; });
    // Fin du filtre : toute carte visible doit être pleinement affichée (même si son entrée au défilement est déjà passée).
    const fin = () => {
      gsap.to(cartes.filter((c) => !c.hidden), { autoAlpha: 1, y: 0, scale: 1, duration: 0.2, ease: "power3.out" });
      ScrollTrigger.refresh();
    };
    if (calme()) { gsap.set(cartes, { autoAlpha: 1, y: 0 }); fin(); return; }
    Flip.from(etat, {
      duration: 0.42,
      ease: "power4.inOut",
      absolute: true,
      stagger: 0.02,
      // Les tweens d'entrée/sortie ne sont pas renvoyés à Flip : renvoyés, ils finissaient imbriqués
      // dans le contexte React et dans la timeline de Flip à la fois (boucle infinie, catalogue cassé).
      onEnter: (els) => { gsap.fromTo(els, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }); },
      onLeave: (els) => { gsap.to(els, { autoAlpha: 0, scale: 0.95, duration: 0.18, ease: "power3.out" }); },
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
    <section ref={scope} id="masques" aria-labelledby="masques-titre" className="wrap relative bg-ink py-[var(--section-y)] text-bg">
      <h2 id="masques-titre" className="font-display font-light uppercase leading-[0.98] text-[6.9vw] md:text-[length:var(--step-head)]">
        <span className="block">Vingt-trois masques,</span>
        <span className="block">pas un de plus</span>
      </h2>

      <div role="group" aria-label="Filtrer les masques" className="relative mt-7 flex flex-wrap gap-x-7 gap-y-3 pb-3 text-[length:var(--step-body)] md:mt-10">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            data-filtre={f.id}
            aria-pressed={filtre === f.id}
            onClick={(e) => filtrer(f.id, e.currentTarget)}
            className="text-[#5b5758] transition-colors duration-300 hover:text-bg aria-pressed:text-accent-deep"
          >
            {f.nom}
          </button>
        ))}
        <span ref={barre} aria-hidden="true" className="absolute bottom-0 left-0 h-px w-0 bg-accent" />{/* taste-skill-ignore: demandé (indicateur, vignette, soulignement) */}
      </div>

      <ul className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {MASQUES.map((x, i) => (
          <li key={x.num} data-num={x.num} data-style={x.style} className="cat-carte group">
            <button
              type="button"
              onClick={(e) => ouvre(i, e.currentTarget)}
              aria-label={`Agrandir le masque N°${x.num}, ${x.nom}`}
              className="relative block aspect-[4/5] w-full cursor-zoom-in touch-manipulation overflow-hidden rounded-[4px] bg-white transition-transform duration-[120ms] ease-out active:scale-[.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={x.img}
                alt={x.nom}
                width={480}
                height={480}
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover [image-rendering:auto] transition-transform duration-[400ms] ease-[cubic-bezier(.23,1,.32,1)] [@media(pointer:fine)]:group-hover:scale-[1.04]"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 [@media(pointer:fine)]:group-hover:scale-x-100" />{/* taste-skill-ignore: demandé (indicateur, vignette, soulignement) */}
            </button>
            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <span className="font-display text-[length:var(--step-small)] text-accent-deep">N°{x.num}</span>
                <p className="line-clamp-2 text-[length:var(--step-body)] font-medium leading-snug">{x.nom}</p>
                <p className="text-[length:var(--step-small)] text-[#5b5758]">{x.prix}</p>
              </div>
              <a
                href={waLien(x)}
                target="_blank"
                rel="noopener"
                aria-label={`Réserver le masque N°${x.num}, ${x.nom}, sur WhatsApp`}
                className="self-start sm:self-auto shrink-0 touch-manipulation underline decoration-transparent decoration-1 underline-offset-[0.25em] text-[length:var(--step-small)] text-accent-deep transition-[text-decoration-color] duration-200 ease-out hover:decoration-current focus-visible:decoration-current"
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
        className="m-auto w-[min(480px,calc(100%-32px))] bg-transparent p-0 text-ink backdrop:bg-black/85"
      >
        <div className="cat-v-boite rounded-[4px] bg-surface">
          <div className="relative overflow-hidden rounded-t-[4px] bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.img} alt={m.nom} width={480} height={480} decoding="async" className="cat-v-img aspect-square w-full bg-white object-cover [image-rendering:auto]" />
            <button type="button" onClick={ferme} aria-label="Fermer" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-2xl leading-none">×</button>
          </div>
          <div className="grid gap-4 p-5">
            <div>
              <span className="font-display text-[length:var(--step-small)] text-accent">N°{m.num}</span>
              <p id="cat-v-titre" className="text-[length:var(--step-lead)] font-medium">{m.nom}</p>
              <p className="text-[length:var(--step-small)] text-muted">{m.prix}</p>
            </div>
            <a href={waLien(m)} target="_blank" rel="noopener" aria-label={`Réserver le masque N°${m.num}, ${m.nom}, sur WhatsApp`} className="btn w-full"><IconeWhatsApp />Réserver le n°{m.num}</a>
            <div className="flex justify-between text-[length:var(--step-small)] text-muted">
              <button type="button" onClick={() => voisin(-1)} className="hover:text-ink">Masque précédent</button>
              <button type="button" onClick={() => voisin(1)} className="hover:text-ink">Masque suivant</button>
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}
