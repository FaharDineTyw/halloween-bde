"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, WHATSAPP_AFFICHE, waLien } from "@/lib/masques";
import IconeWhatsApp from "@/components/ui/IconeWhatsApp";
import Bouton4Trous from "@/components/ui/Bouton4Trous";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ETAPES = [
  "Choisis ton masque",
  `Envoie le numéro du masque au ${WHATSAPP_AFFICHE.replace(/ /g, "\u00a0")} sur WhatsApp`,
  "Récupère-le au BDE ou sur place",
];

// Ordre de défilement de la vitrine : on alterne les styles pour varier.
const VITRINE = [6, 17, 0, 10, 3, 18, 8, 16, 13, 21, 1, 14].map((i) => MASQUES[i]);

export default function Contact() {
  const scope = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const m = VITRINE[i];

  useGSAP((_ctx, contextSafe) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", (mc) => {
      const sur = <A extends unknown[]>(f: (...a: A) => void) => (...a: A) => { mc.add(() => f(...a)); };
      // Entrée : titre, étapes puis vitrine, une seule fois.
      gsap.from("[data-entree]", {
        y: 28, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.09,
        scrollTrigger: {
          trigger: scope.current, start: "top 80%", once: true,
          onRefresh: (self) => { if (self.progress > 0) self.animation?.progress(1); },
        },
      });

      // La vitrine change de masque toutes les 2,8 s, en fondu, seulement quand la section est visible.
      const suivant = sur(() => {
        gsap.to(".vt-img", {
          autoAlpha: 0, scale: 1.03, filter: "blur(4px)", duration: 0.25, ease: "power3.out",
          onComplete: () => setI((k) => (k + 1) % VITRINE.length),
        });
      });
      let id = 0;
      ScrollTrigger.create({
        trigger: scope.current, start: "top bottom", end: "bottom top",
        onToggle: (s) => { clearInterval(id); if (s.isActive) id = window.setInterval(suivant, 2800); },
      });
      return () => clearInterval(id);
    });
  }, { scope });

  // À chaque nouveau masque : réapparition douce.
  useGSAP(() => {
    gsap.fromTo(".vt-img", { autoAlpha: 0, scale: 1.03, filter: "blur(4px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "power3.out", clearProps: "filter" });
  }, { scope, dependencies: [i] });

  return (
    <section ref={scope} id="reserver" aria-labelledby="reserver-titre" className="wrap relative py-[var(--section-y)] text-ink">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 id="reserver-titre" data-entree className="font-display uppercase leading-[1] text-accent text-[length:var(--step-head)]">
            Réserve-le<br />avant samedi
          </h2>

          <ol className="mt-7 grid gap-4 md:mt-10">
            {ETAPES.map((e, k) => (
              <li key={e} data-entree className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 text-[length:var(--step-body)]">
                <span aria-hidden="true" className="relative grid h-8 w-8 place-items-center"><Bouton4Trous size={32} className="absolute inset-0" /><span className="relative rounded-full bg-[#131212] px-1 font-display text-[length:var(--step-small)] leading-none text-accent">{k + 1}</span></span>
                <span>{e}</span>
              </li>
            ))}
          </ol>

          <div data-entree className="mt-7 md:mt-10">
            <a href={waLien()} target="_blank" rel="noopener" className="btn"><IconeWhatsApp />Réserver sur WhatsApp</a>
          </div>
        </div>

        {/* Vitrine : un masque à la fois, en vraies couleurs */}
        <figure data-entree className="mx-auto w-full max-w-[400px] lg:col-span-5 lg:col-start-8">
          <a href={waLien(m)} target="_blank" rel="noopener" aria-label={`Réserver le masque N°${m.num}, ${m.nom}, sur WhatsApp`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface outline outline-1 outline-offset-[6px] outline-accent transition-transform duration-[400ms] ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.img} alt={m.nom} width={480} height={600} loading="lazy"
                decoding="async" className="vt-img h-full w-full bg-white object-cover [image-rendering:auto]" />
            </div>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-[length:var(--step-body)]" aria-live="polite">
              <span className="flex items-center gap-2"><Bouton4Trous size={22} /><span className="font-display text-accent">N°{m.num}</span> <span className="font-medium">{m.nom}</span></span>
              <span className="text-[length:var(--step-small)] text-muted">{m.prix}</span>
            </figcaption>
          </a>
        </figure>
      </div>
    </section>
  );
}
