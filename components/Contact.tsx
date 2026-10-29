"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { WHATSAPP_AFFICHE, waLien } from "@/lib/masques";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Contact() {
  const scope = useRef<HTMLElement>(null);

  // Le numéro monte depuis sous sa ligne de base à l'entrée.
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-numero]", {
        yPercent: 100, duration: 1.1, ease: "power4.out",
        scrollTrigger: {
          trigger: scope.current, start: "top 90%", once: true,
          // Si la page a raccourci et que le départ est déjà dépassé, montrer le numéro tout de suite.
          onRefresh: (self) => { if (self.progress > 0) self.animation?.progress(1); },
        },
      });
    });
  }, { scope });

  return (
    <section
      ref={scope}
      id="reserver"
      className="wrap relative flex min-h-[100svh] flex-col bg-blood py-10 text-ink"
    >
      <p className="max-w-[30ch] text-[clamp(18px,1.5vw,22px)] font-medium text-ink">
        Envoie le numéro de ton masque sur WhatsApp. Premier arrivé, premier masqué.
      </p>

      <h2 className="mt-auto mb-[12vh] overflow-hidden font-display font-light leading-[1.05]">
        <a
          href={waLien()}
          target="_blank"
          rel="noopener"
          aria-label={`Écrire au BDE sur WhatsApp au ${WHATSAPP_AFFICHE}`}
          className="block whitespace-nowrap text-[clamp(32px,11.5vw,240px)] tracking-[-0.03em] text-ink transition-colors hover:text-black md:text-[11.2vw]"
        >
          <span data-numero className="inline-block">{WHATSAPP_AFFICHE}</span>
        </a>
      </h2>

      <div className="flex flex-col gap-2 text-[15px] sm:flex-row sm:justify-between">
        <p>EYA Centre, samedi 31 octobre dès 19h</p>
        <p>Réservation sur WhatsApp uniquement</p>
      </div>
    </section>
  );
}
