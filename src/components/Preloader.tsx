import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { REDUCED } from '../lib/env';
import { markReady } from '../lib/scroller';
import { brand } from '../content';
import Monogram from './Monogram';

const WORD = brand.name.toUpperCase();

/** primeiro quadro do drink desenhado (shader compilado) */
const glReady = () =>
  new Promise<void>((resolve) => {
    if ((window as unknown as { __glReady?: boolean }).__glReady) return resolve();
    window.addEventListener('drink:ready', () => resolve(), { once: true });
  });

/**
 * A bolacha do bar: o círculo se desenha enquanto o shader compila, a taça
 * enche de rosa e a cortina do balcão se abre de baixo para cima.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const q = gsap.utils.selector(root);
    const ring = q<SVGCircleElement>('.mono__ring')[0];
    const len = ring ? 2 * Math.PI * 30 : 0;
    if (ring) gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });

    const intro = gsap.timeline();
    intro
      .to(ring, { strokeDashoffset: len * 0.15, duration: REDUCED ? 0.01 : 2.2, ease: 'power2.inOut' }, 0.15)
      .fromTo(q('.preloader__fill'), { scaleY: 0 }, { scaleY: 0.85, duration: REDUCED ? 0.01 : 2.2, ease: 'power2.inOut' }, 0.3)
      .fromTo(q('.preloader__char'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.9, ease: 'expo.out' }, 0.5)
      .fromTo(q('.preloader__sub'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.1);

    const minTime = new Promise((r) => setTimeout(r, REDUCED ? 300 : 2400));
    const maxTime = new Promise((r) => setTimeout(r, 9000));
    const assets = Promise.all([document.fonts?.ready, import('../gl/Drink').then(() => Promise.race([glReady(), maxTime])), minTime]);

    assets
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        const tl = gsap.timeline({ onComplete: () => setGone(true) });
        tl.to(ring, { strokeDashoffset: 0, duration: REDUCED ? 0.01 : 0.6, ease: 'power2.out' })
          .to(q('.preloader__fill'), { scaleY: 1, duration: 0.5, ease: 'power2.out' }, '<')
          .to(q('.preloader__mark, .preloader__word, .preloader__sub'), { autoAlpha: 0, y: -14, duration: 0.55, ease: 'power3.in', stagger: 0.05 }, '+=0.15')
          .add(markReady, '-=0.1')
          .to(q('.preloader__curtain'), { yPercent: -101, duration: REDUCED ? 0.01 : 1.3, ease: 'expo.inOut' }, '<');
      });

    return () => {
      cancelled = true;
      intro.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div className="preloader" ref={root} role="status" aria-label={`Carregando ${brand.name}`}>
      <div className="preloader__curtain" />
      <div className="preloader__center">
        <div className="preloader__mark">
          <span className="preloader__fill" aria-hidden="true" />
          <Monogram className="preloader__mono" />
        </div>
        <p className="preloader__word" aria-hidden="true">
          {WORD.split('').map((c, i) => (
            <span key={i} className="preloader__char">
              {c === ' ' ? ' ' : c}
            </span>
          ))}
        </p>
        <p className="preloader__sub">{brand.descriptor}</p>
      </div>
    </div>
  );
}
