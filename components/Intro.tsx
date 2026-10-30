"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES } from "@/lib/masques";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// [texte, index du masque, ponctuation après la vignette, masquée sur téléphone ?]
// Texte + vignette + ponctuation forment un bloc insécable : jamais de ligne qui commence par ", ".
const MORCEAUX: [string, number, string, boolean][] = [
  ["Des Scream", 1, ",", false],
  ["des nonnes", 0, ",", true],
  ["des crânes", 10, ",", false],
  ["des créatures", 3, "", true],
  ["et six Jason", 17, " :", false],
];

export default function Intro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Une seule entrée, une fois, qui finit toujours à pleine opacité (pas de scrub).
        gsap.from(".in-mot", {
          autoAlpha: 0,
          y: 24,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="intro-titre" className="wrap py-[clamp(72px,12vh,140px)]">
      <h2 id="intro-titre" className="sr-only">Les styles de masques</h2>
      <p className="font-display mx-auto max-w-full text-left text-[24px] font-light leading-[1.2] md:w-[70vw] md:text-center md:text-[clamp(22px,3vw,36px)]">
        {MORCEAUX.map(([texte, i, ponct, cacheMobile]) => {
          const m = MASQUES[i];
          return (
            <span key={m.num}>
              <span className="in-mot inline-block whitespace-nowrap">
                {texte}
                <span
                  className={`duo mx-[0.12em] h-[0.85em] w-[1.1em] overflow-hidden rounded-[0.14em] align-[-0.1em] ${cacheMobile ? "hidden md:inline-block" : "inline-block"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.nom} width={480} height={480} loading="lazy" className="h-full w-full object-cover" />
                </span>
                {ponct}
              </span>{" "}
            </span>
          );
        })}
        <span className="in-mot inline">vingt-trois visages pour une seule nuit.</span>
      </p>
    </section>
  );
}
