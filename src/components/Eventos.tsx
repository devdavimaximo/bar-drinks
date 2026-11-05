import { useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { brand, eventos } from '../content';
import { useReveal } from '../lib/reveal';
import { sendOrder } from '../lib/order';

/** índice de formatos: cada linha abre e mostra o que vai no bar daquele evento */
export default function Eventos() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);
  useReveal(root);

  const toggle = (i: number) => {
    setOpen((o) => (o === i ? -1 : i));
    // a altura da página muda: os gatilhos de baixo precisam saber
    window.setTimeout(() => ScrollTrigger.refresh(), 700);
  };

  return (
    <section className="eventos" id="eventos" ref={root}>
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">III</span> {eventos.label}
        </p>
        <p className="eyebrow">Formatos</p>
      </div>

      <h2 className="display eventos__title" data-split>
        {eventos.title[0]}
        <br />
        <em>{eventos.title[1]}</em>
      </h2>

      <ol className="ev">
        {eventos.items.map((e, i) => (
          <li key={e.id} className={`ev__row ${open === i ? 'is-open' : ''}`} data-rise={i * 0.06}>
            <button className="ev__head" aria-expanded={open === i} aria-controls={`ev-${e.id}`} onClick={() => toggle(i)} data-cursor={open === i ? 'fechar' : 'abrir'}>
              <small>{String(i + 1).padStart(2, '0')}</small>
              <span className="ev__name">{e.name}</span>
              <em className="ev__line">{e.line}</em>
              <i aria-hidden="true" />
            </button>
            <div className="ev__body" id={`ev-${e.id}`} role="region">
              <div>
                <div className="ev__inner">
                  <p className="ev__text">{e.text}</p>
                  <ul className="ev__meta">
                    {e.meta.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <ul className="ev__tags">
                    {e.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <button className="btn btn--solid" onClick={() => sendOrder(`Olá, ${brand.name}! Quero um orçamento de bar de drinks para ${e.name.toLowerCase()}.`)} data-cursor="pedir">
                    Orçar {e.name.toLowerCase()}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
