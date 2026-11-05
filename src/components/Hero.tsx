import { lazy, Suspense, useRef, useState } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { brand, build, drinkCount, hero, signature } from '../content';
import { LITE, REDUCED } from '../lib/env';
import { onReady, scrollToId, signals } from '../lib/scroller';

// three.js fica fora do bundle inicial: o preloader aparece na hora e espera este chunk
const Drink = lazy(() => import('../gl/Drink'));

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
/** o nome em duas linhas, uma de cada lado da taça */
const WORDS = [brand.name.split(' ')[0], brand.name.split(' ').slice(1).join(' ')];
const stepAt = (p: number) => build.steps.reduce((i, s, k) => (p >= s.at ? k : i), 0);

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const mlEl = useRef<HTMLSpanElement>(null);
  const tempEl = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);
  const shown = useRef({ ml: 0, temp: 22 });

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);

      // entrada: as letras sobem junto com a luz do bar
      const splits = q<HTMLElement>('.hero__word').map((el) => SplitText.create(el, { type: 'chars', charsClass: 'ch', mask: 'chars' }));
      const chars = splits.flatMap((s) => s.chars);
      gsap.set(chars, { yPercent: 110 });
      gsap.set(q('[data-intro]'), { autoAlpha: 0, y: 18 });
      const off = onReady(() => {
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .to(chars, { yPercent: 0, duration: REDUCED ? 0.01 : 1.7, stagger: 0.06 }, 0.35)
          .to(q('[data-intro]'), { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 1.0);
      });

      // a ficha conta mililitros e graus em vez de pular de um número para o outro
      let last = -1;
      const counters = (i: number) => {
        const s = build.steps[i];
        gsap.to(shown.current, {
          ml: s.ml,
          temp: s.temp,
          duration: REDUCED ? 0 : 0.9,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: () => {
            if (mlEl.current) mlEl.current.textContent = String(Math.round(shown.current.ml));
            if (tempEl.current) tempEl.current.textContent = String(Math.round(shown.current.temp));
          },
        });
      };

      // a montagem: pino de ~5 telas; o progresso alimenta o shader e esta linha do tempo
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * (LITE ? 4.4 : 5.2)}`,
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            signals.build = p;
            const i = stepAt(p);
            if (i !== last) {
              // antes do gelo a taça está em temperatura ambiente: a ficha começa em 22 °C
              if (last === -1 && p < 0.02) shown.current.temp = 22;
              last = i;
              setStep(i);
              counters(i);
            }
            if (bar.current) bar.current.style.transform = `scaleX(${p})`;
          },
        },
      });

      tl.to(q('.hero__word--a'), { xPercent: -16, autoAlpha: 0, duration: 0.06 }, 0.01)
        .to(q('.hero__word--b'), { xPercent: 16, autoAlpha: 0, duration: 0.06 }, 0.01)
        .to(q('.hero__meta, .hero__aside'), { autoAlpha: 0, y: -30, duration: 0.05 }, 0.01)
        .fromTo(q('.ficha, .hero__chapter'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.04)
        .to(q('.ficha'), { autoAlpha: 0, y: -30, duration: 0.04 }, 0.86)
        .fromTo(q('.hero__card'), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.88)
        .fromTo(q('.hero__outro'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.93)
        .to({}, { duration: 0.03 }, 0.97);

      return off;
    },
    { scope: root },
  );

  const s = build.steps[step];

  return (
    <section className="hero" id="topo" ref={root} data-tone="dark" aria-label={`${brand.name}, ${brand.descriptor.toLowerCase()}`}>
      <Suspense fallback={<div className="hero__gl" />}>
        <Drink mode={{ kind: 'hero' }} className="hero__gl" />
      </Suspense>

      <h1 className="hero__title" aria-label={`${brand.name}, ${brand.descriptor}`}>
        <span className="hero__word hero__word--a" aria-hidden="true">
          {WORDS[0]}
        </span>
        <span className="hero__word hero__word--b" aria-hidden="true">
          {WORDS[1]}
        </span>
      </h1>

      {/* o drink é 3D: o aviso fica o tempo todo e leva até as fotos de verdade */}
      <button className="hero__note" data-intro data-cursor="ver fotos" onClick={() => scrollToId('galeria', 3)}>
        <span className="hero__note-dot" aria-hidden="true" />
        <span>{hero.note}</span>
        <span className="hero__note-sep" aria-hidden="true">
          ·
        </span>
        <u>{hero.noteCta}</u>
        <i aria-hidden="true">↓</i>
      </button>

      <div className="hero__meta">
        <p className="eyebrow" data-intro>
          {hero.kicker}
        </p>
        <p className="hero__lede" data-intro>
          {hero.lede}
        </p>
      </div>

      <div className="hero__aside">
        <p className="eyebrow" data-intro>
          {brand.region}
        </p>
        <button className="hero__go" data-intro data-cursor="servir" onClick={() => scrollToId('o-bar', 7)}>
          <span>{hero.hint}</span>
          <i aria-hidden="true" />
        </button>
      </div>

      {/* a ficha técnica do drink, preenchida enquanto ele é montado */}
      <aside className="ficha" aria-label={`Receita: ${signature.name}`} aria-live="polite">
        <p className="ficha__head">
          <span className="eyebrow eyebrow--gold">Ficha · {signature.name}</span>
        </p>
        <div className="ficha__step" key={step}>
          <p className="ficha__roman">{ROMAN[step]}</p>
          <div>
            <h2 className="ficha__name">{s.name}</h2>
            <p className="ficha__line">
              <em>{s.line}</em>
            </p>
            <p className="ficha__text">{s.text}</p>
          </div>
        </div>
        <ol className="ficha__list">
          {build.steps.map((it, i) => (
            <li key={it.item} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
              <i aria-hidden="true" />
              {it.item}
            </li>
          ))}
        </ol>
        <dl className="ficha__read">
          <div>
            <dt>No copo</dt>
            <dd>
              <span ref={mlEl}>0</span> ml
            </dd>
          </div>
          <div>
            <dt>Temperatura</dt>
            <dd>
              <span ref={tempEl}>22</span> °C
            </dd>
          </div>
        </dl>
      </aside>

      <article className="hero__card" aria-label={signature.name}>
        <p className="eyebrow eyebrow--gold">{build.tag}</p>
        <h2 className="hero__name">{signature.name}</h2>
        <p className="hero__text">{signature.notes}</p>
        <p className="hero__price">{build.priceNote}</p>
      </article>

      <p className="hero__outro">
        <em>E mais</em> {drinkCount - 1} drinks na carta.
      </p>

      <div className="hero__chapter" aria-hidden="true">
        <span className="hero__roman">{ROMAN[step]}</span>
        <span className="hero__chapter-name">{s.name}</span>
        <span className="hero__bar">
          <span ref={bar} />
        </span>
      </div>
    </section>
  );
}
