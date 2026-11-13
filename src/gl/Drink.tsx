import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Look } from '../content';
import { LITE, REDUCED, damp, easeInOut } from '../lib/env';
import { onReady, signals } from '../lib/scroller';
import { DrinkRenderer } from './renderer';
import { buildState, camAt, cardCam, introRise, spinAt } from './build';
import { mixState, pushState, stateFromLook, type DrinkState } from './state';

/**
 * Desenho sob demanda: o canvas só redesenha quando algo muda (scroll, mouse,
 * entrada, troca de drink). Parado, a taça gira devagar a 30 fps, no celular e
 * no desktop: raymarching em tela cheia a 60 fps sem ninguém mexer só esquenta
 * o notebook e rouba quadros do scroll.
 *
 * Resolução: um teto de pixels por tela (o custo do raymarching é por pixel) e
 * uma qualidade adaptativa que cai em degraus quando os quadros seguidos passam
 * de ~22 ms e volta devagar quando sobra folga.
 */

type Mode = { kind: 'hero' } | { kind: 'card'; look: Look };

const MAX_DPR = LITE ? 1.25 : 1.5;
/** pixels de buffer por canvas: ~0,55 MP no celular, ~1,3 MP no desktop */
const BUDGET = LITE ? 0.55e6 : 1.3e6;
const Q_MIN = LITE ? 0.6 : 0.55;
const IDLE_MS = 1000 / 30 - 4;

declare global {
  interface Window {
    __glReady?: boolean;
  }
}

const announceReady = () => {
  if (window.__glReady) return;
  window.__glReady = true;
  window.dispatchEvent(new Event('drink:ready'));
};

/** tira uma foto do drink na tela (JPEG em data URL), com pelo menos `minWidth` px de largura */
export type Snapshot = (minWidth: number) => string | null;

export default function Drink({ mode, className, snap }: { mode: Mode; className?: string; snap?: MutableRefObject<Snapshot | null> }) {
  const host = useRef<HTMLDivElement>(null);
  const kind = mode.kind;
  const look = mode.kind === 'card' ? mode.look : null;
  /** a carta troca o drink sem recriar o contexto WebGL */
  const lookRef = useRef<{ look: Look | null; changed: boolean }>({ look, changed: true });
  if (lookRef.current.look !== look) lookRef.current = { look, changed: true };
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => wakeRef.current(), [look]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const hero = kind === 'hero';

    let r: DrinkRenderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let near = hero;
    let visible = hero;
    let raf = 0;
    let timer = 0;
    let last = -1;
    let chained = false;
    let frames = 0;
    let quality = 1;
    const perf = { t: 0, n: 0, good: 0 };
    const s = { build: 0, mx: 0, my: 0, t: 0, swap: 1, late: false, from: null as DrinkState | null, to: null as DrinkState | null };

    const resize = () => {
      if (!r) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(BUDGET / (w * h)));
      r.setSize(w * dpr * quality, h * dpr * quality);
    };

    // uma pausa (aba escondida, timer de 30 fps) não conta como quadro lento
    const measure = (dtMs: number) => {
      if (!chained) return;
      perf.t += dtMs;
      if (++perf.n < 30) return;
      const avg = perf.t / perf.n;
      perf.t = perf.n = 0;
      if (avg > 1000 / 45 && quality > Q_MIN) {
        quality = Math.max(Q_MIN, quality - 0.1);
        perf.good = 0;
        resize();
      } else if (avg < 1000 / 57 && quality < 1 && ++perf.good >= 3) {
        quality = Math.min(1, quality + 0.05);
        perf.good = 0;
        resize();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!r?.usable) return;
      const dtMs = last < 0 ? 16 : now - last;
      last = now;
      measure(dtMs);
      const dt = Math.min(dtMs / 1000, 1 / 20);
      if (!REDUCED) s.t += dt;
      s.mx = damp(s.mx, signals.mx, 2.4, dt);
      s.my = damp(s.my, signals.my, 2.4, dt);
      const u = r.u;
      const aspect = el.clientWidth / Math.max(el.clientHeight, 1);

      let moving = Math.abs(signals.mx - s.mx) > 1e-3 || Math.abs(signals.my - s.my) > 1e-3;
      if (hero) {
        s.build = damp(s.build, signals.build, REDUCED ? 30 : 6, dt);
        const since = signals.introAt < 0 ? 0 : (performance.now() - signals.introAt) / 1000;
        // primeiro quadro depois da cortina abrir (shader lento): entra já com a luz acesa,
        // por cima da foto do hero, em vez de apagar e acender de novo
        if (frames === 0 && signals.introAt >= 0) s.late = true;
        const rise = REDUCED || s.late ? (signals.introAt < 0 ? 0 : 1) : introRise(since);
        pushState(u, buildState(s.build));
        const cam = camAt(s.build, aspect, s.mx, s.my, rise);
        u.uRo.set(cam.ro);
        u.uTa.set(cam.ta);
        u.uFocal = cam.focal;
        u.uSpin = spinAt(s.build, s.t, s.mx);
        u.uExpo = rise;
        u.uVig = 0.34;
        moving ||= Math.abs(signals.build - s.build) > 1e-4 || rise < 1;
      } else {
        const lr = lookRef.current;
        if (lr.changed && lr.look) {
          // um drink novo começa a transição a partir do que está na tela agora
          lr.changed = false;
          const next = stateFromLook(lr.look);
          s.from = s.to && s.from ? mixState(s.from, s.to, easeInOut(Math.min(s.swap, 1))) : next;
          s.to = next;
          s.swap = REDUCED ? 1 : 0;
        }
        if (s.from && s.to) {
          s.swap = Math.min(s.swap + dt / 1.1, 1);
          pushState(u, mixState(s.from, s.to, easeInOut(s.swap)));
          // no meio da troca a bebida balança
          u.uWave = Math.sin(s.swap * Math.PI) * 0.8;
          const cam = cardCam(aspect);
          u.uRo.set([cam.ro[0] + s.mx * 0.25, cam.ro[1] - s.my * 0.12, cam.ro[2]]);
          u.uTa.set(cam.ta);
          u.uFocal = cam.focal;
          u.uSpin = s.t * 0.3 + s.mx * 0.4;
          u.uExpo = 1;
          u.uVig = 0.5;
          moving ||= s.swap < 1;
        }
      }
      u.uTime = s.t;
      r.draw();
      // o canvas nasce invisível e aparece no primeiro quadro: nada de preto antes do shader
      if (frames === 0 && canvas) canvas.style.opacity = '1';

      // o segundo quadro já saiu da GPU: avisa o preloader
      if (++frames === 2 && hero) announceReady();

      const started = !hero || signals.introAt >= 0;
      const busy = frames < 3 || moving;
      chained = busy;
      if (busy) raf = requestAnimationFrame(frame);
      else if (started && !REDUCED) timer = window.setTimeout(wake, IDLE_MS);
    };

    function wake() {
      timer = 0;
      if (!visible || raf || document.hidden || !r?.usable) return;
      if (!chained) last = -1;
      raf = requestAnimationFrame(frame);
    }
    wakeRef.current = () => {
      // mudança de fora (troca de drink) entra no próximo quadro, sem esperar o timer
      if (timer) window.clearTimeout(timer);
      timer = 0;
      wake();
    };

    const start = () => {
      if (r) return;
      canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;width:100%;height:100%;opacity:0;transition:opacity .7s ease';
      el.appendChild(canvas);
      r = new DrinkRenderer(canvas, LITE);
      resize();
      r.restored(() => {
        frames = 0;
        wake();
      });
      r.ready.then(() => {
        if (r?.failed && hero) announceReady();
        wake();
      });
    };

    // foto para o cartão compartilhável: redesenha maior, lê na mesma tarefa
    // (sem preserveDrawingBuffer o buffer só vale até o navegador compor a tela)
    if (snap)
      snap.current = (minWidth) => {
        if (!r?.usable || !canvas) return null;
        const w = canvas.width;
        const h = canvas.height;
        const k = Math.max(1, minWidth / w);
        r.setSize(w * k, h * k);
        r.draw();
        const url = canvas.toDataURL('image/jpeg', 0.92);
        r.setSize(w, h);
        r.draw();
        return url;
      };

    const ro = new ResizeObserver(() => {
      resize();
      wakeRef.current();
    });
    ro.observe(el);

    // perto da tela: compila; na tela: desenha
    const ioNear = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) start();
      },
      { rootMargin: '100% 0px' },
    );
    const ioDraw = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) wakeRef.current();
        else {
          cancelAnimationFrame(raf);
          window.clearTimeout(timer);
          raf = timer = 0;
          chained = false;
        }
      },
      { rootMargin: '10% 0px' },
    );
    ioNear.observe(el);
    ioDraw.observe(el);
    if (hero) start();

    const poke = () => wakeRef.current();
    window.addEventListener('scroll', poke, { passive: true });
    window.addEventListener('pointermove', poke, { passive: true });
    document.addEventListener('visibilitychange', poke);
    const off = onReady(poke);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      ro.disconnect();
      ioNear.disconnect();
      ioDraw.disconnect();
      window.removeEventListener('scroll', poke);
      window.removeEventListener('pointermove', poke);
      document.removeEventListener('visibilitychange', poke);
      off();
      r?.dispose();
      canvas?.remove();
      r = null;
      wakeRef.current = () => {};
      if (snap) snap.current = null;
    };
  }, [kind]);

  return <div className={className} ref={host} aria-hidden="true" />;
}
