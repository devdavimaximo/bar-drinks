/**
 * O drink, todo num quad de tela. Uma taça de vidro fino sobre um balcão de pedra
 * escura, num bar à noite (bokeh ao fundo, contraluz quente, duas softboxes).
 *
 *   - bojo da taça: esfera cortada, ANALÍTICA. É casca fina: o que importa é o
 *     Fresnel, o reflexo das softboxes e a lente nas bordas, não a espessura
 *   - pé e haste: SDF de vidro maciço, refrata o fundo
 *   - líquido: esfera interna ∩ semiespaço do nível (com ondas). O raio refrata na
 *     entrada, atravessa o volume (absorção de Beer-Lambert em duas camadas, bolhas,
 *     turbidez), acha gelo e guarnição lá dentro e refrata de novo na saída
 *   - gelo, rodela, raminho, frutinhas e o fio de bebida caindo: SDF
 *   - condensação: gotas (lentes) e névoa só abaixo do nível, onde o vidro está gelado
 *   - no balcão: sombra de vidro (anel) e a cáustica colorida que a bebida projeta
 *
 * Tudo que gira com a taça vive em "espaço do objeto" (uSpin). O fundo é do mundo.
 * Laços começam em ZERO (uniform) para o compilador D3D não desenrolar tudo.
 */

export const vertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const fragment = (lite: boolean) => /* glsl */ `
  precision highp float;

  #define STEPS ${lite ? 72 : 110}
  #define IN_STEPS ${lite ? 14 : 22}
  #define BUB ${lite ? 5 : 8}
  #define PI 3.14159265
  #define TH 0.012
  #define CY uGlass.x
  #define RB uGlass.y
  #define HC uGlass.z
  #define RI (uGlass.y - TH)

  uniform vec2 uRes;
  uniform float uTime;
  uniform vec3 uRo;
  uniform vec3 uTa;
  uniform float uFocal;
  uniform float uSpin;
  uniform vec3 uL;
  uniform float uExpo;
  uniform float uVig;

  uniform vec3 uGlass;     // centro do bojo (y), raio, corte relativo ao centro
  uniform float uLevel;
  uniform float uWave;
  uniform vec3 uTop;       // absorção da camada de cima
  uniform vec3 uBot;       // absorção do fundo
  uniform float uMixH;
  uniform float uCloud;
  uniform float uFoam;
  uniform float uBubbles;
  uniform vec4 uIce[3];    // centro + visível
  uniform vec3 uIceRot;
  uniform vec4 uWheel;     // centro + raio (0 = sem rodela)
  uniform vec3 uWheelN;
  uniform vec3 uPulp;
  uniform vec3 uRind;
  uniform vec4 uSprig;     // base + visível
  uniform vec3 uSprigAx;   // direção × comprimento
  uniform vec3 uSprigCol;
  uniform vec4 uBerry;     // progresso, raio, raio do anel, -
  uniform vec3 uBerryCol;
  uniform float uStream;
  uniform vec3 uStreamSig;
  uniform float uCond;

  uniform int uZero;
  uniform sampler2D uNoise;
  #define ZERO uZero

  /* ---------- ruído ---------- */

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv = (p.xy + vec2(37.0, 239.0) * p.z) + f.xy;
    vec2 rg = textureLod(uNoise, (uv + 0.5) / 256.0, 0.0).yx;
    return mix(rg.x, rg.y, f.z);
  }
  vec2 hash2(vec2 c) {
    return textureLod(uNoise, (c * vec2(1.0, 3.0) + 0.5) / 256.0, 0.0).xy;
  }

  /* ---------- espaços ---------- */

  vec3 toObj(vec3 v) { float c = cos(uSpin), s = sin(uSpin); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
  vec3 toWorld(vec3 v) { float c = cos(uSpin), s = sin(uSpin); return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z); }
  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }
  float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
  }
  vec2 sphIt(vec3 ro, vec3 rd, vec3 c, float r) {
    vec3 oc = ro - c;
    float b = dot(oc, rd);
    float h = b * b - dot(oc, oc) + r * r;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
  }
  vec2 boxIt(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax) {
    vec3 inv = 1.0 / rd;
    vec3 t0 = (bmin - ro) * inv;
    vec3 t1 = (bmax - ro) * inv;
    vec3 tn = min(t0, t1);
    vec3 tf = max(t0, t1);
    return vec2(max(max(tn.x, tn.y), tn.z), min(min(tf.x, tf.y), tf.z));
  }

  /* ---------- o bar: fundo, balcão, reflexos ---------- */

  // luzes desfocadas do salão, numa faixa à altura dos olhos
  vec3 bokeh(vec3 rd) {
    float az = atan(rd.x, -rd.z);
    float el = rd.y;
    vec3 c = vec3(0.0);
    float band = smoothstep(-0.12, 0.04, el) * (1.0 - smoothstep(0.16, 0.42, el));
    if (band <= 0.0) return c;
    for (int l = ZERO; l < 2; l++) {
      float fl = float(l);
      float sc = l == 0 ? 7.0 : 13.0;
      vec2 uv = vec2(az * sc, el * sc * 1.3 + fl * 3.1);
      vec2 id = floor(uv);
      vec2 f = fract(uv) - 0.5;
      vec2 h = hash2(id + fl * 17.0 + 3.0);
      vec2 o = (h - 0.5) * 0.5;
      float r = 0.09 + 0.15 * h.y;
      float d = length(f - o);
      float disc = 1.0 - smoothstep(r - 0.03, r, d);
      disc *= 0.7 + 0.45 * smoothstep(r - 0.06, r - 0.015, d);
      float on = step(0.6, h.x);
      float pick = fract(h.x * 7.13 + h.y * 3.7);
      vec3 col = pick < 0.5 ? vec3(1.0, 0.76, 0.46) : pick < 0.74 ? vec3(1.0, 0.9, 0.76) : pick < 0.9 ? vec3(0.95, 0.4, 0.55) : vec3(0.34, 0.62, 0.54);
      c += col * disc * on * (l == 0 ? 0.11 : 0.06) * (0.4 + h.y);
    }
    return c * band;
  }

  vec3 wall(vec3 rd) {
    vec3 g = mix(vec3(0.004, 0.007, 0.006), vec3(0.008, 0.013, 0.011), smoothstep(-0.25, 0.45, rd.y));
    // o halo quente do contraluz, atrás da taça
    float hl = max(dot(rd, normalize(vec3(0.12, 0.2, -1.0))), 0.0);
    g += vec3(0.17, 0.13, 0.09) * pow(hl, 70.0) + vec3(0.014, 0.011, 0.008) * pow(hl, 12.0);
    return g + bokeh(rd);
  }

  // estúdio para os reflexos: duas softboxes altas atrás da câmera e uma no teto
  vec3 envR(vec3 r) {
    vec3 c = wall(r) * 0.85;
    float az = atan(r.x, r.z);
    float s1 = (1.0 - smoothstep(0.05, 0.11, abs(az - 0.78))) * smoothstep(-0.38, -0.18, r.y) * (1.0 - smoothstep(0.55, 0.75, r.y));
    float s2 = (1.0 - smoothstep(0.03, 0.07, abs(az + 0.98))) * smoothstep(-0.25, -0.05, r.y) * (1.0 - smoothstep(0.45, 0.62, r.y));
    c += vec3(1.0, 0.96, 0.9) * s1 * 2.4 + vec3(0.9, 0.94, 1.0) * s2 * 1.3;
    c += vec3(0.9, 0.84, 0.76) * smoothstep(0.86, 0.98, r.y) * 0.55;
    c += vec3(1.0, 0.88, 0.7) * pow(max(dot(r, uL), 0.0), 36.0) * 5.0;
    return c;
  }

  vec3 counter(vec3 p, vec3 rd) {
    // pedra preta acetinada: só uma variação larga de tom e o reflexo borrado do salão
    vec3 base = vec3(0.007, 0.009, 0.008) * (0.8 + 0.4 * noise(p * vec3(0.8, 1.0, 1.6)));
    vec3 rr = reflect(rd, vec3(0.0, 1.0, 0.0));
    float fre = 0.04 + 0.96 * pow(1.0 - abs(rd.y), 5.0);
    vec3 col = base + wall(rr) * fre * 0.4 + envR(rr) * fre * 0.05;

    // poça de luz em volta da taça
    float r = length(p.xz);
    col += vec3(0.034, 0.028, 0.021) * exp(-r * r * 0.45);

    // a taça diante da luz: anel de sombra do vidro e, no meio, a cáustica da bebida
    vec3 c = vec3(0.0, CY, 0.0);
    vec3 cp = c - p;
    float along = dot(cp, uL);
    vec3 closest = p + uL * along;
    float k = length(closest - c) / RB;
    float ring = smoothstep(0.55, 0.95, k) * (1.0 - smoothstep(0.95, 1.12, k));
    col *= 1.0 - 0.4 * ring - 0.15 * (1.0 - smoothstep(0.9, 1.1, k));
    bool liquid = uLevel > CY - RI + 0.004;
    if (liquid && k < 1.0) {
      float wet = 1.0 - smoothstep(uLevel - 0.08, uLevel + 0.04, closest.y);
      vec3 T = exp(-mix(uTop, uBot, 0.35) * 0.45);
      vec3 q = toObj(p);
      float rip = noise(vec3(q.xz * 7.0, uTime * 0.35)) * noise(vec3(q.xz * 13.0 + 4.0, uTime * 0.5));
      float focus = exp(-k * k * 2.6);
      col += T * wet * focus * (0.12 + 0.9 * rip * rip * 4.0) * 0.28 * (1.0 - uCloud * 0.5);
    }
    // sombra de contato do pé
    col *= 0.55 + 0.45 * smoothstep(0.38, 0.62, r);
    // o balcão some no escuro lá atrás
    float fade = smoothstep(-2.6, -1.4, p.z) * (1.0 - smoothstep(3.0, 6.0, length(p.xz)));
    return mix(wall(rd), col, fade);
  }

  vec3 background(vec3 ro, vec3 rd) {
    if (rd.y < -0.001) {
      float t = -ro.y / rd.y;
      vec3 p = ro + rd * t;
      if (p.z > -2.6) return counter(p, rd);
    }
    return wall(rd);
  }

  /* ---------- peças (espaço do objeto) ---------- */

  float sdStem(vec3 q) {
    float top = CY - RB + 0.03;
    float r = length(q.xz);
    vec2 d = vec2(r - 0.44, abs(q.y - 0.016) - 0.011);
    float foot = min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.006;
    float rs = 0.022 + 0.05 * exp(-q.y * 16.0) + 0.035 * exp(-(top - q.y) * 13.0);
    float stem = max(r - rs, max(-q.y, q.y - top)) * 0.8;
    return smin(foot, stem, 0.03);
  }

  float surf(vec3 q) {
    float rr = length(q.xz);
    return uLevel
      + uWave * 0.011 * sin(rr * 24.0 - uTime * 7.0) * exp(-rr * 2.0)
      + uWave * 0.005 * sin(q.x * 13.0 + uTime * 3.1) * sin(q.z * 11.0 - uTime * 2.3);
  }

  float sdLiquid(vec3 q) {
    if (uLevel < CY - RI + 0.004) return 1e3;
    return max(length(q - vec3(0.0, CY, 0.0)) - (RI - 0.0015), (q.y - surf(q)) * 0.9);
  }

  vec3 iceLocal(vec3 q, int i) {
    float fi = float(i);
    vec3 u = q - uIce[i].xyz;
    u = rotY(u, 0.6 + 1.7 * fi + uIceRot[i]);
    return rotX(u, 0.25 + 0.35 * fi + uIceRot[i] * 0.6);
  }
  float sdIce(vec3 q) {
    float d = 1e3;
    for (int i = ZERO; i < 3; i++) {
      if (uIce[i].w < 0.5) continue;
      d = min(d, sdRoundBox(iceLocal(q, i), vec3(0.105), 0.03));
    }
    return d;
  }

  float sdWheel(vec3 q) {
    if (uWheel.w <= 0.0) return 1e3;
    vec3 u = q - uWheel.xyz;
    float k = dot(u, uWheelN);
    vec2 d = vec2(length(u - uWheelN * k) - uWheel.w, abs(k) - 0.008);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.004;
  }

  // alecrim: haste e agulhas em espiral (só a parte de cima, a de baixo foi desfolhada)
  float sdSprig(vec3 q) {
    if (uSprig.w < 0.5) return 1e3;
    vec3 u = q - uSprig.xyz;
    float L = length(uSprigAx);
    vec3 ax = uSprigAx / L;
    float s0 = dot(u, ax);
    float stem = length(u - ax * clamp(s0, 0.0, L)) - 0.007;
    if (stem > 0.1) return stem - 0.08;
    vec3 b1 = normalize(cross(ax, vec3(0.0, 0.0, 1.0)));
    vec3 b2 = cross(ax, b1);
    float sp = 0.04;
    float d = stem;
    for (int j = ZERO; j < 2; j++) {
      float k = clamp(floor(s0 / sp) + float(j), 0.0, floor(L / sp));
      float sa = k * sp;
      if (sa < L * 0.38) continue;
      float ang = k * 2.39996;
      float taper = 1.0 - 0.55 * smoothstep(L * 0.75, L, sa);
      for (int m = ZERO; m < 2; m++) {
        float a2 = ang + float(m) * PI;
        vec3 dir = normalize(cos(a2) * b1 + sin(a2) * b2 + ax * 0.6);
        vec3 a = ax * sa;
        vec3 ba = dir * 0.078 * taper;
        vec3 pa = u - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        d = min(d, length(pa - ba * h) - 0.0068 * (1.0 - h * 0.45));
      }
    }
    return d;
  }

  vec4 berryAt(int i) {
    float fi = float(i);
    float t = clamp((uBerry.x - fi * 0.11) / 0.45, 0.0, 1.0);
    if (t <= 0.0) return vec4(0.0, -9.0, 0.0, 0.0);
    float a = fi * 2.4 + 0.7;
    float rr = uBerry.z * (0.35 + 0.65 * fract(fi * 0.618 + 0.2));
    float sz = uBerry.y * (0.85 + 0.3 * fract(fi * 0.37));
    float drop = (1.0 - t) * (1.0 - t);
    return vec4(cos(a) * rr, uLevel + sz * 0.35 + drop * 1.3, sin(a) * rr, sz);
  }
  float sdBerries(vec3 q) {
    if (uBerry.x <= 0.0) return 1e3;
    float d = 1e3;
    for (int i = ZERO; i < 5; i++) {
      vec4 b = berryAt(i);
      d = min(d, length(q - b.xyz) - b.w);
    }
    return d;
  }

  float sdStream(vec3 q) {
    if (uStream < 0.01) return 1e3;
    float bot = max(uLevel, CY - RI) - 0.03;
    float top = 4.2;
    float r = 0.017 * uStream * (1.0 + 0.22 * sin(q.y * 31.0 - uTime * 26.0));
    vec3 u = q - vec3(0.012 * sin(q.y * 4.0 - uTime * 6.0), 0.0, 0.0);
    vec2 d = vec2(length(u.xz) - r, abs(q.y - 0.5 * (top + bot)) - 0.5 * (top - bot));
    return (min(max(d.x, d.y), 0.0) + length(max(d, 0.0))) * 0.8;
  }

  // ids: 1 líquido · 2 gelo · 3 vidro maciço · 4 rodela · 5 raminho · 6 frutinha · 7 fio
  vec2 map(vec3 q) {
    vec2 r = vec2(sdLiquid(q), 1.0);
    float d = sdIce(q);
    if (d < r.x) r = vec2(d, 2.0);
    d = sdStem(q);
    if (d < r.x) r = vec2(d, 3.0);
    d = sdWheel(q);
    if (d < r.x) r = vec2(d, 4.0);
    d = sdSprig(q);
    if (d < r.x) r = vec2(d, 5.0);
    d = sdBerries(q);
    if (d < r.x) r = vec2(d, 6.0);
    d = sdStream(q);
    if (d < r.x) r = vec2(d, 7.0);
    return r;
  }

  // dentro do líquido só há o que mergulha nele
  vec2 mapIn(vec3 q) {
    vec2 r = vec2(sdIce(q), 2.0);
    float d = sdWheel(q);
    if (d < r.x) r = vec2(d, 4.0);
    d = sdSprig(q);
    if (d < r.x) r = vec2(d, 5.0);
    d = sdBerries(q);
    if (d < r.x) r = vec2(d, 6.0);
    return r;
  }

  vec3 calcNormal(vec3 p) {
    vec3 n = vec3(0.0);
    for (int i = ZERO; i < 4; i++) {
      vec3 e = 0.5773 * (2.0 * vec3(float(((i + 3) >> 1) & 1), float((i >> 1) & 1), float(i & 1)) - 1.0);
      n += e * map(p + 0.0009 * e).x;
    }
    return normalize(n);
  }
  vec3 calcNormalIn(vec3 p) {
    vec3 n = vec3(0.0);
    for (int i = ZERO; i < 4; i++) {
      vec3 e = 0.5773 * (2.0 * vec3(float(((i + 3) >> 1) & 1), float((i >> 1) & 1), float(i & 1)) - 1.0);
      n += e * mapIn(p + 0.0009 * e).x;
    }
    return normalize(n);
  }

  /* ---------- materiais ---------- */

  float fres(float ndv, float f0) { return f0 + (1.0 - f0) * pow(1.0 - ndv, 5.0); }

  vec3 shadeIce(vec3 p, vec3 n, vec3 rd, vec3 Lo, float sub) {
    int k = 0;
    float best = 1e3;
    for (int i = ZERO; i < 3; i++) {
      if (uIce[i].w < 0.5) continue;
      float d = sdRoundBox(iceLocal(p, i), vec3(0.105), 0.03);
      if (d < best) { best = d; k = i; }
    }
    vec3 u = iceLocal(p, k);
    float ndv = max(dot(n, -rd), 0.0);
    float F = fres(ndv, 0.03);
    vec3 ri = refract(rd, n, 1.0 / 1.31);
    vec3 col = background(toWorld(p), toWorld(ri)) * 0.8;
    // gelo cristalino: arestas acesas e um véu de microbolhas no miolo
    vec3 a = abs(u);
    float m1 = max(a.x, max(a.y, a.z));
    float m3 = min(a.x, min(a.y, a.z));
    float m2 = a.x + a.y + a.z - m1 - m3;
    float edge = smoothstep(0.08, 0.104, m2);
    float core = (1.0 - smoothstep(0.02, 0.085, length(u * vec3(1.0, 1.4, 1.0)))) * (0.5 + 0.5 * noise(u * 60.0));
    // a luz que entra pelo gelo e se espalha: as faces nunca ficam pretas
    float fill = 0.5 + 0.5 * dot(n, Lo);
    // mergulhado, o gelo quase some: o índice do gelo e o da bebida são vizinhos
    float vis = 1.0 - 0.7 * sub;
    col += (vec3(0.045, 0.055, 0.06) * (0.5 + fill) * (1.0 - 0.8 * sub) + vec3(0.62, 0.7, 0.76) * (edge * 0.3 + core * 0.2)) * vis;
    col += envR(toWorld(reflect(rd, n))) * F * 1.3 * vis;
    col += vec3(1.0, 0.92, 0.8) * pow(max(dot(ri, Lo), 0.0), 6.0) * 0.45;
    // a parte de baixo, dentro da bebida, pega a cor dela
    if (sub < 0.5 && uLevel > CY - RI + 0.004) col *= mix(vec3(1.0), exp(-uTop * 0.3), 1.0 - smoothstep(uLevel - 0.02, uLevel + 0.06, p.y));
    return col;
  }

  vec3 shadeWheel(vec3 p, vec3 n, vec3 rd, vec3 Lo) {
    vec3 u = p - uWheel.xyz;
    vec3 t1 = normalize(cross(uWheelN, vec3(0.31, 0.9, 0.3)));
    vec3 t2 = cross(uWheelN, t1);
    vec2 w = vec2(dot(u, t1), dot(u, t2));
    float r = length(w) / uWheel.w;
    float a = atan(w.y, w.x);
    float sa = fract(a / (2.0 * PI) * 10.0);
    float mem = 1.0 - smoothstep(0.025, 0.07, min(sa, 1.0 - sa));
    float center = 1.0 - smoothstep(0.07, 0.13, r);
    float ves = noise(vec3(w * 140.0, 1.0));
    vec3 pith = vec3(0.93, 0.92, 0.82);
    vec3 pulp = uPulp * (0.8 + 0.35 * ves);
    float face = abs(dot(n, uWheelN));
    vec3 alb = mix(pulp, pith, max(mem * smoothstep(0.12, 0.2, r), center));
    alb = mix(alb, pith, smoothstep(0.8, 0.84, r));
    alb = mix(alb, uRind, smoothstep(0.9, 0.93, r));
    alb = mix(uRind, alb, smoothstep(0.4, 0.7, face));
    float dif = max(dot(n, Lo), 0.0);
    vec3 col = alb * (0.22 + 0.7 * dif);
    // contraluz atravessando a polpa
    col += pulp * pow(max(dot(rd, Lo), 0.0), 2.0) * 0.75 * (1.0 - smoothstep(0.8, 0.9, r));
    col += envR(toWorld(reflect(rd, n))) * fres(max(dot(n, -rd), 0.0), 0.04) * 0.5;
    return col;
  }

  vec3 shadeSprig(vec3 p, vec3 n, vec3 rd, vec3 Lo) {
    vec3 alb = uSprigCol * (0.75 + 0.5 * noise(p * 90.0));
    float dif = clamp((dot(n, Lo) + 0.3) / 1.3, 0.0, 1.0);
    vec3 col = alb * (0.25 + 0.8 * dif);
    col += alb * vec3(0.6, 1.0, 0.5) * pow(max(dot(rd, Lo), 0.0), 3.0) * 0.6;
    vec3 r = reflect(rd, n);
    col += envR(toWorld(r)) * fres(max(dot(n, -rd), 0.0), 0.04) * 0.35;
    return col;
  }

  vec3 shadeBerry(vec3 p, vec3 n, vec3 rd, vec3 Lo) {
    vec3 alb = uBerryCol * (0.75 + 0.4 * noise(p * 160.0));
    float dif = max(dot(n, Lo), 0.0);
    vec3 col = alb * (0.3 + 0.8 * dif);
    vec3 r = reflect(rd, n);
    col += envR(toWorld(r)) * fres(max(dot(n, -rd), 0.0), 0.05) * 0.9;
    col += vec3(1.0, 0.9, 0.85) * pow(max(dot(r, Lo), 0.0), 60.0) * 1.5;
    return col;
  }

  vec3 shadeSolidGlass(vec3 p, vec3 n, vec3 rd) {
    float ndv = max(dot(n, -rd), 0.0);
    vec3 ri = refract(rd, n, 1.0 / 1.5);
    vec3 col = background(toWorld(p + ri * 0.05), toWorld(ri)) * mix(vec3(0.92, 0.97, 0.95), vec3(0.5, 0.6, 0.58), pow(1.0 - ndv, 2.0));
    col += envR(toWorld(reflect(rd, n))) * fres(ndv, 0.04);
    // vidro maciço acende nas bordas com o contraluz
    col += vec3(0.85, 0.8, 0.7) * pow(1.0 - ndv, 2.0) * (0.06 + 0.25 * pow(max(dot(rd, toObj(uL)), 0.0), 2.0));
    return col;
  }

  vec3 shadeStream(vec3 p, vec3 n, vec3 rd) {
    float ndv = max(dot(n, -rd), 0.0);
    vec3 ri = refract(rd, n, 0.75);
    vec3 col = background(toWorld(p), toWorld(ri)) * exp(-uStreamSig * 0.12) * 1.1;
    col += exp(-uStreamSig * 0.3) * 0.08;
    col += envR(toWorld(reflect(rd, n))) * fres(ndv, 0.02) * 1.4;
    return col;
  }

  vec3 shadeIn(float id, vec3 p, vec3 rd, vec3 Lo) {
    vec3 n = calcNormalIn(p);
    if (id < 2.5) return shadeIce(p, n, rd, Lo, 1.0);
    if (id < 4.5) return shadeWheel(p, n, rd, Lo);
    if (id < 5.5) return shadeSprig(p, n, rd, Lo);
    return shadeBerry(p, n, rd, Lo);
  }

  vec3 sigmaAt(vec3 q) {
    float sw = (noise(q * 3.2 + vec3(0.0, -uTime * 0.25, 0.0)) - 0.5) * (0.06 + 0.2 * uWave);
    float w = smoothstep(uMixH - 0.09, uMixH + 0.09, q.y + sw);
    return mix(uBot, uTop, w);
  }

  vec3 shadeLiquid(vec3 p, vec3 n, vec3 rd, vec3 Lo) {
    float ndv = max(dot(n, -rd), 0.0);
    float F = fres(ndv, 0.02);
    vec3 refl = envR(toWorld(reflect(rd, n)));

    // espuma: um dedo de seda por cima (clara batida)
    if (uFoam > 0.0 && p.y > uLevel - uFoam - 0.002) {
      float bump = noise(p * 70.0) * 0.5 + noise(p * 160.0) * 0.5;
      vec3 alb = mix(vec3(0.9, 0.84, 0.78), exp(-uTop * 0.12), 0.35) * (0.8 + 0.28 * bump);
      float dif = clamp((dot(n, Lo) + 0.5) / 1.5, 0.0, 1.0);
      // a espuma é rasa: perto da bebida ela pega a cor de baixo
      float depth = smoothstep(uLevel - uFoam - 0.002, uLevel - uFoam * 0.4, p.y);
      alb = mix(exp(-uTop * 0.35) * 0.8, alb, depth);
      return alb * (0.2 + 0.5 * dif) + refl * F * 0.3;
    }

    vec3 c = vec3(0.0, CY, 0.0);
    vec3 ri = refract(rd, n, 1.0 / 1.33);
    if (dot(ri, ri) < 0.5) ri = reflect(rd, n);
    vec2 si = sphIt(p, ri, c, RI);
    float tS = si.y > 0.0 ? si.y : 0.0;
    float tP = ri.y > 0.0 && p.y < uLevel - 0.002 ? (uLevel - p.y) / ri.y : 1e3;
    float tExit = max(min(tS, tP), 0.002);

    // o que está mergulhado: gelo, rodela, alecrim
    float t = 0.004;
    float tHit = -1.0;
    float idIn = 0.0;
    for (int i = ZERO; i < IN_STEPS; i++) {
      vec2 h = mapIn(p + ri * t);
      if (h.x < 0.0008) { tHit = t; idIn = h.y; break; }
      t += max(h.x * 0.9, 0.004);
      if (t > tExit) break;
    }
    float dist = tHit > 0.0 ? tHit : tExit;

    // atravessando: absorção em duas camadas, bolhas subindo
    vec3 tau = vec3(0.0);
    float bub = 0.0;
    float dt = dist / float(BUB);
    for (int i = ZERO; i < BUB; i++) {
      vec3 q = p + ri * (dt * (float(i) + 0.5));
      vec3 s = sigmaAt(q);
      tau += s * dt;
      if (uBubbles > 0.0) {
        vec3 bq = q * vec3(30.0, 15.0, 30.0) - vec3(0.0, uTime * 3.4, 0.0);
        vec3 id = floor(bq);
        float h = hash(id);
        vec3 o = vec3(fract(h * 13.1), 0.5, fract(h * 7.7)) * 0.6 + 0.2;
        float d = length(fract(bq) - o);
        bub += (1.0 - smoothstep(0.02, 0.1, d)) * step(1.0 - 0.42 * uBubbles, h) * exp(-dot(tau, vec3(0.33)) * 0.6);
      }
    }
    vec3 T = exp(-tau);

    vec3 inside;
    if (tHit > 0.0) {
      inside = shadeIn(idIn, p + ri * tHit, ri, Lo);
    } else {
      vec3 pe = p + ri * tExit;
      vec3 ne = tP < tS ? vec3(0.0, 1.0, 0.0) : normalize(pe - c);
      vec3 ro2 = refract(ri, -ne, 1.33);
      if (dot(ro2, ro2) < 0.5) ro2 = reflect(ri, -ne);
      inside = background(toWorld(pe), toWorld(ro2));
    }
    vec3 col = inside * T;

    // turvo: a luz espalha dentro da bebida e ela acende por inteiro
    float cl = 1.0 - exp(-(uCloud + 0.05) * dist * 7.0);
    vec3 tint = exp(-mix(uTop, uBot, 0.3) * 0.28);
    vec3 scat = tint * (0.16 + 0.7 * pow(max(dot(rd, Lo), 0.0), 2.0) + 0.18 * max(dot(n, Lo), 0.0));
    col = mix(col, scat, cl);

    col += vec3(0.95, 0.97, 1.0) * bub * 0.4 * (1.0 - cl * 0.6);
    // contraluz: a bebida brilha quando a luz vem de trás
    col += exp(-uTop * 0.5) * pow(max(dot(rd, Lo), 0.0), 3.0) * 0.32;
    return col * (1.0 - F) + refl * F;
  }

  vec3 shade(float id, vec3 p, vec3 rd, vec3 Lo) {
    vec3 n = calcNormal(p);
    if (id < 1.5) return shadeLiquid(p, n, rd, Lo);
    if (id < 2.5) return shadeIce(p, n, rd, Lo, 0.0);
    if (id < 3.5) return shadeSolidGlass(p, n, rd);
    if (id < 4.5) return shadeWheel(p, n, rd, Lo);
    if (id < 5.5) return shadeSprig(p, n, rd, Lo);
    if (id < 6.5) return shadeBerry(p, n, rd, Lo);
    return shadeStream(p, n, rd);
  }

  /* ---------- o vidro do bojo ---------- */

  // condensação: gotas que funcionam como lentes e névoa fina, só onde o vidro está gelado
  vec3 glassWall(vec3 col, vec3 po, vec3 no, vec3 rd, bool front) {
    float cold = front ? uCond * (1.0 - smoothstep(uLevel - 0.02, uLevel + 0.05, po.y)) : 0.0;
    vec3 n = no;
    float rim = 0.0;
    float inDrop = 0.0;
    if (cold > 0.001) {
      vec2 uv = vec2(atan(po.z, po.x) * RB, po.y * 1.18) * 34.0;
      vec2 id = floor(uv);
      vec2 f = fract(uv);
      float best = 9.0;
      vec2 off = vec2(0.0);
      float rr = 0.0;
      for (int k = ZERO; k < 9; k++) {
        vec2 o = vec2(float(k - (k / 3) * 3) - 1.0, float(k / 3) - 1.0);
        vec2 h = hash2(id + o + 11.0);
        if (h.y < 0.58) continue;
        vec2 cc = o + 0.2 + 0.6 * h;
        vec2 dv = f - cc;
        float rad = 0.1 + 0.3 * pow(fract(h.x * 5.3), 2.0);
        float d = length(dv) / rad;
        if (d < best) { best = d; off = dv / rad; rr = rad; }
      }
      inDrop = (1.0 - smoothstep(0.82, 1.0, best)) * cold;
      rim = smoothstep(0.55, 0.98, best) * inDrop;
      vec3 tx = normalize(vec3(-po.z, 0.0, po.x));
      vec3 ty = normalize(vec3(0.0, 1.0, 0.0) - no * no.y);
      n = normalize(no + (tx * off.x + ty * off.y) * 0.85 * inDrop);
      // névoa: fosca, levemente clara; dentro da gota o vidro fica limpo
      float fog = cold * 0.2 * (1.0 - inDrop);
      col = mix(col, col * 0.8 + vec3(0.035, 0.04, 0.04), fog);
    }

    float ndv = max(dot(no, -rd), 0.0);
    float F = fres(max(dot(n, -rd), 0.0), 0.04);
    // vidro visto de raspão: mais caminho dentro dele, mais escuro e esverdeado
    col *= mix(vec3(1.0), vec3(0.5, 0.6, 0.58), pow(1.0 - ndv, 3.0));
    col *= 1.0 - rim * 0.12;
    vec3 r = toWorld(reflect(rd, n));
    col = col * (1.0 - F) + envR(r) * F * (front ? 1.0 : 0.6);
    // ponto de luz de cada gota
    col += vec3(1.0, 0.95, 0.88) * pow(max(dot(reflect(rd, n), toObj(normalize(vec3(0.55, 0.3, 0.8)))), 0.0), 90.0) * 2.4 * inDrop;
    return col;
  }

  vec3 tonemap(vec3 c) {
    c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
    return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec3 fw = normalize(uTa - uRo);
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fw);
    vec3 rd = normalize(uv.x * rt + uv.y * up + uFocal * fw);
    vec3 ro = uRo;

    vec3 roO = toObj(ro);
    vec3 rdO = toObj(rd);
    vec3 Lo = toObj(uL);

    vec2 hit = vec2(-1.0, 0.0);
    vec2 bb = boxIt(roO, rdO, vec3(-0.8, 0.0, -0.8), vec3(0.8, 4.3, 0.8));
    if (bb.y > max(bb.x, 0.0)) {
      float t = max(bb.x, 0.0);
      for (int i = ZERO; i < STEPS; i++) {
        vec2 h = map(roO + rdO * t);
        if (h.x < 0.0006 * t) { hit = vec2(t, h.y); break; }
        t += h.x * 0.86;
        if (t > bb.y) break;
      }
    }

    vec3 c = vec3(0.0, CY, 0.0);
    vec2 sp = sphIt(roO, rdO, c, RB);
    float rimY = CY + HC;
    float y0 = roO.y + rdO.y * sp.x;
    float y1 = roO.y + rdO.y * sp.y;
    bool front = sp.x > 0.0 && y0 < rimY;
    bool back = sp.y > 0.0 && y1 < rimY && (hit.x < 0.0 || hit.x > sp.y);

    vec3 col;
    if (hit.x > 0.0) {
      col = shade(hit.y, roO + rdO * hit.x, rdO, Lo);
    } else {
      // pela taça vazia o fundo entorta perto das bordas: é ali que se vê o vidro
      vec3 rdB = rdO;
      if (front) {
        vec3 nf = normalize(roO + rdO * sp.x - c);
        float k = 1.0 - max(dot(nf, -rdO), 0.0);
        rdB = normalize(rdO - nf * k * k * 0.32);
      }
      col = background(ro, toWorld(rdB));
    }

    if (back) {
      vec3 pb = roO + rdO * sp.y;
      col = glassWall(col, pb, -normalize(pb - c), rdO, false);
    }
    if (front) {
      vec3 pf = roO + rdO * sp.x;
      col = glassWall(col, pf, normalize(pf - c), rdO, true);
    }
    // a borda da taça: um fio de luz
    float rimL = 0.0;
    if (front) rimL = max(rimL, 1.0 - smoothstep(0.0, 0.01, rimY - y0));
    if (sp.y > 0.0 && y1 < rimY) rimL = max(rimL, (1.0 - smoothstep(0.0, 0.008, rimY - y1)) * 0.6);
    col += vec3(0.85, 0.82, 0.76) * rimL * 0.5;

    col *= uExpo;
    col = tonemap(col * 1.1);
    // vinheta
    col *= 1.0 - uVig * dot(uv * vec2(0.7, 1.0), uv * vec2(0.7, 1.0));
    col += (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;
