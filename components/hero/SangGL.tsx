"use client";

import { useEffect, useRef } from "react";

// Sang qui suinte du haut du hero, rendu en WebGL (metaballs) : bande, coulures qui gonflent,
// goutte qui s'étire, se détache et tombe. Simulation minuscule côté JS, tout le rendu dans le shader.

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const frag = (NS: number, NB: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define NS ${NS}
#define NB ${NB}
uniform vec2 u_res; uniform float u_dpr, u_t; uniform int u_ns, u_nb;
uniform vec4 u_seg[NS]; // capsules verticales : x, y haut, y bas, rayon
uniform vec3 u_ball[NB]; // boules : x, y, rayon
void main(){
  vec2 p = vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
  // Bande du haut, bord légèrement ondulé.
  float hb = 9. + 1.6 * sin(p.x * .021 + u_t * .9) + 1.1 * sin(p.x * .047 - u_t * .6);
  float yb = max(p.y, .5);
  float f = hb * hb / (yb * yb);
  vec2 g = vec2(0., -2. * hb * hb / (yb * yb * yb));
  for (int i = 0; i < NS; i++) {
    if (i >= u_ns) break;
    vec4 s = u_seg[i];
    vec2 d = p - vec2(s.x, clamp(p.y, s.y, s.z));
    float d2 = clamp(dot(d, d), .25, 60000.), r2 = s.w * s.w;
    f += r2 / d2; g += -2. * r2 * d / (d2 * d2);
  }
  for (int i = 0; i < NB; i++) {
    if (i >= u_nb) break;
    vec3 b = u_ball[i];
    vec2 d = p - b.xy;
    float d2 = clamp(dot(d, d), .25, 60000.), r2 = b.z * b.z;
    f += r2 / d2; g += -2. * r2 * d / (d2 * d2);
  }
  float a = smoothstep(.86, 1.14, f);
  if (a <= 0.) { gl_FragColor = vec4(0.); return; }
  // Normale approchée par le gradient du champ : relief brillant de liquide.
  vec2 sl = clamp(g / f * 4., -3., 3.);
  vec3 n = normalize(vec3(-sl, 1.));
  vec3 L = normalize(vec3(-.45, -.6, .7));
  float dif = max(dot(n, L), 0.);
  float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 28.);
  vec3 deep = vec3(.361, .024, .020), blood = vec3(.702, .063, .051), hi = vec3(.878, .188, .165);
  vec3 col = mix(deep, blood, smoothstep(1., 2.6, f)) * (.55 + .6 * dif) + hi * spec * .9 + vec3(spec * spec * .25);
  gl_FragColor = vec4(col * a, a);
}`;

type Drip = { x: number; w: number; L: number; Lmin: number; Lmax: number; r: number; rMin: number; rMax: number; phase: number; t: number; dur: number };
type Drop = { x: number; y: number; v: number; r: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lisse = (p: number) => p * p * (3 - 2 * p);

export default function SangGL() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) { cv.style.display = "none"; return; }

    const max = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number;
    const N = Math.max(8, Math.min(24, Math.floor((max - 8) / 2)));
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag(N, N)));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.style.display = "none"; return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("u_res"), uDpr = U("u_dpr"), uT = U("u_t"), uNs = U("u_ns"), uNb = U("u_nb"), uSeg = U("u_seg"), uBall = U("u_ball");
    const seg = new Float32Array(N * 4), ball = new Float32Array(N * 3);

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, drips: Drip[] = [], drops: Drop[] = [];

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
      drops = [];
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
      for (const g of drops) { g.v += 1800 * dt; g.y += g.v * dt; }
      drops = drops.filter((g) => g.y < H + 40 && g.y < H * .98);
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
      for (const g of drops) { // étirée par la vitesse, s'amincit après 60 % de la hauteur
        const fin = g.y > H * .6 ? Math.max(0, 1 - (g.y - H * .6) / (H * .38)) : 1;
        const r = g.r * fin, etire = Math.min(g.v * .014, r * 2.2);
        addSeg(g.x, g.y - etire, g.y, r * .75);
        addBall(g.x, g.y, r);
      }
      gl.uniform2f(uRes, W, H); gl.uniform1f(uDpr, dpr); gl.uniform1f(uT, t);
      gl.uniform1i(uNs, ns); gl.uniform1i(uNb, nb);
      gl.uniform4fv(uSeg, seg); gl.uniform3fv(uBall, ball);
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
  }, []);

  return (
    <>
      {/* Bande de secours si WebGL est indisponible (recouverte par le rendu sinon). */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] block h-2 bg-blood" />
      <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] block h-[70svh] w-full" />
    </>
  );
}
