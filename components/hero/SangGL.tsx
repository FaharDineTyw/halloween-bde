"use client";

import { useEffect, useRef } from "react";
import { programmeSang } from "@/components/sang/gl";

// Sang qui suinte du haut du hero, rendu en WebGL (metaballs) : bande, coulures qui gonflent,
// goutte qui s'étire, se détache et tombe. Simulation minuscule côté JS, tout le rendu dans le shader.

type Drip = { x: number; w: number; L: number; Lmin: number; Lmax: number; r: number; rMin: number; rMax: number; phase: number; t: number; dur: number };
type Drop = { x: number; y: number; v: number; r: number; vx?: number; eclabousse?: boolean };
type Bosse = { x: number; h: number; ht: number; w: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lisse = (p: number) => p * p * (3 - 2 * p);

// flaque : les gouttes tombent jusqu'en bas et nourrissent une flaque. className remplace le placement du canvas.
export default function SangGL({ className, flaque = false }: { className?: string; flaque?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) { cv.style.display = "none"; return; }

    const ps = programmeSang(gl);
    if (!ps) { cv.style.display = "none"; return; }
    const { N, U } = ps;
    const uRes = U("u_res"), uDpr = U("u_dpr"), uT = U("u_t"), uNs = U("u_ns"), uNb = U("u_nb"), uSeg = U("u_seg"), uBall = U("u_ball"), uPy = U("u_py"), uPool = U("u_pool");
    const seg = new Float32Array(N * 4), ball = new Float32Array(N * 3), pool = new Float32Array(8 * 3);

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, drips: Drip[] = [], drops: Drop[] = [], bosses: Bosse[] = [], py = 0, hMax = 0, wMax = 0;
    const niveau = (x: number) => bosses.reduce((s, b) => { const dx = (x - b.x) / Math.max(b.w, 1); return s + b.h * Math.exp(-dx * dx); }, 0);
    // Une goutte touche la flaque : la bosse la plus proche grossit (plafonnée), petites éclaboussures.
    const impact = (g: Drop) => {
      let b = bosses.find((q) => Math.abs(q.x - g.x) < q.w * .8);
      if (!b && bosses.length < 8) { b = { x: g.x, h: 0, ht: 0, w: g.r * 3.5 }; bosses.push(b); }
      if (!b) b = bosses.reduce((a, q) => (Math.abs(q.x - g.x) < Math.abs(a.x - g.x) ? q : a));
      b.ht = Math.min(hMax, b.ht + g.r * .45 + 1); b.w = Math.min(wMax, b.w + g.r * .7); b.x += (g.x - b.x) * .15;
      const y = py - niveau(g.x) - 2;
      for (let k = 0, n = 2 + (Math.random() < .5 ? 1 : 0); k < n; k++)
        drops.push({ x: g.x, y, v: -rnd(140, 260), vx: rnd(-90, 90), r: rnd(1.4, 2.4), eclabousse: true });
    };

    const nouvelleCoulee = (d: Drip, premiere = false) => {
      d.Lmax = rnd(H * .16, H * .42); d.rMax = rnd(d.w * 2, d.w * 2.8);
      d.phase = 0; d.t = 0; d.dur = rnd(1.8, 3.6);
      if (premiere) { d.phase = 3; d.dur = rnd(0, 1.2); }
    };
    const taille = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, W < 640 ? 1 : 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      const n = W < 640 ? 6 : 9;
      drips = Array.from({ length: n }, (_, k) => {
        const w = rnd(4, 7.5);
        const d: Drip = { x: (k + .5) / n * W + rnd(-.22, .22) * W / n, w, L: 0, Lmin: rnd(H * .05, H * .12), Lmax: 0, r: 0, rMin: w * 1.4, rMax: 0, phase: 3, t: 0, dur: 0 };
        d.L = d.Lmin; d.r = d.rMin; nouvelleCoulee(d, true);
        if (reduit) { d.L = rnd(H * .08, H * .22); d.r = d.w * 2.4; }
        return d;
      });
      drops = []; bosses = [];
      py = flaque ? H - 10 : 0; hMax = W < 640 ? 14 : 22; wMax = W * .12;
      // La flaque existe déjà un peu au départ, puis grossit avec chaque goutte.
      if (flaque) bosses = drips.slice(0, 8).map((d) => ({ x: d.x, h: reduit ? 10 : 5, ht: reduit ? 10 : 5, w: W * .07 }));
    };

    const pas = (dt: number) => {
      for (const d of drips) {
        d.t += dt;
        const p = Math.min(d.t / d.dur, 1);
        if (d.phase === 0) { // gonfle et s'allonge
          const e = lisse(p); d.L = d.Lmin + (d.Lmax - d.Lmin) * e; d.r = d.rMin + (d.rMax - d.rMin) * e;
          if (p >= 1) { d.phase = 1; d.t = 0; d.dur = .45; }
        } else if (d.phase === 1) { // le col s'étire
          if (p >= 1) { drops.push({ x: d.x, y: d.L + d.r * 1.9, v: 90, r: d.r }); d.phase = 2; d.t = 0; d.dur = .9; }
        } else if (d.phase === 2) { // se rétracte, une nouvelle perle se reforme
          const e = 1 - (1 - p) * (1 - p); d.L = d.Lmax + (d.Lmin - d.Lmax) * e; d.r = d.rMin * e;
          if (p >= 1) { d.phase = 3; d.t = 0; d.dur = rnd(.8, 3); }
        } else if (p >= 1) nouvelleCoulee(d);
      }
      for (const g of drops) { g.v += 1800 * dt; g.y += g.v * dt; if (g.vx) g.x += g.vx * dt; }
      if (flaque) {
        for (const b of bosses) b.h += (b.ht - b.h) * Math.min(1, dt * 2.5);
        drops = drops.filter((g) => {
          if (g.v <= 0 || g.y < py - niveau(g.x) * .7) return true;
          if (!g.eclabousse) impact(g);
          return false;
        });
      } else drops = drops.filter((g) => g.y < H + 40 && g.y < H * .98);
    };

    const rendu = (t: number) => {
      let ns = 0, nb = 0;
      const addSeg = (x: number, y0: number, y1: number, r: number) => { if (ns >= N || r <= .05) return; seg.set([x, y0, y1, r], ns * 4); ns++; };
      const addBall = (x: number, y: number, r: number) => { if (nb >= N || r <= .05) return; ball.set([x, y, r], nb * 3); nb++; };
      for (const d of drips) {
        addSeg(d.x, 0, d.L, d.w);
        if (d.phase === 1) { // goutte en larme : la boule descend, le col s'amincit
          const s = Math.min(d.t / d.dur, 1);
          addBall(d.x, d.L + d.r * 1.9 * s * s, d.r);
          addBall(d.x, d.L + d.r * .7 * s, d.r * .6 * (1 - s));
        } else addBall(d.x, d.L, d.r);
      }
      for (const g of drops) { // étirée par la vitesse, s'amincit après 60 % de la hauteur (sauf au-dessus d'une flaque)
        if (g.eclabousse) { addBall(g.x, g.y, g.r); continue; }
        const fin = !flaque && g.y > H * .6 ? Math.max(0, 1 - (g.y - H * .6) / (H * .38)) : 1;
        const r = g.r * fin, etire = Math.min(g.v * .014, r * 2.2);
        addSeg(g.x, g.y - etire, g.y, r * .75);
        addBall(g.x, g.y, r);
      }
      gl.uniform2f(uRes, W, H); gl.uniform1f(uDpr, dpr); gl.uniform1f(uT, t);
      gl.uniform1i(uNs, ns); gl.uniform1i(uNb, nb);
      gl.uniform4fv(uSeg, seg); gl.uniform3fv(uBall, ball);
      pool.fill(0); bosses.forEach((b, k) => pool.set([b.x, b.h, b.w], k * 3));
      gl.uniform1f(uPy, py); gl.uniform3fv(uPool, pool);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    taille();
    if (reduit) { rendu(0); return; }

    let raf = 0, last = 0, temps = 0, visible = true, perdu = false;
    const frame = (now: number) => {
      raf = 0;
      if (perdu || !visible || document.hidden) return;
      if (W < 640 && now - last < 32) { raf = requestAnimationFrame(frame); return; } // ~30 fps sur téléphone
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now; temps += dt;
      pas(dt); rendu(temps);
      raf = requestAnimationFrame(frame);
    };
    const relance = () => { if (!raf && visible && !document.hidden && !perdu) { last = 0; raf = requestAnimationFrame(frame); } };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; relance(); });
    io.observe(cv);
    document.addEventListener("visibilitychange", relance);
    let tm = 0;
    const onResize = () => {
      clearTimeout(tm);
      tm = window.setTimeout(() => {
        if (cv.clientWidth === W && Math.abs(cv.clientHeight - H) < 160) return; // barre d'adresse mobile
        taille();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    const onLost = (e: Event) => { e.preventDefault(); perdu = true; cv.style.display = "none"; };
    cv.addEventListener("webglcontextlost", onLost);
    relance();

    return () => {
      cancelAnimationFrame(raf); clearTimeout(tm); io.disconnect();
      document.removeEventListener("visibilitychange", relance);
      window.removeEventListener("resize", onResize);
      cv.removeEventListener("webglcontextlost", onLost);
    };
  }, [flaque]);

  return (
    <>
      {/* Bande de secours si WebGL est indisponible (recouverte par le rendu sinon). */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] block h-2 bg-blood" />
      <canvas ref={ref} aria-hidden="true" className={`pointer-events-none z-[1] block w-full ${className ?? "absolute inset-x-0 top-0 h-[70svh]"}`} />
    </>
  );
}
