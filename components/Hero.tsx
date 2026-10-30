"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, waLien } from "@/lib/masques";
import SangGL from "@/components/hero/SangGL";
import IconeWhatsApp from "@/components/ui/IconeWhatsApp";
import Spirale from "@/components/affiche/Spirale";
import { Cle, Epingle, Fantome, MASQUE_PORTE, Porte } from "@/components/affiche/Dessins";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Le hero EST l'affiche : lettrage HALLOWEEN, clé-bouton qui pend, infos aux coins.
// Au défilement, la clé descend dans la serrure, tourne, et la petite porte s'ouvre sur « l'autre côté »
// (la couleur claire du catalogue qui suit), comme dans Coraline.
export default function Hero() {
  const scene = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { anime: "(prefers-reduced-motion: no-preference)", souris: "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)" },
        (mc) => {
          const { anime, souris } = mc.conditions as { anime: boolean; souris: boolean };
          if (!anime) return;
          const stage = scene.current!;
          const voyage = stage.querySelector<HTMLElement>(".a-voyage")!;
          const autre = stage.querySelector<HTMLElement>(".a-autre")!;

          // Arrivée : un seul moment orchestré.
          gsap.timeline({ defaults: { ease: "power3.out" } })
            .from(".a-lettrage", { yPercent: -18, autoAlpha: 0, duration: 1 })
            .from(".a-penche", { y: -140, duration: 1.6, ease: "elastic.out(1, 0.45)" }, "-=0.6")
            .from(".a-info", { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, "-=1.1");

          // Boucles : la clé se balance, le fantôme cligne. En pause hors écran.
          const boucles = [
            gsap.fromTo(".a-balance", { rotation: -4 }, { rotation: 4, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 0%" }),
            gsap.timeline({ repeat: -1, repeatDelay: 3.2 })
              .to(".fantome-yeux", { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.08, ease: "power2.out" })
              .to(".fantome-yeux", { scaleY: 1, duration: 0.14, ease: "power2.out" })
              .to(".a-fantome", { rotation: 5, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 1 }, "<"),
          ];
          ScrollTrigger.create({
            trigger: stage, start: "top bottom", end: "bottom top",
            onToggle: (st) => boucles.forEach((b) => (st.isActive ? b.resume() : b.pause())),
          });

          // La clé penche vers le pointeur (souris seulement).
          let quitte = () => {};
          if (souris) {
            const penche = gsap.quickTo(".a-penche", "rotation", { duration: 0.8, ease: "power3" });
            const bouge = (e: PointerEvent) => penche((e.clientX / innerWidth - 0.5) * 10);
            window.addEventListener("pointermove", bouge, { passive: true });
            quitte = () => window.removeEventListener("pointermove", bouge);
          }

          // Scène épinglée : la clé descend au centre de la porte, tourne (petit « clic »), la porte s'ouvre.
          gsap.set(autre, { "--porte": 0 });
          gsap.set(".a-porte", { scale: 0.9 });
          gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: stage, start: "top top", end: "+=150%", pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
          })
            .to(voyage, { y: () => stage.clientHeight * 0.55 - (voyage.offsetTop + voyage.offsetHeight / 2), scale: 0.78, duration: 0.35, ease: "power2.inOut" })
            .to(".a-porte", { autoAlpha: 1, scale: 1, duration: 0.15, ease: "power2.out" }, 0.25)
            .to(voyage, { rotationY: 82, transformPerspective: 700, duration: 0.12, ease: "power2.in" }, 0.38)
            .to(voyage, { rotationY: 72, duration: 0.05, ease: "power2.out" }, 0.5)
            .to(autre, { "--porte": 900, duration: 0.45, ease: "power3.in" }, 0.55)
            .to([".a-porte", voyage], { autoAlpha: 0, duration: 0.1 }, 0.62);

          return () => quitte();
        },
      );
    },
    { scope: scene },
  );

  const info = "a-info font-display uppercase leading-[0.95] text-accent";

  return (
    <section ref={scene} aria-labelledby="hero-titre" className="relative h-svh min-h-[560px] overflow-hidden">
      <Spirale />
      <SangGL />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] block h-1 bg-blood-deep" />

      {/* Lettrage de l'affiche : le O est le fantôme aux yeux-boutons. */}
      <h1
        id="hero-titre"
        aria-label="Halloween, soirée du BDE Epitech Bénin"
        className="wrap absolute inset-x-0 top-[84px] z-10 text-center text-[clamp(3rem,17vw,26svh)] md:top-[96px]"
      >
        <span
          className="a-lettrage font-lettrage inline-block origin-top whitespace-nowrap text-accent"
          style={{ transform: "scaleY(1.25)" }}
        >
          HALL<Fantome className="a-fantome mx-[0.03em] inline-block h-[0.74em] w-auto align-baseline" />WEEN
        </span>
      </h1>

      {/* La clé qui pend : voyage (défilement) > penche (pointeur) > balance (pendule). */}
      <div className="a-voyage absolute left-1/2 top-[38svh] z-20 -translate-x-1/2 md:top-[40svh]" style={{ transformStyle: "preserve-3d" }}>
        <div className="a-penche origin-top">
          <div className="a-balance origin-top">
            <Cle className="h-[26svh] w-auto md:h-[30svh]" />
          </div>
        </div>
      </div>

      {/* Petite porte, au centre, révélée quand la clé arrive. */}
      <Porte className="a-porte pointer-events-none invisible absolute left-1/2 top-[55%] z-10 h-auto w-[28vmin] -translate-x-1/2 -translate-y-1/2 opacity-0" />

      {/* Infos posées comme sur l'affiche. */}
      <p className={`${info} absolute left-[var(--margin)] top-[50%] z-10 text-[clamp(15px,2.2vw,34px)]`}>
        Portez vos<br />déguisements
      </p>
      <p className={`${info} absolute right-[var(--margin)] top-[50%] z-10 text-right text-[clamp(15px,2.2vw,34px)]`}>
        <Epingle className="mb-1 ml-auto inline-block h-[1em] w-[1em] align-[-0.1em]" /> EYA<br />Centre
      </p>

      <div className="wrap absolute inset-x-0 bottom-6 z-10 grid items-end gap-5 md:bottom-10 md:grid-cols-2">
        <div className="a-info order-2 flex flex-col items-start gap-4 md:order-1">
          <p className="max-w-[26ch] text-[length:var(--step-body)] text-ink">La soirée Halloween du BDE Epitech Bénin.</p>
          <a href={waLien()} target="_blank" rel="noopener" className="btn w-full md:w-auto">
            <IconeWhatsApp />Réserver un masque
          </a>
        </div>
        <p className={`${info} order-1 text-right md:order-2`}>
          <span className="block text-[clamp(14px,1.6vw,24px)]">À partir de 19h</span>
          <span className="block normal-case text-[clamp(4rem,13vw,24svh)] leading-[0.8]">31 oct</span>
        </p>
      </div>

      {/* « L'autre côté » : la porte s'ouvre sur la couleur claire du catalogue qui suit. */}
      <div
        aria-hidden="true"
        className="a-autre pointer-events-none absolute inset-0 z-30 grid place-items-center bg-ink"
        style={{
          WebkitMaskImage: MASQUE_PORTE, maskImage: MASQUE_PORTE,
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "50% 55%", maskPosition: "50% 55%",
          WebkitMaskSize: "calc(var(--porte, 0) * 1vmax) auto", maskSize: "calc(var(--porte, 0) * 1vmax) auto",
        }}
      >
        <div className="flex flex-col items-center gap-[4vmin]">
          <p className="font-display text-[length:var(--step-head)] text-bg">De l&apos;autre côté…</p>
          {/* Ce qu'on découvre en ouvrant la porte : les masques. */}
          <div className="flex gap-[2vmin]">
            {[0, 6, 10, 17, 3].map((k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={k} src={MASQUES[k].img} alt="" width={480} height={480} loading="lazy" decoding="async"
                className="h-[24vmin] w-[18vmin] rounded-[4px] bg-white object-cover" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
