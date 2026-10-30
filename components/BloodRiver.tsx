"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { programmeSang } from "@/components/sang/gl";

// Le sang des deux marges : un seul filet continu par côté, du haut de la page jusqu'à la flaque du pied de page.
// Le filet est en coordonnées du DOCUMENT : il part du haut (sous la bande du hero) et sa pointe suit le défilement
// avec du retard (le sang coule, il ne saute pas). Arrivé au pied de page, il se déverse dans la flaque ([data-flaque]).

type Goutte = { y: number; v: number; r: number };
type Cote = {
  cv: HTMLCanvasElement; gl: WebGLRenderingContext; N: number; U: (n: string) => WebGLUniformLocation | null;
  seg: Float32Array; ball: Float32Array; ph: number; decal: number; tip: number; gonfle: number; prochaine: number; gouttes: Goutte[]; mare: number;
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export default function BloodRiver() {
  const gauche = useRef<HTMLCanvasElement>(null);
  const droite = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cotes: Cote[] = [];
    for (const [k, cv] of [gauche.current!, droite.current!].entries()) {
      const gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
      const ps = gl && programmeSang(gl);
      if (!gl || !ps) { cv.style.display = "none"; continue; }
      gl.uniform1f(ps.U("u_noband"), 1);
      const cache = new Map<string, WebGLUniformLocation | null>();
      const U = (n: string) => { if (!cache.has(n)) cache.set(n, ps.U(n)); return cache.get(n)!; };
      // Le côté droit a sa propre phase et un léger retard : les deux filets ne coulent pas en miroir.
      cotes.push({ cv, gl, N: ps.N, U, seg: new Float32Array(ps.N * 4), ball: new Float32Array(ps.N * 3), ph: k * 2.7 + rnd(0, 1), decal: k ? -40 : 0, tip: 0, gonfle: 0, prochaine: rnd(2, 5), gouttes: [], mare: 0 });
    }
    if (!cotes.length) return;

    let M = 16, H = 0, dpr = 1, w = 5;
    const taille = () => {
      // Largeur de la marge réelle de la page (padding de .wrap).
      const wrap = document.querySelector(".wrap");
      M = wrap ? parseFloat(getComputedStyle(wrap).paddingLeft) || 16 : 16;
      w = window.innerWidth < 640 ? 3.2 : 4.4; // rayon du filet : ~6–9 px de large, lisible à l'œil
      for (const c of cotes) {
        c.cv.style.width = `${M}px`;
        H = c.cv.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1 : 1.5);
        c.cv.width = Math.round(M * dpr); c.cv.height = Math.round(H * dpr);
        c.gl.viewport(0, 0, c.cv.width, c.cv.height);
      }
    };

    // Ligne de la flaque du pied de page, en coordonnées du document (null si absente).
    const flaqueDoc = () => { const el = document.querySelector("[data-flaque]"); return el ? el.getBoundingClientRect().top + window.scrollY : null; };
    // Où la pointe veut aller : 72 % de l'écran, jamais au-delà de la flaque ; quand la flaque est à l'écran, jusqu'à elle.
    const cible = () => {
      const f = flaqueDoc(), bas = window.scrollY + window.innerHeight * .72;
      if (f === null) return bas;
      return f - window.scrollY < window.innerHeight ? f : Math.min(bas, f);
    };

    let temps = 0;
    const pas = (dt: number) => {
      const t = cible(), f = flaqueDoc(), fy = f === null ? Infinity : f - window.scrollY;
      for (const c of cotes) {
        const but = t + c.decal;
        // Descend en coulant (~0,08 par image à 60 i/s), remonte bien plus lentement (le sang ne remonte pas vite).
        c.tip += (but - c.tip) * (1 - Math.exp(-dt * (but > c.tip ? 5 : 1.2)));
        const yTip = c.tip - window.scrollY, sol = Math.min(H + 30, fy);
        // La perle de la pointe gonfle puis lâche une goutte toutes les 2 à 5 s.
        c.prochaine -= dt; c.gonfle = Math.min(1, c.gonfle + dt * .35);
        if (c.prochaine <= 0 && yTip < sol - 8) { c.gouttes.push({ y: yTip + w * 2, v: 60, r: w * 1.5 }); c.gonfle = 0; c.prochaine = rnd(2, 5); }
        for (const g of c.gouttes) { g.v += 1600 * dt; g.y += g.v * dt; }
        // Une goutte qui atteint la flaque la nourrit ; sinon elle sort par le bas de l'écran.
        c.gouttes = c.gouttes.filter((g) => { if (g.y < sol) return true; if (fy < H) c.mare = Math.min(1, c.mare + .25); return false; });
        // La petite mare au pied du filet existe tant que la flaque est à l'écran.
        c.mare = fy < H ? Math.min(1, c.mare + dt * .5) : Math.max(0, c.mare - dt);
      }
    };

    const rendu = () => {
      const f = flaqueDoc(), fy = f === null ? Infinity : f - window.scrollY;
      for (const c of cotes) {
        let ns = 0, nb = 0;
        const seg = (x: number, y0: number, y1: number, r: number) => { if (ns >= c.N || r <= .05) return; c.seg.set([x, y0, y1, r], ns * 4); ns++; };
        const boule = (x: number, y: number, r: number) => { if (nb >= c.N || r <= .05) return; c.ball.set([x, y, r], nb * 3); nb++; };
        const xDe = (d: number) => M * .5 + Math.sin(d * .004 + c.ph) * Math.min(2, M * .08); // léger zigzag le long du mur
        const rDe = (d: number) => w * (.85 + .2 * Math.sin(d * .011 + c.ph) + .12 * Math.sin(d * .031 + c.ph * 2)); // épaisseur irrégulière
        const yTip = Math.min(c.tip - window.scrollY, fy);
        const y0 = Math.max(-10, -window.scrollY), y1 = Math.min(yTip, H + 10);
        if (y1 > y0) {
          // Le filet visible, découpé en tronçons (budget du shader : on garde quelques places pour les boules).
          const n = Math.max(4, c.N - 6), h = (y1 - y0) / n;
          for (let i = 0; i < n; i++) {
            const a = y0 + i * h, b = a + h, d = (a + b) / 2 + window.scrollY;
            seg(xDe(d), a, b + .5, rDe(d));
          }
          // Deux renflements qui descendent lentement le long du filet (le sang s'écoule).
          const long = c.tip;
          for (const k of [0, .5]) {
            const d = ((temps * 70 + k * long + c.ph * 300) % Math.max(long, 1));
            const y = d - window.scrollY;
            if (y > y0 && y < y1) boule(xDe(d), y, w * 1.45);
          }
        }
        // Perle de la pointe (au-dessus de la flaque) ou mare qui rejoint la flaque du pied de page.
        if (yTip > -10 && yTip < H + 10) {
          if (yTip < fy - 2) boule(xDe(c.tip), yTip, w * 1.6 * (1 + .25 * c.gonfle));
          else if (c.mare > 0) { boule(M * .3, fy, w * 2.2 * c.mare); boule(M * .7, fy, w * 2.4 * c.mare); }
        }
        for (const g of c.gouttes) { seg(xDe(c.tip), g.y - Math.min(g.v * .012, g.r * 2), g.y, g.r * .7); boule(xDe(c.tip), g.y, g.r); }
        const { gl, U } = c;
        gl.uniform2f(U("u_res"), M, H); gl.uniform1f(U("u_dpr"), dpr); gl.uniform1f(U("u_t"), temps);
        gl.uniform1i(U("u_ns"), ns); gl.uniform1i(U("u_nb"), nb);
        gl.uniform4fv(U("u_seg"), c.seg); gl.uniform3fv(U("u_ball"), c.ball);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    taille();
    for (const c of cotes) c.tip = cible() + c.decal;

    // La hauteur de page change (filtres, polices, images) : on recale les déclencheurs de défilement.
    let tr = 0;
    const ro = new ResizeObserver(() => { clearTimeout(tr); tr = window.setTimeout(() => ScrollTrigger.refresh(), 200); });
    ro.observe(document.body);

    // Mouvement réduit : image fixe, le filet va du haut de la page jusqu'à la cible, sans goutte ; redessiné au défilement.
    const statique = () => { for (const c of cotes) { c.tip = cible() + c.decal; c.mare = 1; } rendu(); };

    let tm = 0, lw = window.innerWidth, lh = window.innerHeight;
    const onResize = () => {
      clearTimeout(tm);
      tm = window.setTimeout(() => {
        if (window.innerWidth === lw && Math.abs(window.innerHeight - lh) < 160) return; // barre d'adresse mobile
        lw = window.innerWidth; lh = window.innerHeight; taille(); if (reduit) statique();
      }, 150);
    };

    if (reduit) {
      statique();
      window.addEventListener("scroll", statique, { passive: true });
      window.addEventListener("resize", onResize);
      return () => { ro.disconnect(); clearTimeout(tr); clearTimeout(tm); window.removeEventListener("scroll", statique); window.removeEventListener("resize", onResize); };
    }

    let raf = 0, last = 0, perdu = false;
    const frame = (now: number) => {
      raf = 0;
      if (perdu || document.hidden) return;
      if (window.innerWidth < 640 && now - last < 32) { raf = requestAnimationFrame(frame); return; } // ~30 fps sur téléphone
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now; temps += dt;
      pas(dt); rendu();
      raf = requestAnimationFrame(frame);
    };
    const relance = () => { if (!raf && !document.hidden && !perdu) { last = 0; raf = requestAnimationFrame(frame); } };
    const onLost = (e: Event) => { e.preventDefault(); perdu = true; for (const c of cotes) c.cv.style.display = "none"; };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", relance);
    for (const c of cotes) c.cv.addEventListener("webglcontextlost", onLost);
    relance();

    return () => {
      cancelAnimationFrame(raf); clearTimeout(tm); clearTimeout(tr); ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", relance);
      for (const c of cotes) c.cv.removeEventListener("webglcontextlost", onLost);
    };
  }, []);

  const bande = "pointer-events-none fixed top-0 z-0 block h-lvh w-4";
  return (
    <>
      <canvas ref={gauche} aria-hidden="true" className={`${bande} left-0`} />
      <canvas ref={droite} aria-hidden="true" className={`${bande} right-0`} />
    </>
  );
}
