"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// L'affiche vue de trois distances : entière, puis le "31 OCT", puis "EYA CENTRE".
// Sans JS ou avec mouvement réduit : tout est visible, rien n'est épinglé.
export default function Showcase() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(".sc-bas", { autoAlpha: 0, y: 40 });
        gsap.set(".sc-legende", { autoAlpha: 0, y: 20 });
        gsap.set(".sc-sang", { opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 0.6,
          },
        });
        tl.to(".sc-img", { scale: 1.8, transformOrigin: "85% 85%", duration: 1 })
          .to(".sc-bas", { autoAlpha: 1, y: 0, duration: 0.5 }, "<0.3")
          .to(".sc-sang", { opacity: 0.35, duration: 1 }, 0)
          .to(".sc-img", { scale: 2.6, transformOrigin: "85% 60%", duration: 1 })
          .to(".sc-sang", { opacity: 0.7, duration: 1 }, "<")
          .to(".sc-legende", { autoAlpha: 1, y: 0, duration: 0.5 }, "<0.4");
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="soiree"
      aria-labelledby="soiree-titre"
      className="wrap relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-bg py-16"
    >
      <h2 id="soiree-titre" className="font-display relative z-10 flex flex-col items-center text-center font-light uppercase">
        <span className="block whitespace-nowrap text-[8.2vw] md:text-[clamp(40px,8vw,130px)] leading-none">Samedi 31 octobre</span>
        {/* Le cadre s'intercale visuellement entre les deux moitiés du titre. */}
        <span className="relative my-4 block aspect-[4/5] w-[70vw] overflow-hidden md:w-[min(30vw,44svh)]" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/affiche.webp"
            alt=""
            width={864}
            height={1080}
            className="sc-img h-full w-full object-cover will-change-transform"
          />
          <span
            className="sc-sang pointer-events-none absolute inset-0"
            style={{ /* taste-skill-ignore: vignette sang */ background: "radial-gradient(ellipse at center, transparent 35%, var(--blood-deep) 100%)", mixBlendMode: "multiply" }}
          />
        </span>
        <span className="sc-bas -mt-[0.3em] block whitespace-nowrap text-[8.2vw] md:text-[clamp(40px,8vw,130px)] leading-none text-[var(--ink)]">
          EYA Centre, dès 19h
        </span>
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/affiche.webp" alt="Affiche de la soirée Halloween du BDE : 31 octobre, EYA Centre, à partir de 19h, portez vos déguisements." width={864} height={1080} className="sr-only" />
      <p className="sc-legende relative z-10 mt-8 max-w-[28ch] text-center text-[17px] leading-relaxed md:absolute md:right-[var(--margin)] md:top-1/2 md:mt-0 md:max-w-[28ch] md:-translate-y-1/2 md:text-left md:text-lg">
        Déguisement fortement conseillé. Les masques sont aussi vendus sur place, tant qu&apos;il en reste.
      </p>
    </section>
  );
}
