"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

// Générateur pseudo-aléatoire à graine : même tracé à chaque visite.
function graine(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Un filet vertical qui ondule légèrement autour de x, de 0 à h.
function filet(x: number, h: number, s: number, ampl: number) {
  const r = graine(s);
  let d = `M${x} 0`;
  let px = x;
  for (let y = 140; y < h + 140; y += 140) {
    const nx = x + (r() - 0.5) * 2 * ampl;
    d += ` Q${px + (r() - 0.5) * ampl} ${y - 70} ${nx.toFixed(1)} ${Math.min(y, h)}`;
    px = nx;
  }
  return d;
}

// [côté, décalage depuis le bord en part de la marge, épaisseur, graine]
const FILETS: ["g" | "d", number, number, number][] = [
  ["g", 0.45, 6, 11],
  ["g", 0.8, 2.5, 29],
  ["d", 0.5, 5, 47],
];
// Éclaboussures : [filet, position verticale en part de la page]
const TACHES: [number, number][] = [[0, 0.22], [2, 0.41], [1, 0.63], [2, 0.86]];

export default function BloodRiver() {
  const root = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState({ w: 0, h: 0, m: 16 });

  useLayoutEffect(() => {
    const parent = root.current?.parentElement;
    if (!parent) return;
    const mesure = () => {
      const m = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--margin")) || 16;
      setTaille({ w: parent.offsetWidth, h: parent.scrollHeight, m });
    };
    mesure();
    const ro = new ResizeObserver(mesure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const { w, h, m } = taille;
  const traces = FILETS.map(([cote, part, ep, s]) => {
    const x = cote === "g" ? m * part : w - m * part;
    return { x, ep, d: filet(x, h, s, Math.max(1.5, m * 0.12)) };
  });

  useGSAP(
    (_ctx, contextSafe) => {
      if (!h) return;
      const chemins = gsap.utils.toArray<SVGPathElement>(".br-filet", root.current);
      const tetes = gsap.utils.toArray<SVGCircleElement>(".br-tete", root.current);
      const taches = gsap.utils.toArray<SVGGElement>(".br-tache", root.current);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(chemins, { drawSVG: "100%" });
        gsap.set(tetes, { autoAlpha: 0 });
        gsap.set(taches, { scale: 1, transformOrigin: "50% 50%" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const longueurs = chemins.map((p) => p.getTotalLength());
        // Table de points calculée une fois : pas de getPointAtLength à chaque image de défilement.
        const table = chemins.map((c, k) => Array.from({ length: 257 }, (_, j) => c.getPointAtLength((j / 256) * longueurs[k])));
        const montrees = TACHES.map(() => false);
        gsap.set(taches, { scale: 0, transformOrigin: "50% 50%" });
        const montre = contextSafe!((k: number, oui: boolean) => {
          gsap.to(taches[k], { scale: oui ? 1 : 0, duration: oui ? 0.5 : 0.25, ease: oui ? "back.out(2.5)" : "power2.in" });
        });

        let t: gsap.core.Tween | null = null;
        t = gsap.fromTo(
          chemins,
          { drawSVG: "0% 0.5%" },
          {
            drawSVG: "0% 100%",
            ease: "none",
            scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.6 },
            onUpdate: () => {
              // La goutte de tête suit la pointe de chaque filet.
              const p = Math.max(0.005, t ? t.progress() : 0);
              chemins.forEach((_c, k) => {
                const pt = table[k][Math.round(p * 256)];
                tetes[k].setAttribute("cx", String(pt.x));
                tetes[k].setAttribute("cy", String(pt.y));
              });
              TACHES.forEach(([, y], k) => {
                const oui = p >= y;
                if (oui !== montrees[k]) { montrees[k] = oui; montre(k, oui); }
              });
            },
          },
        );
        // Position de départ des têtes avant le premier défilement.
        chemins.forEach((c, k) => { const pt = c.getPointAtLength(0.005 * longueurs[k]); gsap.set(tetes[k], { attr: { cx: pt.x, cy: pt.y } }); });
        // La goutte de tête palpite doucement.
        gsap.to(tetes, { scale: 1.35, transformOrigin: "50% 50%", duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.4 });
      });
      // La hauteur de page a changé (filtre, polices, images) : on recale tous les déclencheurs.
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [w, h, m], revertOnUpdate: true },
  );

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {h > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute left-0 top-0">
          {traces.map((t, k) => (
            <path key={k} className="br-filet" d={t.d} fill="none" stroke="var(--blood)" strokeWidth={t.ep} strokeLinecap="round" />
          ))}
          {traces.map((t, k) => (
            <circle key={k} className="br-tete" cx={t.x} cy={0} r={t.ep * 0.95} fill="var(--blood)" />
          ))}
          {TACHES.map(([f, y], k) => {
            const cx = traces[f].x;
            const cy = y * h;
            return (
              <g key={k} className="br-tache" fill="var(--blood)">
                <circle cx={cx} cy={cy} r={traces[f].ep * 1.3} />
                <circle cx={cx + (f === 2 ? -9 : 8)} cy={cy - 6} r={2.2} />
                <circle cx={cx + (f === 2 ? -5 : 5)} cy={cy + 10} r={1.6} />
                <circle cx={cx + (f === 2 ? 6 : -6)} cy={cy + 4} r={1.2} />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
