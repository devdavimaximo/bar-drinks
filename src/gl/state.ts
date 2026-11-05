import * as THREE from 'three';
import type { Look } from '../content';
import { lerp } from '../lib/env';
import { noiseTexture } from './noise';

/**
 * Tudo o que o shader precisa para desenhar um drink, como números. Dois estados
 * se misturam campo a campo: é assim que a carta troca de drink (a taça se
 * transforma, a cor muda, a guarnição sai e entra) e é assim que o hero monta
 * o drink-assinatura ao longo do scroll.
 */

export type V3 = [number, number, number];
export type V4 = [number, number, number, number];

export type DrinkState = {
  /** centro do bojo (y), raio, corte relativo ao centro */
  glass: V3;
  level: number;
  wave: number;
  top: V3;
  bottom: V3;
  mixH: number;
  cloud: number;
  foam: number;
  bubbles: number;
  ice: [V4, V4, V4];
  iceRot: V3;
  /** centro + raio (0 = sem rodela) */
  wheel: V4;
  wheelN: V3;
  pulp: V3;
  rind: V3;
  sprig: V4;
  sprigAx: V3;
  sprigCol: V3;
  /** progresso, raio, raio do anel, - */
  berry: V4;
  berryCol: V3;
  stream: number;
  streamSig: V3;
  cond: number;
};

export const TH = 0.012;
/** taça balão (gin tônica) e coupe (clássicos batidos) */
export const GLASSES: Record<Look['glass'], V3> = {
  copa: [1.32, 0.62, 0.42],
  coupe: [1.67, 0.62, -0.34],
};

export const bowlBottom = (g: V3) => g[0] - g[1] + TH;
export const rimY = (g: V3) => g[0] + g[2];
export const levelAt = (g: V3, fill: number) => bowlBottom(g) + (rimY(g) - 0.05 - bowlBottom(g)) * fill;
export const wallAt = (g: V3, y: number) => Math.sqrt(Math.max((g[1] - TH) ** 2 - (y - g[0]) ** 2, 0));

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function rgb(hex: string): V3 {
  const n = parseInt(hex.slice(1), 16);
  return [lin(((n >> 16) & 255) / 255), lin(((n >> 8) & 255) / 255), lin((n & 255) / 255)];
}
/** cor da luz depois de ~8 cm de bebida → coeficiente de absorção */
export function sigma(hex: string, depth = 0.8): V3 {
  return rgb(hex).map((c) => -Math.log(Math.max(c, 0.012)) / depth) as V3;
}

/** gelo assentado no fundo; boia quando o nível passa por cima */
export function iceRest(g: V3): [V4, V4, V4] {
  const b = bowlBottom(g);
  return [
    [-0.13, b + 0.17, 0.05, 1],
    [0.14, b + 0.19, -0.07, 1],
    [0.0, b + 0.36, 0.13, 1],
  ];
}
export function floatIce(ice: [V4, V4, V4], level: number): [V4, V4, V4] {
  const depth = [0.075, 0.095, 0.06];
  return ice.map((c, i) => [c[0], Math.max(c[1], level - depth[i]), c[2], c[3]]) as [V4, V4, V4];
}

const WHEEL_DIR: V3 = [0.74, 0, 0.67];

/** rodela encostada na parede (gin tônica) ou boiando deitada (daiquiri) */
export function wheelPose(g: V3, level: number, float: boolean): { wheel: V4; wheelN: V3 } {
  if (float) return { wheel: [0.05, level + 0.004, 0.04, 0.13], wheelN: [0.06, 1, 0.04] };
  const y = level + 0.04;
  const r = wallAt(g, y) * 0.76;
  const n = new THREE.Vector3(-WHEEL_DIR[0], 0.28, -WHEEL_DIR[2]).normalize();
  return { wheel: [WHEEL_DIR[0] * r, y, WHEEL_DIR[2] * r, 0.15], wheelN: [n.x, n.y, n.z] };
}

export function sprigPose(g: V3): { sprig: V4; sprigAx: V3 } {
  const b = bowlBottom(g);
  const deep = g === GLASSES.coupe ? 0.12 : 0.26;
  const len = g === GLASSES.coupe ? 0.62 : 1.12;
  const ax = new THREE.Vector3(-0.12, 1, -0.08).normalize().multiplyScalar(len);
  return { sprig: [-0.16, b + deep, -0.1, 1], sprigAx: [ax.x, ax.y, ax.z] };
}

/** o drink pronto, como aparece na carta */
export function stateFromLook(look: Look): DrinkState {
  const g = GLASSES[look.glass];
  const level = levelAt(g, look.fill);
  const top = sigma(look.color);
  const bottom = look.bottom ? sigma(look.bottom) : top;
  const b = bowlBottom(g);
  const wheel = look.wheel ? wheelPose(g, level, !!look.wheel.float) : { wheel: [0, level, 0, 0] as V4, wheelN: [0, 1, 0] as V3 };
  const sprig = look.sprig ? sprigPose(g) : { sprig: [-0.16, b + 0.26, -0.1, 0] as V4, sprigAx: [0, 1, 0] as V3 };
  const ice = look.ice ? floatIce(iceRest(g), level) : (iceRest(g).map((c) => [c[0], c[1], c[2], 0]) as [V4, V4, V4]);
  return {
    glass: [...g],
    level,
    wave: 0,
    top,
    bottom,
    mixH: b + (level - b) * 0.32,
    cloud: look.cloud ?? 0,
    foam: look.foam ?? 0,
    bubbles: look.bubbles ?? 0,
    ice,
    iceRot: [0, 0, 0],
    ...wheel,
    pulp: look.wheel ? rgb(look.wheel.pulp) : [0.8, 0.8, 0.5],
    rind: look.wheel ? rgb(look.wheel.rind) : [0.6, 0.5, 0.1],
    ...sprig,
    sprigCol: rgb(look.sprig ?? '#2f4a2a'),
    berry: look.berries ? [1, look.berries.size, wallAt(g, level) * 0.6, 0] : [0, 0.02, 0.2, 0],
    berryCol: rgb(look.berries?.color ?? '#c3304f'),
    stream: 0,
    streamSig: top,
    cond: look.ice ? 0.9 : 0.55,
  };
}

/** mistura campo a campo; quem decide o que aparece e some são os campos de visibilidade */
export function mixState(a: DrinkState, b: DrinkState, t: number): DrinkState {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(a) as (keyof DrinkState)[]) {
    const va = a[k] as unknown;
    const vb = b[k] as unknown;
    if (typeof va === 'number') out[k] = lerp(va, vb as number, t);
    else if (Array.isArray(va) && Array.isArray(va[0]))
      out[k] = (va as number[][]).map((row, i) => row.map((x, j) => lerp(x, (vb as number[][])[i][j], t)));
    else out[k] = (va as number[]).map((x, i) => lerp(x, (vb as number[])[i], t));
  }
  return out as DrinkState;
}

/* ---------- uniforms ---------- */

export function makeUniforms() {
  return {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uRo: { value: new THREE.Vector3() },
    uTa: { value: new THREE.Vector3() },
    uFocal: { value: 2.2 },
    uSpin: { value: 0 },
    uL: { value: new THREE.Vector3(0.55, 0.75, -0.65).normalize() },
    uExpo: { value: 1 },
    uVig: { value: 0.32 },
    uGlass: { value: new THREE.Vector3() },
    uLevel: { value: 0 },
    uWave: { value: 0 },
    uTop: { value: new THREE.Vector3() },
    uBot: { value: new THREE.Vector3() },
    uMixH: { value: 0 },
    uCloud: { value: 0 },
    uFoam: { value: 0 },
    uBubbles: { value: 0 },
    uIce: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uIceRot: { value: new THREE.Vector3() },
    uWheel: { value: new THREE.Vector4() },
    uWheelN: { value: new THREE.Vector3(0, 1, 0) },
    uPulp: { value: new THREE.Vector3() },
    uRind: { value: new THREE.Vector3() },
    uSprig: { value: new THREE.Vector4() },
    uSprigAx: { value: new THREE.Vector3(0, 1, 0) },
    uSprigCol: { value: new THREE.Vector3() },
    uBerry: { value: new THREE.Vector4() },
    uBerryCol: { value: new THREE.Vector3() },
    uStream: { value: 0 },
    uStreamSig: { value: new THREE.Vector3() },
    uCond: { value: 0 },
    uZero: { value: 0 },
    uNoise: { value: noiseTexture() },
  };
}

export type Uniforms = ReturnType<typeof makeUniforms>;

export function pushState(u: Uniforms, s: DrinkState) {
  u.uGlass.value.set(...s.glass);
  u.uLevel.value = s.level;
  u.uWave.value = s.wave;
  u.uTop.value.set(...s.top);
  u.uBot.value.set(...s.bottom);
  u.uMixH.value = s.mixH;
  u.uCloud.value = s.cloud;
  u.uFoam.value = s.foam;
  u.uBubbles.value = s.bubbles;
  s.ice.forEach((c, i) => u.uIce.value[i].set(...c));
  u.uIceRot.value.set(...s.iceRot);
  u.uWheel.value.set(...s.wheel);
  u.uWheelN.value.set(...s.wheelN).normalize();
  u.uPulp.value.set(...s.pulp);
  u.uRind.value.set(...s.rind);
  u.uSprig.value.set(...s.sprig);
  u.uSprigAx.value.set(...s.sprigAx);
  u.uSprigCol.value.set(...s.sprigCol);
  u.uBerry.value.set(...s.berry);
  u.uBerryCol.value.set(...s.berryCol);
  u.uStream.value = s.stream;
  u.uStreamSig.value.set(...s.streamSig);
  u.uCond.value = s.cond;
}
