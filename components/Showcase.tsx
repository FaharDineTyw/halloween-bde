"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MASQUES } from "@/lib/masques";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ARRIERE = [MASQUES[6], MASQUES[16]]; // Scream ensanglanté, La Nonne hurlante

// L'affiche en éventail : deux masques penchés derrière elle, la date à gauche, le lieu à droite.
// Sans JS ou avec mouvement réduit : l'éventail est déjà ouvert, tout est visible.
export default function Showcase() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cartes = gsap.utils.toArray<HTMLElement>(".sc-carte");
        // Position de repos lue depuis le CSS (différente téléphone / bureau).
        const base = cartes.map((c) => ({ rotation: gsap.getProperty(c, "rotation") as number, x: gsap.getProperty(c, "x") as number }));

        gsap
          .timeline({ defaults: { duration: 0.9, ease: "power3.out" }, scrollTrigger: { trigger: root.current, start: "top 75%", once: true } })
          .from(".sc-affiche", { y: 40, autoAlpha: 0 })
          .from(cartes, { rotation: 0, x: 0, duration: 1.1, ease: "back.out(1.6)", stagger: 0.08 }, "<0.25")
          .from(".sc-date", { x: -60, autoAlpha: 0 }, "<")
          .from(".sc-lieu", { x: 60, autoAlpha: 0 }, "<")
          .from(".sc-legende", { y: 16, autoAlpha: 0, duration: 0.6 }, "<0.3");

        let ouvert = false;
        const ecarter = contextSafe!((oui: boolean) => {
          ouvert = oui;
          cartes.forEach((c, i) => {
            const s = i === 0 ? -1 : 1;
            gsap.to(c, {
              rotation: oui ? s * 18 : base[i].rotation,
              x: oui ? base[i].x + s * 40 : base[i].x,
              duration: 0.6,
              ease: "power3.out",
              overwrite: "auto",
            });
          });
        });

        const eventail = root.current!.querySelector<HTMLElement>(".sc-eventail")!;
        const tilt = root.current!.querySelector<HTMLElement>(".sc-tilt")!;
        const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.5, ease: "power3.out" });
        const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.5, ease: "power3.out" });

        const bouge = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const r = eventail.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 16);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 16);
        };
        const entre = (e: PointerEvent) => e.pointerType === "mouse" && ecarter(true);
        const sort = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          ecarter(false);
          rx(0);
          ry(0);
        };
        // Au doigt : un tap ouvre ou referme l'éventail.
        const tape = (e: PointerEvent) => e.pointerType !== "mouse" && ecarter(!ouvert);

        eventail.addEventListener("pointermove", bouge);
        eventail.addEventListener("pointerenter", entre);
        eventail.addEventListener("pointerleave", sort);
        eventail.addEventListener("pointerup", tape);
        return () => {
          eventail.removeEventListener("pointermove", bouge);
          eventail.removeEventListener("pointerenter", entre);
          eventail.removeEventListener("pointerleave", sort);
          eventail.removeEventListener("pointerup", tape);
        };
      });
    },
    { scope: root },
  );

  const titre = "font-display font-light uppercase whitespace-nowrap";

  return (
    <section
      ref={root}
      id="soiree"
      aria-labelledby="soiree-titre"
      className="wrap relative flex min-h-svh items-center overflow-x-clip py-[clamp(96px,16vh,200px)]"
    >
      <div className="flex w-full flex-col items-center gap-10 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-12 lg:gap-y-14">
        {/* Le titre se répartit autour de l'éventail : display contents sur grand écran. */}
        <h2 id="soiree-titre" className="contents">
          <span className={`sc-date ${titre} block text-center text-[6.8vw] leading-none lg:order-1 lg:text-left lg:text-[clamp(40px,4.2vw,84px)]`}>
            <span className="lg:hidden">Samedi 31 octobre</span>
            <span className="hidden lg:block">Samedi</span>
            <span className="hidden lg:block">31 oct.</span>
          </span>
          <span className={`sc-lieu ${titre} order-3 block text-center text-[6.8vw] leading-none lg:text-right lg:text-[clamp(40px,4.2vw,84px)]`}>
            <span className="lg:hidden">EYA Centre, dès 19h</span>
            <span className="hidden lg:block">EYA Centre</span>
            <span className="hidden lg:block">dès 19h</span>
          </span>
        </h2>

        <div className="sc-eventail order-2 relative w-[72vw] cursor-pointer select-none [perspective:1000px] sm:w-[min(56vw,420px)] lg:w-[min(30vw,420px)]">
          <div className="sc-tilt relative aspect-[4/5] [transform-style:preserve-3d]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[35%] -z-10"
              style={{ /* taste-skill-ignore: halo */ background: "radial-gradient(closest-side, rgba(179,16,13,.45), transparent)" }}
            />
            {ARRIERE.map((m, i) => (
              <div
                key={m.num}
                aria-hidden="true"
                className={`sc-carte duo absolute inset-[10%] overflow-hidden ${
                  i === 0
                    ? "[transform:translateX(-22%)_rotate(-10deg)] lg:[transform:translateX(-34%)_rotate(-12deg)]"
                    : "[transform:translateX(22%)_rotate(10deg)] lg:[transform:translateX(34%)_rotate(12deg)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt="" width={480} height={480} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/affiche.webp"
              alt="Affiche de la soirée Halloween du BDE : 31 octobre, EYA Centre, à partir de 19h, portez vos déguisements."
              width={864}
              height={1080}
              className="sc-affiche relative h-full w-full object-contain"
            />
          </div>
        </div>

        <p className="sc-legende order-4 max-w-[40ch] text-center text-[18px] leading-relaxed lg:col-start-2">
          Déguisement fortement conseillé. Les masques sont aussi vendus sur place, tant qu&apos;il en reste.
        </p>
      </div>
    </section>
  );
}
