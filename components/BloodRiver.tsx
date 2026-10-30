"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { programmeSang } from "@/components/sang/gl";

// Filets de sang dans les deux marges : deux bandes WebGL fixes (même rendu que le hero).
// Une perle glisse le long du mur en à-coups (colle, puis repart), laisse une traînée qui s'amincit et sèche.

type Point = { x: number; y: number; age: number; w: number; perle?: boolean };
type Filet = { x0: number; x: number; y: number; t: number; base: number; f1: number; f2: number; f3: number; r0: number; vie: number; pts: Point[]; parti: boolean; colle: number };
type Cote = { cv: HTMLCanvasElement; gl: WebGLRenderingContext; N: number; U: (n: string) => WebGLUniformLocation | null; seg: Float32Array; ball: Float32Array; filets: Filet[]; prochain: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lisse = (p: number) => { const q = Math.min(1, Math.max(0, p)); return q * q * (3 - 2 * q); };
const PAS = 10; // px entre deux points de traînée

export default function BloodRiver() {
  const gauche = useRef<HTMLCanvasElement>(null);
  const droite = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cotes: Cote[] = [];
    for (const cv of [gauche.current!, droite.current!]) {
      const gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
      const ps = gl && programmeSang(gl);
      if (!gl || !ps) { cv.style.display = "none"; continue; }
      gl.uniform1f(ps.U("u_noband"), 1);
      const cache = new Map<string, WebGLUniformLocation | null>();
      const U = (n: string) => { if (!cache.has(n)) cache.set(n, ps.U(n)); return cache.get(n)!; };
      cotes.push({ cv, gl, N: ps.N, U, seg: new Float32Array(ps.N * 4), ball: new Float32Array(ps.N * 3), filets: [], prochain: rnd(0.5, 2.5) });
    }
    if (!cotes.length) return;

    let M = 0, H = 0, dpr = 1, maxFilets = 2, K = 10;
    const taille = () => {
      // Largeur de la marge réelle de la page (padding de .wrap).
      const wrap = document.querySelector(".wrap");
      M = wrap ? parseFloat(getComputedStyle(wrap).paddingLeft) || 16 : 16;
      maxFilets = window.innerWidth < 640 ? 1 : 2;
      for (const c of cotes) {
        c.cv.style.width = `${M}px`;
        H = c.cv.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1 : 1.5);
        c.cv.width = Math.round(M * dpr); c.cv.height = Math.round(H * dpr);
        c.gl.viewport(0, 0, c.cv.width, c.cv.height);
        // Budget du shader : K points (et donc K segments) par filet.
        K = Math.max(4, Math.floor(c.N / maxFilets));
      }
    };

    const nouveau = (y = -8): Filet => {
      const x0 = rnd(M * .32, M * .68);
      return { x0, x: x0, y, t: 0, base: rnd(40, 90), f1: rnd(0, 6.3), f2: rnd(0, 6.3), f3: rnd(0, 6.3), r0: window.innerWidth < 640 ? 3.5 : rnd(4, 5), vie: rnd(3, 5), pts: [{ x: x0, y, age: 0, w: 1 }], parti: false, colle: 0 };
    };

    let elan = 0; // petit surplus de vitesse quand on fait défiler (ballottement), retombe tout seul
    const pas = (dt: number) => {
      elan *= Math.exp(-dt * 3);
      for (const c of cotes) {
        c.prochain -= dt;
        if (c.prochain <= 0 && c.filets.length < maxFilets) { c.filets.push(nouveau()); c.prochain = rnd(3, 7); }
        for (const f of c.filets) {
          f.t += dt;
          for (const p of f.pts) p.age += dt;
          if (f.parti) continue;
          // Colle puis glisse : un bruit lisse décide, sous 0,4 la perle s'arrête presque.
          const n = .5 + .3 * Math.sin(f.t * 1.3 + f.f1) + .2 * Math.sin(f.t * 3.1 + f.f2);
          const g = lisse((n - .4) / .6);
          f.y += (f.base * (.05 + 1.6 * g) + elan) * dt;
          f.x = f.x0 + 2 * Math.sin(f.t * .7 + f.f3) * Math.min(1, M / 24);
          f.colle = g < .15 ? f.colle + dt : 0;
          const der = f.pts[f.pts.length - 1];
          // Là où la perle est restée collée longtemps, le sang s'accumule en une petite perle sur la traînée.
          if (f.colle > .7 && !der.perle) der.perle = true;
          if (f.y - der.y >= PAS) { f.pts.push({ x: f.x, y: f.y, age: 0, w: rnd(.65, 1.35) }); if (f.pts.length > K) f.pts.shift(); }
          if (f.y > H + 12) f.parti = true;
        }
        // Le filet disparaît quand sa traînée a fini de sécher.
        c.filets = c.filets.filter((f) => !f.parti || f.pts.some((p) => p.age < f.vie));
      }
    };

    let temps = 0; // horloge du bruit des contours
    const rendu = () => {
      for (const c of cotes) {
        let ns = 0, nb = 0;
        const seg = (x: number, y0: number, y1: number, r: number) => { if (ns >= c.N || r <= .05) return; c.seg.set([x, Math.min(y0, y1), Math.max(y0, y1), r], ns * 4); ns++; };
        for (const f of c.filets) {
          const n = f.pts.length;
          // Rayon : fin au plus ancien, plus épais près de la perle ; sèche en s'amincissant.
          // Largeur irrégulière le long de la traînée (w par point), comme un vrai filet qui coule sur un mur.
          const rayon = (i: number) => (.8 + 1.4 * (n > 1 ? i / (n - 1) : 1)) * f.pts[i].w * (1 - lisse(f.pts[i].age / f.vie));
          for (let i = 0; i < n - 1; i++) seg((f.pts[i].x + f.pts[i + 1].x) / 2, f.pts[i].y, f.pts[i + 1].y, Math.min(rayon(i), rayon(i + 1)));
          for (let i = 0; i < n; i++) if (f.pts[i].perle && nb < c.N - 2) { c.ball.set([f.pts[i].x, f.pts[i].y, rayon(i) * 1.7], nb * 3); nb++; }
          if (!f.parti) {
            const der = f.pts[n - 1];
            seg((der.x + f.x) / 2, der.y, f.y, Math.max(rayon(n - 1), 1.6));
            // La perle grossit un peu quand elle colle.
            if (nb < c.N) { c.ball.set([f.x, f.y, f.r0 * (1 + .12 * Math.sin(f.t * 2 + f.f1))], nb * 3); nb++; }
          }
        }
        const { gl, U } = c;
        gl.uniform2f(U("u_res"), M, H); gl.uniform1f(U("u_dpr"), dpr); gl.uniform1f(U("u_t"), temps);
        gl.uniform1i(U("u_ns"), ns); gl.uniform1i(U("u_nb"), nb);
        gl.uniform4fv(U("u_seg"), c.seg); gl.uniform3fv(U("u_ball"), c.ball);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    taille();

    // La hauteur de page change (filtres, polices, images) : on recale les déclencheurs de défilement.
    let tr = 0;
    const ro = new ResizeObserver(() => { clearTimeout(tr); tr = window.setTimeout(() => ScrollTrigger.refresh(), 200); });
    ro.observe(document.body);

    if (reduit) {
      // Image fixe : un filet immobile par côté.
      for (const c of cotes) {
        const f = nouveau(H * .42);
        f.pts = Array.from({ length: K }, (_, i) => ({ x: f.x0, y: H * .42 - (K - 1 - i) * PAS * 2, age: 0, w: i % 3 ? 1 : 1.3, perle: i === Math.floor(K / 2) }));
        c.filets = [f];
      }
      rendu();
      return () => { ro.disconnect(); clearTimeout(tr); };
    }

    let raf = 0, last = 0, perdu = false, sy = window.scrollY;
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
    const onScroll = () => { const y = window.scrollY; elan = Math.min(120, elan + Math.abs(y - sy) * .6); sy = y; };
    let tm = 0, lw = window.innerWidth, lh = window.innerHeight;
    const onResize = () => {
      clearTimeout(tm);
      tm = window.setTimeout(() => {
        if (window.innerWidth === lw && Math.abs(window.innerHeight - lh) < 160) return; // barre d'adresse mobile
        lw = window.innerWidth; lh = window.innerHeight; taille();
      }, 150);
    };
    const onLost = (e: Event) => { e.preventDefault(); perdu = true; for (const c of cotes) c.cv.style.display = "none"; };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", relance);
    for (const c of cotes) c.cv.addEventListener("webglcontextlost", onLost);
    relance();

    return () => {
      cancelAnimationFrame(raf); clearTimeout(tm); clearTimeout(tr); ro.disconnect();
      window.removeEventListener("scroll", onScroll);
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
