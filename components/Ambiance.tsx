"use client";

import { useEffect, useRef } from "react";

// Atmosphère : brume volumétrique en WebGL (fbm à domaine déformé, remuée par le pointeur, ampoule
// qui faiblit de temps en temps) + braises réalistes (traînées de mouvement, lueur, scintillement).
// Calque fixe derrière le contenu, une seule boucle rAF, aucun état React par image.

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
const FRAG = `precision mediump float;
uniform vec2 u_res; uniform float u_t; uniform vec2 u_ptr; uniform float u_force; uniform float u_dim; uniform float u_scale;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
void main(){
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / u_res;
  vec2 p = px / u_res.y * 2.2;
  // Le pointeur remue la brume : tourbillon local qui s'atténue avec la distance.
  vec2 d = px - u_ptr; float fall = exp(-dot(d, d) / pow(180. * u_scale, 2.));
  float ang = u_force * fall * 2.4; float c = cos(ang), s = sin(ang);
  vec2 cen = u_ptr / u_res.y * 2.2;
  p = cen + mat2(c, -s, s, c) * (p - cen) + normalize(d + .0001) * fall * u_force * .25;
  float t = u_t;
  vec2 q = vec2(fbm(p + vec2(0., -t * .035)), fbm(p + vec2(5.2, 1.3) + vec2(t * .02, -t * .03)));
  float f = fbm(p + 1.8 * q + vec2(t * .012, -t * .045));
  // Plus dense en bas et sur les bords, presque rien au centre-haut pour garder le texte lisible.
  float bas = 1. - smoothstep(0., .75, uv.y);
  float bords = smoothstep(.25, .0, uv.x) + smoothstep(.75, 1., uv.x);
  float dens = smoothstep(.35, .85, f) * (.35 + .9 * bas + .45 * bords);
  float vig = 1. - .35 * smoothstep(.45, .95, length(uv - .5) * 1.25 + .05 * sin(t * .2));
  vec3 col = mix(vec3(.165, .039, .031), vec3(.353, .102, .078), smoothstep(.4, .9, f));
  float a = clamp(dens * .42, 0., .35) * u_dim * vig;
  gl_FragColor = vec4(col * a, a);
}`;

type Braise = { x: number; y: number; vx: number; vy: number; vie: number; max: number; t: number; ph: number };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Ambiance() {
  const fogRef = useRef<HTMLCanvasElement>(null);
  const braisesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = fogRef.current, cb = braisesRef.current;
    const ctx = cb?.getContext("2d");
    if (!cv || !cb || !ctx) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Brume (WebGL, demi-résolution : la brume est floue, autant ne pas payer les pixels) ---
    let gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false }) as WebGLRenderingContext | null;
    let u: Record<string, WebGLUniformLocation | null> = {};
    const prepare = () => {
      if (!gl) return;
      const sh = (type: number, src: string) => { const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s); return gl!.getShaderParameter(s, gl!.COMPILE_STATUS) ? s : null; };
      const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) { gl = null; return; }
      const pr = gl.createProgram()!; gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { gl = null; return; }
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const k of ["u_res", "u_t", "u_ptr", "u_force", "u_dim", "u_scale"]) u[k] = gl.getUniformLocation(pr, k);
    };
    prepare();
    const onLost = (e: Event) => { e.preventDefault(); gl = null; cv.style.display = "none"; };
    cv.addEventListener("webglcontextlost", onLost);

    // --- Braises (2D, pleine résolution : elles sont fines) ---
    const sprite = document.createElement("canvas"); sprite.width = sprite.height = 32;
    const sg = sprite.getContext("2d")!;
    const grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,226,170,1)"); grad.addColorStop(.18, "rgba(255,154,0,.95)");
    grad.addColorStop(.45, "rgba(179,16,13,.45)"); grad.addColorStop(1, "rgba(92,6,5,0)");
    sg.fillStyle = grad; sg.fillRect(0, 0, 32, 32);

    let W = 0, H = 0, dpr = 1, fw = 0, fh = 0;
    let braises: Braise[] = [];
    const nouvelle = (bas = true): Braise => ({
      x: rand(0, W), y: bas ? H + rand(0, H * .3) : rand(0, H), vx: rand(-12, 12), vy: rand(-55, -25),
      vie: 0, max: rand(5, 11), t: rand(.7, 1.6), ph: rand(0, 6.28),
    });
    const taille = () => {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cb.width = Math.round(W * dpr); cb.height = Math.round(H * dpr);
      fw = Math.max(1, Math.round(W * .5)); fh = Math.max(1, Math.round(H * .5));
      cv.width = fw; cv.height = fh;
      gl?.viewport(0, 0, fw, fh);
      braises = Array.from({ length: W < 640 ? 12 : 25 }, () => nouvelle(false));
    };
    taille();

    // Pointeur : position (en px de la brume, y vers le haut) et force qui retombe.
    const ptr = { x: -9999, y: -9999, f: 0, lx: 0, ly: 0, lt: 0 };
    const bouge = (x: number, y: number) => {
      const now = performance.now(), dt = Math.max(16, now - ptr.lt);
      const v = Math.hypot(x - ptr.lx, y - ptr.ly) / dt * 1000;
      ptr.f = Math.min(1, ptr.f + v / 2500); ptr.lx = x; ptr.ly = y; ptr.lt = now;
      ptr.x = x; ptr.y = y;
    };
    const onPointer = (e: PointerEvent) => bouge(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) bouge(t.clientX, t.clientY); };

    // Ampoule qui faiblit : 1 ou 2 baisses brèves toutes les 6–14 s (bien sous 3 éclats/s, WCAG 2.3.1).
    let prochaine = rand(6, 14), baisses: [number, number][] = [];
    const dimA = (t: number) => {
      if (t > prochaine) {
        const n = Math.random() < .5 ? 1 : 2; baisses = [];
        for (let i = 0; i < n; i++) { const d = t + i * rand(.35, .5); baisses.push([d, d + rand(.06, .12)]); }
        prochaine = t + rand(6, 14);
      }
      return baisses.some(([a, b]) => t >= a && t <= b) ? .45 : 1;
    };

    const dessine = (t: number, dt: number) => {
      // Brume
      if (gl) {
        ptr.f *= Math.exp(-dt * 2.2);
        gl.uniform2f(u.u_res, fw, fh); gl.uniform1f(u.u_t, t);
        gl.uniform2f(u.u_ptr, ptr.x * .5, fh - ptr.y * .5); gl.uniform1f(u.u_force, ptr.f);
        gl.uniform1f(u.u_dim, reduit ? 1 : dimA(t)); gl.uniform1f(u.u_scale, .5);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      // Braises : montent dans la turbulence, s'étirent dans le sens du mouvement, scintillent.
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cb.width, cb.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < braises.length; i++) {
        const b = braises[i];
        if (dt > 0) {
          const tx = Math.sin(b.y * .011 + t * .7 + b.ph) * 22 + Math.sin(b.x * .007 - t * .4) * 12;
          b.vx += (tx - b.vx) * Math.min(1, dt * 1.5);
          const dx = b.x - ptr.x, dy = b.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 22500) { const k = (1 - d2 / 22500) * 260 * dt; b.vx += dx / 150 * k * 3; b.vy += dy / 150 * k * 3; }
          b.vy += (-40 - b.vy) * Math.min(1, dt * .8);
          b.x += b.vx * dt; b.y += b.vy * dt; b.vie += dt;
          if (b.vie > b.max || b.y < -30 || b.x < -30 || b.x > W + 30) braises[i] = nouvelle();
        }
        const vieN = b.vie / b.max;
        const fondu = Math.min(1, b.vie * 2) * (1 - Math.max(0, (vieN - .75) / .25));
        const scint = .65 + .35 * Math.sin(t * 9 * b.t + b.ph) * Math.sin(t * 3.3 + b.ph * 2);
        const v = Math.hypot(b.vx, b.vy) || 1;
        const etire = 1 + Math.min(3, v / 22);
        const s = (W < 640 ? 4.5 : 5.5) * b.t * dpr;
        ctx.globalAlpha = Math.max(0, fondu * scint);
        ctx.setTransform(1, 0, 0, 1, b.x * dpr, b.y * dpr);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.drawImage(sprite, -s * etire * .75, -s / 2, s * etire, s);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    };

    if (reduit) { dessine(4, 0); return () => cv.removeEventListener("webglcontextlost", onLost); }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    let raf = 0, last = 0, temps = 0;
    const frame = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      if (W < 640 && last && now - last < 32) { raf = requestAnimationFrame(frame); return; } // ~30 fps sur téléphone
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now; temps += dt;
      dessine(temps, dt);
      raf = requestAnimationFrame(frame);
    };
    const relance = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    document.addEventListener("visibilitychange", relance);
    let tm = 0, lw = W, lh = H;
    const onResize = () => {
      clearTimeout(tm);
      tm = window.setTimeout(() => {
        // La barre d'adresse mobile qui apparaît/disparaît ne doit pas tout régénérer.
        if (window.innerWidth === lw && Math.abs(window.innerHeight - lh) < 160) return;
        lw = window.innerWidth; lh = window.innerHeight; taille();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    relance();

    return () => {
      cancelAnimationFrame(raf); clearTimeout(tm);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", relance);
      cv.removeEventListener("webglcontextlost", onLost);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <canvas ref={fogRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={braisesRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
