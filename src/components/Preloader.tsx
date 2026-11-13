import { useEffect } from 'react';
import { REDUCED } from '../lib/env';
import { markReady } from '../lib/scroller';

/** primeiro quadro do drink desenhado (shader compilado) */
const glReady = () =>
  new Promise<void>((resolve) => {
    if (window.__glReady) return resolve();
    window.addEventListener('drink:ready', () => resolve(), { once: true });
  });

/**
 * A bolacha do bar já está na tela desde o primeiro quadro: o HTML e a animação
 * de entrada vivem no index.html (plugin `preloader` em vite.config.ts). Aqui só
 * se espera o drink compilar e se dispara a saída (.is-out, em CSS): o anel fecha,
 * a taça termina de encher, a cortina abre e o hero começa (markReady).
 */
export default function Preloader() {
  useEffect(() => {
    const el = document.getElementById('preloader');
    if (!el) {
      markReady();
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    // o tempo mínimo conta desde o carregamento da página, não desde o React montar
    const elapsed = performance.now();
    const minTime = new Promise((r) => setTimeout(r, Math.max(0, (REDUCED ? 300 : 1200) - elapsed)));
    // teto duro: nunca espera mais que 3,5s, mesmo que o import/shader demore
    const maxTime = new Promise((r) => setTimeout(r, Math.max(0, 3500 - elapsed)));
    const assets = Promise.race([Promise.all([document.fonts?.ready, import('../gl/Drink').then(() => glReady()), minTime]), maxTime]);

    assets
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        el.classList.add('is-out');
        // a cortina começa a subir em 1,3s (ver index.html): o hero entra junto
        later(markReady, REDUCED ? 30 : 1300);
        later(() => el.remove(), REDUCED ? 100 : 2700);
      });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
