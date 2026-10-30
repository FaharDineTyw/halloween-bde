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
  ["g", 0.42, 6, 11],
  ["g", 0.75, 3, 29],
  ["d", 0.5, 5.5, 47],
];
// Éclaboussures : [filet, position verticale en part de la page]
const TACHES: [number, number][] = [[0, 0.22], [2, 0.41], [1, 0.63], [2, 0.86]];
// Perles le long des filets : [filet, position verticale en part de la page]
const PERLES: [number, number][] = [[0, 0.09], [2, 0.16], [0, 0.34], [1, 0.47], [2, 0.55], [0, 0.71], [2, 0.74], [1, 0.92]];
// Pointe du filet à 65 % de la hauteur d'écran : toujours visible pendant le défilement.
const POINTE = 0.65;

// Goutte en larme, pointe vers le haut (rattachée au filet), centre du rond en 0,0.
const larme = (r: number) => `M0 ${-r * 2.2} C${r * 0.35} ${-r * 1.2} ${r} ${-r * 0.6} ${r} 0 A${r} ${r} 0 0 1 ${-r} 0 C${-r} ${-r * 0.6} ${-r * 0.35} ${-r * 1.2} 0 ${-r * 2.2}Z`;

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
      const couches = gsap.utils.toArray<SVGPathElement>(".br-couche", root.current);
      const chemins = gsap.utils.toArray<SVGPathElement>(".br-filet", root.current);
      const tetes = gsap.utils.toArray<SVGGElement>(".br-tete", root.current);
      const gouttes = gsap.utils.toArray<SVGPathElement>(".br-larme", root.current);
      const chutes = gsap.utils.toArray<SVGCircleElement>(".br-chute", root.current);
      const marques = gsap.utils.toArray<SVGElement>(".br-tache, .br-perle", root.current);
      const seuils = [...TACHES, ...PERLES].map(([, y]) => y);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(couches, { drawSVG: "100%" });
        gsap.set([...tetes, ...chutes], { autoAlpha: 0 });
        gsap.set(marques, { scale: 1, transformOrigin: "50% 50%" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const longueurs = chemins.map((p) => p.getTotalLength());
        // Table de points calculée une fois : pas de getPointAtLength à chaque image de défilement.
        const table = chemins.map((c, k) => Array.from({ length: 257 }, (_, j) => c.getPointAtLength((j / 256) * longueurs[k])));
        const pointes = chemins.map(() => ({ x: 0, y: 0 }));
        const montrees = seuils.map(() => false);
        gsap.set(marques, { scale: 0, transformOrigin: "50% 50%" });
        gsap.set(chutes, { autoAlpha: 0 });
        const montre = contextSafe!((k: number, oui: boolean) => {
          gsap.to(marques[k], { scale: oui ? 1 : 0, duration: oui ? 0.5 : 0.25, ease: oui ? "back.out(2.5)" : "power2.in" });
        });

        // Part tracée : jusqu'à 65 % de l'écran courant, lissée.
        const cible = () => Math.min(1, Math.max(0.01, (window.scrollY + window.innerHeight * POINTE) / h));
        const etat = { p: cible() };
        const applique = () => {
          const p = etat.p;
          gsap.set(couches, { drawSVG: `0% ${p * 100}%` });
          chemins.forEach((_c, k) => {
            const pt = table[k][Math.round(p * 256)];
            pointes[k].x = pt.x; pointes[k].y = pt.y;
            tetes[k].setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
          });
          seuils.forEach((y, k) => {
            const oui = p >= y;
            if (oui !== montrees[k]) { montrees[k] = oui; montre(k, oui); }
          });
        };
        applique();
        ScrollTrigger.create({
          trigger: document.documentElement, start: "top top", end: "bottom bottom",
          onUpdate: () => gsap.to(etat, { p: cible(), duration: 0.6, ease: "power2.out", overwrite: true, onUpdate: applique }),
        });

        // La larme de tête gonfle doucement.
        gsap.to(gouttes, { scaleY: 1.25, scaleX: 1.1, transformOrigin: "50% 0%", duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.4 });

        // De temps en temps, une goutte se détache de la pointe et glisse avant de s'effacer.
        const detache = contextSafe!((k: number) => {
          const g = chutes[k];
          const { x, y } = pointes[k];
          gsap.timeline({ onComplete: () => { gsap.delayedCall(gsap.utils.random(1.5, 4), detache, [k]); } })
            .set(g, { attr: { cx: x, cy: y + traces[k].ep * 0.9 }, y: 0, scaleY: 1, autoAlpha: 1, transformOrigin: "50% 0%" })
            .to(g, { y: gsap.utils.random(40, 90), scaleY: 1.6, duration: 1.1, ease: "power2.in" })
            .to(g, { autoAlpha: 0, duration: 0.35 }, "-=0.35");
        });
        chutes.forEach((_g, k) => gsap.delayedCall(gsap.utils.random(0.8, 3), detache, [k]));
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
            <g key={k} strokeLinecap="round" fill="none">
              {/* sous-couche sombre, filet, reflet brillant décalé */}
              <path className="br-couche" d={t.d} stroke="var(--blood-deep)" strokeWidth={t.ep + 2} />
              <path className="br-couche br-filet" d={t.d} stroke="var(--blood)" strokeWidth={t.ep} />
              <path className="br-couche" d={t.d} stroke="rgba(255,140,120,.35)" strokeWidth={Math.max(0.8, t.ep * 0.22)} transform="translate(-1 0)" />
            </g>
          ))}
          {PERLES.map(([f, y], k) => {
            const r = traces[f].ep * (0.75 + (k % 3) * 0.12);
            return (
              <g key={k} className="br-perle">
                <ellipse cx={traces[f].x} cy={y * h} rx={r} ry={r * 1.5} fill="var(--blood)" />
                <circle cx={traces[f].x - r * 0.35} cy={y * h - r * 0.5} r={r * 0.3} fill="rgba(255,140,120,.35)" />
              </g>
            );
          })}
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
          {traces.map((t, k) => (
            <circle key={k} className="br-chute" cx={t.x} cy={0} r={t.ep * 0.55} fill="var(--blood)" />
          ))}
          {traces.map((t, k) => (
            <g key={k} className="br-tete" transform={`translate(${t.x} 0)`}>
              <path className="br-larme" d={larme(t.ep * 0.95)} fill="var(--blood)" />
              <circle cx={-t.ep * 0.35} cy={-t.ep * 0.2} r={Math.max(0.8, t.ep * 0.22)} fill="rgba(255,150,130,.45)" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
