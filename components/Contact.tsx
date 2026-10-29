"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, WHATSAPP_AFFICHE, waLien } from "@/lib/masques";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ETAPES = [
  { titre: "Choisis ton masque", texte: "Repère son numéro dans le catalogue." },
  { titre: "Écris au BDE sur WhatsApp", texte: `Envoie ce numéro au ${WHATSAPP_AFFICHE}.` },
  { titre: "Récupère-le", texte: "Auprès d'un membre du BDE avant la soirée, ou sur place à l'EYA Centre." },
];

// Ordre de défilement de la vitrine : on alterne les styles pour varier.
const VITRINE = [6, 17, 0, 10, 3, 18, 8, 16, 13, 21, 1, 14].map((i) => MASQUES[i]);

export default function Contact() {
  const scope = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const m = VITRINE[i];

  useGSAP((_ctx, contextSafe) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Entrée : titre, étapes puis vitrine, une seule fois.
      gsap.from("[data-entree]", {
        y: 28, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.09,
        scrollTrigger: {
          trigger: scope.current, start: "top 80%", once: true,
          onRefresh: (self) => { if (self.progress > 0) self.animation?.progress(1); },
        },
      });

      // La vitrine change de masque toutes les 2,8 s, en fondu, seulement quand la section est visible.
      const suivant = contextSafe!(() => {
        gsap.to(".vt-img", {
          autoAlpha: 0, scale: 1.04, duration: 0.45, ease: "power2.in",
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
    gsap.fromTo(".vt-img", { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" });
  }, { scope, dependencies: [i] });

  return (
    <section ref={scope} id="reserver" aria-labelledby="reserver-titre" className="wrap relative py-[clamp(96px,14vh,180px)] text-ink">
      <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 id="reserver-titre" data-entree className="font-display font-light uppercase leading-[0.98] tracking-[-0.01em] text-[clamp(34px,7.4vw,76px)] lg:text-[clamp(40px,4.6vw,76px)]">
            Réserve-le<br />avant samedi
          </h2>

          <ol className="mt-12 grid gap-8">
            {ETAPES.map((e, k) => (
              <li key={e.titre} data-entree className="grid grid-cols-[3.2rem_minmax(0,1fr)] items-baseline gap-4">
                <span aria-hidden="true" className="font-display text-[clamp(30px,3vw,42px)] font-light leading-none text-ember">{k + 1}</span>
                <div>
                  <p className="text-[19px] font-medium">{e.titre}</p>
                  <p className="mt-1 max-w-[42ch] text-[17px] text-muted">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>

          <div data-entree className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={waLien()} target="_blank" rel="noopener" className="btn">Réserver sur WhatsApp</a>
            <p className="text-[16px] text-muted">Quantités limitées : premier arrivé, premier masqué.</p>
          </div>
        </div>

        {/* Vitrine : un masque à la fois, en vraies couleurs */}
        <figure data-entree className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:col-start-8 lg:max-w-none">
          <a href={waLien(m)} target="_blank" rel="noopener" aria-label={`Réserver le masque N°${m.num}, ${m.nom}, sur WhatsApp`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-[#0d0a09]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.img} alt={m.nom} width={480} height={600} loading="lazy"
                className="vt-img h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ filter: "brightness(.92) contrast(1.05)" }} />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[4px]" style={{ boxShadow: "inset 0 0 80px 18px rgba(0,0,0,.55)" }} />
            </div>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4" aria-live="polite">
              <span><span className="font-display text-ember">N°{m.num}</span> <span className="font-medium">{m.nom}</span></span>
              <span className="text-[16px] text-muted">{m.prix}</span>
            </figcaption>
          </a>
        </figure>
      </div>
    </section>
  );
}
