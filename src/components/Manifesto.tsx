import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { brand, manifesto } from '../content';
import { REDUCED } from '../lib/env';
import { useReveal } from '../lib/reveal';

/** as ferramentas do balcão em traço único: coqueteleira, dosador e colher bailarina */
function Tools() {
  return (
    <svg className="tools" viewBox="0 0 420 520" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* coqueteleira */}
      <path data-draw d="M70 150h96l-10 330a14 14 0 0 1-14 13H94a14 14 0 0 1-14-13z" />
      <path data-draw d="M74 150c0-16 12-24 22-30h44c10 6 22 14 22 30" />
      <path data-draw d="M100 120V96c0-8 6-12 12-12h12c6 0 12 4 12 12v24" />
      <path data-draw d="M108 84V64c0-6 4-9 10-9s10 3 10 9v20" />
      <path data-draw d="M84 300h88" opacity="0.5" />
      {/* dosador (jigger) */}
      <path data-draw d="M220 240h70l-26 70h-18z" />
      <path data-draw d="M246 310h18l26 70h-70z" />
      <path data-draw d="M230 262h50" opacity="0.5" />
      {/* colher bailarina, com a haste torcida */}
      <path data-draw d="M350 60c-8 0-14 8-14 18s6 22 14 22 14-12 14-22-6-18-14-18z" />
      <path data-draw d="M350 100v360" />
      <path data-draw d="M343 120c9 6 9 12 0 18s-9 12 0 18 9 12 0 18-9 12 0 18 9 12 0 18-9 12 0 18 9 12 0 18-9 12 0 18" opacity="0.6" />
      <path data-draw d="M350 460c-10 0-16 6-16 14s6 12 16 12 16-4 16-12-6-14-16-14z" />
      {/* o balcão */}
      <path data-draw d="M20 494h390" opacity="0.4" />
    </svg>
  );
}

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      // o traço se desenha ao rolar, como caneta sobre o papel do cardápio
      q<SVGPathElement>('[data-draw]').forEach((el, i) => {
        const len = el.getTotalLength();
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(el, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.casa__tools', start: `top ${88 - i * 2}%`, end: 'bottom 60%', scrub: REDUCED ? false : 1 },
        });
      });

      // os números contam até o valor quando aparecem
      q<HTMLElement>('[data-count]').forEach((el) => {
        const v = { n: 0 };
        const to = Number(el.dataset.count);
        gsap.to(v, {
          n: to,
          duration: REDUCED ? 0 : 1.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => void (el.textContent = Math.round(v.n).toLocaleString('pt-BR')),
        });
      });
    },
    { scope: root },
  );

  return (
    <section className="casa" id="o-bar" ref={root}>
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">I</span> {manifesto.label}
        </p>
        <p className="eyebrow">{brand.region}</p>
      </div>

      <h2 className="display casa__title" data-split>
        {manifesto.title[0]}
        <br />
        <em>{manifesto.title[1]}</em> {manifesto.title[2]}
      </h2>

      <div className="casa__grid">
        <div className="casa__tools">
          <Tools />
        </div>

        <div className="casa__copy">
          <p className="casa__body" data-words>
            {manifesto.body}
          </p>
          <ul className="casa__pillars">
            {manifesto.pillars.map((p, i) => (
              <li key={p.k} data-rise={i * 0.08}>
                <small>{String(i + 1).padStart(2, '0')}</small>
                <span>{p.k}</span>
                <em>{p.v}</em>
              </li>
            ))}
          </ul>
          <dl className="casa__facts">
            {manifesto.facts.map((f) => (
              <div key={f.l} data-rise>
                <dt>
                  <span data-count={f.n}>0</span>
                  {f.suffix}
                </dt>
                <dd>{f.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
