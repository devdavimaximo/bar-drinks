import { signature } from '../content';
import { bounce, clamp, easeInOut, easeOut, lerp, smooth, span } from '../lib/env';
import {
  GLASSES,
  bowlBottom,
  floatIce,
  iceRest,
  levelAt,
  mixState,
  sigma,
  sprigPose,
  stateFromLook,
  wallAt,
  wheelPose,
  type DrinkState,
  type V3,
  type V4,
} from './state';

/**
 * A montagem do drink-assinatura, em seis tempos de scroll (content.build.steps):
 *   0.00  I    a taça vazia gira na vitrine
 *   0.07  II   três cubos de gelo caem, um depois do outro, e quicam no fundo
 *   0.22  III  o gin cai num fio e o nível sobe, transparente
 *   0.38  IV   o xarope de hibisco desce rubi e assenta no fundo
 *   0.54  V    a tônica sobe o nível, o hibisco sobe em degradê, nascem as bolhas
 *              e o vidro embaça e condensa onde a bebida está gelada
 *   0.74  VI   rodela de limão, alecrim e pimenta-rosa
 *   0.88       a câmera desce para a foto final
 */

const G = GLASSES.copa;
const B = bowlBottom(G);
const FINAL = stateFromLook(signature.look);
const L_GIN = B + 0.25;
const L_SYRUP = B + 0.31;
const L_FULL = levelAt(G, signature.look.fill);

const GIN = sigma('#f3f6f4');
const SYRUP = sigma(signature.look.bottom ?? '#9c1238', 0.45);
const TONIC = sigma('#eef3f2');

const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** fio de bebida: entra, cai enquanto o nível sobe, afina e para */
const pour = (p: number, a: number, b: number) => smooth(span(p, a, a + 0.02)) * (1 - smooth(span(p, b - 0.02, b)));
/** ondinha que nasce num instante e morre logo */
const pulse = (p: number, at: number) => (p < at ? 0 : Math.exp(-(p - at) * 70));

const ICE_DROP = [0.08, 0.115, 0.15];

export function buildState(p: number): DrinkState {
  // gelo: cai de cima da taça, gira no ar, quica e assenta
  const rest = iceRest(G);
  const iceRot: V3 = [0, 0, 0];
  const ice = rest.map((c, i) => {
    const t = span(p, ICE_DROP[i], ICE_DROP[i] + 0.06);
    iceRot[i] = (1 - easeOut(t)) * 3.2;
    return [c[0], lerp(3.0, c[1], bounce(t)), c[2], t > 0 ? 1 : 0] as V4;
  }) as [V4, V4, V4];

  // nível: gin, xarope, tônica
  const gin = easeInOut(span(p, 0.235, 0.35));
  const syr = easeInOut(span(p, 0.395, 0.5));
  const ton = easeInOut(span(p, 0.555, 0.7));
  const level = ton > 0 ? lerp(L_SYRUP, L_FULL, ton) : syr > 0 ? lerp(L_GIN, L_SYRUP, syr) : gin > 0 ? lerp(B - 0.02, L_GIN, gin) : 0;

  // cor: o xarope assenta no fundo; a tônica mistura e o rubi sobe em degradê
  const top = mix3(GIN, FINAL.top, smooth(span(p, 0.58, 0.72)));
  const bottom = mix3(mix3(GIN, SYRUP, smooth(span(p, 0.4, 0.47))), FINAL.bottom, smooth(span(p, 0.56, 0.72)));
  const mixH = lerp(lerp(B - 0.1, B + 0.12, syr), FINAL.mixH, ton);

  const sGin = pour(p, 0.225, 0.355);
  const sSyr = pour(p, 0.39, 0.505);
  const sTon = pour(p, 0.545, 0.705);
  const stream = Math.max(sGin, sSyr, sTon);
  const streamSig = sSyr > 0.01 ? SYRUP : sTon > 0.01 ? TONIC : GIN;

  const wave = Math.min(1, stream * 0.5 + ICE_DROP.reduce((a, at) => a + pulse(p, at + 0.04), 0) + (ton > 0 && ton < 1 ? 0.4 : 0));

  // guarnição: rodela desliza pela parede, alecrim desce, pimenta-rosa cai na superfície
  const tw = easeOut(span(p, 0.74, 0.8));
  const wp = wheelPose(G, L_FULL, false);
  const wheel: V4 = [wp.wheel[0], wp.wheel[1] + (1 - tw) * 1.0, wp.wheel[2], tw > 0 ? wp.wheel[3] : 0];
  const ts = easeOut(span(p, 0.77, 0.83));
  const sp = sprigPose(G);
  const sprig: V4 = [sp.sprig[0], sp.sprig[1] + (1 - ts) * 1.3, sp.sprig[2], ts > 0 ? 1 : 0];
  const berry: V4 = [span(p, 0.8, 0.88), FINAL.berry[1], wallAt(G, L_FULL) * 0.6, 0];

  return {
    ...FINAL,
    level,
    wave,
    top,
    bottom,
    mixH,
    cloud: 0,
    bubbles: smooth(span(p, 0.57, 0.68)),
    ice: floatIce(ice, level),
    iceRot,
    wheel,
    wheelN: wp.wheelN,
    sprig,
    sprigAx: sp.sprigAx,
    berry,
    stream,
    streamSig,
    cond: smooth(span(p, 0.6, 0.8)),
  };
}

/* ---------- câmera ---------- */

export type Cam = { ro: V3; ta: V3; focal: number };

/** quadros-chave: vitrine, olhando para dentro (gelo e bebida), guarnição, foto final */
const KEYS: { at: number; ro: V3; ta: V3; focal: number }[] = [
  { at: 0.0, ro: [0, 1.9, 5.7], ta: [0, 1.05, 0], focal: 2.2 },
  { at: 0.12, ro: [0, 2.85, 4.7], ta: [0, 1.0, 0], focal: 2.25 },
  { at: 0.45, ro: [0.35, 2.55, 4.5], ta: [0, 1.08, 0], focal: 2.25 },
  { at: 0.78, ro: [-0.25, 2.45, 4.9], ta: [0, 1.3, 0], focal: 2.3 },
  { at: 0.94, ro: [0.05, 1.75, 5.0], ta: [0, 1.32, 0], focal: 2.3 },
];

export function camAt(p: number, aspect: number, mx: number, my: number, rise: number): Cam {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].at) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smooth(clamp((p - a.at) / (b.at - a.at)));
  // retrato: mais longe para caber a taça inteira; o nome fica no topo, a taça desce
  const far = aspect < 1 ? Math.pow(1 / aspect, 0.85) : 1;
  const ro = mix3(a.ro, b.ro, t);
  const ta = mix3(a.ta, b.ta, t);
  ro[2] *= far;
  ro[1] += (far - 1) * 0.5;
  if (aspect < 1) ta[1] += 0.3 * (1 - smooth(span(p, 0, 0.1)));
  // retrato: a ficha ocupa o rodapé e a taça sobe; no final volta um pouco para o alecrim caber
  if (aspect < 1) ta[1] -= 0.45 * smooth(span(p, 0.04, 0.12)) - 0.15 * smooth(span(p, 0.84, 0.92));
  // entrada: a câmera chega um pouco de trás
  ro[2] += (1 - rise) * 1.6;
  ro[1] += (1 - rise) * 0.4;
  ro[0] += mx * 0.35;
  ro[1] += -my * 0.18;
  return { ro, ta, focal: lerp(a.focal, b.focal, t) };
}

/** giro lento da vitrine + um pouco a cada passo do scroll */
export const spinAt = (p: number, time: number, mx: number) => time * 0.22 + p * Math.PI * 1.3 + mx * 0.35;

export const introRise = (t: number) => easeOut(clamp((t - 0.1) / 2.0));

/** a carta mostra o drink pronto; mesma luz, câmera de retrato */
export const cardCam = (aspect: number): Cam => {
  const far = aspect < 0.8 ? Math.pow(0.8 / aspect, 0.9) : 1;
  // a legenda ocupa o rodapé do quadro: a taça sobe um pouco
  return { ro: [0, 2.3, 5.4 * far], ta: [0, aspect < 1 ? 0.72 : 1.0, 0], focal: 2.25 };
};

export { mixState };
