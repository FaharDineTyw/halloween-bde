"use client";

import { useEffect, useRef } from "react";
import { VERT } from "@/components/sang/gl";

// Tunnel en spirale de l'affiche : anneaux concentriques enfumés qui tournent lentement.
// Rendu en demi-résolution (le flou est gratuit), pause hors écran, image fixe si mouvement réduit.
const FRAG = `
precision mediump float;
uniform vec2 u_res; uniform float u_t;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - u_res * vec2(.5, .52)) / min(u_res.x, u_res.y);
  float r = length(p), a = atan(p.y, p.x);
  // Pas de multiple non entier de l'angle : atan saute de +pi a -pi et laissait une couture horizontale.
  vec2 dir = p / max(r, 1e-4);
  float fumee = n(dir * 2.5 + vec2(r * 6. - u_t * .15)) * .6 + n(p * 9. + u_t * .05) * .4;
  float anneaux = .5 + .5 * sin(r * 34. - u_t * .55 + a + fumee * 2.2);
  float v = smoothstep(.25, .95, anneaux) * (.55 + .45 * fumee);
  v *= smoothstep(.02, .22, r); // le centre reste sombre (là où pend la clé)
  vec3 bas = vec3(.075, .071, .071), haut = vec3(.165, .149, .149);
  vec3 c = mix(bas, haut, v);
  float vig = smoothstep(1.15, .25, length((uv - .5) * vec2(1.2, 1.)));
  gl_FragColor = vec4(c * (.55 + .45 * vig), 1.);
}`;

export default function Spirale() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t");

    const taille = () => {
      cv.width = Math.max(1, Math.round(cv.clientWidth * 0.5));
      cv.height = Math.max(1, Math.round(cv.clientHeight * 0.5));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    const dessine = (t: number) => { gl.uniform2f(uRes, cv.width, cv.height); gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    taille();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { dessine(12); return; }

    let raf = 0, visible = true, t0 = performance.now(), last = 0;
    const boucle = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (innerWidth < 640 && now - last < 32) { raf = requestAnimationFrame(boucle); return; } // ~30 i/s sur téléphone
      last = now;
      dessine((now - t0) / 1000);
      raf = requestAnimationFrame(boucle);
    };
    const relance = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(boucle); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; relance(); });
    io.observe(cv);
    document.addEventListener("visibilitychange", relance);
    let tm = 0;
    const onResize = () => { clearTimeout(tm); tm = window.setTimeout(() => { taille(); if (!raf) dessine((performance.now() - t0) / 1000); }, 150); };
    window.addEventListener("resize", onResize);
    relance();
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", relance); window.removeEventListener("resize", onResize); clearTimeout(tm); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />;
}
