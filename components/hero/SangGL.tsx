"use client";

import { useEffect, useRef } from "react";
import { programmeSang } from "@/components/sang/gl";

// Sang qui suinte du haut du hero, rendu en WebGL (metaballs) : bande, coulures qui gonflent,
// goutte qui s'étire, se détache et tombe. Simulation minuscule côté JS, tout le rendu dans le shader.

type Drip = { x: number; w: number; L: number; Lmin: number; Lmax: number; r: number; rMin: number; rMax: number; phase: number; t: number; dur: number; fil: number; finFil: number };
type Drop = { x: number; y: number; v: number; r: number; vx?: number; eclabousse?: boolean; wob?: number };
type Nappe = { x: number; r: number; t: number; dur: number };
type Bosse = { x: number; h: number; ht: number; w: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lisse = (p: number) => p * p * (3 - 2 * p);

// flaque : les gouttes tombent jusqu'en bas et nourrissent une flaque. className remplace le placement du canvas.
// coulees : pas de bande en haut, des filets continus entrent par le bord haut (le sang descendu de la page).
export default function SangGL({ className, flaque = false, coulees = false }: { className?: string; flaque?: boolean; coulees?: boolean }) {
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
    gl.uniform1f(U("u_noband"), coulees ? 1 : 0);

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, drips: Drip[] = [], drops: Drop[] = [], bosses: Bosse[] = [], nappes: Nappe[] = [], py = 0, hMax = 0, wMax = 0;
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
      d.Lmax = coulees ? d.Lmin + rnd(H * .05, H * .12) : rnd(H * .16, H * .42); d.rMax = rnd(d.w * 2, d.w * 2.8);
      d.phase = 0; d.t = 0; d.dur = coulees ? rnd(2, 4) : rnd(1.8, 3.6);
      if (premiere) { d.phase = 3; d.dur = rnd(0, 1.2); }
    };
    const taille = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, W < 640 ? 1 : 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      const n = coulees ? (W < 640 ? 4 : 5) : W < 640 ? 6 : 8;
      // Espacement irrégulier : des écarts tirés au hasard (certains serrés, d'autres larges), puis remis à l'échelle.
      const ecarts = Array.from({ length: n + 1 }, () => (Math.random() < .3 ? rnd(.25, .5) : rnd(.8, 1.7)));
      const somme = ecarts.reduce((a, b) => a + b, 0);
      let cumul = 0;
      drips = Array.from({ length: n }, (_, k) => {
        cumul += ecarts[k];
        const w = coulees ? rnd(3, 6) : Math.random() < .25 ? rnd(6.5, 9) : rnd(3, 6);
        const d: Drip = { x: (cumul / somme) * W, w, L: 0, Lmin: coulees ? rnd(H * .28, H * .5) : rnd(H * .04, H * .12), Lmax: 0, r: 0, rMin: w * 1.35, rMax: 0, phase: 3, t: 0, dur: 0, fil: 0, finFil: 0 };
        d.L = d.Lmin; d.r = d.rMin; nouvelleCoulee(d, true);
        if (reduit) { d.L = coulees ? rnd(H * .3, H * .55) : rnd(H * .08, H * .22); d.r = d.w * 2.4; }
        return d;
      });
      drops = []; bosses = [];
      // Deux nappes lentes qui épaississent la bande par endroits puis se résorbent.
      nappes = flaque ? [] : Array.from({ length: 2 }, () => ({ x: rnd(.1, .9) * W, r: 0, t: rnd(0, 8), dur: rnd(9, 14) }));
      py = flaque ? H - 10 : 0; hMax = W < 640 ? 14 : 22; wMax = W * .12;
      // La flaque existe déjà un peu au départ, puis grossit avec chaque goutte.
      if (flaque) bosses = drips.slice(0, 8).map((d) => ({ x: d.x, h: reduit ? 10 : 5, ht: reduit ? 10 : 5, w: W * .07 }));
    };

    const pas = (dt: number) => {
      for (const d of drips) {
        d.t += dt;
        const p = Math.min(d.t / d.dur, 1);
        if (d.phase === 0) { // gonfle et s'allonge lentement (liquide visqueux)
          const e = lisse(p); d.L = d.Lmin + (d.Lmax - d.Lmin) * e; d.r = d.rMin + (d.rMax - d.rMin) * e;
          if (p >= 1) { d.phase = 1; d.t = 0; d.dur = rnd(.25, .45); }
        } else if (d.phase === 1) { // la perle descend, un fil fin la retient encore
          d.fil = d.r * (1.2 + 2.6 * p * p);
          if (p >= 1) { // le fil casse : la goutte part, le fil remonte
            drops.push({ x: d.x, y: d.L + d.fil, v: 120, r: d.r * .92, wob: 1 });
            d.finFil = d.fil; d.phase = 2; d.t = 0; d.dur = .9;
          }
        } else if (d.phase === 2) { // le fil se rétracte avec un petit rebond, la coulée se raccourcit
          const e = 1 - (1 - p) * (1 - p);
          d.fil = d.finFil * (1 - e) * (1 - e);
          d.L = d.Lmax + (d.Lmin - d.Lmax) * e - d.w * 1.4 * Math.sin(Math.PI * Math.min(1, p * 2.2)) * (1 - p);
          d.r = d.rMin * e;
          if (p >= 1) { d.phase = 3; d.t = 0; d.dur = rnd(.8, 3); d.fil = 0; }
        } else if (p >= 1) nouvelleCoulee(d);
      }
      for (const g of drops) { g.v += 1800 * dt; g.y += g.v * dt; if (g.vx) g.x += g.vx * dt; if (g.wob) g.wob = Math.max(0, g.wob - dt * 3); }
      for (const q of nappes) { q.t += dt; if (q.t >= q.dur) { q.t = 0; q.dur = rnd(9, 14); q.x = rnd(.1, .9) * W; } q.r = 15 * Math.sin(Math.PI * q.t / q.dur); }
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
      for (const q of nappes) addBall(q.x, 2, q.r);
      for (const d of drips) {
        addSeg(d.x, 0, d.L, d.w);
        // Filet continu : un renflement descend lentement le long du filet (le sang s'écoule).
        if (coulees && d.L > 20) addBall(d.x, (t * 45 + d.x * 7) % d.L, d.w * 1.3);
        if (d.phase === 1) { // perle en larme retenue par un fil fin
          const s = Math.min(d.t / d.dur, 1);
          addSeg(d.x, d.L, d.L + d.fil, d.w * .25 * (1 - .4 * s));
          addBall(d.x, d.L + d.fil, d.r);
          addBall(d.x, d.L, d.r * .75);
        } else {
          if (d.fil > .5) addSeg(d.x, d.L, d.L + d.fil, d.w * .22);
          addBall(d.x, d.L, d.r);
        }
      }
      for (const g of drops) { // larme étirée par la vitesse, petite queue ; s'amincit en fin de course (sauf au-dessus d'une flaque)
        if (g.eclabousse) { addBall(g.x, g.y, g.r); continue; }
        const fin = !flaque && g.y > H * .6 ? Math.max(0, 1 - (g.y - H * .6) / (H * .38)) : 1;
        const r = g.r * fin * (1 + .08 * Math.sin(g.y * .35) * (g.wob ?? 0)), etire = Math.min(g.v * .016, r * 2.6);
        addSeg(g.x, g.y - etire, g.y, r * .7);
        addBall(g.x, g.y, r);
        if (nb < N - 4) addBall(g.x, g.y - etire * 1.25, r * .42);
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
  }, [flaque, coulees]);

  return (
    <>
      {/* Bande de secours si WebGL est indisponible (recouverte par le rendu sinon). */}
      {!coulees && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] block h-2 bg-blood" />}
      <canvas ref={ref} aria-hidden="true" className={`pointer-events-none z-[1] block w-full ${className ?? "absolute inset-x-0 top-0 h-[70svh]"}`} />
    </>
  );
}
