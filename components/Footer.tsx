"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { waLien, WHATSAPP_AFFICHE } from "@/lib/masques";
import SangGL from "@/components/hero/SangGL";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const lien = "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-200 ease-out hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px]"; /* taste-skill-ignore: soulignement animé, couleur unie */

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
    <footer ref={root} className="relative flex min-h-[80svh] flex-col text-ink">
      {/* Le sang coule du haut du pied de page et fait une flaque sous le titre (derrière le texte). */}
      <div className="relative">
        <SangGL flaque className="absolute inset-x-0 top-0 h-[calc(100%+3rem)] md:h-[calc(100%+4.25rem)]" />
        <div aria-hidden="true" className="h-[136px]" />
        <div className="wrap relative z-10 pt-10 md:pt-16">
          <h2 className="font-display font-light uppercase leading-[0.95] text-[clamp(40px,8vw,140px)]">
            <span className="block overflow-hidden"><span className="f-ligne block">À samedi,</span></span>
            <span className="block overflow-hidden"><span className="f-ligne gresille block">si tu oses.</span></span>
          </h2>
        </div>
      </div>

      <div className="wrap relative z-10 flex flex-1 flex-col pb-8">
        <div className="mt-14 grid gap-10 text-[clamp(16px,1.2vw,18px)] md:mt-20 md:grid-cols-3">
          <div className="f-col">
            <p className="text-muted">La soirée</p>
            <p className="mt-2">Samedi 31 octobre, dès 19h, EYA Centre.</p>
          </div>
          <div className="f-col">
            <p className="text-muted">Réserver</p>
            <p className="mt-2">
              <a href={waLien()} target="_blank" rel="noopener" className={lien}>
                WhatsApp {WHATSAPP_AFFICHE}
              </a>
            </p>
          </div>
          <div className="f-col">
            <p className="text-muted">Le BDE</p>
            <p className="mt-2">Bureau des Étudiants Epitech Bénin</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-8 pt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-bde.svg" alt="Bureau des Étudiants Epitech Bénin" width={260} height={164} loading="lazy" className="h-auto w-[clamp(160px,22vw,320px)]" />
            <div className="flex flex-col gap-2 text-[15px]">
              <nav aria-label="Pied de page" className="flex flex-wrap gap-x-6 gap-y-2">
                <a href="#masques" className={lien}>Les masques</a>
                <a href="#soiree" className={lien}>La soirée</a>
                <a href="#reserver" className={lien}>Réserver</a>
              </nav>
              <p className="text-muted">© 2026 BDE Epitech Bénin</p>
            </div>
          </div>
          <a href="#haut" className={`${lien} self-start text-[15px] md:self-end`}>Retour en haut</a>
        </div>
      </div>
    </footer>
  );
}
