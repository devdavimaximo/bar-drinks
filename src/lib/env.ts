const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

/** celular/tablet: menos pixels, menos passos de raymarch, mesma cena */
export const LITE = mq('(max-width: 899px), (pointer: coarse)');
export const FINE_POINTER = mq('(pointer: fine)');
export const REDUCED = mq('(prefers-reduced-motion: reduce)');

export const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** trecho [a, b] de uma linha do tempo 0..1, normalizado */
export const span = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** queda com dois quiques curtos: o gelo batendo no fundo da taça */
export const bounce = (t: number) => {
  t = clamp(t);
  if (t < 0.62) return (t / 0.62) ** 2;
  if (t < 0.86) return 1 - 0.07 * Math.sin(((t - 0.62) / 0.24) * Math.PI);
  return 1 - 0.018 * Math.sin(((t - 0.86) / 0.14) * Math.PI);
};
/** amortecimento independente de frame rate */
export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
