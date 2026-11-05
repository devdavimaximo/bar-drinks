import type Lenis from 'lenis';

export const scroller: { lenis: Lenis | null; velocity: number } = {
  lenis: null,
  velocity: 0,
};

/** duração longa atravessando o hero = o drink inteiro sendo montado sozinho */
export function scrollToId(id: string, duration = 1.8, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  if (scroller.lenis) scroller.lenis.scrollTo(el, { duration, offset, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/** estado compartilhado entre DOM (ScrollTrigger) e WebGL (useFrame) sem re-render */
export const signals = {
  /** 0..1 ao longo do hero fixado: a montagem do drink */
  build: 0,
  /** instante (performance.now) em que o preloader saiu */
  introAt: -1,
  /** ponteiro normalizado −1..1 */
  mx: 0,
  my: 0,
};

type Listener = () => void;
const ready: { done: boolean; listeners: Listener[] } = { done: false, listeners: [] };

/** o preloader chama quando a cortina abre; o hero escuta para começar */
export function markReady() {
  if (ready.done) return;
  ready.done = true;
  signals.introAt = performance.now();
  ready.listeners.splice(0).forEach((fn) => fn());
}

/** devolve a função que cancela a inscrição (StrictMode monta efeitos duas vezes) */
export function onReady(fn: Listener) {
  if (ready.done) {
    fn();
    return () => {};
  }
  ready.listeners.push(fn);
  return () => {
    const i = ready.listeners.indexOf(fn);
    if (i >= 0) ready.listeners.splice(i, 1);
  };
}
