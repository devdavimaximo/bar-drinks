import { useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { faq } from '../content';
import { useReveal } from '../lib/reveal';

export default function Faq() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(0);
  useReveal(root);

  const toggle = (i: number) => {
    setOpen((o) => (o === i ? null : i));
    // a altura da página muda: os gatilhos de baixo precisam saber
    window.setTimeout(() => ScrollTrigger.refresh(), 650);
  };

  return (
    <section className="faq" id="perguntas" ref={root}>
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">VI</span> Perguntas
        </p>
        <p className="eyebrow">Antes de reservar</p>
      </div>

      <div className="faq__grid">
        <h2 className="display faq__title" data-split>
          Perguntas
          <br />
          <em>frequentes</em>
        </h2>
        <ul className="faq__list">
          {faq.map((f, i) => (
            <li key={f.q} className={`qa ${open === i ? 'is-open' : ''}`} data-rise={i * 0.05}>
              <h3>
                <button className="qa__q" aria-expanded={open === i} aria-controls={`qa-${i}`} id={`qa-q-${i}`} onClick={() => toggle(i)}>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  <span>{f.q}</span>
                  <i aria-hidden="true" />
                </button>
              </h3>
              <div className="qa__a" id={`qa-${i}`} role="region" aria-labelledby={`qa-q-${i}`}>
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
