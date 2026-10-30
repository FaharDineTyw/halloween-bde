"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SangGL from "@/components/hero/SangGL";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const lien = "underline decoration-transparent decoration-1 underline-offset-[0.25em] transition-[text-decoration-color] duration-200 ease-out hover:decoration-current focus-visible:decoration-current";

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = { trigger: root.current, start: "top 85%", once: true };
        gsap.from(".f-ligne", { yPercent: 100, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: st });
        gsap.from(".f-col", { y: 24, autoAlpha: 0, duration: 0.8, ease: "power2.out", stagger: 0.08, delay: 0.3, scrollTrigger: st });
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative text-ink">
      {/* Le sang descendu de la page entre par le haut en filets et fait une flaque sous le titre (derrière le texte). */}
      <div className="relative">
        <SangGL flaque coulees className="absolute inset-x-0 top-0 h-[calc(100%+3rem)] md:h-[calc(100%+4.25rem)]" />
        <div aria-hidden="true" className="h-[136px]" />
        <div className="wrap relative z-10 pt-10 md:pt-16">
          <h2 className="text-center font-display uppercase leading-[0.95] text-[length:var(--step-display)]">
            <span className="block overflow-hidden"><span className="f-ligne block">À samedi,</span></span>
            <span className="block overflow-hidden"><span className="f-ligne gresille block font-lettrage normal-case text-accent text-[1.15em]">si tu oses.</span></span>
          </h2>
        </div>
      </div>

      <div className="wrap relative z-10 pb-10">
        {/* Bas de page centré : logo plus petit que celui de l'en-tête, liens lisibles, mentions au milieu. */}
        <div className="f-col mt-14 flex flex-col items-center gap-6 text-center md:mt-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-bde.svg" alt="Bureau des Étudiants Epitech Bénin" width={76} height={48} loading="lazy" className="h-10 w-auto md:h-12" />
          <nav aria-label="Pied de page" className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[length:var(--step-body)]">
            <a href="#masques" className={lien}>Les masques</a>
            <a href="#haut" className={lien}>La soirée</a>
            <a href="#reserver" className={lien}>Réserver</a>
          </nav>
          <div className="flex flex-col items-center gap-2 text-[length:var(--step-small)]">
            <p className="text-muted">© 2026 BDE Epitech Bénin</p>
            <a href="#haut" className={lien}>Retour en haut</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
