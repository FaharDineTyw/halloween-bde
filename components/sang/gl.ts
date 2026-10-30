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
void main(){
  vec2 p = vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
  // Bande du haut, bord légèrement ondulé.
  float hb = 9. + 1.6 * sin(p.x * .021 + u_t * .9) + 1.1 * sin(p.x * .047 - u_t * .6);
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
