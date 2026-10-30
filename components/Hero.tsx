"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES, waLien } from "@/lib/masques";
import SangGL from "@/components/hero/SangGL";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DEPART = 6; // masque N°07
const PAS = 7;
// 7 et 23 premiers entre eux : on passe par les 23 masques dans un ordre mélangé

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const lampe = useRef<HTMLDivElement>(null);
  const premier = useRef(true);
  const [i, setI] = useState(DEPART);
  const [vrai, setVrai] = useState(false);
  const m = MASQUES[i];

  const suivant = () => setI((n) => (n + PAS) % MASQUES.length);
  const precedent = () => setI((n) => (n - PAS + MASQUES.length) % MASQUES.length);

  // Séquence d'arrivée + lampe torche qui suit le pointeur.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .from(".h-ligne", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.12 })
          .from(".h-fente", { clipPath: "inset(0 100% 0 0)", duration: 1.1, ease: "power4.inOut" }, "-=0.4")
          .from(".h-fente img", { scale: 1.12, duration: 1.1 }, "<")
          .from(".h-suite", { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, "-=0.5");
        // Boucles infinies, mises en pause quand le hero sort de l'écran.
        const boucles: gsap.core.Animation[] = [];
        // Le visage géant respire très lentement.
        boucles.push(gsap.fromTo(".h-spectre img", { scale: 1.08 }, { scale: 1, duration: 8, ease: "sine.inOut", repeat: -1, yoyo: true }));
        ScrollTrigger.create({
          trigger: root.current, start: "top bottom", end: "bottom top",
          onToggle: (st) => boucles.forEach((b) => (st.isActive ? b.resume() : b.pause())),
        });
      });
      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        const el = lampe.current!;
        gsap.set(el, { autoAlpha: 1 });
        const xTo = gsap.quickTo(el, "--x", { duration: 0.5, ease: "power3", unit: "px" });
        const yTo = gsap.quickTo(el, "--y", { duration: 0.5, ease: "power3", unit: "px" });
        const bouge = (e: PointerEvent) => {
          const r = root.current!.getBoundingClientRect();
          xTo(e.clientX - r.left);
          yTo(e.clientY - r.top);
        };
        root.current!.addEventListener("pointermove", bouge);
        return () => root.current?.removeEventListener("pointermove", bouge);
      });
    },
    { scope: root },
  );

  // Obturateur à chaque changement de masque (pas au premier rendu : la séquence d'arrivée s'en charge).
  useGSAP(
    () => {
      if (premier.current) { premier.current = false; return; }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(".h-fente, .h-spectre", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.38, ease: "expo.out", stagger: 0.06 });
      gsap.fromTo(".h-fente img", { scale: 1.08 }, { scale: 1, duration: 0.38, ease: "expo.out" });
    },
    { scope: root, dependencies: [i] },
  );

  return (
    <section ref={root} aria-labelledby="hero-titre" className="wrap relative flex min-h-svh flex-col justify-end overflow-hidden pt-32 pb-12 md:pb-16">
      <div
        ref={lampe}
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-0 z-0"
        style={{ /* taste-skill-ignore: lampe torche */ background: "radial-gradient(circle 32vmax at var(--x, 50%) var(--y, 40%), rgba(179,16,13,.22), transparent 70%)" }}
      />

      {/* Sang qui suinte du bord haut (WebGL). */}
      <SangGL />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] block h-1 bg-blood-deep" />

      {/* Le visage choisi, en géant, au-dessus du titre : il occupe l'espace libre, jamais le texte. */}
      <div aria-hidden="true" className="h-spectre duo relative z-0 mb-8 min-h-[18svh] flex-1 overflow-hidden opacity-40 md:-mr-[var(--margin)] md:ml-[38%]" data-vrai={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.img} alt="" width={480} height={480} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 38%" }} />
      </div>

      <h1 id="hero-titre" className="font-display relative z-10 font-light uppercase text-[clamp(2.5rem,11.5vw,10rem)] md:text-[clamp(2.5rem,9.6vw,10rem)]" style={{ lineHeight: 0.95 }}>
        <span className="h-ligne block"><span className="gresille">Le 31 octobre,</span></span>
        <span className="h-ligne block whitespace-nowrap">
          <span className="gresille">tu seras</span>{" "}
          <button
            type="button"
            onClick={suivant}
            aria-label={`Changer de masque, actuellement N°${m.num} ${m.nom}`}
            data-vrai={vrai}
            className="h-fente duo relative inline-block cursor-pointer overflow-hidden align-baseline"
            style={{ width: "2.6em", height: "0.78em", willChange: "clip-path" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.img} alt={m.nom} width={480} height={480} className="h-full w-full object-cover" style={{ objectPosition: "50% 35%" }} />
          </button>
        </span>
      </h1>

      <div className="relative z-10 mt-10 grid gap-6 md:grid-cols-12 md:items-end">
        <p className="h-suite max-w-[38ch] md:col-span-6" style={{ fontSize: "var(--step-lead)", lineHeight: 1.4 }}>
          La soirée Halloween du BDE Epitech Bénin, samedi 31 octobre dès 19h à l&apos;EYA Centre. Choisis ton visage parmi 23 masques.
        </p>

        <div className="h-suite flex flex-col gap-4 md:col-span-6 md:col-start-7 md:items-end">
          <p aria-live="polite" className="text-[var(--step-body)]">
            N°{m.num} · {m.nom} · <span className="text-ember">{m.prix}</span>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[var(--step-small)] text-muted">
            <button type="button" onClick={precedent} className="underline-offset-4 hover:text-ink hover:underline">Masque précédent</button>
            <button type="button" onClick={suivant} className="underline-offset-4 hover:text-ink hover:underline">Masque suivant</button>
            <button type="button" aria-pressed={vrai} onClick={() => setVrai((v) => !v)} className="underline-offset-4 hover:text-ink hover:underline">
              {vrai ? "Revenir au rouge" : "Voir en vraies couleurs"}
            </button>
          </div>
          <a href={waLien(m)} target="_blank" rel="noopener" className="btn w-full md:w-auto">
            Réserver le n°{m.num} sur WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
