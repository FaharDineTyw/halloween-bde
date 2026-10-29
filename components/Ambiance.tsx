"use client";

import { useEffect, useRef } from "react";

// Fond interactif : cendres et braises qui montent, fantômes qui fuient le pointeur, brume basse.
// Un seul canvas fixe derrière le contenu, une seule boucle rAF, aucun état React par image.

type Part = { x: number; y: number; vx: number; vy: number; r: number; c: string; a: number; ph: number };
type Ghost = { x: number; y: number; vx: number; vy: number; s: number; a: number; ph: number; glow: number };
type Trace = { x: number; y: number; life: number };

const ASH = ["#8f877c", "#6f685f", "#b3a999"];
const EMBERS = ["#ff9a00", "#b3100d"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Ambiance() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1;
    let parts: Part[] = [];
    let ghosts: Ghost[] = [];
    const traces: Trace[] = [];
    const ptr = { x: -9999, y: -9999, actif: false };
    let fog: HTMLCanvasElement | null = null;
    let raf = 0, t = 0, last = 0;

    const nouvellePart = (y?: number): Part => {
      const braise = Math.random() < 0.15;
      return {
        x: rand(0, W), y: y ?? rand(0, H), vx: 0, vy: rand(-0.35, -0.12),
        r: braise ? rand(1, 2.4) : rand(0.6, 1.8),
        c: braise ? EMBERS[Math.random() < 0.6 ? 0 : 1] : ASH[(Math.random() * ASH.length) | 0],
        a: braise ? rand(0.6, 0.95) : rand(0.25, 0.55), ph: rand(0, 6.28),
      };
    };
    const nouveauFantome = (x?: number): Ghost => ({
      x: x ?? rand(0, W), y: rand(H * 0.1, H * 0.85), vx: rand(0.12, 0.3) * (Math.random() < 0.5 ? -1 : 1), vy: 0,
      s: rand(18, 34), a: rand(0.08, 0.14), ph: rand(0, 6.28), glow: 0,
    });

    // Brume : deux ellipses floues pré-rendues une seule fois.
    const rendreBrume = () => {
      const c = document.createElement("canvas");
      c.width = 600; c.height = 240;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(300, 120, 10, 300, 120, 300);
      grad.addColorStop(0, "rgba(179,169,153,0.10)");
      grad.addColorStop(1, "rgba(179,169,153,0)");
      g.fillStyle = grad;
      g.save(); g.scale(1, 0.4); g.translate(0, 180); g.fillRect(0, -180, 600, 600); g.restore();
      return c;
    };

    const taille = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = W < 640 ? 40 : 70;
      parts = Array.from({ length: n }, () => nouvellePart());
      ghosts = Array.from({ length: W < 640 ? 4 : 6 }, () => nouveauFantome());
    };

    const dessinerFantome = (g: Ghost) => {
      const { x, s } = g;
      const y = g.y + Math.sin(t * 0.0015 + g.ph) * 6;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = `rgba(239,231,218,${g.a})`;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, Math.PI, 0);
      ctx.lineTo(s * 0.5, s * 0.75);
      // ourlet ondulé
      const n = 4;
      for (let i = 0; i < n; i++) {
        const x0 = s * 0.5 - (i + 0.5) * (s / n);
        const off = Math.sin(t * 0.004 + g.ph + i) * 3;
        ctx.quadraticCurveTo(x0, s * 0.95 + off, x0 - s / (2 * n), s * 0.75);
      }
      ctx.closePath();
      ctx.fill();
      // yeux : trous noirs, rouges quand il fuit
      ctx.fillStyle = g.glow > 0.05 ? `rgba(224,27,31,${0.4 + g.glow * 0.6})` : "rgba(0,0,0,0.85)";
      ctx.beginPath();
      ctx.ellipse(-s * 0.17, -s * 0.05, s * 0.07, s * 0.11, 0, 0, Math.PI * 2);
      ctx.ellipse(s * 0.17, -s * 0.05, s * 0.07, s * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const frame = (now: number) => {
      // Téléphones : ~30 images/s suffisent.
      if (!reduit && W < 640 && now - last < 32) { raf = requestAnimationFrame(frame); return; }
      const dt = Math.min((now - last) / 16.67 || 1, 3);
      last = now; t = now;
      ctx.clearRect(0, 0, W, H);

      // brume basse
      if (fog) {
        const fx = (t * 0.008) % (W + 600);
        ctx.drawImage(fog, fx - 600, H * 0.62, W * 0.9, H * 0.4);
        ctx.drawImage(fog, W - ((t * 0.005) % (W + 600)), H * 0.72, W * 0.8, H * 0.35);
      }

      // traînée rouge du pointeur
      for (let i = traces.length - 1; i >= 0; i--) {
        const tr = traces[i];
        tr.life -= 0.02 * dt;
        if (tr.life <= 0) { traces.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(179,16,13,${tr.life * 0.12})`;
        ctx.beginPath(); ctx.arc(tr.x, tr.y, 26 * (1.4 - tr.life), 0, Math.PI * 2); ctx.fill();
      }

      // particules
      for (const p of parts) {
        p.ph += 0.01 * dt;
        let ax = Math.sin(p.ph + p.y * 0.01) * 0.01;
        if (ptr.actif) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140 && d2 > 1) {
            const d = Math.sqrt(d2), f = (1 - d / 140) * 0.6;
            ax += (dx / d) * f - (dy / d) * f * 0.6; // repousse + tourbillon
            p.vy += (dy / d) * f * 0.5;
          }
        }
        p.vx = (p.vx + ax) * 0.96;
        p.vy = p.vy * 0.98 + (-0.22 - p.vy) * 0.02;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -10 || p.x < -20 || p.x > W + 20) Object.assign(p, nouvellePart(H + 5));
        ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(p.ph * 3));
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // fantômes
      for (const g of ghosts) {
        if (ptr.actif) {
          const dx = g.x - ptr.x, dy = g.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < 120 && d > 0.5) {
            g.vx += (dx / d) * 0.5; g.vy += (dy / d) * 0.5; g.glow = 1;
          }
        }
        g.glow *= 0.97;
        const base = Math.sign(g.vx || 1) * 0.2;
        g.vx = g.vx * 0.97 + base * 0.03;
        g.vy *= 0.94;
        g.x += g.vx * dt; g.y += g.vy * dt;
        g.y = Math.max(20, Math.min(H - 20, g.y));
        if (g.x < -60) g.x = W + 50;
        if (g.x > W + 60) g.x = -50;
        dessinerFantome(g);
      }

      raf = requestAnimationFrame(frame);
    };

    const bouge = (x: number, y: number) => {
      ptr.x = x; ptr.y = y; ptr.actif = true;
      if (traces.length < 18) traces.push({ x, y, life: 1 });
    };
    const onPointer = (e: PointerEvent) => { if (e.pointerType === "mouse") bouge(e.clientX, e.clientY); };
    const onTouch = (e: TouchEvent) => { const p = e.touches[0]; if (p) bouge(p.clientX, p.clientY); };
    const onLeave = () => { ptr.actif = false; };

    let tm: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(tm); tm = setTimeout(() => {
      // La barre d'adresse mobile change seulement la hauteur : on ne régénère pas la scène.
      if (window.innerWidth === W && Math.abs(window.innerHeight - H) < 160) return;
      taille(); if (reduit) frameStatique();
    }, 200); };

    const frameStatique = () => {
      // une seule image : particules et fantômes immobiles
      last = performance.now();
      cancelAnimationFrame(raf);
      frame(last);
      cancelAnimationFrame(raf);
    };

    const onVisible = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduit) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    taille();
    fog = rendreBrume();
    window.addEventListener("resize", onResize, { passive: true });

    if (reduit) {
      frameStatique();
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchstart", onTouch, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("touchend", onLeave, { passive: true });
      document.addEventListener("visibilitychange", onVisible);
      raf = requestAnimationFrame((n) => { last = n; frame(n); });
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tm);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchstart", onTouch);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("touchend", onLeave);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 block h-full w-full" />;
}
