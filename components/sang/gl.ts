// Rendu partagé du sang (metaballs WebGL) : hero, footer et filets des bords utilisent le même shader.

export const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

export const frag = (NS: number, NB: number) => `
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
uniform float u_noband; // 1 = pas de bande du haut (filets des bords)
uniform float u_py; uniform vec3 u_pool[8]; // flaque : ligne de base, bosses (x, hauteur, largeur)
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 q) {
  vec2 i = floor(q), u = fract(q); u = u * u * (3. - 2. * u);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y);
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
  // Bande du haut : bord irrégulier (ondulation lente + bruit), comme une nappe qui coule.
  float hb = 9. + 1.6 * sin(p.x * .021 + u_t * .9) + 1.1 * sin(p.x * .047 - u_t * .6) + 3.2 * (vnoise(vec2(p.x * .045, u_t * .15)) - .5);
  float yb = max(p.y, .5);
  float f = u_noband > .5 ? 0. : hb * hb / (yb * yb);
  vec2 g = vec2(0., u_noband > .5 ? 0. : -2. * hb * hb / (yb * yb * yb));
  if (u_py > 0.) { // flaque : lentille plate posée sur la ligne u_py, plus épaisse au-dessus
    float hp = 0.;
    for (int i = 0; i < 8; i++) { vec3 q = u_pool[i]; float dx = (p.x - q.x) / max(q.z, 1.); hp += q.y * exp(-dx * dx); }
    if (hp > .05) {
      float dy = p.y - u_py, d = max(dy < 0. ? -dy : dy * 3., .5), hh = hp * hp;
      f += hh / (d * d); g.y += (dy < 0. ? 2. : -6.) * hh / (d * d * d);
    }
  }
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
  // Seuil perturbé par un bruit lent (±6 %) : contours organiques, pas des cercles parfaits.
  float nz = .6 * vnoise(p * .07 + vec2(0., u_t * .12)) + .4 * vnoise(p * .19 - vec2(u_t * .08, 0.));
  float t = 1. + (nz - .5) * .12;
  // Bord anti-crénelé sur un pixel écran, à partir du gradient du champ.
  float fw = max(length(g) / u_dpr, 1e-3) * .8;
  float a = smoothstep(t - fw, t + fw, f);
  if (a <= 0.) { gl_FragColor = vec4(0.); return; }
  // Épaisseur : 0 au bord, tend vers 1 au cœur de la goutte.
  float h = clamp(1. - t / max(f, 1e-3), 0., 1.);
  h = h * (2. - h);
  // Couleur par absorption (Beer-Lambert) : bord fin rouge translucide, cœur épais lie-de-vin presque noir.
  vec3 col = vec3(.78, .075, .10) * exp(-h * vec3(1.55, 2.2, 1.9));
  // Normale de la surface : gradient de l'épaisseur (dh/df = t/f²), relief d'un liquide visqueux.
  vec2 sl = clamp(g * (t / (f * f)) * 9., -4., 4.);
  vec3 n = normalize(vec3(-sl, 1.));
  vec3 L = normalize(vec3(-.5, -.65, .6)), V = vec3(0., 0., 1.);
  col *= .72 + .38 * max(dot(n, L), 0.);
  // Ménisque : très fin liseré plus sombre au bord.
  col *= .68 + .32 * smoothstep(0., .1, h);
  // Brillance mouillée : reflet vif et petit (Blinn-Phong), bande de lumière ambiante, léger Fresnel.
  float spec = pow(max(dot(n, normalize(L + V)), 0.), 120.) * .9;
  vec3 r = reflect(-V, n);
  float env = exp(-pow((r.y + .42) / .16, 2.)) * .16;
  float fres = pow(1. - n.z, 3.) * .22;
  col += vec3(1., .9, .88) * (spec + env * (.4 + fres * 3.)) * smoothstep(.02, .2, h);
  // Les zones très fines laissent un peu passer le fond.
  float alpha = a * mix(.8, 1., smoothstep(0., .25, h));
  gl_FragColor = vec4(col * alpha, alpha);
}`;


// Compile le programme, pose le triangle plein écran. null si WebGL refuse (le composant n'affiche rien).
export function programmeSang(gl: WebGLRenderingContext) {
  const max = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number;
  const N = Math.max(8, Math.min(24, Math.floor((max - 18) / 2)));
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag(N, N)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  return { N, U: (n: string) => gl.getUniformLocation(prog, n) };
}
